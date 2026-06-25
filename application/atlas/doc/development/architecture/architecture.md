# CloudPilot — Architecture

**Purpose:** Stable reference for how the system works. Read this first.

**Last reviewed:** 2026-06-23

**Reference docs (how-to, not todo lists):**

| Topic | Path |
|-------|------|
| Actions & input types (STEP 3 understanding) | `doc/ReadMe.md` |
| Database schema (actions, requests, executions) | `doc/database/database.md` |
| Add a new action | `doc/instructions/adding_new_action.md` |
| Atlas → Navigator mapping | `doc/instructions/converting_atlas_data.md` |
| Legacy request SQL (historical) | `doc/sql/cloudpilot_workflows_phase1.sql` |
| **Master SQL (source of truth)** | `doc/sql/master_sql.sql` |
| EC2 chat samples | `api/README.md` |
| Create tags / delete safety (future) | `api/doc/instructions/cloudpilot_tagging_metadata.md` |
| Pipeline rebuild history & old specs | `doc/development/architecture/appendix.md` |

**Related planning docs:**

| Doc | Purpose |
|-----|---------|
| [../To_do.md](../To_do.md) | Active work — checklists + details |
| [../finished.md](../finished.md) | Shipped |
| [development_undo_feature.md](./development_undo_feature.md) | Undo / history table plan |
| [code_cleanup.md](./code_cleanup.md) | **Message architecture** — pipeline, conversations, Phase 1 plan |
| [action_map.md](./action_map.md) | Developer navigation — WHAT / WHEN / RUN / HOW / WHERE per action |
| [capability_migration.md](./capability_migration.md) | Capability layer — step plan (C0–C9) |
| [single_capabiity_change.md](./single_capabiity_change.md) | Capability layer — new & changed files map |
| [step_one_cleanup.md](./step_one_cleanup.md) | Pre-capability cleanup — U1–U5 |
| [appendix.md](./appendix.md) | Historical pipeline notes, changelog |

---

## Kite

**Role:** Generic renderer. No business logic, no AWS, no request state.

- Sends messages to API `POST /message` with `conversationID`
- Renders CloudPilot chat text from API response
- Renders `navigatorResponse` (stats, tables, columns, alerts) via generic client renderer
- Does **not** interpret action types or field collection — API owns orchestration

**Navigator data** is shaped by API (`navigator/functions/navigatorFunctions.js` + per-action adapters). Kite displays what it receives.

---

## API

### Terminology (2026-06-06)

**The word *workflow* is retired in docs and product language.** Use **request** only.

| Old (do not use) | New |
|------------------|-----|
| workflow | **request** |
| open workflow | **open request** |
| workflow row | **request row** |
| `cloudpilot_workflows` | **`cloudpilot_requests`** (target schema — see `database.md`) |

**Code still uses legacy names** (`workflowId`, `focused_workflow_id`, `cloudpilot_workflows`, `ActionState` class, `getUsersActionState`, etc.) until a dedicated rename pass. The orchestrator now uses **`currentRequestState`**, **`activeRequestAction`**, and import alias **`RequestStateFunctions`** (`requestLoadFunctions.js`).

### Three layers

```text
1. Action definition (static)     actionMap.js — scan_ec2, toggle_ec2, …
2. Request (user request)           cloudpilot_requests row — collect fields, confirm, cancel, resume
3. Execution (actual work)        Atlas/AWS run — today updates request row; target: cloudpilot_executions
```

**System layering:**

```text
Atlas         = execution engine (AWS mutations or mocks)
API           = orchestration + request state + Navigator shaping
Kite          = generic renderer
```

**Phase 1 request policy:** one open request per `conversation_id` (`is_open = 1`). History stays as closed rows.

**Naming:** `action_type` = machine key (`toggle_ec2`). `display_name` = human label ("Toggle EC2 Lab Environment").

### CloudPilot Capability Layer (target)

**Status:** Planned — see [capability_migration.md](./capability_migration.md) (Steps C0–C9). Incremental: start with `changes/toggleEC2`, then scans/inventory.

Today the execution path is:

```text
Action Registry → Handler → Atlas function → Atlas HTTP route
```

