# PR Strategy — Toggle EC2 → real Terraform Pull Request

**Last reviewed:** 2026-07-19  
**Status:** Active MVP work  
**Related:** [mvp.md](./mvp.md) (demo story) · [long_term/remediations.md](./long_term/remediations.md) (older create_ec2 / JSON path)

---

## Goal (one sentence)

When the user picks **Pull Request** on `toggle_ec2`, CloudPilot opens a **real GitHub PR** that changes one Terraform line (`primary` → `secondary`) and returns the URL + diff in chat — **without** touching AWS or running Terraform.

---

## Boundary (do not build)

- [ ] No `terraform apply`
- [ ] No GitHub Actions deploy / `/github/apply`
- [ ] No AWS credentials in infra repo
- [ ] No Terraform state / S3 / DynamoDB
- [ ] No OpenAI-generated Terraform
- [ ] No auto-merge
- [ ] No Atlas calls from PR strategy
- [ ] Automatic toggle / History / Undo stay unchanged

```text
Chat → choose PR → branch → update tfvars → commit → open PR → return link
```

---

## What already exists (status check)

| Piece | Status | Notes |
|-------|--------|-------|
| `services/config/github/githubClient.js` | ✅ Done | Branch, get/create/update file, open PR |
| Env: `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_DEFAULT_BRANCH` | ✅ Done | Used by demo script + toggle PR |
| `test/scripts/createDemoPullRequest.js` | ✅ Done | Real PR with **JSON** file `changes/create_demo_server.json` (create_ec2 path — not toggle) |
| `change/strategies/pr.js` | ✅ Steps 3–4 | Real GitHub PR for `toggle_ec2` |
| Chat → PR mode wiring | ✅ Done | Passes `pendingAction` + `collected` |
| Infra repo `cloud_pilot_mvp` | ✅ Done | `environments/kite/terraform.tfvars` = `primary` on GitHub |
| Kite PR UI / View button | ✅ Done | `ChatPullRequestPanel` — View Pull Request opens GitHub |

**Prior test path (reuse, don’t rewrite):**

```text
createDemoPullRequest.js
  → githubClient.createBranch
  → githubClient.createFile
  → githubClient.openPullRequest
```

**Target path (this doc):**

```text
RequestConversation
  → buildPrStrategy(chatType, pendingAction, collected)
  → buildToggleEc2PullRequest
  → githubClient (read file → branch → update file → open PR)
  → chat message + PR URL
```

---

## Target infra layout

Repo: `davicx/cloudpilot_infrastructure`  
Base branch: `cloud_pilot_mvp`

```text
cloudpilot_infrastructure/
├── README.md
└── environments/
    └── kite/
        ├── main.tf
        ├── variables.tf
        ├── terraform.tfvars   ← only file CloudPilot edits
        └── outputs.tf
```

Base content must be:

```hcl
active_instance = "primary"
```

PR proposes:

```hcl
active_instance = "secondary"
```

Semantics (locals only — no AWS resources):

```text
primary   → t3.small
secondary → t3.micro
```

---

## Steps (testable — do in order)

### Step 0 — Confirm GitHub plumbing still works

- [x] Env present in `api/.env`: `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_DEFAULT_BRANCH` (`cloud_pilot_mvp`)
- [x] From `api/`: `node test/scripts/createDemoPullRequest.js` succeeds
- [x] Check: real PR URL printed; opens on GitHub against `cloud_pilot_mvp`
- [x] Check: uses existing `githubClient.js` (no second client)

**Pass:** You can still open *a* PR with the current token/env.

