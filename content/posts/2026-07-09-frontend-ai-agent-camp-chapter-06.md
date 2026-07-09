---
title: "第六章：让 AI 做更懂你的交互"
subtitle: "2026 前端 AI Agent 工程化实战营系列第 7 篇"
date: 2026-07-09T11:06:00+08:00
categories: ["AI工程", "前端AI Agent工程化实战营"]
tags: ["前端AI Agent工程化实战营", "AI Agent", "AI工程", "LangChain", "LangGraph"]
weight: 0
---

> 本文整理自《2026 前端 AI Agent 工程化实战营》课程资料，作为系列文章第 7 篇。

![generated-image-1776441227327.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0da88855e55c4a2ca5a386f8f85d1dc4~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1376\&h=768\&s=436802\&e=jpg\&b=eff6fe)

前五章一路走来，系统已经能做多轮对话、调用工具、向量检索、多 Agent 协作，并把数据从内存推到了生产级数据库。但有一个问题一直被搁置：**模型的输出全是纯文本。**

不管是需求分析结论、冲突检测结果，还是多 Agent 的汇总报告，最终返回给前端的都是一段 Markdown，或者一段 JSON 字符串。前端拿到之后，要么原样渲染成一段话，要么自己去猜测里面有没有可以结构化展示的内容。这在 demo 阶段完全够用，但一旦你开始做真实的需求管理产品、内部工具或者任何面向用户的 AI 应用，就会发现：**用户不想读一堆文字，他们想点按钮、选选项、填表单。**

这一章要解决的，就是这件事：让模型的输出不只是文字，而是一套前端可以直接渲染的 **UI 协议**。模型返回结构化的 JSON，前端根据 `type` 字段渲染对应的交互组件——选择卡片、确认对话框、表单、进度条、数据表格。用户的操作结果再回传给模型，形成一个完整的 **AI 驱动 UI** 闭环。

贯穿案例是我们的**需求分析系统**：产品经理输入一条自然语言需求（如"用户希望能够批量导入 Excel 数据"），系统对需求进行完整性分析、冲突检测、复杂度评估，并生成用户故事。

<aside>

✅ **本章验收点**

*   理解"AI 驱动 UI"的核心思路：模型输出结构化 JSON，前端按协议渲染组件
*   设计一套可扩展的 UI 响应协议（UIResponse Schema），覆盖文本、选择、表单、确认、卡片、步骤条等组件类型
*   用 LangChain 的 Structured Output 约束模型输出符合 UI 协议
*   实现前端组件映射层（ComponentRenderer），根据 `type` 自动渲染对应组件
*   完成"用户输入 → 模型返回 UI 指令 → 前端渲染 → 用户操作 → 回传模型"的完整交互闭环
*   把 UI 协议接入第四章的 Multi-Agent 链路，让需求分析报告也能结构化展示
*   **同样地，每个阶段都有对应的 Prompt 可供 AI 生成代码，文中仅展示关键片段。**

</aside>

***

## 6.1 纯文本回复的天花板

![generated-image-1776440995317.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/962a927ede6d47afa282fe59ff1efa6e~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1376\&h=768\&s=303940\&e=jpg\&b=fefdfd)

先看一个真实的交互场景。产品经理说"我要提一个新需求：用户希望能够批量导入 Excel 数据"，系统用第四章的链路跑完之后，返回了这样一段文字：

    根据您的描述，需求"批量导入 Excel 数据"（编号 REQ-20240315-001）已完成初步分析。
    该需求涉及文件解析、数据校验、批量写入等多个技术环节。

    建议的分析维度：
    1. 完整性检查：需求描述是否涵盖了所有必要场景（如异常处理、数据格式校验）
    2. 冲突检测：是否与现有"单条数据录入"功能存在交互冲突
    3. 复杂度评估：初步评估为中等复杂度，预计 8-13 人天

    请告诉我您希望先从哪个维度开始深入分析？

这段回复信息完整、逻辑清晰，但从产品体验的角度看，有几个明显的问题：

*   **用户需要"阅读理解"**：三个分析维度混在文字里，用户得自己提取关键信息
*   **操作路径不明确**：用户需要打字回复"我选第一个"或"完整性检查"，输入方式不确定
*   **前端无法做交互增强**：这只是一段字符串，前端没办法把它变成三张可点击的卡片
*   **后续流程难以衔接**：用户选择之后，系统需要再次解析自然语言来理解用户的选择

换一种方式。如果模型返回的不是纯文本，而是这样一段结构化数据：

```json
{
  "type": "selection",
  "title": "请选择分析维度",
  "description": "需求 REQ-20240315-001（批量导入 Excel 数据）已完成初步解析",
  "options": [
    {
      "id": "completeness_check",
      "label": "完整性检查",
      "description": "检查需求描述是否涵盖所有必要场景和边界条件",
      "icon": "🔍"
    },
    {
      "id": "conflict_detection",
      "label": "冲突检测",
      "description": "检测与现有功能的交互冲突和数据一致性问题",
      "icon": "⚡"
    },
    {
      "id": "complexity_estimation",
      "label": "复杂度评估",
      "description": "评估技术实现难度和工期预估",
      "icon": "📊"
    }
  ],
  "allowMultiple": false
}
```

前端拿到这段 JSON，可以直接渲染成三张卡片。用户点击"完整性检查"，前端把 `{ selectedId: "completeness_check" }` 回传给模型，模型不需要做任何自然语言解析，直接拿到一个确定性的选择结果。

**这就是本章要做的事：把模型的输出从"给人读的文字"变成"给前端渲染的指令"。**

***

## 6.2 UI 响应协议设计与 Structured Output 约束

*   🤖 用 AI 生成本节代码（对应 6.2）

    将以下 Prompt 粘贴到 Claude CLI 中执行：

        在 services/chat 的 LangChain 层中，设计 UI 响应协议并实现 Structured Output 约束，严格按以下要求执行：

        1. 类型定义：
           - 新建 services/chat/src/llm/ui-protocol/ui-types.ts
           - 定义 UIResponse 联合类型，包含以下组件类型：
             - text：纯文本/Markdown 回复
             - selection：单选/多选卡片
             - form：动态表单（支持 input、select、textarea、date、number 字段）
             - confirmation：确认对话框（含操作摘要和确认/取消按钮）
             - card：信息展示卡片（订单详情、商品信息等）
             - steps：步骤进度条（展示流程当前阶段）
             - table：数据表格（批量展示结构化数据）
             - action_buttons：操作按钮组（一组可点击的动作按钮）
           - 每个类型都有 type 字段作为区分标识
           - 定义 UIAction 类型，表示用户操作的回传数据

        2. Zod Schema：
           - 新建 services/chat/src/llm/ui-protocol/ui-schemas.ts
           - 为每个组件类型定义 Zod Schema
           - 使用 z.discriminatedUnion 基于 type 字段做精确匹配
           - 导出统一的 uiResponseSchema 和 aiUIResponseSchema

        3. UI 响应服务（Structured Output）：
           - 新建 services/chat/src/llm/ui-protocol/ui-response.service.ts
           - 使用 model.withStructuredOutput(aiUIResponseSchema) 约束模型输出
           - 实现 generateUIResponse(input, history?, context?)：
             1. 根据用户输入和上下文，生成包含 UI 组件的结构化回复
             2. System Prompt 中明确说明何时使用哪种组件类型（选择、表单、确认、卡片等场景指南）
             3. 返回 AIUIResponse 类型

        4. 组件类型和字段要贴近业务场景：需求分析系统流程

        5. UI Action 处理服务：
           - 新建 services/chat/src/llm/ui-protocol/ui-action.service.ts
           - 实现 handleAction(action: UIAction, sessionContext)：
             1. 根据用户在 UI 上的操作生成下一步回复
             2. 支持选择、表单提交、确认等操作的处理

        6. 新增路由（@Controller('api/ui-chat')）：
           - POST chat：接收 { sessionId, input }，返回 AIUIResponse
           - POST action：接收 { sessionId, action: UIAction }，处理用户 UI 操作并返回下一步

        测试：
        - 输入 '我要提一个新需求' → 应返回 selection 组件（选择需求类型）
        - 输入 '查看需求 REQ-20240315-001' → 应返回 card 组件（需求详情卡片）
        - 提交需求分析 → 应返回 confirmation 组件 + steps 组件

