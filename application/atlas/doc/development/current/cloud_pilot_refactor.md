# CloudPilot Responsibility Refactor

**Status:** Planning only — no files moved yet  
**Scope:** `application/atlas/cloudPilot/` and `application/atlas/cloudPilotIntelligence/`  
**Work type:** Move files, rename files/folders, fix `require()` paths, verify unchanged behavior  
**Not in scope:** New features, logic rewrites, OpenAI behavior changes, prompt changes, response redesign

---

## Plan authority

This document supersedes the remaining CloudPilot phases in:

- `responsibility_refactor.md`
- `project_structure_plan.md`

Those documents describe the intermediate structure that currently exists (`conversation/`, `decision/`, `changes/`, top-level service folders, and `navigator/`). Do not execute their old Phase 4 or Phase 5 independently.

The earlier provider and context moves remain valid. This document is the source of truth for the remaining CloudPilot and CloudPilotIntelligence folder migration.

### Inventory baseline

```text
cloudPilot/              75 JavaScript files
cloudPilotIntelligence/   8 JavaScript files
                         ──
Total                    83 JavaScript files
```

The final structure must still contain all 83 JavaScript files:

```text
cloudPilot/              60 JavaScript files
cloudPilotIntelligence/  23 JavaScript files
                         ──
Total                    83 JavaScript files
```

The count changes between the two systems only because 15 existing CloudPilot files move into Intelligence:

- 11 understanding files;
- 4 response-production files.

---

## 1. Goal

Reorganize CloudPilot around responsibilities that a new engineer can understand in one sentence.

```text
cloudPilot/
├── chat/             # Talk with the user and route the chat experience
├── requests/         # Manage the lifecycle and state of work
├── remediations/     # Define and deliver infrastructure changes
├── services/         # Provide information and analysis
├── execution/        # Run approved work
├── history/          # Record and undo completed work
└── config/           # Register actions and static CloudPilot behavior

cloudPilotIntelligence/
├── context/          # Assemble the knowledge used while thinking
├── understand/       # Interpret the user's message
├── respond/          # Produce user-facing language
├── explain/          # Explain results and decisions
├── generate/         # Generate artifacts
└── improve/          # Improve future intelligence behavior
```

The boundary is:

```text
CloudPilot              = manages work
CloudPilotIntelligence  = helps CloudPilot think and communicate
providers/              = communicates with external systems
```

### Why `context/` remains

The proposed Intelligence sketch omitted the existing `context/` folder. It should remain.

Its responsibility is clear and shared by both understanding and responding:

> Assemble CloudPilot-owned knowledge for an intelligence operation.

Forcing context under either `understand/` or `respond/` would incorrectly make shared knowledge belong to one consumer. This plan does not move context into an OpenAI provider.

---

## 2. Hard constraints

1. Every current JavaScript file must still exist after the migration.
2. Business behavior, exports, function signatures, database behavior, prompts, and environment switches stay unchanged.
3. This is a physical structure change only:
   - move files;
   - rename files and folders;
   - fix imports and documentation paths;
   - remove empty obsolete folders;
   - verify existing behavior.
4. Do not split mixed files during this refactor.
5. Do not consolidate helpers during this refactor.
6. Do not replace deterministic responses with AI responses.
7. Do not finish or alter the OpenAI toggle in this project.

### Separate follow-up project

After this refactor is complete and smoke-tested, a separate plan can finish the existing Internal/OpenAI response toggle.

```text
Project A — this document
Move / rename / imports / verification only

Project B — later
Finish OpenAI response toggle and related product behavior
```

Project B must not begin while Project A is in progress.

---

## 3. Responsibility test for the target folders

