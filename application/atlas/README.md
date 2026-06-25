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
│   └── messages.js                         ← POST /message wiring
├── routes/
│   └── messageRoutes.js
├── capabilities/                           ← HOW + WHERE (see capabilities/README.md)
│   ├── README.md
│   ├── atlas/
│   │   └── atlasPost.js
│   ├── changes/
│   │   └── changeEC2.js
│   ├── conversation/
│   │   └── generalChat.js                  ← capability wrapper (stub; not wired)
│   ├── inventory/
│   │   └── getAllResources.js
│   └── scans/
│       ├── scanEC2.js
│       └── scanS3.js
└── services/
    ├── README.md
    ├── cloudPilotMessageFunctions.js       ← orchestrator STEPS 1–7
    ├── actions/
    │   ├── actionMap.js
    │   ├── aws/
    │   │   ├── atlasAWSFunctions.js
    │   │   └── inventoryAWS/
    │   │       ├── inventoryAWSHandler.js
    │   │       ├── atlasAWSInventoryFormatter.js
    │   │       ├── atlasAWSInventoryMessageBuilder.js
    │   │       └── atlasAWSInventoryNavigatorAdapter.js
    │   ├── ec2/
    │   │   ├── atlasEC2Functions.js
    │   │   ├── createEC2/createEC2Handler.js
    │   │   ├── deleteEC2/deleteEC2Handler.js
    │   │   ├── scanEC2/
    │   │   │   ├── scanEC2Handler.js
    │   │   │   ├── atlasEC2Formatter.js
    │   │   │   ├── atlasEC2MessageBuilder.js
    │   │   │   └── atlasEC2ScanNavigatorAdapter.js
    │   │   └── toggleEC2/toggleEC2Handler.js
    │   └── s3/
    │       ├── atlasS3Functions.js
    │       └── scanS3/
    │           ├── scanS3Handler.js
    │           ├── atlasS3Formatter.js
    │           ├── atlasS3MessageBuilder.js
    │           └── atlasS3ScanNavigatorAdapter.js
    ├── conversation/
    │   ├── CloudPilotMessage.js            ← how CloudPilot speaks (single voice)
    │   ├── templates/
    │   │   ├── fieldPromptExamples.js
    │   │   └── requestTemplates.js         ← request workflow copy
    │   ├── general/
    │   │   ├── GeneralConversation.js
    │   │   └── workflow.js                 ← no-op stub
    │   └── request/
    │       ├── RequestConversation.js      ← speak routing (STEP 7)
    │       └── workflow.js                 ← store + execute (STEP 5–6)
    ├── change/
    │   └── strategies/
    │       ├── automatic.js
    │       ├── cli.js
    │       ├── instructions.js
    │       └── pr.js
    ├── engines/
    │   └── llm/
    │       └── openai/
    │           └── openAIFunctions.js      ← OpenAI SDK
    ├── config/
    │   └── chatGPTconfig.js
    ├── decision/
    │   ├── decideNextStep.js               ← STEP 4
    │   └── decisionTypes.js
    ├── executions/
    │   ├── AtlasExecution.js               ← legacy
    │   ├── outcomes/
    │   │   └── outcomeRegistry.js          ← handler outcome copy
    │   └── functions/
    │       ├── executionFunctions.js         ← STEP 6 + 6B
    │       └── runAction.js
    ├── history/
    │   ├── classes/History.js
    │   ├── functions/
    │   │   ├── historyFunctions.js
    │   │   └── undoFunctions.js
    │   ├── historyBuilders/toggleEc2History.js
    │   └── undoRegistry.js
    ├── navigator/
    │   └── functions/navigatorFunctions.js
    ├── requests/
    │   ├── classes/
    │   │   ├── ActionState.js              ← memory fallback (tests)
    │   │   └── Request.js
    │   └── functions/
    │       ├── requestFunctions.js           ← STEP 5 apply
    │       ├── requestLoadFunctions.js       ← STEP 2 load
    │       └── requestStatusFunctions.js
    └── understanding/
        ├── understandMessage.js            ← STEP 3
        └── search/
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

## Folder tree — migration status

`responses/` removed (Phase 2). `change/strategies/` (Phase 3b). `chat/` removed — `CloudPilotMessage`, `engines/llm/`, `executions/outcomes/` (Phase 4).

```text
services/
    conversation/          ← General + Request + CloudPilotMessage + templates
    change/strategies/
    engines/llm/openai/
```

No `chat/` folder.

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
| [doc/development/To_do.md](./doc/development/To_do.md) | **Active work** — checklists |
| [doc/development/finished.md](./doc/development/finished.md) | **Shipped** work |
| [doc/development/architecture/code_cleanup.md](./doc/development/architecture/code_cleanup.md) | **Message architecture** |
| [doc/development/architecture/architecture.md](./doc/development/architecture/architecture.md) | Full system reference |
