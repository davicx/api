# CloudPilot Folder Refactor

**Status:** Planning only — no runtime files moved yet
**Scope:** `application/atlas/cloudPilot/` only
**Work type:** Move folders/files, fix `require()` paths, verify unchanged behavior
**Last updated:** 2026-08-01

---

## Critical scope lock

### Project A — this document

Reorganize `cloudPilot/` around clear product responsibilities.

```text
MOVE FOLDERS
PRESERVE FILENAMES
FIX IMPORTS
SMOKE
COMMIT
STOP AFTER EACH PHASE
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

### General rule for Project A

> Prioritize responsibility-based folder organization while minimizing churn. Move folders, preserve filenames whenever reasonable, preserve behavior, and defer cosmetic renames and internal cleanup to later projects.

---

## Execution locks (answered before start)

### Flattening

**Keep existing `classes/` and `functions/` wrappers.**

This refactor is about moving responsibilities, not reorganizing every capability internally. Do not flatten folders simply to reduce nesting.

### Renames

**Avoid unnecessary file renames.**

For Project A:

- **Keep** `cloudPilotMessageFunctions.js`
- **Keep** `executionFunctions.js`
- **Keep** existing `*NavigatorAdapter.js` filenames
- **Keep** `navigatorFunctions.js`
- **Keep** `historyBuilders/` folder name
- **Keep** `workflow.js` filename when moved under `requests/`

Only move files into their new responsibility folders. Filename cleanup is a later project.

### Phasing

**Stop after every phase.**

1. Move one responsibility.
2. Fix imports.
3. Smoke test.
4. Commit.
5. Continue.

Do not perform the entire migration in one pass.

### Documentation

**JavaScript moves and import fixes first.**

After the code is stable:

- update README
- update architecture documents
- update stale paths
- remove obsolete folder references

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
├── actionMap.js              # What CloudPilot can do
│
├── chat/                     # User interaction
│   ├── cloudPilotMessageFunctions.js
│   ├── CloudPilotMessage.js
│   ├── general/
│   ├── request/
│   ├── templates/
│   ├── understand/           # Temporary (moves behind facade in Project B)
│   └── presentation/
│
├── requests/                 # Request lifecycle
│   ├── classes/
│   ├── functions/
│   ├── decideNextStep.js
│   ├── decisionTypes.js
│   └── workflow.js
│
├── remediations/             # Infrastructure changes
│   ├── createEC2/
│   ├── deleteEC2/
│   ├── toggleEC2/
│   ├── updateEC2Tag/
│   ├── strategies/
│   ├── cli/
│   └── pr/
│
├── services/                 # Read-only capabilities
│   ├── scans/
│   │   ├── ec2/
│   │   └── s3/
│   ├── billing/
│   ├── inventory/
│   └── aiUsage/
│
├── execution/                # Execute approved work
│   ├── AtlasExecution.js
│   ├── functions/
│   └── outcomes/
│
└── history/                  # Record & undo
    ├── classes/
    ├── functions/
    ├── historyBuilders/
    ├── historyNavigatorAdapter.js
    └── undoRegistry.js
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
2. Preserve filenames unless a folder move requires an unavoidable path change.
3. Keep existing `classes/` and `functions/` wrappers.
4. All exports and function signatures remain unchanged.
5. Database behavior and queries remain unchanged.
6. User-facing copy remains unchanged.
7. Internal/OpenAI switches remain unchanged.
8. No new feature or abstraction is introduced.
9. No helper is split or consolidated.
10. No provider file is moved.
11. No `cloudPilotIntelligence/` file is touched.
12. Empty old CloudPilot folders are deleted only after their phase completes and imports pass.
13. Stop, smoke, and commit after each phase.
14. Documentation updates happen after the JavaScript migration is stable.

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

`actionMap.js` is currently the only proposed CloudPilot configuration file. Keep it at the CloudPilot root.

### Why there is no top-level `navigator/`

Navigator is not a CloudPilot capability. It is client presentation shaping.

The shared helper moves beneath `chat/presentation/` and **keeps its filename** (`navigatorFunctions.js`). Feature-specific `*NavigatorAdapter.js` files remain beside their service or history capability and **keep their filenames**.

---

## 5. Current folder decisions

| Current | Decision | Reason |
|---|---|---|
| `conversation/` | Split into `chat/` (+ temporary `chat/understand/`) and `requests/workflow.js` | Mixes chat, understanding, and request workflow |
| `decision/` | Absorb into `requests/` | Answers what the current request should do next |
| `changes/` | Rename folder to `remediations/` | Owns infrastructure remediations |
| `scans/` | Move under `services/` | Read-oriented |
| `billing/` | Move under `services/` | Read-oriented |
| `inventory/` | Move under `services/` | Read-oriented |
| `aiUsage/` | Move under `services/` | Read-oriented |
| `navigator/` | Move shared helper under `chat/presentation/` | Not a first-class capability |
| `execution/` | Keep | Clear responsibility |
| `history/` | Keep internal layout | Clear responsibility |
| `requests/` | Keep `classes/` and `functions/` | Minimize churn |
| `actionMap.js` | Keep at CloudPilot root | One canonical capability registry |

---

## 6. Important ownership decisions

### Chat remains responsible for current response orchestration

These stay in CloudPilot under `chat/`:

- `CloudPilotMessage.js`
- `generalChat.js`
- `requestTemplates.js`
- `fieldPromptExamples.js`

They must not move into Intelligence during Project A.

### Understanding temporarily remains in CloudPilot

```text
cloudPilot/conversation/understand/  →  cloudPilot/chat/understand/
```

Project B later makes CloudPilot call `CloudPilotIntelligence.understand(...)`.

### Decision belongs to requests

`decideNextStep.js` and `decisionTypes.js` move into `requests/` with the same filenames.

### Request conversation workflow belongs to requests

```text
cloudPilot/conversation/request/workflow.js  →  cloudPilot/requests/workflow.js
```

`RequestConversation.js` stays under `chat/request/` because it owns speak routing for request chat.

### Service-specific output remains with its service

Formatters, message builders, and `*NavigatorAdapter.js` files remain beside their service. Filenames stay the same.

### Mixed legacy helpers remain intact

Do not split during this refactor:

- `atlasEC2Functions.js`
- `atlasAWSFunctions.js`
- `AtlasExecution.js`

---

## 7. Final target tree

```text
cloudPilot/
├── actionMap.js
│
├── chat/
│   ├── cloudPilotMessageFunctions.js
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
│       └── navigatorFunctions.js
│
├── requests/
│   ├── classes/
│   │   ├── ActionState.js
│   │   └── Request.js
│   ├── functions/
│   │   ├── requestFunctions.js
│   │   ├── requestLoadFunctions.js
│   │   ├── requestNameFunctions.js
│   │   └── requestStatusFunctions.js
│   ├── decideNextStep.js
│   ├── decisionTypes.js
│   └── workflow.js
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
│   │   │   ├── atlasEC2ScanNavigatorAdapter.js
│   │   │   └── scanEC2Handler.js
│   │   └── s3/
│   │       ├── atlasS3Formatter.js
│   │       ├── atlasS3Functions.js
│   │       ├── atlasS3MessageBuilder.js
│   │       ├── atlasS3ScanNavigatorAdapter.js
│   │       └── scanS3Handler.js
│   ├── billing/
│   │   ├── atlasAWSBillingMessage.js
│   │   ├── atlasAWSBillingNavigator.js
│   │   ├── atlasBillingFunctions.js
│   │   └── billingAWSHandler.js
│   ├── inventory/
│   │   ├── atlasAWSFunctions.js
│   │   ├── atlasAWSInventoryFormatter.js
│   │   ├── atlasAWSInventoryMessageBuilder.js
│   │   ├── atlasAWSInventoryNavigatorAdapter.js
│   │   └── inventoryAWSHandler.js
│   └── aiUsage/
│       ├── aiUsageMessageBuilder.js
│       └── showAiUsageHandler.js
│
├── execution/
│   ├── AtlasExecution.js
│   ├── functions/
│   │   ├── executionFunctions.js
│   │   └── runAction.js
│   └── outcomes/
│       └── outcomeRegistry.js
│
└── history/
    ├── classes/
    │   └── History.js
    ├── functions/
    │   ├── historyActionNameFunctions.js
    │   ├── historyFunctions.js
    │   └── undoFunctions.js
    ├── historyBuilders/
    │   ├── createEc2History.js
    │   ├── ec2History.js
    │   └── toggleEc2History.js
    ├── historyNavigatorAdapter.js
    └── undoRegistry.js
