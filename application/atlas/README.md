# CloudPilot — `api/application/atlas/`

Runtime code map for Atlas / CloudPilot.

This README is intentionally about the **live code tree only**. It does **not**
document `doc/`.

## Current top-level layout

```text
api/application/atlas/
├── README.md
├── cloudPilot/
├── cloudPilotIntelligence/
├── providers/
├── config/
├── functions/
├── logic/
└── routes/
```

## Folder map

| Path | What it owns |
|------|---------------|
| `cloudPilot/` | Product orchestration: request state, actions, scans, execution modes, history, chat output |
| `cloudPilotIntelligence/` | Language understanding and AI context: Search, Question, Chat context, OpenAI request shaping |
| `providers/` | External integrations: Atlas, OpenAI, GitHub, plus AWS / Gmail scaffolds |
| `config/` | Feature flags, model config, and other runtime settings |
| `functions/` | Shared helpers and DB-backed utility classes |
| `logic/` | HTTP controller layer used by Express routes |
| `routes/` | Express route definitions |

## Key entry points

| File | Role |
|------|------|
| `logic/messages.js` | HTTP entry for CloudPilot chat messages |
| `routes/messageRoutes.js` | Wires message endpoints into Express |
| `cloudPilot/chat/cloudPilotMessageFunctions.js` | Main message pipeline orchestrator |
| `cloudPilotIntelligence/CloudPilotIntelligence.js` | Facade for understanding / chat intelligence |
| `providers/openAI/client/openAIClient.js` | OpenAI client, logging, and usage integration |
| `providers/atlas/client/atlasPost.js` | Shared Atlas HTTP POST helper |
| `cloudPilot/actionMap.js` | Registry of CloudPilot actions and match rules |

## `cloudPilot/`

```text
cloudPilot/
├── actionMap.js
├── actions/
├── capabilities/
├── chat/
├── execution/
├── executionModes/
├── history/
├── questions/
├── requests/
└── scans/
```

| Path | What it owns |
|------|---------------|
| `cloudPilot/actions/` | Mutation handlers such as create, delete, toggle, pause, resume, update tag |
| `cloudPilot/capabilities/` | Capability presentation helpers such as show-capabilities |
| `cloudPilot/chat/` | Conversation entry points, templates, and response shaping |
| `cloudPilot/execution/` | Step 6 execution orchestration and outcome handling |
| `cloudPilot/executionModes/` | Delivery modes: automatic, CLI, instructions, PR |
| `cloudPilot/history/` | History persistence, undo, and navigator shaping |
| `cloudPilot/questions/` | Grounded question fulfillment that must not go through general chat |
| `cloudPilot/requests/` | Request loading, naming, state transitions, workflow, `decideNextStep` |
| `cloudPilot/scans/` | Read-only handlers for EC2, S3, billing, inventory, AI usage |
| `cloudPilot/spending/` | Spending guardrails and decisions for billable services |

### Notable files under `cloudPilot/`

| File | Role |
|------|------|
| `cloudPilot/chat/cloudPilotMessageFunctions.js` | Runs the message pipeline |
| `cloudPilot/chat/CloudPilotMessage.js` | Final speaking layer |
| `cloudPilot/requests/decideNextStep.js` | Routes understanding into request / question / chat decisions |
| `cloudPilot/requests/workflow.js` | Store + execute request workflow bridge |
| `cloudPilot/execution/functions/executionFunctions.js` | Executes handlers and finishes request state |
| `cloudPilot/questions/openRequests.js` | Grounded open-requests response |
| `cloudPilot/spending/checkSpendingLimit.js` | Decides whether additional service spend is allowed |

## `cloudPilotIntelligence/`

```text
cloudPilotIntelligence/
├── CloudPilotIntelligence.js
├── context/
├── conversation/
├── explain/
├── generate/
├── improve/
├── respond/
└── understand/
```

