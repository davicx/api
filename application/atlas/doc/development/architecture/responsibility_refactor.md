# CloudPilot Architecture Refactor — Responsibilities

**Status:** Planned — **do not code until Phase 0 is approved**  
**Why now:** Got lost in code while adding AI to search. Folders mixed technology (`ai/`, `aws/`) with features. Need a map before moving files.  
**Last reviewed:** 2026-07-30

**Related**

| Doc | Role |
|-----|------|
| [README.md](../../../README.md) | Live tree + short Project restructure stub |
| [capability_migration.md](./capability_migration.md) | Older capability plan — **superseded by this doc** for folder layout |
| [code_cleanup.md](./code_cleanup.md) | Message pipeline STEPS 1–7 (still valid) |
| [current_development.md](../current_development.md) | AI feature work — continue *after* folder map is clear |
| [../long_term/to_do.md](../long_term/to_do.md) | Checklist pointer |

---

## Goal

Reorganize `api/application/atlas/` around **responsibilities**, not technologies.

Every top-level folder answers one question. A new developer should understand the app by reading folder names alone.

Adding OpenAI / Claude / another LLM, or another cloud path, should not force another major reorganization.

---

## Scope: move / rename — do not rewrite

This refactor is **mostly relocating files and renaming folders** (sometimes files). It is **not** a rewrite of CloudPilot logic.

| Do | Do not |
|----|--------|
| `git mv` / move folders | Rewrite handlers, understand extractors, or actionMap behavior |
| Fix `require()` paths after moves | “Clean up while we’re here” refactors |
| Optional light renames for clarity (`aws/` → `providers/atlas/`) | Split Internal/AI into new files just for the move |
| Delete **empty leftover dirs** only after contents moved | Delete or merge logic into fewer functions during the move |
| Keep STEPS 1–7 and message contracts | Change OpenAI prompts / match rules as part of this work |

**Rule:** if a file has business logic today, that same logic still exists after the move — only its path (and imports) change. Product AI improvements (e.g. when to run Region Search) stay in [current_development.md](../current_development.md), **after** folders settle.

**Nothing in `services/` is discarded.** That folder is absorbed into `cloudPilot/` (and a few thin HOW pieces into `providers/atlas/` when they are already Atlas HTTP). See inventory below.

---

## One-question folders

| Folder | Question |
|--------|----------|
| `routes/` | How do requests enter? |
| `logic/` | What workflow runs? |
| `cloudPilot/` | What features does CloudPilot perform? |
| `cloudPilotIntelligence/` | How does CloudPilot think / understand / explain / generate? |
| `providers/` | What external systems does CloudPilot talk to? |
| `functions/` | Shared helpers? |
| `config/` | How is the app configured? |

---

## Desired top-level structure

```text
api/application/atlas/

├── routes/
├── logic/
├── functions/
├── cloudPilot/
├── cloudPilotIntelligence/
├── providers/
├── config/
└── doc/                    # planning only — not runtime
```

(`doc/` stays. Not a responsibility folder for runtime code.)

---

## Overall flow

```text
HTTP Request
    ↓
routes/
    ↓
logic/
    ↓
cloudPilot/                         ← WHAT feature
    ↓
cloudPilotIntelligence/ (when needed)  ← understand / explain / generate
    ↓
providers/                          ← HOW to talk to outside systems
    ↓
External systems (Atlas, AI, GitHub, …)
```

### Example

```text
User: "Scan EC2 in us-west-2"

messageRoute()
  → messageLogic()
  → cloudPilot scanEC2 (feature)
  → cloudPilotIntelligence searchForRegion (gateway)
       → internal OR AI (hidden)
  → providers/atlas/ec2 (describe / scan)
  → Atlas API → AWS
  → return results
```

---

## Folder responsibilities

### `routes/`

HTTP only. Almost no logic.

```text
POST /message  →  messageLogic()
```

Never AWS, never AI, never request state.

---

### `logic/`

High-level orchestration only.

Coordinates: understand → decide → execute → respond.

Does **not** contain Atlas calls or AI calls.

---

### `functions/`

Keep. Shared helpers (existing style).

Examples: `atlasTimeFunctions.js`, `instructionFunctions.js`, `todoFunctions.js`.

---

### `cloudPilot/` — WHAT

Business features CloudPilot performs. Decides **what** happens. Never talks to AWS SDK or OpenAI directly.

```text
cloudPilot/

scans/
changes/
requests/
history/
execution/
billing/
inventory/
```

Feature examples (names illustrative):

