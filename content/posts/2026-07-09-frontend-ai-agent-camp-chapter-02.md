---
title: "第二章：搭建智能体的工程底座"
subtitle: "2026 前端 AI Agent 工程化实战营系列第 3 篇"
date: 2026-07-09T11:02:00+08:00
categories: ["AI工程", "前端AI-Agent工程化实战营"]
tags: ["前端AI-Agent工程化实战营", "AI Agent", "AI工程", "LangChain", "LangGraph"]
weight: 0
---

> 本文整理自《2026 前端 AI Agent 工程化实战营》课程资料，作为系列文章第 3 篇。

![image.png](/assets/img/frontend-ai-agent-camp/47c16aca3449cfde.jpg)

第一章我们解决了“怎么把模型用起来”：模型调用、Prompt 设计与结构化输出。到了这一章，问题会从“能力本身”转向“能力如何落地为可持续演进的系统”：这些能力应该放在前端还是后端？前后端如何分工与对齐接口？共享的类型、schema、DTO 应该沉淀在哪里？当你后续逐步加入工具调用、RAG、MCP，甚至多智能体编排时，今天的工程结构还能不能顺滑扩展、而不是推倒重来？

本章将用 **Bun workspaces** 搭建一个可扩展的 monorepo，并把工程明确拆成三层：

*   clients/：客户端应用
*   services/：服务进程
*   packages/：共享子包

在这个体系里，**Bun** 负责工作区和依赖管理，**Turbo** 负责任务编排与缓存，**Docker Compose** 负责多服务启动与环境编排，**YAML** 负责应用配置和环境覆盖。Bun 的 workspaces 能管理多组工作区路径；Turbo 能在现有仓库上增量接入，通过 turbo.json 定义任务；Docker Compose 则用一个或多个 YAML 文件来定义和运行多容器应用。

**如果你对前面提到的技术栈还比较陌生，请不要直接跳过这一部分。这里不仅是在介绍工具，更是在建立后续开发所需的基本概念。即使你希望借助 AI 提高开发效率，也仍然需要先知道这些技术分别解决什么问题、放在系统中的哪一层、彼此之间如何配合。至少在当前阶段，纯粹依赖 AI 而不了解工程细节，往往只能完成表面的搭建，很难真正理解问题出在哪里，也很难在项目变复杂之后继续稳定推进。**

**如果你对这些技术已经有一定了解，可以快速阅读后直接跳到 2.9 节，看看如何借助 AI 更快地完成工程初始化与基础搭建。**

## **2.1 为什么从一开始就选 monorepo**

### **跨层接口约定会一起变，多仓库同步成本很高**

后续章节里的类型、schema、DTO、工具参数，以及前端消费的数据结构，往往会同时出现在客户端、服务端和共享层。若拆成多个仓库，一次字段调整往往意味着：

*   需要在多个仓库分别改代码
*   需要分别发版与升级依赖
*   需要处理版本不一致带来的兼容窗口

而在 monorepo 里，这类改动可以在一次提交中完成，接口约定也更容易保持一致。

### **共享代码与共享定义在同一仓库里更“自然”**

只要系统存在共享包（例如 shared、utils、sdk、prompts），多仓库就会引入一条额外链路：发布与安装。它会把“共享”变成一种持续成本，表现为：

*   共享包升级滞后
*   同一份能力在不同仓库重复实现
*   为了兼容旧版本，被迫维护更多分支和适配代码

monorepo 把共享包留在仓库内部，以 workspace 方式直连，减少重复与漂移。

### **系统一旦扩张，多仓库往往需要二次迁移**

现在可能只有 web + api，但一旦增加 worker、agent-runtime、prompt 包、sdk 包等模块，多仓库很容易出现：

*   仓库数量持续膨胀
*   依赖关系越来越像网
*   跨仓库改动变成常态

monorepo 的价值不只是“现在好管理”，更重要的是：**它能承接后续扩展，而不需要在系统变复杂之后再做仓库级迁移**。

选择 monorepo，是为了更低成本地实现三件事：

*   **共享代码更自然**
*   **跨项目改动更原子化**
*   **依赖与接口定义更一致**


![Gemini_Generated_Image_8pptyf8pptyf8ppt.png](/assets/img/frontend-ai-agent-camp/3e5537f61cbd088c.jpg)

当然，monorepo 的代价也客观存在：仓库规则、边界约束与任务编排会变得更重要。这些代价不是 monorepo 的缺点，而是“把复杂度提前显式化”。

## **2.2 为什么选 Bun / Next / Nest / Turbo / Compose（而不是别的组合）**

这里的选择标准很简单：

*   以 **TypeScript + monorepo** 为前提
*   优先保证“能稳定跑起来”，而不是追求最潮的栈
*   给后续的智能体能力扩展留足空间（模型调用、工具调用、RAG、运行时、多服务）

### **Bun：用一套工具解决 runtime + 包管理 + workspaces**

相比 Node + npm/pnpm/yarn 的组合，Bun 的价值在于把“跑 TS/JS、装依赖、管理 workspaces、执行脚本”收敛成一条链路。对个人项目或小团队来说，这意味着：

*   环境与安装链路更短，出问题的环节更少
*   workspaces + catalog/catalogs 更容易把依赖版本收敛
*   isolated installs 更适合在 monorepo 里减少隐性依赖

这不是在说 Bun 一定强过所有包管理器，而是它在“工程底座阶段”更省心。

如果是公司级、追求稳定的项目，使用传统的 pnpm 或 yarn 作为基座会更稳妥，毕竟经过了更充分的验证；如果是个人项目或创新探索，那就按教程走，一起踩坑也未尝不可。

