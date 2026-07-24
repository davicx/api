# CloudPilot — `application/atlas/`

Live code for the CloudPilot message pipeline (`POST /message`). Docs live in `doc/` — this file is **code layout only**.

**One README for this tree.** Do not add per-folder READMEs under `logic/`, `routes/`, `services/`, `capabilities/`, or `functions/`.

**Message architecture:** [doc/development/architecture/code_cleanup.md](./doc/development/architecture/code_cleanup.md)

## Design principle

> **Every user message is exactly one conversation.**

---

## Mental model

### Message pipeline

```text
User Message → Understand → Decide → Conversation → Workflow → Capabilities → Atlas
```

Conversation (General or Request) is **one layer** — see [code_cleanup.md](./doc/development/architecture/code_cleanup.md).

### Glossary

| Term | Meaning |
|------|---------|
| **Request** | User wants CloudPilot to do something — row in `cloudpilot_requests` |
| **Action** | Thing CloudPilot knows how to do — `scan_ec2`, `toggle_ec2`, … in `actionMap.js` |
| **General Conversation** | User is just talking — not a request |
| **Request Conversation** | Orchestrates a request turn — state, work, speak (all request types) |
| **Information request** | Read-only work — scan, inventory. No change strategy. |
| **Change request** | Mutating work — toggle, create, delete. Strategy menu when ready. |
| **Change strategy** | How a change is applied — instructions, CLI, PR, automatic (user picks 1–4) |
| **CloudPilotMessage** | How CloudPilot speaks — single voice (templates today; engine later) |