```text
scanEC2()
scanS3()
toggleEC2()
createEC2()
undo()
billingSummary()
inventory()
```

CloudPilot calls:

- `cloudPilotIntelligence/` when it needs understanding / copy / generation
- `providers/` when it needs an external system

---

### `cloudPilotIntelligence/` — THINK

Everything related to understanding, responding, explaining, improving, or generating information.

Hides whether implementation is **internal**, **AI**, or a future LLM. Nobody outside this folder should know.

```text
cloudPilotIntelligence/

understand/
respond/
explain/
improve/
generate/
context/            # shared situation / history / system message for think steps
```

**Context belongs here.** Building what the model (or internal logic) “knows” about this turn is part of thinking — not a provider concern and not a CloudPilot feature. Move today’s `ai/context/` → `cloudPilotIntelligence/context/`.

#### Understand — by capability; **one file**, not three

No separate `searchForRegionInternal.js` / `searchForRegionAI.js` yet — that is clutter. Match existing style: **one file per capability**, multiple functions clearly labeled.

```text
understand/

region/
    searchForRegion.js          ← gateway + internal + AI in one file

action/
    searchForAction.js

resource/
intent/
conversation/
```

**Rule:** one **public** entry per capability (`searchForRegion`). Internal / AI are private functions in the same file until a file actually gets too large.

```javascript
// searchForRegion.js — public gateway + implementations (same file)

function searchForRegion(message) {
  switch (config.REGION_PROVIDER) {
    case "ai":
      return searchForRegionAI(message);
    case "internal":
    default:
      return searchForRegionInternal(message);
  }
}

function searchForRegionInternal(message) {
  // regex / rules …
}

function searchForRegionAI(message) {
  // uses providers/ai + context/ …
}
```

Split into more files later only if the single file becomes hard to read. Rest of CloudPilot never changes when Claude / local LLM is added (new function + config case in the same file, or then extract).

#### Respond / Explain / Improve / Generate

```text
respond/     respondGeneral, respondQuestion, respondFinding, respondRequest
explain/     explainFinding, explainRecommendation, explainCost
improve/     improveDashboardText, improveChatResponse, improveSummary
generate/    generateTerraform, generateCLI, generatePullRequest
```

---

### `providers/` — external systems only

**Truth of this codebase:** CloudPilot does **not** talk to AWS. It talks to **Atlas**. Atlas talks to AWS.

So providers are named after systems the Node app actually calls:

```text
providers/

atlas/          # execution engine (EC2, S3, billing, inventory HTTP)
ai/             # OpenAI / Claude / local — abstracted
github/
gmail/          # future
jira/           # future
slack/          # future
```

Not `providers/aws/` as the primary home for today’s calls.

#### Atlas provider

```text
providers/atlas/

client/         # HTTP post helper
ec2/
s3/
billing/
inventory/
```

Operations = Atlas endpoints / ops, not boto3:

```text
getEC2Instances()
scanS3()
toggleEC2()
getBillingSummary()
```

If someday CloudPilot calls AWS directly, add `providers/aws/` **alongside** `atlas/` without rewriting CloudPilot features.

#### AI provider

```text
providers/ai/

openAI/
claude/         # future
local/          # future
```

Intelligence calls “AI.” The AI provider picks the model/vendor.

---

### `config/`

ENV gates, model IDs, Atlas base URL, GitHub, CloudPilot AI feature switches.

---

## Separation (locked)

| Layer | Answers | Does not |
|-------|---------|----------|
| CloudPilot | What feature? (scan, toggle, undo, billing) | Know Atlas HTTP or OpenAI details |
| CloudPilot Intelligence | How do we understand / improve / explain / generate? (+ **context** for those steps) | Own AWS/Atlas ops |
| Providers | How do we talk to Atlas / AI / GitHub / …? | Own product features or chat workflow |
| Logic | What workflow for this HTTP call? | Call providers directly for feature work (prefer via CloudPilot) |
| Routes | How does the request enter? | Business logic |

---

## Complete inventory — where every live folder goes

~109 JS files today under atlas (excl. `doc/`). Nothing should be “lost.”

### Stays put (path unchanged or tiny rename only)

