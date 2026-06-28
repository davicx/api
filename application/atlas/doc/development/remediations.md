# Remediations — delivery strategies & PR workflow

**Last reviewed:** 2026-06-27

> **Related:** [history.md](./history.md) · [architecture/development_undo_feature.md](./architecture/development_undo_feature.md) · [architecture/architecture.md](./architecture/architecture.md) · [To_do.md](./To_do.md)

**Scope:** How CloudPilot delivers mutating actions when the user does **not** choose automatic mode — especially **Pull Request** (chat option 3). Atlas always owns AWS execution; GitHub owns approval.

**Status today:** Chat option 3 routes to `change/strategies/pr.js` (*“coming soon”*). Automatic delivery (option 4) is shipped with history + undo. No remediation record, no GitHub integration, no apply endpoint.

---

## MVP in one sentence

> **CloudPilot generates a pull request that contains the requested infrastructure change. When the PR is merged, CloudPilot executes that change in AWS.**

That is enough for the first demo. Everything below supports that sentence — nothing more is required for v1.

---

## Goal to show (signature demo)

This is the end-to-end story to rehearse and record. The GitHub experience is **completely real** — not mocked.

### 1 — Chat

> **User:** Create a t3.micro named demo-server.

CloudPilot collects fields, then:

> Everything is ready. How would you like me to perform this?
>
> 1. Instructions · 2. CLI · **3. Pull Request** · 4. CloudPilot Does It

User picks **3**.

> Great! I've opened Pull Request #42 for your review.

### 2 — GitHub (switch screens)

Real PR on screen:

```text
Create EC2: demo-server

Files changed: 1

.cloudpilot/
└── changes/
    └── create_demo_server.json
```

```json
{
  "action": "create_ec2",
  "name": "demo-server",
  "instance_type": "t3.micro",
  "region": "us-west-2"
}
```

Reviewer takeaway: *“This PR is requesting CloudPilot to create an EC2 instance.”* No Terraform questions.

### 3 — Merge

GitHub Actions runs (visible in the PR):

```text
✓ Workflow started
Reading CloudPilot change…
Calling CloudPilot…
Creating EC2…
Completed.
```

### 4 — CloudPilot (switch back)

History:

```text
✓ Create EC2 demo-server
Status: Completed
Undo: Available
```

User clicks **Undo**.

### 5 — GitHub again

CloudPilot opens a second PR:

```text
Revert "Create EC2 demo-server"

Files changed: 1

.cloudpilot/changes/
  - create_demo_server.json   (removed)
```

Merge → Action runs → Atlas deletes EC2 → history shows **Reverted**.

### Why this demo lands

To the audience it feels like CloudPilot slots into how teams already work:

```text
CloudPilot  →  GitHub PR  →  Code review  →  Merge  →  GitHub Actions  →  AWS
```

AI, GitHub, approvals, automation, history, and undo — one coherent workflow. No IaC platform required first.

**Why not Terraform in the demo:** “How do you generate it? What modules? Where’s state?” — you end up explaining Terraform instead of CloudPilot. A **change file** keeps the story: *CloudPilot proposes → GitHub approves → CloudPilot executes.*

---

## The one demo (ship this first)

**Create EC2 via Pull Request** — not S3, not Terraform, not multiple actions.

| Why EC2 | Why not S3 (yet) |
|---------|------------------|
| Easy to understand and show | Bucket policy, encryption, versioning, public access… |
| Easy to undo (delete instance) | Many edge cases for one demo |
| No diff against existing infra | |
| `create_ec2` + `delete_ec2` already work in automatic mode | |

**Demo flow:**

```text
User: "Create a t3.micro called demo-server"
    ↓
CloudPilot: "I've created Pull Request #42"
    ↓
User opens GitHub → reviews PR → merges
    ↓
GitHub Action (~50 lines): read JSON → POST CloudPilot
    ↓
CloudPilot → Atlas → EC2 created
    ↓
History row (same as automatic)
    ↓
Undo → another PR (or chat undo → delete) → merge → Atlas deletes EC2
```

