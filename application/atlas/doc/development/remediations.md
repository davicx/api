# Remediations — delivery strategies & PR workflow

**Last reviewed:** 2026-06-27

> **Related:** [history.md](./history.md) · [architecture/development_undo_feature.md](./architecture/development_undo_feature.md) · [architecture/architecture.md](./architecture/architecture.md) · [To_do.md](./To_do.md)

**Scope:** How CloudPilot delivers mutating actions when the user does **not** choose automatic mode — especially **Pull Request** (chat option 3). Atlas always owns AWS execution; GitHub owns approval.

**Status today:** Chat option 3 → `change/strategies/pr.js` (*“coming soon”*). Automatic delivery (option 4) shipped with history + undo. **Phase 0** repo scaffold on `cloudpilot_infrastructure`. **Phase 1** `services/config/github/githubClient.js` built. **Phase 2** `test/scripts/createDemoPullRequest.js` ready to run. No apply workflow, no `/github/apply`, no chat wiring yet.

---

## Phased plan (locked — demo one piece at a time)

| Phase | What | Demoable outcome |
|-------|------|------------------|
| **0** | Repo scaffold on `cloud_pilot_mvp` | Folders + README; no Actions, no JSON files yet |
| **1** | `config/github/githubClient.js` | GitHub helper (env + REST calls) |
| **2** | `createDemoPullRequest.js` | **Real PR** with `changes/create_demo_server.json` |
| **3** | `cloudpilot-apply.yml` + `/github/apply` | Merge → Atlas → AWS |
| **4** | Wire `pr.js` (`create_ec2` only) | Chat option 3 opens PR |
| **5** | History after apply | Same row as automatic |
| **6** | Undo revert PR | Second PR removes file → delete |

**Stop after Phase 2** until a real PR works. Do **not** build Actions until outbound PRs are proven.

Infra repo: [`cloudpilot_infrastructure`](../../../../../cloudpilot_infrastructure) — `README.md` + `changes/` only.

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

changes/
└── create_demo_server.json
```

```json
{
  "cloudpilotVersion": 1,
  "kind": "InfrastructureChange",
  "displayName": "Create EC2 demo-server",
  "action": "create_ec2",
  "resource": {
    "type": "ec2",
    "region": "us-west-2",
    "instanceType": "t3.micro",
    "name": "demo-server"
  }
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

changes/
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
changes/
  create_demo_server.json   ← added by CloudPilot PR
.github/
  workflows/                ← cloudpilot-apply.yml in Phase 3
```

Later, one repo can hold many pending changes:

```text
changes/
  create_demo_server.json
  resize_database.json
```

**Example file** (what Phase 2 script commits in the PR):

```json
{
  "cloudpilotVersion": 1,
  "kind": "InfrastructureChange",
  "displayName": "Create EC2 demo-server",
  "action": "create_ec2",
  "resource": {
    "type": "ec2",
    "region": "us-west-2",
    "instanceType": "t3.micro",
    "name": "demo-server"
  }
}
```

Optional metadata for apply/idempotency (Phase 3+):

```json
{
  "request_id": 14,
  "display_name_internal": "create_ec2_us-west-2_20260626_143252_15"
}
```

Filename convention: `create_demo_server.json` for MVP.

**No `applied/` folder.** History + `resource_state_after` are source of truth.

---

## Thin GitHub Action (Phase 3 — not before Phase 2 works)

Do **not** add the workflow until CloudPilot can open real PRs.

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

Alternative naming (`POST /github/apply`) is fine; one authenticated endpoint that accepts the InfrastructureChange JSON is the requirement.

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
# on merge to main — if changes/** changed
- run: |
    curl -X POST "$CLOUDPILOT_URL/remediation/apply" \
      -H "Authorization: Bearer $CLOUDPILOT_TOKEN" \
      -d @changes/create_demo_server.json
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
  "intent_path": "changes/create_demo_server.json",
  "instance_id": "i-0abc..."
}
```

---

## Undo for the demo

**Signature demo uses revert PR** — same GitHub story forward and backward.

| Step | What the audience sees |
|------|------------------------|
| Undo click | CloudPilot opens PR removing `changes/create_demo_server.json` |
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
services/config/github/
  githubClient.js               ← Phase 1 — GitHub helper (not orchestration)

test/scripts/
  createDemoPullRequest.js      ← Phase 2 — integration test / demo PR

services/remediations/          ← Phase 3+ (apply orchestration)
  remediationFunctions.js
routes/
  remediationRoutes.js          ← POST /github/apply or /remediation/apply

change/strategies/pr.js         ← Phase 4 — chat option 3

capabilities/                   ← unchanged
history/                        ← Phase 5 — saveHistory after apply
```

---

## MVP checklist

### Phase 0 — Repo scaffold (`cloudpilot_infrastructure`)

- [x] README + empty `changes/` folder
- [x] `.github/workflows/` placeholder (no workflow yet)
- [ ] Commit + push to `cloud_pilot_mvp` on GitHub

### Phase 1 — GitHub client

- [x] `services/config/github/githubClient.js`
- [x] Env: `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_DEFAULT_BRANCH`

### Phase 2 — Open one real PR

- [x] `test/scripts/createDemoPullRequest.js`
- [ ] Run script → real PR with `changes/create_demo_server.json`
- [ ] **Stop here** — demo outbound PR before Actions

### Phase 3 — Merge → apply

- [ ] `cloudpilot-apply.yml` in infra repo
- [ ] `POST /github/apply` → Atlas `create_ec2` + **saveHistory**
- [ ] E2E: merge demo PR → instance created

### Phase 4 — Chat wiring

- [ ] Replace `pr.js` stub — `create_ec2` only; request → `awaiting_merge`

### Phase 5 — History

- [ ] Same history row as automatic after PR apply

### Phase 6 — Undo revert PR

- [ ] Undo opens PR removing change file → merge → Atlas delete
- [ ] Kite undo button ([history.md](./history.md))

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
| 2026-06-27 | Phased plan 0–6; `displayName` schema; Actions deferred until PR spike works |
| 2026-06-27 | Infra repo simplified: `changes/` only; no doc/ or cloudpilot/ folder |
| 2026-06-27 | Ultra-simple MVP: JSON intent, create_ec2-only demo, PR as approval proof |
| 2026-06-27 | Delivery-strategy architecture, remediation entity, thin Actions |
| 2026-06-26 | Initial remediations doc |
