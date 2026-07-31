# CloudPilot Architecture Refactor — Final Plan

**Status:** Final plan — **do not code until you start Phase 1**  
**Nature of work:** Move / rename folders & files + fix `require()` paths. **Do not rewrite logic.**  
**Last reviewed:** 2026-07-31

**Related:** [code_cleanup.md](./code_cleanup.md) (STEPS 1–7 still valid) · [current_development.md](../current_development.md) (product AI — after moves) · [README.md](../../../README.md)

---

## Clear summary (read this first)

**What this doc is:** One plan to reorganize `api/application/atlas/` by **responsibility**. Moves and renames only — same behavior, fixed imports.

**Paste-friendly short version (give this to ChatGPT):** [project_structure_plan.md](./project_structure_plan.md) — tree + Intelligence facade + coding style. **This file** has the full file-by-file tree and migration phases.

**What this doc is not:** Product AI features, OpenAI prompts, or rewriting handlers. That stays in [current_development.md](../current_development.md) *after* the moves.

### Top-level folders (the whole point)

| Folder | One-line meaning |
|--------|------------------|
| `routes/` | HTTP enters here |
| `logic/` | Route workflows |
| `functions/` | Shared helpers / DB classes |
| `config/` | Env / switches |
| `cloudPilot/` | CloudPilot **features + pipeline** (STEPS 1–7, scans, changes, speak, requests, history) |
| `cloudPilotIntelligence/` | How CloudPilot **thinks** (understand / later respond, explain, …) |
| `providers/` | **External systems** (Atlas API, OpenAI, GitHub; empty aws/gmail scaffolds) |
| `doc/` | Planning only |

### Biggest moves

```text
TODAY                              →  AFTER
─────────────────────────────────────────────────────────────
cloudPilot/conversation/understand →  cloudPilotIntelligence/understand/
ai/*                               →  providers/openAI/{client,context,usage}/
aws/*                              →  providers/atlas/
services/actions/...               →  cloudPilot/{scans,changes,billing,inventory,aiUsage}/
services/actions/actionMap.js      →  cloudPilot/actionMap.js
services/navigator/                →  cloudPilot/navigator/
services/                          →  deleted (empty after absorb)
```

### What stays under `cloudPilot/`

Pipeline entry, decision, conversation **speak** (not understand), requests, execution, history, change strategies, feature handlers.

### Phases (order)

| Phase | Do |
|-------|-----|
| **0** | Approve this map ← you are here until you say go |
| **1** | Create empty folders / scaffolds |
| **2** | Move `providers/atlas` + `providers/openAI` |
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
| `ai/context/` | **`providers/openAI/context/`** | Per your goal — OpenAI-specific packaging (client / context / usage together). Intelligence **calls** it when using AI; does not own the OpenAI wire format |
| `inventory/` | **`cloudPilot/inventory/`** | Feature like billing/scans |
| `navigator/` | **`cloudPilot/navigator/`** | Kite UI shaping for CloudPilot results |
| `actionMap.js` | **`cloudPilot/actionMap.js`** | Registry of what CloudPilot can do |
| `aiUsage` feature + DB helpers | **`cloudPilot/aiUsage/`** (handler/messages) + **`providers/openAI/usage/`** (persist/cost) | Feature vs OpenAI metering |
| `cloudPilotMessageFunctions.js` | **`cloudPilot/cloudPilotMessageFunctions.js`** | Pipeline entry STEPS 1–7 |
| Empty `services/conversation/` | **Delete** (no files) | Leftover only |
| Direct AWS later | **`providers/aws/`** empty scaffold | Honest future; today unused |
| Gmail later | **`providers/gmail/`** empty | Scaffold only |

