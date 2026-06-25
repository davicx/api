# CloudPilot — `application/atlas/`

Live code for the CloudPilot message pipeline (`POST /message`). Docs live in `doc/` — this file is **code layout only**.

---

## Mental model

### Glossary

| Term | Meaning |
|------|---------|
| **Request** | User wants CloudPilot to do something — workflow in `cloudpilot_requests` |
| **Action** | Thing CloudPilot knows how to do — `scan_ec2`, `toggle_ec2`, … in `actionMap.js` |
| **General Chat** | Not a request — OpenAI only; no DB; no Atlas |

### First gate (STEP 3 + 4)

| Path | Who owns the turn | Pipeline |
|------|-------------------|----------|
| **Request Workflow** | CloudPilot | Steps 5–7 (Atlas may run) |
| **General Chat** | OpenAI | Steps 5–6 skipped |

Request Workflow subtypes: New Request · Continue Request · Request Commands · Run Work. See `doc/development/architecture.md`.

### Pipeline layers

| Question | Layer | Path |
|----------|-------|------|
| What is the user trying to do? | Understand | `services/understanding/` + `services/actions/actionMap.js` |
| What should happen next? | Decide | `services/decision/` |
| Open request state? | Persist | `services/requests/` |
| What runs? | RUN | `services/executions/functions/runAction.js` |
| How does it work? | HOW | `capabilities/` |
| Where (Atlas HTTP)? | WHERE | `capabilities/atlas/atlasPost.js` |
| What changed? | History | `services/history/` (STEP 6B) |
| What does the user see? | Respond | `services/responses/` (STEP 7) |

**Entry:** `logic/messages.js` → `services/cloudPilotMessageFunctions.js` (`processMessage`)

---

## Folder tree (code only)

```text
application/atlas/
├── README.md                          ← this file
├── logic/
│   └── messages.js                    ← POST /message handler wiring
├── routes/
│   └── messageRoutes.js
├── capabilities/                      ← HOW + WHERE (see capabilities/README.md)
│   ├── README.md
│   ├── atlas/
│   │   └── atlasPost.js               ← POST JSON to Atlas
│   ├── changes/
│   │   └── changeEC2.js               ← toggleEC2, createEC2, deleteEC2
│   ├── conversation/
│   │   └── generalChat.js             ← OpenAI (STEP 7 — not wired yet)
│   ├── inventory/
│   │   └── getAllResources.js
│   └── scans/
│       ├── scanEC2.js                 ← live via scanEC2Handler
│       └── scanS3.js
└── services/                          ← pipeline (see services/README.md)
    ├── README.md
    ├── cloudPilotMessageFunctions.js  ← orchestrator STEPS 1–7
    ├── actions/
    │   ├── actionMap.js          ← detect (match) + run (executionFunction)
    │   ├── aws/
    │   │   ├── atlasAWSFunctions.js
    │   │   └── inventoryAWS/
    │   │       ├── inventoryAWSHandler.js
    │   │       ├── atlasAWSInventoryFormatter.js
    │   │       ├── atlasAWSInventoryMessageBuilder.js
    │   │       └── atlasAWSInventoryNavigatorAdapter.js
    │   ├── ec2/
    │   │   ├── atlasEC2Functions.js   ← legacy Atlas shims (C7 trim)
    │   │   ├── createEC2/
    │   │   │   └── createEC2Handler.js
    │   │   ├── deleteEC2/
    │   │   │   └── deleteEC2Handler.js
    │   │   ├── scanEC2/
    │   │   │   ├── scanEC2Handler.js
    │   │   │   ├── atlasEC2Formatter.js
    │   │   │   ├── atlasEC2MessageBuilder.js
    │   │   │   └── atlasEC2ScanNavigatorAdapter.js
    │   │   └── toggleEC2/
    │   │       └── toggleEC2Handler.js
    │   └── s3/
    │       ├── atlasS3Functions.js
    │       └── scanS3/
    │           ├── scanS3Handler.js
    │           ├── atlasS3Formatter.js
    │           ├── atlasS3MessageBuilder.js
    │           └── atlasS3ScanNavigatorAdapter.js
    ├── chat/
    │   ├── CloudPilotChat.js
    │   ├── chatOutcomeRegistry.js
    │   ├── fieldPromptExamples.js
    │   └── openAI/
    │       └── openAIFunctions.js
    ├── config/
    │   └── chatGPTconfig.js
    ├── decision/
    │   ├── decideNextStep.js          ← Decide (STEP 4)
    │   └── decisionTypes.js
    ├── executions/
    │   ├── AtlasExecution.js          ← legacy path via CloudPilotChat
    │   └── functions/
    │       ├── executionFunctions.js  ← STEP 6 orchestration + STEP 6B history
    │       └── runAction.js           ← RUN — registry → handler
    ├── history/
    │   ├── classes/
    │   │   └── History.js
    │   ├── functions/
    │   │   └── historyFunctions.js
    │   └── historyBuilders/
    │       └── toggleEc2History.js
    ├── navigator/
    │   └── functions/
    │       └── navigatorFunctions.js
    ├── requests/
    │   ├── classes/
    │   │   ├── ActionState.js         ← memory fallback for tests
    │   │   └── Request.js
    │   └── functions/
    │       ├── requestFunctions.js    ← STEP 5 apply
    │       ├── requestLoadFunctions.js← STEP 2 load
    │       └── requestStatusFunctions.js
    ├── responses/
    │   ├── buildResponse.js           ← STEP 7 router
    │   ├── buildCloudPilotResponse.js
    │   └── buildGeneralChatResponse.js← general chat (STEP 7)
    └── understanding/
        ├── understandMessage.js       ← Understand (STEP 3)
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

## Pipeline (one message)

```text
routes/messageRoutes.js
  → logic/messages.js
  → cloudPilotMessageFunctions.processMessage()
       STEP 1  normalize
       STEP 2  requests/           load (RequestStateFunctions)
       STEP 3  understanding/      what is the user trying to do?
       STEP 4  decision/           what should happen next?
       STEP 5  requests/           persist (Request Workflow only)
       STEP 6  executions/         RUN → runAction → handler → capabilities/
       STEP 6B history/            WHAT CHANGED (changes only)
       STEP 7  responses/          respond (CloudPilot or OpenAI)
```

---

## Capability wiring (live vs legacy)

| Action | RUN (handler) | HOW (capability) |
|--------|---------------|------------------|
| `scan_ec2` | `scanEC2Handler` | ✅ `scans/scanEC2.js` |
| `toggle_ec2` | `toggleEC2Handler` | ✅ `changes/changeEC2.toggleEC2` |
| `create_ec2` | `createEC2Handler` | ⚠️ `atlasEC2Functions` (capability ready in `changeEC2`) |
| `delete_ec2` | `deleteEC2Handler` | ⚠️ `atlasEC2Functions` |
| `scan_s3` | `scanS3Handler` | ⚠️ `atlasS3Functions` |
| `inventory_aws` | `inventoryAWSHandler` | ⚠️ `atlasAWSFunctions` |
| `general_chat` | — (not STEP 6) | ⚠️ STEP 7 stub; `conversation/generalChat.js` not wired |

---

## Sub-READMEs

| Path | Focus |
|------|--------|
| [services/README.md](./services/README.md) | Pipeline folders + STEP map |
| [capabilities/README.md](./capabilities/README.md) | HOW / WHERE layout + wired table |
