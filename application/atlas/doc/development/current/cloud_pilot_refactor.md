# CloudPilot Folder Refactor

**Status:** Planning only — no runtime files moved yet
**Scope:** `application/atlas/cloudPilot/` only
**Work type:** Move files, rename files/folders, fix `require()` paths, verify unchanged behavior
**Last updated:** 2026-08-01

---

## Critical scope lock

### Project A — this document

Reorganize `cloudPilot/` around clear product responsibilities.

```text
MOVE
RENAME
FIX IMPORTS
VERIFY
STOP
```

### Project B — later

Design and implement the `CloudPilotIntelligence` facade and finish the Internal/OpenAI toggle.

### Absolute rule for Project A

> **Do not touch `cloudPilotIntelligence/`.**

Project A must not:

- move files into or out of `cloudPilotIntelligence/`;
- edit any Intelligence JavaScript file;
- add the facade;
- remove or add Intelligence `.gitkeep` files;
- change Intelligence exports;
- change Internal/OpenAI selection;
- change prompts or provider behavior.

All current files under `cloudPilotIntelligence/` remain exactly where they are.

---

## Plan authority

This document supersedes the remaining CloudPilot folder phases in:

- `responsibility_refactor.md`
- `project_structure_plan.md`

Their completed provider/context moves remain valid. Do not independently execute their old Phase 4 instruction to move understanding into Intelligence.

### File inventory

```text
cloudPilot/              75 JavaScript files before
cloudPilot/              75 JavaScript files after

cloudPilotIntelligence/   8 JavaScript files before
cloudPilotIntelligence/   8 JavaScript files after — untouched
```

Every current CloudPilot JavaScript file has one destination in this plan.

---

## 1. Goal

CloudPilot manages work.

```text
cloudPilot/
├── chat/             # Talk with the user
├── requests/         # Manage work and request state
├── remediations/     # Change infrastructure
├── services/         # Provide information and analysis
├── execution/        # Run approved work
├── history/          # Remember and undo work
└── actionMap.js      # Register what CloudPilot can do
```

The facade project later establishes:

```text
CloudPilot
    ↓
CloudPilotIntelligence facade
    ↓
Internal rules | OpenAI | Claude | Gemini | Hybrid
```

That facade boundary is protected, but it is not implemented by this move-only refactor.

---

## 2. Protected facade design rule

The long-term rule is:

> **CloudPilot must never directly invoke OpenAI, Claude, provider-specific intelligence, regex engines, or internal intelligence implementations.**
>
> All understanding, response generation, explanation, artifact generation, and future intelligence capabilities must be accessed through the `CloudPilotIntelligence` facade.

The intended public interface is:

```javascript
CloudPilotIntelligence.understand(...)
CloudPilotIntelligence.respond(...)
CloudPilotIntelligence.explain(...)
CloudPilotIntelligence.generate(...)
```

CloudPilot must not need to know whether Intelligence chooses:

```text
Internal
OpenAI
Claude
Gemini
Hybrid
Future model
```

### Current reality

CloudPilot still contains direct intelligence implementation details:

- `CloudPilotMessage.js` directly uses the OpenAI provider;
- `searchMessageForRegion.js` directly chooses Internal/OpenAI behavior;
- understanding contains rules and regex implementation details;
- `cloudPilotMessageFunctions.js` currently imports an OpenAI provider.

Project A preserves these behaviors and only relocates their current files inside `cloudPilot/`.

Project B will place those implementations behind the facade. Do not mix that work into this plan.

---

## 3. Hard constraints

1. Every existing CloudPilot JavaScript file must still exist.
2. All exports and function signatures remain unchanged.
3. Database behavior and queries remain unchanged.
4. User-facing copy remains unchanged.
5. Internal/OpenAI switches remain unchanged.
6. No new feature or abstraction is introduced.
7. No helper is split or consolidated.
8. No provider file is moved.
9. No `cloudPilotIntelligence/` file is touched.
10. Empty old CloudPilot folders are deleted only after all files are moved and imports pass.

---

## 4. First-class responsibility test

| Folder | One-sentence responsibility | First-class? |
|---|---|---|
| `chat/` | Owns the current user-facing chat pipeline and conversation flow. | Yes |
| `requests/` | Owns the lifecycle, state, and next step of in-flight work. | Yes |
| `remediations/` | Owns infrastructure-changing actions and their delivery strategies. | Yes |
| `services/` | Owns read-oriented information and analysis capabilities. | Yes |
| `execution/` | Runs work CloudPilot has approved. | Yes |
| `history/` | Records what CloudPilot changed and performs supported undo operations. | Yes |