| Folder | One-sentence responsibility | Clear? |
|---|---|---|
| `cloudPilot/chat/` | Routes the user-facing chat experience after a message enters CloudPilot. | Yes |
| `cloudPilot/requests/` | Owns request state, lifecycle, and the determination of what request work happens next. | Yes |
| `cloudPilot/remediations/` | Owns infrastructure-changing capabilities and their delivery strategies. | Yes |
| `cloudPilot/services/` | Owns read-oriented information and analysis capabilities. | Yes |
| `cloudPilot/execution/` | Runs work that CloudPilot has approved for execution. | Yes |
| `cloudPilot/history/` | Records what CloudPilot changed and performs supported undo operations. | Yes |
| `cloudPilot/config/` | Registers static action definitions and capability wiring. | Yes |
| `cloudPilotIntelligence/context/` | Assembles the knowledge supplied to intelligence operations. | Yes |
| `cloudPilotIntelligence/understand/` | Converts a user message into structured understanding. | Yes |
| `cloudPilotIntelligence/respond/` | Produces user-facing language from CloudPilot outcomes and context. | Yes |
| `cloudPilotIntelligence/explain/` | Explains outcomes and decisions. | Yes; future scaffold |
| `cloudPilotIntelligence/generate/` | Generates artifacts requested by CloudPilot. | Yes; future scaffold |
| `cloudPilotIntelligence/improve/` | Improves future intelligence behavior. | Yes; future scaffold |

---

## 4. Current top-level folder analysis

| Current location | Current responsibility | Keep as top-level? | Recommended home |
|---|---|---:|---|
| `actionMap.js` | Static action registration, matching metadata, requirements, messages, and execution handler references | No | `cloudPilot/config/actionMap.js` |
| `cloudPilotMessageFunctions.js` | Main message-processing pipeline | No root file | `cloudPilot/chat/processMessage.js` |
| `aiUsage/` | Read-oriented AI usage service | No | `cloudPilot/services/aiUsage/` |
| `billing/` | Read-oriented AWS billing service | No | `cloudPilot/services/billing/` |
| `changes/` | Infrastructure changes and delivery strategies | No | `cloudPilot/remediations/` |
| `conversation/` | Mixes chat routing, request workflow, response production, and understanding | No | Split by responsibility |
| `decision/` | Determines the next state and action for the current request | No | `cloudPilot/requests/` |
| `execution/` | Executes approved actions | Yes | `cloudPilot/execution/` |
| `history/` | Records and undoes changes | Yes | `cloudPilot/history/` |
| `inventory/` | Read-oriented inventory service | No | `cloudPilot/services/inventory/` |
| `navigator/` | Shared construction helpers for frontend response data | No | `cloudPilot/chat/presentation/` |
| `requests/` | Request state and persistence | Yes | `cloudPilot/requests/` |
| `scans/` | Read-oriented scan services | No | `cloudPilot/services/scans/` |
| `conversation/understand/` | Message interpretation and value extraction | No; not CloudPilot workflow | `cloudPilotIntelligence/understand/` |

### Folders that disappear

```text
cloudPilot/conversation/  → split into chat, requests, and Intelligence
cloudPilot/decision/      → absorbed by requests
cloudPilot/changes/       → renamed remediations
cloudPilot/navigator/     → absorbed by chat/presentation
cloudPilot/scans/         → absorbed by services
cloudPilot/billing/       → absorbed by services
cloudPilot/inventory/     → absorbed by services
cloudPilot/aiUsage/       → absorbed by services
```

---

## 5. Important boundary decisions

### 5.1 Chat is not Intelligence

`chat/` owns routing the user experience:

- process an incoming message;
- choose the general or request chat path;
- route an outcome to the response producer;
- preserve the API-facing chat contract.

It does not own message understanding or the production of response language.

### 5.2 Responding is Intelligence

The current `CloudPilotMessage.js`, general-chat response entry, and request templates primarily produce user-facing language. They belong under `cloudPilotIntelligence/respond/`.

Moving them does not enable OpenAI or change their behavior. Deterministic templates remain deterministic.

### 5.3 Decision is request workflow

`decideNextStep.js` answers:

> Given the current understanding and request state, what should this request do next?

That is request lifecycle logic, so `decision/` disappears into `requests/`.

### 5.4 Navigator is presentation, not a product capability

`navigatorFunctions.js` constructs frontend response shapes. It does not reason and it is not a first-class CloudPilot capability.

The shared helper moves to `chat/presentation/`. Feature-specific adapters stay beside their feature and are renamed from `NavigatorAdapter` to `ResponseAdapter`.

### 5.5 Remediations replace changes

`changes/` mixes remediation handlers and delivery strategies. `remediations/` states the product responsibility directly:

> These are the infrastructure changes CloudPilot can make and the ways it can deliver them.

### 5.6 Services are read-oriented capabilities

Scans, billing, inventory, and AI usage answer questions or provide analysis. They do not manage request state and they are not remediation workflows.

### 5.7 Configuration is static registration