Forget YAML. Forget Terraform. Forget multiple actions. Build **one really cool demo**.

---

## Core principle (locked)

**History records what changed in the cloud — not which delivery strategy the user picked.**

Every delivery path that mutates AWS should produce the **same** `cloudpilot_history` shape, naming copy, and undo affordance. Only **when** and **how** execution is triggered changes.

---

## PR = proof of approval, not infrastructure-as-code

For MVP, the PR does **not** define your entire cloud. It holds a **CloudPilot change** (one JSON file):

```text
PR contains          NOT
───────────          ───
CloudPilot request   Entire infrastructure definition
(one change file)    Terraform / full IaC
```

Git is the **approval audit**. AWS state lives in **`cloudpilot_history`** (same as automatic). No `applied/` JSON in the repo.

**Later:** intent JSON → Terraform generator → `terraform apply`. Not MVP.

---

## Intent file — JSON, one file (MVP)

CloudPilot generates the file. The GitHub Action reads it. **No human edits it** — JSON is fine. Switch to YAML later if you want human-editable intent.

**Repo layout** — folder is `changes/`, not `requests/`. Every PR literally contains a **change**:

```text
.cloudpilot/
  changes/
    create_demo_server.json
.github/
  workflows/
    cloudpilot-on-merge.yml
```

Later, one repo can hold many pending changes:

```text
.cloudpilot/changes/
  create_demo_server.json
  resize_database.json
  create_bucket.json
```

**Example file** (entire PR change can be this one file):

```json
{
  "action": "create_ec2",
  "name": "demo-server",
  "instance_type": "t3.micro",
  "region": "us-west-2"
}
```

Optional metadata for idempotency and audit (add when wiring apply):

```json
{
  "action": "create_ec2",
  "name": "demo-server",
  "instance_type": "t3.micro",
  "region": "us-west-2",
  "request_id": 14,
  "display_name_internal": "create_ec2_us-west-2_20260626_143252_15"
}
```

Filename can be `{display_name_internal}.json` or a slug like `create_ec2_demo_server.json` — pick one convention and stick to it for MVP.

**No `applied/` folder.** History + `resource_state_after` are source of truth.

---

## Thin GitHub Action

The Action does **not** call Atlas, parse business rules, or write history. It notices a new/changed/removed file under `.cloudpilot/changes/` and notifies CloudPilot.

```text
PR merged
    ↓
GitHub Action (minimal)
    ↓
Read JSON file(s) from merge commit
    ↓
POST to CloudPilot (file body or parsed fields)
    ↓
CloudPilot orchestrates:
    validate → Atlas → saveHistory → update remediation + request
```

**Simplest apply contract (MVP):** POST the JSON body CloudPilot already understands:

```text
POST /remediation/apply
Content-Type: application/json

{ "action": "create_ec2", "name": "demo-server", ... }
```

CloudPilot maps `action` → existing capability (`createEC2`, …) — **no new execution engine**. Same path as automatic STEP 6, different trigger.

Alternative naming (`POST /github/apply`) is fine; one authenticated endpoint that accepts intent JSON is the requirement.

| Input | Purpose |
|-------|---------|
| Intent JSON (action + parameters) | What to run |
| `merge_commit_sha`, `repo`, file path | Idempotency / audit |
| Webhook secret or token | Verify caller |

| Output | Purpose |
|--------|---------|
| `success`, `history_id` | Action logs |
| Error details | Failed apply → optional `history_status = failed` |

Example workflow (conceptual — ~50 lines total):

```yaml
# on merge to main — if .cloudpilot/changes/** changed
- run: |
    curl -X POST "$CLOUDPILOT_URL/remediation/apply" \
      -H "Authorization: Bearer $CLOUDPILOT_TOKEN" \
      -d @.cloudpilot/changes/create_demo_server.json
```

