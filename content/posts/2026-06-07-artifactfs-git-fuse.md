---
title: "ArtifactFS：大仓库不用等 clone 完再开工"
subtitle: "Cloudflare 用 Go + FUSE 做了一个按需加载 Git 仓库的文件系统"
date: 2026-06-07
url: "/2026/06/07/artifactfs-git-fuse.html"
categories: ["技术"]
tags: ["Go", "Git", "FUSE", "AI", "Agent", "Cloudflare"]
weight: 0
---

最近看到 Cloudflare 开源了一个挺有意思的项目：ArtifactFS。

它解决的问题很直接：大仓库太慢了。

比如 Chrome 源码几十 GB，Linux 内核也有好几个 GB。正常 `git clone` 的时候，不管你一开始到底只想看一个 README，还是只想查一个配置文件，Git 都要把 commits、trees、blobs 一起拉下来。人等十几分钟还可以去倒杯水，但是 AI Agent、CI/CD 容器、预览环境就比较惨了，它们启动后应该马上干活，而不是先坐在那里等 clone。

ArtifactFS 的思路是：仓库结构先给你，文件内容用到再下载。

## 它到底做了什么

ArtifactFS 是 Cloudflare 用 Go 写的一个 FUSE 文件系统。

简单理解就是，它把远程 Git 仓库挂载成本地目录。你在系统里看到的是一个普通目录，可以 `ls`、`cat`，也可以跑一些 Git 命令。但它背后不是传统的完整 clone，而是先做一个 blobless clone，再通过 FUSE 按需加载文件内容。

传统流程大概是：

```text
git clone -> 下载 commits + trees + blobs -> 仓库可用
```

ArtifactFS 的流程更像这样：

```text
git clone --filter=blob:none -> 先拿 commits + trees -> 目录马上可见 -> 读文件时再下载 blob
```

这里的关键是：

```bash
git clone --filter=blob:none
```

这是 Git 的部分克隆能力。它会下载提交历史、目录树和引用信息，但是不下载真正的文件内容，也就是 blob。这样一个很大的仓库，初始下载可能就从几十 GB 变成几百 MB，甚至更小。

ArtifactFS 再在这个基础上加了一层文件系统。你访问某个文件时，FUSE 拦截读取请求，然后去远程 Git 服务器把对应的 blob 拉下来，缓存到本地，再返回给操作系统。

对使用者来说，它像一个正常目录。

对底层来说，它是“先挂载，后补内容”。

## 快速试一下

macOS 需要 macFUSE，Linux 需要 fuse3。

```bash
# macOS
brew install --cask macfuse

# Ubuntu / Debian
apt install fuse3

# 安装 ArtifactFS
go install github.com/cloudflare/artifact-fs/cmd/artifact-fs@latest
```

挂载一个仓库：

```bash
export ARTIFACT_FS_ROOT=/tmp/artifact-fs-test

artifact-fs add-repo \
  --name workers-sdk \
  --remote https://github.com/cloudflare/workers-sdk.git \
  --branch main \
  --mount-root /tmp

artifact-fs daemon --root /tmp &
DAEMON_PID=$!
```

然后就可以像普通目录一样用了：

```bash
ls /tmp/workers-sdk/
cat /tmp/workers-sdk/README.md
git -C /tmp/workers-sdk log --oneline -5
```

清理的时候：

```bash
kill $DAEMON_PID
```

这个体验比较有意思。它不是让下载变魔法消失，而是把“全部下载完才能开始”变成了“先开始，用到哪里再下载哪里”。

## 它的两个阶段

ArtifactFS 大概可以分成两个阶段。

### 第一阶段：准备文件树

`add-repo` 的时候，它会做几件事：

```text
git clone --filter=blob:none
git ls-tree -r -t -z HEAD
git cat-file --batch-check
SQLite bulk insert
```

这一步会拿到完整的目录结构、文件名、大小、权限等元数据，然后写入 SQLite。

注意，这时候文件内容还没下载。

也就是说，系统已经知道“这里有一个 README.md”“那里有一个 src/main.go”，但它还没真正把 README 或 main.go 的内容拉下来。

### 第二阶段：守护进程接管读写

`artifact-fs daemon` 启动后，FUSE 层开始工作。

读文件时，大概是这个流程：

```text
用户读取 README.md
-> FUSE 拦截 read
-> 先检查本地 overlay 有没有修改
-> 再检查 blob cache 有没有缓存
-> 如果没有缓存，就通过 GitStore 拉取 blob
-> 缓存后返回内容
```

写文件时，它不会直接改底层 Git 仓库，而是写到 Overlay 层。

这个设计有点像 Docker 镜像的 copy-on-write：下面是一层只读快照，上面是一层可写层。你看到的是合并后的文件系统视图。

## 为什么 AI Agent 会需要它

这个项目最吸引我的地方，不是“它能省磁盘”，而是它刚好踩中了 AI Agent 的工作方式。

Agent 处理一个仓库时，通常不是一上来就读完整个项目。它可能先看 README、package.json、go.mod、入口文件、几个相关模块，然后再慢慢扩大范围。