`actionMap.js` is the central registry describing what CloudPilot knows how to do. Its primary responsibility is configuration, even though its definitions reference executable handlers.

This plan moves the file only. It does not split matching rules, messages, or execution references out of the registry.

---

## 6. Final target tree

Every current JavaScript file is represented below.

```text
cloudPilot/
├── chat/
│   ├── processMessage.js
│   ├── general/
│   │   ├── GeneralChat.js
│   │   └── generalChatWorkflow.js
│   ├── request/
│   │   └── RequestChat.js
│   └── presentation/
│       └── navigatorResponseFunctions.js
│
├── requests/
│   ├── ActionState.js
│   ├── Request.js
│   ├── decideNextRequestStep.js
│   ├── requestDecisionTypes.js
│   ├── requestWorkflow.js
│   ├── requestFunctions.js
│   ├── requestLoadFunctions.js
│   ├── requestNameFunctions.js
│   └── requestStatusFunctions.js
│
├── remediations/
│   ├── toggleEC2/
│   │   └── toggleEC2Handler.js
│   ├── createEC2/
│   │   └── createEC2Handler.js
│   ├── deleteEC2/
│   │   └── deleteEC2Handler.js
│   ├── updateEC2Tag/
│   │   └── updateEC2TagHandler.js
│   └── strategies/
│       ├── automatic.js
│       ├── instructions.js
│       ├── cli/
│       │   ├── cli.js
│       │   └── cliTemplates.js
│       └── pr/
│           ├── pr.js
│           ├── createToggleEc2PullRequest.js
│           └── prTemplates.js
│
├── services/
│   ├── scans/
│   │   ├── ec2/
│   │   │   ├── scanEC2Handler.js
│   │   │   ├── atlasEC2Functions.js
│   │   │   ├── atlasEC2Formatter.js
│   │   │   ├── atlasEC2MessageBuilder.js
│   │   │   └── ec2ScanResponseAdapter.js
│   │   └── s3/
│   │       ├── scanS3Handler.js
│   │       ├── atlasS3Functions.js
│   │       ├── atlasS3Formatter.js
│   │       ├── atlasS3MessageBuilder.js
│   │       └── s3ScanResponseAdapter.js
│   ├── billing/
│   │   ├── billingAWSHandler.js
│   │   ├── atlasBillingFunctions.js
│   │   ├── atlasAWSBillingMessage.js
│   │   └── billingResponseAdapter.js
│   ├── inventory/
│   │   ├── inventoryAWSHandler.js
│   │   ├── atlasAWSFunctions.js
│   │   ├── atlasAWSInventoryFormatter.js
│   │   ├── atlasAWSInventoryMessageBuilder.js
│   │   └── inventoryResponseAdapter.js
│   └── aiUsage/
│       ├── showAiUsageHandler.js
│       └── aiUsageMessageBuilder.js
│
├── execution/
│   ├── AtlasExecution.js
│   ├── executionWorkflow.js
│   ├── runAction.js
│   └── outcomes/
│       └── outcomeRegistry.js
│
├── history/
│   ├── History.js
│   ├── historyFunctions.js
│   ├── historyActionNameFunctions.js
│   ├── historyResponseAdapter.js
│   ├── builders/
│   │   ├── createEc2History.js
│   │   ├── ec2History.js
│   │   └── toggleEc2History.js
│   └── undo/
│       ├── undoFunctions.js
│       └── undoRegistry.js
│
└── config/
    └── actionMap.js

cloudPilotIntelligence/
├── context/
│   ├── buildContext.js
│   ├── buildSystemMessage.js
│   ├── classes/
│   │   ├── ConversationHistoryContext.js
│   │   └── CurrentQuestionContext.js
│   └── contextTypes/
│       ├── cloudPilotContext.js
│       ├── cloudPilotSituationContext.js
│       ├── currentQuestionContext.js
│       └── organizationKnowledgeContext.js
│
├── understand/
│   ├── understandMessage.js
│   └── search/
│       ├── searchMessageForAction.js
│       ├── searchMessageForConversation.js
│       ├── searchMessageForInstanceId.js
│       ├── searchMessageForInstanceType.js
│       ├── searchMessageForName.js
│       ├── searchMessageForRegion.js
│       ├── searchMessageForReply.js
│       ├── searchMessageForStructuredFields.js
│       ├── searchMessageForTagUpdate.js
│       └── searchMessageForValues.js
│
├── respond/
│   ├── cloudPilotResponse.js
│   ├── general/
│   │   └── generalChat.js
│   └── templates/
│       ├── fieldPromptExamples.js
│       └── requestTemplates.js
│
├── explain/
├── generate/
└── improve/
```

