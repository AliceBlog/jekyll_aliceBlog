---
title: "ScrumPilot 05：PostgreSQL 数据层"
subtitle: "把内存里的会话、追踪和配置落到可持久化的数据模型。"
date: 2026-07-06T10:05:00+08:00
url: "/2026/07/06/scrumpilot-05-postgresql-data-layer.html"
categories: ["技术"]
tags: ["ScrumPilot", "AI Scrum Master", "Agent工程", "敏捷开发", "从0到1", "PostgreSQL"]
weight: 0
---

当系统只有内存对象时，重启就丢状态，Dashboard 和审计也无从谈起。Sprint 03 引入 Repository Interface、Schema 和 Migration 思路，把数据访问从业务逻辑里抽出来。

## 本篇要解决的问题

这一篇关注 `PostgreSQL`。如果把 ScrumPilot 看成一个从 0 到 1 的 AI 工程项目，这一步的价值不是单点功能，而是让上一阶段的能力能够继续向后演进。

## 交付目标

- workflow_runs
- sessions
- contexts
- traces
- repository 抽象

## 设计思路

做 AI Scrum Master，最怕把所有逻辑都塞进一个 Agent 里。这个 Sprint 的实现应该保持三个原则：

1. **接口先行**：先定义输入、输出和边界，再考虑具体依赖。
2. **可测试**：核心逻辑不要绑定外部服务，先用内存实现或 mock 跑通。
3. **可替换**：今天是本地实现，明天可以换成真实数据库、消息队列、模型 API 或前端框架。


这一层不一定第一天就要接真实数据库，但接口必须先设计成可替换。内存实现用于测试，PostgreSQL 实现用于部署，业务代码只依赖 Repository。


## 从 0 到 1 的实现步骤

第一步，先把目录结构建出来。目录本身就是架构边界，例如 `src/workflows`、`src/rag`、`src/dashboard` 这类模块，不应该互相越权。

第二步，定义 types。ScrumPilot 每个 Sprint 都先把类型写清楚，因为类型能强迫我们思考数据怎么流动。

第三步，实现一个 framework-neutral 的 service。不要一上来就依赖某个 HTTP 框架、数据库或队列，否则测试会变重，迁移也会困难。

第四步，补测试。测试至少覆盖成功路径、失败路径和边界输入。AI 项目也需要传统工程测试，否则 Prompt 或策略一改就不知道影响面。

第五步，更新 README 和 command-reference。每个 Sprint 的能力都要能被团队成员读懂、调用、验证。

## 验收标准

验收不应该停留在“代码写完了”。更合理的 DoD 是：

- 模块有清晰入口和导出；
- 核心类型稳定；
- 至少有一组成功/失败测试；
- README 解释了使用方式；
- `npm run build` 通过；
- `npm test` 通过。

## 小结

PostgreSQL 是 ScrumPilot 逐步产品化的一块拼图。每一块单独看都不夸张，但组合起来，就能把一个 AI Scrum Master 从 Demo 推到可运行、可观测、可交付的系统。