Full model: [code_cleanup.md § Request types and change strategies](./doc/development/architecture/code_cleanup.md#request-types-and-change-strategies)

### First gate (after STEP 3 + 4)

| Path | What happens |
|------|----------------|
| **General Conversation** | `GeneralConversation` entry → return (skips Steps 5–6) |
| **Request Conversation** | Steps 5–7 — maintain state → perform work → speak |

### Four layers (don’t overlap)

| Layer | Question | Location |
|-------|----------|----------|
| **Conversation** | What are we trying to accomplish? | `services/conversation/` |
| **Workflow** | What needs to happen? | `conversation/request/workflow.js` |
| **Capabilities** | How? | `capabilities/` |
| **Atlas** | Where? | `capabilities/atlas/atlasPost.js` |

**Entry:** `logic/messages.js` → `services/cloudPilotMessageFunctions.js` (`processMessage`)

---

## Top-level folders

| Folder | Role |
|--------|------|
| `logic/` | HTTP handlers (`messages`, `aiUsage`, `todo`, `instructions`) |
| `routes/` | Express route definitions |
| `services/` | Orchestration — STEPS 1–7, actions, decision, speak |
| `capabilities/` | Thin HOW / WHERE — Atlas HTTP + scan/change wrappers |
| `functions/` | Shared helpers + ToDo / Instruction DB classes (non-pipeline) |
| `doc/` | Planning and reference docs (not runtime) |

---

## `services/` — orchestration (by pipeline step)

Orchestrator: `cloudPilotMessageFunctions.js` — STEPS 1–7 (`processMessage`).

| Folder | Role | Pipeline step |
|--------|------|----------------|
| `actions/` | Action registry + handlers | Handlers at STEP 6 |
| `aiUsage/` | Persist OpenAI usage + summary queries | After OpenAI / `show_ai_usage` |
| `conversation/` | General + Request + CloudPilotMessage | STEP 4 exit / STEP 7 |
| `change/` | Strategies 1–4 + CLI/PR helpers | STEP 6 (automatic) / STEP 7 (1–3) |
| `context/` | Identity / Situation / Knowledge for AI | Speak / enhancements |
| `engines/llm/` | OpenAI SDK + cost helper | Completions; usage save |
| `config/` | Chat / OpenAI flags + GitHub client | Config |
| `decision/` | Decide which conversation | **STEP 4** |
| `executions/` | Perform work (Request Conversation) | **STEP 6** |
| `history/` | Change history + undo | **STEP 6B** |
| `navigator/` | Navigator / dashboard shaping | Response shaping |
| `requests/` | Request state persistence | **STEP 2**, **STEP 5** |
| `understanding/` | Intent + entity extraction | **STEP 3** |

**Rules of thumb**

| Area | Role |
|------|------|
| `conversation/` | Conversation systems + CloudPilotMessage (speak) + templates |
| `change/strategies/` | How mutating actions apply (modes 1–4) |
| `engines/llm/*` | LLM vendor SDKs — implementation only |
| `executions/outcomes/` | Handler execution outcome copy |

**Symmetry:** `general/workflow.js` no-op stub. `request/workflow.js` — `store()` + `execute()`.

### Pipeline flow

```text
cloudPilotMessageFunctions.js
  STEP 1–4  normalize → load → understand → decide

  General Conversation? → GeneralConversation → CloudPilotMessage → return

  STEP 5  Request Conversation — maintain state   (requests/)
  STEP 6  Request Conversation — perform work    (executions/)
  STEP 7  Request Conversation — speak           (RequestConversation → CloudPilotMessage)
```

Change strategies apply only to **change** actions (`actionTier: destructive` with `executionModes` in `actionMap.js`).

---

## `capabilities/` — HOW / WHERE

Thin functions that call Atlas or OpenAI — one entry point per product action. Handlers in `services/actions/` import from here for HOW.

```text
capabilities/
├── scans/          scanEC2, scanS3
├── changes/        changeEC2.js (toggleEC2, createEC2, deleteEC2)
├── inventory/      getAllResources
├── billing/        getBillingSummary
├── conversation/   generalChat
└── atlas/          atlasPost.js    ← how we POST to Atlas
```

| Folder | What it is |
|--------|------------|
| `scans/` | Analyze AWS (no history row) |
| `changes/` | Change AWS — toggle, create, delete (history at STEP 6B) |
| `inventory/` | List what exists |
| `billing/` | AWS cost summary |
| `conversation/` | General chat via OpenAI |
| `atlas/` | Shared Atlas HTTP helper — not a product action |

**Rules**

- Capabilities return structured results — no request rows, no chat copy, no history inserts.
- `saveHistory()` stays in `services/executions/functions/executionFunctions.js` (STEP 6B).
- Handlers stay in `services/actions/`; they delegate here for HOW.

---

## Folder tree — current (code only)

```text
application/atlas/
├── README.md
├── logic/
│   ├── messages.js
│   ├── aiUsage.js
│   ├── todo.js
│   └── instructions.js
├── routes/
│   ├── messageRoutes.js
│   ├── aiUsageRoutes.js
│   ├── todoRoutes.js
│   └── instructionRoutes.js
├── functions/
│   ├── atlasTimeFunctions.js
│   ├── toDoFunctions.js
│   ├── instructionFunctions.js
│   └── classes/
│       ├── ToDo.js
│       └── Instruction.js
├── capabilities/
│   ├── atlas/atlasPost.js
│   ├── billing/getBillingSummary.js
│   ├── changes/changeEC2.js
│   ├── conversation/generalChat.js
│   ├── inventory/getAllResources.js
│   └── scans/
│       ├── scanEC2.js
│       └── scanS3.js
└── services/
    ├── cloudPilotMessageFunctions.js
    ├── actions/
    │   ├── actionMap.js
    │   ├── aiUsage/
    │   │   ├── showAiUsageHandler.js
    │   │   └── aiUsageMessageBuilder.js
    │   ├── aws/
    │   │   ├── atlasAWSFunctions.js
    │   │   ├── billingAWS/
    │   │   │   ├── billingAWSHandler.js
    │   │   │   ├── atlasBillingFunctions.js
    │   │   │   ├── atlasAWSBillingMessage.js
    │   │   │   └── atlasAWSBillingNavigator.js
    │   │   └── inventoryAWS/
    │   │       ├── inventoryAWSHandler.js
    │   │       ├── atlasAWSInventoryFormatter.js
    │   │       ├── atlasAWSInventoryMessageBuilder.js
    │   │       └── atlasAWSInventoryNavigatorAdapter.js
    │   ├── ec2/
    │   │   ├── atlasEC2Functions.js
    │   │   ├── createEC2/createEC2Handler.js
    │   │   ├── deleteEC2/deleteEC2Handler.js
    │   │   ├── toggleEC2/toggleEC2Handler.js
    │   │   ├── updateEC2Tag/updateEC2TagHandler.js
    │   │   └── scanEC2/
    │   │       ├── scanEC2Handler.js
    │   │       ├── atlasEC2Formatter.js
    │   │       ├── atlasEC2MessageBuilder.js
    │   │       └── atlasEC2ScanNavigatorAdapter.js
    │   └── s3/
    │       ├── atlasS3Functions.js
    │       └── scanS3/
    │           ├── scanS3Handler.js
    │           ├── atlasS3Formatter.js
    │           ├── atlasS3MessageBuilder.js
    │           └── atlasS3ScanNavigatorAdapter.js
    ├── aiUsage/
    │   ├── classes/AiUsage.js
    │   └── functions/saveAiUsage.js
    ├── conversation/
    │   ├── CloudPilotMessage.js
    │   ├── templates/
    │   │   ├── fieldPromptExamples.js
    │   │   └── requestTemplates.js
    │   ├── general/
    │   │   ├── GeneralConversation.js
    │   │   └── workflow.js
    │   └── request/
    │       ├── RequestConversation.js
    │       └── workflow.js
    ├── change/
    │   ├── strategies/
    │   │   ├── automatic.js
    │   │   ├── cli.js
    │   │   ├── instructions.js
    │   │   └── pr.js
    │   ├── cli/cliTemplates.js
    │   └── pr/
    │       ├── createToggleEc2PullRequest.js
    │       └── prTemplates.js
    ├── context/
    │   ├── buildAIContext.js
    │   ├── buildAISystemMessage.js
    │   ├── contextTypes/
    │   │   ├── cloudPilotContext.js
    │   │   ├── currentQuestionContext.js
    │   │   └── organizationKnowledgeContext.js
    │   ├── classes/
    │   │   ├── ConversationHistoryContext.js
    │   │   └── CurrentQuestionContext.js
    │   └── temp.js                        ← scratch / not wired
    ├── engines/llm/openai/
    │   ├── openAIFunctions.js
    │   └── calculateOpenAICost.js
    ├── config/
    │   ├── chatGPTconfig.js
    │   ├── openAIChatConfig.js
    │   └── github/githubClient.js
    ├── decision/
    │   ├── decideNextStep.js
    │   └── decisionTypes.js
    ├── executions/
    │   ├── AtlasExecution.js
    │   ├── outcomes/outcomeRegistry.js
    │   └── functions/
    │       ├── executionFunctions.js
    │       └── runAction.js
    ├── history/
    │   ├── classes/History.js
    │   ├── undoRegistry.js
    │   ├── historyNavigatorAdapter.js
    │   ├── functions/
    │   │   ├── historyFunctions.js
    │   │   ├── historyActionNameFunctions.js
    │   │   └── undoFunctions.js
    │   └── historyBuilders/
    │       ├── toggleEc2History.js
    │       ├── createEc2History.js
    │       └── ec2History.js
    ├── navigator/functions/navigatorFunctions.js
    ├── requests/
    │   ├── classes/
    │   │   ├── Request.js
    │   │   └── ActionState.js
    │   └── functions/
    │       ├── requestFunctions.js
    │       ├── requestLoadFunctions.js
    │       ├── requestNameFunctions.js
    │       └── requestStatusFunctions.js
    └── understanding/
        ├── understandMessage.js
        └── search/
            ├── searchMessageForAction.js
            ├── searchMessageForConversation.js
            ├── searchMessageForReply.js
            ├── searchMessageForValues.js
            ├── searchMessageForStructuredFields.js
            ├── searchMessageForRegion.js
            ├── searchMessageForInstanceId.js
            ├── searchMessageForInstanceType.js
            ├── searchMessageForName.js
            └── searchMessageForTagUpdate.js
```

---

## File reference (one line each)

### Entry & routing

| File | What it does |
|------|----------------|
| `logic/messages.js` | Wires `POST /message` to `processMessage` and shapes the HTTP response. |
| `logic/aiUsage.js` | HTTP handler for AI usage summary. |
| `logic/todo.js` | HTTP handlers for To Do CRUD. |
| `logic/instructions.js` | HTTP handlers for Instructions mode. |
| `routes/messageRoutes.js` | Express routes for CloudPilot messages. |
| `routes/aiUsageRoutes.js` | `GET /ai/usage/summary`. |
| `routes/todoRoutes.js` | To Do routes. |
| `routes/instructionRoutes.js` | Instructions routes. |

### Shared (`functions/`)

| File | What it does |
|------|----------------|
| `functions/atlasTimeFunctions.js` | Shared time/formatting helpers for Atlas features. |
| `functions/toDoFunctions.js` | To Do response builders and checks. |
| `functions/instructionFunctions.js` | Instruction helpers. |
| `functions/classes/ToDo.js` | To Do DB class. |
| `functions/classes/Instruction.js` | Instruction DB class. |

### Capabilities (`capabilities/`)

| File | What it does |
|------|----------------|
| `capabilities/atlas/atlasPost.js` | Posts JSON to Atlas HTTP routes. |
| `capabilities/changes/changeEC2.js` | Thin entry for EC2 create, delete, and toggle. |
| `capabilities/conversation/generalChat.js` | Capability wrapper for general chat (stub). |
| `capabilities/inventory/getAllResources.js` | Thin entry for full AWS inventory. |
| `capabilities/billing/getBillingSummary.js` | Thin entry for AWS billing summary. |
| `capabilities/scans/scanEC2.js` | Thin entry for EC2 scan. |
| `capabilities/scans/scanS3.js` | Thin entry for S3 scan. |

### Orchestrator

| File | What it does |
|------|----------------|
| `services/cloudPilotMessageFunctions.js` | Runs STEPS 1–7 for every user message (`processMessage`). |

### Actions (`services/actions/`)

| File | What it does |
|------|----------------|
| `actionMap.js` | Registry of all actions — match rules, tiers, handlers, messages. |
| `aiUsage/showAiUsageHandler.js` | Immediate handler for `show_ai_usage`. |
| `aiUsage/aiUsageMessageBuilder.js` | Chat copy for OpenAI usage summary. |
| `aws/atlasAWSFunctions.js` | Legacy Atlas HTTP for inventory. |
| `aws/billingAWS/billingAWSHandler.js` | STEP 6 handler for `show_billing`. |
| `aws/billingAWS/atlasBillingFunctions.js` | Calls billing capability. |
| `aws/billingAWS/atlasAWSBillingMessage.js` | Builds AWS billing chat text. |
| `aws/billingAWS/atlasAWSBillingNavigator.js` | Maps billing to Navigator. |
| `aws/inventoryAWS/inventoryAWSHandler.js` | STEP 6 handler for `inventory_aws`. |
| `aws/inventoryAWS/atlasAWSInventoryFormatter.js` | Normalizes Atlas inventory payload. |
| `aws/inventoryAWS/atlasAWSInventoryMessageBuilder.js` | Inventory chat summary. |
| `aws/inventoryAWS/atlasAWSInventoryNavigatorAdapter.js` | Inventory → Navigator tables. |
| `ec2/atlasEC2Functions.js` | Legacy Atlas HTTP for EC2 mutations. |
| `ec2/createEC2/createEC2Handler.js` | STEP 6 handler for `create_ec2`. |
| `ec2/deleteEC2/deleteEC2Handler.js` | STEP 6 handler for `delete_ec2`. |
| `ec2/toggleEC2/toggleEC2Handler.js` | STEP 6 handler for `toggle_ec2`. |
| `ec2/updateEC2Tag/updateEC2TagHandler.js` | STEP 6 handler for `update_ec2_tag`. |
| `ec2/scanEC2/scanEC2Handler.js` | STEP 6 handler for `scan_ec2`. |
| `ec2/scanEC2/atlasEC2Formatter.js` | Normalizes Atlas EC2 scan payload. |
| `ec2/scanEC2/atlasEC2MessageBuilder.js` | EC2 scan chat copy. |
| `ec2/scanEC2/atlasEC2ScanNavigatorAdapter.js` | EC2 scan → Navigator. |
| `s3/atlasS3Functions.js` | Legacy Atlas HTTP for S3 scan. |
| `s3/scanS3/scanS3Handler.js` | STEP 6 handler for `scan_s3`. |
| `s3/scanS3/atlasS3Formatter.js` | Normalizes Atlas S3 scan payload. |
| `s3/scanS3/atlasS3MessageBuilder.js` | S3 scan chat copy. |
| `s3/scanS3/atlasS3ScanNavigatorAdapter.js` | S3 scan → Navigator. |

### AI usage (`services/aiUsage/`)

| File | What it does |
|------|----------------|
| `classes/AiUsage.js` | Insert + summary aggregates for `ai_usage`. |
| `functions/saveAiUsage.js` | Map OpenAI `usage` → cost → insert (never fails chat). |

### Conversation (`services/conversation/`)

| File | What it does |
|------|----------------|
| `CloudPilotMessage.js` | Outgoing words — general speak, request templates, passthrough. |
| `templates/fieldPromptExamples.js` | Examples for missing required fields. |
| `templates/requestTemplates.js` | Deterministic request workflow messages. |
| `general/GeneralConversation.js` | General Conversation entry after STEP 4. |
| `general/workflow.js` | Placeholder for general-side workflow hooks. |
| `request/RequestConversation.js` | Request speak routing. |
| `request/workflow.js` | Thin STEP 5 (`store`) and STEP 6 (`execute`) passthrough. |

### Change (`services/change/`)

| File | What it does |
|------|----------------|
| `strategies/automatic.js` | Strategy 4 — run handler via `runAction`. |
| `strategies/instructions.js` | Strategy 1 — instructions delivery. |
| `strategies/cli.js` | Strategy 2 — CLI delivery. |
| `strategies/pr.js` | Strategy 3 — PR delivery (toggle EC2 live). |
| `cli/cliTemplates.js` | CLI strategy copy. |
| `pr/createToggleEc2PullRequest.js` | Opens GitHub PR for toggle_ec2. |
| `pr/prTemplates.js` | PR strategy chat copy. |

### Context (`services/context/`)

| File | What it does |
|------|----------------|
| `buildAIContext.js` | Assembles Identity + Situation + Knowledge. |
| `buildAISystemMessage.js` | Renders context into English system message. |
| `contextTypes/cloudPilotContext.js` | Type 1 — Identity data. |
| `contextTypes/currentQuestionContext.js` | Type 2 — Situation data. |
| `contextTypes/organizationKnowledgeContext.js` | Type 3 — Org knowledge (often empty). |
| `classes/ConversationHistoryContext.js` | Loads recent messages for OpenAI history. |
| `classes/CurrentQuestionContext.js` | Situation builder for this turn. |
| `temp.js` | Scratch paste of context stack — **not wired**. |

### Engines & config

| File | What it does |
|------|----------------|
| `engines/llm/openai/openAIFunctions.js` | OpenAI client + chat completion (+ usage save hook). |
| `engines/llm/openai/calculateOpenAICost.js` | Estimated USD from model + tokens. |
| `config/chatGPTconfig.js` | Model IDs, temperatures, token ceilings. |
| `config/openAIChatConfig.js` | Live send, history, AI enhancement feature flags. |
| `config/github/githubClient.js` | GitHub API for PR strategy. |

### Decision (`services/decision/`)

| File | What it does |
|------|----------------|
| `decideNextStep.js` | STEP 4 — conversation type, request updates, response.type. |
| `decisionTypes.js` | Constants for `chatType`, `response.type`, action events. |

### Executions (`services/executions/`)

| File | What it does |
|------|----------------|
| `functions/executionFunctions.js` | STEP 6 orchestration — run, finish request, save history. |
| `functions/runAction.js` | Resolves handler from `actionMap` and invokes it. |
| `outcomes/outcomeRegistry.js` | Maps error codes to friendly user messages. |
| `AtlasExecution.js` | Legacy path for execution events in templates. |

### History (`services/history/`)

| File | What it does |
|------|----------------|
| `classes/History.js` | MySQL CRUD for `cloudpilot_history`. |
| `functions/historyFunctions.js` | `saveHistory` and `getLatestUndoable`. |
| `functions/historyActionNameFunctions.js` | Display / record names for history rows. |
| `functions/undoFunctions.js` | Runs undo from latest undoable row (STEP 6). |
| `historyBuilders/toggleEc2History.js` | History + undo_payload for toggle_ec2. |
| `historyBuilders/createEc2History.js` | History + undo_payload for create_ec2. |
| `historyBuilders/ec2History.js` | History builders for other EC2 changes (e.g. tag). |
| `historyNavigatorAdapter.js` | History → Navigator shaping. |
| `undoRegistry.js` | Maps `undo_payload.type` to reverse handler. |

### Navigator (`services/navigator/`)

| File | What it does |
|------|----------------|
| `functions/navigatorFunctions.js` | Assembles `navigatorResponse` stats and tables for Kite. |

### Requests (`services/requests/`)

| File | What it does |
|------|----------------|
| `classes/Request.js` | MySQL CRUD for `cloudpilot_requests`. |
| `classes/ActionState.js` | In-memory request state fallback for tests. |
| `functions/requestFunctions.js` | Applies STEP 4 decision — start, update, finish, cancel. |
| `functions/requestLoadFunctions.js` | STEP 2 — loads open request for a conversation. |
| `functions/requestNameFunctions.js` | Request display / internal naming. |
| `functions/requestStatusFunctions.js` | Rules for `waiting_on_fields`, confirmation, etc. |

### Understanding (`services/understanding/`)

| File | What it does |
|------|----------------|
| `understandMessage.js` | STEP 3 — runs extractors → unified understanding. |
| `search/searchMessageForAction.js` | Detects which action the user wants. |
| `search/searchMessageForConversation.js` | Detects list_open, status, focus_switch, undo, etc. |
| `search/searchMessageForReply.js` | Detects yes, cancel, and execution mode 1–4. |
| `search/searchMessageForValues.js` | Merges bare values into collected fields. |
| `search/searchMessageForStructuredFields.js` | Parses `field: "value"` structured input. |
| `search/searchMessageForRegion.js` | Extracts AWS region. |
| `search/searchMessageForInstanceId.js` | Extracts EC2 instance ID(s). |
| `search/searchMessageForInstanceType.js` | Extracts instance type (e.g. t3.micro). |
| `search/searchMessageForName.js` | Extracts resource / request name. |
| `search/searchMessageForTagUpdate.js` | Extracts tag update fields. |

---

## Pipeline (one message)

```text
routes/messageRoutes.js
  → logic/messages.js
  → cloudPilotMessageFunctions.processMessage()
       STEP 1  normalize
       STEP 2  load request
       STEP 3  understand
       STEP 4  decide

       General Conversation?
           → GeneralConversation → CloudPilotMessage  → return

       STEP 5  Request Conversation — maintain state   (requests/)
       STEP 6  Request Conversation — perform work    (executions/)
       STEP 7  Request Conversation — speak           (RequestConversation → CloudPilotMessage)
```

---

## Capability wiring (live vs legacy)

| Action | RUN (handler) | HOW (capability) |
|--------|---------------|------------------|
| `scan_ec2` | `scanEC2Handler` | ✅ `scans/scanEC2.js` |
| `toggle_ec2` | `toggleEC2Handler` | ✅ `changes/changeEC2.toggleEC2` |
| `create_ec2` | `createEC2Handler` | ⚠️ `atlasEC2Functions` |
| `delete_ec2` | `deleteEC2Handler` | ⚠️ `atlasEC2Functions` |
| `scan_s3` | `scanS3Handler` | ⚠️ `atlasS3Functions` |
| `inventory_aws` | `inventoryAWSHandler` | ⚠️ `atlasAWSFunctions` |
| `show_billing` | `billingAWSHandler` | ✅ `billing/getBillingSummary.js` |
| `show_ai_usage` | `showAiUsageHandler` | local `ai_usage` (not Atlas) |
| `general_chat` | — (not STEP 6) | ⚠️ stub; engine in `engines/llm/openai/` |

---

## Related docs

| Path | Focus |
|------|--------|
| [doc/understanding_actions.md](./doc/understanding_actions.md) | STEP 3 understanding — actions & input types |
| [doc/development/architecture/code_cleanup.md](./doc/development/architecture/code_cleanup.md) | Message architecture |
| [doc/development/architecture/architecture.md](./doc/development/architecture/architecture.md) | Full system reference |
| [doc/development/architecture/action_map.md](./doc/development/architecture/action_map.md) | WHAT / WHEN / RUN / HOW / WHERE |
| [doc/development/architecture/capability_migration.md](./doc/development/architecture/capability_migration.md) | Capability layer plan |
| [doc/development/cloud_pilot_chat.md](./doc/development/cloud_pilot_chat.md) | AI enhancements |
| [doc/development/ai_usage.md](./doc/development/ai_usage.md) | OpenAI usage tracking |
| [doc/development/long_term/to_do.md](./doc/development/long_term/to_do.md) | Backlog |
| [doc/development/long_term/finished.md](./doc/development/long_term/finished.md) | Shipped work |
