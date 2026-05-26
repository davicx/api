# CloudPilot / Atlas — Master Database Plan

**Purpose:** Plan moving from in-memory `state/` mocks to durable MySQL storage — what to store, which tables, and which code paths change.

**Status:** Planning only — no implementation in this doc.

**Last reviewed:** 2026-05-26

**Related:** `doc/MASTER_TODO.md` (execution records vs chat workflow), `api/doc/database/shareshare_may_2026.sql`

---

## Executive summary

| Today | Target |
|-------|--------|
| Chat **messages** already persist in MySQL (`messages`, `conversations`) | Keep as-is |
| Workflow state lives in **Node memory** (`ActionState.js` `Map`) | Persist per `conversation_id` in MySQL |
| AWS mutation runs have **no durable audit trail** | New **execution** table with `operation_id` |
| `atlas_actions` table **exists in schema but is unused** in JS | Wire or replace — don’t invent a third model |

**Recommendation:** Use existing **MySQL (RDS)** — you already have `conn`, `Message`, and patterns in `application/functions/classes/`. Add a repository layer so `processMessage` / `AtlasExecution` keep the same *behavior* while storage becomes durable.

**Do not** put long-running Atlas run status inside workflow state (see MASTER_TODO). Two concerns → two tables.

---

## Current state (audit)

### What is actually used

```text
postMessage (logic/messages.js)
  → Message.createMessageText()          # MySQL — user + CloudPilot messages
  → processMessage(conversationID)       # in-memory workflow
       → actionState (state/ActionState.js)
       → AtlasExecution → handlers → Atlas
```

**Active:** `state/ActionState.js` — singleton `Map` keyed by `conversationID` (string or number).

| Field | Role |
|-------|------|
| `pendingAction` | e.g. `create_ec2`, `scan_ec2` |
| `status` | `pending` → `ready` → `running` / `completed` / `failed` |
| `executionMode` | `instructions` \| `cli` \| `pr` \| `automatic` |
| `collected` | object — workflow field values |
| `missing` | array — required fields still needed |
| `asked` | object — which missing-field prompts were shown |

**Legacy / unused in live path:** `state/conversationStateFunctions.js` — second `Map`, TTL, `slotAttempts`, cancel helpers. Comments say “replace with DB/Redis.” Not imported by `cloudPilotMessageFunctions.js` today. **Consolidate or delete** during migration — don’t persist two parallel models.

### What is already in MySQL

| Table | Used by CloudPilot? | Notes |
|-------|---------------------|--------|
| `conversations` | Yes (via Kite/API) | `conversation_id`, `group_id` |
| `messages` | Yes | `conversation_id`, text, `messageFrom` |
| `atlas_actions` | **No** — schema only | Close to workflow shape; missing `conversation_id`, `execution_mode`, `asked` |

Existing `atlas_actions` (from dump):

```sql
id, user_id, intent, status, params (json), missing (json),
error_message, executed_at, created_at, updated_at
```

Statuses default `incomplete` — workflow today uses `pending` / `ready` / `running` / `completed` / `failed`. Needs alignment if you reuse this table.

### Pain points in-memory causes

1. **Node restart** — user mid-flow loses pending action, fields, mode, confirmation context.
2. **Multiple API instances** — each process has its own `Map` (no shared state).
3. **No audit** — who confirmed create, when, with what fields, before AWS ran.
4. **Toggle / long runs** — workflow cleared on success while Atlas may still be running (MASTER_TODO already warns: execution lifecycle must not live only in ActionState).
5. **E2E / debugging** — string conversation IDs like `e2e-create-123` work in memory but don’t match DB `conversation_id` ints.

---

## Design principles

1. **Two layers of persistence** (non-negotiable, from MASTER_TODO):

   | Layer | Purpose | Lifetime |
   |-------|---------|----------|
   | **Workflow state** | Chat UX: fields, mode, confirmation | Active conversation; archive or TTL when done |
   | **Execution records** | AWS/Atlas runs: audit, status polling, rollback later | Permanent (or long retention) |

2. **Repository behind ActionState** — callers keep `actionState.setField(...)` etc.; implementation swaps `Map` → SQL.

3. **Extend existing MySQL** — avoid Redis unless you later need sub-second TTL at scale; not required for MVP durability.

4. **Scope discipline** — Phase 1 = workflow only. Phase 2 = executions. Rollback / full `operation_id` orchestration = later.

5. **Ask before destructive AWS tests** — DB does not change that rule.

---

## Target tables

### Option A (recommended): Extend + wire `atlas_actions` for workflow

Rename mentally to **“active workflow per conversation”** — one active row per `conversation_id` (unique constraint).

**Proposed schema changes** (migration, not code here):