协议设计是整章的基础。一旦定下来，后端和前端就有了统一的约定：后端保证输出符合 Schema，前端保证能渲染每种 `type`。

### 6.2.1 设计原则

在定义具体类型之前，先明确几条设计原则：

*   **`type` 字段是唯一标识**：前端只看 `type` 来决定渲染哪个组件，不猜测、不推断
*   **每个组件自包含**：一个 UIResponse 包含渲染所需的全部信息，前端不需要额外请求
*   **操作可回传**：用户在 UI 上的操作（选择、提交、确认）可以结构化地回传给模型
*   **可组合**：一次模型回复可以包含多个 UIResponse（比如一段文字 + 一组选择卡片）
*   **向后兼容**：新增组件类型不影响已有类型的渲染

### 6.2.2 组件类型总览

![generated-image-1776441065738.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/09b65eaf504f496ab2e19e0c429cc50b~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1376\&h=768\&s=477820\&e=jpg\&b=f9f7ee)

| **type**         | **用途**        | **典型场景**       | **用户操作**             |
| ---------------- | ------------- | -------------- | -------------------- |
| `text`           | 纯文本或 Markdown | 普通对话回复、解释说明    | 无（仅展示）               |
| `selection`      | 单选/多选卡片       | 选择需求类型、选择分析维度  | 点击选项，回传 selectedId   |
| `form`           | 动态表单          | 填写需求详情、补充验收标准  | 填写并提交，回传表单数据         |
| `confirmation`   | 确认对话框         | 确认需求提交、确认分析参数  | 确认或取消，回传 confirmed   |
| `card`           | 信息展示卡片        | 需求详情、分析报告、处理进度 | 无（仅展示，可带操作按钮）        |
| `steps`          | 步骤进度条         | 需求分析进度、评审状态    | 无（仅展示）               |
| `table`          | 数据表格          | 历史需求列表、分析记录    | 可选行点击，回传 selectedRow |
| `action_buttons` | 操作按钮组         | 快捷操作入口、流程分支选择  | 点击按钮，回传 actionId     |

### 6.2.3 TypeScript 类型定义

```tsx
// services/chat/src/llm/ui-protocol/ui-types.ts（关键结构）

// 每个组件类型都包含 type 字段作为唯一标识，以 selection 和 form 为例：
export interface SelectionResponse {
  type: 'selection';
  title: string;
  options: SelectionOption[];  // { id, label, description?, icon? }
  allowMultiple?: boolean;
}

export interface FormResponse {
  type: 'form';
  title: string;
  fields: FormField[];         // { name, label, type, required?, options? }
  submitLabel?: string;
}

// 其他组件类型结构类似（完整定义由 AI 生成）：
// TextResponse:          { type: 'text', content: string }
// ConfirmationResponse:  { type: 'confirmation', title, summary[], warning? }
// CardResponse:          { type: 'card', title, fields[], actions?[] }
// StepsResponse:         { type: 'steps', steps[], currentStep }
// TableResponse:         { type: 'table', columns[], rows[], selectable? }
// ActionButtonsResponse: { type: 'action_buttons', buttons[], layout? }

// 联合类型：前端根据 type 字段分发渲染
export type UIResponse =
  | TextResponse | SelectionResponse | FormResponse
  | ConfirmationResponse | CardResponse | StepsResponse
  | TableResponse | ActionButtonsResponse;

// 模型完整回复
export interface AIUIResponse {
  message: string;              // 主要文字回复（始终存在）
  components: UIResponse[];     // UI 组件列表（可多个）
  context?: {
    sessionStage?: string;      // 当前流程阶段
    collectedData?: Record<string, unknown>;
  };
}

// 用户操作回传
export interface UIAction {
  componentType: UIResponse['type'];
  payload:
    | { type: 'select'; selectedId: string | string[] }
    | { type: 'submit'; formData: Record<string, unknown> }
    | { type: 'confirm'; confirmed: boolean }
    | { type: 'click'; actionId: string }
    | { type: 'row_select'; rowIndex: number };
}
```

### 6.2.4 Zod Schema（供 LangChain Structured Output 使用）

LangChain 的 `withStructuredOutput` 需要 Zod Schema 来约束模型的输出格式。这里把上面的 TypeScript 类型转换成对应的 Zod 定义：

```tsx
// services/chat/src/llm/ui-protocol/ui-schemas.ts
import { z } from 'zod';

// 以 selection 为例，每个组件类型都有对应的 Zod Schema
const selectionResponseSchema = z.object({
  type: z.literal('selection'),  // z.literal 确保精确匹配
  title: z.string(),
  options: z.array(z.object({
    id: z.string(), label: z.string(),
    description: z.string().optional(), icon: z.string().optional(),
  })).min(2),
  allowMultiple: z.boolean().optional(),
});
// textResponseSchema, formResponseSchema, confirmationResponseSchema,
// cardResponseSchema, stepsResponseSchema, tableResponseSchema,
// actionButtonsResponseSchema 等均按相同模式定义...

// 关键：用 discriminatedUnion 基于 type 字段精确匹配
export const uiComponentSchema = z.discriminatedUnion('type', [
  textResponseSchema, selectionResponseSchema, formResponseSchema,
  confirmationResponseSchema, cardResponseSchema, stepsResponseSchema,
  tableResponseSchema, actionButtonsResponseSchema,
]);

// 完整 AI 回复 Schema（供 withStructuredOutput 使用）
export const aiUIResponseSchema = z.object({
  message: z.string().describe('主要文字回复'),
  components: z.array(uiComponentSchema),
  context: z.object({
    sessionStage: z.string().optional(),
    collectedData: z.record(z.unknown()).optional(),
  }).optional(),
});
```

> **注意：每次将 prompt 交给 AI 生成 spec 文档后，你都需要仔细分析，而不是 AI 给什么就照做。同时，我给你的 prompt 只是初稿，你需要借助 AI 去完善它，并完成你自己的作品。**

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b21e9924d1e84e2bbb231dc35cfd665a~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=2894\&h=1188\&s=355401\&e=png\&b=181818)

### 6.2.5 用 Structured Output 约束模型输出

![generated-image-1776441062768.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cbf9a3414b094175af5b58739c4ca47b~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1376\&h=768\&s=268645\&e=jpg\&b=ffffff)

协议和 Schema 都定义好了，接下来把它们用起来。LangChain 的 `withStructuredOutput` 会把 Zod Schema 作为约束注入模型调用，确保输出严格符合定义的结构。但结构化输出只能约束"格式"，不能约束"判断"——模型还需要一份明确的指引来决定在什么业务场景下，应该返回什么类型的组件。

```tsx
// services/chat/src/llm/ui-protocol/ui-response.service.ts
import { Injectable } from '@nestjs/common';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { createChatModel } from '../model.factory';
import { aiUIResponseSchema } from './ui-schemas';
import type { AIUIResponse } from './ui-types';

const UI_SYSTEM_PROMPT = `你是一名需求分析助手。你的回复必须包含结构化的 UI 组件，让前端可以渲染出友好的交互界面。