### **Next.js：让客户端交付与工程化保持简单、可靠**

这里需要的是稳定的 Web 客户端交付能力，而不是把服务端能力塞进前端。选 Next 的原因主要有三点：

*   React 生态成熟，页面与路由能力完整
*   在 monorepo 下可直接消费共享包（transpilePackages）
*   从开发到部署链路闭环，适合作为长期可迭代的产品界面
*   相对而言，**shadcn** + **tailwindcss** 更常见于模型训练语料中，快速开发的体感更好。

相比之下，如果选更“轻”的方案，短期可能更快，但一旦进入产品化迭代，会很快补齐同样的工程能力。

### **NestJS：用模块化容器承接服务端的复杂度增长**

智能体系统的复杂度大概率在服务端累积。选 Nest 的核心原因是它非常适合把能力拆成可组合模块，并在长期演进中保持边界：

*   模块化 + 依赖注入，适合承载会持续增长的能力（模型调用、工具、RAG、运行时）
*   Controller / Service 分层清晰，可测试、可维护

相比“轻框架/纯脚本”，Nest 的优势在于：复杂度上来时不需要推倒重来。

### **Turbo：用任务图与缓存，让 monorepo 的运行成本可控**

很多 monorepo 的痛点并不是代码组织，而是任务执行：build、typecheck、test、lint 一多就会拖慢。Turbo 解决的是：

*   任务之间的依赖关系（任务图）
*   增量执行（只跑受影响部分）
*   缓存复用（本地与 CI 都能受益）

相比只写根目录脚本，Turbo 是把“仓库规模增长后的成本曲线”提前压平。

### **Docker Compose：把多个服务当成一个系统来启动与联调**

随着 web、api、以及未来数据库、Redis、worker、agent runtime 增加，真正的难点会变成“能不能稳定地一起跑”。Compose 的价值在于：

*   用一套 YAML 定义多服务的启动、端口、依赖顺序、环境变量
*   多文件覆盖（dev/prod）让环境切换更可控
*   对本地联调与单机交付非常友好

### **一句话总结（技术选择）**

这套组合的目标不是“最强栈”，而是：

*   **用最少的工具，把仓库管理、客户端交付、服务端承载、任务执行、多服务运行这五件事一次性补齐**
*   并且在后续引入智能体能力时，不需要频繁更换底层方案


![Gemini_Generated_Image_qrup6xqrup6xqrup.png](/assets/img/frontend-ai-agent-camp/2148e8cfb2f82dd4.jpg)

## **2.3 总览：2.4–2.8 会搭一个“能跑起来”的最小工程**

从 2.4 到 2.8，我们会从零搭建一个最小示例，并让它跑起来：

*   `packages/contracts`：共享包（类型 / 校验规则 / 常量）
*   `services/api`：Nest API（提供一个 `/health` 与一个 `/hello`）
*   `clients/web`：Next Web（页面渲染 + 调用 API）
*   `infra/compose`：Docker Compose（一次命令启动 web+api）

这条链路的设计意图是：**先把工程骨架和联通方式跑通**。后续无论接不接模型、接什么工具、引入什么运行时，都可以在这个骨架上逐步加能力，而不是一开始就被“选型细节”和“项目模板”困住。

<aside>

✅ **最终验收标准**

*   浏览器打开 `http://localhost:3000`，能看到页面展示的 `APP_NAME`
*   点击按钮后，页面能调用 API 并显示返回的字符串
*   用 Compose 一条命令能同时启动 web 与 api

</aside>

***

## **2.4 根目录与共享包：先把“仓库底座”跑通**

### **2.4.0 安装 Bun（只需一次）**

如果你本机还没装 Bun，先执行下面这条命令完成安装：

    curl -fsSL https://bun.com/install | bash

安装完成后，重新打开一个终端窗口（或按安装脚本提示把 Bun 的路径加入 PATH），然后确认版本：

    bun --version


![image.png](/assets/img/frontend-ai-agent-camp/f01584942677f5b7.jpg)

这一节的目标是：

*   根目录完成 workspaces 配置，让 Bun 能识别并统一安装所有子项目依赖
*   Turbo 任务图可以驱动各工作区，避免根目录脚本越写越乱
*   `packages/contracts` 能被 web 与 api 同时引用，确保“同一份类型/规则/常量”不被重复定义

换句话说：这一节先把“仓库能稳定运转”这件事搞定，后面 2.5/2.6 才能专注在 Web 和 API 本身。

### **2.4.1 建立目录骨架**

这里先把三类目录（clients/services/packages）摆出来，是为了让后续所有新增模块都能自然落位：

*   `clients/` 放界面与交互
*   `services/` 放服务进程与运行时能力
*   `packages/` 放跨层复用的共享包

<!---->

    mkdir llm
    cd llm

    mkdir -p clients services packages/contracts/src infra/compose

<!---->

    llm/
    ├─ clients/
    ├─ services/
    ├─ packages/
    │  └─ contracts/
    │     └─ src/
    ├─ infra/
    │  └─ compose/
    ├─ package.json
    ├─ turbo.json
    ├─ bunfig.toml
    └─ tsconfig.base.json


![image 1.png](/assets/img/frontend-ai-agent-camp/a1eed93e2a05b22f.jpg)

### **2.4.2 根目录 package.json（workspaces + 顶层脚本 + 版本收敛）**

根目录 `package.json` 并不是“又一个 package.json”，而是 monorepo 的控制面板：