| Column | Type | Notes |
|--------|------|--------|
| `id` | bigint PK | keep |
| `conversation_id` | int NOT NULL | FK → `conversations` |
| `user_id` | bigint | who started (from `postMessage` / session) |
| `intent` | varchar(100) | maps to `pendingAction` / action `type` |
| `status` | varchar(20) | `pending`, `ready`, `running`, `completed`, `failed`, `cancelled` |
| `execution_mode` | varchar(20) NULL | `instructions`, `cli`, `pr`, `automatic` |
| `params` | json | maps to `collected` |
| `missing` | json | array of field names |
| `asked` | json NEW | maps to `asked` |
| `error_message` | text | workflow/execution errors |
| `executed_at` | datetime NULL | optional: last AWS attempt timestamp |
| `created_at`, `updated_at` | datetime | keep |

**Indexes:**

- `UNIQUE (conversation_id)` — only one active workflow per chat (or allow history — see Option B).
- `KEY (user_id, status)` — already similar in dump.

**Status mapping:**

| In-memory today | DB `status` |
|-----------------|-------------|
| new action started | `pending` |
| all fields present | `ready` |
| AtlasExecution started | `running` |
| handler success + clear | `completed` (then row deleted or archived) |
| handler failure | `failed` |

**On `clear()`:** Either `DELETE` row or set `status = completed` and move to history table (Phase 1.5).

---

### Option B: History table (optional, Phase 1.5)

`atlas_action_history` — snapshot when workflow completes/fails/cancels. Same columns + `closed_at`. Lets you debug “what was the user trying to do?” without keeping a unique row on `conversation_id`.

---

### Table 2 (new): `atlas_executions` — AWS / Atlas runs

Source of truth for **mutation lifecycle** (create/toggle/delete), separate from chat workflow.

| Column | Type | Notes |
|--------|------|--------|
| `id` | bigint PK | |
| `operation_id` | varchar(64) UNIQUE | e.g. `op_<uuid>` — generated at confirm time |
| `conversation_id` | int | |
| `user_id` | bigint | |
| `action_type` | varchar(50) | `create_ec2`, `delete_ec2`, `toggle_ec2` |
| `execution_mode` | varchar(20) | |
| `status` | varchar(20) | `queued`, `running`, `completed`, `failed` |
| `request_body` | json | body sent to Atlas |
| `response_body` | json NULL | Atlas response `data` + envelope |
| `error_code` | varchar(100) NULL | e.g. `no_default_ami_for_region`, `atlas_unreachable` |
| `atlas_http_status` | int NULL | |
| `initiated_by` | varchar(255) | username |
| `started_at` | datetime | |
| `completed_at` | datetime NULL | |
| `created_at`, `updated_at` | datetime | |

**Indexes:** `(conversation_id)`, `(operation_id)`, `(status, started_at)`.

**Flow:**

```text
User confirms → insert execution (queued)
AtlasExecution starts → status running
Handler returns → status completed/failed + response_body
ActionState.clear() → workflow row gone; execution row remains
```

Toggle (minutes, waiters): client can poll `GET /executions/:operation_id` later; workflow must not be the only place showing “still running.”

---

### Table 3 (optional, later): `atlas_execution_events`

Append-only log for multi-step toggle (stop primary → start secondary). Not needed for create/delete MVP.

---

### What we are NOT migrating yet

| Data | Reason |
|------|--------|
| `actionRegistry` | Code/config, not DB |
| Atlas Python scan results | Atlas returns per request; optional cache later |
| Navigator `navigatorResponse` | Can snapshot into `response_body` or `messages` metadata later |
| Full OpenAI thread | Separate concern |

---

## Code change map (no implementation — file-level plan)

### New modules (suggested layout)

```text
application/atlas/
  state/
    ActionState.js              # becomes thin facade (same public API)
    repositories/
      WorkflowStateRepository.js      # interface: get, save, clear, setField, ...
      MysqlWorkflowStateRepository.js   # uses db pool / existing conn pattern
    execution/
      ExecutionRepository.js
      MysqlExecutionRepository.js
  functions/classes/
    AtlasExecution.js           # write execution rows; generate operation_id
```

Mirror existing API style: classes under `application/functions/classes/` (e.g. `Message.js`) if you prefer consistency over `state/repositories/`.

### Files that must change

| File | Change |
|------|--------|
| `state/ActionState.js` | Delegate every method to `MysqlWorkflowStateRepository`; remove `Map` (or keep in-memory impl for local dev behind env flag). |
| `functions/cloudPilotMessageFunctions.js` | Pass `user_id` / `username` into state writes; handle async DB errors gracefully. |
| `functions/classes/AtlasExecution.js` | Create/update `atlas_executions`; set `operation_id` on request to Atlas. |
| `logic/messages.js` | Pass `user_id` (from `messageFrom` or auth) into `processMessage` payload. |
| `functions/actions/ec2/*Handler.js` | Read `operation_id` from context; include in Atlas body (Stage 0.5). |
| `state/conversationStateFunctions.js` | **Deprecate** — merge cancel/TTL into workflow repo or delete. |

### Files that should NOT need large changes

| File | Why |
|------|-----|
| `functions/chat/CloudPilotChat.js` | Still event-driven; state access stays via `actionState`. |
| `functions/actions/actionRegistry.js` | Unchanged |
| `functions/functions.js` | Field extractors unchanged |
| Atlas Python | Optional: log `operation_id`; no DB required in Atlas for Phase 1–2 |

