# CloudPilot / Atlas — Current Development

**Purpose:** Single source of truth for what we are working on, what is done, and what is deferred.

**Last reviewed:** 2026-06-06 (pipeline rebuild — STEP 1–3 live)

**Reference docs (not todo lists):**

| Topic | Path |
|-------|------|
| Database schema (actions, requests, executions) | `doc/database/database.md` |
| Add a new action | `doc/instructions/adding_new_action.md` |
| Atlas → Navigator mapping | `doc/instructions/converting_atlas_data.md` |
| Legacy request SQL (being replaced) | `doc/sql/cloudpilot_workflows_phase1.sql` |
| EC2 chat samples | `api/README.md` |
| Create tags / delete safety (future) | `api/doc/instructions/cloudpilot_tagging_metadata.md` |

---

## Terminology (2026-06-06)

**The word *workflow* is retired in docs and product language.** Use **request** only.

| Old (do not use) | New |
|------------------|-----|
| workflow | **request** |
| open workflow | **open request** |
| workflow row | **request row** |
| `cloudpilot_workflows` | **`cloudpilot_requests`** (target schema — see `database.md`) |

**Code still uses legacy names** (`workflowId`, `focused_workflow_id`, `cloudpilot_workflows`, `ActionState`, etc.) until a dedicated rename pass. This doc and new schema use **request**; treat old identifiers as aliases for the same concept.

---

## Architecture (read once)

Three layers — use these names in docs and code reviews:

```text
1. Action definition (static)     actionRegistry.js — scan_ec2, toggle_ec2, …
2. Request (user request)           cloudpilot_requests row — collect fields, confirm, cancel, resume
3. Execution (actual work)        Atlas/AWS run — today updates request row; target: cloudpilot_executions
```

**Layering:**

```text
Atlas         = execution engine (AWS mutations)
Navigator/API = orchestration + request state + UI shaping
Kite          = generic renderer
```

**Phase 1 request policy:** one open request per `conversation_id` (`is_open = 1`). History stays as closed rows.

**Naming:** `action_type` = machine key (`toggle_ec2`). `display_name` = human label ("Toggle EC2 Lab Environment"). Defer `action_name` slug until multi-open.

---

## Target code layout (`functions/`)

Align folders with the three layers: **actions** (static) → **requests** (user request state) → **executions** (Atlas/AWS runs). No code move yet — this is the target shape.

```text
functions/
│
├── actions/                          ← keep as-is (registry + handlers)
│   ├── actionRegistry.js
│   ├── aws/
│   └── ec2/
│
├── requests/
│   ├── Requests.js                   ← DB class (today: classes/Actions.js → cloudpilot_requests)
│   ├── requestStatusFunctions.js     ← waiting_on_* helpers (today: actionStatusFunctions.js)
│   ├── requestConversationFunctions.js  ← open-requests list, focus switch (today: workflowConversationFunctions.js)
│   └── requestFieldFunctions.js      ← field extractors (today: functions.js — region, instance_id, execution mode)
│
├── executions/
│   ├── Executions.js                 ← NEW — cloudpilot_executions CRUD (not built yet)
│   └── AtlasExecution.js             ← run handlers (today: classes/AtlasExecution.js)
│
├── chat/                             ← keep (CloudPilotChat, chatOutcomeRegistry, openAI/)
├── navigator/                        ← today: navigatorResponseFunctions.js at functions root
│   └── navigatorResponseFunctions.js
├── config/                           ← keep (chatGPTconfig.js)
│
└── cloudPilotMessageFunctions.js     ← orchestrator (processMessage) — stays at root for now
```

### Old → new file map

| Today | Target |
|-------|--------|
| `classes/Actions.js` | `requests/Requests.js` |
| `actionStateFunctions.js` | `requests/Requests.js` (state bridge: get/set open request — colocate or split later if file grows) |
| `actionStatusFunctions.js` | `requests/requestStatusFunctions.js` |
| `workflowConversationFunctions.js` | `requests/requestConversationFunctions.js` |
| `functions.js` (Atlas field extractors) | `requests/requestFieldFunctions.js` |
| `classes/AtlasExecution.js` | `executions/AtlasExecution.js` |
| *(none)* | `executions/Executions.js` |
| `navigatorResponseFunctions.js` | `navigator/navigatorResponseFunctions.js` |
| `state/ActionState.js` | **Remove** after memory mode dropped |
| `state/focusedWorkflowFunctions.js` | **Merge into** `requestConversationFunctions.js` (wire up — currently orphaned) |
| `state/conversationStateFunctions.js` | **Remove** (unused) |
| `classes/` folder | **Remove** when empty |