*   `workspaces.packages` 决定哪些目录会被当作工作区
*   `scripts` 提供全仓统一入口（你只记根目录命令即可）
*   `catalog/catalogs` 把关键依赖版本收敛到一处，减少版本漂移
*   `packageManager` 让 Turbo 能稳定识别包管理器，并据此解析 lockfile、package graph 与缓存行为

先确认你本机 Bun 版本：

    bun --version

然后把版本号写进 `packageManager` 字段，例如：

    {
      "name": "@repo/root",
      "private": true,
      "packageManager": "bun@1.3.11",
      "workspaces": {
        "packages": ["clients/*", "services/*", "packages/*"],
        "catalog": {
          "typescript": "^5.8.0",
          "zod": "^3.25.0"
        },
        "catalogs": {
          "react": {
            "react": "^19.0.0",
            "react-dom": "^19.0.0"
          }
        }
      },
      "scripts": {
        "dev": "turbo run dev --parallel --filter=@repo/web --filter=@repo/api",
        "dev:web": "turbo run dev --filter=@repo/web",
        "dev:api": "turbo run dev --filter=@repo/api",
        "build": "turbo run build",
        "typecheck": "turbo run typecheck",
        "lint": "turbo run lint",
        "test": "turbo run test"
      },
      "devDependencies": {
        "turbo": "^2.5.0"
      }
    }

<aside>

⚠️ **关键细节：packageManager 是 Turbo 识别包管理器的关键字段**

如果缺少它，Turbo 会进行 package manager check，可能导致 build 失败。更推荐补齐 `packageManager`，而不是在 `turbo.json` 里打开 `dangerouslyDisablePackageManagerCheck`。

</aside>

### **2.4.3 bunfig.toml（isolated installs）**

在根目录新建 **bunfig.toml** 文件。

`isolated installs` 会让每个工作区的依赖边界更清晰，能更早暴露“隐式依赖”和“幽灵依赖”（phantom dependency）的问题，避免仓库变大后才发现安装结果不可复现。

    [install]
    linker = "isolated"

<aside>


⚠️ **关键细节：isolated installs 会更严格**

它会更早暴露缺失依赖或隐式依赖的问题。对新仓库来说，这是优点。

</aside>

### **2.4.4 turbo.json（任务图 + 缓存边界）**

在根目录新建 **turbo.json** 文件。

Turbo 需要用 `tasks/dependsOn/outputs` 把 build、typecheck、test 等任务组织成“任务图”，并且划定缓存边界。这样后续工作区变多时，才能增量执行、复用缓存，而不是每次全量重跑。

    {
      "$schema": "https://turbo.build/schema.json",
      "tasks": {
        "dev": {
          "cache": false,
          "persistent": true
        },
        "build": {
          "dependsOn": ["^build"],
          "outputs": ["dist/**", ".next/**"]
        },
        "typecheck": {
          "dependsOn": ["^build"],
          "outputs": []
        },
        "lint": {
          "outputs": []
        },
        "test": {
          "dependsOn": ["^build"],
          "outputs": []
        }
      }
    }

### **2.4.5 tsconfig.base.json（统一 TS 基线 + contracts 路径别名）**

在根目录新建 **tsconfig.base.json** 文件。

把 TypeScript 的严格模式、模块解析策略、以及共享包的路径别名统一到根目录，避免 web/api/共享包各自为政。后续加新包时，只需要 extends 这份基线即可。

    {
      "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "strict": true,
        "skipLibCheck": true,
        "baseUrl": ".",
        "paths": {
          "@repo/contracts": ["packages/contracts/src/index.ts"],
          "@repo/contracts/*": ["packages/contracts/src/*"]
        }
      }
    }

### **2.4.6 初始化 packages/contracts（本例的“共享包”）**

这里我们先建一个最小共享包，用它验证“跨项目共享”这件事确实能跑通。后面类型、校验规则、DTO 等也会逐步往这里沉淀。

#### 2.4.6.1 在 packages/contracts/ 下新建 **package.json**

这是为了让 Bun workspaces 把这个目录识别为一个可依赖的包，并且给 Turbo 提供 build/typecheck 的任务入口。

    {
      "name": "@repo/contracts",
      "private": true,
      "type": "module",
      "main": "./dist/index.js",
      "types": "./dist/index.d.ts",
      "exports": {
        ".": {
          "types": "./dist/index.d.ts",
          "import": "./dist/index.js"
        }
      },
      "scripts": {
        "build": "bun build ./src/index.ts --outdir ./dist --target node",
        "typecheck": "tsc --noEmit"
      },
      "dependencies": {
        "zod": "catalog:"
      },
      "devDependencies": {
        "typescript": "catalog:"
      }
    }

#### 2.4.6.2 在 packages/contracts/ 下新建 **tsconfig.json**

为什么要单独一份：共享包需要产出 `.d.ts`，让 web/api 在编译期拿到类型信息。把配置放在包内，也方便后续复用同样的模板新建其他共享包。

    {
      "extends": "../../tsconfig.base.json",
      "compilerOptions": {
        "outDir": "./dist",
        "declaration": true,
        "emitDeclarationOnly": false
      },
      "include": ["src/**/*.ts"]
    }

#### 2.4.6.3 在 packages/contracts/src/ 下新建 **index.ts**

为什么先放一个常量：它最容易验证“共享包是否被正确引用”。只要 web 和 api 都能读到同一个 `APP_NAME`，就说明 workspace 依赖、构建链路和路径解析是通的。

    export const APP_NAME = "llm";

### **2.4.7 安装依赖（全仓一次安装）**

    bun install
    bun run build

![image 2.png](/assets/img/frontend-ai-agent-camp/d7b0d4be32a82a48.jpg)

