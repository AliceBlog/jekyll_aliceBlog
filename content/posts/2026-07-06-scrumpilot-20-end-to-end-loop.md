---
title: "ScrumPilot 20：把 Planning、Daily、DoD、Retro 串成端到端闭环"
subtitle: "单点能力不等于产品，真正有价值的是从计划到复盘的闭环。"
date: 2026-07-06T10:20:00+08:00
url: "/2026/07/06/scrumpilot-20-end-to-end-loop.html"
categories: ["技术"]
tags: ["ScrumPilot", "AI Scrum Master", "Agent工程", "敏捷开发", "从0到1", "端到端闭环"]
weight: 0
---

前面我们按 Sprint 拆了很多模块：Workflow、Session、Trace、Data、Adapter、RAG、Memory、Dashboard、Deployment。到这一步，需要把它们重新串回用户视角：团队如何用 ScrumPilot 跑完一个完整 Sprint？

## Day 1：Planning

Planning 阶段由 Planner Agent 触发 `story-split`。它读取 Backlog，拆成技术任务，估算工时，标出依赖和风险。输出不应该直接写死，而是先生成计划卡片，让 Tech Lead 有机会确认。

确认后，系统才调用工具写入禅道。

## Day 2-9：Daily + Risk

每日巡检由 Automation Service 定时入队，再由 Worker 执行 Daily Workflow。Daily 不是简单日报，而是风险识别、进度摘要、Bug 状态、成员负载的组合。

如果发现阻塞，Monitor Agent 应该给出建议：是需要调整优先级，还是需要重新分配任务，还是需要产品澄清。

## 需求完成时：DoD

DoD 检查不应该只在 Sprint 末尾做。需求一旦进入完成状态，就触发 DoD Workflow。系统读取 DoD 配置，检查 Review、测试、文档、Bug、性能等项目。

不通过就明确缺失项，而不是泛泛地说“不符合要求”。

## Day 10：Retro

Retro 是把本次 Sprint 的事实和历史趋势结合起来。好的复盘报告应该包括：

- 完成率和速度；
- 做得好的地方；
- 待改进问题；
- 根因分析；
- Action Items；
- 下个 Sprint 的检查点。

## 闭环的关键

端到端闭环的关键不是“每一步都有 AI”，而是每一步都有数据承接。Planning 的假设要在 Daily 中被验证；Daily 发现的问题要进入 Retro；Retro 的 Action 要在下个 Planning 被检查。

这就是 ScrumPilot 真正的产品价值：它不是一个报告生成器，而是一个持续改进系统。
