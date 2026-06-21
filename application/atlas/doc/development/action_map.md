# CloudPilot Action Map

**Purpose:** One-page developer navigation. Answer in under 30 seconds:

* What does the user want?
* When is it ready to run?
* What runs?
* How does it work?
* Where does it run?
* Does it create history?

**No runtime behavior** — pointers to live files only.

**Last reviewed:** 2026-06-09

---

## Five questions → one file each

| Question | Answer |
|----------|--------|
| What does the user want? | `services/understanding/understandMessage.js` + `services/actions/actionRegistry.js` (`match`) |
| When is it ready? | `services/decision/decideNextStep.js` |
| What runs? | `services/executions/functions/runAction.js` → handler |
| How does it work? | `capabilities/` (scan, change, inventory, conversation) |
| Where does it run? | `capabilities/atlas/atlasPost.js` → Atlas HTTP |

**Supporting (not in the five questions):**

| Question | Answer |
|----------|--------|
| Open request state? | `services/requests/` — STEP 2 load, STEP 5 apply |
| What changed? | `services/history/functions/historyFunctions.js` — STEP 6B after RUN |
| What does the user see? | `services/responses/` — STEP 7 |

---

## Summary table

| Action | WHAT | WHEN | RUN | HOW | WHERE | HISTORY | Wired |
|--------|------|------|-----|-----|-------|---------|-------|
| `scan_ec2` | `scan` + `ec2` in message | region + confirm (`yes`) | `scanEC2Handler` | `capabilities/scans/scanEC2.js` | `atlasPost` → `/scan/ec2` | No | ✅ capability |
| `scan_s3` | `scan` + `s3` in message | region + confirm | `scanS3Handler` | `capabilities/scans/scanS3.js` | `atlasPost` → `/scan/s3` | No | ⚠️ legacy handler path |
| `toggle_ec2` | toggle phrases + `ec2` | region + both IDs + mode 4 + confirm | `toggleEC2Handler` | `capabilities/changes/changeEC2.js` (`toggleEC2`) | `atlasPost` → `/ec2/toggle` | Yes (automatic only) | ✅ capability |
| `create_ec2` | create phrases + `ec2` | fields + mode 4 + confirm | `createEC2Handler` | `capabilities/changes/changeEC2.js` (`createEC2`) | `atlasPost` → `/ec2/create` | Planned | ⚠️ legacy handler path |
| `delete_ec2` | delete phrases + `ec2` | fields + mode 4 + confirm | `deleteEC2Handler` | `capabilities/changes/changeEC2.js` (`deleteEC2`) | `atlasPost` → `/ec2/delete` | Planned | ⚠️ legacy handler path |
| `inventory_aws` | inventory phrases | **immediate** — no confirm | `inventoryAWSHandler` | `capabilities/inventory/getAllResources.js` | `atlasPost` → `/inventory/aws` | No | ⚠️ legacy handler path |
| `general_chat` | no action match / idle chat | immediate — no request row | **N/A — not STEP 6** | `capabilities/conversation/generalChat.js` | OpenAI (not Atlas) | No | ⚠️ STEP 7 stub |

**Wired legend:** ✅ handler calls capability · ⚠️ handler still calls `atlasEC2Functions` / `atlasS3Functions` / `atlasAWSFunctions` or STEP 7 only

---

## Per-action detail

### Scan EC2

| | |
|--|--|
| **WHAT** | `understandMessage` → `searchMessageForAction` → `actionRegistry.scan_ec2.match` (`scan` + `ec2`) |
| **WHEN** | `decideNextStep` — collect `region` → `awaiting_confirmation` → user `yes` → `execution_started` |
| **RUN** | `runAction` → `actions/ec2/scanEC2/scanEC2Handler.js` |
| **HOW** | `capabilities/scans/scanEC2.js` |
| **WHERE** | `capabilities/atlas/atlasPost.js` → Atlas `POST /scan/ec2` |
| **HISTORY** | No |

---

### Scan S3

| | |
|--|--|
| **WHAT** | `actionRegistry.scan_s3.match` (`scan` + `s3`) |
| **WHEN** | Same as scan EC2 — region + confirm |
| **RUN** | `runAction` → `actions/s3/scanS3/scanS3Handler.js` |
| **HOW** | `capabilities/scans/scanS3.js` (placeholder — handler uses `atlasS3Functions`) |
| **WHERE** | `atlasPost` → `/scan/s3` |
| **HISTORY** | No |