**Earlier doc said context → intelligence.** Your goal puts context under `providers/openAI/`. **Final lock: follow your goal** (`providers/openAI/context/`). Reason: client + context + usage are one OpenAI provider package. Intelligence stays vendor-agnostic and imports from the provider when the AI path runs.

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
│   ├── cloudPilotAIConfig.js
│   └── github/
│       └── githubClient.js                       # or move → providers/github/ (optional)

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
│   ├── understand/
│   │   ├── understandMessage.js                  # from conversation/understand/
│   │   ├── region/
│   │   │   └── searchMessageForRegion.js         # move first; later rename → searchForRegion.js
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
│   │   ├── resource/                             # group instance/name/type/tag
│   │   │   ├── searchMessageForInstanceId.js
│   │   │   ├── searchMessageForInstanceType.js
│   │   │   ├── searchMessageForName.js
│   │   │   └── searchMessageForTagUpdate.js
│   │   └── (later) intent/                       # empty until product needs it
│   │
│   ├── respond/                                  # empty scaffold — optional later move of speak
│   ├── explain/                                  # empty scaffold
│   ├── improve/                                  # empty scaffold
│   └── generate/                                 # empty scaffold
│       # (PR/CLI copy today stays under cloudPilot/changes; generate/ is future home)

├── providers/
│   ├── atlas/                                    # Node → Atlas API (not AWS SDK)
│   │   ├── client/
│   │   │   └── atlasPost.js                      # from aws/atlasClient/
│   │   ├── ec2/
│   │   │   ├── scanEC2.js                        # from aws/capabilities/scans/
│   │   │   └── changeEC2.js                      # from aws/capabilities/changes/
│   │   │   # optional later: atlasEC2Functions.js from services
│   │   ├── s3/
│   │   │   └── scanS3.js
│   │   │   # optional later: atlasS3Functions.js
│   │   ├── billing/
│   │   │   └── getBillingSummary.js
│   │   └── inventory/
│   │       └── getAllResources.js
│   │
│   ├── openAI/                                   # per your goal (not generic "ai/")
│   │   ├── client/
│   │   │   └── openAIClient.js
│   │   ├── context/                              # from ai/context/**
│   │   │   ├── buildContext.js
│   │   │   ├── buildSystemMessage.js
│   │   │   ├── classes/
│   │   │   │   ├── ConversationHistoryContext.js
│   │   │   │   └── CurrentQuestionContext.js
│   │   │   └── contextTypes/
│   │   │       ├── cloudPilotContext.js
│   │   │       ├── cloudPilotSituationContext.js
│   │   │       ├── currentQuestionContext.js
│   │   │       └── organizationKnowledgeContext.js
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
│   │   └── githubClient.js                       # from config/github/ (optional move)
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
| `ai/client`, `ai/context`, `ai/usage` | → `providers/openAI/{client,context,usage}/` |
| `config/github/githubClient.js` | Stay in config **or** → `providers/github/` (prefer providers for consistency) |

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
- [x] Goal tree + missing folders placed (`decision`, `conversation`, `inventory`, `navigator`, …)
- [x] Context → `providers/openAI/context/` (locked to your goal)
- [x] `services/` absorbed into `cloudPilot/` feature folders — no logic loss
- [ ] You approve Phase 1 start

### Phase 1 — Scaffolds
- [ ] Create empty: `cloudPilotIntelligence/{understand,respond,explain,improve,generate}`, `providers/{atlas,openAI,aws,github,gmail}`, `cloudPilot/{scans,billing,inventory,aiUsage,navigator}` as needed
- [ ] No behavior change

### Phase 2 — `providers/atlas` + `providers/openAI`
- [ ] Move `aws/*` → `providers/atlas/`
- [ ] Move `ai/*` → `providers/openAI/{client,context,usage}/`
- [ ] Fix imports; smoke scan + one OpenAI path

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
- [ ] Optional: `config/github` → `providers/github`
- [ ] Refresh README tree (no `doc/` listing)
- [ ] Resume product AI in [current_development.md](../current_development.md)

---

## Decision log (final)

| Topic | Decision |
|-------|----------|
| Providers for cloud | **`providers/atlas/`** today; **`providers/aws/`** empty future |
| OpenAI package | **`providers/openAI/{client,context,usage}`** |
| Context | Under **openAI**, not intelligence (your goal) |
| Intelligence | understand / respond / explain / improve / generate — **no context folder** |
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
