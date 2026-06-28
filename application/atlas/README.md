# CloudPilot — `application/atlas/`

Live code for the CloudPilot message pipeline (`POST /message`). Docs live in `doc/` — this file is **code layout only**.

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
| **Conversation** | What are we trying to accomplish? | `services/conversation/` (target) |
| **Workflow** | What needs to happen? | `conversation/request/workflow.js` |
| **Capabilities** | How? | `capabilities/` |
| **Atlas** | Where? | `capabilities/atlas/atlasPost.js` |

**Entry:** `logic/messages.js` → `services/cloudPilotMessageFunctions.js` (`processMessage`)

---

## Folder tree — current (code only)

```text
application/atlas/
├── README.md
├── logic/
│   └── messages.js                         ← POST /message handler
├── routes/
│   └── messageRoutes.js                    ← Express route for /message
├── capabilities/                           ← HOW + WHERE (thin execution surface)
│   ├── README.md
│   ├── atlas/
│   │   └── atlasPost.js                    ← HTTP client to Atlas API
│   ├── changes/
│   │   └── changeEC2.js                    ← EC2 create / delete / toggle
│   ├── conversation/
│   │   └── generalChat.js                  ← general chat capability (stub)
│   ├── inventory/
│   │   └── getAllResources.js              ← AWS inventory scan
│   └── scans/
│       ├── scanEC2.js                      ← EC2 scan capability
│       └── scanS3.js                       ← S3 scan capability
└── services/
    ├── README.md
    ├── cloudPilotMessageFunctions.js       ← orchestrator (processMessage STEPS 1–7)
    ├── actions/
    │   ├── actionMap.js                      ← static action definitions
    │   ├── aws/
    │   │   ├── atlasAWSFunctions.js        ← legacy Atlas calls for AWS inventory
    │   │   └── inventoryAWS/
    │   │       ├── inventoryAWSHandler.js
    │   │       ├── atlasAWSInventoryFormatter.js
    │   │       ├── atlasAWSInventoryMessageBuilder.js
    │   │       └── atlasAWSInventoryNavigatorAdapter.js
    │   ├── ec2/
    │   │   ├── atlasEC2Functions.js        ← legacy Atlas calls for EC2 mutations
    │   │   ├── createEC2/createEC2Handler.js
    │   │   ├── deleteEC2/deleteEC2Handler.js
    │   │   ├── scanEC2/
    │   │   │   ├── scanEC2Handler.js
    │   │   │   ├── atlasEC2Formatter.js
    │   │   │   ├── atlasEC2MessageBuilder.js
    │   │   │   └── atlasEC2ScanNavigatorAdapter.js
    │   │   └── toggleEC2/toggleEC2Handler.js
    │   └── s3/
    │       ├── atlasS3Functions.js         ← legacy Atlas calls for S3 scan
    │       └── scanS3/
    │           ├── scanS3Handler.js
    │           ├── atlasS3Formatter.js
    │           ├── atlasS3MessageBuilder.js
    │           └── atlasS3ScanNavigatorAdapter.js
    ├── conversation/
    │   ├── CloudPilotMessage.js            ← single speak voice (templates + future engine)
    │   ├── templates/
    │   │   ├── fieldPromptExamples.js      ← missing-field prompt copy
    │   │   └── requestTemplates.js         ← request workflow UX copy
    │   ├── general/
    │   │   ├── GeneralConversation.js      ← STEP 7 entry (general path)
    │   │   └── workflow.js                 ← no-op stub (symmetry)
    │   └── request/
    │       ├── RequestConversation.js      ← STEP 7 routing (request path)
    │       └── workflow.js                 ← STEP 5–6 store + execute
    ├── change/
    │   └── strategies/                     ← change actions only (options 1–4)
    │       ├── automatic.js                ← STEP 6 — run handler
    │       ├── cli.js                      ← STEP 7 — CLI strategy stub
    │       ├── instructions.js             ← STEP 7 — instructions stub
    │       └── pr.js                       ← STEP 7 — PR strategy stub
    ├── engines/
    │   └── llm/
    │       └── openai/
    │           └── openAIFunctions.js      ← OpenAI SDK + chat helpers
    ├── config/
    │   └── chatGPTconfig.js                ← model names and token limits
    ├── decision/
    │   ├── decideNextStep.js               ← STEP 4
    │   └── decisionTypes.js                ← chatType and response.type constants
    ├── executions/
    │   ├── AtlasExecution.js               ← legacy execution path
    │   ├── outcomes/
    │   │   └── outcomeRegistry.js          ← friendly handler error/success copy
    │   └── functions/
    │       ├── executionFunctions.js         ← STEP 6 + 6B history
    │       └── runAction.js                ← lookup handler and call capability
    ├── history/
    │   ├── classes/History.js              ← cloudpilot_history DB CRUD (A4 list recent → planned)
    │   ├── functions/
    │   │   ├── historyFunctions.js         ← saveHistory, getLatestUndoable
    │   │   └── undoFunctions.js            ← execute undo (STEP 6)
    │   ├── historyBuilders/toggleEc2History.js
    │   └── undoRegistry.js                 ← undo_payload.type → handler
    ├── navigator/
    │   └── functions/navigatorFunctions.js ← shape stats/tables for Kite
    ├── requests/
    │   ├── classes/
    │   │   ├── ActionState.js              ← in-memory request state (tests)
    │   │   └── Request.js                  ← cloudpilot_requests DB CRUD
    │   └── functions/
    │       ├── requestFunctions.js           ← STEP 5 applyDecision
    │       ├── requestLoadFunctions.js       ← STEP 2 load open request
    │       └── requestStatusFunctions.js   ← status rules and transitions
    └── understanding/
        ├── understandMessage.js            ← STEP 3 entry
        └── search/                           ← entity extractors (STEP 3)
            ├── searchMessageForAction.js
            ├── searchMessageForConversation.js
            ├── searchMessageForInstanceId.js
            ├── searchMessageForInstanceType.js
            ├── searchMessageForName.js
            ├── searchMessageForRegion.js
            ├── searchMessageForReply.js
            ├── searchMessageForStructuredFields.js
            └── searchMessageForValues.js
```