| Today | Tomorrow | Notes |
|-------|----------|--------|
| `routes/*` | `routes/` | Already correct |
| `logic/*` | `logic/` | Already correct |
| `functions/*` | `functions/` | Already correct |
| `config/*` | `config/` | Already correct |
| `cloudPilot/decision/*` | `cloudPilot/decision/` | Stays |
| `cloudPilot/requests/*` | `cloudPilot/requests/` | Stays |
| `cloudPilot/execution/*` | `cloudPilot/execution/` | Stays |
| `cloudPilot/history/*` | `cloudPilot/history/` | Stays |
| `cloudPilot/changes/*` | `cloudPilot/changes/` | Stays (strategies / PR / CLI) |
| `cloudPilot/cloudPilotMessageFunctions.js` | `cloudPilot/` | Pipeline entry — stays |
| `cloudPilot/conversation/*` except `understand/` | `cloudPilot/conversation/` for now | Speak / templates / request-general — move later only if we rename to `respond` |

### Move: `aws/` → `providers/atlas/`

| Today | Tomorrow |
|-------|----------|
| `aws/atlasClient/atlasPost.js` | `providers/atlas/client/` |
| `aws/capabilities/scans/*` | `providers/atlas/scans/` or `…/ec2` + `…/s3` (rename folders only) |
| `aws/capabilities/changes/*` | `providers/atlas/…` |
| `aws/capabilities/billing/*` | `providers/atlas/billing/` |
| `aws/capabilities/inventory/*` | `providers/atlas/inventory/` |

Logic unchanged — these are already thin Atlas HTTP wrappers.

### Move: `ai/` → intelligence + providers

| Today | Tomorrow |
|-------|----------|
| `ai/client/openAIClient.js` | `providers/ai/openAI/` |
| `ai/context/**` | `cloudPilotIntelligence/context/` |
| `ai/usage/**` | Prefer **`cloudPilot/aiUsage/`** (feature `show_ai_usage`) **or** keep beside provider — pick one in Phase 0; **do not delete** |

### Move: `cloudPilot/conversation/understand/` → intelligence

| Today | Tomorrow |
|-------|----------|
| `understand/search/searchMessageForRegion.js` (etc.) | `cloudPilotIntelligence/understand/<capability>/` — **same functions**, one file per capability over time; first phase can be **folder move + rename** of existing files without merging yet |

Safe first step: move the whole `search/` tree under `cloudPilotIntelligence/understand/` and fix imports — **zero logic change**. Gateway merge (one file with Internal+AI) can be a **later** step in the same phase, still without changing regex/AI behavior.

### Move: `services/` — full file map (nothing dropped)

`services/` is **not** a responsibility name. Everything here is CloudPilot feature work (RUN + format + chat copy + navigator shaping) plus a few legacy Atlas HTTP helpers.

**Recommended default (move-only):** relocate under `cloudPilot/actions/` (or `cloudPilot/features/`) keeping the **same relative structure** so imports stay obvious.

```text
services/actions/          →  cloudPilot/actions/
services/navigator/        →  cloudPilot/navigator/
services/conversation/     →  DELETE empty leftover only (no files)
```

| Today (27 files) | Tomorrow | Role (unchanged) |
|------------------|----------|------------------|
| `actions/actionMap.js` | `cloudPilot/actions/actionMap.js` | Action registry — **keep logic** |
| `actions/ec2/scanEC2/*` | `cloudPilot/actions/ec2/scanEC2/` | Handler + formatter + message + navigator |
| `actions/ec2/toggleEC2/*` | `cloudPilot/actions/ec2/toggleEC2/` | Handler |
| `actions/ec2/createEC2/*` | `cloudPilot/actions/ec2/createEC2/` | Handler |
| `actions/ec2/deleteEC2/*` | `cloudPilot/actions/ec2/deleteEC2/` | Handler |
| `actions/ec2/updateEC2Tag/*` | `cloudPilot/actions/ec2/updateEC2Tag/` | Handler |
| `actions/ec2/atlasEC2Functions.js` | `cloudPilot/actions/ec2/` **or** later `providers/atlas/ec2/` | Legacy Atlas HTTP — move with handlers first; optional second hop to providers |
| `actions/s3/scanS3/*` | `cloudPilot/actions/s3/scanS3/` | Same pattern |
| `actions/s3/atlasS3Functions.js` | with s3 actions (then optional providers) | Legacy Atlas HTTP |
| `actions/aws/billingAWS/*` | `cloudPilot/actions/billing/` (rename folder only) | Handler + message + navigator |
| `actions/aws/inventoryAWS/*` | `cloudPilot/actions/inventory/` | Handler + formatter + message + navigator |
| `actions/aws/atlasAWSFunctions.js` | with inventory (then optional providers) | Legacy Atlas HTTP |
| `actions/aiUsage/*` | `cloudPilot/actions/aiUsage/` | `show_ai_usage` handler + message |
| `navigator/functions/navigatorFunctions.js` | `cloudPilot/navigator/functions/` | Kite navigator assembly — **keep** |