### Why service message builders stay with services

The scan, billing, inventory, and AI usage message builders are deterministic output owned by those service contracts. They do not independently reason, call an AI model, or choose a conversational response path.

Moving those builders into Intelligence would scatter each service across two systems without changing its responsibility. They remain beside their service in this physical refactor.

The cross-service response composer and reusable request templates do move to `cloudPilotIntelligence/respond/` because producing conversational language is their primary responsibility.

---

## 7. Complete file migration map

### 7.1 Root files

| Current | Target | Reason |
|---|---|---|
| `cloudPilot/cloudPilotMessageFunctions.js` | `cloudPilot/chat/processMessage.js` | Main chat processing entry; rename after its exported `processMessage` responsibility |
| `cloudPilot/actionMap.js` | `cloudPilot/config/actionMap.js` | Static action and handler registry |

### 7.2 Conversation split

| Current | Target | Reason |
|---|---|---|
| `cloudPilot/conversation/general/GeneralConversation.js` | `cloudPilot/chat/general/GeneralChat.js` | Routes the general chat experience |
| `cloudPilot/conversation/general/workflow.js` | `cloudPilot/chat/general/generalChatWorkflow.js` | General chat workflow placeholder |
| `cloudPilot/conversation/request/RequestConversation.js` | `cloudPilot/chat/request/RequestChat.js` | Routes request-related chat output |
| `cloudPilot/conversation/request/workflow.js` | `cloudPilot/requests/requestWorkflow.js` | Applies request state and executes request work |
| `cloudPilot/conversation/CloudPilotMessage.js` | `cloudPilotIntelligence/respond/cloudPilotResponse.js` | Produces general and request-facing response language |
| `cloudPilot/conversation/general/generalChat.js` | `cloudPilotIntelligence/respond/general/generalChat.js` | General AI response entry placeholder |
| `cloudPilot/conversation/templates/fieldPromptExamples.js` | `cloudPilotIntelligence/respond/templates/fieldPromptExamples.js` | User-facing field prompt content |
| `cloudPilot/conversation/templates/requestTemplates.js` | `cloudPilotIntelligence/respond/templates/requestTemplates.js` | Deterministic request response generation |

### 7.3 Understanding

| Current | Target |
|---|---|
| `cloudPilot/conversation/understand/understandMessage.js` | `cloudPilotIntelligence/understand/understandMessage.js` |
| `cloudPilot/conversation/understand/search/searchMessageForAction.js` | `cloudPilotIntelligence/understand/search/searchMessageForAction.js` |
| `cloudPilot/conversation/understand/search/searchMessageForConversation.js` | `cloudPilotIntelligence/understand/search/searchMessageForConversation.js` |
| `cloudPilot/conversation/understand/search/searchMessageForInstanceId.js` | `cloudPilotIntelligence/understand/search/searchMessageForInstanceId.js` |
| `cloudPilot/conversation/understand/search/searchMessageForInstanceType.js` | `cloudPilotIntelligence/understand/search/searchMessageForInstanceType.js` |
| `cloudPilot/conversation/understand/search/searchMessageForName.js` | `cloudPilotIntelligence/understand/search/searchMessageForName.js` |
| `cloudPilot/conversation/understand/search/searchMessageForRegion.js` | `cloudPilotIntelligence/understand/search/searchMessageForRegion.js` |
| `cloudPilot/conversation/understand/search/searchMessageForReply.js` | `cloudPilotIntelligence/understand/search/searchMessageForReply.js` |
| `cloudPilot/conversation/understand/search/searchMessageForStructuredFields.js` | `cloudPilotIntelligence/understand/search/searchMessageForStructuredFields.js` |
| `cloudPilot/conversation/understand/search/searchMessageForTagUpdate.js` | `cloudPilotIntelligence/understand/search/searchMessageForTagUpdate.js` |
| `cloudPilot/conversation/understand/search/searchMessageForValues.js` | `cloudPilotIntelligence/understand/search/searchMessageForValues.js` |