### Rules for the move

- **Rename with the folder**, not before — one PR per area (requests, then executions, then navigator).
- **`actions/`** stays untouched during request refactor.
- **`Requests.js`** talks to `cloudpilot_requests`; **`Executions.js`** talks to `cloudpilot_executions` — same Post.js-style static methods as today.
- **`cloudPilotMessageFunctions.js`** imports from `requests/` and `executions/`; avoid circular requires.
- Delete **`state/`** only after `ActionState.js` memory path is gone and focused-request logic lives under `requests/`.

---

## Pipeline rebuild (`processMessage`) — **active work**

**Goal:** Replace the old ~500-line interleaved pipeline with inspectable steps. Each step logs one object; orchestrator stays thin.

```text
Message
  ↓ STEP 1  Normalize
  ↓ STEP 2  Load active request (DB)
  ↓ STEP 3  Understand message     → messageUnderstanding
  ↓ STEP 4  Process request        → requestOutcome          ← NEXT
  ↓ STEP 5  Process execution       → executionOutcome        (later)
  ↓ STEP 6  Build response           → responseOutcome         (later)
```

**Layers (folder targets):**

| Layer | Folder | Job |
|-------|--------|-----|
| Understanding | `functions/understanding/` | Read message → signals only (no DB, no chat text) |
| Request | `functions/requests/` (next: `processRequest.js`) | State machine + DB writes → `actionEvent`, `shouldExecute` |
| Execution | `functions/executions/` | Atlas/AWS when `shouldExecute` |
| Response | `functions/responses/` (`buildResponse.js` first; delegates to `chat/`) | Only layer that produces user-facing text |

**Import style:** one namespace per module — e.g. `const UnderstandingFunctions = require('./understanding/parseMessage');` then `UnderstandingFunctions.understandUserMessage(...)`. No destructured requires in the orchestrator.

### What is live today (2026-06-06)

| Step | Status | Code |
|------|--------|------|
| STEP 1 Normalize | ✅ Live | `getCurrentUserMessage` |
| STEP 2 Load request | ✅ Live | `ActionStateFunctions.getUsersActionState` → `cloudpilot_requests` via `Actions.js` |
| STEP 3 Understand | ✅ Live | `UnderstandingFunctions.understandUserMessage(message, currentActionState)` |
| STEP 4+ | ❌ Not wired | Old STEP 4–8 still **commented** in `cloudPilotMessageFunctions.js` |

**Understanding (P1 done):**

- `understanding/getAction.js` — registry `match()` → action type
- `understanding/parseMessage.js` — `buildUnderstandingContext`, `parseMessage`, **`understandUserMessage`** (orchestrator entry)
- When **idle**: runs `getAction` → e.g. `"toggle_ec2"` or `"general_chat"`
- When **open request**: returns `action: null` (continuations — do **not** treat as `general_chat`)

**`messageUnderstanding` shape (log at STEP 3):**

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

### Why `region: "us-west-2"` does nothing yet (expected)

1. **No STEP 4** — `"toggle ec2"` does not create a row in `cloudpilot_requests`; INITIAL STATE stays empty on the next message.
2. **No P2 `getValues`** — structured fields are not parsed into `messageUnderstanding.values`.
3. **No Request apply** — even with values, nothing calls `setUsersActionField` until STEP 4 / Request layer.

Until those land, only STEP 3 logs are meaningful. HTTP reply may stay empty (`success: false`) — that is OK.

### Incremental rollout

| Phase | What | Test |
|-------|------|------|
| **P0** | DB: `cloudpilot_actions` + `cloudpilot_requests` + seed; `Actions.js` migrated | STEP 2 loads without `ER_NO_SUCH_TABLE` |
| **P1** | `understanding/` + STEP 3 log | `toggle ec2` → `"action": "toggle_ec2"`; idle `hello` → `"general_chat"` |
| **P4 (next)** | `requests/processRequest.js` + STEP 4 log `requestOutcome` | After `toggle ec2`, **next** message INITIAL STATE shows open request + `missing` |
| **P2** | `understanding/getValues.js` + Request applies fields | `region: "us-west-2"` updates `collected` / shrinks `missing` |
| **P3** | `getReply.js` — mode `1`–`4`, confirm `yes` | Destructive tier flow |
| **P5** | `responses/buildResponse.js` | Chat text returns in API response |
| **P6** | `executions/processExecution.js` | Atlas runs on confirm |