---

### Toggle EC2

| | |
|--|--|
| **WHAT** | `actionRegistry.toggle_ec2.match` |
| **WHEN** | region + `primary_instance_id` + `secondary_instance_id` → execution mode `4` (automatic) → confirm → `execution_started` |
| **RUN** | `runAction` → `actions/ec2/toggleEC2/toggleEC2Handler.js` |
| **HOW** | `capabilities/changes/changeEC2.js` (`toggleEC2`) |
| **WHERE** | `atlasPost` → `/ec2/toggle` |
| **HISTORY** | Yes — STEP 6B `historyFunctions.saveHistory` (toggle automatic only; builder: `toggleEc2History.js`) |

---

### Create EC2

| | |
|--|--|
| **WHAT** | `actionRegistry.create_ec2.match` |
| **WHEN** | `name`, `region`, `instance_type` + mode 4 + confirm |
| **RUN** | `runAction` → `actions/ec2/createEC2/createEC2Handler.js` |
| **HOW** | `capabilities/changes/changeEC2.js` (`createEC2`) — placeholder; handler uses `atlasEC2Functions` |
| **WHERE** | `atlasPost` → `/ec2/create` |
| **HISTORY** | Planned (no builder yet) |

---

### Delete EC2

| | |
|--|--|
| **WHAT** | `actionRegistry.delete_ec2.match` |
| **WHEN** | `region` + `instance_id` + mode 4 + confirm |
| **RUN** | `runAction` → `actions/ec2/deleteEC2/deleteEC2Handler.js` |
| **HOW** | `capabilities/changes/changeEC2.js` (`deleteEC2`) — placeholder; handler uses `atlasEC2Functions` |
| **WHERE** | `atlasPost` → `/ec2/delete` |
| **HISTORY** | Planned (no builder yet) |

---

### Inventory AWS

| | |
|--|--|
| **WHAT** | `actionRegistry.inventory_aws.match` |
| **WHEN** | **Immediate** — `decideNextStep` → `immediate_execution` (no request row, no confirm). Proves WHEN ≠ confirmation. |
| **RUN** | `runAction` → `actions/aws/inventoryAWS/inventoryAWSHandler.js` |
| **HOW** | `capabilities/inventory/getAllResources.js` (placeholder — handler uses `atlasAWSFunctions`) |
| **WHERE** | `atlasPost` → `/inventory/aws` |
| **HISTORY** | No |

---

### General chat (special case)

| | |
|--|--|
| **WHAT** | No registry match → `understanding.action = general_chat` |
| **WHEN** | Immediate — `decideNextStep` → `general_chat` response type; no open request |
| **RUN** | **Does not run through STEP 6.** No `runAction`, no handler in execution pipeline. |
| **HOW** | STEP 7 `responses/buildGeneralChatResponse.js` → `capabilities/conversation/generalChat.js` (C6) |
| **WHERE** | OpenAI via `services/chat/openAI/openAIFunctions.js` — not Atlas |
| **HISTORY** | No |

Do not search for `generalChatHandler` in STEP 6 — it does not exist.

---

## End-to-end (scan — happy path)

```text
"scan ec2"
  WHAT   understandMessage + registry.match → scan_ec2
  WHEN   decideNextStep → ask for region
  RUN    (none yet)

"us-west-2"
  WHEN   decideNextStep → awaiting_confirmation

"yes"
  WHEN   decideNextStep → execution_started
  RUN    executionFunctions → runAction → scanEC2Handler
  HOW    capabilities/scans/scanEC2
  WHERE  capabilities/atlas/atlasPost → Atlas
  HISTORY (skip)
  STEP 7 response + Navigator
```

---

## Related docs

| Doc | Role |
|-----|------|
| [architecture.md](./architecture.md) | Full system reference |
| [capability_migration.md](./capability_migration.md) | Capability layer C0–C9 |
| [capabilities/README.md](../../capabilities/README.md) | HOW layer layout |
| [services/README.md](../../services/README.md) | Pipeline folders |
