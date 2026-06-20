# CloudPilot Change History — Development Plan

**Last reviewed:** 2026-06-16

> Read [architecture.md](./architecture.md) first. Active work: [current_development.md](./current_development.md). Schema source of truth: [sql/master_sql.sql](../sql/master_sql.sql).

**Prerequisite:** Automatic `toggle_ec2` works E2E (Atlas Test or Live).

---

## The real feature

**Undo is not the feature you're building.** You're building:

```text
CloudPilot Change History
```

Undo is just the **first thing that uses it**.

Same table later powers: undo, change history UI, audit trail, version restore, diffs.

```text
cloudpilot_actions   = what actions exist (catalog)
cloudpilot_requests  = what user is asking now (workflow)     → requests.status
cloudpilot_history   = what CloudPilot actually changed       → history.history_status
```

**Do not** overload `cloudpilot_requests`. **Do not** store `action_id` on history — literal `action_name` only.

---

## Locked decisions

| # | Decision | Answer |
|---|----------|--------|
| 1 | `conversation_id` on history | **Yes** — denormalize for fast chat-scoped queries |
| 2 | `executed_by_user` on history | **Yes** — audit who changed what without joining requests |
| 3 | `target_id` for toggle (MVP) | `primary_instance_id:secondary_instance_id` e.g. `i-123:i-456` |
| 4 | Undo row `action_name` | **`undo_toggle_ec2`** |
| 5 | Failed mutations | **Yes — always store** with `history_status = failed`, `undo_available = 0` |

### `target_id` — toggle (MVP)

Keep it stupid simple. One lab pair today — no hashing, no naming table.

```text
target_type = ec2_toggle_pair
target_id   = i-123:i-456
```

Built from collected fields:

```json
{
  "primary_instance_id": "i-123",
  "secondary_instance_id": "i-456"
}
```

**Later:** user-defined pair names (`production_pair`, `blue_green_pair`) — same column, different id format. No schema change.

---

## What goes into history?

### YES — mutating actions (when CloudPilot changes cloud resources)

```text
create_ec2
delete_ec2
toggle_ec2
resize_ec2        (future)
create_rds        (future)
delete_rds        (future)
create_s3         (future)
delete_s3         (future)
undo_toggle_ec2   (restore rows)
```

### NO — read-only (nothing changed)

```text
scan_ec2
scan_s3
inventory_aws
list_s3           (future)
show_costs        (future)
general_chat
```

No history row for read-only operations.

---

## High-level flow

### Step 1 — User performs action (`toggle ec2`)

```text
Get current state
↓
Execute change (Atlas)
↓
Get new state
↓
Save history row
↓
Return response
```

Example history row:

```json
{
  "action_name": "toggle_ec2",
  "history_status": "completed",
  "target_type": "ec2_toggle_pair",
  "target_id": "i-123:i-456",
  "resource_state_before": {
    "primary_instance_id": "i-123",
    "primary_state": "running",
    "secondary_instance_id": "i-456",
    "secondary_state": "stopped"
  },
  "resource_state_after": {
    "primary_instance_id": "i-123",
    "primary_state": "stopped",
    "secondary_instance_id": "i-456",
    "secondary_state": "running"
  },
  "undo_available": true,
  "undo_payload": {
    "type": "toggle_ec2_restore",
    "region": "us-west-2",
    "start_instance_id": "i-123",
    "stop_instance_id": "i-456"
  }
}
```

On failure — still insert:

```json
{
  "action_name": "toggle_ec2",
  "history_status": "failed",
  "undo_available": false
}
```

---

### Step 2 — User says `undo` _(later — after Step 1 milestone)_

```text
Find latest undoable history row
↓
Use undo_payload
↓
Execute undo (Atlas)
↓
Create NEW history row
↓
Update original row
```

New row:

```json
{
  "action_name": "undo_toggle_ec2",
  "restores_history_id": 15,
  "history_status": "completed"
}
```

Update original (row 15):

```text
restored_by_history_id = 16
undo_available = false
history_status = reverted
```

---

## CURRENT TO DO — coding order

**First milestone:** every CloudPilot **change** creates a history record. **Stop there.** No undo yet.

```text
TODAY (Step 1 only)
===================
1. Run master_sql (table exists)
2. Create saveHistory() / recordHistory()
3. Wire toggle_ec2 automatic success → saveHistory()
4. Verify row in DB
STOP
```

### Coding task 1 — Save history row _(START HERE)_

**Not** undo. **Not** restore. **Just** insert after successful toggle.

Current flow:

```text
toggle_ec2 → success → return response
```

Add:

```text
toggle_ec2 → success → insert history row → return response
```

**Wire point:** after STEP 6 execute success in `executeRequest.js` / `toggleEC2Handler` — call `HistoryFunctions.saveHistory(...)`.

**Log:** `STEP 6B: HISTORY SAVED` + row id.

**Verify:**

```bash
# chat: toggle ec2 (automatic, full flow)
```

```sql
SELECT id, action_name, history_status, target_type, target_id,
       undo_available, resource_state_before, resource_state_after
FROM cloudpilot_history;
```

Expected:

```text
id = 1
action_name = toggle_ec2
history_status = completed
target_type = ec2_toggle_pair
target_id = i-123:i-456
undo_available = 1
```

JSON before/after populated.

**Exit criteria:** First milestone done when this SELECT looks right after every successful automatic toggle.

---

### Coding task 2 — Lookup only _(after task 1 green)_

Create:

```javascript
HistoryFunctions.getLatestUndoable({ conversationId })
```

```sql
SELECT *
FROM cloudpilot_history
WHERE conversation_id = ?
  AND undo_available = 1
  AND history_status = 'completed'
ORDER BY created_at DESC
LIMIT 1;
```

**Log only.** Print result. **Do not undo.** **Do not call Atlas.**

---

### Coding task 3 — Dry-run undo _(after task 2)_

User says `undo`:

```text
undo
↓
load latest undoable row (task 2)
↓
log undo_payload
```

Still **no AWS changes**.

---

### Coding task 4 — Full undo vertical slice _(after task 3)_

```text
undo
↓
load history row
↓
execute undo_payload (Atlas)
↓
save undo history row (action_name = undo_toggle_ec2)
↓
update original row (reverted, undo_available = false)
```

**Exit criteria:** Toggle → history row → undo → two linked rows + instances reverted.

---

## Kite _(after API tasks)_

- [ ] Show “Undo available” when `undo_available = true` on latest row
- [ ] Undo button / “undo last toggle”
- [ ] Change history list _(later)_

---

## API checklist (full feature)

- [x] **H0** — `cloudpilot_history` in `master_sql.sql`
- [x] **H1** — `saveHistory()` wired to toggle automatic success → row in DB
- [x] **H2** — `getLatestUndoable()` log only (`STEP 6C` after save)
- [ ] **H3** — Undo intent → log `undo_payload` only
- [ ] **H4** — Execute undo + link rows
- [ ] **H5** — Failed toggle → history row with `history_status = failed`
- [ ] **H6** — API / Kite `undoAvailable` hint

---

## Canonical schema

**Source of truth:** [sql/master_sql.sql](../sql/master_sql.sql)

| Column | Purpose |
|--------|---------|
| `id` | Primary key — history id in API |
| `organization` | Tenant / site |
| `conversation_id` | Chat thread — denormalized from request |
| `request_id` | FK → `cloudpilot_requests.id` (nullable) |
| `executed_by_user` | Who ran this change |
| `action_name` | Literal — `toggle_ec2`, `undo_toggle_ec2`, … **No `action_id`.** |
| `history_status` | `completed` \| `failed` \| `reverted` — **not** `requests.status` |
| `target_type` | e.g. `ec2_toggle_pair` |
| `target_id` | e.g. `i-123:i-456` |
| `target_region` | AWS region |
| `resource_state_before` | JSON before change |
| `resource_state_after` | JSON after change |
| `undo_payload` | Restore recipe |
| `undo_available` | `1` = can undo this row now |
| `restores_history_id` | This row restored that id (backward) |
| `restored_by_history_id` | This row was restored by that id (forward) |
| `created_at` | Row created |
| `updated_at` | Row updated (undo closes out original) |

```sql
CREATE TABLE IF NOT EXISTS cloudpilot_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    organization VARCHAR(255) NOT NULL DEFAULT 'Cloud Pilot',
    conversation_id BIGINT NOT NULL,
    request_id BIGINT UNSIGNED NULL,

    executed_by_user VARCHAR(255) NOT NULL,

    action_name VARCHAR(100) NOT NULL,
    history_status VARCHAR(50) NOT NULL,

    target_type VARCHAR(100) NULL,
    target_id VARCHAR(255) NULL,
    target_region VARCHAR(50) NULL,

    resource_state_before JSON NULL,
    resource_state_after JSON NULL,

    undo_payload JSON NULL,
    undo_available TINYINT(1) NOT NULL DEFAULT 0,

    restores_history_id BIGINT UNSIGNED NULL,
    restored_by_history_id BIGINT UNSIGNED NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_history_conversation (conversation_id, created_at),
    INDEX idx_history_target (target_type, target_id, created_at),
    INDEX idx_history_request (request_id),
    INDEX idx_history_undo (undo_available, history_status),

    CONSTRAINT fk_history_request
        FOREIGN KEY (request_id)
        REFERENCES cloudpilot_requests(id)
);
```