✅ **验收标准**
<aside>
    
* 根目录执行 `bun install` 不报错
* 根目录执行 `bun run build` 时，`@repo/contracts` 能先构建（后面 web/api build 时会用到）

</aside>

*   参考资料
    *   Bun workspaces: <https://bun.com/docs/pm/workspaces>
    *   Bun catalogs: <https://bun.com/docs/pm/catalogs>
    *   Bun isolated installs: <https://bun.com/docs/pm/isolated-installs>
    *   Turbo tasks 配置: <https://turborepo.com/docs/crafting-your-repository/configuring-tasks>

***

## **2.5 客户端：初始化 Next 并使用共享包**

这一节的目标是：

*   初始化 `clients/web`，让 Next 项目在 monorepo 里以 workspace 的方式被管理
*   让 Web 端可以直接引用 `@repo/contracts`，让前后端共享同一份常量/类型定义

为什么要在这一节就接共享包：因为一旦前端能在编译期直接依赖共享定义，后面无论是 API 调用、表单校验、DTO 还是工具参数，都可以持续复用同一份定义，避免前后端各自复制粘贴、越走越分叉。

### **2.5.1 初始化 clients/web**

这里先用 `create-next-app` 把项目骨架生成出来，确保工作区结构与脚手架产物都“落位正确”。

    bun create next-app clients/web --yes


![image 3.png](/assets/img/frontend-ai-agent-camp/b5aa5903e11689c2.jpg)

把 `clients/web/package.json` 调整为（关键点：包名统一、脚本使用 Bun、依赖通过 `workspace:*` 直连共享包）：

```
{
	"name": "@repo/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
		"dev": "bun --bun next dev",
		"build": "bun --bun next build",
		"start": "bun --bun next start",
		"typecheck": "bun --bun tsc --noEmit"
  },
  "dependencies": {
		"@repo/contracts": "workspace:*",
    "next": "16.2.1",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.1",
    "tailwindcss": "^4",
    "typescript": "^5"
  },
  "ignoreScripts": [
    "sharp",
    "unrs-resolver"
  ],
  "trustedDependencies": [
    "sharp",
    "unrs-resolver"
  ]
}

```

### **2.5.2 tsconfig 继承根目录基线**

思路与 2.4 一致：TypeScript 的“基线规则”统一收敛在根目录，具体项目只做最小差异化配置。这样当你后面新增更多 client 包时，不会出现每个项目一套 TS 口径的漂移。

`clients/web/tsconfig.json`：

    {
      "extends": "../../tsconfig.base.json",
      "compilerOptions": {
        "target": "ES2017",
        "lib": [
          "dom",
          "dom.iterable",
          "esnext"
        ],
        "allowJs": true,
        "skipLibCheck": true,
        "strict": true,
        "noEmit": true,
        "esModuleInterop": true,
        "module": "esnext",
        "moduleResolution": "bundler",
        "resolveJsonModule": true,
        "isolatedModules": true,
        "jsx": "react-jsx",
        "incremental": true,
        "plugins": [
          {
            "name": "next"
          }
        ],
        "paths": {
          "@/*": [
            "./src/*"
          ]
        }
      },
      "include": [
        "next-env.d.ts",
        "**/*.ts",
        "**/*.tsx",
        ".next/types/**/*.ts",
        ".next/dev/types/**/*.ts",
        "**/*.mts"
      ],
      "exclude": [
        "node_modules"
      ]
    }

### **2.5.3 next.config.ts（monorepo 必配项）**

在 monorepo 里，Next 需要显式声明“哪些 workspace 包要参与转译”以及“standalone tracing 的根目录”。否则常见的症状是：开发环境能跑，但构建产物缺共享包文件、或类型解析不完整。

`clients/web/next.config.ts`：

    import path from "node:path";
    import type { NextConfig } from "next";
    const nextConfig: NextConfig = {
      transpilePackages: ["@repo/contracts"],
      output: "standalone",
      outputFileTracingRoot: path.join(__dirname, "../../")
    };
    export default nextConfig;

<aside>
    
⚠️ **关键细节：必须设置 outputFileTracingRoot**

否则在 monorepo 下做 standalone 构建时，仓库外层的共享包可能不会被正确纳入 tracing 范围。

</aside>

### **2.5.4 最小页面：显示 APP\_NAME**

用最小页面验证两件事：

*   `@repo/contracts` 的依赖解析是通的（能 import）
*   共享常量在 Web 端能被正确打包并渲染（能展示）

`clients/web/app/page.tsx`：

    import { APP_NAME } from "@repo/contracts";

    export default function Home() {
      return <main>Hello from {APP_NAME}</main>;
    }

启动：

```jsx
bun install // 由于在 package.json 中新增了本地的 @repo/contracts，需要重新安装以更新 workspace 引用
bun run dev:web
```

![image 4.png](/assets/img/frontend-ai-agent-camp/6b994a03f208376f.jpg)

<aside>

✅ **验收标准**

打开 `http://localhost:3000`，页面能显示 `Hello from llm`。

</aside>

*   参考资料
    *   create-next-app: <https://nextjs.org/docs/app/getting-started/installation>
    *   transpilePackages: <https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages>

***

## **2.6 服务端：初始化 Nest 并提供最小 API**

这一节的目标是：

*   初始化 `services/api`，让 Nest 服务以 workspace 的方式进入 monorepo 任务图
*   提供两个最小接口：`GET /health` 与 `GET /hello`
*   在 `/hello` 里引用 `@repo/contracts`，验证“共享包在服务端同样可用”