Over time, the **official product surface** should be named capabilities — the things Chat, Undo, PR generation, automatic remediation, and a future public API all call:

```javascript
toggleEC2()
scanEC2()
getAllResources()
createEC2()
```

Handlers stay **thick** (formatting, Navigator, chat copy). Capability functions stay **thin** (call Atlas HTTP, return structured result).

#### Four layers + History (cross-cutting)

| Concept | Question | Pipeline home |
|---------|----------|---------------|
| **Conversation** | WHAT should happen? | STEPS 3–5 — understand, decide, request state |
| **Execution** | WHEN should it happen? | STEP 6 — gate on `execution_started` / `immediate_execution` |
| **Capability** | HOW do we do it? | `capabilities/` — `scanEC2()`, `toggleEC2()`, `generalChat()` |
| **Engine** | WHERE do we talk? | Atlas HTTP, OpenAI SDK (`services/engines/llm/openai/`) |
| **History** | WHAT CHANGED? | Cross-cutting — **not a layer**; STEP 6B in `executionFunctions.js` |

History intentionally sits **outside** the capability path — a record of what happened, not part of HOW:

```text
executeRequest()
    ↓
handler
    ↓
toggleEC2()          ← capability (HOW)
    ↓
Atlas                ← engine (WHERE)
    ↓
saveHistory()        ← WHAT CHANGED (changes only)
```

Capabilities do not insert history rows. `saveHistory()` stays in STEP 6B after execution returns.

#### Three user intents → three folders

Prefer **`scans/` · `inventory/` · `changes/`** over a generic `info/` bucket — each maps to a distinct user intent:

| Group | Intent | Examples | History? |
|-------|--------|----------|----------|
| **scans** | Analyze something | `scanEC2()`, `scanS3()`, `scanRDS()` | No — returns findings |
| **inventory** | Tell me what exists | `getAllResources()`, `listEC2Instances()`, `listS3Buckets()` | No — returns resources |
| **changes** | Change something | `toggleEC2()`, `createEC2()`, `deleteEC2()`, `resizeEC2()` | Yes — creates `cloudpilot_history` rows |

This aligns cleanly with Change History: only **changes** get builders, `undo_payload`, and `history_status`.

#### Target layout

```text
application/atlas/capabilities/   ← sibling to services/ (not inside it)
├── scans/
│   ├── scanEC2.js
│   ├── scanS3.js
│   └── scanRDS.js
├── inventory/
│   ├── getAllResources.js
│   ├── listEC2Instances.js
│   └── listS3Buckets.js
├── changes/
│   ├── toggleEC2.js
│   ├── createEC2.js
│   └── deleteEC2.js
└── conversation/
    └── generalChat.js
```

#### Undo reuses capabilities — not Atlas directly

```text
User presses undo
  ↓
executeUndoPayload()          ← undoRegistry (later)
  ↓
toggleEC2({ start, stop })    ← same mutation capability
```

Whether the call came from a user toggle or an undo press should not matter. That reuse is the architectural goal.

**Two responsibilities stay separate:**

| Layer | Job |
|-------|-----|
| `history/historyBuilders/` | **Save** — target, before/after snapshots, `undo_payload`, `undo_available` |
| `undoRegistry.js` (later) | **Execute** — map `undo_payload.type` → call the right **mutation capability** |

See [development_undo_feature.md](./development_undo_feature.md) for history table and undo phases (H1–H4).

#### Relationship to existing folders

| Today | Becomes |
|-------|---------|
| `executions/functions/executionFunctions.js` | Still STEP 6 orchestrator — calls handlers, then `saveHistory()` for changes |
| `actions/*Handler.js` | Still thick — understanding fields, Navigator, chat |
| `atlasEC2Functions.scanEC2()` etc. | Move into `capabilities/scans/` or `capabilities/changes/` over time |
| `actionMap.js` | Unchanged — maps `action_type` → handler; handlers delegate to capabilities |

Do **not** collapse handlers into capabilities. Registry + handlers = product/orchestration; capabilities = reusable AWS/Atlas operations.

### Glossary: Request vs Action vs General Chat