### Why there is no `config/` folder yet

`actionMap.js` is currently the only proposed CloudPilot configuration file.

Creating `config/` for one file adds a folder without establishing a meaningful responsibility. Keep `actionMap.js` at the CloudPilot root. A future registry/config project can create `config/` when multiple real configuration files exist.

### Why there is no top-level `navigator/`

Navigator is not a CloudPilot capability. It is client presentation shaping.

The shared Navigator response helper moves beneath `chat/presentation/`. Feature-specific adapters remain beside their service or history capability and receive clearer `ResponseAdapter` names.

---

## 5. Current folder decisions

| Current | Decision | Reason |
|---|---|---|
| `conversation/` | Rename/split into `chat/` and `requests/` | It currently mixes chat, understanding, and request workflow |
| `decision/` | Absorb into `requests/` | It answers what the current request should do next |
| `changes/` | Rename to `remediations/` | It owns infrastructure remediation actions and strategies |
| `scans/` | Move under `services/` | Scans provide read-oriented information and analysis |
| `billing/` | Move under `services/` | Billing is a read-oriented service |
| `inventory/` | Move under `services/` | Inventory is a read-oriented service |
| `aiUsage/` | Move under `services/` | AI usage is a read-oriented service |
| `navigator/` | Remove as a top-level concept | Shared response shaping belongs to chat presentation |
| `execution/` | Keep as a top-level capability | Clear responsibility |
| `history/` | Keep as a top-level capability | Clear responsibility |
| `requests/` | Keep as a top-level capability | Clear responsibility |
| `actionMap.js` | Keep at CloudPilot root | One canonical capability registry |

---

## 6. Important ownership decisions

### Chat remains responsible for current response orchestration

The following files stay in CloudPilot and move under `chat/`:

- `CloudPilotMessage.js`
- `generalChat.js`
- `requestTemplates.js`
- `fieldPromptExamples.js`

They must not move into Intelligence during Project A.

`CloudPilotMessage.js` currently owns provider gating, history loading, logging, response formatting, and deterministic request responses. Project B may later extract pure intelligence operations behind the facade.

### Understanding temporarily remains in CloudPilot

Because `cloudPilotIntelligence/` is frozen, the existing understanding implementation moves only from:

```text
cloudPilot/conversation/understand/
```

to:

```text
cloudPilot/chat/understand/
```

This is an intentional temporary location. Project B will make CloudPilot call:

```javascript
CloudPilotIntelligence.understand(...)
```

without knowing where regex, rules, Internal, or provider-specific implementation lives.

### Decision belongs to requests

`decideNextStep.js` consumes understanding plus loaded request state and determines the next request transition. It is request workflow, not Intelligence.

### Service-specific output remains with its service

Formatters, deterministic message builders, and service response adapters remain beside scans, billing, inventory, and AI usage.

They are part of each service's current output contract. Moving them to Intelligence would scatter one service across multiple systems without changing behavior.

### Mixed legacy helpers remain intact

These files have imperfect ownership but must not be split during a move-only refactor:

- `atlasEC2Functions.js`
- `atlasAWSFunctions.js`
- `AtlasExecution.js`

Their cleanup is separate work.

---

## 7. Final target tree