**Optional later (not required for this refactor):** split formatters/message builders into `cloudPilotIntelligence/respond/` — that would be a second pass. **First pass: move the tree intact.**

**Optional later:** move `atlas*Functions.js` into `providers/atlas/` once `aws/capabilities` are already there — still move-only, same function bodies.

### Coverage checklist (no orphans)

- [ ] Every file under `services/` has a destination row above
- [ ] Every file under `ai/` has a destination
- [ ] Every file under `aws/` has a destination
- [ ] `cloudPilot/` pipeline pieces either stay or map to intelligence
- [ ] After moves: `find` for `services/`, `ai/`, `aws/` returns empty (except maybe temporary shims — prefer none)
- [ ] Smoke: message, scan EC2, toggle, billing, AI usage, one OpenAI region/search path

---

## Current → target map (summary)

Live today (approximate):

```text
routes/          → stays
logic/           → stays
functions/       → stays
config/          → stays
cloudPilot/      → stays for features/pipeline; understand → intelligence
ai/              → providers/ai + cloudPilotIntelligence/context (+ usage decision)
aws/             → providers/atlas
services/        → cloudPilot/actions + cloudPilot/navigator  (ABSORB — do not delete logic)
```

| Today | Tomorrow |
|-------|----------|
| `aws/capabilities/*` + `aws/atlasClient` | `providers/atlas/` |
| `ai/client/openAIClient.js` | `providers/ai/openAI/` |
| `ai/context/*` | **`cloudPilotIntelligence/context/`** (locked) |
| `ai/usage/*` | `cloudPilot/actions/aiUsage/` **or** next to `providers/ai` — pick Phase 0; never drop |
| `cloudPilot/conversation/understand/search/*` | `cloudPilotIntelligence/understand/…` |
| `services/actions/**` | **`cloudPilot/actions/**`** (same structure) |
| `services/navigator/**` | **`cloudPilot/navigator/**`** |
| `config/cloudPilotAIConfig.js` | stays in `config/` |
| Empty `services/conversation/` | delete empty dirs only |

---

## Design principles (checklist)

1. Folders by **responsibility**, not technology.
2. **Move / rename first** — do not rewrite logic in the same pass.
3. CloudPilot decides **what**; providers know **how** to talk to outside systems.
4. Intelligence hides internal vs AI.
5. Every capability has **one public entry** (`searchForRegion`, etc.) — introduce gradually; moving files can precede gateway merge.
6. Prefer **one file per capability** with clearly labeled functions when consolidating; not required on day-one move.
7. Rest of app never knows regex vs OpenAI vs Claude.
8. Providers named after **real** dependents: Atlas, AI, GitHub — not “AWS” for Atlas HTTP.
9. Top-level names alone should explain the architecture.
10. **Context lives under `cloudPilotIntelligence/context/`** — it is part of thinking.
11. **`services/` is absorbed, not deleted** — handlers/formatters/actionMap/navigator keep their logic under `cloudPilot/`.
---

## Migration plan (phased — no big-bang)

Do **not** move everything at once. Each phase must leave chat working.

### Phase 0 — Lock the map (docs only)

- [x] Context → `cloudPilotIntelligence/context/`
- [x] Understand → one file with labeled functions when consolidating (not required for first move)
- [x] **`services/` absorbed into `cloudPilot/actions` + `cloudPilot/navigator`** — move intact; no logic rewrite
- [x] Scope = **move/rename + fix imports**; product AI work stays separate
- [ ] Approve this doc (Atlas as primary execution provider — **yes** for now)
- [ ] Confirm AI usage path: recommend `cloudPilot/actions/aiUsage/` + keep `ai/usage` DB helpers next to it or under `providers/ai` — pick one
- [ ] Confirm folder name: `cloudPilot/actions/` vs `cloudPilot/features/` (same contents either way)
- [ ] Update README Project restructure stub if needed
- [ ] **Do not start file moves until Phase 0 remaining boxes are checked**

### Phase 1 — Create empty skeleton

- [ ] Add empty folders: `cloudPilotIntelligence/{understand,respond,explain,improve,generate,context}`, `providers/{atlas,ai,github}`, `cloudPilot/actions` (or features), `cloudPilot/navigator`
- [ ] No behavior change; README tree updated

