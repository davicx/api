# Undo Feature — Development Plan

**Last reviewed:** 2026-06-11

> Read [architecture.md](./architecture.md) first. Active work: [current_development.md](./current_development.md). Schema: [database/database.md](../database/database.md).

**Prerequisite:** Automatic `toggle_ec2` works E2E (Atlas Test or Live). Undo layers on top — do not block request persistence or field hardening.

---

## Goal

Give users the ability to **undo infrastructure mutations** CloudPilot performed, with a clean audit trail.

```text
cloudpilot_actions   = what actions exist (catalog)
cloudpilot_requests  = what user is asking now (workflow)
cloudpilot_history   = what CloudPilot actually did (audit + undo)
```

**Do not** overload `cloudpilot_requests` with undo state. **Do not** reuse `cloudpilot_actions` for history — that name is taken.

---

## Kite

- [ ] Show “Undo available” when latest history row has `undo_status: available`
- [ ] Undo button / chat shortcut (“undo last toggle”)
- [ ] History list — what changed, when, by whom _(later)_

### Kite integration — details

| Task | Notes |
|------|-------|
| API response hint | Optional `lastHistoryId`, `undoAvailable` on message response after mutation |
| Undo affordance | Only when `undo_status === 'available'` — hide when `completed`, `blocked`, `expired` |
| History table | Navigator table from API _(Phase 2 — P3C pattern)_ |

---

## API

- [ ] **H0** — `CREATE TABLE cloudpilot_history` (MVP schema)
- [ ] **H1** — `recordHistory()` after successful automatic toggle
- [ ] **H2** — Understanding + decision for “undo” / “undo last toggle”
- [ ] **H3** — Execute undo from `undo_payload`; link history rows
- [ ] **H4** — Expiry / blocked rules (instance terminated, drift)
- [ ] **H5** — Response includes undo hint for Kite

### Three-table model — details

| Table | Job |
|-------|-----|
| `cloudpilot_actions` | Static registry — `toggle_ec2`, `scan_ec2`, … |
| `cloudpilot_requests` | Open workflow — collect fields, confirm, cancel |
| `cloudpilot_history` | Immutable audit — before/after snapshots, undo payload |

**Also exists:** `cloudpilot_executions` — technical run log (retries, timing, `result_json`). Keep both:

| Table | Job |
|-------|-----|
| `cloudpilot_executions` | Run attempt on a request |
| `cloudpilot_history` | Product/audit log + undo |

On successful automatic mutation: write execution row (if wired) **and** history row. Optional FK: `history.execution_id` or store in JSON metadata for MVP.

### Pipeline hook — details

History is **post-execution**, not part of the request workflow.

```text
STEP 6 Execute (toggle automatic succeeds)
  ↓ recordHistory(executionResult)
       → capture resource states (Atlas response + describe if needed)
       → INSERT cloudpilot_history
       → undo_available = true, undo_status = available

STEP 7 Respond
       → optional: undoAvailable in response payload
```

Undo execution path (separate from normal request flow):

```text
User: "undo" / "undo last toggle"
  ↓ STEP 3: action undo_toggle_ec2 OR conversation undo_last
  ↓ STEP 4: immediate-style decision (no field collection)
  ↓ STEP 6: read undo_payload from history row → Atlas restore
  ↓ recordHistory: new row with reverts_history_id = original
  ↓ update original: undo_status = completed, reverted_by_history_id set
```

### MVP schema — details

**MySQL** — use `JSON` columns (not Postgres `JSONB`). Align `organization` with requests (`VARCHAR`, not `organization_id` until orgs table exists).

```sql
CREATE TABLE cloudpilot_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    organization VARCHAR(255) NOT NULL DEFAULT 'Cloud Pilot',
    conversation_id BIGINT NOT NULL,
    request_id BIGINT UNSIGNED NULL,

    action_id BIGINT UNSIGNED NULL,
    action_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NULL,

    status VARCHAR(50) NOT NULL,
    outcome_code VARCHAR(100) NULL,

    execution_mode VARCHAR(50) NULL,
    executed_by_user VARCHAR(255) NULL,

    target_type VARCHAR(100) NULL,
    target_id VARCHAR(255) NULL,
    target_region VARCHAR(50) NULL,

    resource_state_before JSON NULL,
    resource_state_after JSON NULL,

    undo_available TINYINT(1) NOT NULL DEFAULT 0,
    undo_status VARCHAR(50) NULL,

    undo_payload JSON NULL,

    reverts_history_id BIGINT UNSIGNED NULL,
    reverted_by_history_id BIGINT UNSIGNED NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    undone_at DATETIME NULL,

    INDEX idx_history_conversation (conversation_id, created_at),
    INDEX idx_history_undo (undo_status, undo_available),
    INDEX idx_history_request (request_id),
    CONSTRAINT fk_history_action
        FOREIGN KEY (action_id) REFERENCES cloudpilot_actions(id),
    CONSTRAINT fk_history_request
        FOREIGN KEY (request_id) REFERENCES cloudpilot_requests(id)
);
```

**Expand later (Phase 2):** `organization_id` FK, indexes for cross-conversation audit, partial unique on undo per history row.

### Undo status vocabulary

