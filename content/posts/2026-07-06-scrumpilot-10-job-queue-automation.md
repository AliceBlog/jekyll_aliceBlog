---
title: "ScrumPilot 10：Job Queue + Automation"
subtitle: "让日报、风险、复盘从同步调用升级为异步调度。"
date: 2026-07-06T10:10:00+08:00
url: "/2026/07/06/scrumpilot-10-job-queue-automation.html"
categories: ["技术"]
tags: ["ScrumPilot", "AI Scrum Master", "Agent工程", "敏捷开发", "从0到1", "自动化调度"]
weight: 0
---

ScrumPilot 不应该等用户手动发 `/daily` 才工作。Sprint 08 建立 Job Queue 与 Automation Service，让 Workflow 可以被计划、入队、重试和记录状态。

## 本篇要解决的问题

这一篇关注 `自动化调度`。如果把 ScrumPilot 看成一个从 0 到 1 的 AI 工程项目，这一步的价值不是单点功能，而是让上一阶段的能力能够继续向后演进。

## 交付目标

- JobQueue 抽象
- InMemoryJobQueue
- Worker
- Automation Schedule
- 重试和状态记录

## 设计思路

做 AI Scrum Master，最怕把所有逻辑都塞进一个 Agent 里。这个 Sprint 的实现应该保持三个原则：

1. **接口先行**：先定义输入、输出和边界，再考虑具体依赖。
2. **可测试**：核心逻辑不要绑定外部服务，先用内存实现或 mock 跑通。
3. **可替换**：今天是本地实现，明天可以换成真实数据库、消息队列、模型 API 或前端框架。


本 Sprint 不直接引入 Redis/BullMQ，而是先定义接口和内存实现。这是很实用的工程策略：先把业务语义跑通，再替换基础设施。


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

自动化调度 是 ScrumPilot 逐步产品化的一块拼图。每一块单独看都不夸张，但组合起来，就能把一个 AI Scrum Master 从 Demo 推到可运行、可观测、可交付的系统。
