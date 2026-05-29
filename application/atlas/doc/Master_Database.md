# CloudPilot / Atlas — Master Database Plan

**Purpose:** Plan moving from in-memory `state/` mocks to durable MySQL storage — what to store, which tables, and which code paths change.

**Status:** Planning only — no implementation in this doc.

**Last reviewed:** 2026-05-28 (workflow records model; resolution rules; `is_open` column)

**Related:** `doc/MASTER_TODO.md` (execution records vs chat workflow), `api/doc/database/shareshare_may_2026.sql`

**Key insight:** You are not storing “conversation state.” You are storing **workflow records** — independent business objects that happen to live inside a conversation container.

---

## Executive summary

There are **two concepts** in CloudPilot persistence:

1. **Open actions (workflows)** — “I'm toggling EC2 and still need confirmation” + “I'm also deleting another instance and need instance_id”
2. **Execution history** — “I ran `create_ec2` at 2:15 PM and it succeeded”

**Important direction change:** CloudPilot is **not** “one active workflow per conversation.” A conversation can have **many open actions at once**:

```text
Conversation 123
├── Workflow #1  toggle_ec2   (missing: confirmation)
├── Workflow #2  delete_ec2   (missing: instance_id)
└── Workflow #3  cleanup_s3   (missing: bucket_name)
```

User can ask: **“What am I waiting on?”** → CloudPilot lists all open actions and missing fields.

| Today | Target |
|-------|--------|
| Chat **messages** already persist in MySQL | Keep as-is |
| Workflow in **Node memory** (`ActionState.js` `Map`, one slot per conversation) | **Phase 1:** `cloudpilot_workflows` — **many rows per conversation** |
| No durable audit trail for AWS runs | **Phase 2:** `cloudpilot_executions` (1 workflow → many executions) |
| `atlas_actions` unused in JS | Leave deprecated — use new tables |

**Code style:** New **`Actions` class** (like `Post.js`) with static methods — not a thin wrapper around today's `ActionState` Map forever.

**Two tables total:**

- **Phase 1:** `cloudpilot_workflows`
- **Phase 2:** `cloudpilot_executions`

---

## Mental model shift

| Old assumption | New direction |
|----------------|---------------|
| Storing **conversation state** | Storing **workflow records** — each row is an independent business object |
| `conversation_id` = primary key | `id` = primary key; conversation is a **container** for many workflows |
| `ActionState` = one current thing | **Workflow** = its own lifecycle row |
| `clear()` = delete row | **`finishAction`** → `is_open = 0`, `status`, `completed_at`; **keep row** |
| One pending action per chat | Many open workflows; future: bulk intents (“delete these 5 instances”) |

Example — three independent workflows in conversation 123:

| id | conversation_id | action_type | status                   | is_open |
| -- | --------------- | ----------- | ------------------------ | ------- |
| 1  | 123             | create_ec2  | pending                  | 1       |
| 2  | 123             | delete_ec2  | ready                    | 1       |
| 3  | 123             | cleanup_s3  | running                  | 1       |

Table name **`cloudpilot_workflows`** fits — each row is one workflow instance.

**The hard part is not the schema** (mostly CRUD). The hard part is **workflow resolution**:

```text
User message
      ↓
Which workflow should receive this update?
      ↓
UPDATE workflow row
```