## 组件选择指南

根据对话场景，选择合适的组件类型：

1. selection：用户从明确选项中选择（需求类型、分析维度、优先级）
2. form：需要用户补充多个字段信息（需求详情、验收标准）
3. confirmation：即将执行重要操作（确认提交、确认生成）
4. card：展示结构化信息（需求详情、分析报告）
5. steps / table / action_buttons / text：进度、数据、操作入口、纯文本
组合规则：message 必填；components 可多个；常见组合 card + action_buttons
上下文管理：context.sessionStage 跟踪阶段，collectedData 记录已收集数据`;

@Injectable()
export class UIResponseService {
  private model = createChatModel();
  private structuredModel = this.model.withStructuredOutput(aiUIResponseSchema);

  private prompt = ChatPromptTemplate.fromMessages([
    ['system', UI_SYSTEM_PROMPT],
    new MessagesPlaceholder('history'),
    ['human', '{input}'],
  ]);

  private chain = this.prompt.pipe(this.structuredModel);

  async generateUIResponse(
    input: string,
    history: BaseMessage[] = [],
    context?: Record<string, unknown>,
  ): Promise<AIUIResponse> {
    const enrichedInput = context
      ? `${input}\n\n[当前上下文] ${JSON.stringify(context)}`
      : input;

    return this.chain.invoke({
      input: enrichedInput,
      history,
    });
  }
}
```

### 6.2.6 实际调用效果

当产品经理输入"我要提一个新需求"时，模型的返回大致如下：

```json
{
  "message": "好的，请先选择需求类型，以便系统匹配最合适的分析模板。",
  "components": [
    {
      "type": "selection",
      "title": "请选择需求类型",
      "options": [
        { "id": "functional", "label": "功能需求", "description": "新增或修改系统功能", "icon": "⚙️" },
        { "id": "performance", "label": "性能需求", "description": "响应时间、并发量、吞吐率等指标", "icon": "⚡" },
        { "id": "security", "label": "安全需求", "description": "权限控制、数据加密、审计日志等", "icon": "🔒" },
        { "id": "ui_ux", "label": "UI/UX 需求", "description": "界面交互、用户体验优化", "icon": "🎨" }
      ],
      "allowMultiple": false
    }
  ],
  "context": {
    "sessionStage": "select_type",
    "collectedData": {}
  }
}
```

![image 1.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a6515babd3264a508e66eac45929cdd6~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=2292\&h=1720\&s=329893\&e=png\&b=232323)

当产品经理输入"查看需求 REQ-20240315-001"时：

```json
{
  "message": "已查询到该需求的详细信息：",
  "components": [
    {
      "type": "card",
      "title": "需求 REQ-20240315-001",
      "subtitle": "批量导入 Excel 数据",
      "icon": "📊",
      "fields": [
        { "label": "需求状态", "value": "待分析", "type": "status" },
        { "label": "提交时间", "value": "2024-03-15", "type": "date" },
        { "label": "需求类型", "value": "功能需求", "type": "text" },
        { "label": "优先级", "value": "P1 - 高", "type": "status" },
        { "label": "提交人", "value": "张三（PM）", "type": "text" }
      ],
      "actions": [
        { "id": "start_analysis", "label": "开始分析", "variant": "primary" },
        { "id": "view_similar", "label": "查看相似需求", "variant": "secondary" }
      ]
    }
  ]
}
```

![image 2.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4a3d7e5b8b39460f8595d401440db499~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=2202\&h=1578\&s=257314\&e=png\&b=222222)

> 实际上，此时我还没有接入真实数据。AI 自己摸索了一下，给我“胡说八道”编了一个假数据，刚好是一个很好的例子：**如果没有强约束，LLM 很可能不会拒绝你。它总是有求必应，却不会在意数据的真伪。** 在真实场景里，我们需要做很多约束来消除幻觉。

<aside>

⚠️ **关于 Zod Schema 约束的两个要点**

1.  **为什么用 `z.discriminatedUnion` 而不是 `z.union`？** 基于 `type` 字段精确匹配，性能更好、错误信息更清晰，也更符合“前端只看 `type` 决定渲染”的设计。
2.  **模型输出不总是完美的。** Schema 只能约束格式，模型偶尔会产出不理想的组件组合（比如该用 form 时用了 selection）。应对策略：一是优化 System Prompt 场景指引；二是服务端加一层 **后处理校验** 兜底修正。生产环境建议两者结合。

</aside>

***

## 6.3 完整交互闭环：选择 → 表单 → 确认 → 结果

*   🤖 用 AI 生成本节代码（对应 6.3）

    将以下 Prompt 粘贴到 Claude CLI 中执行：

        在 services/chat 中实现完整的 UI 交互闭环，严格按以下要求执行：

        1. 交互状态机：
           - 新建 services/chat/src/llm/ui-protocol/ui-flow.service.ts
           - 实现需求分析流程的状态机：
             - Stage 1: select_type → 用户选择需求类型（selection 组件）
             - Stage 2: fill_detail → 用户填写需求详情（form 组件）
             - Stage 3: confirm → 用户确认提交分析（confirmation 组件 + card 组件）
             - Stage 4: result → 展示分析结果（steps 组件 + action_buttons 组件）
           - 每个阶段根据用户操作（UIAction）推进到下一阶段
           - 支持回退（用户取消时返回上一阶段）

        2. Action 处理器：
           - 新建 services/chat/src/llm/ui-protocol/ui-action.handler.ts
           - 根据 UIAction 的 componentType 和 payload 分发处理
           - 每次处理后更新 context（sessionStage + collectedData）
           - 返回下一阶段的 AIUIResponse

        3. 更新路由：
           - POST /api/ui-chat/action：接收 { sessionId, action }，返回下一阶段的 AIUIResponse

        测试场景（同一 sessionId 依次操作）：
        1. 输入 '我要提一个新需求：用户希望能够批量导入 Excel 数据' → 返回 selection（需求类型）
        2. action: select functional → 返回 form（需求详情表单）
        3. action: submit form → 返回 confirmation（确认提交分析）
        4. action: confirm → 返回 steps + action_buttons（分析进度 + 后续操作）

单个组件能被渲染出来，只是起点。真正的产品体验，是一个完整的交互流程：用户一步步操作，系统一步步推进，直到任务完成。

![image 3.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/653b4776036949c5a69e9f7c4c03b221~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1232\&h=860\&s=232265\&e=png\&b=282c34)

> 当你的 spec 开始帮你分析需求时，你往往会面临多种选择。你的每一次选择，都会让最终代码走向不同的实现。但这并不重要，因为我们更关注最终目标。比如我现在用 NestJS 来完成服务端项目，你也可以用 Midway 或其他框架，甚至用 Go 或 Java。

> 因为我们的最终目的是跑通整条 Agent 链路。只要是高级语言，都可以完成这个需求。你要做的不是把各种技术和语法都学一遍，而是掌握完整的思考流程，并学会借助 AI 把事情做成。所以你至少要精通一门高级语言，也需要持续培养架构思路。最终，你还要知道如何更好地与 AI 配合：既可以用一小段 prompt 完成，也可以自己写 spec，再借助 code agents 去落地。你完全可以选择自己最擅长的编程语言，客户端也不一定非得是 Web。

### 6.3.1 需求分析流程的四个阶段

```mermaid
flowchart LR
    A["选择需求类型"] -->|selection| B["填写需求详情"]
    B -->|form| C["确认提交分析"]
    C -->|confirmation| D["分析结果"]
    C -->|取消| B
    D -->|action_buttons| E["后续操作"]
```


![generated-image-1776441607781.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0a4a9ab39bca40a994dfc0fff4bc5bd5~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1376&h=768&s=251617&e=jpg&b=fefafa)

