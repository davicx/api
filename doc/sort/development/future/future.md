# Future work

**Last reviewed:** 2026-07-05

> **Active plans:** [scans.md](./scans.md) · [billing.md](./billing.md) · [history.md](../finished/history.md) · **Shipped:** [finished.md](../finished/finished.md) · **Platform:** [To_do.md](./to_do.md)

## History & undo

| ID | Work | Notes |
|----|------|-------|
| **H8** | `delete_ec2` history + **recreate** undo | New instance from `resource_state_before`; honest UX (terminate is irreversible) |
| **H11** | “Show my recent **requests**” | Last 5 `cloudpilot_requests` rows (distinct from history) |
| **H15** | Targeted undo | Undo a specific history row, not only latest |
| **H16** | More EC2 recipes in `ec2History.js` | Fold `toggleEc2History.js` / `createEc2History.js` optionally |
| **H17** | Full change-history UI | Audit trail, diffs, version restore |
| **H18** | Safe recipes | `update_s3_tag`, `update_iam_tag`, … same pattern as tag update |
| **G10** | Docs cleanup | Optional merge of older EC2 history builders into `ec2History.js` |

### Atlas (supports H8 / richer history)

- [ ] Toggle response includes before/after states (preferred for `saveHistory`)
- [ ] Delete response / preflight includes metadata for recreate (name, instance_type, tags, region)
- [ ] Test mocks include state fields for toggle; recreate fields for delete

### Kite (minor)

- [ ] Show `undoAvailable` hint in **chat** response when API sets it (dashboard Undo button already shipped)

---

## Tag & inspect polish

Dashboard tag detail works; these are UX improvements only.

| ID | Work |
|----|------|
| **T4** | Chat inspect — `inspect_ec2_tags` intent (“show tags for Kite-env”) |
| **T5** | More inspect intents — security groups, volumes, ENIs |
| **T6** | Tag detail polish — sort CloudPilot tags first; truncate/wrap long ARNs; Actions “Coming Soon” |
| **T7** | Soft-fill field examples from last scan (region / instance_id) — examples only, not auto-collected |

---

## Saved Actions (related — full spec in To_do.md)

Named reusable operations (`run Kite Security Scan`). Complements History/Undo; do not block on this for History MVP.

See [To_do.md](./to_do.md#api--saved-actions-future).

---

## Open requests dashboard — Run when ready

**Status:** Later UI feature. Do not redesign current AI / understanding work around this.

Fits the existing request model (open request, status, collected fields, missing fields, execution mode).

### Target UI

| Request               | Action     | Status  | Missing  | Ready   |
| --------------------- | ---------- | ------- | -------- | ------- |
| Resize Production EC2 | Resize EC2 | Waiting | Instance | —       |
| Dev Cleanup           | Delete EC2 | Ready   | —        | **Run** |
| Add Team Tag          | Update Tag | Ready   | —        | **Run** |

**Run** only appears / enables when the request is complete (nothing missing).

### Flow

```text
User conversation
       ↓
Open Request
       ↓
CloudPilot collects information
       ↓
Request becomes READY
       ↓
User reviews it
       ↓
      RUN
       ↓
Execute
       ↓
History / Undo
```

### Why this matters

Clean separation between:

- **Understanding / planning** — CloudPilot gathers what the user wants  
- **Changing infrastructure** — user explicitly hits **Run**

Much of the data already exists conceptually: request/action, status, execution mode, collected fields, missing fields, open vs closed. This is primarily a **Kite multi-open-requests table** (+ optional chat `run 1` disambiguation), not a new backend model.

Checklist pointer: [to_do.md](./to_do.md) (Kite → Multi-open requests UI).

---

## AI region understanding — ambiguous vs not provided

**Status:** Future (after demo MVP). Current region OpenAI returns `{ region }` or `{}` only. Demo MVP does **not** need this to be perfect.

### Problem we hit

User (while CloudPilot is waiting for a region): `west`

OpenAI correctly returned `{}` under “don’t invent / don’t default” — `west` is ambiguous (`us-west-1` vs `us-west-2`).

But CloudPilot then treated that like **no region signal at all**, and the turn fell through to general chat (stub). The extractor was reasonable; the **overall experience** threw away useful but ambiguous input.

### Three outcomes (not two)

| Outcome | Example | Desired behavior |
|---------|---------|------------------|
| **FOUND** | `Oregon` | → `us-west-2` |
| **AMBIGUOUS** | `west` | → clarify: “Did you mean us-west-1 (N. California) or us-west-2 (Oregon)?” |
| **NOT PROVIDED** | `yes` / `sounds good` | → nothing region-related; keep asking for region (or ignore) |

Do **not** silently choose `us-west-2`. Keep: **never invent infrastructure details**.

### Possible richer OpenAI shape (later)

Ambiguous:

```json
{
  "region": null,
  "regionMentioned": true,
  "needsClarification": true,
  "clarification": "Did you mean us-west-1 (N. California) or us-west-2 (Oregon)?"
}
```

Not provided:

```json
{
  "region": null,
  "regionMentioned": false,
  "needsClarification": false
}
```

Public CloudPilot contract can stay simple for FOUND; AMBIGUOUS should drive a clarify reply while the open request stays `waiting_on_fields` — **not** general chat.

### Demo conversation (target)

```text
CloudPilot: What region should I use?
You: west
CloudPilot: Did you mean us-west-1 (N. California) or us-west-2 (Oregon)?
You: Oregon
CloudPilot: Everything is ready for the EC2 scan. Would you like me to run it?
```

### Design rule

```text
understand
  → if confident, fill it
  → if ambiguous, clarify
  → never silently invent infrastructure details
```

Also: when an open request is waiting on a field and understanding finds nothing applicable, prefer **re-ask missing fields** over falling through to general chat.

Establish this pattern on **region** before expanding OpenAI to action search / other fields.

---

## Billing message polish (optional)

Smarter chat copy after billing summary (total first, cost-driver insight, Scan S3 when S3 dominates). See [billing.md](./billing.md).

---

## Scans

Deferred scan work — MVP scope and order: [scans.md](./scans.md).

### Intent views (after rules have `category`)

- Chat: “show security issues”, “ways to save money”, “configuration problems” — filter findings, no new scanners

### Orchestration

- `scan_aws` — one chat command, summary dashboard (EC2 4 findings, S3 2, …)

### Extra rules (per service)

- EC2: no recent snapshot, oversized instance recommendation  
- S3: versioning/lifecycle cost rules, public ACL/policy, MPU uploads, bucket size / Intelligent-Tiering  
- RDS: Aurora, SG cross-check, idle connections, mutations (stop/resize)  
- IAM: root in use, inline policies, rotation  
- SG: all ports open, permissive egress  
- Lambda: large package, missing tags  

### Deferred services (not MVP)

CloudFormation, ECS, EKS, Route53, CloudFront, API Gateway, Organizations, Control Tower, WAF, Macie, Inspector, GuardDuty, Config, Backup, KMS, EventBridge, SNS/SQS, **CodePipeline / CodeBuild scan**, EBS standalone scanner

### Scan polish

- Mock data per rule in Atlas test routes  
- Navigator savings column consistency  
- Capability migration (`scanS3.js` etc.) — see [To_do.md](./to_do.md)