```

### Intelligence remains unchanged

Project A treats `cloudPilotIntelligence/` as read-only.

---

## 8. Complete file migration map

Filenames are preserved. Only folder locations change.

### Root → chat entry

| Current | Target |
|---|---|
| `cloudPilot/actionMap.js` | `cloudPilot/actionMap.js` |
| `cloudPilot/cloudPilotMessageFunctions.js` | `cloudPilot/chat/cloudPilotMessageFunctions.js` |

### Conversation → chat

| Current | Target |
|---|---|
| `cloudPilot/conversation/CloudPilotMessage.js` | `cloudPilot/chat/CloudPilotMessage.js` |
| `cloudPilot/conversation/general/GeneralConversation.js` | `cloudPilot/chat/general/GeneralConversation.js` |
| `cloudPilot/conversation/general/generalChat.js` | `cloudPilot/chat/general/generalChat.js` |
| `cloudPilot/conversation/general/workflow.js` | `cloudPilot/chat/general/workflow.js` |
| `cloudPilot/conversation/request/RequestConversation.js` | `cloudPilot/chat/request/RequestConversation.js` |
| `cloudPilot/conversation/templates/fieldPromptExamples.js` | `cloudPilot/chat/templates/fieldPromptExamples.js` |
| `cloudPilot/conversation/templates/requestTemplates.js` | `cloudPilot/chat/templates/requestTemplates.js` |

### Understanding → temporary chat/understand

| Current | Target |
|---|---|
| `cloudPilot/conversation/understand/understandMessage.js` | `cloudPilot/chat/understand/understandMessage.js` |
| `cloudPilot/conversation/understand/search/*` | `cloudPilot/chat/understand/search/*` (same filenames) |

### Decision + request workflow → requests

| Current | Target |
|---|---|
| `cloudPilot/decision/decideNextStep.js` | `cloudPilot/requests/decideNextStep.js` |
| `cloudPilot/decision/decisionTypes.js` | `cloudPilot/requests/decisionTypes.js` |
| `cloudPilot/conversation/request/workflow.js` | `cloudPilot/requests/workflow.js` |
| `cloudPilot/requests/classes/ActionState.js` | `cloudPilot/requests/classes/ActionState.js` |
| `cloudPilot/requests/classes/Request.js` | `cloudPilot/requests/classes/Request.js` |
| `cloudPilot/requests/functions/*` | `cloudPilot/requests/functions/*` (same filenames) |

### Changes → remediations

| Current | Target |
|---|---|
| `cloudPilot/changes/**` | `cloudPilot/remediations/**` (same internal filenames and layout) |

### Services

| Current | Target |
|---|---|
| `cloudPilot/scans/**` | `cloudPilot/services/scans/**` |
| `cloudPilot/billing/**` | `cloudPilot/services/billing/**` |
| `cloudPilot/inventory/**` | `cloudPilot/services/inventory/**` |
| `cloudPilot/aiUsage/**` | `cloudPilot/services/aiUsage/**` |
| `cloudPilot/navigator/functions/navigatorFunctions.js` | `cloudPilot/chat/presentation/navigatorFunctions.js` |

### Execution and history

| Current | Target |
|---|---|
| `cloudPilot/execution/**` | `cloudPilot/execution/**` (same filenames; keep `functions/` and `outcomes/`) |
| `cloudPilot/history/**` | `cloudPilot/history/**` (same filenames; keep `classes/`, `functions/`, `historyBuilders/`) |

No file renames inside execution or history for Project A. Those folders mostly stay put; only import paths change when their dependencies move.

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
```

Known callers outside `cloudPilot/`:

- `application/atlas/logic/messages.js`
- `application/atlas/doc/testing/e2e-create-ec2.js`
- `application/atlas/doc/testing/e2e-delete-ec2.js`

`instructionFunctions.js` continues to import `cloudPilot/actionMap` at the root (unchanged path).

### Existing Intelligence imports

CloudPilot files may continue importing existing Intelligence context files after their own relative paths change.

No import inside `cloudPilotIntelligence/` may be edited.

If moving a CloudPilot consumer would require editing an Intelligence source file, fix the CloudPilot-side location/import instead.

---

## 10. Migration phases

Stop after every phase: move → fix imports → smoke → commit → continue.

### Phase 0 — Baseline

- [x] Record all 75 current CloudPilot JavaScript paths.
- [x] Smoke-require the current message pipeline and every action handler.
- [x] Record existing Internal/OpenAI switch behavior without changing it.

### Phase 1 — Chat + requests (+ temporary understand)

- [x] Create `chat/` target folders.
- [x] Move `cloudPilotMessageFunctions.js` to `chat/cloudPilotMessageFunctions.js`.
- [x] Move conversation speak/general/request/templates into `chat/`.
- [x] Move `conversation/understand/**` to `chat/understand/**`.
- [x] Move `decision/**` into `requests/`.
- [x] Move `conversation/request/workflow.js` to `requests/workflow.js`.
- [x] Keep `requests/classes/` and `requests/functions/` as-is.
- [x] Fix imports.
- [x] Smoke general chat and request lifecycle.
- [x] Confirm `cloudPilotIntelligence/` has no diff.
- [x] Commit. Stop.

### Phase 2 — Remediations

- [x] Move/rename folder `changes/` → `remediations/` (same internal filenames).
- [x] Fix action-map, chat, execution, provider, and helper imports.
- [x] Smoke toggle, create, delete, update tag, instructions, CLI, PR, automatic.
- [x] Confirm Intelligence untouched.
- [x] Commit. Stop.

### Phase 3 — Services + presentation helper

- [x] Move scans, billing, inventory, and AI usage beneath `services/`.
- [x] Move `navigator/functions/navigatorFunctions.js` to `chat/presentation/navigatorFunctions.js`.
- [x] Keep all `*NavigatorAdapter.js` filenames.
- [x] Fix imports.
- [x] Smoke EC2 scan, S3 scan, billing, inventory, AI usage, history presentation.
- [x] Confirm Intelligence untouched.
- [x] Commit. Stop.

### Phase 4 — Cleanup empty CloudPilot folders

- [ ] Confirm and delete empty: `conversation/`, `decision/`, `changes/`, top-level `scans/`, `billing/`, `inventory/`, `aiUsage/`, `navigator/`.
- [ ] Search JavaScript for stale old-path imports.
- [ ] Confirm all 75 CloudPilot JavaScript files exist at mapped destinations.
- [ ] Confirm `cloudPilotIntelligence/` has no diff.
- [ ] Commit. Stop.

### Phase 5 — Documentation (after code is stable)

- [ ] Update Atlas README.
- [ ] Update architecture / current development path references.
- [ ] Remove obsolete folder references.
- [ ] Mark Project A complete.
- [ ] **Stop before Project B.**

---

## 11. Verification matrix

| Area | Minimum verification |
|---|---|
| Chat | General and request routing return the same shape |
| Understanding | Existing extractors behave the same from `chat/understand/` |
| Requests | New, continue, missing fields, mode selection, confirmation, cancellation, status |
| Remediations | Toggle, create, delete, update tag; instructions, CLI, PR, automatic |
| Services | EC2 scan, S3 scan, billing, inventory, AI usage |
| Presentation | Navigator payloads remain unchanged |
| Execution | Handler lookup, runAction, AtlasExecution, outcome registry |
| History | Record, list, navigator adapter, undo |
| OpenAI | Existing switches and direct behavior remain unchanged |
| Intelligence | No file changes and no new facade yet |

---

## 12. Success criteria

Project A is complete only when:

1. `cloudPilot/` has the target responsibility structure.
2. Every original CloudPilot JavaScript file has one mapped destination.
3. All 75 CloudPilot JavaScript files still exist with their original filenames.
4. Obsolete CloudPilot top-level folders are gone.
5. All stale old-path JavaScript imports are gone.
6. Existing runtime behavior passes smoke checks.
7. No prompt, switch, query, export, or response contract changed.
8. `cloudPilotIntelligence/` has no diff.
9. Documentation is updated after the code is stable.
10. CloudPilot is ready for the facade project without mixing that project into this refactor.

---

## 13. Explicitly deferred

Do not perform any of this work during Project A:

- create the `CloudPilotIntelligence` facade;
- move understanding into Intelligence;
- move response code into Intelligence;
- replace direct OpenAI calls;
- finish Internal/OpenAI toggles;
- add Claude, Gemini, hybrid, or other provider selection;
- redesign prompts or responses;
- rename files for cosmetic clarity;
- flatten `classes/` / `functions/` wrappers;
- rename `*NavigatorAdapter.js` files;
- rename `cloudPilotMessageFunctions.js` or `executionFunctions.js`;
- split `CloudPilotMessage.js` or `searchMessageForRegion.js`;
- split `actionMap.js`;
- move inventory under scans;
- split legacy Atlas helper files;
- consolidate request or history helpers;
- introduce new capability abstractions.

Project B begins only after this folder migration is complete and verified.