```text
cloudPilot/
├── actionMap.js
│
├── chat/
│   ├── processMessage.js
│   ├── CloudPilotMessage.js
│   ├── general/
│   │   ├── GeneralConversation.js
│   │   ├── generalChat.js
│   │   └── workflow.js
│   ├── request/
│   │   └── RequestConversation.js
│   ├── templates/
│   │   ├── fieldPromptExamples.js
│   │   └── requestTemplates.js
│   ├── understand/
│   │   ├── understandMessage.js
│   │   └── search/
│   │       ├── searchMessageForAction.js
│   │       ├── searchMessageForConversation.js
│   │       ├── searchMessageForInstanceId.js
│   │       ├── searchMessageForInstanceType.js
│   │       ├── searchMessageForName.js
│   │       ├── searchMessageForRegion.js
│   │       ├── searchMessageForReply.js
│   │       ├── searchMessageForStructuredFields.js
│   │       ├── searchMessageForTagUpdate.js
│   │       └── searchMessageForValues.js
│   └── presentation/
│       └── navigatorResponseFunctions.js
│
├── requests/
│   ├── ActionState.js
│   ├── Request.js
│   ├── decideNextStep.js
│   ├── decisionTypes.js
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
│   ├── strategies/
│   │   ├── automatic.js
│   │   ├── cli.js
│   │   ├── instructions.js
│   │   └── pr.js
│   ├── cli/
│   │   └── cliTemplates.js
│   └── pr/
│       ├── createToggleEc2PullRequest.js
│       └── prTemplates.js
│
├── services/
│   ├── scans/
│   │   ├── ec2/
│   │   │   ├── atlasEC2Formatter.js
│   │   │   ├── atlasEC2Functions.js
│   │   │   ├── atlasEC2MessageBuilder.js
│   │   │   ├── ec2ScanResponseAdapter.js
│   │   │   └── scanEC2Handler.js
│   │   └── s3/
│   │       ├── atlasS3Formatter.js
│   │       ├── atlasS3Functions.js
│   │       ├── atlasS3MessageBuilder.js
│   │       ├── s3ScanResponseAdapter.js
│   │       └── scanS3Handler.js
│   ├── billing/
│   │   ├── atlasAWSBillingMessage.js
│   │   ├── atlasBillingFunctions.js
│   │   ├── billingAWSHandler.js
│   │   └── billingResponseAdapter.js
│   ├── inventory/
│   │   ├── atlasAWSFunctions.js
│   │   ├── atlasAWSInventoryFormatter.js
│   │   ├── atlasAWSInventoryMessageBuilder.js
│   │   ├── inventoryAWSHandler.js
│   │   └── inventoryResponseAdapter.js
│   └── aiUsage/
│       ├── aiUsageMessageBuilder.js
│       └── showAiUsageHandler.js
│
├── execution/
│   ├── AtlasExecution.js
│   ├── executionWorkflow.js
│   ├── runAction.js
│   └── outcomes/
│       └── outcomeRegistry.js
│
└── history/
    ├── History.js
    ├── historyFunctions.js
    ├── historyActionNameFunctions.js
    ├── historyResponseAdapter.js
    ├── builders/
    │   ├── createEc2History.js
    │   ├── ec2History.js
    │   └── toggleEc2History.js
    └── undo/
        ├── undoFunctions.js
        └── undoRegistry.js
```

### Intelligence remains unchanged

The target tree deliberately does not reproduce or modify `cloudPilotIntelligence/`.

Project A treats the entire folder as read-only.

---

## 8. Complete file migration map

### Root

| Current | Target |
|---|---|
| `cloudPilot/actionMap.js` | `cloudPilot/actionMap.js` |
| `cloudPilot/cloudPilotMessageFunctions.js` | `cloudPilot/chat/processMessage.js` |

### Conversation to chat

| Current | Target |
|---|---|
| `cloudPilot/conversation/CloudPilotMessage.js` | `cloudPilot/chat/CloudPilotMessage.js` |
| `cloudPilot/conversation/general/GeneralConversation.js` | `cloudPilot/chat/general/GeneralConversation.js` |
| `cloudPilot/conversation/general/generalChat.js` | `cloudPilot/chat/general/generalChat.js` |
| `cloudPilot/conversation/general/workflow.js` | `cloudPilot/chat/general/workflow.js` |
| `cloudPilot/conversation/request/RequestConversation.js` | `cloudPilot/chat/request/RequestConversation.js` |
| `cloudPilot/conversation/templates/fieldPromptExamples.js` | `cloudPilot/chat/templates/fieldPromptExamples.js` |
| `cloudPilot/conversation/templates/requestTemplates.js` | `cloudPilot/chat/templates/requestTemplates.js` |

### Request workflow

| Current | Target |
|---|---|
| `cloudPilot/conversation/request/workflow.js` | `cloudPilot/requests/requestWorkflow.js` |
| `cloudPilot/decision/decideNextStep.js` | `cloudPilot/requests/decideNextStep.js` |
| `cloudPilot/decision/decisionTypes.js` | `cloudPilot/requests/decisionTypes.js` |
| `cloudPilot/requests/classes/ActionState.js` | `cloudPilot/requests/ActionState.js` |
| `cloudPilot/requests/classes/Request.js` | `cloudPilot/requests/Request.js` |
| `cloudPilot/requests/functions/requestFunctions.js` | `cloudPilot/requests/requestFunctions.js` |
| `cloudPilot/requests/functions/requestLoadFunctions.js` | `cloudPilot/requests/requestLoadFunctions.js` |
| `cloudPilot/requests/functions/requestNameFunctions.js` | `cloudPilot/requests/requestNameFunctions.js` |
| `cloudPilot/requests/functions/requestStatusFunctions.js` | `cloudPilot/requests/requestStatusFunctions.js` |