---

## File reference (one line each)

### Entry & routing

| File | What it does |
|------|----------------|
| `logic/messages.js` | Wires `POST /message` to `processMessage` and shapes the HTTP response. |
| `routes/messageRoutes.js` | Express route definition for the CloudPilot message endpoint. |

### Capabilities (`capabilities/`)

| File | What it does |
|------|----------------|
| `capabilities/atlas/atlasPost.js` | Posts JSON to Atlas HTTP routes (scan, toggle, inventory, etc.). |
| `capabilities/changes/changeEC2.js` | Thin entry for EC2 create, delete, and toggle against Atlas. |
| `capabilities/conversation/generalChat.js` | Capability wrapper for general chat (stub; not wired on live path). |
| `capabilities/inventory/getAllResources.js` | Thin entry for full AWS inventory scan. |
| `capabilities/scans/scanEC2.js` | Thin entry for EC2 security/cost scan. |
| `capabilities/scans/scanS3.js` | Thin entry for S3 scan. |

### Orchestrator

| File | What it does |
|------|----------------|
| `services/cloudPilotMessageFunctions.js` | Runs STEPS 1–7 for every user message (`processMessage`). |

### Actions (`services/actions/`)

| File | What it does |
|------|----------------|
| `actionMap.js` | Registry of all actions — match rules, tiers, handlers, messages. |
| `aws/atlasAWSFunctions.js` | Legacy direct Atlas HTTP for inventory (pre-capability). |
| `aws/inventoryAWS/inventoryAWSHandler.js` | STEP 6 handler for `inventory_aws`. |
| `aws/inventoryAWS/atlasAWSInventoryFormatter.js` | Normalizes raw Atlas inventory into internal shape. |
| `aws/inventoryAWS/atlasAWSInventoryMessageBuilder.js` | Builds user-facing inventory summary text. |
| `aws/inventoryAWS/atlasAWSInventoryNavigatorAdapter.js` | Maps inventory results to Navigator tables/stats. |
| `ec2/atlasEC2Functions.js` | Legacy direct Atlas HTTP for EC2 create/delete (pre-capability). |
| `ec2/createEC2/createEC2Handler.js` | STEP 6 handler for `create_ec2`. |
| `ec2/deleteEC2/deleteEC2Handler.js` | STEP 6 handler for `delete_ec2`. |
| `ec2/toggleEC2/toggleEC2Handler.js` | STEP 6 handler for `toggle_ec2`. |
| `ec2/scanEC2/scanEC2Handler.js` | STEP 6 handler for `scan_ec2`. |
| `ec2/scanEC2/atlasEC2Formatter.js` | Normalizes Atlas EC2 scan payload. |
| `ec2/scanEC2/atlasEC2MessageBuilder.js` | Builds chat copy from EC2 scan findings. |
| `ec2/scanEC2/atlasEC2ScanNavigatorAdapter.js` | Maps EC2 scan to Navigator tables/stats. |
| `s3/atlasS3Functions.js` | Legacy direct Atlas HTTP for S3 scan (pre-capability). |
| `s3/scanS3/scanS3Handler.js` | STEP 6 handler for `scan_s3`. |
| `s3/scanS3/atlasS3Formatter.js` | Normalizes Atlas S3 scan payload. |
| `s3/scanS3/atlasS3MessageBuilder.js` | Builds chat copy from S3 scan findings. |
| `s3/scanS3/atlasS3ScanNavigatorAdapter.js` | Maps S3 scan to Navigator tables/stats. |

### Conversation (`services/conversation/`)