The `search/` structure stays intact. Creating region/action/resource subfolders would add churn without changing responsibility and is not required for this target architecture.

### 7.4 Decision into requests

| Current | Target | Reason |
|---|---|---|
| `cloudPilot/decision/decideNextStep.js` | `cloudPilot/requests/decideNextRequestStep.js` | Determines the next request state and workflow action |
| `cloudPilot/decision/decisionTypes.js` | `cloudPilot/requests/requestDecisionTypes.js` | Constants consumed by request lifecycle and chat routing |

### 7.5 Existing requests

| Current | Target |
|---|---|
| `cloudPilot/requests/classes/ActionState.js` | `cloudPilot/requests/ActionState.js` |
| `cloudPilot/requests/classes/Request.js` | `cloudPilot/requests/Request.js` |
| `cloudPilot/requests/functions/requestFunctions.js` | `cloudPilot/requests/requestFunctions.js` |
| `cloudPilot/requests/functions/requestLoadFunctions.js` | `cloudPilot/requests/requestLoadFunctions.js` |
| `cloudPilot/requests/functions/requestNameFunctions.js` | `cloudPilot/requests/requestNameFunctions.js` |
| `cloudPilot/requests/functions/requestStatusFunctions.js` | `cloudPilot/requests/requestStatusFunctions.js` |

The `classes/` and `functions/` wrappers disappear because this folder has only two classes and four focused helper modules. Flattening makes the request capability visible without introducing new abstractions.

### 7.6 Changes into remediations

| Current | Target |
|---|---|
| `cloudPilot/changes/toggleEC2/toggleEC2Handler.js` | `cloudPilot/remediations/toggleEC2/toggleEC2Handler.js` |
| `cloudPilot/changes/createEC2/createEC2Handler.js` | `cloudPilot/remediations/createEC2/createEC2Handler.js` |
| `cloudPilot/changes/deleteEC2/deleteEC2Handler.js` | `cloudPilot/remediations/deleteEC2/deleteEC2Handler.js` |
| `cloudPilot/changes/updateEC2Tag/updateEC2TagHandler.js` | `cloudPilot/remediations/updateEC2Tag/updateEC2TagHandler.js` |
| `cloudPilot/changes/strategies/automatic.js` | `cloudPilot/remediations/strategies/automatic.js` |
| `cloudPilot/changes/strategies/instructions.js` | `cloudPilot/remediations/strategies/instructions.js` |
| `cloudPilot/changes/strategies/cli.js` | `cloudPilot/remediations/strategies/cli/cli.js` |
| `cloudPilot/changes/cli/cliTemplates.js` | `cloudPilot/remediations/strategies/cli/cliTemplates.js` |
| `cloudPilot/changes/strategies/pr.js` | `cloudPilot/remediations/strategies/pr/pr.js` |
| `cloudPilot/changes/pr/createToggleEc2PullRequest.js` | `cloudPilot/remediations/strategies/pr/createToggleEc2PullRequest.js` |
| `cloudPilot/changes/pr/prTemplates.js` | `cloudPilot/remediations/strategies/pr/prTemplates.js` |

CLI and PR helpers move beneath their strategies because they implement those delivery strategies rather than separate remediation capabilities.

### 7.7 Services

#### Scans

| Current | Target |
|---|---|
| `cloudPilot/scans/ec2/scanEC2Handler.js` | `cloudPilot/services/scans/ec2/scanEC2Handler.js` |
| `cloudPilot/scans/ec2/atlasEC2Functions.js` | `cloudPilot/services/scans/ec2/atlasEC2Functions.js` |
| `cloudPilot/scans/ec2/atlasEC2Formatter.js` | `cloudPilot/services/scans/ec2/atlasEC2Formatter.js` |
| `cloudPilot/scans/ec2/atlasEC2MessageBuilder.js` | `cloudPilot/services/scans/ec2/atlasEC2MessageBuilder.js` |
| `cloudPilot/scans/ec2/atlasEC2ScanNavigatorAdapter.js` | `cloudPilot/services/scans/ec2/ec2ScanResponseAdapter.js` |
| `cloudPilot/scans/s3/scanS3Handler.js` | `cloudPilot/services/scans/s3/scanS3Handler.js` |
| `cloudPilot/scans/s3/atlasS3Functions.js` | `cloudPilot/services/scans/s3/atlasS3Functions.js` |
| `cloudPilot/scans/s3/atlasS3Formatter.js` | `cloudPilot/services/scans/s3/atlasS3Formatter.js` |
| `cloudPilot/scans/s3/atlasS3MessageBuilder.js` | `cloudPilot/services/scans/s3/atlasS3MessageBuilder.js` |
| `cloudPilot/scans/s3/atlasS3ScanNavigatorAdapter.js` | `cloudPilot/services/scans/s3/s3ScanResponseAdapter.js` |

