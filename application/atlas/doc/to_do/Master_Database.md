# CloudPilot / Atlas — Master Database Plan

**Purpose:** Plan moving from in-memory `state/` mocks to durable MySQL storage — what to store, which tables, and which code paths change.

**Status:** Phase 1 **in progress** — table + `Actions.js` + **write-only** DB sync done; **read** from DB (replace `ActionState`) not started.

**Last reviewed:** 2026-06-01 (Step 4g–4i todo; MVP multi-workflow policy; future UX)

**Related:** `doc/MASTER_TODO.md` (execution records vs chat workflow), `api/doc/database/shareshare_may_2026.sql`

**Key insight:** You are not storing “conversation state.” You are storing **workflow records** — independent business objects that happen to live inside a conversation container.

---

## Executive summary

There are **two concepts** in CloudPilot persistence:

1. **Open actions (workflows)** — “I'm toggling EC2 and still need confirmation” + “I'm also deleting another instance and need instance_id”
2. **Execution history** — “I ran `create_ec2` at 2:15 PM and it succeeded”

**Phase 1 (MVP):** At most **one open workflow** per `conversation_id` (`is_open = 1`). Matches today’s `ActionState` (one slot per conversation). Simplifies resolution when users reply `yes`, `4`, or `region: "us-west-2"`.

**Future:** Multiple concurrent open workflows per conversation (toggle + delete at once). Schema keeps **many historical rows** per conversation; only the open-count rule changes.

```text
Conversation 123 (Phase 1)
└── Workflow #17  create_ec2  (is_open = 1, status = ready)

Conversation 123 (history — is_open = 0)
├── Workflow #12  scan_ec2     (completed)
└── Workflow #9   delete_ec2   (failed)
```

| Today | Target |
|-------|--------|
| Chat **messages** already persist in MySQL | Keep as-is |
| Workflow in **Node memory** (`ActionState.js` `Map`, one slot per conversation) | **Phase 1:** `cloudpilot_workflows` — **one open row per conversation**; many closed rows over time |
| No durable audit trail for AWS runs | **Phase 2:** `cloudpilot_executions` (1 workflow → many executions) |
| `atlas_actions` unused in JS | Leave deprecated — use new tables |

**Code style:** New **`Actions` class** (like `Post.js`) with static methods — not a thin wrapper around today's `ActionState` Map forever.

**Two tables total:**

- **Phase 1:** `cloudpilot_workflows`
- **Phase 2:** `cloudpilot_executions`

---

## Start here — simple 3 steps (then add workflows)

Use this section first. The rest of the doc is reference.

Think of it like three big steps, then smaller “add workflow to DB” steps inside step 3.

### Step 1 — Create the database table

**Goal:** MySQL has a place to store workflows.

1. Open `doc/sql/cloudpilot_workflows_phase1.sql`
2. Run section **A** (`CREATE TABLE`) if the table does not exist yet
3. If you already have `organization_id` (number), run section **B2** (drop `organization_id`, add `organization` string, default `'Cloud Pilot'`)
4. Check: `SHOW CREATE TABLE cloudpilot_workflows;`

**Column to care about first:** `organization` (text, default `Cloud Pilot`), `conversation_id`, `action_type`, `status`, `is_open`, `collected`, `missing`.

You do **not** need to understand every column on day one.

---

### Step 2 — Create `Actions.js` (the class)

**Goal:** One place that talks to `cloudpilot_workflows`, like `Post.js` talks to `posts`.

**File:** `application/atlas/functions/classes/Actions.js`

**Must have (minimum):**

| Method | What it does |
|--------|----------------|
| `createAction` | INSERT a new row when user starts an action |
| `updateAction` | UPDATE row as fields / status change |
| `finishAction` | Close row: `is_open = 0`, `completed_at`, `outcome_code` |
| `getOpenActionForConversation` | SELECT the one open row (Phase 1) |