每个阶段对应一种组件类型，用户操作后自动推进到下一阶段。整个过程中，模型不需要再解析自然语言——用户的选择、表单数据、确认操作都是结构化的。

### 6.3.2 交互状态机实现

```tsx
// services/chat/src/llm/ui-protocol/ui-flow.service.ts
import { Injectable } from '@nestjs/common';
import type { AIUIResponse, UIAction } from './ui-types';

interface SessionContext {
  stage: string;
  collectedData: Record<string, unknown>;
}

@Injectable()
export class UIFlowService {
  private sessions = new Map<string, SessionContext>();

  private getContext(sessionId: string): SessionContext {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, { stage: 'init', collectedData: {} });
    }
    return this.sessions.get(sessionId)!;
  }

  /** 处理用户的自然语言输入 */
  async handleInput(sessionId: string, input: string): Promise<AIUIResponse> {
    const ctx = this.getContext(sessionId);

    // 判断用户意图，进入对应流程
    if (input.includes('需求') || input.includes('功能')) {
      // 从输入中提取需求描述
      ctx.collectedData.rawInput = input;
      ctx.stage = 'select_type';
      return this.buildSelectType(ctx);
    }

    if (input.includes('查看') || input.includes('查询')) {
      return this.buildRequirementCard(input);
    }

    // 默认：返回常用服务入口
    return {
      message: '请问有什么可以帮您？',
      components: [{
        type: 'action_buttons',
        title: '常用功能',
        buttons: [
          { id: 'new_req', label: '提交新需求', icon: '📝', variant: 'primary' },
          { id: 'view_reqs', label: '查看需求列表', icon: '📋', variant: 'secondary' },
          { id: 'search_similar', label: '搜索相似需求', icon: '🔍', variant: 'ghost' },
          { id: 'help', label: '使用帮助', icon: '💬', variant: 'ghost' },
        ],
        layout: 'horizontal',
      }],
    };
  }

  /** 处理用户的 UI 操作 */
  async handleAction(
    sessionId: string,
    action: UIAction,
  ): Promise<AIUIResponse> {
    const ctx = this.getContext(sessionId);

    switch (ctx.stage) {
      case 'select_type':
        return this.onTypeSelected(ctx, action);
      case 'fill_detail':
        return this.onFormSubmitted(ctx, action);
      case 'confirm':
        return this.onConfirmation(ctx, action);
      default:
        return this.handleButtonAction(ctx, action);
    }
  }

  // ====== Stage 1: 选择需求类型 ======

  private buildSelectType(ctx: SessionContext): AIUIResponse {
    return {
      message: '请先选择需求类型，以便系统匹配最合适的分析模板。',
      components: [{
        type: 'selection',
        title: '请选择需求类型',
        options: [
          { id: 'functional', label: '功能需求',
            description: '新增或修改系统功能', icon: '⚙️' },
          { id: 'performance', label: '性能需求',
            description: '响应时间、并发量、吞吐率等指标', icon: '⚡' },
          { id: 'security', label: '安全需求',
            description: '权限控制、数据加密、审计日志等', icon: '🔒' },
          { id: 'ui_ux', label: 'UI/UX 需求',
            description: '界面交互、用户体验优化', icon: '🎨' },
        ],
        allowMultiple: false,
      }],
      context: {
        sessionStage: 'select_type',
        collectedData: ctx.collectedData,
      },
    };
  }

  private onTypeSelected(
    ctx: SessionContext, action: UIAction,
  ): AIUIResponse {
    if (action.payload.type !== 'select') {
      return this.buildSelectType(ctx);
    }
    ctx.collectedData.reqType = action.payload.selectedId;
    ctx.stage = 'fill_detail';
    return this.buildDetailForm(ctx);
  }

  // ====== Stage 2~4：与 Stage 1 模式相同（buildXxx 构建 UI → onXxx 处理操作） ======

  // Stage 2: buildDetailForm() → form 组件（标题、描述、优先级、验收标准、补充说明）
  //          onFormSubmitted() → Object.assign(ctx.collectedData, formData)
  //          → ctx.stage = 'confirm' | 取消回退到 'select_type'

  // Stage 3: buildConfirmation() → confirmation 组件（操作摘要 + 警告信息）
  //          onConfirmation() → confirmed ? ctx.stage='result' : 回退 'fill_detail'

  // Stage 4: buildResult() → steps + card + action_buttons 组合
  //          steps: 分析流程各阶段状态
  //          card: 需求详情（标题、时间、复杂度、状态）
  //          action_buttons: 生成用户故事 / 查看报告 / 同步 Jira

  // ====== 按钮操作处理 ======
  // handleButtonAction: 根据 actionId 分发到对应流程
  // buildRequirementCard: 返回 card 组件展示需求详情
}
```

### 6.3.3 路由层

```tsx
// services/chat/src/llm/ui-protocol/ui-chat.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { UIFlowService } from './ui-flow.service';
import type { UIAction } from './ui-types';

@Controller('api/ui-chat')
export class UIChatController {
  constructor(private uiFlow: UIFlowService) {}

  @Post('chat')
  async chat(@Body() body: { sessionId: string; input: string }) {
    return this.uiFlow.handleInput(body.sessionId, body.input);
  }

  @Post('action')
  async action(@Body() body: { sessionId: string; action: UIAction }) {
    return this.uiFlow.handleAction(body.sessionId, body.action);
  }
}
```

**🧪 验证步骤（对应 6.3）**

用同一个 sessionId 走完完整需求分析流程：

```bash
# Stage 0: 初始入口（返回常用服务按钮）
curl -X POST http://localhost:3001/api/ui-chat/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"ui-demo","input":"你好"}'

# Stage 1: 触发需求分析流程（返回 selection 组件）
curl -X POST http://localhost:3001/api/ui-chat/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"ui-demo","input":"我要提一个新需求：用户希望能够批量导入 Excel 数据"}'

# Stage 2: 选择需求类型（返回 form 组件）
curl -X POST http://localhost:3001/api/ui-chat/action \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"ui-demo","action":{"componentType":"selection","payload":{"type":"select","selectedId":"functional"}}}'

# Stage 3: 提交表单（返回 confirmation 组件）
curl -X POST http://localhost:3001/api/ui-chat/action \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"ui-demo","action":{"componentType":"form","payload":{"type":"submit","formData":{"title":"批量导入 Excel 数据","description":"用户希望能通过上传 Excel 文件批量导入数据，支持 .xlsx 和 .csv 格式","priority":"P1","acceptanceCriteria":"支持 1 万行以内数据导入，异常数据自动标记"}}}}'

# Stage 4: 确认提交（返回 steps + card + action_buttons）
curl -X POST http://localhost:3001/api/ui-chat/action \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"ui-demo","action":{"componentType":"confirmation","payload":{"type":"confirm","confirmed":true}}}'
```

**验收标准**：

*   Stage 1 返回的 `components[0].type` 为 `selection`，包含 4 个选项
*   Stage 2 返回的 `components[0].type` 为 `form`，包含 5 个字段


![image 4.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4de7acefff7c4e05ac55884254249f58~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=2182&h=1690&s=311719&e=png&b=fcfcfc)

*   Stage 3 返回的 `components[0].type` 为 `confirmation`，`summary` 包含用户填写的信息


![image 5.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/60181d79276c47bfb4705ca7622774de~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=2244&h=1590&s=293631&e=png&b=fcfcfc)

*   Stage 4 返回的 `components` 包含 `steps`、`card` 和 `action_buttons` 三个组件
*   任何阶段点击"取消/返回"都能回退到上一阶段

