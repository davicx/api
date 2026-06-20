# CloudPilot — Database

Three tables: static **actions**, user **requests** (workflows), and **executions** (each run attempt). **History** (audit + undo) is defined in master SQL.

**Replaces:** `cloudpilot_workflows` (evolves into `cloudpilot_requests` + FK to `cloudpilot_actions`).

**Source of truth (run on new machine):** [`sql/master_sql.sql`](../sql/master_sql.sql) — `cloudpilot_actions`, `cloudpilot_requests`, `cloudpilot_history`, and action seed.

Runnable SQL below mirrors `master_sql.sql` for reference.

---

## cloudpilot_actions

Static registry of what CloudPilot can do. One row per action type (mirrors `actionRegistry.js`).

### SQL

```sql
CREATE TABLE cloudpilot_actions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    action_type VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NULL,

    requires_execution TINYINT(1) NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_action_type (action_type)
);
```

### Fields

| Field | Definition |
|-------|------------|
| `id` | Primary key. Referenced by `cloudpilot_requests.action_id`. |
| `action_type` | Machine key for the action. Examples: `toggle_ec2`, `create_ec2`, `delete_ec2`, `scan_ec2`, `inventory_aws`. Same value as `type` in `actionRegistry.js`. |
| `display_name` | Default human label for this action type. Example: `Toggle EC2`. Same as `actionLabel` in `actionRegistry.js`. |
| `requires_execution` | Maps to `requiresExecution` in `actionRegistry.js`. `1` = this action type has an execution handler; `0` = no handler (e.g. `general_chat`). |

### Example rows

```text
id | action_type   | display_name
1  | toggle_ec2    | Toggle EC2
2  | create_ec2    | Create EC2
3  | delete_ec2    | Delete EC2
4  | scan_ec2      | Scan EC2
5  | inventory_aws | Inventory AWS Resources
```

---

## cloudpilot_requests

A user’s actual request — one row per “I asked CloudPilot to do something” while it is open or in history. Replaces the old workflow row (`cloudpilot_workflows`).

### SQL

```sql
CREATE TABLE cloudpilot_requests (
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

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_requests_action
        FOREIGN KEY (action_id)
        REFERENCES cloudpilot_actions(id),

    INDEX idx_requests_conversation (conversation_id),
    INDEX idx_requests_status (status),
    INDEX idx_requests_open (is_open),
    INDEX idx_requests_action (action_id),
    INDEX idx_requests_outcome (outcome_code)
);
```

### Fields