### Understanding stays inside CloudPilot

| Current | Target |
|---|---|
| `cloudPilot/conversation/understand/understandMessage.js` | `cloudPilot/chat/understand/understandMessage.js` |
| `cloudPilot/conversation/understand/search/searchMessageForAction.js` | `cloudPilot/chat/understand/search/searchMessageForAction.js` |
| `cloudPilot/conversation/understand/search/searchMessageForConversation.js` | `cloudPilot/chat/understand/search/searchMessageForConversation.js` |
| `cloudPilot/conversation/understand/search/searchMessageForInstanceId.js` | `cloudPilot/chat/understand/search/searchMessageForInstanceId.js` |
| `cloudPilot/conversation/understand/search/searchMessageForInstanceType.js` | `cloudPilot/chat/understand/search/searchMessageForInstanceType.js` |
| `cloudPilot/conversation/understand/search/searchMessageForName.js` | `cloudPilot/chat/understand/search/searchMessageForName.js` |
| `cloudPilot/conversation/understand/search/searchMessageForRegion.js` | `cloudPilot/chat/understand/search/searchMessageForRegion.js` |
| `cloudPilot/conversation/understand/search/searchMessageForReply.js` | `cloudPilot/chat/understand/search/searchMessageForReply.js` |
| `cloudPilot/conversation/understand/search/searchMessageForStructuredFields.js` | `cloudPilot/chat/understand/search/searchMessageForStructuredFields.js` |
| `cloudPilot/conversation/understand/search/searchMessageForTagUpdate.js` | `cloudPilot/chat/understand/search/searchMessageForTagUpdate.js` |
| `cloudPilot/conversation/understand/search/searchMessageForValues.js` | `cloudPilot/chat/understand/search/searchMessageForValues.js` |

### Changes to remediations

| Current | Target |
|---|---|
| `cloudPilot/changes/toggleEC2/toggleEC2Handler.js` | `cloudPilot/remediations/toggleEC2/toggleEC2Handler.js` |
| `cloudPilot/changes/createEC2/createEC2Handler.js` | `cloudPilot/remediations/createEC2/createEC2Handler.js` |
| `cloudPilot/changes/deleteEC2/deleteEC2Handler.js` | `cloudPilot/remediations/deleteEC2/deleteEC2Handler.js` |
| `cloudPilot/changes/updateEC2Tag/updateEC2TagHandler.js` | `cloudPilot/remediations/updateEC2Tag/updateEC2TagHandler.js` |
| `cloudPilot/changes/strategies/automatic.js` | `cloudPilot/remediations/strategies/automatic.js` |
| `cloudPilot/changes/strategies/cli.js` | `cloudPilot/remediations/strategies/cli.js` |
| `cloudPilot/changes/strategies/instructions.js` | `cloudPilot/remediations/strategies/instructions.js` |
| `cloudPilot/changes/strategies/pr.js` | `cloudPilot/remediations/strategies/pr.js` |
| `cloudPilot/changes/cli/cliTemplates.js` | `cloudPilot/remediations/cli/cliTemplates.js` |
| `cloudPilot/changes/pr/createToggleEc2PullRequest.js` | `cloudPilot/remediations/pr/createToggleEc2PullRequest.js` |
| `cloudPilot/changes/pr/prTemplates.js` | `cloudPilot/remediations/pr/prTemplates.js` |

### Services