后续图太多了，我就不粘贴了。按这个步骤，可以让 AI 写一段自动化测试的 E2E 测试脚本。我懒得写，如果你也不想写和验证，我们就直接开始开发前端，后端和前端到时候一起调整，速度会更快一些。

***

## 6.4 前端组件渲染层：ComponentRenderer

*   🤖 用 AI 生成本节代码（对应 6.4）

    将以下 Prompt 粘贴到 Claude CLI 中执行：

        在 clients/chat-web（Next.js 前端）中实现 UI 组件渲染层，严格按以下要求执行：

        1. 组件映射器：
           - 新建 clients/chat-web/src/components/ai-ui/ComponentRenderer.tsx
           - 根据 UIResponse 的 type 字段，自动渲染对应的 React 组件
           - 使用 switch-case 或 Record 映射

        2. 基础组件（每个组件一个文件）：
           - SelectionCard.tsx：渲染选择卡片，点击后调用 onAction
           - DynamicForm.tsx：根据 FormField 动态生成表单，提交后调用 onAction
           - ConfirmationDialog.tsx：显示操作摘要 + 确认/取消按钮
           - InfoCard.tsx：展示结构化信息卡片
           - StepsProgress.tsx：展示步骤进度条
           - DataTable.tsx：展示数据表格
           - ActionButtons.tsx：渲染操作按钮组

        3. 聊天容器：
           - 新建 clients/chat-web/src/components/ai-ui/AIChatContainer.tsx
           - 管理聊天历史（message + components）
           - 处理用户输入（文本）和 UI 操作（UIAction）
           - 调用后端 /api/ui-chat/chat 和 /api/ui-chat/action

        使用 Tailwind CSS + shadcn/ui 风格 # 注意你可以选择自己喜欢的风格，未必跟我一样

后端负责产出 UI 指令，前端负责把指令渲染成真实的交互界面。这一节的核心是 `ComponentRenderer`：一个根据 `type` 字段自动分发渲染的映射层。

### 6.4.1 组件映射器

```tsx
// clients/chat-web/src/components/ai-ui/ComponentRenderer.tsx
import React from 'react';
import { SelectionCard } from './SelectionCard';
import { DynamicForm } from './DynamicForm';
import { ConfirmationDialog } from './ConfirmationDialog';
import { InfoCard } from './InfoCard';
import { StepsProgress } from './StepsProgress';
import { DataTable } from './DataTable';
import { ActionButtons } from './ActionButtons';
import type { UIResponse, UIAction } from '@/types/ui-types';

interface Props {
  component: UIResponse;
  onAction: (action: UIAction) => void;
}

export function ComponentRenderer({ component, onAction }: Props) {
  switch (component.type) {
    case 'text':
      return (
        <div className="prose prose-sm max-w-none">
          {component.content}
        </div>
      );

    case 'selection':
      return (
        <SelectionCard
          title={component.title}
          description={component.description}
          options={component.options}
          allowMultiple={component.allowMultiple}
          onSelect={(selectedId) =>
            onAction({
              componentType: 'selection',
              payload: { type: 'select', selectedId },
            })
          }
        />
      );

    // form, confirmation, card, steps, table, action_buttons 同理：
    // 将 component 的 props 传给对应子组件，用户操作通过 onAction 统一回传
    // 例如：form → onSubmit → { type: 'submit', formData }
    //       confirmation → onConfirm → { type: 'confirm', confirmed: true }
    //       card → onAction → { type: 'click', actionId }

    default:
      return null;
  }
}
```

### 6.4.2 选择卡片组件示例

```tsx
// clients/chat-web/src/components/ai-ui/SelectionCard.tsx
import React, { useState } from 'react';

interface Option {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

interface Props {
  title: string;
  description?: string;
  options: Option[];
  allowMultiple?: boolean;
  onSelect: (selectedId: string | string[]) => void;
}

export function SelectionCard({
  title, description, options, allowMultiple, onSelect,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleClick = (id: string) => {
    if (allowMultiple) {
      const next = selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id];
      setSelected(next);
    } else {
      // 单选：直接触发
      onSelect(id);
    }
  };

  // 渲染选项卡片网格 + 多选确认按钮（样式代码省略）
  return (
    <div>
      <h3>{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button key={opt.id} onClick={() => handleClick(opt.id)}>
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>
      {allowMultiple && selected.length > 0 && (
        <button onClick={() => onSelect(selected)}>确认选择</button>
      )}
    </div>
  );
}
```

### 6.4.3 聊天容器

```tsx
// clients/chat-web/src/components/ai-ui/AIChatContainer.tsx
import React, { useState } from 'react';
import { ComponentRenderer } from './ComponentRenderer';
import type { AIUIResponse, UIAction } from '@/types/ui-types';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  components?: AIUIResponse['components'];
}

export function AIChatContainer({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const addAIMessage = (response: AIUIResponse) => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'ai',
        content: response.message,
        components: response.components,
      },
    ]);
  };

  // 处理文本输入
  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    setInput('');
    setLoading(true);

    const res = await fetch('/api/ui-chat/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, input }),
    });
    const data: AIUIResponse = await res.json();
    addAIMessage(data);
    setLoading(false);
  };

  // 处理 UI 操作
  const handleAction = async (action: UIAction) => {
    setLoading(true);
    const res = await fetch('/api/ui-chat/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action }),
    });
    const data: AIUIResponse = await res.json();
    addAIMessage(data);
    setLoading(false);
  };

  // 渲染：消息列表 + 输入框（样式代码省略）
  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>
          <p>{msg.content}</p>
          {msg.components?.map((comp, j) => (
            <ComponentRenderer key={j} component={comp} onAction={handleAction} />
          ))}
        </div>
      ))}
      <input onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
      <button onClick={handleSend}>发送</button>
    </div>
  );
}
```

**🧪 验证步骤（对应 6.4）**

注意：我已将流程改为完全由 LLM 进行操作，因此与示例代码有所不同，具体可参考项目的 feat/ui 分支。

注意：我新增了数据库模型配置功能，因此你需要先完成模型配置。推荐使用超哥的中转站<https://api.amux.ai/>


![image 6.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f7c1334b54eb4470aca991c8867bbda3~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=2978&h=1522&s=218398&e=png&b=080809)

在浏览器中打开前端页面（默认 `http://localhost:3000`），按以下步骤操作，验证前端组件渲染和交互闭环：

**Step 1：初始加载 — 欢迎消息**

**操作**：打开页面（新建会话或进入空会话）

**验收标准**：

*   页面渲染出一条硬编码的助手欢迎消息（`MessageBubble`）
*   内容为"欢迎使用 Autix AI 需求分析助理..."
*   底部有输入框和发送按钮

![image 7.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/52ee2bdf8f0040c08843c9987c1b4d3f~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1450&h=1698&s=93515&e=png&b=060607)

**Step 2：触发澄清流程 — SelectionCard 渲染**

**操作**：在输入框中输入简短内容（如"你好"或"我要提需求"）并回车

**验收标准**：

*   用户消息显示在右侧气泡中
*   AI 回复显示在左侧气泡中（可能包含澄清引导文字）
*   下方渲染出 `SelectionCard` 组件，标题为"请选择您的需求类型"
*   包含 4 张可点击的选项卡片：
    *   功能需求 ⚙️
    *   性能需求 ⚡
    *   安全需求 🔒
    *   UI/UX 需求 🎨
*   选中时卡片有高亮效果

![image 8.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1bd0e4de46d1450d894fc962ecfc43a1~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1534&h=1164&s=147903&e=png&b=0e0e10)

**Step 3：选择需求类型 — DynamicForm 渲染**

**操作**：点击"功能需求 ⚙️"卡片

**验收标准**：