`atlasEC2Functions.js` is a known mixed legacy shim: it exposes scan and remediation calls. Splitting it would be a logic refactor, so it stays intact under the EC2 scan service for this migration. Its consumers only receive corrected import paths.

#### Billing

| Current | Target |
|---|---|
| `cloudPilot/billing/billingAWSHandler.js` | `cloudPilot/services/billing/billingAWSHandler.js` |
| `cloudPilot/billing/atlasBillingFunctions.js` | `cloudPilot/services/billing/atlasBillingFunctions.js` |
| `cloudPilot/billing/atlasAWSBillingMessage.js` | `cloudPilot/services/billing/atlasAWSBillingMessage.js` |
| `cloudPilot/billing/atlasAWSBillingNavigator.js` | `cloudPilot/services/billing/billingResponseAdapter.js` |

#### Inventory

| Current | Target |
|---|---|
| `cloudPilot/inventory/inventoryAWSHandler.js` | `cloudPilot/services/inventory/inventoryAWSHandler.js` |
| `cloudPilot/inventory/atlasAWSFunctions.js` | `cloudPilot/services/inventory/atlasAWSFunctions.js` |
| `cloudPilot/inventory/atlasAWSInventoryFormatter.js` | `cloudPilot/services/inventory/atlasAWSInventoryFormatter.js` |
| `cloudPilot/inventory/atlasAWSInventoryMessageBuilder.js` | `cloudPilot/services/inventory/atlasAWSInventoryMessageBuilder.js` |
| `cloudPilot/inventory/atlasAWSInventoryNavigatorAdapter.js` | `cloudPilot/services/inventory/inventoryResponseAdapter.js` |

Inventory remains a sibling of scans for this refactor. Moving it under scans is a possible later product decision, not required to establish the service boundary.

#### AI usage

| Current | Target |
|---|---|
| `cloudPilot/aiUsage/showAiUsageHandler.js` | `cloudPilot/services/aiUsage/showAiUsageHandler.js` |
| `cloudPilot/aiUsage/aiUsageMessageBuilder.js` | `cloudPilot/services/aiUsage/aiUsageMessageBuilder.js` |

### 7.8 Navigator removal

| Current | Target | Reason |
|---|---|---|
| `cloudPilot/navigator/functions/navigatorFunctions.js` | `cloudPilot/chat/presentation/navigatorResponseFunctions.js` | Shared frontend response-shape construction |

Feature-specific navigator files are renamed to response adapters in their owning service or history folder, as listed above and below.

### 7.9 Execution

| Current | Target |
|---|---|
| `cloudPilot/execution/AtlasExecution.js` | `cloudPilot/execution/AtlasExecution.js` |
| `cloudPilot/execution/functions/runAction.js` | `cloudPilot/execution/runAction.js` |
| `cloudPilot/execution/functions/executionFunctions.js` | `cloudPilot/execution/executionWorkflow.js` |
| `cloudPilot/execution/outcomes/outcomeRegistry.js` | `cloudPilot/execution/outcomes/outcomeRegistry.js` |

`executionFunctions.js` orchestrates STEP 6 rather than providing generic helpers, so `executionWorkflow.js` is the clearer name.

### 7.10 History

| Current | Target |
|---|---|
| `cloudPilot/history/classes/History.js` | `cloudPilot/history/History.js` |
| `cloudPilot/history/functions/historyFunctions.js` | `cloudPilot/history/historyFunctions.js` |
| `cloudPilot/history/functions/historyActionNameFunctions.js` | `cloudPilot/history/historyActionNameFunctions.js` |
| `cloudPilot/history/functions/undoFunctions.js` | `cloudPilot/history/undo/undoFunctions.js` |
| `cloudPilot/history/undoRegistry.js` | `cloudPilot/history/undo/undoRegistry.js` |
| `cloudPilot/history/historyBuilders/createEc2History.js` | `cloudPilot/history/builders/createEc2History.js` |
| `cloudPilot/history/historyBuilders/ec2History.js` | `cloudPilot/history/builders/ec2History.js` |
| `cloudPilot/history/historyBuilders/toggleEc2History.js` | `cloudPilot/history/builders/toggleEc2History.js` |
| `cloudPilot/history/historyNavigatorAdapter.js` | `cloudPilot/history/historyResponseAdapter.js` |