这里先不接模型，是刻意的：这一章要先把“服务能跑、路由能通、共享包能引用、前端能调到后端”这条最小链路跑通。后面接什么模型、怎么做工具调用、如何引入运行时，都是在这条链路上加能力，而不是一开始就把问题复杂化。

### **2.6.1 初始化 services/api**

先用 Nest CLI 生成项目骨架，保证目录结构、依赖与默认模块都正确创建。

    bunx @nestjs/cli new services/api


![image 5.png](/assets/img/frontend-ai-agent-camp/0d27496d77bff5ce.jpg)

把 `services/api/package.json` 调整为（关键点：包名统一、脚本与运行方式明确、通过 `workspace:*` 引用 `@repo/contracts`）：

```jsx
{
	"name": "@repo/api",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
		"dev": "bun --watch src/main.ts",
		"build": "tsc -p tsconfig.build.json",
		"start": "bun run dist/main.js",
		"typecheck": "tsc --noEmit"
  },
  "dependencies": {
		"@repo/contracts": "workspace:*",
    "@nestjs/common": "^11.0.1",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.2.0",
    "@eslint/js": "^9.18.0",
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^22.10.7",
    "@types/supertest": "^6.0.2",
    "eslint": "^9.18.0",
    "eslint-config-prettier": "^10.0.1",
    "eslint-plugin-prettier": "^5.2.2",
    "globals": "^16.0.0",
    "jest": "^30.0.0",
    "prettier": "^3.4.2",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.2",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.20.0"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}

```

### **2.6.2 注册两个最小路由：health 与 hello**

这两个路由分别承担不同职责：

*   `/health`：为 Compose/健康检查/监控提供一个稳定的探针
*   `/hello`：用于验证“共享包 + API 返回 + 前端消费”的最小闭环

注意：这里的返回值刻意保持简单，目的只是让链路可验证、可定位问题。

`services/api/src/app.controller.ts`：

```
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { APP_NAME } from '@repo/contracts';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get("/health")
  health() {
    return { ok: true };
  }
  @Get("/hello")
  hello() {
    return { message: `Hello from API, shared APP_NAME=${APP_NAME}` };
  }
}

```

### **2.6.3 修改端口到 3001（Nest 默认是 3000）**

为了与 Web 的 `3000` 区分，API 统一监听 `3001`，避免本地开发时端口冲突。

NestJS 默认监听 `3000`，但本例为了和 Web 的 `3000` 区分，API 统一使用 `3001`。

在 `services/api/src/main.ts` 里显式指定端口：

```tsx
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	await app.listen(3001);
	console.log("API listening on http://localhost:3001");
}
bootstrap();
```

启动后用下面两条命令验证：

启动：

```jsx
bun i // 同理：新增了 workspace 依赖后需要安装
bun run dev:api
```


![image 6.png](/assets/img/frontend-ai-agent-camp/93a6e775f2c27bb7.jpg)

<aside>

✅ **验收标准**

*   `curl http://localhost:3001/hello` 返回 `Hello from API...`
*   `curl http://localhost:3001/health` 返回 `{ "ok": true }`

</aside>

*   参考资料
    *   Nest Docs: <https://docs.nestjs.com/>
    *   Nest CLI monorepo: <https://docs.nestjs.com/cli/monorepo>

***

## **2.7 前后端联通：Web 调用 API 并展示结果**

这一节的目标是：

*   在 Web 端通过 `fetch` 请求 `GET /hello`
*   把返回的 `message` 展示在页面中，完成一次“可见的端到端验证”

这一节之所以重要，是因为它把“工程底座”从静态结构变成了可验证的系统：你能看到请求发出、响应回来、页面更新。后面无论引入表单、鉴权、模型调用还是多服务，都建议沿用同样的思路逐层验收。

### **2.7.1 在 Web 页面加一个按钮调用 API**

用按钮触发请求，并把结果渲染出来，这样你可以在浏览器里直接观察链路是否工作（而不是只靠命令行）。