**Done in repo:** Full class with reads, updates, cancel, list by user/org/conversation.

**You do not need** `logic/actions.js` or `actionFunctions.js` for this plan.

---

### Step 3 — Test with one real action

**Goal:** Prove one chat flow creates and finishes a row in MySQL.

**Good first test:** `scan_ec2` (informational — no 1–4 mode menu).

1. Start API + MySQL
2. Send a message that starts scan (e.g. mentions scan + ec2)
3. Look at the row: `action_type = scan_ec2`, `missing` has `region`, `is_open = 1`
4. Send `region: "us-west-2"` (or your format)
5. Send `yes` to run
6. Check logs for `DATABASE WORKFLOW ROW (after user confirmed / run finished)`
7. Check row: `status = completed`, `outcome_code = success`, `is_open = 0`, `completed_at` set

**Destructive test later:** `create_ec2` / `toggle_ec2` / `delete_ec2` (mode `4` then `yes`).

Chat can still use **memory** (`ActionState`) for decisions — that is OK for this step.

---

### Step 4 — Add workflows to the database (slow migration)

**Goal:** Keep the app working exactly as today, but **also** read/write MySQL. Do **not** switch the brain to DB in one day.

**Rule:** Memory leads. Database follows. Do **not** read from DB for orchestration until the end of this list.

| # | What | Where | Status |
|---|------|--------|--------|
| 4a | **Create** row when new action starts | `cloudPilotMessageFunctions.js` STEP 4 → `Actions.createAction` | **Done** |
| 4b | Pass **user** + **org** from post | `messages.js` → `processMessage(..., { masterSite, requestedByUserName })` → column `organization` | **Done** |
| 4c | **Update** row when fields collected | After STEP 5 → `syncOpenWorkflowRowFromMemory` | **Done** |
| 4d | **Update** when status `ready` | After STEP 6A | **Done** |
| 4e | **Update** when execution mode `1`–`4` | After STEP 6F | **Done** |
| 4f | **Update** `running` + **finish** on execute | `AtlasExecution.js` → `finishAction` + console log final row | **Done** |
| 4g | **Read** open workflow from DB instead of `ActionState` | `processMessage` / resolver | **Not started** |
| 4h | **Update** via `Actions.setField` directly (optional cleanup) | Replace sync-from-memory helper | **Not started** |
| 4i | Remove **`ActionState`** Map | After 4g works | **Not started** |
| 4j | `inventory_aws` immediate path | Decide if row needed | **Not started** |

After **4g–4i**, a Node restart mid-conversation can resume from DB (exit criteria for Phase 1).

#### Step 4g–4i — finish migration (todo)

**Difficulty:** **Medium** (not huge) for Phase 1 — one open row per `conversation_id`. Hardest work later is **multiple open workflows** + Rules 1–6 (explicitly **not** MVP).

| Step | Task | Notes |
|------|------|--------|
| 1 | **Load** open row at start of `processMessage` | `Actions.getOpenActionForConversation` → map row to shape orchestration expects today |
| 2 | **Write** field/status/mode via `Actions.updateAction` / `setField` | Replace `actionState.setField` / `setStatus` / `setExecutionMode` |
| 3 | **Remove** `syncOpenWorkflowRowFromMemory` | Goes away when DB is the single source (no memory → photocopy → DB) |
| 4 | **Keep** `cloneActionStatus` (or equivalent) | **Not** for persistence — builds `processMessageOutcome.cloudPilot.actionStatus` for the API (`CloudPilotActionStatus` in `messages.js`). After migration, source object is the **DB row** (mapped), not `ActionState` |
| 5 | **Remove** `ActionState` Map (or thin shim only) | After restart-mid-flow test passes |
| 6 | **Test** API restart mid-flow | e.g. `scan_ec2` with region collected — chat must resume from row |

**What `syncOpenWorkflowRowFromMemory` is (today):** temporary **dual-write bridge** — after memory updates, copy the same data to the open MySQL row. Confusing because you update twice; intentional only while memory leads.

