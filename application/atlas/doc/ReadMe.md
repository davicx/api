# CloudPilot — Actions & Input Types

Quick reference for understanding, decision, and local DB setup. Active planning docs (`.md` only) live in [`development/`](./development/) — start with [`development/architecture.md`](./development/architecture.md).

Reference for **STEP 3: MESSAGE UNDERSTANDING**. These tables describe what `understandMessage()` extracts from a user message into `messageUnderstanding` — no DB writes or execution until STEP 5 apply.

```json
{
  "action": "scan_ec2",
  "values": {},
  "reply": null,
  "conversation": null,
  "ambiguous": false,
  "candidates": [],
  "source": "rules",
  "confidence": 1
}
```

---

## Actions → `action`

| Action | Example messages |
|--------|------------------|
| `general_chat` | `hello`, `hi` |
| `inventory_aws` | `show me all my aws resources` |
| `scan_ec2` | `scan ec2` |
| `toggle_ec2` | `toggle ec2`, `switch ec2` |
| `create_ec2` | `create ec2`, `create instance` |
| `delete_ec2` | `delete ec2`, `delete instance` |

---

## Values → `values`

| Field | Example input |
|-------|----------------|
| `region` | `us-west-2`, `region: "us-west-2"`, `scan ec2 in us-west-2` |
| `instance_id` | `i-0abc123def4567890` (one bare ID) |
| `primary_instance_id` | `primary_instance_id: "i-0..."`, first of two IDs |
| `secondary_instance_id` | `secondary_instance_id: "i-0..."`, second of two IDs |
| `name` | `name it my-demo-server`, `call it my-server` |
| `instance_type` | `t3.micro`, `instance_type: "t3.micro"` |
| Any field | `field_name: "value"` (quoted structured) |

---

## Required fields per action (for `processRequest` later)

| Action | Needs |
|--------|--------|
| `scan_ec2` | `region` |
| `toggle_ec2` | `region`, `primary_instance_id`, `secondary_instance_id` |
| `create_ec2` | `name`, `region`, `instance_type` |
| `delete_ec2` | `region`, `instance_id` |
| `inventory_aws` | _(none)_ |
| `general_chat` | _(none)_ |

---

## Reply → `reply`

| Input | `reply` |
|-------|---------|
| `yes`, `confirm`, `run it`, `do it`, `proceed`, `execute` | `confirm` |
| `cancel`, `stop`, `never mind`, `abort`, … | `cancel` |
| `1` / `2` / `3` / `4` | `instructions` / `cli` / `pr` / `automatic` |

---

## Conversation → `conversation`

| Input | `conversation` |
|-------|----------------|
| `what am i waiting on`, `list open actions`, … | `list_open` |
| `what is the status`, `show status`, … | `status` |
| `switch to 2`, `focus on Toggle EC2`, … | `focus_switch` |

---

## STEP 4: Decision — `response.type`

After understanding, `decideNextStep()` returns a **decision** with `chatType` (which handler) and `response.type` (which scene inside that handler).

```json
{
  "chatType": "cloudPilotResponding",
  "request": { "action": "scan_ec2", "collected": {}, "missing": ["region"], "ready": false, "status": "waiting_on_fields", "executionMode": null },
  "response": { "type": "ask_for_missing_fields" }
}
```

### Level 1 — which handler runs?

| `chatType` | Handler | When |
|------------|---------|------|
| `generalChatResponding` | `handleGeneralChat` | Idle chit-chat — no CloudPilot workflow |
| `cloudPilotResponding` | `handleCloudPilotChat` | Request, execution, or CloudPilot-specific UX |

### Level 2 — full inventory (`response.type`)

| # | `response.type` | Handler | Meaning |
|---|-----------------|---------|---------|
| 1 | `general_chat` | `handleGeneralChat` | Normal ChatGPT reply — no request row |
| 2 | `ask_for_missing_fields` | `handleCloudPilotChat` | New or partial request — ask for missing field(s) |
| 3 | `awaiting_execution_mode` | `handleCloudPilotChat` | All fields collected — pick execution mode 1–4 |
| 4 | `awaiting_confirmation` | `handleCloudPilotChat` | Ready — need `yes` (e.g. scan_ec2, or mode 4 automatic) |
| 5 | `execution_instructions` | `handleCloudPilotChat` | Mode 1 — show step-by-step instructions (request closes) |
| 6 | `execution_cli` | `handleCloudPilotChat` | Mode 2 — show CLI commands (request closes) |
| 7 | `execution_pr` | `handleCloudPilotChat` | Mode 3 — show PR / change-set output (request closes) |
| 8 | `execution_started` | `handleCloudPilotChat` | User confirmed mode 4 — Atlas execution running |
| 9 | `immediate_execution` | `handleCloudPilotChat` | `inventory_aws` — run now, no request row |
| 10 | `workflow_running` | `handleCloudPilotChat` | Execution already in progress |
| 11 | `request_completed` | `handleCloudPilotChat` | Request finished successfully |
| 12 | `request_failed` | `handleCloudPilotChat` | Previous run failed |
| 13 | `request_cancelled` | `handleCloudPilotChat` | User cancelled open request |
| 14 | `list_open_requests` | `handleCloudPilotChat` | List open requests (no request mutation) |
| 15 | `focus_request` | `handleCloudPilotChat` | Switch focus to another request |
| 16 | `request_status` | `handleCloudPilotChat` | Status of current / named request |
| 17 | `ambiguous_action` | `handleCloudPilotChat` | Multiple actions matched — ask user to clarify |