*   聊天区域追加一条用户消息：`[UI 操作: selection_card → submit]`
*   追加一条新的 AI 消息
*   渲染出 `DynamicForm` 组件，包含以下字段：
    *   **需求标题**（input，必填）
    *   **详细描述**（textarea，必填）
    *   **优先级**（select，选项：低/中/高/紧急）
    *   **验收标准**（textarea，必填）
    *   **补充说明**（textarea，非必填）
*   表单底部有"提交"按钮

![image 9.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ea6c7fa90fbc4dbf88a307168bc07341~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1484&h=1238&s=120249&e=png&b=1a1a1d)


**Step 4：提交表单 — ConfirmationDialog 渲染**

**操作**：

*   填写表单字段：
    *   需求标题："批量导入 Excel 功能"
    *   详细描述："用户希望能够批量导入 Excel 数据，支持最多 10000 行"
    *   优先级：选择"高"
    *   验收标准："能够成功导入并显示导入进度"
*   点击"提交"按钮

**验收标准**：

*   追加用户消息：`[UI 操作: dynamic_form → submit]`
*   可能显示加载状态（流式输出或 loading）
*   渲染出 `ConfirmationDialog` 组件
*   操作摘要（summary）中包含：
    *   需求标题："批量导入 Excel 功能"
    *   需求类型："功能需求"
    *   优先级："高"
    *   详细描述摘要
*   包含两个按钮：
    *   "确认提交"
    *   "返回修改"


![image 10.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/747caafc2f284861b99b20cde99ae7a1~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1516&h=1298&s=213532&e=png&b=151518)

**Step 5：确认提交 — Steps + InfoCard + ActionButtons 组合渲染**

**操作**：点击"确认提交"按钮

**验收标准**：

*   追加用户消息：`[UI 操作: confirm_dialog → submit]`
*   渲染出 `StepsProgress` 组件，展示分析流程各阶段：
    *   需求提取（completed）
    *   完整性检查（completed）
    *   冲突检测（completed）
    *   复杂度评估（completed）
    *   汇总报告（completed/current）
*   渲染出 `InfoCard` 组件，展示需求详情：
    *   需求编号（如 REQ-2024-001）
    *   需求标题
    *   需求类型
    *   优先级
    *   状态（如"待评审"）
    *   复杂度评分
*   渲染出 `ActionButtons` 组件，包含后续操作按钮（具体按钮由后端决定，可能包括）：
    *   "生成用户故事"
    *   "查看详细报告"
    *   "同步到 Jira"
    *   "下载分析报告"

![image 11.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/04c4a9c9813b4d8ba525551544408658~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1458&h=1198&s=152681&e=png&b=17171a)

**Step 6：回退测试 — 返回 SelectionCard**

**操作**：

*   重新走一遍 Step 2-4 的流程
*   在 Step 4 的 `ConfirmationDialog` 中点击"返回修改"按钮

**验收标准**：

*   追加用户消息：`[UI 操作: confirm_dialog → cancel]`
*   渲染出 `SelectionCard` 组件（回到 Step 2 的状态）
*   用户可以重新选择需求类型
*   **注意**：之前填写的表单数据**不会保留**（当前实现是重新生成 UI，不保存中间状态）

**Step 7：异常组件 Fallback**

**操作**：

*   模拟后端返回一个前端不认识的组件类型
*   方法：临时修改 `AIUIRenderer.tsx`，在某个位置返回 `{ type: "unknown_widget", data: {} }`

**验收标准**：

*   前端**不崩溃**
*   在该组件位置显示降级提示：

<!---->

    [不支持的组件类型: unknown_widget]

*   其他组件正常渲染
*   控制台可能有警告日志，但不影响页面使用

<aside>

📌 **ComponentRenderer 的关键设计**

*   **单向数据流**：后端产出 UIResponse → 前端渲染组件 → 用户操作产出 UIAction → 回传后端
*   **组件无状态**：每个组件只负责渲染和收集操作，不保存跨轮状态
*   **统一回调**：所有组件通过 `onAction(UIAction)` 统一回传，容器层统一处理
*   **可替换**：每个组件可以独立升级样式，不影响协议和其他组件

</aside>

<aside>

🎨 **补充说明**

> **写样式是我的弱项。我不太有想象力，也缺少审美，这里已经尽力了，希望你们能做得更好。**

</aside>

<aside>


📝 **备注：什么时候才需要“把主流程接入 UI 协议”的补充 Prompt？**

如果出现下面这种情况：

*   你的 UI 状态机流程（从 selection → form → confirmation → result）已经实现了 AIUIResponse 的生成和返回
*   但是**主流程**（用户直接输入完整需求时）还没有接入 UI 协议，仍然返回纯文本 Markdown 报告

这时你才需要修改 SummaryAgent 和主流程，让它们也返回 AIUIResponse 格式的结构化 UI 组件；并使用对应的 Prompt 进行“完全流程补齐”。

</aside>

***

## 6.5 工程化要点与生产建议

协议和闭环都跑通之后，在真正上线之前，还有几个工程化层面的问题值得关注。

### 6.5.1 组件版本管理

```tsx
// 在协议中加入版本号
export interface AIUIResponse {
  version: '1.0';            // 协议版本
  message: string;
  components: UIResponse[];
  context?: { /* ... */ };
}
```

当你需要新增组件类型或修改字段时，通过版本号来区分。前端可以根据版本号做兼容处理：

```tsx
if (response.version === '1.0') {
  // 渲染 v1 组件
} else {
  // fallback 到纯文本
}
```

### 6.5.2 未知组件的 Fallback

前端遇到不认识的 `type` 时，不应该崩溃，而是降级到文本展示：

```tsx
// ComponentRenderer 中的 default 分支
default:
  console.warn(`Unknown component type: ${component.type}`);
  return (
    <div className="p-3 bg-gray-50 rounded text-sm text-gray-500">
      [不支持的组件类型: {component.type}]
    </div>
  );
```

### 6.5.3 后处理校验层

模型输出通过 Zod Schema 约束了格式，但业务逻辑的正确性需要额外校验：

```tsx
function validateUIResponse(response: AIUIResponse): AIUIResponse {
  // 1. 确保 message 不为空
  if (!response.message?.trim()) {
    response.message = '正在为您处理...';
  }

  // 2. 过滤掉空选项的 selection
  response.components = response.components.filter((comp) => {
    if (comp.type === 'selection' && comp.options.length < 2) return false;
    if (comp.type === 'form' && comp.fields.length === 0) return false;
    return true;
  });

  // 3. 限制单次返回的组件数量
  if (response.components.length > 5) {
    response.components = response.components.slice(0, 5);
  }

  return response;
}
```

### 6.5.4 Streaming 适配：text streaming + component batching


![generated-image-1776441063383.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4151215a36184fe5b12a34a6c8e5f7a4~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1376&h=768&s=345649&e=jpg&b=fdf9f8)

结构化 UI 组件与流式输出之间存在天然矛盾：**Markdown 文字可以逐 Token 到达**，但**组件必须拿到完整 JSON 才能渲染**（否则一个半截的 `form` 或 `selection` 根本没法用）。实践下来最顺手的折中方案是 **"text streaming + component batching"**——文字流着走，组件整包发。

    ┌────────────────────────────────────────────────┐
    │  Markdown 内容：逐 Token 流式输出              │
    │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
    │  → 用户立即看到 AI 思考过程                    │
    │                                                │
    │  UI 组件：完整 JSON 到达后批量渲染             │
    │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    │
    │  ┃ [Selection] [Form] [Confirmation]     ┃    │
    │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    │
    │  → 组件需要完整数据才能正常工作                │
    └────────────────────────────────────────────────┘