**What stays after migration:**

| Piece | Fate |
|-------|------|
| `Actions.createAction` / `updateAction` / `finishAction` | Stay |
| `syncOpenWorkflowRowFromMemory` | Remove |
| `ActionState` | Remove (or shim) |
| `cloneActionStatus` | Stay — HTTP response packaging for Kite/client |

```text
TODAY (dual-write)
  memory ──► decisions
  memory ──► sync ──► DB

TARGET (single source)
  DB ──► decisions
  DB ──► update row
  DB row ──► cloneActionStatus ──► API response
```

---

### MVP — multiple workflows (policy)

**For MVP, do not build multi-workflow resolution or disambiguation.** Treat Phase 1 as “one active workflow per conversation” in product behavior even though the schema can hold many **closed** rows over time.

| Rule | MVP behavior |
|------|----------------|
| **Create** | Only **one** open workflow at a time — `Actions.createAction` should not leave two `is_open = 1` rows for the same `conversation_id` (reject, replace, or finish previous — pick one policy in code) |
| **If multiple open rows exist** (bug, manual SQL, future leak) | **Ignore extras** — always use the **current** open workflow (`getOpenActionForConversation`; document `ORDER BY` if more than one row slips through) |
| **User says `yes` / `4` / `region: …`** | Binds to that single open row — no “which action?” prompt |
| **Rules 1–6** | **Deferred** — see [Workflow resolution rules](#workflow-resolution-rules) |

This matches today’s `ActionState` (one slot per conversation) and keeps `processMessage` simple until Kite + naming exist.

---

### Future — multiple open workflows (UX)

When the product allows **several open workflows** in one conversation (toggle + delete at once, etc.):

| Situation | UX |
|-----------|-----|
| **Exactly one** open workflow | Same as MVP: `yes`, execution mode `1`–`4`, and field replies apply to that row |
| **Multiple** open workflows | User must pick **which** workflow to run or update |

**Planned UX (two paths — can combine later):**

1. **Open workflows table (Kite)** — user sees a table of open rows: friendly name (`action_name`), `action_type`, status, missing fields, optional notes. Each row has a **Run** (or **Continue**) control that targets that `workflowId`.
2. **Named confirmation in chat** — instead of bare `yes`, user confirms with a label, e.g. `yes run my_cool_toggle` where `my_cool_toggle` maps to `action_name` (or a slug) on the workflow row. Navigator resolves name → `workflowId` before execute.

**Chat disambiguation** (Rule 2) still applies when a field reply could match multiple open rows (e.g. two actions both missing `region`) — ask which action to update unless the user used a name or the UI sent `workflowId`.

**Schema already supports labels:** `action_name` on `cloudpilot_workflows` (e.g. `Development Server`, `Nightly Cost Savings`). Populate when creating a workflow so table + named confirm have something to show.

**Not in MVP:** `resolveWorkflow()` Rules 1–6, bulk intents, multiple `is_open = 1` by design.

---

## What remains (my understanding)

```text
TODAY (working)
  User message
    → ActionState (memory) decides everything
    → Actions (MySQL) copies create / updates / finish

NEXT (when you continue)
  User message
    → Actions.getOpenActionForConversation (MySQL)  ← brain
    → ActionState removed or thin shim only
    → Same user experience (region, 4, yes)
```

**Still on memory only (important):**

- Which workflow is active (Phase 1: one per conversation — easy lookup once you read DB)
- Missing fields, collected fields, ready, mode — until you load row at start of `processMessage`
- `actionState.clear` after success — DB row is already finished; memory clear can go away later

**Do not do yet (MVP):**

- `resolveWorkflow()` Rules 1–6 for **multiple** open actions — see [MVP — multiple workflows (policy)](#mvp--multiple-workflows-policy) and [Future — multiple open workflows (UX)](#future--multiple-open-workflows-ux)
- `cloudpilot_executions` table (Phase 2)
- Reading workflow from DB to drive chat — **next:** Step 4g (see [Step 4g–4i — finish migration (todo)](#step-4g4i--finish-migration-todo))

**Schema note:** Column is **`organization`** (string, default `'Cloud Pilot'`), not `organization_id`. Code uses `masterSite` from post when present.

---

## Mental model shift

| Old assumption | New direction |
|----------------|---------------|
| Storing **conversation state** | Storing **workflow records** — each row is an independent business object |
| `conversation_id` = primary key | `id` = primary key; conversation is a **container** for many workflows |
| `ActionState` = one current thing | **Workflow** = its own lifecycle row |
| `clear()` = delete row | **`finishAction`** → `is_open = 0`, `status`, `outcome_code`, `completed_at`; **keep row** |
| One pending action per chat | **Phase 1:** one open workflow per conversation; **future:** many open + bulk intents |

Table name **`cloudpilot_workflows`** fits — each row is one workflow instance.

**Phase 1 resolution** is simple: if `is_open = 1` for this `conversation_id`, that row receives the update. No disambiguation for `yes` / field replies.

**Future** (multiple open rows): see [Workflow resolution rules](#workflow-resolution-rules).

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
| _(on finish)_ | `outcome_code` — machine-readable result (not in memory today) |

**Legacy:** `conversationStateFunctions.js` — second Map; deprecate during migration.

### Pain points in-memory causes

1. **Node restart** — all open work lost
2. **Only one action per conversation in memory** — Phase 1 DB matches; parallel open workflows deferred
3. **No history** — completed work disappears on `clear()`
4. **No audit** — no record of what ran in AWS
5. **Toggle / long runs** — execution lifecycle must not live only in workflow row (Phase 2)

---

## Design principles

1. **Phase 1: one open workflow per conversation** — enforce in `Actions.createAction` (close or reject if another `is_open = 1`). **Future:** relax for multiple open rows; history always keeps many rows per conversation.

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

**Many rows per conversation over time** — Phase 1 allows only **one** `is_open = 1` row per `conversation_id`; completed/failed rows stay as history (`is_open = 0`).

---

### Workflow fields reference (README)

Use this when implementing `Actions.js`, migrations, or Kite workflow UI. Column names match the insertable SQL below.

**Naming note:** Application docs may say **`workflow_id`**. In MySQL the primary key column is **`id`** — treat `workflow_id` ≡ `id` unless you add a separate UUID column later.

#### Workflow fields

| Field | Column | Description |
|-------|--------|-------------|
| **workflow_id** | `id` | Unique workflow/action record (auto-increment PK) |
| **organization** | `organization` | Tenant / site string (default `Cloud Pilot`; often from `masterSite` on post) |
| **conversation_id** | `conversation_id` | Which chat started the workflow |
| **requested_by_user_name** | `requested_by_user_name` | Username of the user who started the workflow |
| **action_type** | `action_type` | System action CloudPilot performs |

**`action_type` examples:** `create_ec2`, `delete_ec2`, `toggle_ec2`, `scan_ec2`, `resize_ec2`

| Field | Column | Description |
|-------|--------|-------------|
| **action_name** | `action_name` | Human-friendly label for this workflow instance |
| **action_notes** | `action_notes` | Optional memo or context |

**`action_name` examples:** `Development Server`, `Nightly Cost Savings`, `Production Resize`

**`action_notes` examples:**

- Waiting for approval
- Verify region before execution
- Customer requested completion by Friday

#### Status fields

| Field | Column | Description |
|-------|--------|-------------|
| **status** | `status` | Current workflow state (default **`pending`** on insert) |
| **outcome_code** | `outcome_code` | Machine-readable result when the workflow finishes or fails (NULL while open) |
| **priority** | `priority` | Importance of the workflow |
| **is_open** | `is_open` | Whether the workflow is still active (`1` = active; `0` = completed, failed, or cancelled) |

**`status` values:**

| Value | Meaning |
|-------|---------|
| `pending` | Workflow started but missing information |
| `ready` | Everything required has been collected (fields + execution mode if required) |
| `awaiting_confirmation` | Ready but waiting for user approval (`yes` / `confirm`) |
| `running` | Currently executing (Atlas / handler in progress) |
| `completed` | Finished successfully |
| `failed` | Execution failed |
| `cancelled` | User cancelled workflow |

**Today in memory:** `ready` often covers both “fields complete” and “waiting for confirm.” When persisting, prefer splitting **`ready`** vs **`awaiting_confirmation`** for clearer UI and queries.

**`outcome_code` values** (examples — extend as handlers grow):

| Code | Typical meaning |
|------|-----------------|
| `success` | Completed successfully |
| `instance_not_found` | Target instance missing in AWS |
| `instance_terminated` | Instance already terminated |
| `invalid_instance_id` | Malformed or invalid `instance_id` |
| `same_instance` | Toggle primary/secondary are the same ID |
| `atlas_unreachable` | Atlas HTTP / network failure |
| `aws_toggle_failed` | Toggle operation failed in Atlas/AWS |
| `aws_terminate_failed` | Delete/terminate failed in Atlas/AWS |
| `cancelled_by_user` | User abandoned workflow |

**Outcome storage (Phase 1):**

- Store **`status`** + **`outcome_code`** on the workflow row.
- Do **not** add `outcome_message` — user-facing text stays in the **messages** table; workflows store machine-readable codes only.

**`priority` values:** `low`, `normal`, `high`, `critical` (default **`normal`**)

#### Execution fields

| Field | Column | Description |
|-------|--------|-------------|
| **execution_mode** | `execution_mode` | How CloudPilot performs the action (destructive tier only) |

**`execution_mode` values:**

| Value | Meaning | Example |
|-------|---------|---------|
| `instructions` | Explain step-by-step what the user should do manually | Stop the EC2 instance from the AWS Console, then restart it |
| `cli` | Generate AWS CLI commands for the user to run | `aws ec2 stop-instances --instance-ids i-123` |
| `pr` | Generate infrastructure code or a pull request | Terraform change to resize an EC2 instance |
| `automatic` | CloudPilot performs the action directly through AWS APIs | CloudPilot stops one instance and starts another automatically |

**Canonical spelling:** always use plural **`instructions`** in DB (`execution_mode`), API, registry, and handlers (mode `1` → `instructions`).

#### Workflow state fields (JSON)

| Field | Column | Description |
|-------|--------|-------------|
| **collected** | `collected` | Information CloudPilot already knows (JSON object) |
| **missing** | `missing` | Information still needed before execution (JSON array of field names) |
| **asked** | `asked` | Fields CloudPilot has already requested from the user (JSON object or array) |

**`collected` examples:**

```text
region = us-west-2
instance_id = i-123
instance_type = t3.micro
```

**`missing` examples:**

```text
region
instance_name
instance_type
```

**`asked` examples:**

```text
region
instance_name
```

#### Audit fields

| Field | Column | Description |
|-------|--------|-------------|
| **created_at** | `created_at` | When the workflow was created |
| **updated_at** | `updated_at` | Last time the workflow changed |
| **completed_at** | `completed_at` | When the workflow finished (`completed`, `failed`, or `cancelled`); `NULL` while open |

---

### Schema (insertable)

```sql
CREATE TABLE cloudpilot_workflows (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'workflow_id',

    organization VARCHAR(255) NOT NULL DEFAULT 'Cloud Pilot',

    conversation_id BIGINT NOT NULL,

    requested_by_user_name VARCHAR(255) NOT NULL,

    action_type VARCHAR(100) NOT NULL,
    action_name VARCHAR(255) NULL,
    action_notes TEXT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    outcome_code VARCHAR(100) NULL,

    priority VARCHAR(20) NOT NULL DEFAULT 'normal',

    execution_mode VARCHAR(50) NULL,

    is_open TINYINT(1) NOT NULL DEFAULT 1,

    collected JSON NULL,
    missing JSON NULL,
    asked JSON NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    completed_at DATETIME NULL,

    INDEX idx_workflows_conversation (conversation_id),
    INDEX idx_workflows_open (conversation_id, is_open),
    INDEX idx_workflows_status (status),
    INDEX idx_workflows_organization (organization)
);
```

### Example INSERT (copy/paste)

Toggle workflow mid-collection — region known, instance IDs still missing:

```sql
INSERT INTO cloudpilot_workflows (
    organization,
    conversation_id,
    requested_by_user_name,
    action_type,
    action_name,
    action_notes,
    status,
    priority,
    execution_mode,
    is_open,
    collected,
    missing,
    asked,
    created_at,
    updated_at,
    completed_at
) VALUES (
    'Cloud Pilot',
    1,
    'davey',
    'toggle_ec2',
    'Nightly Cost Savings',
    'Verify region before execution',
    'pending',
    'normal',
    NULL,
    1,
    JSON_OBJECT(
        'region', 'us-west-2'
    ),
    JSON_ARRAY(
        'primary_instance_id',
        'secondary_instance_id'
    ),
    JSON_OBJECT(
        'region', TRUE
    ),
    NOW(),
    NOW(),
    NULL
);
```

Create workflow — ready for execution mode, awaiting user choice:

```sql
INSERT INTO cloudpilot_workflows (
    organization,
    conversation_id,
    requested_by_user_name,
    action_type,
    action_name,
    action_notes,
    status,
    priority,
    execution_mode,
    is_open,
    collected,
    missing,
    asked,
    created_at,
    updated_at,
    completed_at
) VALUES (
    'Cloud Pilot',
    1,
    'davey',
    'create_ec2',
    'Development Server',
    'Customer requested completion by Friday',
    'ready',
    'high',
    NULL,
    1,
    JSON_OBJECT(
        'name', 'cloudpilot-change-instance-primary',
        'region', 'us-west-2',
        'instance_type', 't3.micro'
    ),
    JSON_ARRAY(),
    JSON_OBJECT(
        'name', TRUE,
        'region', TRUE,
        'instance_type', TRUE
    ),
    NOW(),
    NOW(),
    NULL
);
```

Completed workflow — row kept for history (`is_open = 0`):

```sql
INSERT INTO cloudpilot_workflows (
    organization,
    conversation_id,
    requested_by_user_name,
    action_type,
    action_name,
    action_notes,
    status,
    outcome_code,
    priority,
    execution_mode,
    is_open,
    collected,
    missing,
    asked,
    created_at,
    updated_at,
    completed_at
) VALUES (
    'Cloud Pilot',
    1,
    'davey',
    'delete_ec2',
    'Cleanup test instance',
    NULL,
    'completed',
    'success',
    'normal',
    'automatic',
    0,
    JSON_OBJECT(
        'region', 'us-west-2',
        'instance_id', 'i-006d78c86d01c1775'
    ),
    JSON_ARRAY(),
    JSON_OBJECT(
        'region', TRUE,
        'instance_id', TRUE
    ),
    '2026-05-30 15:00:00',
    '2026-05-30 15:05:00',
    '2026-05-30 15:05:00'
);
```

**`is_open`** — simplifies queries. Open vs history without `status NOT IN (...)` every time.

| Query | SQL |
|-------|-----|
| Open actions | `WHERE conversation_id = ? AND is_open = 1` |
| Completed history | `WHERE conversation_id = ? AND is_open = 0` |

On **`finishAction`:** set `is_open = 0`, `status = completed|failed|cancelled`, `outcome_code` (e.g. `success`, `aws_toggle_failed`), `completed_at = NOW()`.

**Phase 1 constraint:** At most **one row with `is_open = 1` per `conversation_id`**. Enforce in `Actions.createAction` (reject new action or auto-close/replace existing open row — pick one policy in code). Matches `ActionState`; avoids ambiguous `yes` / `4` replies.

Optional later: `user_id`, FK to `conversations`; multiple open rows per conversation (relax constraint).

**Runnable SQL:** `doc/sql/cloudpilot_workflows_phase1.sql` (CREATE + ALTER for existing tables).

### Example: Phase 1 — one open row per conversation

| id | conversation_id | action_type | status  | is_open | outcome_code |
| -- | --------------- | ----------- | ------- | ------- | ------------ |
| 17 | 123             | create_ec2  | ready   | 1       | NULL         |
| 12 | 123             | scan_ec2    | completed | 0     | success      |
| 9  | 123             | delete_ec2  | failed  | 0       | instance_not_found |

### Example: future — multiple open (not Phase 1)

| id | conversation_id | action_type | status  | missing        |
| -- | --------------- | ----------- | ------- | -------------- |
| 1  | 123             | toggle_ec2  | ready   | []             |
| 2  | 123             | delete_ec2  | pending | `instance_id`  |

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

See [Workflow fields reference (README)](#workflow-fields-reference-readme) for full definitions. Summary:

| Status | Meaning |
|--------|---------|
| `pending` | Action started; missing required fields |
| `ready` | All required fields collected (mode may still be needed) |
| `awaiting_confirmation` | Ready; waiting for user `yes` / `confirm` |
| `running` | AtlasExecution in progress |
| `completed` | Finished successfully — **row kept** |
| `failed` | Handler or Atlas error — **row kept** |
| `cancelled` | User abandoned or stale TTL — **row kept** |

### On completion — do NOT delete

Use **`finishAction`** → `is_open = 0`, `status = completed|failed|cancelled`, `outcome_code`, `completed_at = NOW()`.

History and “what did we do in this chat?” stay queryable.

---

## Workflow resolution rules

**Phase 1:** With at most one `is_open = 1` row per `conversation_id`, resolution is trivial — load that row (or create one on new action intent). Rules 2 and multi-match disambiguation apply in a **future** phase.

**Write these down before enabling multiple open workflows.**

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

### Constraint: Phase 1 — one open row per conversation

At most **one** row with `is_open = 1` per `conversation_id` (any `action_type`). Enforced in application code on `createAction`. Deferred: multiple open workflows per conversation.

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

→ `Actions.createAction(...)` — new row only if no other `is_open = 1` for this conversation (Phase 1).

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
| **`createAction(organization, conversationId, requestedByUserName, actionType, requiredFields)`** | INSERT new workflow row; status `pending` (default); missing = required fields |
| **`updateAction(workflowId, updates)`** | Update `collected`, `missing`, `asked`, `status`, `execution_mode` |
| **`finishAction(workflowId, status, outcomeCode)`** | `is_open = 0`, set `status`, `outcome_code`, `completed_at` |
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
| `setPendingAction(conversationId, …)` | `createAction(organization, conversationId, requestedByUserName, actionType, requiredFields)` |
| `setField(conversationId, field, value)` | `updateAction(workflowId, { collected, missing })` |
| `setStatus` / `setExecutionMode` | `updateAction(workflowId, { status, execution_mode })` |
| `clear(conversationId)` | `finishAction(workflowId, 'completed')` |
| `getActionStatus(conversationId)` | `getAllOpenActions(conversationId)` + pick focused row |
| — | `getMissingActionInfo(conversationId)` |

### Orchestration note

**Schema:** many **historical** workflows per conversation; **Phase 1:** one **open** row per conversation.

**`processMessage` does not receive `workflowId` from the client.** Phase 1: resolve to the single open row (if any). Future: [Workflow resolution rules](#workflow-resolution-rules).

**Future:** “Delete these 5 instances” → multiple open rows (relax one-open constraint).

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
| 3 | One open per conversation? | **Yes (Phase 1 MVP)** — matches `ActionState`; relax later |
| 4 | `outcome_code` on workflows? | **Yes** — machine-readable; no `outcome_message` (chat messages table for UX text) |
| 5 | Workflow resolution | **Phase 1:** single open row; **future:** Rules 1–6 for multiple open |
| 6 | `processMessage` input | **`conversationId` + message only** — resolve `workflowId` in Navigator |
| 7 | `conversation_id` in prod | **Numeric only** — memory backend for e2e |
| 8 | DB failure | **Fail the message** |
| 9 | AWS smoke test before Phase 1? | **Recommended** |

---

## Phased rollout

### Phase 1 — Workflows + `Actions` class

| Step | Task | Status |
|------|------|--------|
| 1 | Migration: `cloudpilot_workflows` (`doc/sql/cloudpilot_workflows_phase1.sql`) | **Done** (you run SQL in your env) |
| 2 | `Actions.js` (CRUD) | **Done** |
| 3 | Write-only: create / update / finish from existing memory flow | **Done** |
| 4 | Test one real action end-to-end in MySQL | **Done** (scan_ec2 or similar) |
| 5 | Read open workflow from DB; drop `ActionState` for orchestration | **Next** |
| 6 | Optional: `getMissingActionInfo` in chat | Later |
| 7 | `resolveWorkflow()` for multiple open actions | **Future** (not Phase 1 MVP) |

**Exit criteria (Phase 1 complete):**

- Open actions survive Node restart (**needs step 5**)
- Completing an action sets `completed` + `outcome_code` + `is_open = 0` (**done**)
- Existing single-action chat flows still work (**done** with dual-write)

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
   → Actions.createAction({ organization: 'Cloud Pilot', conversationId: 123, ... delete_ec2 ... })
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
DONE (your session)
  Step 1: Table cloudpilot_workflows
  Step 2: Actions.js
  Step 3: Test real action (row create → update → finish)
  Step 4a–4f: Dual-write (memory + DB)

NEXT (when you return) — see Step 4g–4i todo
  4g: Load open workflow from DB at start of processMessage
  4h: Writes via Actions only; remove syncOpenWorkflowRowFromMemory
  4i: Remove ActionState; keep cloneActionStatus for API response
  Restart API mid-flow test

LATER
  Phase 2: cloudpilot_executions
  Multiple open workflows: Kite table + Run per row OR "yes run {action_name}"
  resolveWorkflow Rules 1–6 + action_name on create
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-26 | Initial plan |
| 2026-05-28 | Simplified to two tables; JSON collected fields |
| 2026-05-28 | **Multi-action model:** workflow records (not conversation state); `is_open`; resolution Rules 1–6; `processMessage` starts with conversationId+message only |
| 2026-05-30 | **Workflow fields reference:** README tables (`action_name`, `action_notes`, `priority`, `awaiting_confirmation`, execution modes); updated `CREATE TABLE`; three example `INSERT`s |
| 2026-05-30 | **`cloudpilot_workflows` schema:** add `organization_id`, `requested_by_user_name`; `status` default `'pending'`; index `idx_workflows_organization`; INSERT examples updated |
| 2026-05-30 | **`outcome_code`** after `status`; Phase 1 **one open workflow per conversation**; no `outcome_message`; `doc/sql/cloudpilot_workflows_phase1.sql` |
| 2026-05-31 | **`organization`** VARCHAR (default `Cloud Pilot`); dual-write migration; **Start here** 3-step + Step 4 checklist; implementation status |
| 2026-06-01 | **Step 4g–4i migration todo**; `syncOpenWorkflowRowFromMemory` vs `cloneActionStatus`; **MVP multi-workflow policy** (one open, ignore extras); **future UX** (workflows table + Run, named confirm `yes run {action_name}`) |
