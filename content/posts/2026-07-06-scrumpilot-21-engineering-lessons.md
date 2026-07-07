---
title: "ScrumPilot 21：做 AI 工程项目的 10 条经验"
subtitle: "从 ScrumPilot 的 17 个 Sprint 里总结 AI Agent 工程化的关键教训。"
date: 2026-07-06T10:21:00+08:00
url: "/2026/07/06/scrumpilot-21-engineering-lessons.html"
categories: ["技术"]
tags: ["ScrumPilot", "AI Scrum Master", "Agent工程", "敏捷开发", "从0到1", "工程经验"]
weight: 0
---

ScrumPilot 从 PRD 到 Sprint17，最有价值的不只是代码，而是过程里沉淀的工程经验。这里总结 10 条。

## 1. 先做 Workflow，再做聪明 Agent

没有 Workflow 的 Agent 很难追踪和测试。先把流程固化，再让 Agent 做判断。

## 2. Context 是系统能力，不是 Prompt 变量

Session、Context、Trace 应该是基础设施，不应该散落在各个调用里。

## 3. Guardrails 要早做

越早建立输入输出门禁，越容易控制质量。等系统复杂后再补，会很痛。

## 4. Adapter 必须统一协议

飞书、企业微信、Web Chat 都只是入口。内部应该尽早统一成 `UnifiedMessage`。

## 5. 内存实现不是玩具

很多模块先用 InMemory 实现是正确策略。它能让你快速测试语义，再替换基础设施。

## 6. RAG 和 Memory 要分开

RAG 解决知识检索，Memory 解决经验沉淀。两者相关，但不是同一个东西。

## 7. Model Router 是成本控制核心

不同任务用不同模型，才有可能在质量、成本、速度之间取得平衡。

## 8. Dashboard 是信任工具

AI 系统越自动化，越需要可观测。Dashboard 不是摆设，是让人相信系统的关键。

## 9. 文档是发布能力

没有用户手册、演示脚本和培训计划，功能再多也很难被采用。

## 10. 反馈闭环决定长期生命力

发布不是结束。反馈、采用度、路线图回流，决定产品能不能持续变好。

## 最后

ScrumPilot 是一个很典型的 AI 工程化项目：它既有 Agent，也有 Workflow；既有模型，也有数据；既有聊天入口，也有部署和看板。把它拆成 Sprint 去做，是比“一口吃成胖子”更稳的路线。