### Phase 2 — Providers first (low risk, move only)

- [ ] Move `aws/*` → `providers/atlas/`
- [ ] Fix imports only
- [ ] Move `ai/client` → `providers/ai/openAI/`
- [ ] Smoke: scan EC2, billing, one OpenAI-backed call

### Phase 2b — Absorb `services/` (move only — **protect logic**)

- [ ] `git mv services/actions` → `cloudPilot/actions` (or features)
- [ ] `git mv services/navigator` → `cloudPilot/navigator`
- [ ] Fix all `require('…/services/…')` paths
- [ ] Remove empty `services/` (including empty `conversation/` leftover)
- [ ] Smoke: every action still runs (scan, toggle, create/delete if used, inventory, billing, ai usage)
- [ ] **Do not** rewrite handlers or actionMap in this phase

### Phase 3 — Intelligence (context + understand — move first, then optional consolidate)

- [ ] Move `ai/context/` → `cloudPilotIntelligence/context/` (imports only)
- [ ] Move understand search files under `cloudPilotIntelligence/understand/` (imports only)
- [ ] Optional same-phase: consolidate region into one gateway file **without changing** Internal/AI behavior
- [ ] Same for action later
- [ ] Smoke: region search internal + AI still work

### Phase 4 — Naming polish only (optional)

- [ ] Rename `cloudPilot/actions/aws/…` folders to `billing/` / `inventory/` if not done in 2b
- [ ] Optional hop: `atlas*Functions.js` → `providers/atlas/` (bodies unchanged)
- [ ] Ensure features call intelligence / providers by new paths only

### Phase 5 — Cleanup

- [ ] Confirm `ai/`, `aws/`, `services/` gone
- [ ] Refresh README folder tree (code only, no `doc/`)
- [ ] Point `current_development.md` at intelligence paths

### Phase 6 — Resume product AI work (separate from this refactor)

- [ ] Section C — when to run Region Search
- [ ] Next understand / respond / explain features

---

## Explicit non-goals (for this refactor)

- Rewriting handlers, actionMap, match rules, or OpenAI prompts
- Rewriting the STEP 1–7 pipeline message contract
- Replacing Atlas with direct AWS
- Building Claude / local LLM until OpenAI gateway path is clean
- Splitting Internal / AI into separate files
- Moving formatters into `respond/` in the same pass as `services/` absorption
- Moving `doc/` into the responsibility tree as runtime code

---

## Decision log

| Decision | Choice | Why |
|----------|--------|-----|
| AWS vs Atlas under providers | **`providers/atlas/`** | Node talks to Atlas; Atlas talks to AWS |
| Future direct AWS | Add `providers/aws/` later | No CloudPilot rewrite |
| AI under providers | **`providers/ai/`** + intelligence gateways | App talks to AI service; features don’t care which vendor |
| Context location | **`cloudPilotIntelligence/context/`** | Totally related to thinking |
| Internal vs AI files | **One file when consolidating**; labeled functions | Avoid clutter |
| **`services/`** | **Move intact → `cloudPilot/actions` + `navigator`** | No logic loss; folder name was technology/legacy |
| Navigator | **`cloudPilot/navigator/`** | Shapes CloudPilot → Kite UI; not a provider |
| Nature of work | **Move / rename / fix imports** | Avoid getting lost mid-rewrite while adding AI |
| Coding now? | **No** until Phase 0 checked | Plan first |

---

## Open questions (resolve in Phase 0)

1. Folder name: `cloudPilot/actions/` vs `cloudPilot/features/`? (Recommend **`actions/`** — matches `actionMap` mental model.)
2. `ai/usage` DB helpers: sit beside `cloudPilot/actions/aiUsage/` or under `providers/ai/usage/`? (Recommend **beside the feature** for `show_ai_usage`, or `cloudPilot/aiUsage/` for both handler + DB.)
3. First understand move: whole `search/` tree relocate first, **then** gateway consolidate? (Recommend **yes** — two tiny steps, zero behavior change each.)
4. Rename `logic/messages.js` → `messageLogic`? (Optional; skip if it adds noise.)

---

## Success criteria

- Top-level folders match the one-question table
- **`services/` gone; every former services file still exists under `cloudPilot/`** (or providers for true HOW-only hops)
- No behavior change detectable in smoke tests after each phase
- Context under `cloudPilotIntelligence/context/`
- Grep for `openai` / Atlas URL stays inside `providers/` (and config) once moves finish
- Product AI work can resume without drowning in path confusion