### New API endpoints (optional, Phase 2)

| Endpoint | Purpose |
|----------|---------|
| `GET /cloudpilot/conversations/:id/workflow` | Debug / Kite “resume” UI |
| `GET /cloudpilot/executions/:operation_id` | Poll long toggle |

Not required for first DB milestone if chat responses still embed `actionStatus`.

### Environment / config

| Variable | Purpose |
|----------|---------|
| `CLOUDPILOT_STATE_BACKEND` | `memory` \| `mysql` (default `mysql` in prod) |
| `CLOUDPILOT_STATE_TTL_MS` | Already on legacy conversation state — apply to workflow `updated_at` expiry |
| Existing DB conn | Reuse `functions/conn` |

---

## Phased rollout

### Phase 0 — Decisions (before migrations)

- [ ] Reuse `atlas_actions` vs new table name `cloudpilot_workflows`
- [ ] On complete: **delete** workflow row vs **archive** to history
- [ ] Require numeric `conversation_id` only (reject e2e string IDs in prod)
- [ ] Map `user_id` from auth (today often username string in messages)

### Phase 1 — Durable workflow state (highest value)

**Goal:** Survive API restart; one conversation resumes “ask for region” etc.

1. Migration: alter `atlas_actions` (or create replacement) per table above.
2. `MysqlWorkflowStateRepository` implements current ActionState semantics.
3. Wire `postMessage` → pass `conversation_id` + `user_id` on every state write.
4. Manual test: mid-create flow, restart Node, send next message — state still there.
5. Remove or gate `conversationStateFunctions.js`.

**Exit criteria:** Same chat scripts as today; state survives process restart.

### Phase 2 — Execution records

**Goal:** Audit trail + foundation for toggle polling / rollback later.

1. Create `atlas_executions` migration.
2. `AtlasExecution.startNewAtlasExecution` inserts row, generates `operation_id`.
3. Handlers pass `operation_id` to Atlas request body.
4. On success/failure, update execution row before `actionState.clear()`.

**Exit criteria:** DB row for every automatic create; queryable by `operation_id`.

### Phase 3 — Hardening

- TTL job: mark stale `pending`/`ready` workflows cancelled after N hours.
- Unique active workflow enforcement + “replace pending action” race handling.
- `atlas_unreachable` stored on execution row.
- Optional Kite: show last execution on conversation.

### Explicitly later

- Redis cache layer
- Execution event stream / websockets
- Rollback tables
- Atlas Python writing to same DB

---

## `atlas_actions` vs new table — decision guide

| Reuse `atlas_actions` | New `cloudpilot_workflows` |
|------------------------|----------------------------|
| Less migration noise | Clearer name; no legacy `incomplete` status |
| Already in dump | Clean schema from day one |
| Must ALTER add columns | Slightly more setup |

**If reuse:** migrate `status` enum values and add `conversation_id` UNIQUE.

**If new:** leave `atlas_actions` deprecated empty; avoid two live tables doing the same thing.

---

## Data flow after migration (create example)

```text
1. User: "create ec2 instance"
   → INSERT/UPDATE workflow: intent=create_ec2, status=pending, missing=[name,region,instance_type]

2. User: name/region/type
   → UPDATE params JSON, missing=[]

3. User: "4"
   → UPDATE execution_mode=automatic, status=ready

4. User: "yes"
   → INSERT atlas_executions (operation_id, status=queued)
   → UPDATE workflow status=running
   → Handler → Atlas → AWS
   → UPDATE execution status=completed, response_body=...
   → DELETE or archive workflow row
```

Messages table continues to store each chat line independently.

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| DB latency on every message | Single upsert per turn; index `conversation_id` |
| Orphan `running` workflow if process crashes mid-Atlas | Stale job + execution row `failed`; TTL |
| Two servers double-execute | Optimistic lock: `UPDATE ... WHERE status='ready'` row count check before execution |
| `user_id` missing in chat path | Require from session in `postMessage` before persisting |
| Confusion with `atlas_actions` name | Document in this file + MASTER_TODO cross-link |

---

## Testing plan (when you implement)

| Test | Expect |
|------|--------|
| Mid-workflow API restart | Fields + mode preserved |
| Complete create | Workflow cleared; execution row remains |
| Failed create | Workflow `failed`; execution `failed` with error_code |
| Two tabs same conversation | Last write wins or lock — document chosen behavior |
| Invalid conversation_id | Graceful default / 400 |

Use **your** AWS account only with explicit approval.

---

## Suggested order relative to MASTER_TODO

```text
EC2 mutations stable (create proven, delete wired)
  → Phase 1 workflow DB
  → Phase 2 execution DB + operation_id
  → Toggle long-run polling
  → Rollback / history / Kite execution UI
```

Do **not** block delete EC2 handler work on DB — in-memory is still fine until Phase 1.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-26 | Initial plan: audit, tables, code map, phases |
