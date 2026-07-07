---
title: "从 0 到 1 搭建 ScrumPilot：AI Scrum Master 系列开篇"
subtitle: "把一个 AI 敏捷助手项目拆成可交付、可验证、可运营的 20+ 篇实战路线。"
date: 2026-07-06T10:00:00+08:00
url: "/2026/07/06/scrumpilot-00-series-roadmap.html"
categories: ["技术"]
tags: ["ScrumPilot", "AI Scrum Master", "Agent工程", "敏捷开发", "从0到1", "项目路线图"]
weight: 0
---

ScrumPilot 的一句话定位很简单：**AI Scrum Master**。它要自动跑敏捷活动、拆任务进禅道、盯进度识风险、卡 DoD、复盘给改善建议。听起来像一个“大而全”的 Agent 项目，但真正从 0 到 1 搭起来时，最重要的不是一开始就接所有系统，而是把能力拆成一条可持续交付的路线。

这个系列会按 ScrumPilot 的迭代计划来写，从产品定义、架构拆分、Workflow Engine，到飞书/企业微信/API 入口，再到自动化调度、RAG、Memory、Model Router、Dashboard、部署和发布后的反馈闭环。目标不是写概念文章，而是带你一步步搭建一个可以演进的 AI 工程化项目。

## 为什么要按 Sprint 写

AI 应用最容易犯的错误，是第一天就把“模型、工具、数据、前端、部署、评估”揉成一个大泥球。ScrumPilot 的拆法刚好相反：每个 Sprint 只解决一个系统问题，并且留下扩展点。

整个路线可以理解成五个阶段：

1. **执行骨架**：Workflow、Session、Trace、Data Layer。
2. **质量控制**：Guardrails、Evaluation、可追踪输出。
3. **入口适配**：飞书、企业微信、REST API、Web Chat。
4. **智能增强**：自动化队列、RAG、Memory、Model Router、Knowledge Graph。
5. **产品化交付**：Dashboard、CI/CD、文档培训、反馈闭环。

这样写博客也更适合读者跟练：每篇文章都能回答三个问题：为什么做、怎么设计、怎么验收。

## 系列标签统一

本系列统一使用以下核心标签：

- `ScrumPilot`
- `AI Scrum Master`
- `Agent工程`
- `敏捷开发`
- `从0到1`

每篇文章再补一个模块标签，比如 `Workflow Engine`、`RAG`、`Dashboard`。这样读者既能按系列阅读，也能按技术模块检索。

## 最终你会得到什么

读完并跟完这个系列，你应该能得到一个完整认知：

- 如何把 AI Agent 从“聊天回复”升级为“可编排系统”；
- 如何设计 Agent 的上下文、追踪、质量门禁和评估；
- 如何接入飞书/企业微信/API 等真实入口；
- 如何让项目知识、记忆、模型路由和看板形成闭环；
- 如何把 AI 原型推向可部署、可培训、可持续改进的产品。

这不是一个“Prompt 写得好就行”的项目，而是一次完整的 AI 工程化实践。