| Term | Meaning |
|------|---------|
| **Request** | User wants CloudPilot to do something — workflow tracked in `cloudpilot_requests` (fields, status, confirm, cancel) |
| **Action** | Thing CloudPilot knows how to do — `scan_ec2`, `toggle_ec2`, `inventory_aws` in `actionMap.js` |
| **General Chat** | Not a request — casual conversation; OpenAI only; no DB write; no Atlas |

Do not confuse **request** (workflow row) with **action** (registry entry). The open request’s `pendingAction` field is which action the request is for.

### First gate: Request Workflow vs General Chat

After STEP 3 (Understand) and STEP 4 (Decide), every message lands in one of two paths:

```text
STEP 3  Understand     What is the user trying to do?
STEP 4  Decide         What should happen next?
        │
        ├─ Request Workflow   → CloudPilot pipeline (steps 5–7; Atlas may run)
        └─ General Chat       → OpenAI only (steps 5–6 skipped)
```

**Request Workflow** — CloudPilot orchestrates the turn. Subtypes (STEP 4 decides which):

```text
Request Workflow
    ├─ New Request          → user named an action; start collecting fields
    ├─ Continue Request     → fill fields, pick execution mode, confirm
    ├─ Request Commands     → list_open, status, undo, focus_switch
    └─ Run Work             → execute now
          ├─ immediate      → inventory_aws (Atlas, no request row)
          └─ confirmed      → scan_ec2, toggle_ec2, … (Atlas, with request row)
```

CloudPilot owns the reply today. OpenAI may assist wording later, but the request pipeline still runs.

**General Chat** — not about the request system. Even if an open request exists, a message like “hello” stays General Chat; the row is untouched.

Decision signal in code: `decision.chatType` — `cloudPilotResponding` (Request Workflow) vs `generalChatResponding` (General Chat).

### `processMessage` pipeline (STEP 1–7)

**Golden rule:** understand once → decide once → apply once → execute (if needed) → respond once.

```text
Message
  ↓ STEP 1  Normalize message
  ↓ STEP 2  Load current request (DB)
  ↓ STEP 3  Understand message        → understanding/   (what is the user trying to do?)
  ↓ STEP 4  Decide next step          → decision/        (what should happen next?)
  ↓ STEP 5  Apply decision to request → requests/ (start / update / finish / cancel / skip)
  ↓ STEP 6  Execute (if needed)       → executions/ → Atlas HTTP
  ↓ STEP 7  Respond once              → responses/ + chat/
```

| Step | Status | Entry |
|------|--------|-------|
| STEP 1 Normalize | ✅ Live | `getCurrentUserMessage` |
| STEP 2 Load request | ✅ Live | `RequestStateFunctions.getUsersActionState` (`requestLoadFunctions.js`) |
| STEP 3 Understand | ✅ Live | `understandMessage.js` |
| STEP 4 Decide | ✅ Live | `decideNextStep.js` |
| STEP 5 Apply | ✅ Live | `applyDecision.js` |
| STEP 6 Execute | ✅ Live | `executionFunctions.js` → registry handlers |
| STEP 7 Respond | ✅ Live | `buildCloudPilotResponse.js` |

**STEP 6 rule:** Node always calls Atlas HTTP. No mock execution in Node. Mock data lives in Atlas Test routes only.

### Code folders (target layout)

```text
application/atlas/
├── capabilities/                   ← thin execution surface (scanEC2, toggleEC2, …)
└── services/                       ← CloudPilot API orchestration (was functions/)
    ├── actions/                    ← registry + handlers (static product code)
    ├── understanding/              ← STEP 3 — signals only, no DB
    ├── decision/                   ← STEP 4
    ├── requests/                   ← STEP 2 load + STEP 5 apply
    ├── history/                    ← audit + undo (STEP 6B — WHAT CHANGED)
    ├── executions/                 ← STEP 6
    ├── chat/                       ← CloudPilotChat, outcomes, OpenAI
    ├── responses/                  ← STEP 7 assembly
    ├── navigator/                  ← Navigator response builders
    ├── config/                     ← chatGPTconfig, etc.
    └── cloudPilotMessageFunctions.js   ← thin orchestrator
```