| Value | Meaning |
|-------|---------|
| `not_available` | Action type never supported undo (scan, inventory, modes 1–3) |
| `available` | User can undo now |
| `running` | Undo Atlas call in flight |
| `completed` | Undo succeeded; original marked reverted |
| `failed` | Undo attempted and failed |
| `expired` | TTL / policy window passed |
| `blocked` | Instance gone, permissions, or state drift detected |

**Rule:** only `available` accepts a new undo request.

### Audit chain — details

Use **`reverts_history_id`** on the undo row (not `request_reverted`).

```text
History 10: toggle_ec2 (undo_status: available → completed after undo)
History 11: undo_toggle_ec2, reverts_history_id = 10
History 10: reverted_by_history_id = 11, undone_at set
```

Bidirectional link gives full chain: what changed → what reverted it.

### Toggle example row — details

**Relational metadata + JSON for action-specific data** — do not add columns per action type.

```json
{
  "action_name": "toggle_ec2",
  "target_type": "ec2_pair",
  "target_region": "us-west-2",

  "resource_state_before": {
    "primary_instance_id": "i-primary",
    "primary_state": "running",
    "secondary_instance_id": "i-secondary",
    "secondary_state": "stopped"
  },

  "resource_state_after": {
    "primary_instance_id": "i-primary",
    "primary_state": "stopped",
    "secondary_instance_id": "i-secondary",
    "secondary_state": "running"
  },

  "undo_available": true,
  "undo_status": "available",

  "undo_payload": {
    "type": "toggle_ec2_restore",
    "region": "us-west-2",
    "start_instance_id": "i-primary",
    "stop_instance_id": "i-secondary"
  }
}
```

### What is undoable (MVP)

| Action | `undo_available` | Notes |
|--------|------------------|-------|
| `toggle_ec2` (automatic) | ✅ | Symmetric restore via swapped start/stop |
| `scan_ec2`, `inventory_aws` | ❌ | Read-only |
| Modes 1–3 (instructions/cli/pr) | ❌ | User executed manually |
| `create_ec2` | ❌ _(Phase 2)_ | Terminate undo |
| `delete_ec2` | ❌ / `blocked` | Often irreversible |

### Atlas data requirement — details

Today toggle success returns stopped/started IDs. For trustworthy history, capture **instance states**:

| Option | Notes |
|--------|-------|
| **Best** | Atlas toggle response includes before/after states |
| **OK for MVP** | API describe before + Atlas response after |
| **Fallback** | IDs only in `undo_payload`; validate at undo time → `blocked` on drift |

Plan for Atlas to echo states long-term.

### Code layout (target)

```text
functions/
├── history/
│   ├── recordHistory.js      ← called from executeRequest on success
│   ├── History.js            ← DB CRUD (cloudpilot_history)
│   └── undoPayloadBuilders/  ← per-action undo_payload shape
│       └── toggleEc2Undo.js
└── actions/
    └── ec2/undoToggleEC2/    ← handler reads undo_payload → Atlas
```

Optional catalog row: `undo_toggle_ec2` in `cloudpilot_actions` for registry + analytics.

### Build slices

| Slice | Build | Test |
|-------|-------|------|
| **H0** | `CREATE TABLE cloudpilot_history` | Table exists; seed doc in `database.md` |
| **H1** | `recordHistory()` after toggle automatic success | Row with `undo_payload`, `undo_status: available` |
| **H2** | Understanding + decision for undo intent | “undo last toggle” → execute path |
| **H3** | Execute undo; link rows 10 ↔ 11 | Instances revert; statuses update |
| **H4** | Blocked / expired rules | Terminated instance → `undo_status: blocked` |
| **H5** | Response hint for Kite | API exposes `undoAvailable` |

**Exit criteria (H1–H3):** User toggles primary ↔ secondary in automatic mode, says “undo”, instances return to prior state, audit shows two linked history rows.

---

## Atlas

- [ ] Toggle response includes before/after instance states _(preferred)_
- [ ] Optional dedicated `POST /ec2/toggle/undo` or reuse toggle with swapped targets
- [ ] Test mode mock includes state fields for history demos

### Atlas toggle response — details

Extend success payload so API can populate `resource_state_before` / `resource_state_after` without extra describe calls:

```json
{
  "status": "SUCCESS",
  "region": "us-west-2",
  "primary_instance_id": "i-primary",
  "secondary_instance_id": "i-secondary",
  "before": {
    "primary_state": "running",
    "secondary_state": "stopped"
  },
  "after": {
    "primary_state": "stopped",
    "secondary_state": "running"
  }
}
```

Undo execution: same toggle endpoint with `start_instance_id` / `stop_instance_id` from `undo_payload`, or explicit restore route.

---

## Long-term value

This table becomes the foundation for:

```text
Show me what changed
Undo last action
Who changed it
When was it changed
Audit reports
Rollback plans (CLI/PR modes can read undo_payload)
```

Enterprise trust feature — build after toggle is reliable, not before.

---

## Related docs

| Topic | Path |
|-------|------|
| Architecture & pipeline | [architecture.md](./architecture.md) |
| Active work | [current_development.md](./current_development.md) |
| Execution persistence | [future_development.md](./future_development.md) — Phase 2 |
| DB schema (add history section when H0 ships) | [database/database.md](../database/database.md) |