### `history_status`

| Value | Meaning |
|-------|---------|
| `completed` | Change applied successfully |
| `failed` | Change or restore attempt failed — **row still stored** |
| `reverted` | Original change undone |

**Undo eligibility:** `undo_available = 1` AND `history_status = 'completed'`.

### Restore chain

```text
History 15: toggle_ec2, undo_available = 1, history_status = completed

History 16: undo_toggle_ec2, restores_history_id = 15

History 15 (updated):
  restored_by_history_id = 16
  undo_available = 0
  history_status = reverted
```

---

## Pipeline placement

History is **post-execution** — not STEP 5 request apply.

```text
STEP 6 Execute (success or failure)
  ↓ saveHistory()                    ← H1 milestone
       → INSERT cloudpilot_history
       → completed or failed

STEP 6B (log)
  console.log("STEP 6B: HISTORY SAVED:", historyId);
```

Undo path (tasks 3–4) adds understanding + second execute — still post-STEP 6 pattern.

---

## History Builders vs Undo Registry

**Two separate responsibilities — do not mix them.**

### History Builders = save information

Per **mutating action**, a small builder produces the full history object for insert. These are **not** “undo builders” — they answer: what changed, before, after, and (if possible) how to undo.

```text
executeRequest → Atlas succeeds → saveHistory() → historyBuilder.build() → insertHistoryRow()
```

Example:

```javascript
toggleEc2HistoryBuilder.build(executionResult, context)
```

Returns:

```javascript
{
  target_type,
  target_id,
  resource_state_before,
  resource_state_after,
  undo_payload,
  undo_available
}
```

`saveHistory()` dispatches by `action_name`:

```text
toggle_ec2        → toggleEc2History.js
create_ec2        → createEc2History.js   (later)
delete_ec2        → deleteEc2History.js   (later)
s3_policy_change  → s3PolicyHistory.js    (later)
scan_ec2          → skip (read-only)
```

Each builder knows:

```text
What changed?
What was before?
What is after?
How do I undo it? (undo_payload + undo_available)
```

### Undo Registry = execute information _(tasks 3–4 — not Step 1)_

One shared restore path reads `undo_payload.type` and dispatches:

```text
undo → getLatestUndoable() → executeUndoPayload(payload)
```

Registry example:

```javascript
{
  toggle_ec2_restore: restoreToggleEC2,
  recreate_ec2: recreateEC2,
  restore_s3_policy: restoreS3Policy
}
```

| Layer | Job |
|-------|-----|
| **History Builders** | Build row → INSERT |
| **Undo Registry** | Read payload → RUN Atlas/handler |

Step 1 only needs **History Builders** (toggle only). Undo Registry comes with task 4.

---

## Code layout (target)

```text
functions/
├── classes/
│   └── History.js             ← DB CRUD (insertHistoryRow, getLatestUndoableRow)
├── history/
│   ├── historyFunctions.js    ← saveHistory, getLatestUndoable (orchestration)
│   ├── historyBuilders/       ← save information (NOT undo-only)
│   │   ├── toggleEc2History.js    ← H1
│   │   ├── createEc2History.js    (later)
│   │   ├── deleteEc2History.js    (later)
│   │   └── s3PolicyHistory.js     (later)
│   └── undoRegistry.js            ← execute information (H4 — payload.type → handler)
```

**Step 1 ships:** `classes/History.js`, `history/historyFunctions.js`, `historyBuilders/toggleEc2History.js` only.

---

## Atlas

- [ ] Toggle response includes before/after states _(preferred for saveHistory)_
- [ ] Reuse toggle with swapped targets from `undo_payload` _(task 4)_
- [ ] Test mock includes state fields

```json
{
  "status": "SUCCESS",
  "before": { "primary_state": "running", "secondary_state": "stopped" },
  "after": { "primary_state": "stopped", "secondary_state": "running" }
}
```

---

## Long-term (same table, no redesign)

```text
Undo last action
Show change history
Audit trail
Version history / restore previous state
Diff between versions
```

---

## Related docs

| Topic | Path |
|-------|------|
| Architecture & pipeline | [architecture.md](./architecture.md) |
| Active work | [current_development.md](./current_development.md) |
| Master SQL | [master_sql.sql](../sql/master_sql.sql) |
| Field reference | [database/database.md](../database/database.md) |