| Current | Target |
|---|---|
| `cloudPilot/scans/ec2/atlasEC2Formatter.js` | `cloudPilot/services/scans/ec2/atlasEC2Formatter.js` |
| `cloudPilot/scans/ec2/atlasEC2Functions.js` | `cloudPilot/services/scans/ec2/atlasEC2Functions.js` |
| `cloudPilot/scans/ec2/atlasEC2MessageBuilder.js` | `cloudPilot/services/scans/ec2/atlasEC2MessageBuilder.js` |
| `cloudPilot/scans/ec2/atlasEC2ScanNavigatorAdapter.js` | `cloudPilot/services/scans/ec2/ec2ScanResponseAdapter.js` |
| `cloudPilot/scans/ec2/scanEC2Handler.js` | `cloudPilot/services/scans/ec2/scanEC2Handler.js` |
| `cloudPilot/scans/s3/atlasS3Formatter.js` | `cloudPilot/services/scans/s3/atlasS3Formatter.js` |
| `cloudPilot/scans/s3/atlasS3Functions.js` | `cloudPilot/services/scans/s3/atlasS3Functions.js` |
| `cloudPilot/scans/s3/atlasS3MessageBuilder.js` | `cloudPilot/services/scans/s3/atlasS3MessageBuilder.js` |
| `cloudPilot/scans/s3/atlasS3ScanNavigatorAdapter.js` | `cloudPilot/services/scans/s3/s3ScanResponseAdapter.js` |
| `cloudPilot/scans/s3/scanS3Handler.js` | `cloudPilot/services/scans/s3/scanS3Handler.js` |
| `cloudPilot/billing/atlasAWSBillingMessage.js` | `cloudPilot/services/billing/atlasAWSBillingMessage.js` |
| `cloudPilot/billing/atlasAWSBillingNavigator.js` | `cloudPilot/services/billing/billingResponseAdapter.js` |
| `cloudPilot/billing/atlasBillingFunctions.js` | `cloudPilot/services/billing/atlasBillingFunctions.js` |
| `cloudPilot/billing/billingAWSHandler.js` | `cloudPilot/services/billing/billingAWSHandler.js` |
| `cloudPilot/inventory/atlasAWSFunctions.js` | `cloudPilot/services/inventory/atlasAWSFunctions.js` |
| `cloudPilot/inventory/atlasAWSInventoryFormatter.js` | `cloudPilot/services/inventory/atlasAWSInventoryFormatter.js` |
| `cloudPilot/inventory/atlasAWSInventoryMessageBuilder.js` | `cloudPilot/services/inventory/atlasAWSInventoryMessageBuilder.js` |
| `cloudPilot/inventory/atlasAWSInventoryNavigatorAdapter.js` | `cloudPilot/services/inventory/inventoryResponseAdapter.js` |
| `cloudPilot/inventory/inventoryAWSHandler.js` | `cloudPilot/services/inventory/inventoryAWSHandler.js` |
| `cloudPilot/aiUsage/aiUsageMessageBuilder.js` | `cloudPilot/services/aiUsage/aiUsageMessageBuilder.js` |
| `cloudPilot/aiUsage/showAiUsageHandler.js` | `cloudPilot/services/aiUsage/showAiUsageHandler.js` |
| `cloudPilot/navigator/functions/navigatorFunctions.js` | `cloudPilot/chat/presentation/navigatorResponseFunctions.js` |

### Execution

| Current | Target |
|---|---|
| `cloudPilot/execution/AtlasExecution.js` | `cloudPilot/execution/AtlasExecution.js` |
| `cloudPilot/execution/functions/executionFunctions.js` | `cloudPilot/execution/executionWorkflow.js` |
| `cloudPilot/execution/functions/runAction.js` | `cloudPilot/execution/runAction.js` |
| `cloudPilot/execution/outcomes/outcomeRegistry.js` | `cloudPilot/execution/outcomes/outcomeRegistry.js` |

### History

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

---

## 9. Import impact

All imports referencing these old locations must be updated:

```text
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

Known callers outside `cloudPilot/`:

- `application/atlas/logic/messages.js`
- `application/atlas/functions/instructionFunctions.js` only if action-map-relative imports change
- `application/atlas/doc/testing/e2e-create-ec2.js`
- `application/atlas/doc/testing/e2e-delete-ec2.js`

### Existing Intelligence imports

CloudPilot files may continue importing the existing Intelligence context files exactly as needed after their own relative paths change.

No import inside `cloudPilotIntelligence/` may be edited.

If moving a CloudPilot consumer would require editing an Intelligence source file, fix the CloudPilot-side location/import instead. Intelligence remains read-only.

---

## 10. Migration phases

### Phase 0 — Baseline

- [ ] Record all 75 current CloudPilot JavaScript paths.
- [ ] Smoke-require the current message pipeline and every action handler.
- [ ] Record existing Internal/OpenAI switch behavior without changing it.

### Phase 1 — Create CloudPilot target folders

- [ ] Create `chat/`, `remediations/`, `services/`, and their mapped subfolders.
- [ ] Create new request, execution, and history subfolders required by the map.
- [ ] Do not create or edit anything under `cloudPilotIntelligence/`.

### Phase 2 — Chat and requests

- [ ] Move `cloudPilotMessageFunctions.js` to `chat/processMessage.js`.
- [ ] Move current conversation files to `chat/`.
- [ ] Move current understanding files to `chat/understand/`.
- [ ] Move request workflow and decision files into `requests/`.
- [ ] Move request classes/functions as mapped.
- [ ] Fix CloudPilot and external entry imports.
- [ ] Smoke general chat and request lifecycle behavior.
- [ ] Confirm Intelligence files are unchanged.

### Phase 3 — Remediations

- [ ] Rename/move `changes/` to `remediations/`.
- [ ] Preserve handler, strategy, CLI, and PR behavior.
- [ ] Fix action-map, chat, execution, provider, and helper imports.
- [ ] Smoke toggle, create, delete, update tag, instructions, CLI, PR, and automatic paths.

### Phase 4 — Services and presentation

- [ ] Move scans, billing, inventory, and AI usage beneath `services/`.
- [ ] Move shared Navigator response helpers beneath `chat/presentation/`.
- [ ] Rename Navigator adapters to Response adapters.
- [ ] Fix service, history, execution, provider, and action-map imports.
- [ ] Smoke EC2 scan, S3 scan, billing, inventory, AI usage, and history presentation.

### Phase 5 — Execution and history

- [ ] Move/rename execution files as mapped.
- [ ] Move/rename history files as mapped.
- [ ] Fix all imports.
- [ ] Smoke runAction, AtlasExecution, outcome handling, history recording/listing, and undo.

### Phase 6 — Cleanup

- [ ] Confirm `conversation/` is empty, then delete it.
- [ ] Confirm `decision/` is empty, then delete it.
- [ ] Confirm `changes/` is empty, then delete it.
- [ ] Confirm top-level `scans/`, `billing/`, `inventory/`, `aiUsage/`, and `navigator/` are empty, then delete them.
- [ ] Search JavaScript and docs for stale old paths.
- [ ] Refresh Atlas README and architecture path references.
- [ ] Confirm all 75 CloudPilot JavaScript files exist at mapped destinations.
- [ ] Confirm `cloudPilotIntelligence/` has no diff.

### Phase 7 — Final verification and stop

- [ ] Smoke-require the new chat entry.
- [ ] Smoke-require every configured action handler.
- [ ] Run available tests.
- [ ] Verify exports and function signatures are unchanged.
- [ ] Verify database behavior is unchanged.
- [ ] Verify user-facing copy is unchanged.
- [ ] Verify Internal/OpenAI behavior is unchanged.
- [ ] Verify `cloudPilotIntelligence/` is untouched.
- [ ] Mark Project A complete.
- [ ] **Stop before Project B.**

---

## 11. Verification matrix

| Area | Minimum verification |
|---|---|
| Chat | General and request routing return the same shape |
| Understanding | Existing action, conversation, reply, region, instance, name, and tag extraction behave the same |
| Requests | New, continue, missing fields, mode selection, confirmation, cancellation, status |
| Remediations | Toggle, create, delete, update tag; instructions, CLI, PR, automatic |
| Services | EC2 scan, S3 scan, billing, inventory, AI usage |
| Presentation | Scan, billing, inventory, and history Navigator payloads remain unchanged |
| Execution | Handler lookup, runAction, AtlasExecution, outcome registry |
| History | Record, list, response adapter, undo |
| OpenAI | Existing switches and direct behavior remain unchanged |
| Intelligence | No file changes and no new facade yet |

---

## 12. Success criteria

Project A is complete only when:

1. `cloudPilot/` has the target responsibility structure.
2. Every original CloudPilot JavaScript file has one mapped destination.
3. All 75 CloudPilot JavaScript files still exist.
4. Obsolete CloudPilot top-level folders are gone.
5. All stale old-path imports are gone.
6. Existing runtime behavior passes smoke checks.
7. No prompt, switch, query, export, or response contract changed.
8. `cloudPilotIntelligence/` has no diff.
9. CloudPilot is ready for the facade project without mixing that project into this refactor.

---

## 13. Explicitly deferred to Project B

Do not perform any of this work during Project A:

- create the `CloudPilotIntelligence` facade;
- move understanding into Intelligence;
- move response code into Intelligence;
- replace direct OpenAI calls;
- finish Internal/OpenAI toggles;
- add Claude, Gemini, hybrid, or other provider selection;
- redesign prompts or responses;
- split `CloudPilotMessage.js`;
- split `searchMessageForRegion.js`;
- split `actionMap.js`;
- move inventory under scans;
- split legacy Atlas helper files;
- consolidate request or history helpers;
- introduce new capability abstractions.

Project B begins only after this folder migration is complete and verified.