History remains a first-class CloudPilot capability. Only generic wrapper folder names and the obsolete Navigator term disappear.

### 7.11 Intelligence context

These files stay where they are:

```text
cloudPilotIntelligence/context/buildContext.js
cloudPilotIntelligence/context/buildSystemMessage.js
cloudPilotIntelligence/context/classes/ConversationHistoryContext.js
cloudPilotIntelligence/context/classes/CurrentQuestionContext.js
cloudPilotIntelligence/context/contextTypes/cloudPilotContext.js
cloudPilotIntelligence/context/contextTypes/cloudPilotSituationContext.js
cloudPilotIntelligence/context/contextTypes/currentQuestionContext.js
cloudPilotIntelligence/context/contextTypes/organizationKnowledgeContext.js
```

No context file moves to `providers/openAI/`.

---

## 8. Import impact

The migration must update every import that references these old concepts:

```text
cloudPilot/actionMap
cloudPilot/cloudPilotMessageFunctions
cloudPilot/conversation/**
cloudPilot/decision/**
cloudPilot/changes/**
cloudPilot/scans/**
cloudPilot/billing/**
cloudPilot/inventory/**
cloudPilot/aiUsage/**
cloudPilot/navigator/**
cloudPilot/requests/classes/**
cloudPilot/requests/functions/**
cloudPilot/execution/functions/**
cloudPilot/history/classes/**
cloudPilot/history/functions/**
cloudPilot/history/historyBuilders/**
```

Known imports outside `cloudPilot/` that require updates include:

- `application/atlas/logic/messages.js`
- `application/atlas/functions/instructionFunctions.js`
- `application/atlas/doc/testing/e2e-create-ec2.js`
- `application/atlas/doc/testing/e2e-delete-ec2.js`

Provider imports remain provider imports. This project does not move OpenAI, Atlas, or GitHub provider files.

### Circular-dependency caution

`config/actionMap.js` imports service and remediation handlers, while request, execution, history, and understanding modules import the action map.

The same dependency already exists today. Moving the file must preserve load order and exports exactly; this project must not attempt to redesign the registry.

---

## 9. Migration phases

Each phase is move/rename/import repair only. Stop after each phase and smoke-require the affected entry points.

### Phase 0 — Baseline

- [ ] Record the current JavaScript file inventory.
- [ ] Confirm all current files are represented in this plan.
- [ ] Smoke-require the current message pipeline and all action handlers.
- [ ] Record existing internal and OpenAI configuration values without changing them.

### Phase 1 — Create target folders

- [ ] Create the target `chat`, `requests`, `remediations`, `services`, and `config` structure.
- [ ] Create `cloudPilotIntelligence/understand` and `respond` subfolders required by the map.
- [ ] Do not add implementation files or new behavior.

### Phase 2 — Intelligence boundaries

- [ ] Move `conversation/understand/**` to `cloudPilotIntelligence/understand/**`.
- [ ] Move response production files to `cloudPilotIntelligence/respond/**`.
- [ ] Fix context, provider, action-map, and chat imports.
- [ ] Smoke internal region understanding.
- [ ] Smoke the existing OpenAI region path without changing its switch.
- [ ] Smoke deterministic request responses and the existing general-chat stub/OpenAI behavior.

### Phase 3 — Chat and requests

- [ ] Move the message pipeline into `chat/processMessage.js`.
- [ ] Move general/request chat routers into `chat/`.
- [ ] Move request workflow out of `conversation/`.
- [ ] Move `decision/**` into `requests/` with request-specific names.
- [ ] Flatten request classes/functions as mapped.
- [ ] Fix imports.
- [ ] Smoke general chat, new request, continuation, missing fields, confirmation, cancel, status, and list-open behavior.

### Phase 4 — Remediations

