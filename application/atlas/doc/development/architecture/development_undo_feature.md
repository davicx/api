# CloudPilot Change History — Development Plan

**Last reviewed:** 2026-06-06

> Read [architecture.md](./architecture.md) first. **Active checklist:** [../history.md](../history.md). Schema: [sql/master_sql.sql](../../sql/master_sql.sql).

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
| 4 | Undo row `action_name` | **`undo_toggle_ec2`** (pattern: `undo_<original_action>`) |
| 5 | Failed mutations | **Yes — always store** with `history_status = failed`, `undo_available = 0` |
| 6 | Undo `create_ec2` | **Delete** the instance that was created (`undo_payload` → Atlas `/ec2/delete`) |
| 7 | Undo `delete_ec2` | **Recreate** — not “undo delete.” AWS terminate is irreversible; spawn a **new** instance from pre-delete snapshot |
| 8 | Delete “undo” UX copy | Say **recreate** / **replace instance** — never imply the same `instance_id` comes back |

### Undo semantics — create & delete _(planned, post-toggle MVP)_

Toggle undo is shipped (H4). Create and delete use the same pipeline (`saveHistory` → `undo_payload` → `undoRegistry`) but different recipes.

#### `create_ec2` — undo = delete what we created

Straightforward mirror of toggle:

```text
User creates i-new123
↓
history row: resource_state_after includes instance_id
↓
undo_payload: delete that instance (region + instance_id)
↓
undo row action_name: undo_create_ec2
```

#### `delete_ec2` — undo = recreate a replacement (NOT restore)

**Do not** try to “undo delete” or resurrect the terminated instance. Terminated EC2 is gone.

Instead, at **delete time**, capture what the instance **had before** termination — at minimum:

```text
region
name
instance_type
tags
```

Store that in `resource_state_before` on the `delete_ec2` history row. The `undo_payload` is a **create recipe**, not a restore:

```json
{
  "type": "recreate_ec2",
  "region": "us-west-2",
  "name": "my-app-server",
  "instance_type": "t3.micro",
  "tags": { "Environment": "lab", "Owner": "davey" }
}
```

When the user says `undo` on that row:

```text
Load undo_payload (recreate_ec2)
↓
Atlas POST /ec2/create with stored fields
↓
New instance_id (different from the deleted one)
↓
undo row action_name: undo_delete_ec2
↓
Mark original delete row reverted
```

**User-facing message must be honest:** e.g. “Created a replacement instance `i-0new…` with the same name, type, and tags as the one you deleted. This is a new resource, not the original.”

**Atlas dependency:** delete flow must return (or preflight must fetch) enough metadata to fill `resource_state_before` — tags, instance type, name, region. If Atlas cannot supply a field, omit from recreate or set `undo_available = 0`.

**Out of scope for v1 recreate:** same subnet, security groups, AMI, elastic IP, volumes — add later if Atlas exposes them.

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
undo_create_ec2   (delete created instance)
undo_delete_ec2   (recreate replacement — not restore)
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

### Step 2 — User says `undo`

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

### LATER — change history table

Moved to **[../history.md](../history.md)** Phase 2 (H9–H14): `list_history`, `list_recent_requests`, Method A4, chat + optional Navigator table.

---

## API checklist (full feature)

**Active checklist:** [../history.md](../history.md). Shipped items below; open items moved to `history.md`.

- [x] **H0** — `cloudpilot_history` in `master_sql.sql`
- [x] **H1** — `saveHistory()` wired to toggle automatic success → row in DB
- [x] **H2** — `getLatestUndoable()` log only (`STEP 6C` after save)
- [x] **H3** — Undo intent → log `undo_payload` only _(superseded by H4 — dry run removed)_
- [x] **H4** — Execute undo + link rows (`undoRegistry`, `undoFunctions`, STEP 6)
- [ ] **H5** — Failed toggle → history row with `history_status = failed` → see [history.md](../history.md)
- [ ] **H6** — API / Kite `undoAvailable` hint → see [history.md](../history.md)
- [ ] **H7** — `create_ec2` history + undo → see [history.md](../history.md)
- [ ] **H8** — `delete_ec2` history + recreate undo → see [history.md](../history.md)

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
| `action_name` | Literal — `toggle_ec2`, `undo_toggle_ec2`, … **No `action_id`.** Routing + builders. |
| `action_display_name` | Frozen UI label — e.g. `Toggle EC2 for Kite` |
| `action_record_key` | Computer key — `toggle_ec2_may_2_2026_2:00_pm` (no seconds) |
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
    action_display_name VARCHAR(255) NULL,
    action_record_key VARCHAR(255) NULL,
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
  toggle_ec2_restore: restoreToggleEC2,   // true restore (swap toggle)
  delete_ec2_undo: deleteCreatedEc2,      // undo create → delete instance
  recreate_ec2: recreateDeletedEc2        // undo delete → create replacement (new instance_id)
}
```

| Payload type | Original action | What runs | Same resource? |
|--------------|-----------------|-----------|----------------|
| `toggle_ec2_restore` | `toggle_ec2` | Atlas `/ec2/toggle` (swapped targets) | Yes — same pair |
| `delete_ec2_undo` | `create_ec2` | Atlas `/ec2/delete` | Yes — deletes created id |
| `recreate_ec2` | `delete_ec2` | Atlas `/ec2/create` from snapshot | **No** — new instance |

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

**Step 1 ships:** `classes/History.js`, `history/historyFunctions.js`, `historyBuilders/toggleEc2History.js`, `undoRegistry.js`, `history/functions/undoFunctions.js`.

---

## Atlas

- [x] Reuse toggle with swapped targets from `undo_payload` _(H4)_
- [ ] Toggle response includes before/after states _(preferred for saveHistory)_
- [ ] Delete response (or preflight) includes instance metadata for recreate: name, instance_type, tags, region
- [ ] Test mock includes state fields for toggle; recreate fields for delete

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
| Active checklist | [../history.md](../history.md) |
| Master SQL | [master_sql.sql](../../sql/master_sql.sql) |
| Field reference | [database/database.md](../database/database.md) |