`clients/web/app/page.tsx`：

    "use client";
    import { useState } from "react";
    import { APP_NAME } from "@repo/contracts";
    export default function Home() {
      const [result, setResult] = useState<string>("");
      async function callApi() {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/hello`);
        const data = await res.json();
        setResult(data.message);
      }
      return (
        <main style={{ padding: 24 }}>
          <h1>{APP_NAME}</h1>
          <button onClick={callApi}>调用 API</button>
          <pre style={{ marginTop: 16 }}>{result}</pre>
        </main>
      );
    }

<aside>

⚠️ **关键细节：客户端必须通过 NEXT\_PUBLIC\_* 拿到 API 地址*\*

只有 `NEXT_PUBLIC_` 前缀的环境变量才会在浏览器端可用。

</aside>

### **2.7.2 在 Next 里注入 NEXT\_PUBLIC\_API\_BASE\_URL（最小版）**

先用最小方式把 API 地址注入到浏览器端，让链路跑通。后续在 2.8（Compose + YAML 配置）会把它升级为“由配置文件/环境驱动”。

为了让例子能跑通，这里用 `next.config.ts` 直接注入一个默认值。

`clients/web/next.config.ts`：

    import path from "node:path";
    import type { NextConfig } from "next";
    const nextConfig: NextConfig = {
      transpilePackages: ["@repo/contracts"],
      output: "standalone",
      outputFileTracingRoot: path.join(__dirname, "../../"),
      env: {
        NEXT_PUBLIC_API_BASE_URL: "http://localhost:3001"
      }
    };
    export default nextConfig;

<aside>

⚠️ **关键细节：这里先用最小写法跑通链路**

后面在 2.8（Compose + YAML 配置）会把它升级为“配置文件驱动”的方式。

</aside>

### **2.7.3 处理跨域（两种最小方案：Nest 开 CORS / Next 做代理）**

当 Web 运行在 `http://localhost:3000`、API 运行在 `http://localhost:3001` 时，浏览器会把它视为跨域请求。下面给两种最小方案，任选其一即可：

#### 方案 A：在 NestJS 里开启 CORS（最简单）

在 `services/api/src/main.ts` 中：

```tsx
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// 只放行本地 Web（开发环境）
	app.enableCors({
		origin: "http://localhost:3000",
		credentials: true,
	});

	await app.listen(3001);
}
bootstrap();
```

#### 方案 B：在 Next.js 里做反向代理（避免浏览器跨域）

把浏览器请求打到同域（`/api/*`），再由 Next 转发到后端。

1）在 `clients/web/next.config.ts` 增加 rewrite：

```tsx
import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: ["@repo/contracts"],
	output: "standalone",
	outputFileTracingRoot: path.join(__dirname, "../../"),
	async rewrites() {
		return [
			{ source: "/api/:path*", destination: "http://localhost:3001/:path*" },
		];
	},
};

export default nextConfig;
```

2）把前端请求改成：

```tsx
const res = await fetch("/api/hello");
```

这样浏览器看到的是同域请求（`localhost:3000`），不会触发 CORS。

### **2.7.4 运行整条链路**

把 Web 和 API 一起跑起来，用同一条命令从“仓库入口”启动整个最小系统。

根目录执行：

    bun run dev


![image 7.png](/assets/img/frontend-ai-agent-camp/3069e7ed79b6cf15.jpg)

<aside>

✅ **验收标准**

*   打开 `http://localhost:3000`
*   点击“调用 API”按钮
*   页面显示 API 返回的 message

</aside>

***

## **2.8 用 Docker Compose 把 Web + API 当成一个系统启动**

这一节的目标是：

*   写出 `compose.yaml` + `compose.dev.yaml`
*   一条命令启动 web+api
*   用 `healthcheck + depends_on` 保证启动顺序可控

### **2.8.1 Compose 基础文件**

`infra/compose/compose.yaml`：

    services:
    	api:
    		build:
    			context: ../..
    			dockerfile: Dockerfile.api
    		container_name: repo-api
    		ports:
    			- "3001:3001"
    		healthcheck:
    			test: \["CMD", "wget", "-qO-", "[http://localhost:3001/health](http://localhost:3001/health)"\]
    			interval: 10s
    			timeout: 5s
    			retries: 5
    	web:
    		build:
    			context: ../..
    			dockerfile: Dockerfile.web
    		container_name: repo-web
    		ports:
    			- "3000:3000"
    		depends_on:
    			api:
    				condition: service_healthy

### **2.8.2 开发覆盖文件（挂载源码）**

`infra/compose/compose.dev.yaml`：

    services:
    	api:
    		environment:
    			NODE_ENV: development
    		volumes:
    			- ../../services/api:/app/services/api
    			- ../../packages/contracts:/app/packages/contracts
    	web:
    		environment:
    			NODE_ENV: development
    		volumes:
    			- ../../clients/web:/app/clients/web
    			- ../../packages/contracts:/app/packages/contracts

### **2.8.3 启动命令**

```jsx
docker compose -f infra/compose/compose.yaml -f infra/compose/compose.dev.yaml up --build
```

<aside>

✅ **验收标准**

*   `http://localhost:3000` 正常打开
*   点击按钮后依然能拿到 API 返回

</aside>

*   参考资料
    *   Docker Compose: <https://docs.docker.com/compose/>
    *   Multiple Compose files: <https://docs.docker.com/compose/how-tos/multiple-compose-files/>
    *   Startup order: <https://docs.docker.com/compose/how-tos/startup-order/>

## **2.9 用 Claude CLI 把流程跑一遍**

<aside>

⚠️ **开始前（请你自行完成）**

*   完成 Claude CLI 的安装与基础配置（登录、权限、工作目录等）
*   额外掌握几条常用技巧：
    *   要求模型“按步骤执行”，不要一次性输出一堆结果
    *   每一步都汇报新增/修改了哪些文件
    *   遇到报错先贴完整日志，再让它针对性修复

</aside>

前面 2.4–2.8 我们是手动把工程一步步搭出来的：先把仓库底座跑通，再分别把 Web、API、联通、Compose 跑通。

这样做的价值在于：你已经知道每一步在解决什么问题、文件应该放在哪里、哪些配置是“非做不可”。

接下来 2.9 要做一次递进：

*   2.4–2.8 解决的是“我会手动搭出来”
*   2.9 解决的是“我能把同样的步骤交给代理重复执行，而且结果不跑偏”

这一节的目标是：把前面的要求收敛成一份完整 Prompt，让 Claude CLI 可以直接按要求落地。

如果你不想使用这份 Prompt，或者希望把流程拆成可复用的 plan + tasks，也可以尝试 Superpowers 的 skills（可选）。

<aside>

✅ **最终验收标准**

*   代理生成的工程结构与 2.4–2.8 一致（目录、脚本、端口、Compose）
*   根目录 `bun install`、`bun run dev` 能跑起来
*   浏览器打开 `http://localhost:3000`，点击按钮后能看到 API 返回的 message

</aside>

***

### **2.9.1 角色分工**

为了让结果稳定，你需要把三件事分开：

*   **Claude CLI**：负责在你的本地仓库里改文件、执行命令、修报错
*   **Prompt（本节提供）**：负责把“要搭成什么样”写清楚（结构、约束、验收标准）
*   **Superpowers skills（可选）**：当你希望把流程拆成 plan + tasks 并复用时，它会更顺手

工具不决定质量，说明是否清楚才决定质量。

补充一点：如果你直接使用本节提供的完整 Prompt，那么不需要额外引入 Superpowers；如果你不想维护长 Prompt，或者希望把流程拆成 plan + tasks，再逐步复用，那就很适合尝试 Superpowers skills。

***

### **2.9.2 为什么要写 Prompt**

你当然可以只说“帮我搭一个 monorepo + Next + Nest”，但大概率会出现这些问题：

*   目录结构与命名不稳定（下次再跑就变样）
*   dev/build 脚本入口不统一（根目录无法一键驱动）
*   Next 在 monorepo 下缺关键配置（能 dev，不能 build）
*   Compose、端口、健康检查不一致（联调不稳定）

而 2.4–2.8 已经把“正确的做法”固定下来了。

所以这一节不再重新讲怎么搭，而是把“固定下来的做法”浓缩成可执行说明，让代理按同一套规则复现。

***

### **2.9.3 如何写一个规范且“可控”的 Prompt**

所谓“可控”，不是让模型永远不出错，而是让它在出错时也能被快速纠偏：你能明确知道它应该做什么、不应该做什么，以及每一步的验收点在哪里。

把 Prompt 写得可控，建议遵循下面这套结构（从上到下依次收紧约束）：

1）**角色与工作方式（How to work）**

*   指定它的工作身份：如“你是一个会在本地仓库修改文件并执行命令的工程助手”。
*   强制过程化：要求“严格按步骤执行”“每一步完成后汇报变更与验证结果”“遇到报错先贴完整日志再修”。

2）**目标（What to achieve）**

*   用 1–3 句话写清楚最终要交付的系统形态（例如：monorepo + web + api + compose 可一键启动）。
*   避免泛目标（如“搭个最佳实践工程”），用可验证的目标替代（端口、命令、页面效果）。

3）**约束（What not to do / Constraints）**

*   明确边界：目录结构、命名规范、端口、脚本入口、必须使用/禁止使用的工具链。
*   明确禁止项：不要改动无关文件、不要发散引入额外技术栈、不要把“可以”当作“已经做完”。

4）**分步计划（Steps with checkpoints）**

*   把任务拆成 4–8 步，每一步都包含：
    *   输入/前置条件（需要什么已有文件/目录）
    *   要产生的产物（新增/修改哪些文件）
    *   本步验收方式（能跑的命令、能访问的 URL、能看到的输出）
*   顺序要符合依赖关系：先底座，再子项目，再联通，再编排。

5）**交付格式（Deliverables）**

*   要求它输出“变更清单”：每一步列出新增/修改文件。
*   要求它输出“如何运行”：从根目录开始的命令序列。

6）**失败处理（Failure mode）**

*   约定当出现报错时的行为：保留报错原文、不要跳步、先最小修复再继续。

这一章的经验法则是：Prompt 里最值钱的不是“描述你想要什么”，而是把“边界、顺序、验收”写清楚。只要这三件事稳定，模型就算偶尔偏航，也会被你快速拉回既定轨道。

***

### **2.9.4 递进清单**

为了让代理按顺序做事，你的说明应该按同样节奏组织（从底座到联通）：

1）**仓库底座（对应 2.4）**

*   Bun workspaces + Turbo
*   根目录脚本：`dev / dev:web / dev:api / build / typecheck`
*   `bunfig.toml` 开启 isolated installs
*   `tsconfig.base.json` 统一 TS 基线，并提供 `@repo/contracts` 的 paths

2）**共享包（对应 2.4.6）**

*   `packages/contracts` 提供 `APP_NAME`（最小可验证）

3）**Web（对应 2.5）**

*   `clients/web` 使用 Next
*   必配 `transpilePackages` + `outputFileTracingRoot`
*   页面显示 `APP_NAME`

4）**API（对应 2.6）**

*   `services/api` 使用 Nest
*   提供 `/health`、`/hello`
*   API 监听 `3001`

5）**联通（对应 2.7）**

*   Web 页面点击按钮调用 API
*   处理跨域：Nest 开 CORS 或 Next 反向代理（二选一）

6）**Compose（对应 2.8）**

*   `infra/compose/compose.yaml` + `compose.dev.yaml`
*   healthcheck + depends\_on

把这六步写清楚，代理就会自然按“递进”完成，而不是一上来就把所有东西堆在一起。

***

### **2.9.5 简化 Prompt**

下面这个 Prompt 的目标是：只用最少文字，把 2.4–2.8 的要求复现出来。

优先推荐：直接粘进 Claude CLI 使用（Superpowers 并不是必选项）。

请在当前仓库从零搭建一个 Bun workspaces monorepo，结构与要求如下，并严格按顺序完成（先底座，再 web，再 api，再联通，再 compose）。

要求：

1.  根目录：
    *   目录：clients/ services/ packages/contracts/src infra/compose
    *   package.json：workspaces=clients/*, services/*, packages/\*；scripts 包含 dev/dev:web/dev:api/build/typecheck；packageManager=bun@<你的版本>
    *   bunfig.toml：linker="isolated"
    *   turbo.json：dev 不缓存且 persistent；build dependsOn \["^build"] 且 outputs 包含 dist/ **和 .next/**
    *   tsconfig.base.json：配置 paths，@repo/contracts 指向 packages/contracts/src/index.ts
2.  packages/contracts：
    *   package.json + tsconfig.json + src/index.ts
    *   导出常量 APP\_NAME="llm"
3.  clients/web（Next）：
    *   初始化 Next（app router）
    *   package.json name=@repo/web，依赖引用 "@repo/contracts":"workspace:\*"
    *   next.config.ts 必须设置 transpilePackages=\["@repo/contracts"], output="standalone", outputFileTracingRoot
    *   app/page.tsx 显示 "Hello from \${APP\_NAME}"
4.  services/api（Nest）：
    *   初始化 Nest
    *   package.json name=@repo/api，依赖引用 "@repo/contracts":"workspace:\*"
    *   监听端口 3001
    *   GET /health 返回 { ok: true }
    *   GET /hello 返回 { message: `Hello from API, shared APP_NAME=${APP_NAME}` }
5.  Web 调用 API：
    *   Web 页面加按钮，点击后 fetch /hello 并展示返回 message
    *   处理跨域：优先使用 Next rewrites 把 /api/ *转发到 <http://localhost:3001/>*，并把前端请求写成 fetch("/api/hello")
6.  Compose：
    *   infra/compose/compose.yaml：web:3000, api:3001；api healthcheck 访问 /health；web depends\_on api service\_healthy
    *   允许开发覆盖文件 `compose.dev.yaml`（挂载源码）

交付要求：

*   生成所有必要文件
*   根目录 `bun install`、`bun run dev` 可运行
*   打开 <http://localhost:3000，点击按钮能展示> API 返回 message
*   每一步完成后，输出你修改/新增了哪些文件（按步骤 1→6 汇报）。

使用方式建议：新建一个空目录（或新仓库），把上面的 Prompt 保存为 `PROMPT.md`，然后在 Claude CLI 中把它作为任务说明执行。

![image 8.png](/assets/img/frontend-ai-agent-camp/ad40980ed43bae09.jpg)

***

### 2.9.6 沉淀为 skills（可选）

当你发现自己会反复做类似事情（加更多服务/客户端/共享包）时，就不要每次重复粘贴长说明。

更好的递进是：

*   第一次：用上面的 Prompt 跑通一次
*   第二次：把 Prompt 拆成多个可复用步骤（初始化底座 / 添加 Next / 添加 Nest / 添加 Compose）
*   第三次开始：直接调用对应 skills，让代理按同样规则扩展工程

这一节到这里为止：你已经拥有一份“能复现 2.4–2.8 结果”的短 Prompt，也知道如何把它进一步沉淀成可复用步骤。

***

## **2.10 本章总结：先跑通底座，再让它可复现**

这一章的核心不是“选了哪些工具”，而是把一个会持续扩展的智能体工程，先搭成一个能跑、能验证、能复用的底座。

你可以把本章的递进理解为三层：

*   第一层：把结构搭对（目录、边界、依赖）
*   第二层：把链路跑通（Web ↔ API ↔ 共享包 ↔ Compose）
*   第三层：把流程固化（写成 Prompt，让代理可重复执行）

### **你在 2.1–2.3 得到的结论**

*   从一开始就采用 monorepo，是为了让跨层定义与跨项目改动保持一致，避免仓库数量增加后同步成本失控。
*   Bun / Next / Nest / Turbo / Compose 的组合目标是“少而全”：用最少的工具补齐仓库管理、客户端交付、服务端承载、任务执行和多服务联调这五件事。
*   2.4–2.8 的最小工程不是为了炫技，而是为了给后续引入模型、工具调用、RAG 和多服务扩展提供一个稳定的骨架。

### **你在 2.4–2.8 跑通的最小闭环**

*   `packages/contracts`：前后端共享同一份常量/类型/规则，避免重复定义。
*   `clients/web`：能读取共享包内容，并通过按钮触发请求。
*   `services/api`：提供最小可验证接口（`/health`、`/hello`），并能读取共享包内容。
*   “联通”不是一句话：你必须在浏览器里看到请求发出、响应回来、页面更新，才算真的跑通。
*   `infra/compose`：把多个服务当成一个系统来启动，通过 healthcheck + depends\_on 把联调变成可控流程。

### **你在 2.9 学到的工程化方法**

*   手动搭建的价值在于理解边界与关键配置；当规则固定后，重复劳动应该交给代理。
*   关键不是“让 AI 写代码”，而是把要求写清楚：目录、脚本入口、端口、Next 的 monorepo 配置、Compose 的健康检查。
*   本章提供的完整 Prompt 可以直接复现 2.4–2.8 的结果；当你开始频繁扩展工程时，再考虑把流程拆成可复用步骤（甚至用 skills 做成 plan + tasks）。

<aside>

✅ **本章的最终产物**

*   一套能跑起来的最小工程骨架（Web + API + 共享包 + Compose）
*   一套清晰的验收方式（每一层都有可见的验证点）
*   一份可复现的 Prompt（把流程从“手工”升级为“可重复执行”）

</aside>

<aside>

➡️ **下一章你将更关注什么**

*   当底座稳定之后，模型调用、工具调用、记忆、RAG、多智能体流程都应该“按同样的方式递进”：先落在正确的层，再跑通最小闭环，再把流程固化。

</aside>

## 写在最后🧪

> 这里是**言萧凡的 AI 编程实验室**。 我会在这里持续记录和分享 **AI 工具、编程实践**，以及那些值得沉淀下来的高效工作方法。 不只聊概念，也尽量分享能直接上手、能够复用的经验。 希望这间小小的实验室，能陪你一起探索、实践和成长。**2026 年，一起进步。**
    
**有兴趣的话可以添加我的微信号一起交流，不仅是编程也可以是畅谈人生。**