**First STEP 4 slice:** general_chat routing + start/replace request (old commented STEP 4 only). Defer field apply, status transitions, execution until P2/P3.

**Target `requestOutcome` (log at STEP 4):**

```json
{
  "actionEvent": "general_chat" | "new_request_created" | null,
  "shouldExecute": false,
  "shouldRespond": true,
  "requestState": { "pendingAction", "status", "missing", "collected", ... },
  "activeRequest": "toggle_ec2" | null,
  "errors": []
}
```

**Request guardrail:** `action === "general_chat"` only when idle + no registry match. `action === null` with open request = continuation — never start a new row.

### How to test locally

1. `npm start` (default port **3003**)
2. `POST /message` with `conversationID`, `messageFrom`, `messageCaption`
3. Watch **server terminal** for STEP 2 / STEP 3 (and STEP 4 when added) — not only the HTTP body

```bash
curl -X POST http://localhost:3003/message \
  -H "Content-Type: application/json" \
  -d '{"conversationID":1,"messageFrom":"davey","messageCaption":"toggle ec2","masterSite":"kite"}'
```

Chat samples: repo root `README.md` (EC2 mutations section).

### Key files

| File | Role |
|------|------|
| `functions/cloudPilotMessageFunctions.js` | Orchestrator (`processMessage`) |
| `functions/understanding/parseMessage.js` | STEP 3 |
| `functions/understanding/getAction.js` | Registry intent (rules) |
| `functions/actions/actionStateFunctions.js` | STEP 2 state bridge |
| `functions/classes/Actions.js` | MySQL `cloudpilot_requests` (target rename: `requests/Requests.js`) |
| `doc/database/database.md` | Schema + seed SQL |

Old message parsing in `cloudPilotMessageFunctions.js` (commented STEP 5/6/7) and removed `detectUserRequest` are marked `TO DO: remove me` — superseded by `understanding/` + `requests/processRequest`.

---

## 1) Current Development

### A. Requests & chat UX

**Goal:** Durable requests, conversational confirm, open-actions visibility.

| Task | Status | Notes |
|------|--------|-------|
| **Schema migration** | Planned | `cloudpilot_actions` + `cloudpilot_requests` + `cloudpilot_executions` — see `database.md` |
| **P3C — Open actions Navigator table** | **Next** | `open_actions` table in `navigatorResponse`; columns: display_name, action_type, status, missing, run; Run Now placeholder row |
| **Policy on routes** | Not started | `allowed`, `reasonNotAllowed` on message routes / responses |
| **Restart mid-flow test** | Verify | DB is source of truth in mysql mode — confirm after schema fix (`display_name`) |
| **Remove / gate `ActionState.js`** | Partial | `CLOUDPILOT_STATE_BACKEND=memory` for tests only; delete Map when restart test is green |
| **`inventory_aws` request row** | Decide | Does informational inventory need a persisted row on start? |

### E. `functions/` folder restructure (planned)

