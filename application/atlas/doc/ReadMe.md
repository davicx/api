# CloudPilot — Actions & Input Types

Reference for **STEP 3: MESSAGE UNDERSTANDING**. These tables describe what `understandMessage()` extracts from a user message into `messageUnderstanding` — no DB writes or execution until `processRequest` (STEP 4).

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

## Related docs

| Topic | Path |
|-------|------|
| Current development & pipeline | `current_development.md` |
| Database schema | `database/database.md` |
| Add a new action | `instructions/adding_new_action.md` |