All business logic stays in CloudPilot.

---

## Mental model: action → delivery → execution

```text
Action (create_ec2)
    ↓
Delivery strategy (pull_request | automatic | …)
    ↓
Execution (Atlas)
    ↓
History
    ↓
Undo strategy
```

| Option | Delivery | CloudPilot runs Atlas? | History on mutation? |
|--------|----------|-------------------------|----------------------|
| 1 Instructions | Human reads steps | No | No |
| 2 CLI | Human runs commands | No | No |
| **3 Pull Request** | GitHub merge → CloudPilot apply | Yes — after merge | Yes — after apply |
| 4 Automatic | Chat confirm → STEP 6 | Yes — immediately | Yes — shipped |

```text
Automatic     →  Atlas

Pull Request  →  GitHub (approve)  →  CloudPilot  →  Atlas
```

**GitHub is not the execution engine.** It is a **delivery mechanism**.

---

## Three responsibilities (grow independently)

| # | Responsibility | Owner | MVP |
|---|----------------|-------|-----|
| 1 | **Create remediation** | CloudPilot | Write intent JSON, open PR, remediation row |
| 2 | **Approve remediation** | GitHub | Human review + merge |
| 3 | **Execute remediation** | CloudPilot (thin Action triggers) | `POST /remediation/apply` → Atlas → `saveHistory` |

---

## Request → Remediation → History

```text
Request       — chat workflow (fields, naming, strategy pick)
    ↓
Remediation   — one delivery attempt (PR #42, awaiting merge, …)
    ↓
History       — cloud mutation audit (only after AWS changed)
```

**Example:**

```text
Request:     Create EC2 (display_name, display_name_internal, …)

Remediation: delivery = pull_request
             status = awaiting_merge
             pr_number = 42

History:     (after merge + apply only)
             action_display_name ← request.display_name
             action_record_key   ← request.display_name_internal
```

**MVP storage:** new `cloudpilot_remediations` table **or** JSON on request until volume warrants split — concept required either way.

---

## User-visible lifecycle

```text
waiting_on_fields → awaiting_confirmation → executing
```

**Pull Request branch:**

```text
executing  →  awaiting_merge  →  applying  →  completed | failed
```

| User-facing copy | Internal meaning |
|------------------|------------------|
| “Opening your pull request…” | `executing` |
| “Waiting for you to merge PR #42” | `awaiting_merge` |
| “Applying your approved change…” | `applying` |
| “Done” | `completed` + history row |

**Fix required today:** option 3 marks request `completed` immediately — wrong for PR. Must enter `executing` → `awaiting_merge`.

---

## History timing (locked)

| Event | Write `cloudpilot_history`? |
|-------|----------------------------|
| User picks delivery strategy | No |
| PR opened | No |
| PR merged | No (not until AWS changed) |
| **Apply success** | **Yes** — same rules as automatic |
| Apply failed after merge | Yes — `failed`, `undo_available = 0` |
| PR closed without merge | No row |

Optional PR context in `resource_state_after`:

```json
{
  "delivery": "pull_request",
  "pr_number": 42,
  "merge_commit_sha": "abc123",
  "intent_path": ".cloudpilot/changes/create_demo_server.json",
  "instance_id": "i-0abc..."
}
```

---

## Undo for the demo

**Signature demo uses revert PR** — same GitHub story forward and backward.

| Step | What the audience sees |
|------|------------------------|
| Undo click | CloudPilot opens PR removing `create_demo_server.json` |
| Merge | Action runs → Atlas deletes EC2 |
| History | Original row shows **Reverted** |

Under the hood: `delete_ec2_undo` (or equivalent) after merge — same Atlas path as automatic undo. History stores `undo_payload.type`; registry dispatches.

Fallback for development: chat undo → direct delete without a second PR (faster to test; not the recorded demo).

---

## Out of MVP