**Goal:** Match folder names to actions / requests / executions layers (see [Target code layout](#target-code-layout-functions)).

| Task | Status | Notes |
|------|--------|-------|
| **Create `requests/`** | Planned | Move + rename per old → new map; update requires |
| **Create `executions/`** | Planned | Move `AtlasExecution.js`; add `Executions.js` when execution table lands |
| **Create `navigator/`** | Planned | Move `navigatorResponseFunctions.js` |
| **Wire `focusedWorkflowFunctions`** | Planned | Merge into `requestConversationFunctions.js` (file exists but unused today) |
| **Remove `state/`** | Planned | After memory mode + focused-request merge |
| **Remove `classes/`** | Planned | After `Requests.js` + `executions/` move |

**Do not** rename symbols across the whole repo in one pass — move files first, then terminology (`workflowId` → `requestId`) as a follow-up.

**England rule (keep):** bare `4` and bare `yes` target the focused request; prompts include quoted `display_name`.

**Do not start yet:** multiple open requests per conversation, `run 1` disambiguation, wired Run button → execute.

---

### B. EC2 mutations (create / delete / toggle)

**Goal:** All three run end-to-end in **`automatic`** mode with manual AWS verification.

**API wiring:** Done for create, delete, toggle (handlers, registry, Atlas clients, field extractors, chat request flow).

| Task | Status | Notes |
|------|--------|-------|
| **Manual AWS E2E — create** | Needs verify | Intent → fields → `4` → `yes` → instance running + tags |
| **Manual AWS E2E — delete** | Needs verify | Instance `terminating` / `terminated` |
| **Manual AWS E2E — toggle** | Needs verify | Primary stopped, secondary running |
| **Stage 4 — cross-action sequence** | Needs | create → toggle → delete on test instances; document cleanup |
| **Stage 4 — failure paths** | Needs verify | Missing fields, bad IDs, wrong state — friendly messages |
| **Atlas unreachable** | Needs | Structured `atlas_unreachable` for all three handlers (no fetch crash) |
| **Stage 0 — Atlas hardening** | Optional | Toggle `ClientError` wrapping; AMI strategy (`DEFAULT_AMIS`) |
| **E2E scripts** | Partial | `e2e-create-ec2.js`, `e2e-delete-ec2.js` exist; toggle script optional |

**Prerequisites:** Atlas at `ATLAS_BASE_URL`, AWS profile `atlas`, test region aligned with defaults, two instance IDs for toggle.

**Exit criteria (all three):** Chat in automatic mode changes AWS; success returns non-null `atlasResponse`; manual verify in console.

---

### C. Kite integration

**Goal:** Connect Kite to `POST /message` and render CloudPilot + Navigator payloads.

| Task | Status | Notes |
|------|--------|-------|
| Send `conversationID` on every message | Kite | Required for request scope |
| Render `CloudPilotActionStatus` | Kite | status, missing, collected, request id (`workflowId` in API today), displayName |
| Render `navigatorResponse` | Kite | stats / tables from scan + inventory (done on API side) |
| Open actions dashboard table | Blocked on P3C | API must emit `open_actions` table first |
| React Query cache for Navigator | Later | `["navigator-data", groupID, conversationID]` |

---

### D. Error & outcome handling (remaining manual tests)

**Code:** Complete (2026-05-24). Outcomes are data, not crashes.

| Task | Status | Notes |
|------|--------|-------|
| Toggle deleted IDs → friendly message, no partial stop/start | Manual test | Preflight should block |
| Atlas stopped → `atlas_unreachable`, API stays up | Manual test | All mutation handlers |

**Pattern:** Validate → Execute → (Verify later). Deleted instance = **outcome**, not HTTP 500.

---

## 2) Finished Development

### Requests & database

- [x] Durable request rows in MySQL (`cloudpilot_workflows` today → `cloudpilot_requests` target) + `Actions.js`
- [x] `display_name` on create from registry `actionLabel`
- [x] User-friendly statuses (`waiting_on_fields`, `waiting_on_execution_mode`, `waiting_on_confirmation`, `running`, terminal states)
- [x] MySQL as source of truth (`actionStateFunctions.js`, `CLOUDPILOT_STATE_BACKEND=mysql` default)
- [x] Focused request tracking in-process (P2C — code: `focused_workflow_id`)
- [x] England-rule copy in `CloudPilotChat.js` (P3A)
- [x] Chat open-actions list — “what am I waiting on”, focus switch by name/index (P3B)
- [x] Dual-write bridge removed from hot path; reads/writes via `Actions` + `getUsersActionState`

### EC2 mutations — API code

- [x] `create_ec2`, `delete_ec2`, `toggle_ec2` in `actionRegistry.js`
- [x] Handlers mirror `createEC2Handler` pattern; automatic mode calls Atlas
- [x] Field extractors: region, name, instance_type, instance_id, primary/secondary IDs
- [x] Instance-id heuristic guard (one bare `i-…` per message for shared extractor)

### Navigator UI contract

- [x] `navigatorResponseFunctions.js` — stats, tables, columns, alerts
- [x] Kite generic renderer (client)
- [x] `inventory_aws` + `scan_ec2` Navigator adapters wired
- [x] Opt-in `raw` on read adapters

### Error & outcome handling (code)

- [x] `messages.js` guard — failed remediation does not crash API
- [x] Atlas toggle preflight + `ClientError` → structured envelope
- [x] `atlasEC2Functions` — parse envelope; no throw on `success: false`
- [x] Handlers map outcome codes → friendly `cloudPilotMessage`
- [x] Orchestration guards for repeat intent / failed request / null events

### Informational actions

- [x] `scan_ec2`, `inventory_aws`, `general_chat` registry + handlers

---

## 3) Long Term Ideas (Not being worked on)

### Execution persistence (Phase 2)

- `cloudpilot_executions` table — `execution_id`, `request_id`, `operation_id`, request/response JSON, audit trail
- Separate **request** (intent + collected fields) from **execution** (AWS run)
- `AtlasExecution.js` creates execution row instead of only updating request status
- Long-running runs survive Node restart; retries = new execution row on same request

### `operation_id` + mutation metadata (Stage 0.5)

- Generate `operation_id` when execution starts; pass through handlers to Atlas
- Shared context: `execution_mode`, `initiated_by`, `requested_at`
- Not persisted until execution table exists

### Multi-open requests (Phase 2 product)

- Relax one-open-per-conversation constraint
- Kite table with **Run** per row; disambiguation: `run 1`, fuzzy `display_name`
- Optional `action_name` slug; request resolution Rules 1–6 (legacy: `resolveWorkflow()`)
- Named confirm only when ambiguous

### EC2 hardening (Stage 5+)

- Toggle by tags/roles (`cloudpilot-role: primary/secondary`) — no raw IDs in chat
- Delete safety: only `cloudpilot-managed=true` instances
- Destructive confirmation copy before final confirm
- `automatic_safe` / rollback / monitoring execution modes
- Navigator adapters for mutate actions (create/delete/toggle results)
- Waiters after create (running) / delete (terminated)

### Platform & credentials

- Rollback / undo (after stable mutation flow + execution history)
- Per-user / multi-account AWS credentials
- Bulk actions (“delete 5 instances” → 5 request rows)
- More actions: `resize_ec2`, security scan, cost report, RDS, IAM, Terraform

### Deprecated / do not use

- **`atlas_actions`** table — early sketch; superseded by `cloudpilot_requests`. No JS references.
- **“Workflow”** as a product/doc term — use **request** only.

### Navigator / Kite polish

- Persist Navigator data (React Query cache rules)
- Better column formatting in Kite (`currency`, `status` alignment)
- Opt-in developer `raw` mode default-off
- File naming cleanup pass (separate chore)
- Avoid premature abstraction (schema engines, dynamic plugin registries)

---

## Suggested order (today)

```text
1. Pipeline rebuild — STEP 4 processRequest (log requestOutcome), then P2 getValues, P5 buildResponse
2. Adopt cloudpilot_actions + cloudpilot_requests + cloudpilot_executions (database.md) — Actions.js done; run SQL if not yet
3. P3C — open_actions Navigator table (API)
4. functions/ restructure — requests/ then executions/ then navigator/ (see section 1E)
5. Kite — wire POST /message + render action status + navigator tables
6. Manual AWS E2E — create, delete, toggle + Stage 4 cross-action
7. Policy fields on routes
8. Phase 2 — Executions.js + operation_id (when ready for audit/retries)
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-06 | **Pipeline rebuild:** section added — STEP 1–3 live (`understanding/`), STEP 4 next; why region/fields not persisted yet; test curl |
| 2026-06-06 | **Target `functions/` layout:** `requests/`, `executions/`, `navigator/` — old → new file map; section 1E |
| 2026-06-06 | **Terminology:** *workflow* retired — use **request** only; target tables `cloudpilot_requests` / `cloudpilot_executions` per `database.md` |
| 2026-06-06 | Consolidated `MASTER_TODO.md`, `Master_Database.md`, `Master_Error_Fixes.md`, `action_to_do.md` (and duplicate `to_do/` copies) into this file |
| 2026-06-01 | Prior docs: request phases P0–P3B shipped; P3C next |
| 2026-05-28 | EC2 mutation API wiring complete; manual AWS pending |
| 2026-05-24 | Error/outcome handling implemented; Navigator contract + adapters |