See [appendix.md](./appendix.md) for old → new file rename map and historical STEP 5 spec.

### Service folders (`classes/` + `functions/`)

Persistence domains use the same layout inside each service folder. **`history/` is the reference** — migrate other services one at a time.

```text
<service>/
├── classes/
│   └── <Service>.js           ← MySQL CRUD only (insert, get, update, finish)
└── functions/
    └── <service>Functions.js  ← orchestration: call class, log STEPs, shape outcomes
```

Optional when a domain grows: extra `functions/*.js` files or helper subfolders (e.g. `history/historyBuilders/`).

| Layer | Owns |
|-------|------|
| **`classes/`** | SQL, row mapping — no chat, Atlas, or pipeline logic |
| **`functions/`** | “Do the thing” — entry points the orchestrator and STEPs call |

**Target services** (map to `database.md` tables):

| Service | Table / role | Status |
|---------|----------------|--------|
| **history** | `cloudpilot_history` | ✅ `history/classes/History.js` + `history/functions/historyFunctions.js` |
| **requests** | `cloudpilot_requests` | ✅ `Request.js` + `requestFunctions.js` + `requestLoadFunctions.js` + `requestStatusFunctions.js` |
| **executions** | `cloudpilot_executions` (future) | ✅ `executions/functions/executionFunctions.js` (no class yet) |
| **navigator** | Response shaping (no DB) | ✅ `navigator/functions/navigatorFunctions.js` |

**Migration rule:** service folder moves are complete; smoke-test chat after future service changes. Do not rename symbols repo-wide in the same pass as a folder move.

**Keep outside service folders** — pipeline steps and product code, not one DB table:

| Folder | Why separate |
|--------|----------------|
| `understanding/` | STEP 3 signals |
| `decision/` | STEP 4 pure logic |
| `responses/`, `chat/` | STEP 7 assembly and copy |
| `actions/` | Static registry + per-action handlers (`scan_ec2`, `toggle_ec2`, …) |
| `cloudPilotMessageFunctions.js` | Thin orchestrator — wires STEPs, does not own persistence |

Do not fold scans or handlers into a generic `scan/` service until there is a clear persistence layer for scans.

### `messageUnderstanding` shape (STEP 3 log)

```json
{
  "action": "toggle_ec2" | "general_chat" | null,
  "values": {},
  "reply": null,
  "conversation": null,
  "ambiguous": false,
  "candidates": [],
  "source": "rules",
  "confidence": 1
}
```

### Actions & input reference

**Actions** — intent phrases → `action`:

| Action | Example messages |
|--------|------------------|
| `general_chat` | `hello`, `hi` (no action match) |
| `inventory_aws` | `show me all my aws resources` |
| `scan_ec2` | `scan ec2`, `scan ec2 in us-west-2` |
| `toggle_ec2` | `toggle ec2`, `switch ec2` |
| `create_ec2` | `create ec2`, `create instance` |
| `delete_ec2` | `delete ec2`, `delete instance` |

**Values** — field inputs → `values`:

| Field | Example input |
|-------|----------------|
| `region` | `us-west-2`, `region: "us-west-2"` |
| `instance_id` | `i-0abc123…` (single bare ID) |
| `primary_instance_id` | `primary_instance_id: "i-…"`, first of two bare IDs |
| `secondary_instance_id` | `secondary_instance_id: "i-…"`, second bare ID |
| `name` | `name it my-demo-server`, structured `name: "…"` |
| `instance_type` | `t3.micro`, `instance_type: "t3.micro"` |

**Required fields per action:**

| Action | Required `values` |
|--------|-------------------|
| `scan_ec2` | `region` |
| `toggle_ec2` | `region`, `primary_instance_id`, `secondary_instance_id` |
| `create_ec2` | `name`, `region`, `instance_type` |
| `delete_ec2` | `region`, `instance_id` |
| `inventory_aws` | _(none — immediate execution)_ |

**Reply** — `yes`/`confirm` → `confirm`; `1`–`4` → **change strategies** (instructions, CLI, PR, automatic); `cancel` → `cancel`.

