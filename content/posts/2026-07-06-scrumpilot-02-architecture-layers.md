---
title: "ScrumPilot 02：四层架构，把 Agent 项目拆成可演进系统"
subtitle: "入口层、Agent 编排层、Skills 层、MCP 工具层，先把边界划清楚。"
date: 2026-07-06T10:02:00+08:00
url: "/2026/07/06/scrumpilot-02-architecture-layers.html"
categories: ["技术"]
tags: ["ScrumPilot", "AI Scrum Master", "Agent工程", "敏捷开发", "从0到1", "系统架构"]
weight: 0
---

ScrumPilot 的产品能力很多，如果没有架构分层，很快就会变成一个“超大 Agent Prompt”。所以第二步是把系统拆成四层：入口层、Agent 编排层、Skills 技能层、MCP Server 工具层。

```text
入口层 → Agent 编排层 → Skills 技能层 → MCP Server 工具层 → 数据与集成层
```

这个分层的核心思想是：**入口负责接收，Agent 负责决策，Skill 负责业务能力，Tool 负责真实读写。**

## 入口层

入口层包含飞书消息、飞书按钮、禅道 Webhook、定时触发和命令行。它不应该知道复杂业务，只做两件事：解析来源，统一成系统能理解的消息。

比如飞书群里发 `/daily sprint=42`，入口层只需要把它转成一个统一命令，然后交给路由器。

## Agent 编排层

ScrumPilot 把 Agent 职责分成三类：

- Planner：Planning、需求拆解、任务分配；
- Monitor：每日巡检、风险识别、DoD 验收、日报；
- Analyst：复盘分析、趋势分析、容量预测。

这不是为了“多 Agent 炫技”，而是为了职责清晰。Planning 的风险和 Retro 的风险不一样，输出结构也不一样。

## Skills 技能层

Skills 是业务能力的封装：`story-split`、`risk-detect`、`daily-report`、`dod-check`、`retro-analyze`、`burndown-gen`。Skill 应该像函数一样可以被复用，被测试，也可以被不同入口调用。

比如 `risk-detect` 既可以被每日巡检调用，也可以被用户手动 `/risk` 调用。

## MCP 工具层

工具层负责真实数据读写，包括禅道、data-server、scheduler-server。比如：

- `get_sprint_stories` 读取需求；
- `create_tasks` 写入任务；
- `save_risk` 保存风险；
- `save_retro` 保存复盘。

Agent 不应该直接知道禅道 REST API 的细节，它只调用工具。

## 这套架构的好处

当你要新增企业微信入口时，不需要改 Workflow；当你要替换模型时，不需要改禅道工具；当你要把内存存储换成 PostgreSQL，也不应该影响飞书 Adapter。

这就是架构分层的意义：不是画图好看，而是让后续 17 个 Sprint 能稳稳接上。