如果每次启动沙箱都要完整 clone 一个大仓库，就会浪费很多时间。

传统方式：

```text
启动容器 -> git clone 等几分钟 -> Agent 开始分析
```

ArtifactFS 方式：

```text
启动容器 -> 秒级挂载仓库 -> Agent 立刻读取关键文件 -> 后台继续按需加载
```

这对 Claude Code、Codex、Cursor 这类工具都挺有价值。尤其是临时沙箱、远程预览环境、CI 任务，它们的生命周期本来就短，启动时间越长越亏。

## 它还做了优先级预取

ArtifactFS 不是完全被动地等你读文件。

它有一个 Hydrator，会按优先级预取文件：

- 代码文件优先，比如 `.go`、`.js`、`.py`、`.ts`
- 依赖清单也比较靠前，比如 `package.json`、`go.mod`、`Cargo.toml`
- README、CHANGELOG 这类文档中等优先级
- 图片、视频、压缩包这类大二进制文件优先级最低

这个策略很实用。

因为对 Agent 或 IDE 来说，最早要看的大概率是代码和配置，而不是一堆截图、视频、构建产物。先把最有用的文件拉下来，体验会好很多。

并发也可以调：

```bash
artifact-fs daemon --root /tmp --hydration-concurrency 8
```

并发越高，预取越快，但内存和 Git 进程开销也会更高。

## Go 实现里比较值得看的点

从 Go 项目的角度看，ArtifactFS 也很适合拿来学习系统编程。

### FUSE 文件系统

它使用 `github.com/jacobsa/fuse` 来实现用户态文件系统。

FUSE 的好处是不用写内核模块，就可以拦截 `open`、`read`、`write`、`stat`、`readdir` 这些文件系统操作。这样 Go 程序就能在用户态里决定一个文件到底从哪里来。

### SQLite 不依赖 CGO

它使用的是 `modernc.org/sqlite`，这是纯 Go SQLite 驱动。

这个选择对工具类项目挺友好：

- 跨平台编译更简单
- 容器镜像里不用额外装 C 工具链
- 二进制分发更省心

SQLite 在这里主要存两类数据：

- Snapshot：远程仓库的文件树快照
- Overlay：本地写入层的记录

### Git 进程池

读取 blob 时，它不是每次都启动一个新的 Git 命令，而是维护一组持久的 `git cat-file --batch` 进程。

大概意思是：

```text
发送 object id -> Git 返回对象内容 -> 继续等下一个 object id
```

这样能减少反复创建进程的开销，对大量小文件读取会友好很多。

### 依赖很克制

它直接依赖不多，核心就是：

```text
github.com/jacobsa/fuse
github.com/urfave/cli
modernc.org/sqlite
```

其他很多事情靠 Git 命令和 Go 标准库完成。这种工具我个人会更喜欢一点，依赖少，边界比较清楚。

## 和普通 git clone 的区别

如果只是一个小仓库，ArtifactFS 可能没什么必要。直接 clone 最简单。

但如果是大仓库，区别就出来了：

| 方式 | 初始等待 | 文件内容 | 适合场景 |
| --- | --- | --- | --- |
| `git clone` | 慢 | 全量下载 | 小仓库、长期开发目录 |
| `git clone --filter=blob:none` | 快一些 | Git 按需取 blob | 想用 Git 部分克隆，但不需要文件系统挂载 |
| ArtifactFS | 秒级挂载 | FUSE 按需加载 + 缓存 | Agent 沙箱、CI、预览环境、大仓库浏览 |

它不是替代所有 clone 场景，而是适合“我要马上看到仓库，并且只读一部分内容”的场景。

## 需要注意的地方

这个项目还比较年轻，不能一上来就当生产核心依赖。

几个注意点：

- 需要 FUSE：macOS 要装 macFUSE，Linux 要 fuse3
- 容器里要开权限：通常需要 `--cap-add SYS_ADMIN --device /dev/fuse`
- 首次读某个文件时依赖网络：网络慢的话，第一次打开文件还是会卡
- 暂时主要适合 macOS 和 Linux
- 项目还在 Beta 阶段，关键生产环境要谨慎

如果是个人学习、Agent 沙箱实验、CI 加速探索，我觉得很值得试。

## 最后

ArtifactFS 最有价值的地方，是把 Git 大仓库的等待时间拆开了。

以前是“全部 clone 完，才能开始”。

现在变成“目录先可用，内容用到再拉”。

这个思路对 AI Agent 特别合适，因为 Agent 很多时候只需要先读几个关键文件就能开始判断。对人来说，少等几分钟是体验优化；对自动化系统来说，少等几分钟可能就是成本和效率。

如果你也在折腾 Go、CI/CD、AI Agent 沙箱，或者经常被大仓库 clone 折磨，可以看看这个项目。

项目地址：[github.com/cloudflare/artifact-fs](https://github.com/cloudflare/artifact-fs)

参考来源：[微信公众号文章](https://mp.weixin.qq.com/s/2S84p85rupg3FUqYLYGJEg)
