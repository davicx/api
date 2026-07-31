# CloudPilot Architecture Refactor — Final Plan

**Status:** Phase 1 done · Phase 2 approved (docs) · **code moves start next session**  
**Nature of work:** Move / rename folders & files + fix `require()` paths. **Do not rewrite logic.**  
**Last reviewed:** 2026-07-31

**Related:** [code_cleanup.md](./code_cleanup.md) (STEPS 1–7 still valid) · [current_development.md](../current_development.md) (product AI — after moves) · [README.md](../../../README.md)

---

## Clear summary (read this first)

**What this doc is:** One plan to reorganize `api/application/atlas/` by **responsibility**. Moves and renames only — same behavior, fixed imports.

**Paste-friendly short version (give this to ChatGPT):** [project_structure_plan.md](./project_structure_plan.md) — tree + Intelligence facade + coding style. **This file** has the full file-by-file tree and migration phases.

**Context correction (locked):** `ai/context/**` → **`cloudPilotIntelligence/context/**`** — NOT `providers/openAI/context/`. OpenAI provider is `client/` + `usage/` only.

**Phase status:** Phase 1 done. Phase 2 **approved** (docs locked) — **code moves not started**. See [Pick up next session — Phase 2](#pick-up-next-session--phase-2).

**What this doc is not:** Product AI features, OpenAI prompts, or rewriting handlers. That stays in [current_development.md](../current_development.md) *after* the moves.

### Top-level folders (the whole point)

| Folder | One-line meaning |
|--------|------------------|
| `routes/` | HTTP enters here |
| `logic/` | Route workflows |
| `functions/` | Shared helpers / DB classes |
| `config/` | Env / switches |
| `cloudPilot/` | CloudPilot **features + pipeline** (STEPS 1–7, scans, changes, speak, requests, history) |
| `cloudPilotIntelligence/` | How CloudPilot **thinks** (context + understand / later respond, explain, …) |
| `providers/` | **External systems** (Atlas API, OpenAI client+usage, GitHub; empty aws/gmail) |
| `doc/` | Planning only |

### Biggest moves

```text
TODAY                              →  AFTER
─────────────────────────────────────────────────────────────
cloudPilot/conversation/understand →  cloudPilotIntelligence/understand/
ai/context/**                      →  cloudPilotIntelligence/context/
ai/client/**                       →  providers/openAI/client/
ai/usage/**                        →  providers/openAI/usage/
aws/**                             →  providers/atlas/
config/github/githubClient.js      →  providers/github/githubClient.js
services/actions/...               →  cloudPilot/{scans,changes,billing,inventory,aiUsage}/
services/actions/actionMap.js      →  cloudPilot/actionMap.js
services/navigator/                →  cloudPilot/navigator/
services/                          →  deleted (empty after absorb)
```

**Locked:** Context is **CloudPilot Intelligence**, not the OpenAI provider.

### What stays under `cloudPilot/`

Pipeline entry, decision, conversation **speak** (not understand), requests, execution, history, change strategies, feature handlers.

### Phases (order)

| Phase | Do |
|-------|-----|
| **0** | Approve this map |
| **1** | Create empty folders / scaffolds ← **DONE — waiting for Phase 2 approval** |
| **2** | Move `providers/atlas` + `providers/openAI` (client/usage) + **`cloudPilotIntelligence/context`** + github |
| **3** | Absorb `services/` into `cloudPilot/` |
| **4** | Move understand → `cloudPilotIntelligence/` |
| **5** | Delete empty old folders; refresh README |

### Success

Every existing `.js` file still exists (new path). Smoke: message, scan, toggle, billing, inventory, AI usage, region internal + OpenAI. **No logic rewrite.**

Details, full tree, and current→new table are below.

---

## Goal (locked)

Organize `api/application/atlas/` by **responsibility**. Top-level folders answer one question each.

```text
routes/                    → How do requests enter?
logic/                     → What workflow runs?
functions/                 → Shared helpers
cloudPilot/                → What features / pipeline does CloudPilot perform?
cloudPilotIntelligence/    → How does CloudPilot think? (understand / respond / …)
providers/                 → What external systems do we talk to?
config/                    → Configuration
doc/                       → Planning only (not runtime)
```

---

## Scope

| Do | Do not |
|----|--------|
| Move / rename + fix imports | Rewrite handlers, match rules, prompts |
| Keep STEPS 1–7 contracts | Product AI changes in the same pass |
| Absorb `services/` (no logic lost) | Delete business logic |
| Empty scaffolds for future (`aws/`, `gmail/`) | Implement direct AWS or Gmail now |

---

## Gaps in the sketch — where missing pieces go

Your goal sketch omitted folders that **already exist and must stay**. Final placement:

| Missing today in sketch | Final home | Why |
|-------------------------|------------|-----|
| `decision/` | **`cloudPilot/decision/`** | STEP 4 — CloudPilot pipeline, not intelligence |
| `conversation/` (speak / templates / general / request workflows) | **`cloudPilot/conversation/`** | Outgoing words + request/general conversation flow — still CloudPilot. Understand moves **out** to intelligence |
| `understand/` (search extractors) | **`cloudPilotIntelligence/understand/`** | Thinking |
| `ai/context/` | **`cloudPilotIntelligence/context/`** | CloudPilot-owned knowledge for intelligence — NOT under OpenAI provider |
| `ai/client/` | **`providers/openAI/client/`** | OpenAI transport only |
| `ai/usage/` | **`providers/openAI/usage/`** | OpenAI metering |
| `inventory/` | **`cloudPilot/inventory/`** | Feature like billing/scans |
| `navigator/` | **`cloudPilot/navigator/`** | Kite UI shaping for CloudPilot results |
| `actionMap.js` | **`cloudPilot/actionMap.js`** | Registry of what CloudPilot can do |
| `aiUsage` feature + DB helpers | **`cloudPilot/aiUsage/`** (handler/messages) + **`providers/openAI/usage/`** (persist/cost) | Feature vs OpenAI metering |
| `cloudPilotMessageFunctions.js` | **`cloudPilot/cloudPilotMessageFunctions.js`** | Pipeline entry STEPS 1–7 |
| Empty `services/conversation/` | **Delete** (no files) | Leftover only |
| Direct AWS later | **`providers/aws/`** empty scaffold | Honest future; today unused |
| Gmail later | **`providers/gmail/`** empty | Scaffold only |

**Final lock:** Context → **`cloudPilotIntelligence/context/`**. OpenAI provider is transport + usage only (`client/`, `usage/`). Intelligence owns context so future providers (Claude, local) can consume the same CloudPilot knowledge.

---

## Final target tree (all live files)

Root = `api/application/atlas/` (same as today’s atlas app folder).

```text
api/application/atlas/

├── README.md
├── doc/                                          # unchanged — planning only

├── routes/
│   ├── messageRoutes.js
│   ├── aiUsageRoutes.js
│   ├── instructionRoutes.js
│   └── todoRoutes.js

├── logic/
│   ├── messages.js
│   ├── aiUsage.js
│   ├── instructions.js
│   └── todo.js

├── functions/
│   ├── atlasTimeFunctions.js
│   ├── instructionFunctions.js
│   ├── toDoFunctions.js
│   └── classes/
│       ├── Instruction.js
│       └── ToDo.js

├── config/
│   ├── chatGPTconfig.js
│   └── cloudPilotAIConfig.js
│   # githubClient.js lives under providers/github/ (locked — not optional)

├── cloudPilot/
│   ├── cloudPilotMessageFunctions.js             # STEPS 1–7 entry
│   ├── actionMap.js                              # from services/actions/actionMap.js
│   │
│   ├── decision/                                 # KEEP — was missing from sketch
│   │   ├── decideNextStep.js
│   │   └── decisionTypes.js
│   │
│   ├── conversation/                             # KEEP speak side — understand removed
│   │   ├── CloudPilotMessage.js
│   │   ├── templates/
│   │   │   ├── fieldPromptExamples.js
│   │   │   └── requestTemplates.js
│   │   ├── general/
│   │   │   ├── GeneralConversation.js
│   │   │   ├── generalChat.js
│   │   │   └── workflow.js
│   │   └── request/
│   │       ├── RequestConversation.js
│   │       └── workflow.js
│   │
│   ├── requests/                                 # unchanged
│   │   ├── classes/
│   │   │   ├── ActionState.js
│   │   │   └── Request.js
│   │   └── functions/
│   │       ├── requestFunctions.js
│   │       ├── requestLoadFunctions.js
│   │       ├── requestNameFunctions.js
│   │       └── requestStatusFunctions.js
│   │
│   ├── execution/                                # unchanged
│   │   ├── AtlasExecution.js
│   │   ├── functions/
│   │   │   ├── executionFunctions.js
│   │   │   └── runAction.js
│   │   └── outcomes/
│   │       └── outcomeRegistry.js
│   │
│   ├── history/                                  # unchanged
│   │   ├── classes/
│   │   │   └── History.js
│   │   ├── functions/
│   │   │   ├── historyActionNameFunctions.js
│   │   │   ├── historyFunctions.js
│   │   │   └── undoFunctions.js
│   │   ├── historyBuilders/
│   │   │   ├── createEc2History.js
│   │   │   ├── ec2History.js
│   │   │   └── toggleEc2History.js
│   │   ├── historyNavigatorAdapter.js
│   │   └── undoRegistry.js
│   │
│   ├── changes/                                  # delivery strategies + change handlers
│   │   ├── strategies/
│   │   │   ├── automatic.js
│   │   │   ├── cli.js
│   │   │   ├── instructions.js
│   │   │   └── pr.js
│   │   ├── cli/
│   │   │   └── cliTemplates.js
│   │   ├── pr/
│   │   │   ├── createToggleEc2PullRequest.js
│   │   │   └── prTemplates.js
│   │   ├── toggleEC2/
│   │   │   └── toggleEC2Handler.js               # from services/actions/ec2/toggleEC2/
│   │   ├── createEC2/
│   │   │   └── createEC2Handler.js
│   │   ├── deleteEC2/
│   │   │   └── deleteEC2Handler.js
│   │   └── updateEC2Tag/
│   │       └── updateEC2TagHandler.js
│   │
│   ├── scans/                                    # scan features (handlers + format/message/nav)
│   │   ├── ec2/
│   │   │   ├── scanEC2Handler.js
│   │   │   ├── atlasEC2Formatter.js
│   │   │   ├── atlasEC2MessageBuilder.js
│   │   │   └── atlasEC2ScanNavigatorAdapter.js
│   │   └── s3/
│   │       ├── scanS3Handler.js
│   │       ├── atlasS3Formatter.js
│   │       ├── atlasS3MessageBuilder.js
│   │       └── atlasS3ScanNavigatorAdapter.js
│   │
│   ├── billing/
│   │   ├── billingAWSHandler.js
│   │   ├── atlasBillingFunctions.js              # thin; may later hop to providers/atlas
│   │   ├── atlasAWSBillingMessage.js
│   │   └── atlasAWSBillingNavigator.js
│   │
│   ├── inventory/
│   │   ├── inventoryAWSHandler.js
│   │   ├── atlasAWSFunctions.js                  # legacy Atlas HTTP — optional later → providers/atlas
│   │   ├── atlasAWSInventoryFormatter.js
│   │   ├── atlasAWSInventoryMessageBuilder.js
│   │   └── atlasAWSInventoryNavigatorAdapter.js
│   │
│   ├── aiUsage/                                  # show_ai_usage feature
│   │   ├── showAiUsageHandler.js
│   │   └── aiUsageMessageBuilder.js
│   │
│   └── navigator/
│       └── functions/
│           └── navigatorFunctions.js

├── cloudPilotIntelligence/
│   ├── context/                                  # from ai/context/** — CloudPilot-owned
│   │   ├── buildContext.js
│   │   ├── buildSystemMessage.js
│   │   ├── classes/
│   │   │   ├── ConversationHistoryContext.js
│   │   │   └── CurrentQuestionContext.js
│   │   └── contextTypes/
│   │       ├── cloudPilotContext.js
│   │       ├── cloudPilotSituationContext.js
│   │       ├── currentQuestionContext.js
│   │       └── organizationKnowledgeContext.js
│   ├── understand/
│   │   ├── understandMessage.js                  # from conversation/understand/
│   │   ├── region/
│   │   │   └── searchMessageForRegion.js
│   │   ├── action/
│   │   │   └── searchMessageForAction.js
│   │   ├── conversation/
│   │   │   └── searchMessageForConversation.js
│   │   ├── reply/
│   │   │   └── searchMessageForReply.js
│   │   ├── values/
│   │   │   └── searchMessageForValues.js
│   │   ├── structuredFields/
│   │   │   └── searchMessageForStructuredFields.js
│   │   ├── resource/
│   │   │   ├── searchMessageForInstanceId.js
│   │   │   ├── searchMessageForInstanceType.js
│   │   │   ├── searchMessageForName.js
│   │   │   └── searchMessageForTagUpdate.js
│   │   └── (later) intent/
│   │
│   ├── respond/                                  # empty scaffold
│   ├── explain/                                  # empty scaffold
│   ├── improve/                                  # empty scaffold
│   └── generate/                                 # empty scaffold

├── providers/
│   ├── atlas/                                    # Node → Atlas API (not AWS SDK)
│   │   ├── client/
│   │   │   └── atlasPost.js
│   │   ├── ec2/
│   │   │   ├── scanEC2.js
│   │   │   └── changeEC2.js
│   │   ├── s3/
│   │   │   └── scanS3.js
│   │   ├── billing/
│   │   │   └── getBillingSummary.js
│   │   └── inventory/
│   │       └── getAllResources.js
│   │
│   ├── openAI/                                   # NO context/ here
│   │   ├── client/
│   │   │   └── openAIClient.js
│   │   └── usage/
│   │       ├── AiUsage.js
│   │       ├── calculateOpenAICost.js
│   │       └── saveAiUsage.js
│   │
│   ├── aws/                                      # EMPTY scaffold — future direct AWS
│   │   ├── client/
│   │   ├── ec2/
│   │   ├── s3/
│   │   └── billing/
│   │
│   ├── github/
│   │   └── githubClient.js                       # from config/github/ (required move — not optional)
│   │
│   └── gmail/                                    # EMPTY scaffold

└── (REMOVED after move)
    ├── ai/
    ├── aws/
    └── services/
```

---

## Current → new (quick map)

| Today | New |
|-------|-----|
| `routes/`, `logic/`, `functions/`, `config/` | Stay |
| `cloudPilot/decision/`, `requests/`, `execution/`, `history/` | Stay under `cloudPilot/` |
| `cloudPilot/changes/` (strategies/pr/cli) | Stay; **add** change handlers from `services/actions/ec2/{toggle,create,delete,updateEC2Tag}` |
| `cloudPilot/conversation/understand/**` | → `cloudPilotIntelligence/understand/` |
| `cloudPilot/conversation/` (rest) | Stay — speak / general / request |
| `services/actions/ec2/scanEC2/**`, `s3/scanS3/**` | → `cloudPilot/scans/` |
| `services/actions/aws/billingAWS/**` | → `cloudPilot/billing/` |
| `services/actions/aws/inventoryAWS/**` + `atlasAWSFunctions.js` | → `cloudPilot/inventory/` |
| `services/actions/aiUsage/**` | → `cloudPilot/aiUsage/` |
| `services/actions/actionMap.js` | → `cloudPilot/actionMap.js` |
| `services/navigator/**` | → `cloudPilot/navigator/` |
| `aws/**` | → `providers/atlas/` |
| `ai/context/**` | → `cloudPilotIntelligence/context/` |
| `ai/client`, `ai/usage` | → `providers/openAI/{client,usage}/` |
| `config/github/githubClient.js` | → `providers/github/` |

---

## Flow (unchanged behavior)

```text
HTTP
  → routes → logic
  → cloudPilot/cloudPilotMessageFunctions (STEPS 1–7)
       STEP 3  cloudPilotIntelligence/understand
       STEP 4  cloudPilot/decision
       STEP 5–7 cloudPilot/conversation + requests + execution + history
       features     cloudPilot/scans|changes|billing|inventory|aiUsage
       HOW          providers/atlas | providers/openAI | providers/github
```

---

## Migration phases (move only)

### Phase 0 — Approve this final map
- [x] Goal tree + missing folders placed
- [x] Context → `cloudPilotIntelligence/context/` (corrected — not under OpenAI)
- [x] `services/` absorbed into `cloudPilot/` feature folders — no logic loss
- [x] You approved Phase 1 start

### Phase 1 — Scaffolds
- [x] Create empty: `cloudPilotIntelligence/{context,understand,respond,explain,improve,generate}`
- [x] Create empty: `providers/{atlas,openAI/client,openAI/usage,aws,github,gmail}` (+ atlas/aws subfolders)
- [x] No behavior change
- [x] Phase 2 approved (docs); code not started yet

### Phase 2 — Providers + Context  ← **START HERE next session**
- [ ] Move `aws/*` → `providers/atlas/`
- [ ] Move `ai/client/*` → `providers/openAI/client/`
- [ ] Move `ai/usage/*` → `providers/openAI/usage/`
- [ ] Move `ai/context/*` → `cloudPilotIntelligence/context/`
- [ ] Move `config/github/githubClient.js` → `providers/github/` (**required** — not optional)
- [ ] Fix imports; smoke Atlas scan + one OpenAI path
- [ ] **STOP — await Phase 3 approval**

### Phase 3 — Absorb `services/` into `cloudPilot/`
- [ ] `actionMap` → `cloudPilot/actionMap.js`
- [ ] scan handlers → `cloudPilot/scans/`
- [ ] change handlers → `cloudPilot/changes/`
- [ ] billing / inventory / aiUsage / navigator as mapped
- [ ] Fix imports; smoke all actions
- [ ] Delete empty `services/`

### Phase 4 — Intelligence understand
- [ ] Move `cloudPilot/conversation/understand/**` → `cloudPilotIntelligence/understand/`
- [ ] Fix imports; smoke region internal + AI
- [ ] Optional later: consolidate region into one `searchForRegion.js` with labeled functions (same behavior)

### Phase 5 — Cleanup
- [ ] Confirm `ai/`, `aws/`, `services/` gone
- [ ] Confirm `config/github/` gone (moved in Phase 2)
- [ ] Refresh README tree (no `doc/` listing)
- [ ] Resume product AI in [current_development.md](../current_development.md)

---

## Pick up next session — Phase 2

**Do not start Phase 3.** Phase 2 only: move files, fix `require()`, smoke, stop.

### Still at old paths (until Phase 2 code)

| Current | Target |
|---------|--------|
| `aws/**` | `providers/atlas/**` |
| `ai/client/**` | `providers/openAI/client/**` |
| `ai/usage/**` | `providers/openAI/usage/**` |
| `ai/context/**` | `cloudPilotIntelligence/context/**` |
| `config/github/githubClient.js` | `providers/github/githubClient.js` |

Scaffolds already exist under `cloudPilotIntelligence/` and `providers/` (`.gitkeep` only).

### Prompt to paste on the new computer

```text
Continue CloudPilot Architecture Refactor — Phase 2 ONLY.

Read: application/atlas/doc/development/architecture/responsibility_refactor.md
Especially: "Pick up next session — Phase 2" and the Final Target Tree.

Rules: MOVE + fix require() only. No logic rewrite. No Phase 3+.

Moves:
- aws/** → providers/atlas/**
- ai/client/** → providers/openAI/client/**
- ai/usage/** → providers/openAI/usage/**
- ai/context/** → cloudPilotIntelligence/context/**  (NOT providers/openAI)
- config/github/githubClient.js → providers/github/githubClient.js  (required)

Then: smoke Atlas scan + one OpenAI path. Report what changed. STOP.
```

### After Phase 2

Update checkboxes in this doc, then wait for approval before Phase 3 (`services/` → `cloudPilot/`).

---

## Decision log (final)

| Topic | Decision |
|-------|----------|
| Providers for cloud | **`providers/atlas/`** today; **`providers/aws/`** empty future |
| OpenAI package | **`providers/openAI/{client,usage}`** — **no context/** |
| Context | **`cloudPilotIntelligence/context/`** — CloudPilot-owned |
| Intelligence | context / understand / respond / explain / improve / generate |
| GitHub client | **`providers/github/`** (not config) |
| decision / conversation speak | Stay **`cloudPilot/`** |
| understand search | **`cloudPilotIntelligence/understand/`** |
| services | Move into **`cloudPilot/{scans,changes,billing,inventory,aiUsage,navigator}`** + `actionMap.js` |
| Work type | Move / rename / imports only |

---

## Success criteria

- Top-level matches the goal + filled gaps above
- Every current `.js` file still exists after the move (new path)
- Smoke: message, scan EC2, toggle, billing, inventory, AI usage, region AI/internal
- No product logic rewrite in this refactor