**Rule of thumb:** `chatType: "generalChatResponding"` → type is always `general_chat`. `chatType: "cloudPilotResponding"` → type tells `handleCloudPilotChat` which branch to run.

---

## Database setup (other machine)

**Source of truth:** run [`sql/master_sql.sql`](./sql/master_sql.sql) — creates `cloudpilot_actions`, `cloudpilot_requests`, `cloudpilot_history`, and seeds actions.

```bash
mysql -u USER -p DATABASE_NAME < application/atlas/doc/sql/master_sql.sql
```

Field docs: `database/database.md`. Undo/history plan: `development/development_undo_feature.md`.

**Check:**

```sql
SELECT * FROM cloudpilot_actions;
SELECT * FROM cloudpilot_requests;
SELECT * FROM cloudpilot_history;
```

<details>
<summary>Inline SQL (same as master_sql.sql)</summary>

### `cloudpilot_actions` — create + seed (required)

The app resolves `action_type` → `action_id` from this table. **Seed before testing STEP 5.**

```sql
CREATE TABLE IF NOT EXISTS cloudpilot_actions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    action_type VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    requires_execution TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_action_type (action_type)
);

INSERT INTO cloudpilot_actions (action_type, display_name, requires_execution) VALUES
    ('general_chat', 'General Chat', 0),
    ('inventory_aws', 'Inventory AWS Resources', 1),
    ('scan_ec2', 'Scan EC2', 0),
    ('scan_s3', 'Scan S3', 0),
    ('toggle_ec2', 'Toggle EC2', 0),
    ('create_ec2', 'Create EC2', 0),
    ('delete_ec2', 'Delete EC2', 0)
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    requires_execution = VALUES(requires_execution);
```

### `cloudpilot_requests` — create only (rows come from the app)

Normally **empty** until STEP 5 creates rows. Create the table; no seed required.

```sql
CREATE TABLE IF NOT EXISTS cloudpilot_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    organization VARCHAR(255) NOT NULL DEFAULT 'Cloud Pilot',
    conversation_id BIGINT NOT NULL,
    conversation_title VARCHAR(255) NULL,
    requested_by_user VARCHAR(255) NOT NULL,
    action_id BIGINT UNSIGNED NOT NULL,
    action_name VARCHAR(255) NULL,
    display_name VARCHAR(255) NULL,
    action_notes TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'waiting_on_fields',
    outcome_code VARCHAR(100) NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    execution_mode VARCHAR(50) NULL,
    is_open TINYINT(1) NOT NULL DEFAULT 1,
    collected JSON NULL,
    missing JSON NULL,
    asked JSON NULL,
    completed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_requests_action
        FOREIGN KEY (action_id) REFERENCES cloudpilot_actions(id),
    INDEX idx_requests_conversation (conversation_id),
    INDEX idx_requests_status (status),
    INDEX idx_requests_open (is_open),
    INDEX idx_requests_action (action_id),
    INDEX idx_requests_outcome (outcome_code)
);
```

**Optional — fake an open `toggle_ec2` request** (manual testing only; delete or skip if STEP 5 will create it). Assumes `toggle_ec2` is `action_id = 4` after the seed above and `conversation_id = 1`:

```sql
INSERT INTO cloudpilot_requests (
    organization,
    conversation_id,
    requested_by_user,
    action_id,
    display_name,
    status,
    is_open,
    collected,
    missing,
    asked
) VALUES (
    'kite',
    1,
    'davey',
    (SELECT id FROM cloudpilot_actions WHERE action_type = 'toggle_ec2' LIMIT 1),
    'Toggle EC2',
    'waiting_on_fields',
    1,
    '{}',
    '["region", "primary_instance_id", "secondary_instance_id"]',
    '{}'
);
```

</details>

---

## Related docs

| Topic | Path |
|-------|------|
| **Architecture (read first)** | `development/architecture.md` |
| Active work (checklists) | `development/current_development.md` |
| Shipped | `development/finished_development.md` |
| Deferred / vision | `development/future_development.md` |
| Undo / history feature | `development/development_undo_feature.md` |
| History & changelog | `development/appendix.md` |
| Database schema | `database/database.md` |
| **Master SQL (source of truth)** | `sql/master_sql.sql` |
| Add a new action | `instructions/adding_new_action.md` |