下面按照实际架构的六个关键改造点展开说明，串起从**协议 → 后端编排 → SSE 传输 → 前端状态 → 渲染 → 进度指示**的完整流程。

#### ① 流式协议设计（`ui-types.ts`）

先定义一个统一的**流式消息信封**，让后端所有推送都走同一个通道，前端只需要根据 `messageType` 做分发。

```tsx
// services/chat/src/llm/ui-protocol/ui-types.ts
export interface StreamMessage {
  messageType: 'markdown' | 'ui' | 'meta' | 'progress' | 'done' | 'error';
  timestamp: string;
  payload:
    | MarkdownPayload
    | UIPayload
    | MetaPayload
    | ProgressPayload
    | ErrorPayload
    | null;
}

// Markdown 载荷 —— 支持流式片段
export interface MarkdownPayload {
  content: string;
  isChunk: boolean;       // 标记是否为流式片段（增量累积）
  messageId?: string;
}

// UI 载荷 —— 完整批量渲染
export interface UIPayload {
  messageId: string;
  components: UIResponse[];         // 完整组件数组
  thinking?: string;
  interactionState?: ComponentInteractionState;
}
```

**这一层带来的变化**：

*   消息类型清晰分离，`markdown` / `ui` / `progress` 各走各的载荷
*   `isChunk: true` 明确告诉前端"这是一段增量，请累加"
*   UI 组件作为独立载荷，与 Markdown 解耦，互不干扰

#### ② 后端流式编排（`orchestrator.service.ts`）

关键是区分两类 Agent：**JSON Agent 静默收集**、**Markdown Agent 逐 Token 推送**。

```tsx
// services/chat/src/llm/orchestrator.service.ts
async *streamOrchestrate(...): AsyncGenerator<OrchestratorStreamEvent> {
  // Phase 1: JSON Agent（extractAgent / clarifyAgent）不对外流式显示
  for await (const chunk of extractStream) {
    extractRaw += chunk;  // 静默收集，不 yield
  }

  // Phase 2: Markdown Agent（analysisAgent / riskAgent / summaryAgent）逐 Token 推送
  const analysisStream = await agents.analysis.stream(...);
  for await (const chunk of analysisStream) {
    analysisResult += content;
    yield { type: 'token', content, agent: 'analysisAgent' };
  }

  // Phase 3: UI 组件整包返回（必须等完整数据）
  yield {
    type: 'final',
    result: {
      responseType: 'ui',
      uiResponse: selectionResponse,
    },
  };
}
```

**取舍理由**：

*   **JSON Agent 不流式**：半截 JSON 既不可读也不可解析，推给前端只会造成混乱
*   **Markdown Agent 流式**：文字天然适合逐字符渲染，越早显示越能降低感知延迟
*   **`agent_start` / `agent_end` 事件**：驱动前端进度条，让黑盒变白盒

#### ③ SSE 流式传输（`conversation.controller.ts`）

用 Server-Sent Events 作为长连接载体，一个连接上混传 `markdown` / `ui` / `progress` / `done` 多种消息类型。

```tsx
// services/chat/src/conversation/conversation.controller.ts
res.flushHeaders();  // 立即建立流式连接
let persistedContent = '';

for await (const event of stream) {
  switch (event.type) {
    case 'token': {
      const chunk: StreamMessage = {
        messageType: 'markdown',
        timestamp: new Date().toISOString(),
        payload: { content: event.content, isChunk: true },
      };
      res.write(formatSSE(chunk));
      persistedContent += event.content;  // 累积完整内容，用于最终持久化
      break;
    }
    case 'agent_start': {
      const progress: StreamMessage = {
        messageType: 'progress',
        timestamp: new Date().toISOString(),
        payload: { agent, step, totalSteps, status: 'started' },
      };
      res.write(formatSSE(progress));
      break;
    }
    case 'final': {
      if (event.result.responseType === 'ui') {
        const uiMessage: StreamMessage = {
          messageType: 'ui',
          timestamp: new Date().toISOString(),
          payload: {
            messageId,
            components: event.result.uiResponse.messages,
            thinking: event.result.uiResponse.thinking,
          },
        };
        res.write(formatSSE(uiMessage));
      }
      break;
    }
  }
}
// 流结束后一次性落库，避免写入半截数据
await saveMessage({ content: persistedContent, ... });
```

**这一层带来的变化**：

*   **立即响应**：`flushHeaders()` 让连接毫秒级建立，不再是 30 秒黑盒等待
*   **进度可视化**：`progress` 事件串起 0% → 100% 的完整过程
*   **持久化时机**：累积到 `persistedContent` 后再入库，避免中间态污染

#### ④ 前端状态管理（`ai-ui.store.ts`）

Zustand store 把**流式消息**和**已完成消息**分开存，避免频繁修改 `messages` 数组导致整个列表重渲染。

```tsx
// clients/chat-web/src/stores/ai-ui.store.ts
updateStreamingMessage: (content, uiResponse) => set((state) => {
  const existing = state.streamingMessage || {
    id: `temp-${Date.now()}`,
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    isStreaming: true,
    messageType: 'markdown',
  };

  return {
    streamingMessage: {
      ...existing,
      content: existing.content + content,                      // Markdown 增量累积
      uiResponse: uiResponse || existing.uiResponse,            // UI 组件覆盖写入
      messageType: uiResponse ? 'ui' : existing.messageType,    // 动态切换类型
    },
    isStreaming: true,
  };
}),
```

**体验变化**：

*   **状态隔离**：`streamingMessage` 单独管理，React 只重渲染当前正在流的那条
*   **类型动态切换**：Markdown 阶段 → UI 阶段无缝过渡
*   **进度追踪**：`currentProgress` 独立字段，供进度条订阅

#### ⑤ 前端流式渲染（`ChatView.tsx`）

使用 `@microsoft/fetch-event-source` 解析 SSE，根据 `messageType` 分发到不同 store action。

```tsx
// clients/chat-web/src/views/ChatView.tsx
await fetchEventSource(`${CHAT_API_URL}/api/conversations/${activeSessionId}/chat`, {
  onmessage(event) {
    const msg = JSON.parse(event.data) as StreamMessage;

    switch (msg.messageType) {
      case 'markdown': {
        const payload = msg.payload as MarkdownPayload;
        appendToLastAssistantMessage(activeSessionId, payload.content);
        updateStreamingMessage(payload.content);  // 逐 Token 更新
        break;
      }
      case 'ui': {
        const uiPayload = msg.payload as UIPayload;
        updateStreamingMessage('', {
          messages: uiPayload.components,         // 完整组件批量渲染
          thinking: uiPayload.thinking,
        });
        break;
      }
      case 'progress': {
        const p = msg.payload as ProgressPayload;
        setProgress({ agent: p.agent, step: p.step, totalSteps: p.totalSteps, status: p.status });
        break;
      }
      case 'done':
        finalizeAIUIStreaming();  // 把 streamingMessage 合并进 messages
        break;
    }
  },
  onerror(err) {
    // 优雅降级：关闭流、提示用户重试
  },
});
```

**这一层带来的变化**：

*   **渐进式渲染**：Markdown 逐字符显示，用户立刻看到回复在"打字"
*   **组件原子化**：UI 组件一次性渲染，避免中间态闪烁
*   **错误恢复**：`onerror` 统一处理网络异常，不会把半截对话留在页面上

#### ⑥ 进度指示器（`ThinkingIndicator.tsx`）

进度条是把"多 Agent 流水线"这件事可视化给用户看的关键组件。


![image 12.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d0d59efe2c674feea967ea2327fde8fd~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1836&h=1330&s=113324&e=png&b=060607)

