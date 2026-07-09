---
title: "2026 前端 AI Agent 工程化实战营：19 篇完整学习路线"
subtitle: "从模型调用、LangChain、LangGraph、RAG、MCP、Skills 到 DeepAgent、可观测性与评估流水线。"
date: 2026-07-09T11:00:00+08:00
categories: ["AI工程", "前端AI-Agent工程化实战营"]
tags: ["前端AI-Agent工程化实战营", "AI Agent", "AI工程", "LangChain", "LangGraph"]
weight: 0
---

这组文章整理自《2026 前端 AI Agent 工程化实战营》的完整课程材料。它不是一组零散笔记，而是一条从“会调用模型”逐步走到“能工程化交付 Agent 系统”的路线。

如果你是前端工程师，这套内容的价值在于：它不会只停留在 Prompt 或模型 API，而是把 AI 能力真正放回工程现场——项目结构、服务端承载、数据库、向量化、RAG、MCP、Skills、Agent Harness、可观测性、评估流水线，全部串起来。

## 阅读建议

- 如果你刚开始做 AI 应用：按顺序读，从序章和第一章开始。
- 如果你已经会 LangChain：重点读 LangGraph、Multi-Agent、Token 经济学、RAG 和 MCP。
- 如果你准备把 Agent 放到生产：直接看 DeepAgent、可观测性和评估流水线。
- 如果你负责团队工程化：建议把 Skills、MCP、评估流水线放在一起看，它们决定能力能否复用、治理和持续演进。

## 19 篇目录

1. [序章：站在范式之变的十字路口](/posts/2026-07-09-frontend-ai-agent-camp-prologue/)
2. [第一章：把模型变成能力](/posts/2026-07-09-frontend-ai-agent-camp-chapter-01/)
3. [第二章：搭建智能体的工程底座](/posts/2026-07-09-frontend-ai-agent-camp-chapter-02/)
4. [第三章：LangChain 渐进式教学](/posts/2026-07-09-frontend-ai-agent-camp-chapter-03/)
5. [第四章：进击的Langchain](/posts/2026-07-09-frontend-ai-agent-camp-chapter-04/)
6. [第五章：从 Mock 到生产——数据库设计与向量化落库](/posts/2026-07-09-frontend-ai-agent-camp-chapter-05/)
7. [第六章：让 AI 做更懂你的交互](/posts/2026-07-09-frontend-ai-agent-camp-chapter-06/)
8. [第七章：Agent 推理的三层决策机制：路由、执行与优化](/posts/2026-07-09-frontend-ai-agent-camp-chapter-07/)
9. [第八章：LangGraph 单 Agent 图实战——路由、循环与质量闭环](/posts/2026-07-09-frontend-ai-agent-camp-chapter-08/)
10. [第九章：LangGraph Multi-Agent 实战](/posts/2026-07-09-frontend-ai-agent-camp-chapter-09/)
11. [第十章：Token 经济学：在 AI 能力与运行成本之间寻找平衡](/posts/2026-07-09-frontend-ai-agent-camp-chapter-10/)
12. [第十一章：RAG——让AI更懂你的业务](/posts/2026-07-09-frontend-ai-agent-camp-chapter-11/)
13. [第十二章：MCP——工具调用的操作系统](/posts/2026-07-09-frontend-ai-agent-camp-chapter-12/)
14. [第十三章：Skills——把最佳实践沉淀为能力资产](/posts/2026-07-09-frontend-ai-agent-camp-chapter-13/)
15. [第十四章：DeepAgent——一个开箱即用的 Agent Harness](/posts/2026-07-09-frontend-ai-agent-camp-chapter-14/)
16. [第十五章：DeepAgent——长链任务与自主规划](/posts/2026-07-09-frontend-ai-agent-camp-chapter-15/)
17. [第十六章：可观测性——你不能优化你看不见的东西](/posts/2026-07-09-frontend-ai-agent-camp-chapter-16/)
18. [第十七章：评估流水线——给 Agent 装质检线](/posts/2026-07-09-frontend-ai-agent-camp-chapter-17/)

## 这套内容的主线

整套实战营可以拆成四层：

1. **模型能力层**：Prompt、结构化输出、多轮上下文、Token 控制。
2. **工程底座层**：monorepo、Bun、Next、Nest、数据库、向量化落库。
3. **Agent 编排层**：LangChain、LangGraph、单 Agent、多 Agent、路由、循环、质量闭环。
4. **生产治理层**：RAG、MCP、Skills、DeepAgent、可观测性、评估流水线。

它真正想回答的问题不是“怎么调一个模型”，而是：**如何把模型变成稳定、可维护、可扩展、可评估的系统能力。**