See [Workflow resolution rules](#workflow-resolution-rules) — nail this before coding.

---

## Current state (audit)

### What is actually used today

```text
postMessage → processMessage(conversationID)
  → actionState (in-memory Map keyed by conversationID — ONE slot)
  → AtlasExecution → handlers → Atlas
```

Today's `ActionState` fields map to one workflow row:

| Field | Role |
|-------|------|
| `pendingAction` | e.g. `create_ec2` → becomes `action_type` |
| `status` | `pending` → `ready` → `running` / `completed` / `failed` |
| `executionMode` | `instructions` \| `cli` \| `pr` \| `automatic` |
| `collected` | JSON — workflow field values |
| `missing` | JSON array — required fields still needed |
| `asked` | JSON — which prompts were shown |

**Legacy:** `conversationStateFunctions.js` — second Map; deprecate during migration.

### Pain points in-memory causes

1. **Node restart** — all open work lost
2. **Only one action per conversation** — can't track toggle + delete in parallel
3. **No history** — completed work disappears on `clear()`
4. **No audit** — no record of what ran in AWS
5. **Toggle / long runs** — execution lifecycle must not live only in workflow row (Phase 2)

---

## Design principles

1. **Many open workflows per conversation** — schema supports it from day one.

2. **Keep completed rows** — status lifecycle, not delete-on-success:

   ```text
   pending → ready → running → completed | failed | cancelled
   ```

3. **Two tables, two responsibilities:**

   | Table | Stores |
   |-------|--------|
   | `cloudpilot_workflows` | What user wants, what's missing, workflow state |
   | `cloudpilot_executions` | What actually ran, result, rollback foundation |

4. **Relationship:**

   ```text
   cloudpilot_workflows (1)
         |
         | 1-to-many
         v
   cloudpilot_executions (many)
   ```

   Example: Resize workflow → execution #1 failed, execution #2 succeeded (retry).

5. **`Actions` class** — follows `Post.js` pattern: static methods, `db.getConnection()`, outcome objects.

6. **JSON for `collected` / `missing` / `asked`** — fields vary by action type; no per-field columns.

7. **Phase 1 scope:** workflows table + `Actions` class. Phase 2 adds executions. Don't normalize into 4–5 tables yet.

---

## Table 1 — `cloudpilot_workflows` (Phase 1)

**Replaces:** `ActionState.js` in-memory `Map`.

**Many rows per conversation** — each row is one open (or historical) action.

### Schema

```sql
CREATE TABLE cloudpilot_workflows (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    conversation_id BIGINT NOT NULL,
    action_type VARCHAR(100) NOT NULL,

    status VARCHAR(50) NOT NULL,
    execution_mode VARCHAR(50),
    is_open TINYINT(1) NOT NULL DEFAULT 1,

    collected JSON,
    missing JSON,
    asked JSON,

    created_at DATETIME,
    updated_at DATETIME,
    completed_at DATETIME NULL
);

CREATE INDEX idx_workflows_conversation ON cloudpilot_workflows (conversation_id);
CREATE INDEX idx_workflows_open ON cloudpilot_workflows (conversation_id, is_open);
```

**`is_open`** — simplifies queries. Open vs history without `status NOT IN (...)` every time.

| Query | SQL |
|-------|-----|
| Open actions | `WHERE conversation_id = ? AND is_open = 1` |
| Completed history | `WHERE conversation_id = ? AND is_open = 0` |

On **`finishAction`:** set `is_open = 0`, `status = completed|failed|cancelled`, `completed_at = NOW()`.

**Constraint (MVP):** At most **one open row per `action_type` per conversation**. Prevents four half-filled `delete_ec2` rows. Enforce in `createAction` (reject or replace). Can relax later for bulk actions.

Optional later: `user_id`, FK to `conversations`, UNIQUE partial index on `(conversation_id, action_type)` where `is_open = 1`.

### Example: three open actions in one conversation

| id | conversation_id | action_type | status  | missing        |
| -- | --------------- | ----------- | ------- | -------------- |
| 1  | 123             | toggle_ec2  | ready   | []             |
| 2  | 123             | delete_ec2  | pending | `instance_id`  |
| 3  | 123             | cleanup_s3  | pending | `bucket_name`  |

### Open actions query

```sql
SELECT *
FROM cloudpilot_workflows
WHERE conversation_id = ?
  AND is_open = 1;
```

### Full conversation history

```sql
SELECT *
FROM cloudpilot_workflows
WHERE conversation_id = ?
  AND is_open = 0
ORDER BY completed_at DESC;
```

### Status values

| Status | Meaning |
|--------|---------|
| `pending` | Action started; missing required fields |
| `ready` | All fields + mode present; awaiting confirmation |
| `running` | AtlasExecution in progress |
| `completed` | Finished successfully — **row kept** |
| `failed` | Handler or Atlas error — **row kept** |
| `cancelled` | User abandoned or stale TTL — **row kept** |

### On completion — do NOT delete

Use **`finishAction`** → `is_open = 0`, `status = completed|failed|cancelled`, `completed_at = NOW()`.

History and “what did we do in this chat?” stay queryable.

---

## Workflow resolution rules

**Write these down before coding.** This is more important than the table schema.

### What `processMessage` receives

The user does **not** know workflow `#17` exists. Every turn starts with:

```text
conversationId
message
```

Only **after** Navigator resolves intent does code get:

```text
workflowId = 17
```

Then: `Actions.updateAction(17, …)`.

```text
processMessage(conversationId, message)
      ↓
detect intent / extract fields
      ↓
resolveWorkflow(conversationId, message, extractedFields)  → workflowId | null | ambiguous
      ↓
update workflow row OR create new workflow OR general chat
```

### Constraint: one open row per action_type

At most one open `delete_ec2`, one open `create_ec2`, etc. per conversation. Simplifies resolution and prevents duplicate partial workflows.

### Rule 1 — Single match

If **exactly one** open workflow lists the extracted field in `missing` (e.g. only one open row missing `region`):

→ Update that workflow.

Example: user sends `region: "us-west-2"` → update workflow #17.

### Rule 2 — Multiple matches

If **multiple** open workflows are missing the same field:

→ Ask the user which action to update.

```text
I have 2 actions waiting for a region:

1. Create EC2
2. Scan EC2

Which action should I update?
```

Do not guess.

### Rule 3 — No match

If **no** open workflow is missing that field (and message is not a new action intent):

→ Treat as **general chat** (or “what am I waiting on?” if user asks).

### Rule 4 — New action intent

If message matches a **new** action (e.g. “delete ec2 instance”):

→ `Actions.createAction(...)` — new row (enforce one open per `action_type`).

### Rule 5 — Confirmation and execution mode

Special tokens (`4`, `yes`, `confirm`) resolve against:

1. Open workflow in `ready` status (all fields collected, mode set if required), or
2. If multiple ready → Rule 2 style disambiguation

### Rule 6 — “What am I waiting on?”

If user asks for status summary:

→ `Actions.getMissingActionInfo(conversationId)` — no workflow update.

### Planned Navigator helper

```text
resolveWorkflow(conversationId, message, extractedFields, detectedIntent)
  → { workflowId, action: 'update' | 'create' | 'finish' | 'list' | 'chat' | 'disambiguate', candidates[] }
```

**`Actions` class** owns CRUD. **Navigator** (`cloudPilotMessageFunctions.js` or dedicated module) owns resolution.

---

### Why JSON for `collected`

**create_ec2:** `{ "region", "instance_type", "name" }`  
**delete_ec2:** `{ "region", "instance_id" }`  
**toggle_ec2:** `{ "region", "primary_instance_id", "secondary_instance_id" }`

Same as before — action-specific fields stay in JSON.

---

## Table 2 — `cloudpilot_executions` (Phase 2)

**Add after** Create / Delete / Toggle verified in AWS.

### Schema

```sql
CREATE TABLE cloudpilot_executions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    workflow_id BIGINT NOT NULL,
    conversation_id BIGINT NOT NULL,

    operation_id VARCHAR(100),

    action_type VARCHAR(100),
    status VARCHAR(50),

    request_body JSON,
    response_body JSON,

    started_at DATETIME,
    completed_at DATETIME
);

CREATE INDEX idx_executions_workflow ON cloudpilot_executions (workflow_id);
CREATE UNIQUE INDEX idx_executions_operation ON cloudpilot_executions (operation_id);
```

`workflow_id` links each run to the workflow row that initiated it.

### Flow

```text
User confirms workflow #1
  → INSERT execution (running)
  → Handler → Atlas → AWS
  → UPDATE execution (completed/failed)
  → finishAction on workflow #1 (status=completed, completed_at=now)
  → execution row remains forever (audit)
```

Retry = new execution row on same `workflow_id` (later).

---

## `Actions` class (Phase 1 — Post.js style)

**Location (planned):**

```text
application/atlas/functions/classes/Actions.js
```

Follows same patterns as `Post.js`: static methods, MySQL via `conn`, structured outcomes.

### Core methods (planned API)

| Method | Purpose |
|--------|---------|
| **`createAction(conversationId, actionType, requiredFields)`** | INSERT new workflow row; status `pending`; missing = required fields |
| **`updateAction(workflowId, updates)`** | Update `collected`, `missing`, `asked`, `status`, `execution_mode` |
| **`finishAction(workflowId, status)`** | `is_open = 0`, set status + `completed_at` |
| **`getAction(workflowId)`** | Single workflow by `id` |
| **`getAllOpenActions(conversationId)`** | `WHERE conversation_id = ? AND is_open = 1` |
| **`getMissingActionInfo(conversationId)`** | Human-readable “what am I waiting on?” summary |

Optional helpers (same class):

| Method | Purpose |
|--------|---------|
| **`getOpenActionsByType(conversationId, actionType)`** | Filter open rows |
| **`cancelAction(workflowId)`** | status → `cancelled` |
| **`markFieldAsked(workflowId, fieldName)`** | Update `asked` JSON |

### Example: `getMissingActionInfo` response shape (for CloudPilot chat)

```text
Open Actions

1. Toggle EC2
   Missing: confirmation

2. Delete EC2
   Missing: instance_id

3. Cleanup S3
   Missing: bucket_name
```

Implementation builds this from `getAllOpenActions` + `actionRegistry` labels + `missing` JSON.

### What replaces today's `ActionState`

| Today (`ActionState`) | Future (`Actions` class) |
|-----------------------|--------------------------|
| `setPendingAction(conversationId, …)` | `createAction(conversationId, actionType, requiredFields)` |
| `setField(conversationId, field, value)` | `updateAction(workflowId, { collected, missing })` |
| `setStatus` / `setExecutionMode` | `updateAction(workflowId, { status, execution_mode })` |
| `clear(conversationId)` | `finishAction(workflowId, 'completed')` |
| `getActionStatus(conversationId)` | `getAllOpenActions(conversationId)` + pick focused row |
| — | `getMissingActionInfo(conversationId)` |

### Orchestration note

**Schema:** many open workflows from day one.

**`processMessage` does not receive `workflowId` from the client.** Navigator resolves it each turn via [Workflow resolution rules](#workflow-resolution-rules).

**Future:** “Delete these 5 instances” → five workflow rows (may relax one-open-per-type rule for bulk).

---

## Code change map (no implementation)

### New modules

```text
application/atlas/functions/classes/
  Actions.js                    # Phase 1 — workflow CRUD (Post.js style)

application/atlas/functions/classes/
  AtlasExecution.js             # Phase 2 — execution rows (existing file, extend)

application/atlas/state/
  ActionState.js                # Phase 1: deprecate → delegate to Actions, then remove
```

Prefer **`Actions` class** over a separate repository folder — matches your API conventions.

### Files that change

| File | Phase | Change |
|------|-------|--------|
| **`Actions.js`** (new) | 1 | All workflow DB access |
| `state/ActionState.js` | 1 | Thin shim calling `Actions` during migration, then remove |
| `cloudPilotMessageFunctions.js` | 1 | Add **`resolveWorkflow()`**; then CRUD via `Actions`; async DB |
| `logic/messages.js` | 1 | Pass `conversation_id`; optional embed open actions in response |
| `chat/CloudPilotChat.js` | 1+ | “What am I waiting on?” → `getMissingActionInfo` |
| `AtlasExecution.js` | 2 | Create/update `cloudpilot_executions`; link `workflow_id` |
| `ec2/*Handler.js` | 2 | Optional `operation_id` in Atlas body |

### Files mostly unchanged

| File | Why |
|------|-----|
| `actionRegistry.js` | Still defines action types, required fields, labels |
| `functions.js` | Field extractors unchanged |

### Environment

| Variable | Purpose |
|----------|---------|
| `CLOUDPILOT_STATE_BACKEND` | `memory` \| `mysql` — memory for e2e scripts; mysql in prod |

---

## Phase 1 — decisions (locked for planning)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Delete row on complete? | **No** — `finishAction`, `is_open = 0`, keep row |
| 2 | Open vs closed queries | **`is_open` column** — not `status NOT IN (...)` |
| 3 | One open per action_type? | **Yes (MVP)** — relax later for bulk |
| 4 | Workflow resolution | **Rules 1–6** documented above — implement before migration |
| 5 | `processMessage` input | **`conversationId` + message only** — resolve `workflowId` in Navigator |
| 6 | `conversation_id` in prod | **Numeric only** — memory backend for e2e |
| 7 | DB failure | **Fail the message** |
| 8 | AWS smoke test before Phase 1? | **Recommended** |

---

## Phased rollout

### Phase 1 — Workflows + `Actions` class

1. Migration: `cloudpilot_workflows` (schema with `is_open`)
2. Document + implement **`resolveWorkflow()`** (Rules 1–6)
3. Implement `Actions.js` (CRUD only)
4. Replace `ActionState` Map with `Actions` (shim then remove)
5. Optional: “what am I waiting on?” via `getMissingActionInfo`
6. Manual test: resolution rules, mid-flow restart, `is_open` flips on finish

**Exit criteria:**

- Open actions survive Node restart
- `getAllOpenActions` returns correct rows
- Completing an action sets `completed` + `completed_at` (row not deleted)
- Existing single-action chat flows still work

### Phase 2 — Executions

1. Migration: `cloudpilot_executions` with `workflow_id`
2. `AtlasExecution` writes execution rows; `operation_id`
3. `finishAction` on workflow after execution completes

**Exit criteria:** Every automatic mutation has an execution row linked to `workflow_id`.

### Phase 3 — Hardening

- TTL: stale `pending`/`ready` → `cancelled`
- Bulk actions (“delete 5 instances” → 5 workflow rows)
- Kite UI for open actions list
- `GET /cloudpilot/conversations/:id/actions/open`

---

## Will the app still work as before?

**For today's single-action chat flows: yes**, if migration keeps the same user-visible steps (intent → fields → `4` → `yes`).

**What improves:**

- Survives Node restart
- Multiple open actions (new capability)
- Workflow history kept

**What gets harder (intentionally):**

- **Workflow resolution** each turn (Rules 1–6) — the real engineering work
- Slightly more DB work per message
- E2e scripts need memory backend or real `conversation_id`

**What does NOT change for the user:**

- They never type a workflow ID
- Same chat messages as today (`region: "us-west-2"`, `4`, `yes`)

**What does not change in Phase 1:**

- Messages table
- Atlas handlers
- Action registry
- Create / delete / toggle AWS behavior

---

## Data flow (create example, multi-row model)

```text
1. User: "create ec2 instance"
   → resolveWorkflow → createAction
   → row id=17, is_open=1, status=pending

2. User: region: "us-west-2"  (user does not know id=17)
   → resolveWorkflow → single open row missing region → workflowId=17
   → updateAction(17, { collected, missing })

3. User: "4"
   → resolveWorkflow → ready workflow #17 → updateAction(17, { execution_mode, status: ready })

4. User: "yes"
   → resolveWorkflow → finish/execute workflow #17
   → [Phase 2] execution row
   → finishAction(17, 'completed')   # is_open=0, row kept
```

User then starts delete without losing create history:

```text
5. User: "delete ec2 instance"
   → Actions.createAction(123, 'delete_ec2', [region, instance_id])
   → row id=11, status=pending  (row id=10 still completed in DB)
```

---

## Testing plan

| Test | Expect |
|------|--------|
| Mid-flow API restart | Open workflow row preserved |
| Two open actions same conversation | Two rows; `getAllOpenActions` returns both |
| Complete action | `status=completed`, row exists, `completed_at` set |
| `getMissingActionInfo` | Lists each open action + missing fields |
| Single-action create flow (regression) | Still works end-to-end |

---

## Suggested order

```text
Light AWS smoke test (create, delete, toggle)
  → Phase 1: cloudpilot_workflows + Actions class
  → Phase 2: cloudpilot_executions
  → Multi-action orchestration + "what am I waiting on?"
  → Bulk actions / Kite open-actions UI
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-26 | Initial plan |
| 2026-05-28 | Simplified to two tables; JSON collected fields |
| 2026-05-28 | **Multi-action model:** workflow records (not conversation state); `is_open`; resolution Rules 1–6; `processMessage` starts with conversationId+message only |
