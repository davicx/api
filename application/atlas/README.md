# CloudPilot — `application/atlas/`

Live code for the CloudPilot message pipeline (`POST /message`). Docs live in `doc/` — this file is **code layout only**.

**Message architecture:** [doc/development/code_cleanup.md](./doc/development/code_cleanup.md)

## Design principle

> **Every user message is exactly one conversation.**

---

## Mental model

### Message pipeline

```text
User Message → Understand → Decide → Conversation → Workflow → Capabilities → Atlas
```

Conversation (General or Request) is **one layer** — see [code_cleanup.md](./doc/development/code_cleanup.md).

### Glossary

| Term | Meaning |
|------|---------|
| **Request** | User wants CloudPilot to do something — row in `cloudpilot_requests` |
| **Action** | Thing CloudPilot knows how to do — `scan_ec2`, `toggle_ec2`, … in `actionMap.js` |
| **General Conversation** | User is just talking — not a request |
| **Request Conversation** | Orchestrates a request turn — state, work, speak |

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
    │   ├── general/
    │   │   ├── conversation.js               ← General Conversation (Phase 1)
    │   │   └── workflow.js                 ← no-op stub
    │   └── request/
    │       └── conversation.js               ← Request Conversation speak (Phase 1)
    ├── chat/                               ← legacy mix (see target layout below)
    │   ├── CloudPilotChat.js               ← request speak (templates); → request/chat.js
    │   ├── chatOutcomeRegistry.js
    │   ├── fieldPromptExamples.js
    │   └── openAI/
    │       └── openAIFunctions.js          ← OpenAI SDK + sendGeneralChat
    ├── config/
    │   └── chatGPTconfig.js
    ├── decision/
    │   ├── decideNextStep.js               ← STEP 4
    │   └── decisionTypes.js
    ├── executions/
    │   ├── AtlasExecution.js               ← legacy
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
    ├── responses/                          ← legacy STEP 7 (→ conversation/request/)
    │   ├── buildResponse.js                ← dual-path router (remove)
    │   ├── buildCloudPilotResponse.js
    │   ├── buildGeneralChatResponse.js
    │   └── modes/
    │       ├── userRequestedAutomatic.js
    │       ├── userRequestedCLI.js
    │       ├── userRequestedInstructions.js
    │       └── userRequestedPR.js
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

## Folder tree — target (after Phase 1+)

**Decision:** `services/conversation/` for conversation systems. Legacy `services/chat/` retires. Engines are **vendor-agnostic** in architecture (`engines/llm/`, not `engines/openai/` at top level).

```text
services/
    conversation/
        general/
            conversation.js                 ← entry (Phase 1)
            workflow.js                     ← no-op stub (symmetry; future hooks)
            context.js, prompts.js          ← later
        request/
            conversation.js                 ← speak (STEP 7)
            workflow.js                     ← store(), execute()
            context.js, prompts.js          ← later

    engines/
        llm/                                ← architecture level (or ai/)
            openai/                         ← implementation (from chat/openAI/)
            anthropic/                      → future

    chat/                                   ← delete after migration
```

| Path | Role |
|------|------|
| `conversation/` | General vs Request **conversation systems** |
| `engines/llm/*` | LLM vendor SDKs — conversation picks engine, not vice versa |
| `capabilities/conversation/` | Thin capability HOW wrapper |

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
           → conversation/general/chat.js  → return

       STEP 5  Request Conversation — maintain state   (requests/)
       STEP 6  Request Conversation — perform work    (executions/)
       STEP 7  Request Conversation — speak           (conversation/request/chat.js)
```

Today STEP 7 still goes through `responses/buildResponse.js` until Phase 1 cleanup lands.

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
| `general_chat` | — (not STEP 6) | ⚠️ stub; engine in `chat/openAI/` |

---

## Sub-READMEs & docs

| Path | Focus |
|------|--------|
| [services/README.md](./services/README.md) | Pipeline folders + STEP map |
| [capabilities/README.md](./capabilities/README.md) | HOW / WHERE layout |
| [doc/development/code_cleanup.md](./doc/development/code_cleanup.md) | **Message architecture** + Phase 1 plan |
| [doc/development/architecture.md](./doc/development/architecture.md) | Full system reference |