| Field | Definition |
|-------|------------|
| `id` | Request id. App may expose this as `requestId` or `workflowId` during migration. |
| `organization` | Tenant / site string (e.g. `kite`, `Cloud Pilot`). From `masterSite` on the message post. |
| `conversation_id` | Chat thread this request belongs to. |
| `conversation_title` | Human title for the conversation (e.g. `EC2 Cost Optimization`). Used when listing open requests by name instead of numeric conversation id. |
| `requested_by_user` | Username who started the request. |
| `action_id` | FK → `cloudpilot_actions.id`. Which action type this request is. |
| `display_name` | Human label for **this** request instance. Shown in chat prompts and open-request lists. Often copied from the action’s `display_name` on create. |
| `status` | Where this request is in the workflow. See [Request status values](#request-status-values). |
| `outcome_code` | Machine-readable result when the request closes. `NULL` while open. Examples: `success`, `cancelled_by_user`, `instance_not_found`. Set on finish. |
| `execution_mode` | How the user chose to run this request (destructive actions). Set when user picks 1–4 in chat. See [Execution mode values](#execution-mode-values). `NULL` until chosen. Same column name as `actionRegistry.js` `executionModes` and `Actions.js`. |
| `is_open` | `1` = request still active; `0` = closed (completed, failed, or cancelled). |
| `collected` | JSON object of field values gathered from chat (e.g. `region`, `instance_id`). |
| `missing` | JSON array of required field names not yet collected. |
| `asked` | JSON object tracking which missing fields CloudPilot already asked about. |
| `completed_at` | When the request was closed (`is_open = 0`). |

### Request status values

Used in app code today (`requests/functions/requestStatusFunctions.js`):

| Value | Meaning |
|-------|---------|
| `waiting_on_fields` | Still missing required fields from the user. |
| `waiting_on_execution_mode` | Fields complete; user must pick execution mode (1–4). |
| `waiting_on_confirmation` | Ready; user must confirm (`yes`) before execution. |
| `running` | Execution in progress. |
| `completed` | Finished successfully; `is_open = 0`. |
| `failed` | Execution or validation failed; `is_open = 0`. |
| `cancelled` | User or system cancelled; `is_open = 0`. |

### Execution mode values

Used in app code today (`actionRegistry.js` destructive actions, user picks `1`–`4` in chat):

| Value | Meaning |
|-------|---------|
| `instructions` | User gets step-by-step instructions; CloudPilot does not call Atlas/AWS. |
| `cli` | User gets CLI commands; CloudPilot does not call Atlas/AWS. |
| `pr` | User gets a PR-style change description; CloudPilot does not call Atlas/AWS. |
| `automatic` | CloudPilot calls Atlas → AWS. Only this mode performs real infrastructure changes today. |

Chat mapping: `1` → `instructions`, `2` → `cli`, `3` → `pr`, `4` → `automatic`.

### Example row

```text
id: 55
organization: kite
conversation_id: 123
conversation_title: EC2 Cost Optimization
requested_by_user: david
action_id: 1
display_name: Toggle EC2
status: waiting_on_confirmation
execution_mode: automatic
is_open: 1
```

### Listing open requests (why `conversation_title` helps)

```text
EC2 Cost Optimization
  - Toggle EC2
  - Waiting On Confirmation

Production S3 Cleanup
  - Delete Old Buckets
  - Waiting On Fields
```

---

## cloudpilot_executions

One row per execution attempt on a request. A request can have multiple executions (retries); `execution_number` increments per request.

### SQL

```sql
CREATE TABLE cloudpilot_executions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    request_id BIGINT UNSIGNED NOT NULL,

    execution_number INT UNSIGNED NOT NULL DEFAULT 1,

    execution_mode VARCHAR(50) NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    started_at DATETIME NULL,

    finished_at DATETIME NULL,

    result_json JSON NULL,

    error_message TEXT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_executions_request
        FOREIGN KEY (request_id)
        REFERENCES cloudpilot_requests(id),

    UNIQUE KEY uk_request_execution
        (request_id, execution_number),

    INDEX idx_execution_request (request_id),
    INDEX idx_execution_status (status)
);
```

### Fields

| Field | Definition |
|-------|------------|
| `id` | Execution id. |
| `request_id` | FK → `cloudpilot_requests.id`. Which request this run belongs to. |
| `execution_number` | Attempt number for this request (`1` = first run, `2` = retry). Unique with `request_id`. |
| `execution_mode` | Same values as [Execution mode values](#execution-mode-values) on the request. Copied when execution starts. |
| `status` | Lifecycle of this run. App uses `running` while Atlas runs, then `completed` or `failed`. Default `pending` before start. |
| `started_at` | When Atlas execution began. |
| `finished_at` | When this execution attempt ended. |
| `result_json` | Structured result from Atlas/handlers (e.g. stopped/started instance ids). |
| `error_message` | Human- or log-oriented failure text when `status = failed`. |

### Example row

```text
id: 1001
request_id: 55
execution_number: 1
execution_mode: automatic
status: completed
result_json: { "stopped": "i-123", "started": "i-456" }
```

---

## Relationship

```text
cloudpilot_actions (static)
        │
        │  action_id
        ▼
cloudpilot_requests (user request / workflow)
        │
        ├── request_id → cloudpilot_executions (each run attempt)
        │
        └── request_id → cloudpilot_history (change audit + undo)
```

```text
Action definition  →  cloudpilot_actions
User says "Toggle EC2"  →  cloudpilot_requests row (collect fields, confirm)
User says "yes"  →  cloudpilot_executions row (Atlas/AWS runs)
Request closes  →  cloudpilot_requests.is_open = 0, outcome_code set
Mutation succeeds  →  cloudpilot_history row (audit + undo) — see `sql/master_sql.sql`
```

---

## cloudpilot_history

**CloudPilot Change History** — what actually changed (audit, undo, future version timeline).

**Source of truth:** [`sql/master_sql.sql`](../sql/master_sql.sql). Full plan: [`development/development_undo_feature.md`](../development/development_undo_feature.md).

Key columns: `conversation_id`, `executed_by_user`, `action_name` (no `action_id`), `history_status` (not `requests.status`), `target_id` (toggle MVP: `i-123:i-456`), `resource_state_before` / `resource_state_after`, `undo_payload`, `undo_available`, `restores_history_id`, `restored_by_history_id`.

**First coding milestone (H1):** save history row after successful `toggle_ec2` automatic — no undo yet. See plan doc.

---

## Seed actions (optional)

Run after `CREATE TABLE cloudpilot_actions`:

```sql
INSERT INTO cloudpilot_actions (action_type, display_name, requires_execution) VALUES
    ('general_chat', 'General Chat', 0),
    ('inventory_aws', 'Inventory AWS Resources', 1),
    ('scan_ec2', 'Scan EC2', 0),
    ('scan_s3', 'Scan S3', 0),
    ('toggle_ec2', 'Toggle EC2', 0),
    ('create_ec2', 'Create EC2', 0),
    ('delete_ec2', 'Delete EC2', 0);
```

(`requires_execution` values match current `actionRegistry.js`; adjust when seeding from production registry.)