- [ ] Rename `changes/` to `remediations/`.
- [ ] Group CLI and PR helpers beneath their strategies.
- [ ] Fix action-map, request-chat, execution, provider, and helper imports.
- [ ] Smoke toggle, create, delete, and update-tag handler loading.
- [ ] Smoke instructions, CLI, PR, and automatic delivery strategies.

### Phase 5 — Services and presentation

- [ ] Move scans, billing, inventory, and AI usage beneath `services/`.
- [ ] Move shared Navigator response helpers beneath `chat/presentation/`.
- [ ] Rename feature Navigator adapters to Response adapters.
- [ ] Fix handler, provider, presentation, and action-map imports.
- [ ] Smoke EC2 scan, S3 scan, billing, inventory, and AI usage.

### Phase 6 — Execution, history, and config

- [ ] Flatten execution files and rename `executionFunctions.js` to `executionWorkflow.js`.
- [ ] Flatten history files and group builders/undo files.
- [ ] Rename the history Navigator adapter.
- [ ] Move `actionMap.js` to `config/actionMap.js`.
- [ ] Fix all imports.
- [ ] Smoke runAction, AtlasExecution, history listing, and undo.

### Phase 7 — Remove obsolete folders and refresh docs

- [ ] Confirm `conversation/` is empty, then delete it.
- [ ] Confirm `decision/` is empty, then delete it.
- [ ] Confirm `changes/` is empty, then delete it.
- [ ] Confirm top-level `scans/`, `billing/`, `inventory/`, `aiUsage/`, and `navigator/` are empty, then delete them.
- [ ] Remove `cloudPilotIntelligence/.gitkeep`; the root is already populated.
- [ ] Remove `.gitkeep` from `understand/` and `respond/` after they receive files.
- [ ] Keep `.gitkeep` in the still-empty `explain/`, `generate/`, and `improve/` scaffolds.
- [ ] Update Atlas README and architecture path references.
- [ ] Search for stale old-path imports and documentation links.
- [ ] Confirm every original JavaScript file exists at its mapped destination.

### Phase 8 — Final verification and stop

- [ ] Smoke-require the message entry point.
- [ ] Smoke-require every configured action handler.
- [ ] Run available tests.
- [ ] Verify internal and OpenAI switches behave exactly as before.
- [ ] Verify no function signatures or exports changed.
- [ ] Verify no database schema or query changed.
- [ ] Verify no prompt or user-facing copy changed.
- [ ] Mark this physical refactor complete.
- [ ] **Stop before OpenAI toggle work.**

---

## 10. Verification matrix

| Area | Minimum verification |
|---|---|
| Chat | General and request routing still return the same response shape |
| Understanding | Action, conversation, reply, region, instance, name, and tag extraction still load and run |
| Requests | New, continue, missing fields, execution-mode selection, confirmation, cancellation, status |
| Remediations | Toggle, create, delete, update tag; instructions, CLI, PR, automatic |
| Services | EC2 scan, S3 scan, billing, inventory, AI usage |
| Execution | Handler lookup, runAction, AtlasExecution, outcome registry |
| History | Record, list, response adapter, undo registry |
| Intelligence context | Context assembly, system message, current question, conversation history |
| Configuration | Every action still resolves the same definition and handler |
| OpenAI | Existing switches and behavior remain unchanged; no new calls added |

---

## 11. Success criteria

The refactor is complete only when:

1. The target folder tree exists.
2. Every original JavaScript file has one mapped destination.
3. No obsolete top-level concept remains under `cloudPilot/`.
4. `cloudPilot/` reads as work management.
5. `cloudPilotIntelligence/` reads as thinking and communication.
6. All old `require()` paths are gone.
7. Existing smoke tests pass.
8. Runtime behavior is unchanged.
9. OpenAI behavior and switches are unchanged.
10. The next project can address the OpenAI toggle without also moving folders.

---

## 12. Explicitly deferred work

Do not include any of the following in this refactor:

- finishing the OpenAI response toggle;
- changing Internal versus OpenAI routing;
- new AI prompts;
- response-quality redesign;
- moving inventory under scans;
- splitting `atlasEC2Functions.js`;
- replacing legacy Atlas helper shims;
- splitting `actionMap.js` into multiple registries;
- consolidating request helpers;
- consolidating history builders;
- creating new capability abstractions;
- renaming public API response fields;
- changing execution modes;
- changing database tables or queries.

These can be evaluated after the folder migration is complete and stable.