- Terraform / YAML intent (JSON only for v1)
- S3 or any action beyond `create_ec2`
- `applied/*.json` in Git
- Toggle / delete **via** PR (automatic already handles those)
- Multi-repo, org policy UI
- Fat GitHub Actions with Atlas/history logic
- Instructions / CLI delivery

**Phase 2 after demo lands:** one S3 action **or** revert-PR undo polish — not both required for first PR.

---

## Planned code layout

```text
services/remediations/
  remediationFunctions.js       ← create remediation, apply, status
  githubClient.js               ← branch, commit JSON, open PR
  intentBuilders/
    createEc2Intent.js          ← MVP only
routes/
  remediationRoutes.js          ← POST /remediation/apply

change/strategies/pr.js         ← STEP 7: start remediation, return PR URL

capabilities/                   ← unchanged
history/                        ← unchanged — saveHistory after apply
```

---

## MVP checklist

### Phase R0 — Design lock

- [x] One demo: **create_ec2 via PR**
- [x] Intent = **JSON** (not Terraform; YAML optional later)
- [x] PR = proof of approval, not full IaC
- [x] CloudPilot orchestrates apply; Actions stay thin (~50 lines)
- [x] Remediation concept between request and history
- [x] History only after AWS changed; no `applied/` in Git
- [ ] Lock JSON fields for `create_ec2` intent v1
- [ ] Lock `POST /remediation/apply` contract (body = intent JSON)
- [ ] GitHub App vs PAT; repo config
- [ ] Remediation storage: table vs JSON on request

### Phase R1 — create_ec2 via PR (the demo)

- [ ] Remediation record + create on strategy confirm
- [ ] GitHub client — branch, commit `.cloudpilot/changes/*.json`, open PR
- [ ] Replace `pr.js` stub — return PR URL; request → `awaiting_merge`
- [ ] `cloudpilot-on-merge.yml` — read JSON, POST apply
- [ ] `/remediation/apply` — route to existing `createEC2` + **saveHistory**
- [ ] E2E: chat → PR #N → merge → instance + history row

### Phase R2 — undo (demo finish)

- [ ] Undo opens revert PR (remove change file) → merge → Atlas delete
- [ ] History row → **Reverted** (same undo registry as automatic)
- [ ] Kite undo button ([history.md](./history.md))

### Later

- [ ] Second action (e.g. one S3 operation)
- [ ] YAML or Terraform intent if humans edit files
- [ ] Instructions / CLI delivery (same intent builders)
- [ ] Org repo settings UI

---

## Open decisions

1. **Remediation table** vs JSON on request for MVP?
2. **Apply trigger** — GitHub Action only, or webhook + Action?
3. **Test mode** — apply hits Atlas Test imports (same as automatic)?
4. **Revert PR on delete merge** — Action must detect file removal, not only adds?
5. **Filename convention** — slug (`create_demo_server.json`) vs `display_name_internal.json`?

**Decided:**

- JSON intent, not Terraform (MVP)
- One action: `create_ec2`
- PR holds CloudPilot **change**, not full infra
- No `applied/` in Git
- CloudPilot owns execution; GitHub owns approval
- History + undo same as automatic after apply

---

## How this connects to existing code

| Topic | Location |
|-------|----------|
| Strategy option 3 stub | `change/strategies/pr.js` |
| Automatic execution | `cloudPilotMessageFunctions.js` STEP 6 |
| Atlas create EC2 | `capabilities/` (existing) |
| History after mutation | `history/functions/historyFunctions.js` |
| Undo delete EC2 | `history/undoRegistry.js` → `delete_ec2_undo` |
| Request naming → history | `requestNameFunctions.js`, `saveHistory()` |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-27 | Signature demo script; `.cloudpilot/changes/`; revert PR undo as demo story |
| 2026-06-27 | Ultra-simple MVP: JSON intent, create_ec2-only demo, PR as approval proof |
| 2026-06-27 | Delivery-strategy architecture, remediation entity, thin Actions |
| 2026-06-26 | Initial remediations doc |