```tsx
// clients/chat-web/src/components/ai-ui/ThinkingIndicator.tsx
export function ThinkingIndicator({ progress }) {
  const percentage = progress ? (progress.step / progress.totalSteps) * 100 : 0;

  return (
    <div>
      {/* 动态显示当前 Agent 名称 */}
      <div>{progress ? progress.agentDisplayName : 'AI 正在思考中'}</div>

      {/* 进度条 */}
      {progress && (
        <div style={{ width: `${percentage}%` }}>
          {/* 渐变动画 + 脉冲效果 */}
        </div>
      )}

      {/* 百分比徽章 */}
      <div>{Math.round(percentage)}%</div>
    </div>
  );
}
```

**体验变化**：

*   **实时进度**："需求提取 → 澄清判断 → 多维度分析 → 风险评估 → 综合报告"五阶段清晰可见
*   **视觉反馈**：0% → 20% → 40% → 60% → 80% → 100% 每一步都有反馈
*   **无内容时的兜底**：脉冲动画 + 滑动光带，避免空白焦虑

#### 优化前 vs 优化后

| **阶段**        | **❌ 优化前（一次性返回）** | **✅ 优化后（分段流式）**          |
| ------------- | ---------------- | ------------------------ |
| 发送消息后的 0\~5 秒 | 黑盒等待，无任何反馈       | 进度条 0%，"需求提取中..."        |
| 5\~15 秒       | 继续等待             | 进度条推进到 40%，Markdown 逐字输出 |
| 15\~30 秒      | 继续等待             | 80% → 100%，UI 组件整包渲染，可交互 |
| 用户感受          | 😰 卡住了？崩溃了？要等多久？ | ✅ 看得到进度、看得到内容、能马上操作      |

#### 关键设计取舍

| **维度**         | **设计决策**        | **理由**                     |
| -------------- | --------------- | -------------------------- |
| JSON Agent     | 不流式显示，静默收集      | 中间 JSON 不可读、不可解析，暴露反而降低专业感 |
| Markdown Agent | 逐 Token 流式      | 提供即时反馈，显著降低感知延迟            |
| UI 组件          | 整包批量渲染          | 组件需完整数据（如表单字段、选项列表）才能正常工作  |
| 进度通知           | 5 步 Pipeline 事件 | 把多 Agent 链路的"黑盒"可视化，增强透明度  |
| 持久化时机          | 流式结束后一次性写入      | 避免半截数据污染数据库，同时减少写入次数       |

#### 性能优化亮点

1.  **前端状态分离**：`streamingMessage` 与 `messages` 解耦，避免每个 Token 都触发整个消息列表的重渲染
2.  **后端流式缓冲**：`persistedContent` 累积完整内容后一次性落库，减少数据库写入次数
3.  **SSE 长连接复用**：单个连接承载 `markdown` / `ui` / `progress` / `meta` 多种消息类型，免去多次 HTTP 握手开销
4.  **组件交互状态记录**：`interactionState` 记录用户已提交的操作，自动禁用对应组件，防止重复提交导致的数据一致性问题

<aside>

⚠️ **关于 Streaming 的取舍**

> 结构化 UI 组件与流式输出天然存在矛盾：组件需要完整数据才能渲染，而流式是逐步到达的。"text streaming + component batching" 是目前最稳妥的折中——文字流着走、组件整包发，用户先看到文字说明，再看到可操作的组件。这套方案在感知延迟、视觉稳定性、实现复杂度之间取得了较好的平衡。

</aside>

***

## 6.6 本章小结

![generated-image-1776441066478.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f53c1fbef585425680093ce9375b16aa~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1376&h=768&s=265330&e=jpg&b=fef9f9)

这一章围绕同一个核心目标——**让 AI 的输出从纯文本升级为可交互的 UI 指令**——把第五章已经落好的工程能力，进一步转化成了用户真正能感知、能操作、能完成任务的交互体验：

*   **UI 响应协议与 Structured Output 约束（6.2）**：定义了 text、selection、form、confirmation、card、steps、table、action\_buttons 等组件类型，用 `type` 作为前后端唯一的对齐点；再通过 LangChain 的 `withStructuredOutput` + Zod Schema，把模型输出约束成前端可以直接消费的结构。
*   **完整交互闭环（6.3）**：把需求分析过程拆成“选择类型 → 填写详情 → 确认提交 → 查看结果”四个阶段，让用户操作从自然语言输入变成结构化回传，系统可以沿着状态机稳定推进。
*   **前端组件渲染层（6.4）**：实现 `ComponentRenderer`、基础交互组件和 `AIChatContainer`，把后端返回的 UIResponse 真实渲染成可点、可填、可确认的界面，而不再只是展示一段文字。
*   **工程化与流式适配（6.5）**：补齐协议版本管理、未知组件降级、后处理校验，以及 **text streaming + component batching** 的流式策略，让 AI 在“即时反馈”和“稳定交互”之间取得平衡。

### **本章的核心收获**

*   **什么时候该让模型返回 UI 组件？（用“用户是否需要操作”判断）**
    *   需要**做选择**：比如选需求类型、选分析维度、选下一步动作。
    *   需要**补信息**：比如填写表单、补充约束、确认关键参数。
    *   需要**降低理解成本**：把“用户读一大段话再自己总结下一步”改成直接可点击、可提交、可确认的界面。
    *   反例：解释说明、开放问答、闲聊这类不要求立即操作的场景，继续返回纯文本往往更自然。
*   **什么时候该采用 text streaming + component batching？（用“内容是否支持增量渲染”判断）**
    *   **Markdown / 分析说明**天然适合逐 Token 流式输出，越早展示越能降低等待焦虑。
    *   **表单 / 选择器 / 确认框 / 表格**这类组件必须等完整 JSON 到达后再批量渲染，否则半截数据既不能展示也不能交互。
    *   **进度信息**适合独立成事件流，通过 `progress` 消息单独驱动进度条，而不是混在正文里。
    *   如果后续连组件本身也希望边生成边出现，那就说明当前协议已经不够，需要进一步设计增量 UI 协议。
*   **什么时候该把交互做成协议，而不是写死页面逻辑？（用“变化频率 vs. 复用范围”判断）**
    *   交互流程会**频繁变化**：今天是 selection → form，明天可能就变成 card + action\_buttons。
    *   同一套能力需要被**多个前端界面复用**：Web、桌面端、移动端，甚至不同团队的壳层。
    *   希望把“返回什么组件、如何推进流程”交给模型和上下文共同决定，而不是每新增一个分支就改一层前端判断。
    *   反例：长期稳定、页面固定、几乎不变化的简单表单页面，直接写死通常更省心。

<aside>

➡️ **后续章节预告**

到这里，模型已经不只是“会回答问题”，而是可以通过协议驱动前端交互了；前端也不再只是渲染 Markdown，而是能根据结构化结果动态呈现选择、表单、确认和进度。

但当前整条链路本质上仍然偏“固定流程”——用户输入一次，系统执行一轮，返回一个结果。下一章的方向是：当任务不再是固定流程时，Agent 应该如何自己决定“下一步做什么”？这就会进入 ReAct、Plan-and-Execute 等推理模式的实现。

</aside>

## 写在最后🧪

> 这里是**言萧凡的 AI 编程实验室**。 我会在这里持续记录和分享 **AI 工具、编程实践**，以及那些值得沉淀下来的高效工作方法。 不只聊概念，也尽量分享能直接上手、能够复用的经验。 希望这间小小的实验室，能陪你一起探索、实践和成长。**2026 年，一起进步。**

**有兴趣的话可以添加我的微信号一起交流，不仅是编程也可以是畅谈人生。**

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/71a8a41d62a644ee9f62ca44ad4313bb~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1083\&h=1464\&s=114406\&e=jpg\&b=fdfdfd)