**Conversation commands** — `list_open`, `status`, `focus_switch`, `undo` — workflow control, not change strategies.

### Information vs change action flow

**Information actions** (`scan_ec2`, `inventory_aws`): collect fields (if any) → confirm (`yes` where required) → execute. No strategy menu.

**Change actions** (`toggle_ec2`, `create_ec2`, `delete_ec2`): collect fields → user picks strategy `1`–`4` → for automatic (`4`), confirm → execute.

Example (toggle): fields ready → user sends `4` (automatic strategy) → user sends `yes` → STEP 6 runs handler.

Strategy implementations: `change/strategies/` (target). See [code_cleanup.md](./code_cleanup.md#request-types-and-change-strategies).

### Key files

| File | Role |
|------|------|
| `services/cloudPilotMessageFunctions.js` | Orchestrator (`processMessage`) |
| `services/understanding/understandMessage.js` | STEP 3 |
| `services/decision/decideNextStep.js` | STEP 4 |
| `services/requests/functions/requestLoadFunctions.js` | STEP 2 — load open request |
| `services/requests/functions/requestFunctions.js` | STEP 5 — apply, start, update, finish |
| `services/requests/functions/requestStatusFunctions.js` | Request status rules (`waiting_on_fields`, …) |
| `services/executions/functions/executionFunctions.js` | STEP 6 |
| `services/conversation/CloudPilotMessage.js` | How CloudPilot speaks (templates + future engine) |
| `services/conversation/request/RequestConversation.js` | STEP 7 — Request Conversation speak routing |
| `services/conversation/request/workflow.js` | STEP 5–6 — store + execute passthrough |
| `services/change/strategies/` | Change strategies |
| `services/engines/llm/openai/openAIFunctions.js` | OpenAI SDK |
| `services/executions/outcomes/outcomeRegistry.js` | Handler outcome copy |
| `services/actions/actionMap.js` | Static action definitions (`actionTier`, `executionModes`) |
| `services/requests/classes/Request.js` | MySQL `cloudpilot_requests` |
| `services/history/classes/History.js` | MySQL `cloudpilot_history` |
| `services/history/functions/historyFunctions.js` | Save + lookup history (H1/H2) |
| `services/navigator/functions/navigatorFunctions.js` | Navigator stats / tables / columns |

### How to test locally

1. API: `npm start` (default port **3003**)
2. Atlas: uvicorn on **8000**
3. `POST /message` with `conversationID`, `messageFrom`, `messageCaption`
4. Watch **API terminal** for STEP logs

```bash
curl -X POST http://localhost:3003/message \
  -H "Content-Type: application/json" \
  -d '{"conversationID":1,"messageFrom":"davey","messageCaption":"toggle ec2","masterSite":"kite"}'
```

---

## Atlas

**Role:** Execution engine. Real AWS (Live) or fixed JSON mocks (Test).

### Live vs Test

```text
Live:  atlas/app/api/routes/ec2_operation_routes.py  → boto3 / AWS
Test:  atlas/app/api/routes/test/ec2_operation_routes_test.py  → MOCK_* JSON
```

Toggle in `atlas/app/main.py` — comment Live imports, uncomment Test imports, restart uvicorn.

**From the product perspective (future):** `Mode = TEST` vs `Mode = LIVE`. User never sees Python import toggles. See [../To_do.md](../To_do.md) — Learn / Test / Live.

### Routes (operations)

| Route | Live | Test mock |
|-------|------|-----------|
| `POST /scan/ec2` | Real scan | `MOCK_SCAN_EC2_DATA` |
| `POST /ec2/create` | `run_instances` | `MOCK_CREATE_DATA` |
| `POST /ec2/toggle` | stop/start + waiters | `MOCK_TOGGLE_DATA` |
| `POST /ec2/delete` | `terminate_instances` | `MOCK_DELETE_DATA` |
| `POST /inventory/aws` | Real inventory | placeholder mock |

Live success routes log **`Atlas Response:`** JSON for mock capture (toggle, delete; create optional).

### AWS profile

Atlas uses profile `atlas` via `config/aws/sessions.py`. API does not call AWS directly — only Atlas HTTP.