**Status (2026-07-19):** ✅ Done — opened [PR #2](https://github.com/davicx/cloudpilot_infrastructure/pull/2) (`changes/create_demo_server.json` demo path). GitHub client + env confirmed.

---

### Step 1 — Terraform under `environments/kite` on `cloud_pilot_mvp`

- [x] Create `environments/kite/{main,variables,outputs}.tf` + `terraform.tfvars` as specified in the MVP plan
- [x] Update README with “Kite Terraform Demo” section
- [x] Local check: `cd environments/kite && terraform fmt && terraform init -backend=false && terraform validate` → Success
- [x] Commit + push to `cloud_pilot_mvp`
- [x] **Check on GitHub:** `environments/kite/terraform.tfvars` is exactly `active_instance = "primary"`
- [x] Clean up / ignore old root-level `main.tf` / `variables.tf` / `terraform.tfvars` if they conflict (local PR-1 leftovers)

**Pass:** GitHub shows the kite tfvars file with `primary`.

**Status (2026-07-19):** ✅ Done — commit `de73f40` on `cloud_pilot_mvp`. File: [environments/kite/terraform.tfvars](https://github.com/davicx/cloudpilot_infrastructure/blob/cloud_pilot_mvp/environments/kite/terraform.tfvars) = `active_instance = "primary"`. Root-level leftover tf files removed (never pushed).

---

### Step 2 — Chat-only diff (no GitHub yet)

Mirror CLI: when PR mode + `toggle_ec2`, return message with before/after + “No AWS changes applied.”

- [x] Add `change/pr/prTemplates.js` → change builder
- [x] Wire `RequestConversation` → `buildPrStrategy(chatType, pendingAction, collected)`
- [x] `pr.js`: `toggle_ec2` → template message; other actions → unsupported
- [x] **Check in chat:** pick PR on toggle → see primary→secondary diff (no URL required yet)

**Pass:** “Coming Soon” gone for toggle; diff visible in chat.

**Status (2026-07-19):** ✅ Done as preview, then superseded by Steps 3–4 (real PR). Preview code path replaced.

---

### Step 3 — Read + validate base file before mutating

- [x] Add/reuse GitHub “get file content” on `githubClient` if missing
- [x] Read `environments/kite/terraform.tfvars` from `cloud_pilot_mvp`
- [x] Normalize newlines; require exact `active_instance = "primary"`
- [x] If already `secondary` or missing → **stop**; clear chat error (no branch)

**Pass:** Manual test with wrong content refuses PR; correct content continues.

**Status (2026-07-19):** ✅ Done — `getFile` + validate in `createToggleEc2PullRequest.js`.

---

### Step 4 — Branch + commit + open real PR

- [x] Create branch e.g. `cloudpilot/toggle-kite-to-secondary-<id>` from `cloud_pilot_mvp`
- [x] Update only `environments/kite/terraform.tfvars` → `secondary`
- [x] Commit message: `Switch Kite to secondary EC2 instance`
- [x] Open PR: base `cloud_pilot_mvp`, title like `Switch Kite from t3.small to t3.micro`
- [x] PR body includes summary + markers (`CloudPilot-Action: toggle_ec2`, `CloudPilot-Target: secondary`)
- [x] Never log `GITHUB_TOKEN`
- [x] **Check:** open returned URL; one-line Terraform diff; no AWS change

**Pass:** Real PR exists with the expected diff.

**Status (2026-07-19):** ✅ Done — smoke test opened [PR #3](https://github.com/davicx/cloudpilot_infrastructure/pull/3).

---

### Step 5 — Chat response + Kite link

- [x] `cloudPilotMessage` includes title, repo, file, diff, “No AWS changes have been applied.”
- [x] Include `pullRequestUrl` in strategy payload / atlasResponse
- [x] Kite: show compact PR result; **View Pull Request** opens URL in a new tab
- [ ] **Check:** end-to-end from chat option 3 → clickable/openable GitHub link

**Pass:** Demo beat works without leaving “Coming Soon.”

**Status (2026-07-19):** ✅ Done — `ChatPullRequestPanel` in Kite. Verify once in chat.

---

### Step 6 — Repeat-demo safety (minimum)

- [x] Base already `secondary` → refuse (Step 3)
- [x] Unique branch names OR return existing open toggle PR if found
- [x] Failure after branch create → honest message + stage name; log branch for cleanup
- [x] **Check:** run demo twice without confusing empty PRs / lying diffs

**Pass:** Second run is safe and understandable.

**Status (2026-07-19):** ✅ Done — reuses open PR marked `CloudPilot-Action: toggle_ec2` (smoke: stage `existing` → PR #3).  
**Demo loop:** show PR → **close** it on GitHub (don’t merge) → run Pull Request again → new PR. Base stays `primary`.

---

### Step 7 — Manual E2E (definition of done)

Reset base to `primary`, then:

1. Toggle flow in chat → choose **Pull Request**
2. Chat shows diff + “no AWS applied” + PR link
3. GitHub PR: base `cloud_pilot_mvp`, file `environments/kite/terraform.tfvars`, one-line change
4. Do **not** merge for this beat
5. Separately: **Automatic** still toggles AWS; History + Undo still work

**Pass checklist:**

- [ ] Valid Terraform under `environments/kite` on GitHub
- [ ] Base = `primary`
- [ ] `toggle_ec2` + PR creates branch + real PR
- [ ] Diff is primary → secondary only
- [ ] Chat shows URL + no-AWS wording
- [ ] Atlas not called from PR path
- [ ] Automatic / History / Undo unchanged

---

## Config (reuse existing names)

| Env var | Example |
|---------|---------|
| `GITHUB_TOKEN` | (secret) |
| `GITHUB_OWNER` | `davicx` |
| `GITHUB_REPO` | `cloudpilot_infrastructure` |
| `GITHUB_DEFAULT_BRANCH` | `cloud_pilot_mvp` |

Optional later (only if needed): `GITHUB_INFRA_TOGGLE_FILE=environments/kite/terraform.tfvars` — prefer constants in the toggle builder for MVP.

---

## Tests (when coding Steps 2–4)

- [ ] Unit: builder returns path/before/after for primary→secondary
- [ ] Unit: base file already secondary → no branch
- [ ] Unit: `create_ec2` → unsupported PR response
- [ ] Mocked integration: read → branch → update → open PR (no live GitHub in CI)

---

## Demo story (room)

1. Scan / discuss: primary `t3.small`, secondary `t3.micro` ready  
2. **Pull Request** → real Terraform PR (review only)  
3. **Automatic** → Atlas toggle AWS  
4. History → Undo  

Same change, two delivery modes.

---

## Suggested next action

Start at **Step 0** (confirm script still opens a PR), then **Step 1** (move Terraform to `environments/kite` and push). Do not wire chat until Step 1 is green on GitHub.