| File | What it does |
|------|----------------|
| `CloudPilotMessage.js` | Produces outgoing words — general speak, request templates, passthrough. |
| `templates/fieldPromptExamples.js` | Copy-paste examples for missing required fields. |
| `templates/requestTemplates.js` | Deterministic request workflow messages (fields, confirm, status). |
| `general/GeneralConversation.js` | General Conversation entry after STEP 4; delegates to `CloudPilotMessage`. |
| `general/workflow.js` | Placeholder for future general-side workflow hooks. |
| `request/RequestConversation.js` | Request speak routing — strategies, execution passthrough, templates. |
| `request/workflow.js` | Thin STEP 5 (`store`) and STEP 6 (`execute`) passthrough. |

### Change strategies (`services/change/strategies/`)

| File | What it does |
|------|----------------|
| `automatic.js` | Strategy 4 — validates mode and runs handler via `runAction`. |
| `instructions.js` | Strategy 1 — stub response for step-by-step instructions. |
| `cli.js` | Strategy 2 — stub response for CLI commands. |
| `pr.js` | Strategy 3 — stub response for pull-request delivery. |

### Engines & config

| File | What it does |
|------|----------------|
| `engines/llm/openai/openAIFunctions.js` | OpenAI client, normalization, and chat completion helpers. |
| `config/chatGPTconfig.js` | Model IDs, temperatures, and safe token ceilings. |

### Decision (`services/decision/`)

| File | What it does |
|------|----------------|
| `decideNextStep.js` | STEP 4 — picks conversation type, request updates, and response.type. |
| `decisionTypes.js` | Constants for `chatType`, `response.type`, and action events. |

### Executions (`services/executions/`)

| File | What it does |
|------|----------------|
| `functions/executionFunctions.js` | STEP 6 orchestration — when to run, finish request, save history. |
| `functions/runAction.js` | Resolves handler from `actionMap` and invokes it. |
| `outcomes/outcomeRegistry.js` | Maps Atlas error codes to friendly user messages. |
| `AtlasExecution.js` | Legacy path for execution_requested events in templates. |

### History (`services/history/`)

| File | What it does |
|------|----------------|
| `classes/History.js` | MySQL CRUD for `cloudpilot_history` rows (A4 `listRecentByConversation` planned). |
| `functions/historyFunctions.js` | `saveHistory` and `getLatestUndoable` orchestration. |
| `functions/undoFunctions.js` | Runs undo from latest undoable history row (STEP 6). |
| `historyBuilders/toggleEc2History.js` | Builds history row + undo_payload for toggle_ec2. |
| `undoRegistry.js` | Maps `undo_payload.type` to the handler that reverses a change. |

### Navigator (`services/navigator/`)

| File | What it does |
|------|----------------|
| `functions/navigatorFunctions.js` | Assembles `navigatorResponse` stats and tables for Kite. |

### Requests (`services/requests/`)

| File | What it does |
|------|----------------|
| `classes/Request.js` | MySQL CRUD for `cloudpilot_requests` (open workflow rows). |
| `classes/ActionState.js` | In-memory request state fallback for tests. |
| `functions/requestFunctions.js` | Applies STEP 4 decision — start, update, finish, cancel. |
| `functions/requestLoadFunctions.js` | STEP 2 — loads open request for a conversation. |
| `functions/requestStatusFunctions.js` | Rules for `waiting_on_fields`, confirmation, etc. |

### Understanding (`services/understanding/`)

| File | What it does |
|------|----------------|
| `understandMessage.js` | STEP 3 — runs all extractors and returns unified understanding. |
| `search/searchMessageForAction.js` | Detects which action the user wants (scan, toggle, etc.). |
| `search/searchMessageForConversation.js` | Detects list_open, status, focus_switch commands. |
| `search/searchMessageForReply.js` | Detects yes, cancel, and execution mode 1–4. |
| `search/searchMessageForRegion.js` | Extracts AWS region from message text. |
| `search/searchMessageForInstanceId.js` | Extracts single EC2 instance ID. |
| `search/searchMessageForInstanceType.js` | Extracts instance type (e.g. t3.micro). |
| `search/searchMessageForName.js` | Extracts resource name field. |
| `search/searchMessageForStructuredFields.js` | Parses `field: "value"` structured input. |
| `search/searchMessageForValues.js` | Merges bare values into collected fields. |

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
| `general_chat` | — (not STEP 6) | ⚠️ stub; engine in `engines/llm/openai/` |

---

## Sub-READMEs & docs

| Path | Focus |
|------|--------|
| [services/README.md](./services/README.md) | Pipeline folders + STEP map |
| [capabilities/README.md](./capabilities/README.md) | HOW / WHERE layout |
| [doc/development/history.md](./doc/development/history.md) | **Active** — history, undo, recent history/requests |
| [doc/development/To_do.md](./doc/development/To_do.md) | Future backlog |
| [doc/development/finished.md](./doc/development/finished.md) | **Shipped** work |
| [doc/development/architecture/code_cleanup.md](./doc/development/architecture/code_cleanup.md) | **Message architecture** |
| [doc/development/architecture/architecture.md](./doc/development/architecture/architecture.md) | Full system reference |
