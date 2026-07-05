# Alice Blog

Alice 的个人静态博客，用来记录技术学习、生活思考和个人创作。

线上地址：[https://alice.vdo.pub/](https://alice.vdo.pub/)

## 项目简介

本项目最初基于 Jekyll 和 `jekyll-theme-H2O` 定制，目前已迁移为 Hugo 站点，并保留了轻量、响应式、标签归档、文章搜索、代码高亮、夜间模式等能力，以及 Alice 自己的站点信息、个人简介、社交链接和视觉动画。

博客当前主要内容为中文，文章主题包含：

- 前端开发与 Node.js 学习笔记
- Jekyll 博客搭建与部署记录
- Web 安全与渗透测试学习笔记
- 区块链、Truffle、DApp 等技术实践
- 个人介绍与生活记录

## 技术栈

- 静态站点生成：Hugo 0.92.1 extended
- Markdown 渲染：Goldmark
- 代码高亮：Prism.js / Hugo highlight 配置
- 样式资源：`static/assets/` 静态资源
- 前端脚本：Vanilla JavaScript
- 兼容脚本：`scripts/hugo-page-compat.js`
- 部署平台：Netlify / GitHub Pages

## 目录结构

```text
.
├── config.yaml              # Hugo 站点配置
├── content/                 # Hugo 内容目录
├── layouts/                 # Hugo 模板和 partials
├── static/                  # Hugo 静态资源，会原样发布
├── scripts/hugo-page-compat.js # 生成旧分页兼容路径
├── public/                  # Hugo 生成目录，不要手动修改
├── netlify.toml             # Netlify 构建配置
└── CLAUDE.md                # Claude Code 项目协作说明
```

注意：`public/` 是 Hugo 生成目录，不要手动修改。

## 本地开发

### 启动本地预览

```bash
hugo server
```

默认访问：`http://127.0.0.1:1313/`

### 构建静态站点

```bash
hugo --gc --minify && node scripts/hugo-page-compat.js
```

构建结果会输出到 `public/`。

## 前端资源

Hugo 当前发布使用 `static/assets/` 下的静态资源，构建时会原样复制到 `public/assets/`。

旧 Jekyll / Gulp 相关源码和生成资源已经删除。样式、脚本、图片、字体等前端资源统一维护在 `static/assets/`。

## 写一篇新文章

文章放在 `content/posts/` 目录，文件名格式为：

```text
YYYY-MM-DD-文章标题.md
```

示例：

```markdown
---
title: '文章标题'
subtitle: '可选副标题'
date: 2026-06-07
categories: ['技术']
tags: ['Hugo', '博客', '前端']
---

这里开始写正文。
```

常用字段：

| 字段 | 说明 |
| --- | --- |
| `title` | 文章标题 |
| `subtitle` | 文章副标题，可选 |
| `date` | 发布时间 |
| `categories` | 分类 |
| `tags` | 标签，多个标签用空格分隔 |
| `cover` | 文章封面图，可选 |

## 站点配置

主要配置集中在 `config.yaml`：

```yaml
baseURL: 'https://alice.vdo.pub/'
languageCode: zh-CN
title: Alice Blog
params:
  description: 很高兴能在这里与你分享我对技术和生活的思考。
```

导航配置：

```yaml
params:
  nav:
    - name: 主页
      url: /
    - name: 分类
      url: /tags.html
    - name: 关于我
      url: /aboutme.html
```

作者信息：

```yaml
params:
  author: Alice
  nickname: 竹
  bio: 热爱技术，简单乐观爱创造
  avatar: /assets/img/alicesmall.jpg
```

## 已启用功能

- 首页文章分页
- 标签归档
- 文章搜索
- 代码高亮
- 夜间模式
- 社交分享
- 社交链接
- 响应式布局
- 自定义头图底纹
- 首页和文章页动画效果

## 部署

### Netlify

`netlify.toml` 中配置了构建命令和发布目录：

```toml
[build]
  command = "hugo --gc --minify && node scripts/hugo-page-compat.js"
  publish = "public"
```

生产环境变量：

```toml
[build.environment]
  HUGO_VERSION = "0.92.1"
  HUGO_ENV = "production"
  NODE_VERSION = "20"
```

### GitHub Pages

`.github/workflows/hugo.yml` 会在 `master` 分支 push 后安装 Hugo 0.92.1 extended 与 Node 20，构建 `public/` 并部署到 GitHub Pages。

## 维护建议

- 修改文章：优先编辑 `content/posts/`。
- 修改页面结构：编辑 `layouts/`。
- 修改静态资源：编辑 `static/assets/`。
- 不要直接编辑 `public/`，它会在下一次构建时被覆盖。
- 提交前建议运行 `hugo --gc --minify && node scripts/hugo-page-compat.js` 确认站点可以正常生成。

## 迁移说明

本博客从 [jekyll-theme-H2O](https://github.com/kaeyleo/jekyll-theme-H2O) 迁移到 Hugo，保留了原站的视觉风格、标签、搜索、分页、夜间模式和社交分享等体验。

## License

当前博客内容版权归作者 Alice 所有。