| Path | What it owns |
|------|---------------|
| `cloudPilotIntelligence/context/` | Chat Identity, CURRENT STATE, Search situation blocks, system-message building |
| `cloudPilotIntelligence/conversation/` | General Chat AI call path |
| `cloudPilotIntelligence/understand/` | Message understanding: action, question, value, reply, conversation detection |
| `cloudPilotIntelligence/respond/` | Placeholder |
| `cloudPilotIntelligence/explain/` | Placeholder |
| `cloudPilotIntelligence/improve/` | Placeholder |
| `cloudPilotIntelligence/generate/` | Placeholder |

### Current understanding layout

```text
cloudPilotIntelligence/understand/
├── understandMessage.js
└── search/
    ├── helpers/
    ├── questions/
    ├── values/
    ├── searchMessageForAction.js
    ├── searchMessageForConversation.js
    ├── searchMessageForQuestion.js
    ├── searchMessageForReply.js
    └── searchMessageForValues.js
```

### Current context layout

```text
cloudPilotIntelligence/context/
├── buildContext.js
├── buildSystemMessage.js
├── classes/
└── contextTypes/
```

| File | Role |
|------|------|
| `cloudPilotIntelligence/context/contextTypes/cloudPilotContext.js` | General Chat identity |
| `cloudPilotIntelligence/context/contextTypes/cloudPilotCurrentStateContext.js` | Factual open-request CURRENT STATE |
| `cloudPilotIntelligence/context/contextTypes/cloudPilotSituationContext.js` | Search / task situation blocks |
| `cloudPilotIntelligence/context/contextTypes/currentQuestionContext.js` | Current user-message context |
| `cloudPilotIntelligence/context/contextTypes/organizationKnowledgeContext.js` | Optional product / org knowledge |

## `providers/`

```text
providers/
├── atlas/
│   ├── billing/
│   ├── client/
│   ├── ec2/
│   ├── inventory/
│   └── s3/
├── aws/
├── github/
├── gmail/
└── openAI/
    ├── client/
    └── usage/
```

| Path | What it owns |
|------|---------------|
| `providers/atlas/` | Thin Atlas-facing capability calls |
| `providers/openAI/` | OpenAI client plus usage / cost tracking |
| `providers/github/` | GitHub PR integration |
| `providers/aws/` | Scaffold for direct AWS providers |
| `providers/gmail/` | Scaffold |

## `config/`, `functions/`, `logic/`, `routes/`

### `config/`

| File | Role |
|------|------|
| `config/chatGPTconfig.js` | Model presets and token settings |
| `config/cloudPilotAIConfig.js` | Master AI flags and per-feature implementation switches |

### `functions/`

| File / folder | Role |
|---------------|------|
| `functions/atlasTimeFunctions.js` | Shared time helpers |
| `functions/instructionFunctions.js` | Instruction helpers |
| `functions/classes/Instruction.js` | Instruction data access |

### `logic/`

| File | Role |
|------|------|
| `logic/messages.js` | Message controller |
| `logic/aiUsage.js` | AI usage controller |
| `logic/instructions.js` | Instructions controller |

### `routes/`

| File | Role |
|------|------|
| `routes/messageRoutes.js` | Message routes |
| `routes/aiUsageRoutes.js` | AI usage routes |
| `routes/instructionRoutes.js` | Instruction routes |

## Pipeline mental model

```text
User message
  → logic/messages.js
  → cloudPilot/chat/cloudPilotMessageFunctions.js
      STEP 1  normalize
      STEP 2  load request
      STEP 3  understand         (cloudPilotIntelligence/understand/)
      STEP 4  decide             (cloudPilot/requests/decideNextStep.js)
      STEP 5  maintain request   (cloudPilot/requests/)
      STEP 6  execute / run      (cloudPilot/execution/ or immediate question path)
      STEP 7  speak              (cloudPilot/chat/)
```

## Notes

- Docs live under `doc/`, but are intentionally excluded from this README.
- Keep this as the single Atlas runtime layout README.
- If folders move again, update this file instead of adding more README files.
