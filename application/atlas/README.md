# CloudPilot — `application/atlas/`

Live code for the CloudPilot message pipeline (`POST /message`). Docs live in `doc/` — this file is **code layout only**.

---

## Mental model

| Question | Layer | Path |
|----------|-------|------|
| What does the user want? | WHAT | `services/understanding/` + `services/actions/actionMap.js` |
| When is it ready to run? | WHEN | `services/decision/` |
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
    │   ├── decideNextStep.js          ← WHEN
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
        ├── understandMessage.js       ← WHAT (STEP 3)
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
       STEP 2  requests/           load
       STEP 3  understanding/      WHAT
       STEP 4  decision/           WHEN
       STEP 5  requests/           persist
       STEP 6  executions/         RUN → runAction → handler → capabilities/
       STEP 6B history/            WHAT CHANGED (changes only)
       STEP 7  responses/          respond
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
