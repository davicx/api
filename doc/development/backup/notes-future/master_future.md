# Master future

Every note in `api/doc/development/future`, copied into this file. The original notes are unchanged.

This is a reading copy. When a source note changes, update this file from that note.

## Contents

### Overview

- `future.md` — Future work. Status: Later UI feature. Do not redesign current AI / understanding work around this.
- `current_development.md` — Current Development — What We Are Working On
- `to_do.md` — To Do
- `mvp.md` — MVP — One magical vertical slice (EC2). Status: Active — all other product work lives in [future/](../future/).

### Scans and remediation

- `scans.md` — Scans — MVP
- `make_scans_useful.md` — Make scans useful — conversation-first UX
- `remediations.md` — Remediations — delivery strategies & PR workflow. Status today: Chat option 3 → `change/strategies/pr.js` (*“coming soon”*). Automatic delivery (option 4) shipped with history + undo. Phase 0 repo scaffold on `cloudpilot_infrastructure`. Phase 1 `services/config/github/githubClient.js` built. Phase 2 `test/scripts/createDemoPullRequest.js` ready to run. No apply workflow, no `/github/apply`, no chat wiring yet.
- `feature_s3_versioning_remediation.md` — Feature: S3 versioning remediation
- `feature_s3_remediation_modes.md` — S3 remediation modes (later). Status: Future — not started
- `feature_mvp_ec2_operating_boundary.md` — CloudPilot MVP — EC2 Operating Boundary (ARCHIVED). Status: Archived — superseded

### Chat

- `feature_better_chat.md` — CloudPilot — Scan Conversation MVP. Status: Future — deferred from current (2026-09-23). Some small slices already landed; the rest is not active work.
- `feature_conversation.md` — Feature Conversation. Status: Active
- `feature_chat_guardrails.md` — Feature Chat Guardrails — Off-Topic Conversation. see Status section
- `feature_message_reply_followups.md` — Message Reply Follow-ups — After Important Fixes. Status: Future — open: #1 provider architecture · #4 responsibility leaks

### Costs and billing

- `billing.md` — Billing — Phase B1
- `feature_understand_costs.md` — Feature: Understand AWS Costs. Status: Future — deferred from current (2026-09-23). Not started.
- `feature_spending_hard_limit.md` — Spending Hard Limit — AWS + OpenAI. see Status section

### Capability layer

- `capability_migration.md` — CloudPilot Capability Layer — Single Function Entry Points. Status: Planned — no code until Step C1.
- `single_capabiity_change.md` — Capability Layer — New & Changed Files
- `step_one_cleanup.md` — Step One — Cleanup (before Capability Layer). Status: Planned — not started.

### Safety and cleanup

- `feature_cloud_pilot_safety.md` — CloudPilot Safety. Status: Active
- `feature_clean_cloudpilot_folder.md` — Feature: Clean `cloudPilot/` folder. Status: Future — deferred from current (2026-09-23). Inspection only. Do not refactor until we decide.
- `feature_clean_cloudpilotintelligence_folder.md` — Feature: Clean `cloudPilotIntelligence/` folder. Status: Future — deferred from current (2026-09-23). Architecture ideas only. Do not code / do not add or rename folders yet.
- `feature_code_reorganize.md` — Feature Code Reorganize — moved

### Other

- `feature_github_pull_requests.md` — GitHub Pull Requests. Status: Future — deferred Step 7 E2E
- `future_services.md` — Future services — integrations (post-MVP). Status: Deferred — not MVP scope
- `updatingChatMyFindings.js` — updatingChatMyFindings.js



---

# Source: `future.md`

# Future work

**Last reviewed:** 2026-08-14

> **Active plans:** [scans.md](./scans.md) · [billing.md](./billing.md) · [history.md](../finished/history.md) · **Shipped:** [finished.md](../finished/finished.md) · **Platform:** [To_do.md](./to_do.md)  
> **Chat backlog:** [feature_chat_guardrails.md](./feature_chat_guardrails.md) (after [feature_chat](../finished/feature_chat.md))  
> **Naming / folders (finished):** [feature_important_fixes.md](../finished/feature_important_fixes.md) · leftovers: [feature_message_reply_followups.md](./feature_message_reply_followups.md)  
> **PR demo (deferred):** [feature_github_pull_requests.md](./feature_github_pull_requests.md)  
> **S3 remediations (later):** [feature_s3_remediation_modes.md](./feature_s3_remediation_modes.md)  
> **Integrations (post-MVP):** [future_services.md](./future_services.md)

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

## Chat — off-topic guardrails (later)

**Do nothing for MVP demos.** Spec: [feature_chat_guardrails.md](./feature_chat_guardrails.md).

Allow occasional casual chat; after a **consecutive** off-topic streak (~4), deterministic redirect back to tech / AWS / engineering. Reset streak on any in-domain turn. Broad in-domain (not AWS-only).

Ship after friendlier request-field presentation — [feature_chat](../finished/feature_chat.md) (done).

---

## S3 remediation modes (later)

Moved out of Friendly Dashboard Step 6. Spec: [feature_s3_remediation_modes.md](./feature_s3_remediation_modes.md).

S3 Fix stays Chat “coming soon” until a real S3 action works end-to-end. Then reuse EC2 modes (Automatic / Instructions / CLI / PR).

Shipped dashboard UX: [feature_friendly_dashboard.md](../finished/feature_friendly_dashboard.md).

---

## GitHub Pull Requests (deferred)

Moved out of current. Spec: [feature_github_pull_requests.md](./feature_github_pull_requests.md).

Steps 0–6 largely shipped; **Step 7 manual E2E** still open. Pick up when ready to finish the PR demo path, then archive to finished.

Also see older remediations plan: [remediations.md](./remediations.md).

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



---

# Source: `current_development.md`

# Current Development — What We Are Working On

**Last updated:** 2026-08-29  

This is the active-work dashboard. It contains only features we are working on now.

## End-of-day handoff — 2026-08-29

[Useful Price](../finished/feature_useful_price.md) shipped
(create/scan cost speak, pause ~24h savings, `ec2_compute_cost` Question).
Earlier: [Feature Chat](../finished/feature_chat.md), [Friendly Dashboard](../finished/feature_friendly_dashboard.md).
MVP boundary remains in [CloudPilot MVP](../feature_mvp.md)
([archived EC2 operate MVP](../future/feature_mvp_ec2_operating_boundary.md)).
Finished work lives in [finished/](../finished/finished.md).

## How to use these docs

- Each active feature is named `feature_<name>.md`.
- Start at **What this does**, then check **Current step**.
- Say “do Step 1” or “do Step A” when you want to continue.
- Completed work moves to `../finished/`.
- Deferred / later work moves to `../future/`.
- Reusable developer recipes live in `../how_to/`.
- Architecture decisions live in `../architecture/`.

## Active Features

| Feature | What it does | Current step |
|---------|--------------|--------------|
| [Feature Conversation](./feature_conversation.md) | Better conversation now (Phase 1); tools / broader AWS / memory / remediations later (Phases 2–6). | Plan locked — **Phase 1 awaiting start** |
| [CloudPilot MVP](../feature_mvp.md) | Canonical: Find → Understand → Explain → Act → Verify (EC2 + S3); Terraform resize PR preview only. | Active — track **works / passed** |
| [Spending Hard Limit](./feature_spending_hard_limit.md) | Monthly **hard cap** on AWS (Cost Explorer) + OpenAI; block paid actions at limit. | Plan locked — **Phase 1 = Safety (OpenAI) awaiting Step 1** |
| [CloudPilot Safety](./feature_cloud_pilot_safety.md) | Phase 1 detail: OpenAI gate only (`cloud_pilot_safety` + `checkSpendingLimit`). | Plan locked — **awaiting Step 1** |

## Just finished

| Feature | What shipped |
|---------|----------------|
| [Useful Price](../finished/feature_useful_price.md) | Hourly rates → create/scan/pause estimates + “what am I paying?” Question |
| [Important Fixes](../finished/feature_important_fixes.md) | Turn + Message / Response / Message Reply vocabulary; speak/present/friendly renames — [follow-ups](../future/feature_message_reply_followups.md) |
| [Intelligence Provider](../finished/feature_intelligence_provider.md) | Search TASK family: one context object → Internal \| OpenAI → same result; [how-to](../how_to/intelligence_provider.md) |
| [Feature Chat](../finished/feature_chat.md) | Friendly request presentation when OpenAI is on; templates stay Internal + fallback |
| [Friendly Dashboard](../finished/feature_friendly_dashboard.md) | S3 findings-first Dashboard; Fix→Chat coming soon; original tables behind View original tables |
| [S3 inventory ask](../finished/feature_s3_inventory_ask.md) | Natural “what S3 buckets do I have?” → Question `s3_inventory` → `scan_s3` |
| [Organizational Knowledge](../finished/feature_organizational_knowledge.md) | S3 org facts + tags; search extract → DB resolve → Chat Knowledge / Internal speak |

## Useful References

- [How-to guides](../how_to/how_to_guides.md) — including [CloudPilot Context](../how_to/cloud_pilot_context.md), [Intelligence Provider](../how_to/intelligence_provider.md), and [inventory question → scan](../how_to/route_inventory_question_to_scan.md)
- [Architecture](../architecture/)
- [Finished work](../finished/finished.md)
- [Future ideas](../future/future.md) — including [GitHub Pull Requests](../future/feature_github_pull_requests.md) and [S3 remediation modes](../future/feature_s3_remediation_modes.md)
- [Environment example](../../sample_env.md)

## Safety

Master AI switch: **`CLOUDPILOT_AI_ENABLED`** in `api/.env` (false = all GenAI off).
Restart the API after changing it. Turn it on only when testing a feature that
explicitly says to do so.



---

# Source: `to_do.md`

# To Do

**Last reviewed:** 2026-08-04

> **Active work:** [Current Development](../current/current_development.md) · **[Organizational Knowledge (finished)](../finished/feature_organizational_knowledge.md)** · [billing.md](./billing.md) · [scans.md](./scans.md) · **[remediations.md](./remediations.md)**  
> **Architecture refactor (finished):** **[responsibility_refactor.md](../finished/responsibility_refactor.md)** · **Finished index:** [finished.md](../finished/finished.md)  
> **History (MVP done):** [history.md](../finished/history.md) · **Deferred:** [future_work.md](./future.md)  
> **Done:** [finished.md](../finished/finished.md) · **Architecture & reference:** [architecture/](../architecture/)

---

## Checklist (in order)

### Current

**History MVP is complete** — see [history.md](../finished/history.md) and [finished.md](../finished/finished.md). Deferred history items: [future_work.md](./future.md).

**Active product areas:** [billing.md](./billing.md) (B1 shipped; polish optional). **GitHub pull requests (future):** [feature_github_pull_requests.md](./feature_github_pull_requests.md). **Friendly Create EC2 (finished):** [feature_friendly_create_instance.md](../finished/feature_friendly_create_instance.md). **AI:** [Current Development](../current/current_development.md). **CloudPilot Context (finished):** [feature_cloud_pilot_context.md](../finished/feature_cloud_pilot_context.md). **CloudPilot Images (finished):** [feature_images.md](../finished/feature_images.md). **Questions (finished):** [feature_questions.md](../finished/feature_questions.md). **AI spending (finished):** [feature_ai_spending.md](../finished/feature_ai_spending.md). **CloudPilot org work (finished A/B/C):** [finished.md](../finished/finished.md).

#### OpenAI Logging — [feature_openai_logs.md](../finished/feature_openai_logs.md) (finished)
- [x] Phase 1 — header `OPENAI: <Capability> (Request N)` + per-message counter
- [x] Phase 2 — all current AI paths use the same logger
- [x] Phase 3 — docs; optional `CLOUDPILOT_OPENAI_LOG_LEVEL=summary|verbose` deferred

#### Questions / Open Requests — [feature_questions.md](../finished/feature_questions.md) (finished)
- [x] Phase 1 — chat answer for “What open requests do I have?” (Internal; no table yet)
- [ ] Phase 2 — Navigator table in chat (see [open_requests.md](../architecture/open_requests.md))
- [ ] Phase 3 — Dashboard
- [ ] Phase 4 — Multi-open (later; today one open per conversation)

#### Remediations — PR delivery (phased — [remediations.md](./remediations.md))

- [x] Phase 0 — `cloudpilot_infrastructure` repo scaffold
- [x] Phase 1 — `config/github/githubClient.js`
- [x] Phase 2 script — `test/scripts/createDemoPullRequest.js`
- [ ] Phase 2 run — real PR on GitHub (stop here until demo works)
- [ ] Phase 3 — `cloudpilot-apply.yml` + `POST /github/apply` + Atlas
- [ ] Phase 4 — wire `change/strategies/pr.js` (`create_ec2` only)
- [ ] Phase 5 — history after PR apply
- [ ] Phase 6 — undo revert PR

#### CloudPilot AI ([Current Development](../current/current_development.md))

Shared (shipped)
- [x] Context + conversation history foundation
- [x] Master + per-feature ENV (`cloudPilotAIConfig.js`)
- [x] Region OpenAI + situation context + region logs
- [x] Message response OpenAI path (see [use_openai_chat.md](../how_to/use_openai_chat.md))
- [x] Demo chat list documented (Section B5)

**AI Invocation Rules — done** ([cloud_pilot_openai_rollout.md](../finished/cloud_pilot_openai_rollout.md))
- [x] `shouldRunRegionSearch()` + Internal Region Search (OpenAI ENV off)
- [x] Internal General Chat verified (OpenAI ENV off)
- [x] Capabilities `shouldRespondCapabilities` + Internal / OpenAI path (ENV off)

**Next / deferred**
- [x] OpenAI logging — [feature_openai_logs.md](../finished/feature_openai_logs.md) (finished 2026-08-04):
  - `OPENAI: <Capability> (Request N)` per invocation
  - reset N each user message
  - Messages / Response / Usage kept
  - `CLOUDPILOT_OPENAI_LOGS` on/off
  - compact `STEP 3: Region Search` stays separate (`CLOUDPILOT_REGION_LOGS`)
  - `CLOUDPILOT_CONTEXT_LOGS` / `CLOUDPILOT_ACTION_STATE_LOGS` / `CLOUDPILOT_MESSAGE_LOGS` stay independent
- [ ] Stage 2 region: same-turn “Scan EC2 in Oregon” without open request yet
- [ ] Optional local: flip Region or Message OpenAI for live test (do not commit `.env`)
- [ ] Capabilities docs polish (README / examples) — [cloud_pilot_capabilities.md](../finished/cloud_pilot_capabilities.md)
- [ ] Ambiguous region clarify (Section D) — after demo MVP
- [ ] OpenAI action search implementation before `CLOUDPILOT_ACTION_SEARCH=openai`

Feature 3 — broader intent — see current_development Section E
- [ ] Router + rules parser untouched; validate vs `actionMap`
- [ ] Fall back to rules on AI failure; STEP 3 engine logs
- [ ] Region FOUND / AMBIGUOUS / NOT PROVIDED — see [future_work.md](./future.md#ai-region-understanding--ambiguous-vs-not-provided)

Feature 1 — Explain findings
- [ ] Curated findings → prioritized friendly chat; Navigator unchanged
- [ ] Knowledge snippets per `rule_id` (quality)

Feature 2 — Friendly request conversations
- [ ] Natural **one-field-at-a-time** asks; hide checklist / field ids
- [ ] Suggest defaults from history; structured fallback forever

- [ ] Dashboard summary — deferred (see doc)

#### AI Usage — OpenAI spend ([feature_ai_spending.md](../finished/feature_ai_spending.md)) (finished)

- [x] Persist `usage` → `cloud_pilot_ai_usage` + `calculateOpenAICost` (after successful OpenAI calls)
- [x] `GET /ai/usage/summary`
- [x] Chat `show_ai_usage` (OpenAI only; AWS+AI combo deferred)
- [x] Kite AI Usage card
- [x] `searchForAiSpend()` value detect (Internal \| OpenAI)

### Future

#### Kite

- [ ] Send `conversationID` on every message
- [ ] Render `CloudPilotActionStatus` (status, missing, collected, request id, displayName)
- [ ] Render `navigatorResponse` (stats / tables from scan + inventory)
- [ ] Open actions dashboard table _(blocked on API P3C)_
- [ ] React Query cache for Navigator — `["navigator-data", groupID, conversationID]`
- [ ] Better column formatting (`currency`, `status` alignment)
- [ ] Opt-in developer `raw` mode (default off)
- [ ] Multi-open requests UI — table with **Run** per row; `run 1` disambiguation — see [future_work.md § Open requests dashboard](./future.md#open-requests-dashboard--run-when-ready)
- [ ] Learn / Test / Live mode indicator in UI (when product mode ships)

#### API — hardening & smoke

- [ ] **Field hardening P0** — EC2 ID, region, instance_type, malformed syntax + parser tests
- [ ] Test-mode smoke — create / toggle / delete / scan with Atlas Test imports
- [ ] `scan_ec2` `atlas_unreachable` parity (mutations already handle; scan may throw)
- [ ] Manual error smoke — Atlas stopped → friendly message, API stays up
- [ ] **P3C** — `open_actions` Navigator table in API response
- [ ] D2 — `cancelRequest` fully wired in `applyDecision` _(verify / finish)_
- [ ] Schema migration — `cloudpilot_actions` + `cloudpilot_requests` + `cloudpilot_executions`
- [ ] Restart mid-flow — verify DB source of truth after `display_name` fix
- [ ] `ActionState.js` memory mode — gate to tests only; remove Map when green
- [ ] `inventory_aws` request row — decide if informational inventory needs persisted row
- [ ] Implicit bare ID confirm — “Did you mean `secondary_instance_id: …`?”

#### API — capabilities & cleanup

- [ ] **Capability layer C1–C7** — [capability_migration.md](./capability_migration.md)
- [ ] **Step one cleanup U1–U3** — [architecture/step_one_cleanup.md](./step_one_cleanup.md)
- [ ] Code cleanup phases — dead comments, `functions.js` duplicates, historical `doc/code/` _(see Future details)_

#### API — product & platform

- [ ] **Saved Actions** — named reusable operations (structured request + `display_name`; `run Kite Security Scan` / fuzzy `kite security`; not “macros”)
- [ ] Learn / Test / Live modes (product vision)
- [ ] Execution persistence — `cloudpilot_executions` table
- [ ] Multi-open requests (relax one-open-per-conversation)
- [ ] Toggle by tags (`cloudpilot-role`) — no raw IDs in chat
- [ ] Delete safety — only `cloudpilot-managed=true`
- [ ] Destructive confirmation copy upgrades
- [ ] `automatic_safe` / rollback / monitoring modes
- [ ] Navigator adapters for create/delete/toggle results
- [ ] Waiters after create (running) / delete (terminated)
- [ ] Per-user / multi-account AWS credentials
- [ ] Bulk actions (“delete 5 instances” → 5 request rows)
- [ ] More actions — `resize_ec2`, security scan, cost report, RDS, IAM, Terraform
- [ ] Policy fields on routes (`allowed`, `reasonNotAllowed`)
- [ ] Wire live OpenAI in `CloudPilotMessage.speakGeneral()`
- [ ] `context.js` / `prompts.js` per conversation side

#### Scan expansion

Planning docs (bill investigation — **no code**):

- [scans.md](./scans.md) — active scan MVP (EC2 → S3 → RDS → IAM → SG → Lambda)

- [ ] `ec2_low_cpu` — only evaluate when `state == running`
- [ ] Register all EC2 rules in `rule_registry.py` (aliases per rule)
- [ ] EC2 recommendation copy pass — all demo rules
- [ ] `MOCK_SCAN_EC2_DATA` — one clean sample finding per rule for Test mode
- [ ] Navigator findings table — optional **Rule** column
- [ ] Security Groups scanner + 3 rules + `POST /scan/security-groups` + `scan_security_groups` action
- [ ] EBS scanner (later)
- [ ] RDS scanner (later)
- [ ] `scan_aws` orchestration (way later)

#### Atlas

- [ ] Test-mode smoke — confirm `(TEST MOCK)` logs on create / toggle / delete / scan
- [ ] Optional — capture live `MOCK_CREATE_DATA`
- [ ] Optional — add `Atlas Response:` log on live `POST /ec2/create`
- [ ] Toggle by tags/roles in core (MVP uses instance IDs)
- [ ] Delete safety tag gate in core
- [ ] `DEFAULT_AMIS` / AMI strategy hardening
- [ ] Waiters in create/delete responses (running / terminated)
- [ ] Product Test mode — API-driven route selection (not only `main.py` flip)

---

## Full description

### Current

See **[future_work.md](./future.md)** for deferred History items (H8, H11, targeted undo, tag polish). Platform and Kite backlog remains below.

---

### Future

#### Kite integration

Connect Kite to `POST /message`. Required: `conversationID` on every message. Render `CloudPilotActionStatus`, `navigatorResponse`, and (when P3C ships) open actions table. Polish: React Query cache, column formatting, multi-open UI, mode indicator. History dashboard: shipped — see [finished.md](../finished/finished.md).

#### API — field hardening P0

**Priority:** Before new actions (`resize_ec2`, etc.). Reject invalid EC2 IDs, regions, instance types, and malformed `field: "value"` syntax before confirm/Atlas. Parser unit tests for unclosed-quote regression.

**Touch points:** `understanding/search/`, decision/requests merge, optional `fieldValidators.js`.

#### API — capabilities & code cleanup

Standardize HOW layer under `capabilities/` (C1–C7). Pre-cleanup U1–U3 removes dead pipeline code. See [capability_migration.md](./capability_migration.md) and [step_one_cleanup.md](./step_one_cleanup.md).

#### API — Learn / Test / Live

Product modes: **Learn** (explain only), **Test** (mocks), **Live** (AWS). Today Test = Atlas `main.py` import toggle. Future: per-deployment mode, user-facing copy, Learn handlers without Atlas.

#### API — Saved Actions (future)

**Do not implement yet.** First-class **named actions** (not “macros” — people associate macros with recorded UI/scripts). Solves real usability: stop re-entering the same fields for frequent operations.

**Flow:**

```text
scan kite s3 for security issues
  → action: scan_s3, parameters: { bucket, scan_type, region, … }
Save as "Kite Security Scan"
  …
run Kite Security Scan
  or even: kite security
```

Same for changes:

```text
toggle kite backup off
  → action: update_ec2_tag, instance, tag, value
CloudPilot still confirms:
  "This will update Enabled on Kite Backup from true to false. Continue?"
```

**Store the structured request, not chat text:**

```json
{
  "action": "scan_s3",
  "parameters": {
    "bucket": "kite",
    "scan_type": "security"
  },
  "display_name": "Kite Security Scan"
}
```

If NLU improves later, saved actions still work — they are not tied to the original utterance.

**Product surface:**

```text
Saved Actions
  • Kite Security Scan
  • Daily Cost Scan
  • Toggle Backup
  • Deploy Dev
  • Resize Web Server
```

Chat: `Run Daily Cost Scan` / `Run Toggle Backup`.

**Pairs with History / Undo (three complementary concepts):**

| Concept | Role |
|---------|------|
| **Scan** | Discover resources |
| **Saved Actions** | Reusable operations (things users do often) |
| **History** | Completed operations (things already done) |
| **Undo** | Reverse a completed change |

```text
Saved Actions → Run "Toggle Backup" → History → Undo
```

**Depends on:** durable named action store (may start as `request_name` / `display_name` on requests, later first-class table), resolve by name / fuzzy match, confirm before destructive runs.

**Related:** multi-open requests, P3C Run button, soft-fill from last scan, [future_work.md](./future.md).

#### API — execution & requests

`cloudpilot_executions` audit table; multi-open requests; `operation_id`; long-running runs survive restart.

#### Scan expansion

**Principle:** See [scans.md](./scans.md) for service order and MVP rules. Quality bar: plain-English title, severity, category, concrete recommendation. S3 demo tier shipped — [finished.md](../finished/finished.md).

#### Atlas (future)

Tag-based toggle, delete safety gates, AMI hardening, waiters, API-driven Test mode.

#### Deprecated / rename (when ready)

- `atlas_actions` table — superseded by `cloudpilot_requests`
- `workflowId` → `requestId` rename pass in code identifiers



---

# Source: `mvp.md`

# MVP — One magical vertical slice (EC2)

**Last reviewed:** 2026-07-17

**Status:** Active — all other product work lives in [future/](../future/).

> **Active work:** [Current Development](../current/current_development.md)  
> **Architecture & how-to:** [Architecture](../architecture/architecture.md) · [How-to guides](../how_to/how_to_guides.md)  
> **Deferred:** [to_do.md](./to_do.md) · [scans.md](./scans.md) · [remediations.md](./remediations.md)

---

## Opening line (say this first)

> **CloudPilot helps engineers understand, change, and safely manage AWS infrastructure.**

Then the whole demo maps to one story:

| Capability | Demo beat |
|------------|-----------|
| **Understand** | Scan + Chat (“Why?”) |
| **Recommend** | Switch workload to prepared `t3.micro` |
| **Change** | Instructions / CLI / PR / Automatic |
| **Trust** | History + Undo |

**Locked narrative: Option A — two-instance switch/toggle.**  
Do **not** tell a one-instance “resize in place” story for MVP. If you only have one live instance, there is nothing to toggle to.

**Stop adding demo scenarios after this.** This is already a strong ~6-minute MVP. Polish the loop and put it in front of engineers.

---

## Locked setup: Option A (two instances)

**Why Option A (not Option B):** MVP already has primary / secondary / toggle / history / undo. Option A uses that. Option B (single instance resize + undo resize) is closer to some real customers, but needs a real EC2 resize path and throws away the toggle work — skip for MVP.

### Before the demo starts

| Instance | Type | State |
|----------|------|-------|
| `production-small` | `t3.small` | 🟢 **Running** (production) |
| `production-micro` | `t3.micro` | ⚪ **Stopped** (standby / prepared replacement) |

You don’t need a long explanation. Just say:

> "I've already prepared a smaller replacement instance."

CloudPilot’s job in the room is to **switch production over** — not invent a resize engine.

### Option B (not MVP — one instance)

One running `t3.small` → recommend resize to `t3.micro` → Automatic resizes → Undo resizes back. Cleaner “real customer” story someday; **not** the locked MVP path.

---

## Super simple To Do list

Run end-to-end before calling MVP done.

### 0) Pre-demo setup

- [ ] `production-small` (`t3.small`) — **Running**
- [ ] `production-micro` (`t3.micro`) — **Stopped**
- [ ] Dashboard clean; history empty / quiet

### 1) Existing environment

- [ ] Show production: running small
- [ ] Standby micro visible as prepared (stopped)
- [ ] Line: *“I've already prepared a smaller replacement instance.”*

### 2) Generate changes (optional short beat)

Show that CloudPilot can **generate** (how you could prepare a replacement). **Do not execute create in the room.**

- [ ] Instructions
- [ ] CLI
- [ ] _(Skip)_ Automatic create
- [ ] _(Skip)_ Create Pull Request

### 3) Scan

- [ ] Finding: running small is underutilized / low CPU
- [ ] Recommendation: switch workload to the prepared micro
- [ ] Ask “Why?” → CloudPilot explains in plain English

### 4) Apply recommendation — **PR (centerpiece)**

- [ ] Mode picker: Instructions / CLI / **Pull Request** / Automatic
- [ ] Demo selects **Pull Request**
- [ ] Tiny Terraform diff shown (IaC story for the switch)
- [ ] PR created confirmation

### 5) Production change — Automatic (toggle)

- [ ] After “PR reviewed and merged,” **Automatic** performs the switch
- [ ] Start `production-micro` / stop `production-small` (toggle)
- [ ] Shows CloudPilot can execute approved actions — not only generate code

### 6) Traffic spike → History + Undo

- [ ] Traffic increased (simulated is fine)
- [ ] Recommend returning to the larger instance
- [ ] History shows the switch
- [ ] **Undo** switches back (micro stopped / small running again)
- [ ] End

---

## Demo story (words)

### Pre-demo

Account already has:

- 🟢 `production-small` (`t3.small`) — Running  
- ⚪ `production-micro` (`t3.micro`) — Stopped  

---

### 1. Existing environment

> "Here's my production environment."

Running small is live. Micro is the prepared standby.

> "I've already prepared a smaller replacement instance."

---

### 2. Generate changes (optional)

> "CloudPilot can also generate the steps to prepare a replacement — Instructions or CLI — if you want to run them yourself."

Show briefly. **Don't execute create** during the demo. The standby is already there.

---

### 3. Scan

> "Let's see what CloudPilot notices."

Finding:

- Low CPU on the running small
- Recommendation:

  > "This workload appears overprovisioned. I recommend switching to the prepared t3.micro."

Ask:

> "Why?"

CloudPilot explains in plain English.

---

### 4. Apply recommendation (PR)

This is the centerpiece.

CloudPilot:

> I recommend switching this workload to the prepared t3.micro.

Execution options:

- Instructions
- CLI
- **Pull Request** ← Demo
- Automatic

Show a tiny Terraform diff (IaC representation of the switch / preferred instance).

```diff
resource "aws_instance" "kite_env" {
-  instance_type = "t3.small"
+  instance_type = "t3.micro"
}
```

PR created.

This is the moment people remember.

---

### 5. Production change (Automatic toggle)

> "After the PR is reviewed and merged, CloudPilot can perform the change."

Use **Automatic**:

- Start `production-micro`
- Stop `production-small`

This demonstrates that CloudPilot isn't just generating code — it can also execute approved actions.

---

### 6. Traffic spike → History + Undo

A few minutes later...

> "Traffic increased."

Whether it's simulated or not doesn't matter.

CloudPilot recommends returning to the larger instance.

Show **History**, then **Undo** — switches back to the original state (small running, micro stopped).

```text
History

✓ Generated switch pull request
✓ Switched workload to production-micro
Undo
```

Click Undo.

Everything returns to the original state.

End.

---

## Official demo goal

> Start with two instances: running `t3.small` + stopped `t3.micro`. Scan finds the small underutilized and recommends switching to the prepared micro. Apply via **Pull Request** (tiny Terraform). After “merge,” **Automatic** toggles (start micro / stop small). On a traffic spike, **Undo** from History switches back. End.

**Story constraint:** Keep Terraform intentionally tiny. Automatic = toggle you already have — not a live EC2 resize API for MVP.

**Mode map (locked):**

| Beat | Mode | Why |
|------|------|-----|
| Optional generate | Instructions + CLI only | CloudPilot **generates**; standby already prepared |
| Apply recommendation | **Pull Request** | Enterprise climax — tiny, believable IaC |
| Production change (post-merge) | **Automatic** | Toggle: start micro / stop small |
| Traffic spike | **Undo** (from History) | Trust — restore original primary |
| History | Shows PR + switch | Trust |

---

## Goal (one sentence)

**Understand → recommend switch → change (PR + Automatic toggle) → trust (History/Undo) — about a 6-minute demo on two prepared instances.**

Not: “CloudPilot scans EC2, S3, RDS, IAM…”  
Not: one-instance live resize for MVP  
Yes: *“This understands infrastructure and fits how we ship changes.”*

---

## Milestone filter

Before starting any task, ask:

> Does this make the **demo To Do list above** clearer, or is it platform sprawl?

If sprawl → [future/](../future/). **Hide, don’t delete.**  
**Do not add more demo scenarios** until this loop is polished and shown to real users.

---

## What “coming soon” means (hide, not remove)

Keep code; remove from default chat/demo path:

| Hidden for MVP | Still in repo |
|----------------|---------------|
| `scan_s3`, `inventory_aws` (broad), RDS, pipeline scans | Handlers, Atlas routes, docs in `future/` |
| Extra EC2 rules (public IP, legacy type, stopped instance, …) | Rule files + registry entries |
| Multi-open requests UI, capability migration, new service scans | [future/to_do.md](../future/to_do.md) |
| Full Navigator wall (stats + instances + findings tables) | Adapters stay; MVP shows **decision card** first |
| Real EC2 resize-in-place (Option B) | Later — use toggle for MVP |

**Product label in chat when user asks for hidden features:** “Coming soon — we’re perfecting EC2 first.”

**Mode 3 (PR) is MVP for the apply-recommendation beat** — not deferred. Keep create-instance PR out of the primary demo path (too noisy); use a tiny Terraform story for the preferred instance / switch.

---

## Demo script (acceptance test)

Same story as the To Do list — scripted for speaking aloud. ~6 minutes.

### Pre-demo

`production-small` running. `production-micro` stopped.

### Beat 1 — Existing environment

> "Here's my production environment. I've already prepared a smaller replacement instance."

### Beat 2 — Generate (optional)

Briefly show Instructions / CLI as generate. **Don't create live.**

### Beat 3 — Scan + Why

> "Let's see what CloudPilot notices."

Running small underutilized. Recommend switch to prepared micro. Ask **“Why?”**

### Beat 4 — Apply via Pull Request (centerpiece)

> I recommend switching this workload to the prepared t3.micro.

Mode picker → **Pull Request** → tiny Terraform diff → PR created.

### Beat 5 — Production change (Automatic toggle)

> "After the PR is reviewed and merged, CloudPilot can perform the change."

**Automatic:** start micro / stop small.

### Beat 6 — Traffic spike → History + Undo

> "Traffic increased."

History → **Undo** → original state (small running, micro stopped). End.

### Also verify

1. **Empty account:** friendly empty message — not Atlas error, not a finding wall.
2. **PR quality:** one-line `instance_type` change is visible and believable.
3. **Toggle reliability:** Automatic switch and Undo always leave one primary running.
4. **Teardown:** leave account in a known state after the room.

Someone should walk away saying: *“I wish AWS worked like that.”*

---

## Recommended order of work

Do these **in sequence**. Each step unlocks the next demo beat.

| Step | Milestone | Outcome |
|------|-----------|---------|
| **0** | **M0 + M0b** | MVP mode on; hidden services gated; **“What can you do?”** works |
| **1** | **M1** | Scan returns MVP rules; empty account message |
| **2** | **M2** | Decision card dashboard (not table wall) |
| **3** | **M7 (C2–C4)** | Chat explains scan in plain English (OpenAI optional) |
| **4** | **M3 + M4** | Pre-demo two instances; **PR on recommend switch**; Automatic toggle; Undo from History |
| **4b** | **M10** | Mode 1 Instructions — step table + API + simple stepper (`create_ec2`) |
| **5** | **M5 + M6** | History + Undo — trust beat |
| **6** | **M8** | Run full demo checklist; fix gaps |
| **7** | **M9** | Document pattern for S3 later |

**Start with Step 0** — users (and you) need to know what's live before scanning.

---

## Checklist (technical milestones)

### M0 — Scope lock + hide mechanism (documented — **not implemented yet**)

Principle: **hide, don’t delete.** Two small touch points — no env flags, no second registry, no commenting out huge `actionMap` blocks.

- [ ] Confirm Atlas runs on **Python 3.13** (3.14 breaks boto3 XML on macOS)
- [ ] Implement hide mechanism below when starting Step 0
- [ ] Move any stray active checklist items out of MVP into [future/to_do.md](../future/to_do.md) _(user done — keep synced)_

#### Two layers (different files)

| Layer | Controls | MVP mechanism |
|-------|----------|---------------|
| **API (Node)** | What chat can **start** — scan s3, inventory, toggle… | **One allowlist** — skip non-listed actions in action search |
| **Atlas (Python)** | Which **scan rules** run | **Comment out** entries in `get_ec2_rules()` → `all_rules` dict |

Atlas HTTP routes for S3/RDS can stay registered — harmless if the API never calls them.

---

#### API — one allowlist (preferred over commenting out `actionMap`)

**Do not** comment out whole action blocks in `actionMap.js` (~500 lines, top-level `require()`s, easy to break).

**Do** add one list and one filter:

**File:** `services/understanding/search/searchMessageForAction.js`  
(or a tiny `services/config/mvpEnabledActions.js` imported there)

```js
// MVP: only these action types are matchable from chat
const MVP_ENABLED_ACTIONS = [
    'scan_ec2',
    'create_ec2',
    'delete_ec2',
    'toggle_ec2',
    'update_ec2_tag',
    'general_chat'
];
```

**Logic:** when looping `Object.values(actionMap)`, if `action.type` is not in `MVP_ENABLED_ACTIONS`, skip (treat as no match).

**Enabled — MVP demo:**

| Action | Role |
|--------|------|
| `scan_ec2` | Find underutilized (+ optional missing Team tag) |
| `create_ec2` | Optional / pre-demo — prepare standby micro (Instructions + CLI generate; standby ready before room) |
| `toggle_ec2` | **Core demo** — Automatic switch + Undo |
| `delete_ec2` | Teardown / optional cost delete path |
| `update_ec2_tag` | Optional tag beat if still needed |
| `general_chat` | Fallback + “what can you do?” |

**Disabled — not in allowlist (handlers stay in repo for tests/manual):**

| Action | Why hidden |
|--------|------------|
| `scan_s3` | Coming soon — S3 scan wall not MVP |
| `inventory_aws` | Console-like inventory |
| `show_billing` | Separate product beat |

**Alternatives (not recommended for MVP):**

| Approach | Verdict |
|----------|---------|
| Comment out entire `actionMap` entries + `require()` | Fragile — avoid |
| Set each hidden `match: () => false` | Works but scattered — worse than one list |
| `CLOUDPILOT_MVP_MODE` env + two registries | Overkill for now — add later if needed |

**Uncomment / extend allowlist** when S3 is ready for demo — one line per action.

---

#### Atlas — comment out scan rules (simplest for Python)

**File:** `atlas/app/core/engine/rule_registry.py` → `get_ec2_rules()` → `all_rules` dict

**Leave uncommented (MVP — low CPU is required; Team tag optional):**

```text
low_cpu / ec2_low_cpu
missing_team_tag / ec2_missing_team_tag   ← optional second finding
```

**Comment out** everything else in that dict, e.g.:

```text
missing_name_tag, stopped_instance, legacy_instance_type, public_ip_attached, …
```

Same pattern for `get_s3_rules()` if S3 scan is ever hit directly — comment out all S3 rules or leave file untouched (API won’t call `/scan/s3` in MVP).

**Do not comment out:**

- Rule **files** under `core/cloud/ec2/rules/` — keep for later
- Atlas routes in `main.py` — uncalled routes are fine
- Handler folders in API — tests may still use them

**Optional later:** API passes explicit `rules: ["low_cpu", …]` on scan — not needed if Atlas dict is the single source of truth for MVP.

---

#### “What can you do?” — separate from allowlist

Capabilities onboarding (**M0b**) uses a **static manifest** — not `Object.values(actionMap)`.

Why: friendly wording, no leaked hidden actions, no dependency on match functions.

Allowlist = what chat can **trigger**. Manifest = what we **tell the user** we support.

---

#### When user asks for a hidden service

No error. Template (see M0b):

> S3 and RDS are coming soon — right now I can help with EC2 (scan, create, switch, tags, undo).

---

#### Restore checklist (when expanding beyond MVP)

1. Add action type to `MVP_ENABLED_ACTIONS`
2. Uncomment rules in `rule_registry.py`
3. Update M0b capability manifest copy
4. Run demo script beat for that service

---

### M0b — “What can you do?” / supported services (onboarding)

User should be able to ask anytime (idle chat, no open request):

- “What can you do?”
- “What services are supported?”
- “What can CloudPilot help with?”
- “Help”

**Target reply (MVP — EC2 only, plain English):**

```text
Right now I can help you with EC2 instances, including:

• Scanning for cost and setup issues (like underutilized instances)
• Creating instances (I can show instructions or CLI)
• Switching workloads with a pull request or automatic change
• Undoing recent changes from history

Other AWS services like S3 and RDS are coming soon. What would you like to do?
```

**Implementation notes (when coding — not now):**

- Static **MVP capabilities manifest** (one file or `actionMap` slice) — not generated from full registry (avoids listing hidden S3/RDS)
- Detect via understanding layer (`conversation` intent or `general_chat` sub-intent) — no workflow row needed
- If user asks for hidden service: short answer + “coming soon” + point back to EC2 list
- Works with `OPEN_AI_LIVE_SEND_ALL_MESSAGES_WILL_CAUSE_BILLING=false` (template) and `true` (AI may rephrase; must not invent capabilities)

- [ ] Define trigger phrases for “capabilities / help” intent
- [ ] Define MVP capability copy (EC2 bullets above)
- [ ] Hidden service ask → “Coming soon — we're perfecting EC2 first.”
- [ ] Verify reply when open request exists vs idle (still helpful; don't break workflow)

---

### M1 — EC2 scan: low CPU first, data-driven copy

**Keep for MVP demo:**

| Rule | User-facing label | Why |
|------|-------------------|-----|
| **Low CPU / underutilized** | Underutilized | Core demo finding — avg CPU %, last 7 days, savings estimate. |
| **Missing Team tag** _(optional)_ | Missing Team tag | Ownership story if still useful; not required for the PR climax. |

**Code note:** Atlas today has `ec2_missing_name_tag` (checks `Name` tag). If Team tag stays in MVP, add **`Team` tag** rule + comment out other rules per **M0 hide mechanism**.

**Turn off for MVP** — comment out in `rule_registry.py` (see M0), do not delete rule files:

- `public_ip_attached`, `legacy_instance_type`, `stopped_instance`, `missing_name_tag` (when Team rule replaces it), etc.

- [ ] MVP scan profile runs **low_cpu** (and optional Team tag) on the demo narrative
- [ ] Finding presentation: CPU %, lookback window, estimated monthly savings (even approximate)
- [ ] Atlas: empty region → `resourcesScanned: 0`, success (not 500)
- [ ] API: empty resources — *“You do not have any EC2 instances currently running in {region}.”*
- [ ] Scan openers: *“I found an underutilized instance.”* (plain language)

---

### M2 — Dashboard: decision card, not console

**Principle:** Don't build another dashboard. **Chat is the star;** dashboard shows only what's needed for the current decision.

Target layout:

```text
Potential Savings
Estimated Savings    $18/month
Resource             current primary / underutilized instance
Status               Running

Recommendations
⚠️ Underutilized      Avg CPU 2% · last 7 days
```

- [ ] API: MVP Navigator shape — **Potential Savings card + recommendation list** (not 3 full tables by default)
- [ ] Kite: summary card first; **Show AWS details** expands full tables
- [ ] No rule IDs (`ec2_low_cpu`) or AWS jargon in default UI
- [ ] User-facing label: **Recommendations** (not “Findings”)
- [ ] Underutilized row shows **metrics** (CPU %, period) — not just severity badge

---

### M3 — Demo actions by beat (modes matter)

**Pre-demo / Beat 1 — Two instances ready:**

- [ ] `production-small` running, `production-micro` stopped
- [ ] Line ready: *“I've already prepared a smaller replacement instance.”*

**Beat 2 — Generate (optional):**

- [ ] Instructions + CLI shown briefly
- [ ] Do **not** execute create in the live room
- [ ] Do **not** open a create-instance PR

**Beat 4 — Apply recommendation:** enterprise PR climax.

- [ ] Recommendation: switch workload to prepared `t3.micro`
- [ ] Mode picker shows all four options
- [ ] **Pull Request** path produces a **tiny** Terraform change
- [ ] Copy explains IaC review workflow

**Beat 5 — Production change (Automatic toggle):**

- [ ] After “PR reviewed and merged,” **Automatic** starts micro / stops small
- [ ] Uses existing toggle path — not a real resize API

**Beat 6 — Traffic spike → History + Undo:**

- [ ] Traffic spike narrative (simulated OK)
- [ ] History lists PR + switch
- [ ] **Undo** restores original primary (small running, micro stopped)

**Optional — delete teardown:**

- [ ] `delete_ec2` available for cleanup after the room

---

### M4 — Execution modes 1–4 (show all four — different beats)

All four modes appear in the **demo** — but not all on the same action.

| Mode | Label in demo | Where it shines |
|------|---------------|-----------------|
| **1** | Show Instructions | Optional generate / prepare story — **M10** loads steps from DB |
| **2** | Generate CLI | Optional generate / prepare story |
| **3** | Create Pull Request | **Apply recommendation** — enterprise climax |
| **4** | CloudPilot Fix It (Automatic) | **Production toggle** (start micro / stop small) |

- [ ] Mode picker copy clear (1–4 labels above)
- [ ] Apply beat: PR emphasized (tiny diff)
- [ ] Production beat: Automatic = toggle
- [ ] Trust beat: History + Undo (not a second Automatic required)
- [ ] Confirm → execute → friendly outcome where execution happens
- [ ] `atlas_unreachable` / Atlas 500 → clear message (Atlas running? Python 3.13?)

**Tiny Terraform tip (allowed for MVP):** one EC2 resource / one-line preferred-type change is enough. Audience doesn’t need a full account Terraform.

---

### M4b — Pull Request (toggle story — real GitHub, tiny Terraform)

> **Full checklist:** [GitHub Pull Requests](./feature_github_pull_requests.md) — use simple Step numbers.

> **Goal:** Prove CloudPilot can **prepare a PR for infrastructure changes** — not that it can edit any repo.
> **Action:** `toggle_ec2` only for the demo climax. Skip create-instance PR.
> **Where:** Node (`pr.js`) — Atlas not involved (PR prepares source; Automatic later toggles AWS).

**Infra repo:** [`cloudpilot_infrastructure`](../../../../../cloudpilot_infrastructure) — demo-only. Keep it tiny under `environments/kite/` (see GitHub Pull Requests feature).

**Same pattern as CLI:** `pr.js` → toggle builder → GitHub client.  
String replace one value. No OpenAI. No Terraform parser for MVP.

Follow [GitHub Pull Requests](./feature_github_pull_requests.md) using simple numbered Steps.

**After “merge” in the room:** Automatic = existing Atlas toggle (stop primary / start secondary). Do **not** auto-apply Terraform on merge for MVP.

**Later (not MVP):** OpenAI / parser edits richer Terraform; merge → apply workflow. Same `buildPrStrategy` entry point.

> **Note:** [future/remediations.md](../future/remediations.md) still describes an older `create_ec2` + JSON intent path. **Locked MVP demo uses toggle + Terraform tfvars instead.**

---

### M5 — Undo (demo on toggle)

History MVP is shipped — **demo undo on the Automatic toggle, not on create-PR.**

- [ ] Toggle change saves history row; copy says undo available
- [ ] History Undo → restores prior primary/standby state
- [ ] Undo failure → friendly message, conversation continues
- [ ] PR path: prepare for review — do **not** pretend PR merge is silently undone without history story

See [finished/history.md](../finished/history.md) for shipped baseline.

---

### M6 — Full demo loop

Aligns with the **super simple To Do list** at the top (**Option A**).

- [ ] Pre-demo: small running + micro stopped
- [ ] Existing environment shown; standby explained in one line
- [ ] Optional Instructions + CLI (generate only)
- [ ] Scan — underutilized small + “Why?”
- [ ] Apply recommendation — **PR**
- [ ] Production change — **Automatic toggle**
- [ ] Traffic spike → History + **Undo** → original state
- [ ] Optional teardown via `delete_ec2`

---

### M7 — CloudPilot Chat / AI ([Current Development](../current/current_development.md))

Deterministic by default; optional AI behind **three independent flags**. **Part of MVP — not a separate project.**

- [x] Context builder + conversation history foundation
- [ ] **Feature 1** — Explain findings (`OPENAI_EXPLAIN_FINDINGS`) — highest demo ROI
- [ ] **Feature 2** — Friendly request conversations (`OPENAI_FRIENDLY_REQUESTS`) — one ask at a time
- [ ] **Feature 3** — Intent understanding (`OPENAI_INTENT_UNDERSTANDING`) — same STEP 3 contract
- [ ] Templates stay for confirmations, errors, mode picker — AI enhances explanation / asks / intent only
- [ ] **Feature 4** — AI recommendations (prioritize what to do) — *not MVP*

**MVP chat example (target — scan → recommend switch):**

> This workload appears overprovisioned. I recommend switching to the prepared t3.micro. For teams using Infrastructure as Code, I can open a pull request with that change for review.

---

### M10 — Instructions Mode 1 (teach first)

**Philosophy:** CloudPilot teaches first, automates second.  
**SQL:** [cloudpilot_instructions.sql](../../sql/cloudpilot_instructions.sql)  
**Shape:** one row = one step. No `total_steps` / `current_step` in DB (UI owns progress).

```text
Teach → user builds → (later) CloudPilot validates → recommend improvements
```

#### Phase A — Data + API (MVP foundation)

- [ ] Create `cloudpilot_instructions` table (see SQL doc)
- [ ] Seed ~5–8 steps for `create_ec2` (demo-quality copy; images optional)
- [ ] API: get steps by `instruction_for`, ordered by `step_number`
- [ ] Wire Mode 1 / “Show Instructions” to that endpoint

#### Phase B — UI (MVP)

- [ ] Simple stepper: title, instruction, warnings, estimated time, Next / Back / Skip optional
- [ ] “Open in AWS Console” external link where useful
- [ ] Mark complete in UI → “Instructions finished”
- [ ] Optional screenshots per step (even 3–5 sell the story)

#### Phase C — Validate after finish (north star — after Mode 1 works)

- [ ] On finish: “I’ll quickly check that everything looks healthy…”
- [ ] Targeted scan / checks on what should exist
- [ ] Checklist results: ✓ / ⚠ with short recommendations
- [ ] Only then offer `[Fix Automatically]` for safe items

#### Phase D — Expand (later)

- [ ] More `instruction_for` keys (`toggle_ec2`, `create_s3`, …)
- [ ] Image annotations / highlight rectangles
- [ ] Org-specific instruction overrides (if needed)

**Warnings JSON example:**

```json
[
  { "type": "cost", "message": "Choose t3.micro to stay in Free Tier." },
  { "type": "security", "message": "Do not allow SSH from 0.0.0.0/0." }
]
```

---

### M8 — Polish & demo hardening

- [ ] Run **super simple To Do list** end-to-end (~6 minutes)
- [ ] Test mode smoke: Atlas test routes for scan + toggle without AWS
- [ ] Kite: `conversationID` on every message (if not already)
- [ ] Remove or gate developer noise from default UI (raw Atlas, STEP logs in prod)
- [ ] Confirm PR screenshot / chat confirmation shows the tiny `instance_type` diff

---

### M9 — MVP done → unhide pattern

Only after M0–M8 green:

- [ ] Write “vertical slice pattern” note (scan → explain → deliver via mode → undo → cost) for S3 reuse
- [ ] Pull first item from [future/scans.md](../future/scans.md) using **same UX**, not new dashboard

---

## Explicitly not MVP (see long_term)

- S3 / RDS / pipeline scan expansion
- Create-instance Pull Request as the star of the demo (noisy Terraform)
- One-instance live resize (Option B) as the MVP path
- More demo scenarios beyond the locked Option A switch story
- Instruction image highlight rectangles / annotated overlays (M10 Phase D)
- Post-instruction mentor validate loop before Mode 1 steps ship (M10 Phase C — north star, not blocker)
- 10+ rules per service
- Multi-open requests, saved actions, Learn/Test/Live product modes
- Capability migration cleanup
- Billing automation beyond cost **display** in chat

---

## Related docs

| Doc | Role |
|-----|------|
| [Current Development](../current/current_development.md) | Active CloudPilot feature work — **M7** |
| [../sql/cloudpilot_instructions.sql](../../sql/cloudpilot_instructions.sql) | Instructions step table — **M10** |
| [future/make_scans_useful.md](../future/make_scans_useful.md) | Conversation-first philosophy (reference) |
| [finished/history.md](../finished/history.md) | Undo — shipped baseline for **M5** |
| [future/remediations.md](../future/remediations.md) | PR / mode details beyond MVP polish |
| [instructions/adding_new_action.md](../../instructions/adding_new_action.md) | When adding actions later |
| [instructions/converting_atlas_data.md](../../instructions/converting_atlas_data.md) | Navigator shaping |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-09 | Initial MVP checklist — EC2 vertical slice, hide-not-delete, chat integrated as M7 |
| 2026-07-09 | Reframe: decision assistant not scanner; one instance; Team tag; show all 4 modes in demo |
| 2026-07-09 | Cost fix = delete_ec2; undo demo = update_ec2_tag only (not delete) |
| 2026-07-09 | M0b: “What can you do?” onboarding; recommended step order table |
| 2026-07-09 | M0 hide mechanism: API allowlist + Atlas rule_registry comment-out (doc only, not implemented) |
| 2026-07-17 | Demo reframe: existing small → create micro (Instructions+CLI+CloudPilot Fix It) → scan → **PR on switch/resize** → Automatic+Undo → History; super simple checklist; toggle back in MVP allowlist |
| 2026-07-17 | Fix Beat 2: CloudPilot Fix It creates the micro instance (do not skip Automatic on create); still skip PR on create |
| 2026-07-17 | Locked **switch/toggle** story: To Do list + demo words; Beat 2 generate-only again; PR → Automatic production change → Automatic traffic spike → History/Undo; stop adding scenarios |
| 2026-07-17 | Locked **Option A** (two instances): running small + stopped micro; Automatic = toggle; traffic spike → History Undo; Option B resize deferred |
| 2026-07-17 | **M10 Instructions**: one-step-per-row table + Phase A–D todos; SQL `cloudpilot_instructions.sql` |



---

# Source: `scans.md`

# Scans — MVP

**Last reviewed:** 2026-07-05

> **Shipped:** [finished.md](../finished/finished.md) · **Deferred:** [future_work.md](./future.md)

---

## Purpose

Find **real problems** in five minutes — not become AWS Trusted Advisor.

CloudPilot scans AWS services, runs **rules**, returns **findings** in chat + Navigator. One service at a time, same internal pattern every time:

```text
Atlas scanner → rules → API handler → Navigator → Kite
```

**Demo arcs**

1. **Bill:** Billing → EC2 scan → S3 scan → RDS scan  
2. **Security:** IAM scan → Security Groups scan  

---

## What makes a good MVP rule

A CloudPilot rule should:

- Find a problem users **commonly** have  
- Be understandable in **one sentence**  
- Have a **clear recommended action**  
- Tag a **category:** `security` | `cost` | `reliability` | `configuration`  
- Later: lead to instructions, CLI, PR, or automated fix — not required on day one  

Skip obscure checks just because the API exists.

---

## Navigator shape (every scan)

Same mental model for EC2, S3, RDS, IAM, Security Groups, Lambda:

| Section | Navigator |
|---------|-----------|
| **Resources found** | Stats + resource table (instances, buckets, DBs, …) |
| **Issues found** | Findings table (severity, title, resource) |
| **Potential savings** | Stat or column when rule populates savings |
| **Recommended actions** | Recommendation text per finding (fix = change/PR later) |

Intent filters (“show security issues”) come **later** — rules already carry `category`; no scanner changes needed.

---

## Current status

| Service | Status | Chat action |
|---------|--------|-------------|
| **EC2** | ✅ MVP rules shipped | `scan ec2` |
| **S3** | ✅ Demo tier (3 rules); expand rules next | `scan s3` |
| **RDS** | ❌ Not started | `scan rds` (planned) |
| **IAM** | ❌ Not started | `scan iam` (planned) |
| **Security Groups** | ❌ Not started | `scan security groups` (planned) |
| **Lambda** | ❌ Not started | `scan lambda` (planned) |

Details in [finished.md](../finished/finished.md) (shipped) and sections below (next).

---

## Service order (build one at a time)

```text
EC2        ✅ foundation
  ↓
S3         expand rules (same action)
  ↓
RDS        new scanner — bill demo complete
  ↓
IAM        security demo
  ↓
Security Groups
  ↓
Lambda     optional polish
```

Do **not** start the next service until the current one demos well end-to-end.

---

## EC2 ✅

**Resources found:** instances (name, id, type, state, region, tags)  
**Issues found:** 5 rules live  
**Potential savings:** on cost rules where populated  
**Recommended actions:** resize / stop / toggle / tag (change layer)

| Rule (live) | Category |
|-------------|----------|
| Low CPU | cost |
| Legacy instance type (t2, m3, …) | cost |
| Stopped instance | cost |
| Missing Name tag | configuration |
| Public IP attached | security |

**Next:** no snapshot, oversized recommendation → [future_work.md](./future.md)

---

## S3 ✅ demo — expand rules next

**Resources found:** buckets (region, encryption, lifecycle flags)  
**Issues found:** 3 rules live  
**Recommended actions:** enable encryption, lifecycle, block public access (later)

| Rule (live) | Category |
|-------------|----------|
| Public access block disabled | security |
| Default encryption off | security |
| No lifecycle policy | cost |

**Next rules (pick 2–3):** public bucket/policy, versioning disabled, logging disabled, missing tags → [future_work.md](./future.md)

---

## RDS — next new scanner

**Resources found:** DB instances (engine, class, status, public, encrypted, backup retention)  
**Issues found:** start with 5 rules  
**Recommended actions:** instructions / PR initially

| Rule (MVP) | Category |
|------------|----------|
| Publicly accessible | security |
| Storage encryption disabled | security |
| Automated backups disabled | reliability |
| Low CPU / idle | cost |
| Missing tags | configuration |

Copy **S3 scan** file layout: `core/cloud/rds/scanner.py`, `POST /scan/rds`, `scan_rds` action folder.

---

## IAM — after RDS

**Resources found:** users, roles (summary table)  
**Issues found:** MFA, keys, admin policies  

| Rule (MVP) | Category |
|------------|----------|
| User without MFA | security |
| Old access keys | security |
| Unused access keys | security |
| AdministratorAccess attached | security |

Remediation: mostly instructions / PR.

---

## Security Groups — after IAM

**Resources found:** security groups + rules summary  
**Issues found:** world-open ports, unused groups  

| Rule (MVP) | Category |
|------------|----------|
| SSH open to 0.0.0.0/0 | security |
| RDP open to 0.0.0.0/0 | security |
| Unused security group | cost / configuration |

---

## Lambda — last

**Resources found:** functions (runtime, timeout, last invoked)  

| Rule (MVP) | Category |
|------------|----------|
| Old runtime | reliability |
| No recent invocations | cost |
| Excessive timeout | configuration |

---

## Pattern (copy per service)

```text
Atlas:   core/cloud/{service}/scanner.py + rules/
         api/routes/{service}_scan_routes.py  POST /scan/{service}
API:     actionMap scan_{service} → scan{Service}Handler → Navigator adapter
Kite:    generic Navigator (no service-specific React)
```

Reference: `core/cloud/ec2/`, `core/cloud/s3/`, `services/actions/ec2/scanEC2/`, `services/actions/s3/scanS3/`.

---

## Future ideas

Intent chat (“show security issues”, “ways to save money”), multi-service `scan_aws` dashboard summary, pipeline scan, extra rules, skipped AWS services — [future_work.md](./future.md#scans).



---

# Source: `make_scans_useful.md`

# Make scans useful — conversation-first UX

**Last reviewed:** 2026-07-05

> **Scanner status:** [scans.md](./scans.md) · **Shipped:** [finished.md](../finished/finished.md) · **Later:** [future_work.md](./future.md)

---

## Problem

The **scanner works.** The **UX does not yet.**

Today `scan s3` feels like AWS Console Lite:

```text
S3 Buckets          Findings
─────────────       ─────────────
bucket1             Finding
bucket2             Finding
bucket3             Finding
                    Finding
                    Finding
                    …
```

CloudPilot’s value is not displaying data. It is **guiding the user** — explaining what matters, tradeoffs, and next steps.

**Pause RDS** until S3 (and EC2) scans feel like an assistant, not a dashboard.

---

## Product philosophy

> **CloudPilot never changes cloud infrastructure without explaining why, the benefits, and the possible consequences.**

- **Unusual**, not **wrong** — AWS best practices are defaults, not universal truth (public website buckets, CDN origins, cross-account access, etc.).
- **Advisor**, not **alarm** — “Here’s what I found → why it matters → what changes if you fix it → you decide.”
- **Conversation first** — chat leads; Dashboard provides context, not the primary experience.

Example: **Block Public Access not fully enabled** does **not** mean the bucket is public. It means AWS would *allow* certain public configurations. Fixing it may be correct — or it may break an intentional public site.

---

## Target conversation flow (S3 demo)

This is the experience we are building toward.

### Step 1 — List buckets

```text
You:   show my S3 buckets

CloudPilot:
       Found 4 buckets.

       • insta-app-bucket-tutorial-two
       • elasticbeanstalk-us-west-2
       • elasticbeanstalk-us-east-1
       • codepipeline-us-west-2-…

       Which one would you like to inspect?
```

**Implementation note:** Prefer the EC2 pattern — Question `s3_inventory` → `scan_s3`
(see [feature_s3_inventory_ask](../finished/feature_s3_inventory_ask.md) and
[route inventory → scan](../how_to/route_inventory_question_to_scan.md)).
Inventory-phrase shortcuts via `inventory_aws` remain optional later.

### Step 2 — Scan one bucket

```text
You:   scan insta-app-bucket-tutorial-two
       (or: scan S3 bucket insta-app-bucket-tutorial-two)

CloudPilot:
       6 recommendations for insta-app-bucket-tutorial-two

       🔴 Encryption disabled
          Why: Objects are not encrypted at rest.
          Confidence: High — recommended for most private buckets.
          [Fix]

       🟡 Versioning disabled
          Why: Deleted files cannot be recovered from this bucket.
          Confidence: Medium — review storage and cost tradeoffs.
          [Fix]

       🟢 No lifecycle policy
          Why: Old objects may keep costing money.
          Confidence: Low — common on dev buckets.
          [Fix]
```

**Implementation note:** Optional `bucket` filter on `POST /scan/s3` + collect bucket name in `scan_s3` action (easy/medium).

### Step 3 — Account-wide scan (optional)

When the user says `scan s3` without a bucket name, **summarize first**, then offer drill-down:

```text
You:   scan s3

CloudPilot:
       Scanned 4 buckets.

       Most common recommendations:
       • 4 buckets — default encryption disabled
       • 4 buckets — versioning disabled
       • 4 buckets — no lifecycle policy
       • 2 buckets — missing Name tag

       Which bucket would you like to inspect?
       • insta-app-bucket-tutorial-two
       • elasticbeanstalk-us-west-2
       …
```

Do **not** dump 24 identical rows. Aggregate by recommendation, then drill down.

---

## Three layers (architecture)

```text
Layer 1 — AWS facts
  Scanner + rules (Atlas)
  Bucket, encryption, versioning, ACL, policy, tags, …

        ↓

Layer 2 — CloudPilot Knowledge
  What it means, benefits, tradeoffs, questions, confidence, safe action labels
  Owned by CloudPilot — not OpenAI

        ↓

Layer 3 — AI presentation (optional)
  Rewrite for tone, length, audience
  Only when needed — static text is fine for MVP demo
```

**Do not** send raw findings to OpenAI and ask it to invent meaning. CloudPilot owns accuracy; AI rewrites presentation if desired.

**Future:** Organization knowledge (Layer 2+) — “marketing-assets bucket is *expected* to be public” suppresses or reframes findings. Requires config store; not MVP.

---

## CloudPilot Knowledge (Layer 2)

One entry per `rule_id`. Example: `s3_public_access_block_disabled`

| Field | Example |
|-------|---------|
| **title** | Block Public Access is not fully enabled |
| **action_label** | Enable Block Public Access |
| **meaning** | AWS allows one or more public-access protections to be disabled on this bucket. |
| **why_it_matters** | Increases the chance the bucket could become public accidentally. |
| **benefits** | Prevents accidental exposure via future policies or ACLs. |
| **possible_impact** | May break workloads that intentionally require public S3 access. |
| **questions** | Is this bucket intentionally public? Hosting a website? Does another service rely on public access? |
| **confidence** | `medium` |
| **confidence_reason** | Preventive setting — bucket may still be completely private today. |
| **review_hint** | Review if intentional |

Rules stay thin (facts + trigger). Knowledge file holds voice and tradeoffs.

**Location (planned):** e.g. `services/knowledge/s3Rules.js` or JSON keyed by `rule_id`.

---

## CloudPilot Confidence

Teach users: **don’t blindly click Fix.**

Every recommendation can show:

```text
Confidence: Medium ★★★☆☆
Reason: Recommended for most private buckets; may break intentional public access.
```

| Level | When |
|-------|------|
| **High** | Clear signal (public ACL, missing encryption on sensitive pattern) |
| **Medium** | Good default, context-dependent (BPA, versioning, policy parsing) |
| **Low** | Organizational / cost hygiene (Name tag, lifecycle on dev buckets) |

Curated per rule in Knowledge file — no ML required for MVP.

Also show **scope**: “Applies to 4 of 4 buckets” vs “Applies to this bucket only.”

---

## Terminology

| Old | New (chat + Navigator) |
|-----|--------------------------|
| Findings | **Recommendations** |
| `ENABLE_PUBLIC_ACCESS_BLOCK` | **Enable Block Public Access** |
| Fix immediately | **Review if intentional** |

---

## Work tiers — what moves CloudPilot forward fastest?

### 🟢 Very easy (hours)

Presentation only. Huge ROI. No engine changes for most items.

- [ ] Rename Findings → Recommendations (chat + Navigator table title)
- [ ] Human-friendly action labels (Knowledge map or formatter)
- [ ] Aggregated account summary (“4 buckets — encryption disabled”)
- [ ] Group by severity (High / Medium / Low)
- [ ] “Show my S3 buckets” match phrases on inventory
- [ ] “Scan &lt;bucket-name&gt;” per-bucket scan
- [ ] Conversational wording (“review if intentional”)
- [ ] Static one-line explanation per rule in chat
- [ ] Better chat summaries (replace count-only messages)
- [ ] CloudPilot Confidence + reason (static per rule)
- [ ] Recommendation scope (“4 of 4 buckets”)

### 🟡 Easy / medium (1–3 days)

CloudPilot starts feeling **different** here.

- [ ] CloudPilot Knowledge file — one entry per S3 rule (8 rules)
- [ ] Advisor blocks: why / benefits / impact / questions
- [ ] Per-bucket drill-down in chat (full card list for one bucket)
- [ ] Optional OpenAI Layer 3 — rewrite Knowledge text only (with static fallback)
- [ ] Same pattern for EC2 scan message + knowledge

**Primary files:** `atlasS3MessageBuilder.js`, `atlasS3ScanNavigatorAdapter.js`, new knowledge file, optional `run_s3_scan` bucket filter.

### 🟠 Medium (several days)

Capability expansion — do **after** S3 conversation UX demos well.

- [ ] RDS / IAM / Security Groups / Lambda scanners
- [ ] Billing → dynamic “Scan S3” (when S3 tops spend)
- [ ] Recommendation cards in Kite (if beyond chat formatting)
- [ ] Fix button → Instructions only (first remediation slice)

### 🔴 Hard (weeks) — future CloudPilot

- Organization knowledge and exception policies
- Terraform / GitHub / Jira / Slack context
- Learning from feedback
- Enterprise policy engine

### 🔴 Very hard (months) — platform

- Automatic remediation, PR generation, approval workflows
- AI inferring organizational intent without config
- Cross-system reasoning

---

## MVP demo stack (recommended order)

1. Aggregated summary + bucket list + Recommendations rename  
2. Human labels + Confidence + review hints  
3. Knowledge file for 8 S3 rules  
4. Per-bucket scan phrase + drill-down chat  
5. One full advisor block (Block Public Access) + Fix → Instructions or “coming soon”  

Skip RDS until a real `scan s3` on your own account reads like a teammate.

---

## Fix button (future beat)

Scan → recommendation → **[Fix]** → choose path:

```text
• Automatic
• Pull Request
• AWS CLI
• Instructions
```

MVP: explain first; Fix can stub to Instructions or “coming soon.” Remediation wiring: [remediations.md](./remediations.md).

---

## Demo arc (when UX ships)

```text
Show my S3 buckets
  → list A, B, C, D
Scan bucket A
  → 6 recommendations for A (advisor voice)
Scan s3 (account)
  → aggregated summary → pick a bucket
```

Dashboard stays available for users who want the spreadsheet view.

---

## Related docs

- [scans.md](./scans.md) — rules, build order, Navigator shape  
- [remediations.md](./remediations.md) — change layer after scan  
- [future_work.md](./future.md) — deferred platform items



---

# Source: `remediations.md`

# Remediations — delivery strategies & PR workflow

**Last reviewed:** 2026-06-27

> **Related:** [history.md](../finished/history.md) · [architecture/development_undo_feature.md](../architecture/development_undo_feature.md) · [architecture/architecture.md](../architecture/architecture.md) · [To_do.md](./to_do.md)

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
- [ ] Kite undo button ([history.md](../finished/history.md))

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



---

# Source: `feature_s3_versioning_remediation.md`

# Feature: S3 versioning remediation

## Goal

Implement CloudPilot's first real S3 remediation:

```text
Versioning is disabled → Enable bucket versioning
```

The user opens a bucket finding in `DashboardPage`, clicks **Fix**, completes the request in the Dashboard companion chat, confirms the change, and receives a verified result.

## Scope

- Support the existing `s3_versioning_disabled` finding only.
- Add the CloudPilot action `enable_s3_versioning`.
- Support **Automatic / CloudPilot Does It** only.
- Keep the user on `DashboardPage`; do not navigate to `ChatPage`.
- Require explicit confirmation before changing AWS.
- Do not implement encryption, Fix All, instructions, CLI, or pull requests.

## User flow

```text
S3 scan
→ All Buckets
→ One Bucket
→ Versioning is disabled
→ Fix
→ Dashboard companion chat opens
→ Live versioning state is checked
→ Preview and cost warning are shown
→ User confirms or cancels
→ CloudPilot enables versioning
→ Live state is verified
→ Request is completed or failed
```

The Dashboard header controls and companion chat must remain available at every drill-down level.

## Existing finding identifiers

Reuse the current scanner values:

- Rule ID: `s3_versioning_disabled`
- Finding ID: `s3-versioning-off-{bucket_name}`
- Issue code: `VERSIONING_DISABLED`
- Recommendation: `ENABLE_VERSIONING`

Do not create another versioning finding code.

## Architecture

Use the existing CloudPilot operation path:

```text
Atlas React
→ Node API request pipeline
→ Atlas HTTP provider
→ Python Atlas service
→ boto3
→ AWS
```

Do not add direct CloudPilot AWS access to the Node API. Existing AWS operations and credentials are owned by the Python Atlas project.

## Frontend — `kite/atlas`

### New

- `src/functions/findings/s3VersioningFixContext.js`
  - Build the payload for the one versioning finding the user clicked.
  - Include action, bucket name, finding ID, rule ID, and scan snapshot ID.
  - This is not a list of findings and does not handle other S3 findings.

### Modify

- `src/pages/DashboardPage.js`
  - Show a working **Fix** only for versioning.
  - Leave other findings as **Review**.
  - Open the existing companion chat without leaving Dashboard.
  - Send structured context into the normal `/message` flow.
  - Never rely on a vague `"fix this"` message to identify the bucket.
- `src/functions/findings/s3FindingDisplay.js`
  - Map only `ENABLE_VERSIONING` to the available automatic remediation.

Example context:

```js
{
  action: 'enable_s3_versioning',
  bucketName: 'exact-bucket-name',
  findingId: 's3-versioning-off-exact-bucket-name',
  ruleId: 's3_versioning_disabled',
  scanSnapshotId: 123
}
```

## Node API — `api`

### New

- `application/atlas/cloudPilot/actions/enableS3Versioning/enableS3VersioningHandler.js`
- `application/atlas/providers/atlas/s3/enableS3Versioning.js`
  - Atlas HTTP calls for this action only: read versioning, then enable it.
- `application/atlas/cloudPilot/history/historyBuilders/enableS3VersioningHistory.js`
  - History record for this completed versioning change only.
- `test/application/atlas/cloudPilot/enableS3Versioning.test.js`
  - Request, confirmation, and handler tests for this action only.

### Modify

- `application/atlas/cloudPilot/masterCloudPilotCapabilities.js`
  - Register `enable_s3_versioning` as a live change action.
  - Use `bucket_name` in stored request fields.
  - Require confirmation.
  - Support automatic execution only.
  - Add application-controlled cost metadata.
- `application/atlas/cloudPilot/chat/cloudPilotMessageFunctions.js`
  - Convert validated Fix context into a deterministic action and request values.
- `application/atlas/cloudPilot/requests/functions/resourceVerificationFunctions.js`
  - Run the live S3 preflight and store its preview.
- `application/atlas/cloudPilot/chat/templates/requestTemplates.js`
  - Render the versioning confirmation preview.
- `application/atlas/cloudPilot/chat/templates/fieldPromptExamples.js`
  - Add `bucket_name`.
- `application/atlas/cloudPilot/history/functions/historyFunctions.js`
  - Register the history builder.
- `application/atlas/cloudPilot/execution/outcomes/outcomeRegistry.js`
  - Add S3 permission, update, and verification failures.
- `application/atlas/cloudPilotIntelligence/context/contextTypes/currentQuestionContext.js`
  - Preserve approved finding identifiers.
- `doc/database/create_tables/master_sql.sql`
  - Seed `enable_s3_versioning` into `cloudpilot_actions`.

No new database table is required. Store the preview and finding linkage in the existing request `collected` JSON.

## Python Atlas — `startup/atlas`

### New

- `app/core/cloud/s3/operations/enable_versioning.py`
- `app/api/services/s3_operation_service.py`
- `app/api/routes/s3_operation_routes.py`
- Focused operation tests.

### Modify

- `app/main.py`
  - Register the S3 operation routes.

## Live preflight

Before showing confirmation, call `get_bucket_versioning` and handle:

- `Enabled`: finish as a no-op; do not call Put.
- `Suspended`: preview re-enabling versioning.
- No `Status`: preview enabling versioning for the first time.
- AWS error: fail clearly; do not guess or show a confirmation.

Store the bucket, current state, proposed state, finding ID, scan ID, and cost metadata in the open request.

## Confirmation

The preview must include:

- Exact bucket name.
- Current state.
- Proposed state: Enabled.
- Benefit for future overwrites and deletions.
- Existing objects are not copied or recovered.
- A bucket cannot return to its never-versioned state; versioning can only be suspended.
- Lifecycle rules may require review.
- Cost classification: **Possible increase**.
- No activation fee, but retained versions consume storage.
- Confirm or cancel.

## Execution

After confirmation:

1. Read the live state again.
2. If already Enabled, return a successful no-op.
3. Otherwise call `put_bucket_versioning` with `Status: "Enabled"`.
4. Read the state again.
5. Report success only when the returned state is Enabled.
6. Record before state, after state, whether CloudPilot changed it, verification, finding ID, and scan ID.

Cancellation must never call `put_bucket_versioning`.

Required IAM permissions:

- `s3:GetBucketVersioning`
- `s3:PutBucketVersioning`

## Data rules

- The database remains the source of truth for the open request.
- A later `"yes"` acts on the stored request, not transient frontend state.
- Saved scans are historical snapshots and must not be rewritten.
- A fresh scan determines whether the finding is gone.
- Cost facts come from capability metadata, not OpenAI.

## Focused tests

Cover:

1. Fix sends the exact action and bucket.
2. Only versioning advertises an automatic Fix.
3. Request is stored with finding and scan IDs.
4. Preflight distinguishes Enabled, Suspended, and no Status.
5. Preflight failure prevents confirmation.
6. Confirmation includes current/proposed state and cost warning.
7. Cancel never mutates AWS.
8. A later confirmation uses the stored request.
9. Put runs exactly once when needed.
10. Already Enabled returns a no-op.
11. State is read again after Put.
12. Failed verification cannot report success.
13. Existing scans and EC2 actions still work.

## Definition of done

A user can scan S3, open a bucket, select its versioning finding, click Fix, review the bucket-specific automatic change and cost warning in the Dashboard chat, cancel without mutation or confirm, and receive a result that is successful only after AWS reports versioning as Enabled.



---

# Source: `feature_s3_remediation_modes.md`

# S3 remediation modes (later)

## What this does

When S3 Fix actually works, reuse the **same EC2 delivery choices** instead of
the Chat “coming soon” stub:

```text
How would you like to fix this?
  · Automatic
  · Instructions
  · CLI
  · Pull Request
```

**Status:** Future — not started  
**Came from:** [Friendly Dashboard](../finished/feature_friendly_dashboard.md) Step 6  
**Related:** [Remediations](./remediations.md) · [GitHub Pull Requests](./feature_github_pull_requests.md) · [Make scans useful](./make_scans_useful.md)

---

## Why it waited

Friendly Dashboard MVP shows **Fix** so findings are not dead-end warnings, then
opens Chat with honest copy:

```text
Fixing this finding is coming soon.

CloudPilot found the issue, but automatic remediation for this S3 finding
isn't available yet.
```

None of the S3 remediations work end-to-end yet. A fake four-mode menu would
look unfinished.

---

## When to pick this up

Only after an S3 action works for real (e.g. enable versioning / encryption /
public access block) through Atlas + history/undo like EC2.

Then:

* Keep Fix / Review on the friendly findings table
* Replace the S3 Chat stub with EC2-style execution modes
* Do **not** mutate AWS just because Fix was clicked — user still picks a mode

Until then, leave the coming-soon Chat path.



---

# Source: `feature_mvp_ec2_operating_boundary.md`

# CloudPilot MVP — EC2 Operating Boundary (ARCHIVED)

**Status:** Archived — superseded  
**Archived:** 2026-09-05  
**Superseded by:** [CloudPilot MVP — Canonical Scope](../feature_mvp.md)

This document defined the previous MVP boundary: **EC2 operate** (create, delete,
pause/resume, history/undo, real Terraform PR). It is kept for history only.

Do **not** use this checklist to drive MVP development.

---

# CloudPilot MVP — EC2 Operating Boundary

## What this does

Define the smallest product surface that proves CloudPilot can **operate AWS**
well — without expanding into every AWS service or polishing every execution
mode.

**MVP story:**

```text
CloudPilot is really good at managing EC2.

Create it.
Delete it.
Pause it.
Resume it.
See what CloudPilot changed.
Undo safe changes.
For IaC environments, propose the change through a PR instead.
```

## Current step

**Plan locked — MVP boundary defined.** Use this checklist to track demo readiness.

## Next

Work the five items below toward `works` + `passed`. Primary product work that
feeds this checklist:

- [Friendly Create EC2](../finished/feature_friendly_create_instance.md) — create polish
- [Useful Price](../finished/feature_useful_price.md) — honest compute cost estimates in speak
- [GitHub Pull Requests](./feature_github_pull_requests.md) — PR demo concept (deferred)
- Pause / Resume already shipped — [feature_pause_instance](../finished/feature_pause_instance.md)
- Verify / scan recovery shipped — [feature_verify_request](../finished/feature_verify_request.md)
- History backend shipped — [history](../finished/history.md); UI polish still open

**Status:** Archived  
**Codename:** `feature_mvp` (old)  
**Related:** [Current Development](../current/current_development.md)

---

# Locked MVP boundary

Stay on **EC2**. Do not add another AWS service until these five flows feel
really good to use.

| Mode | Meaning |
|------|---------|
| **Automatic** | CloudPilot changes AWS |
| **Pull Request** | CloudPilot proposes the infrastructure change; engineering process controls deploy |

Do **not** use “add an S3 bucket” as the main PR demo.

Preferred PR demo:

```text
Change my API EC2 instance from t3.micro to t3.small.
```

Show a real Terraform diff and a real PR — not a toy bucket example.

---

# MVP checklist

`works` = the flow can be demonstrated end-to-end.  
`passed` = demo-quality: honest, clear, and good enough to show externally.

---

## 1. Create EC2 — polished

Conversation → understand intent → AWS action → result → history → undo.

### Create instance naturally through chat

- [ ] works
- [ ] passed

### Friendly guidance around what CloudPilot is about to do

- [x] works
- [x] passed

### Automatic execution works

- [ ] works
- [ ] passed

### History entry is created

- [ ] works
- [ ] passed

### Undo works

- [ ] works
- [ ] passed

**Primary feature:** [Friendly Create EC2](../finished/feature_friendly_create_instance.md)

---

## 2. Delete EC2 — works

Identify → verify exists / sensible state → terminate → clear result.

History/undo are **nice**, not MVP blockers. Delete undo is recreating an
equivalent instance, not reversing one API call — do not block MVP on it.

### Identify the instance

- [ ] works
- [ ] passed

### Verify it exists / state is sensible

- [ ] works
- [ ] passed

### Delete / terminate it

- [ ] works
- [ ] passed

### Show a clear result

- [ ] works
- [ ] passed

### History recorded (optional for MVP)

- [ ] works
- [ ] passed

---

## 3. Pause / Resume EC2 — works well

Easy-to-understand demo:

```text
Pause my dev server.  → find → explain → stop
Start it again.       → resume
```

### Pause finds / verifies target and stops it

- [ ] works
- [ ] passed

### Resume finds / verifies target and starts it

- [ ] works
- [ ] passed

### Clear result messages (including already paused / already running)

- [ ] works
- [ ] passed

### Not-found offers existing scan recovery

- [ ] works
- [ ] passed

### History + undo for CloudPilot-initiated changes

- [ ] works
- [ ] passed

**Shipped base:** [Pause / Resume](../finished/feature_pause_instance.md) ·
[Verify Request](../finished/feature_verify_request.md)

---

## 4. History — polished UI

Spend care on this surface. It communicates:

```text
CloudPilot remembers what it changed.
```

Target feel:

| Action | Resource | Status | Time | |
|--------|----------|--------|------|---|
| Create EC2 | kite-dev | Completed | 2 min ago | **Undo** |
| Pause EC2 | kite-api | Completed | Yesterday | |

### History list shows recent CloudPilot changes

- [ ] works
- [ ] passed

### Clear Action / Resource / Status / Time columns

- [ ] works
- [ ] passed

### Undo available on safe / CloudPilot-initiated changes

- [ ] works
- [ ] passed

### UI polish good enough for external demo

- [ ] works
- [ ] passed

**Shipped base:** [History](../finished/history.md)

---

## 5. Pull Request — demonstrate the concept

Demonstrate the idea. Do **not** perfect the full IaC platform.

Build real Terraform for actual API infrastructure (useful regardless of
CloudPilot). Keep a demo branch where CloudPilot can show a realistic change.

### Chat can choose Pull Request mode for an EC2 change

- [ ] works
- [ ] passed

### Real Terraform diff for resize (e.g. t3.micro → t3.small)

- [ ] works
- [ ] passed

### Real GitHub PR opened with reviewable change

- [ ] works
- [ ] passed

### No AWS mutation from the PR path

- [ ] works
- [ ] passed

### Distinction vs Automatic is obvious in the demo

- [ ] works
- [ ] passed

**Primary feature:** [GitHub Pull Requests](./feature_github_pull_requests.md)

Preferred demo prompt:

```text
Change my API EC2 instance from t3.micro to t3.small.
```

Preferred response shape:

```text
I can make that change through a pull request so you can review it
before anything changes in AWS.
```

Then show:

```hcl
resource "aws_instance" "api" {
-  instance_type = "t3.micro"
+  instance_type = "t3.small"
}
```

And a real PR title like: **CloudPilot: Resize API EC2 instance**

---

# Explicitly out of MVP

```text
new AWS services beyond EC2
perfect every Instructions / CLI path
perfect delete undo / recreate
S3 bucket PR as the main demo
full terraform apply / deploy pipeline
generic remediation frameworks
```

Resist adding more until the five checklist areas above feel excellent.

---

# How to use this doc

1. Keep architecture detail in the linked feature docs.
2. Mark **works** when the path is demonstrable.
3. Mark **passed** when it is demo-quality for an external audience.
4. Prefer finishing create polish + pause/resume trust + history UI + one
   strong PR story before expanding scope.



---

# Source: `feature_better_chat.md`

# CloudPilot — Scan Conversation MVP

**Status:** Future — deferred from current (2026-09-23). Some small slices already landed; the rest is not active work.

I want to simplify CloudPilot's conversation system and focus on getting **two capabilities working extremely well first**:

* Scan S3
* Scan EC2

The goal is not to add more features right now. The goal is to make conversation around these two capabilities feel natural, predictable, safe, and easy to debug.

Please **inspect the existing implementation before making changes**. Do not start a large refactor or build a generalized scope/agent framework. I want small, understandable changes.

---

# Where we are (2026-09-12) — overnight handoff

## Pipeline status

```text
MESSAGE
  ↓
1. OPEN REQUEST     ✅
  ↓
2. UNDERSTAND       ✅
  ↓
3. DECIDE           ✅  (requestType + permission metadata; permission drives confirmation)
  ↓
4. FULFILL          ✅  (Decide early-return checkpoint removed)
  ↓
5. RESPOND          ← NEXT FOCUS (Checkpoint 5 — verify / finish)
```

## Architecture checkpoints (Chat vs Request model)

| Checkpoint | Goal | Status |
|---|---|---|
| 1 | Capability `requestType` + `permission` metadata | ✅ Done |
| 2 | Decide uses `permission` for confirm vs immediate | ✅ Done |
| 3 | AWS questions → Information caps (`get_ec2_inventory` / `get_s3_inventory`), not Scan workflow | ✅ Done |
| 4 | Re-enable Fulfill end-to-end; Information immediate; Scan waits for confirm | ✅ Done |
| 5 | RESPOND matches Decision + Fulfill (inventory ≠ scan wording; mode ask ≠ Live stub) | 🔄 In progress — much already landed; finish via behavior test matrix |
| Logging | Master Steps 1–5 + detail toggles in `masterLogging.js`; cycle with capabilities fixed | ✅ Done — leave alone |

## Important facts for tomorrow

- **Chat vs Request:** Request carries `requestType` (scan / change / information) and `permission` (confirmation / none). Permission drives confirmation — do **not** branch on `if (requestType === 'information')` for execution.
- **Separate capabilities, shared handlers:** `scan_ec2` vs `get_ec2_inventory` (same `scanEC2Handler`); `scan_s3` vs `get_s3_inventory` (same `scanS3Handler`). Capability = user intent; handler = AWS retrieval.
- **Information / none:** immediate_execution, **no** DB request row.
- **Scan / confirmation:** fields → confirm → then Atlas.
- **Logging:** control panel is `api/application/atlas/cloudPilot/logging/masterLogging.js`. Do not redesign logging next.
- **Do not** start pronoun/follow-up resolution or agent loops until Checkpoint 5 Respond is signed off.

## Next step (tomorrow)

Resume **Checkpoint 5 — RESPOND** by reviewing the behavior test matrix (no big redesign):

1. `"Do I have any EC2 instances running?"` → Information inventory wording  
2. `"How many S3 buckets do I have?"` → Information inventory wording  
3. `"scan my EC2 instances"` → region → confirm → yes → Scan wording only after execute  
4. `"pause my EC2 instance"` → fields → execution mode (not `"Open AI will respond when Live"`)

Capture clean MASTER STEP 1–5 logs. Fix only if a specific layer (UNDERSTAND / DECIDE / FULFILL / RESPOND) is wrong.

### Checkpoint 5 matrix — run 2026-09-12 (no code fixes)

| # | Result | Notes |
|---|---|---|
| 1 EC2 info | ✅ Pass | `get_ec2_inventory` / Information / immediate / no row / `"I don't see any EC2 instances in us-west-2."` |
| 2 S3 info | ✅ Pass | `get_s3_inventory` / Information / immediate / no row / lists 3 buckets |
| 3 Explicit scan | ✅ Pass | fields → confirm (no Atlas) → yes executes → `"EC2 scan completed…"` / row closed |
| 4 Pause | ⚠️ Partial (expected with fake id) | Decide correctly `awaiting_execution_mode`; fulfill/preflight → `resource_not_found` + scan offer; **not** Live stub |

Tomorrow: decide whether Checkpoint 5 Respond is signed off, or whether pause needs a real instance to prove the mode-ask template end-to-end.

---

# Locked decisions (inspection complete — not implemented yet)

## Master capabilities file

Rename **`actionMap.js` → `masterCloudPilotCapabilities.js`** when coding starts.

**Status (this slice):** Done — file renamed; JS requires updated. Docs may still say `actionMap` historically.

- This is a **rename of the existing registry**, not a second catalog.
- “Master” = high-level application source of truth for what CloudPilot can do (actions, handlers, fields, `cloudPilotCanAnswer`, orchestration metadata).
- Do **not** invent a parallel capabilities registry.
- Atlas remains implementation truth (scanners); the master only claims facts that survive **AWS → Atlas → formatter → API → conversation**.

## Sixth context type: Capabilities

Do **not** fold capabilities into Situation or Identity.

```text
Identity          → Who is CloudPilot?              cloudPilotContext.js
Capabilities      → What can I do / retrieve?       cloudPilotCapabilitiesContext.js  ← NEW
Situation         → What should I look for now?     cloudPilotSituationContext.js
Current State     → What is happening right now?    cloudPilotCurrentStateContext.js
Current Question  → What did the user just say?     currentQuestionContext.js
Knowledge         → Org/product facts               organizationKnowledgeContext.js
(+ Conversation History — separate; not a contextType file)
```

Pipeline:

```text
masterCloudPilotCapabilities.js
        │  MASTER APPLICATION SOURCE OF TRUTH
        ↓
cloudPilotCapabilitiesContext.js
        │  projects ONLY model-relevant fields
        ↓
buildContext.js  (includeCapabilities on/off)
        ↓
buildSystemMessage.js
        ↓
OpenAI
```

Do **not** dump raw master fields into the model (`match`, `executionFunction`, `messages`, etc.).

Render order: **Identity → Capabilities → Situation → Current State → Current Question → Knowledge**  
(Capabilities before Situation.)

## Locked `cloudPilotCanAnswer` (truthful)

**EC2 — Scan EC2**

```js
cloudPilotCanAnswer: [
  "instance identity and name",
  "instance state",
  "instance type",
  "tags",
  "region",
  "average CPU utilization",
  "estimated On-Demand compute cost when a stored rate exists"
]
```

Scope: regional; MVP default region `us-west-2`.  
Do **not** advertise IP or launch information yet.

**S3 — Scan S3**

```js
cloudPilotCanAnswer: [
  "bucket names",
  "tags",
  "bucket region",
  "default encryption",
  "versioning",
  "public access signals",
  "lifecycle rules",
  "access logging"
]
```

Scope: **account-wide** bucket inventory (not region-filtered).

## Known MVP cleanup (defer)

`scan_s3` still has workflow `requiredFields: ['region']` even though inventory is account-wide.  
Do not describe S3 results as region-filtered. Revisit removing region as required **after** conversation/state behavior is stable.

## MVP context switches (experiment)

```text
Identity            ✓
Capabilities        ✓ NEW
Situation           ✓
Current State       ✓
Current Question    ✓
Knowledge           ✕ off for this experiment
Conversation History ✓ small (try 4–6 messages)
```

Always include: *Do not invent AWS services, actions, or facts outside this capabilities list.*

Assembly / toggles live in `buildAIContext` (`buildContext.js`) + history env flags. Extend that layer for `includeCapabilities` when coding — not a new framework.

## "What can you do?" (already exists — keep)

Phrase like **"What can you do?"** maps to action `show_capabilities` in the master registry (`actionMap.js` → later `masterCloudPilotCapabilities.js`).

- Match phrases include: `what can you do`, `what do you do`, `what are your capabilities`, `help`, etc.
- Response is built from the **live allowed action catalog** (`buildCapabilitiesCatalog` / `capability.section` + `capability.description` on each action).
- Internal = deterministic bullets; OpenAI (`CLOUDPILOT_MESSAGE_RESPONSE=openai`) = natural rephrase of the **same grounded catalog** (no inventing).
- This is **not** General Chat inventing a list — CloudPilot owns the facts.

Desired shape (natural):

```text
I can:
- Scan your S3 buckets
- Scan your EC2 instances
- Create a new instance
- …
```

Same master source of truth as the future `cloudPilotCapabilitiesContext` projection. When the master is honest (MVP Scan S3/EC2 + other `allowed` actions), this answer stays honest.

OpenAI message logs: keep the readable `formatOpenAIMessagesForLog` dump (real newlines, not `\n` escapes).

---

# Inspection: AI-call pipeline + `masterContext/` (no files created)

## Verdict (style / organization)

You are identifying a real layer — **“for this AI call, which ingredients?”** — but **most of it already exists under another name**, incomplete and uneven.

Today you effectively have:

| Layer | Today | Your mental model |
| ----- | ----- | ----- |
| Ingredients | `context/contextTypes/` | same |
| Per-call packaging | `context/operationContext/get*SearchContext.js` | half of “recipe” (task purpose / catalog / examples) |
| Ingredient assembly | `buildAIContext(options)` | builds selected blocks |
| Render | `buildSystemMessage.js` | same |
| History | **global** `OPENAI_SEND_CONVERSATION_HISTORY` + limit — only wired in **General Chat** | should be per-call recipe |

What is **missing** is not a brand-new idea — it is making **one consistent recipe object** that owns:

```text
includeIdentity / Capabilities / Situation / Current State / Knowledge
+ conversationHistory { include, limit }
+ situationTypes (when Situation is on)
```

…and having **every OpenAI-capable call** go through that path.

Right now some calls use `buildAIContext` flags, some invent their own TASK prompts in adapters, and history is a global env only General Chat reads. That is why it feels like a missing “master” layer even though `operationContext/` already exists.

**Naming preference (locked directionally, not coded):**  
`masterContext/` fits your “master = high-level” language better than `operationContext/` for the **recipe** role.  
Do **not** create a third parallel prompt system. Either:

1. Evolve `operationContext/` → thin recipes that call `buildAIContext` + history, **or**
2. Introduce `masterContext/` as recipes and keep `operationContext/` only if still needed for Internal/OpenAI shared **task payloads** (catalog, examples, outputFormat).

Smallest useful set comes from **real calls below** — not inventing four files tomorrow.

---

## 1. Every place an AI request can happen in one user message

One turn = `processMessage` → `understandMessage` (multiple searches) → decide → speak (General **or** Request Message Reply).

### Understand phase (can run several searches; OpenAI only if feature env = `openai` **and** master AI on)

| Call site | Question it answers | OpenAI today? |
| ----- | ----- | ----- |
| `searchMessageForRegion` | Did the user provide/change a region for the open request? | Optional (`CLOUDPILOT_REGION_SEARCH`) — only when open request needs region |
| `searchMessageForAction` | Does this message map to an approved action? | Optional fallback when Internal finds nothing (`CLOUDPILOT_ACTION_SEARCH`) |
| `searchForOpenRequests` | Is this an open-requests question? | Optional classify |
| `searchForAiSpend` | Is this an AI-spend question? | Optional classify |
| `searchForOrganizationalKnowledge` | Is this an org-knowledge question / extract ref? | Optional (also used when attaching knowledge for General Chat) |
| `searchForEc2Inventory` / `S3` / `Ec2ComputeCost` | Inventory / cost question classify | **Internal only** today |
| Name / instance id / type / tags / reply / conversation | Value / signal extract | **Internal only** (no OpenAI) |

### Speak phase (at most one of these owns the user-facing wording)

| Call site | Question it answers | OpenAI today? |
| ----- | ----- | ----- |
| `generateGeneralMessageReply` | What should CloudPilot say in general chat? | Optional (`CLOUDPILOT_MESSAGE_RESPONSE`) — uses `buildAIContext` + **history** |
| `generateRequestMessageReply` | Rephrase Request Conversation template without inventing facts? | Optional polish — **custom TASK**, no `buildAIContext`, **no history** |

Questions (ec2_inventory, s3_inventory, …) are guarded away from inventing via General Chat; they answer from CloudPilot/Atlas facts, not MESSAGE_RESPONSE.

**Scan S3 / Scan EC2 conversation** typically touches: Region (while collecting) → Action (new request) → Request Message Reply (fields / confirm) → later General Chat for freeform / “what can you do?” style turns. Inventory questions are separate Internal classify paths.

---

## 2–4. What each receives today vs what it actually needs

### Region Search

- **Today:** `getRegionSearchContext` → custom `TASK` / EXAMPLES system prompt. No Identity, Capabilities, Situation contextType, Current State, Knowledge, history.
- **Needs:** Current Question + Situation(region) + maybe slim Current State (so it knows region is being collected). Capabilities / Identity / Knowledge / history usually **off**.
- **Gap:** Situation `region` piece already exists in `cloudPilotSituationContext.js` but Region OpenAI **does not use** `buildAIContext` / Situation — it duplicates purpose in `operationContext`.

### Action Search

- **Today:** `getActionSearchContext` (catalog + purpose) + `buildAIContext` with `includeIdentity/CurrentState/Knowledge: false` (so basically Current Question only). Catalog rules duplicated again in the user message. No Situation. No history. Capabilities not projected as contextType (catalog is a side channel).
- **Needs:** Current Question + Capabilities (or catalog projection) + Situation(action_search) + maybe Current State. Identity / Knowledge / history **off**.
- **Gap:** Closest existing “recipe” already — just incomplete and catalog not going through Capabilities contextType.

### Request Message Reply (confirmation / missing fields polish)

- **Today:** `getRequestMessageReplyContext` facts + giant presentation TASK. No shared contextTypes. History off (correct).
- **Needs:** Mostly **facts + speak rules** (not full Identity/Capabilities brain). Current State facts are already in the reply context. Optional tiny Identity. Capabilities usually unnecessary if template owns truth. History **off**.
- **Gap:** Parallel prompt system; should stay narrow — may remain a special recipe that does **not** dump full chat context.

### General / Final response (`generateGeneralMessageReply`)

- **Today:** `buildAIContext(context)` defaults → Identity + Current State + Current Question + Knowledge (on by default) + Situation only if `situationTypes` passed (**usually none**). History from **global** env (default limit **12**). No Capabilities yet.
- **Needs (MVP experiment):** Identity + Capabilities + Situation + Current State + Current Question; Knowledge **off**; history **4–6**.
- **Gap:** This is the natural `masterFinalResponseContext` recipe. History should move from “global only” into this recipe (env can remain default ceiling).

### Question classifiers (open_requests, ai_spend, org knowledge)

- **Today:** Own `operationContext` + custom OpenAI adapters; history off.
- **Needs:** Narrow Situation + Current Question; usually no Identity/Capabilities/history.
- **MVP Scan S3/EC2:** not the first recipes to invent unless you are debugging those questions.

---

## 5. Grouping under the same master recipe

Recommended grouping from **real** calls:

| Recipe (conceptual) | Covers |
| ----- | ----- |
| **Final response** | `generateGeneralMessageReply` only (the “talk to the person” call) |
| **Action search** | `searchMessageForAction` OpenAI path |
| **Region search** | `searchMessageForRegion` OpenAI path |
| **Request speak / polish** | `generateRequestMessageReply` — keep separate; it is rephrase-facts, not reason-with-full-brain |
| **Question classify** (later, one shared pattern) | open_requests / ai_spend / org_knowledge — same shape; do not create three masters tomorrow |

Do **not** invent `masterRequestUpdateContext` until inspection shows a dedicated AI call for it (field updates today are mostly Internal extract + DB).

---

## 6. Recommended `masterContext/` structure (smallest useful)

Based on Scan S3 + Scan EC2 reality — **names not final, files not created**:

```text
cloudPilotIntelligence/
└── masterContext/                    ← recipes (high-level “what to send”)
    ├── masterFinalResponseContext.js   ← General Chat speaker
    ├── masterActionSearchContext.js    ← Action OpenAI fallback
    ├── masterRegionContext.js          ← Region OpenAI
    └── masterRequestSpeakContext.js    ← Request Message Reply polish (optional name)
```

Each file should be mostly config, e.g.:

```js
// Conceptual only — do not implement yet
{
  includeIdentity: true,
  includeCapabilities: true,
  includeCurrentState: true,
  includeKnowledge: false,
  situationTypes: [/* … */],
  conversationHistory: { include: true, limit: 6 }
}
```

Then: recipe → `buildAIContext` → `buildAISystemMessage` → OpenAI.

Keep `context/operationContext/` only while search still needs Internal/OpenAI shared **task payloads** (examples, outputFormat). Long-term, Situation + Capabilities should replace duplicated TASK prose — adapters stay thin.

**Tomorrow:** do not create all four. Start by defining recipes on paper / in this doc; implement only when coding Capabilities + Final Response.

---

## 7. Where conversation-history on/off + limit should live

**Today:** only in `CLOUDPILOT_AI_CONFIG` (`OPENAI_SEND_CONVERSATION_HISTORY`, `OPENAI_CONVERSATION_HISTORY_LIMIT`), consumed almost only by `generateGeneralMessageReply`. Every search/polish path hardcodes history **off** in logs and never loads history.

**Target:** history is a field on the **master recipe**, not a separate confusing global for “all AI”:

```text
masterFinalResponseContext.conversationHistory = { include: true, limit: 6 }
masterRegionContext.conversationHistory       = { include: false }
masterActionSearchContext.conversationHistory = { include: false }
masterRequestSpeakContext.conversationHistory = { include: false }
```

Env vars can remain **defaults / ceilings** (ops override), but the recipe is the source of truth for “does this call get history?”

That is the cleanup that makes “what prompt are we sending?” answerable by opening one master file.

---

# Core Context Model

Six first-class concepts for the model, plus conversation history:

| Concept | Question | File / source |
| ----- | ----- | ----- |
| Identity | Who is CloudPilot? | `cloudPilotContext.js` |
| Capabilities | What can I do / retrieve? | `cloudPilotCapabilitiesContext.js` ← from master |
| Situation | What should I look for / do this turn? | `cloudPilotSituationContext.js` |
| Current State | What is happening right now? | `cloudPilotCurrentStateContext.js` |
| Current Question | What did the user just say? | `currentQuestionContext.js` |
| Knowledge | What does this org/product know? | `organizationKnowledgeContext.js` (off for MVP) |
| Conversation History | Continuity only | env / history builder (not a contextType) |

Situation must **not** absorb tools, tool return facts, or “what the user can ask.” That belongs in Capabilities.

---

## 1. CAPABILITIES

What CloudPilot is capable of doing or retrieving.

Authoritative application truth: `masterCloudPilotCapabilities.js`.  
Model-facing projection only: `cloudPilotCapabilitiesContext.js`.

For MVP, the list must reflect **real working functionality** only (see Locked `cloudPilotCanAnswer` above).

> Capabilities answer: "What can CloudPilot know or do?"

Eventually this same catalog answers: "What can you do?"

---

## 2. CURRENT STATE

Current State answers:

> "What is happening right now?"

This should come from authoritative application/DB state.

For example:

```text
Open request:
Scan S3

Region:
us-west-2

Request name:
MVP Scan S3

Status:
waiting_on_confirmation
```

This is more authoritative than conversation history.

VERY IMPORTANT RULE:

If conversation history says:

```text
"Okay, starting your scan..."
```

but the database/current state says:

```text
waiting_on_confirmation
```

then the scan HAS NOT STARTED.

Current State wins.

The model must never infer execution state from an old assistant message when authoritative state exists.

---

## 3. CURRENT QUESTION

The current user message is the primary thing CloudPilot is responding to.

Examples:

```text
"scan my S3 buckets"
```

```text
"yes"
```

```text
"cancel"
```

```text
"what tags does my bucket have?"
```

```text
"what about my EC2 instances?"
```

The model should interpret these using Current State + Capabilities (+ Situation for turn guidance).

---

## 4. CONVERSATION HISTORY

I currently send roughly the last 10–12 messages.

I suspect this may sometimes be making things MORE confusing.

For this MVP, I want to experiment with something smaller, probably around **4–6 recent messages**.

Conversation history exists to help understand:

* references
* follow-up questions
* conversational continuity
* things like "that bucket", "what about EC2?", etc.

It should NOT determine workflow state.

The context should explicitly tell the model something like:

```text
RECENT CONVERSATION

This history is provided only to understand references,
follow-up questions, and natural conversation.

It is NOT authoritative for workflow state.

For current requests, confirmations, collected parameters,
and execution status, use CURRENT STATE.
```

Do NOT send organizational knowledge as part of this MVP experiment.

I want to remove unrelated context while getting Scan S3 + Scan EC2 correct.

---

# Two Different Ways Scan Works

This is an important distinction.

## MODE A — Explicit Scan

Example:

```text
User:
Scan my EC2 instances.
```

This is an explicit workflow.

Conceptually:

```text
User asks for scan
    ↓
Identify EC2 scan capability
    ↓
Collect required information
    ↓
Ask for confirmation if confirmation is required
    ↓
Execute scan
    ↓
Return actual findings
```

This is the workflow we have already been working on.

CloudPilot must never say that the scan started before execution actually happened.

If the request is:

```text
waiting_on_confirmation
```

CloudPilot should clearly ask for confirmation.

Example:

```text
Everything is ready.

Scan EC2 in us-west-2 as "MVP EC2 Scan"?

Confirm to run it, or cancel.
```

Not:

```text
Great! I'm starting the scan now.
```

unless the scan actually starts.

---

# MODE B — Scan/Read Used to Answer a Question

This is different.

Example:

```text
User:
What tags does my S3 bucket have?
```

The user's goal is NOT:

```text
perform an S3 scan
```

The user's goal is:

```text
tell me the tags
```

CloudPilot may need to inspect AWS to obtain that information.

Conceptually:

```text
User asks AWS question
    ↓
Do we already have reliable current information?
    ↓
YES → answer
    ↓
NO
    ↓
Does AVAILABLE CAPABILITIES say CloudPilot
can retrieve this information?
    ↓
YES
    ↓
Use the appropriate read/scan capability
    ↓
Answer the user's actual question
```

I do NOT want this interaction:

```text
User:
What tags does my bucket have?

CloudPilot:
Would you like me to perform an S3 scan?
```

if CloudPilot already has permission/capability to retrieve the information.

The scan/read is an implementation detail.

CloudPilot should simply retrieve what it needs and answer.

This distinction is important:

> Sometimes scan is the user's requested workflow.
>
> Sometimes scan is simply a tool CloudPilot uses to answer the user's question.

---

# MVP REGION

For now, keep this intentionally simple.

Default AWS region:

```text
us-west-2
```

I do not want team/multi-region complexity yet.

If I ask something like:

```text
What EC2 instances do I have?
```

or:

```text
What S3 buckets do I have?
```

CloudPilot should generally use the MVP default of:

```text
us-west-2
```

rather than unnecessarily asking me for a region.

We can build more sophisticated region behavior later.

---

# Example Context Sent to Model

Conceptually I want the model context to become something like:

```text
CLOUDPILOT ROLE

You are CloudPilot.
Help users understand and operate their cloud infrastructure.

--------------------------------------------------

AVAILABLE CAPABILITIES

EC2
- scan instances
- retrieve state
- retrieve instance type / size
- retrieve tags
- retrieve pricing information

S3
- scan buckets
- retrieve tags
- retrieve region
- retrieve encryption
- retrieve public access settings
- retrieve versioning

MVP default region: us-west-2

--------------------------------------------------

CURRENT STATE

Open request:
Scan S3

Region:
us-west-2

Request name:
MVP Scan S3

Status:
waiting_on_confirmation

--------------------------------------------------

RECENT CONVERSATION

[4–6 recent messages]

History helps interpret conversation.
It does not override CURRENT STATE.

--------------------------------------------------

CURRENT USER MESSAGE

"yes"
```

Do not blindly implement this exact string format.

Inspect the existing context-building code and determine the smallest clean change that gives us these conceptual sections.

---

# Capability Catalog vs Current State

Keep these concepts separate.

## Capability Catalog

Answers:

```text
What can CloudPilot know/do?
```

Examples:

```text
EC2:
- scan
- state
- instance type
- tags
- pricing

S3:
- scan
- tags
- encryption
- public access
- versioning
```

## Current State

Answers:

```text
What is happening right now?
```

Example:

```text
type: scan_s3
region: us-west-2
status: waiting_on_confirmation
request_name: MVP Scan
```

Do not mix these into one concept.

---

# Important Behavioral Rules

For this MVP:

1. One open request at a time.

2. Current DB/application state is authoritative.

3. Conversation history never overrides Current State.

4. Never claim an AWS operation started unless it actually started.

5. If the current state requires confirmation, clearly ask for confirmation.

6. Simple responses such as:

```text
yes
no
cancel
go ahead
do it
```

should be interpreted in relation to the current open request.

7. Use `us-west-2` as the MVP default rather than repeatedly asking for region.

8. If the user asks for an AWS fact that CloudPilot is allowed to retrieve, use the appropriate capability and answer the question.

9. Don't unnecessarily expose internal scan mechanics to the user.

10. If the user changes subjects, recognize it.

Example:

```text
User:
What tags does my S3 bucket have?

CloudPilot:
...

User:
What about my EC2 instances?
```

Do not force the EC2 question into the previous S3 workflow.

11. For synchronous operations, return the actual result/findings in the same interaction.

Do NOT say:

```text
The scan is running. I'll let you know when it's finished.
```

if there is no asynchronous mechanism that will actually send another message.

12. Do not add organizational knowledge to this context yet.

---

# Acceptance Conversation

I want this kind of conversation to work reliably:

```text
User:
Scan my S3 buckets.

CloudPilot:
Sure. I'll use us-west-2.
[collect request name if we still require one]

User:
Call it MVP Scan.

CloudPilot:
Ready to scan S3 in us-west-2 as "MVP Scan."
Run it?

User:
Yes.

CloudPilot:
[actually executes]
[returns real findings]

User:
Which buckets have encryption enabled?

CloudPilot:
[answers from reliable findings or retrieves the information]

User:
What tags does bucket X have?

CloudPilot:
[retrieves tags if necessary]
[answers]

User:
What about my EC2 instances?

CloudPilot:
[recognizes subject switch]
[answers or retrieves EC2 information appropriately]
```

Also test:

```text
What can you do?
```

Expected: natural list from the live catalog (Scan S3, Scan EC2, Create EC2, …) — not inventing services. Prefer Internal bullets or OpenAI polish of that same catalog (`show_capabilities`), not freeform General Chat.

```text
scan S3
cancel
```

```text
scan EC2
yes
```

```text
scan S3
change the name to Test Scan
yes
```

```text
what size is my EC2 instance?
```

```text
how much is that instance costing me?
```

```text
what tags does it have?
```

The last example is especially important because recent conversation SHOULD help resolve what "it" means.

That is a good use of conversation history.

---

# Implementation Approach

Before coding:

1. Inspect the existing conversation/context pipeline.
2. Identify exactly where:

   * system instructions are built
   * Current State is loaded
   * recent conversation is loaded
   * capabilities are currently represented
   * intent/action selection happens
   * Scan S3 is invoked
   * Scan EC2 is invoked
3. Report back what currently exists and where these concepts should fit.
4. Identify anything in the current implementation that conflicts with this design.

Then make SMALL changes.

Do not rewrite the whole conversation system.

Do not create a generalized agent framework.

Do not create a large scope engine.

Do not add RDS, Lambda, Jira, Slack, organizational knowledge, remediation, or unrelated features.

The target is:

```text
Scan S3
+
Scan EC2
+
excellent conversation
```

---

# Build Order

Work in this order:

```text
1. Capability catalog for S3 + EC2
        ↓
2. Clean authoritative Current State
        ↓
3. Reduce / clearly label recent conversation
        ↓
4. Perfect explicit Scan S3
        ↓
5. Perfect explicit Scan EC2
        ↓
6. Add direct factual AWS questions
        ↓
7. Test follow-ups and pronouns
        ↓
8. Test cancel / confirmation
        ↓
9. Test switching between S3 and EC2
```

Do not move ahead just because one happy-path test passes.

---

# Definition of Success

Success tomorrow is NOT:

```text
CloudPilot supports lots of AWS actions.
```

Success is:

```text
I can talk naturally to CloudPilot about S3 and EC2
and it consistently understands:

- what I am asking
- what it is capable of retrieving
- what request is currently open
- whether confirmation is required
- whether something actually executed
- what previous conversation is relevant
- when I changed subjects
```

I want these two capabilities to become the clean foundation we can expand later.

Once this works, adding another AWS service should increasingly mean:

```text
add capability
+
add tool/data retrieval
+
reuse conversation model
```

rather than redesigning CloudPilot's conversation system every time.

---

# Turn trace (actual code — no redesign)

Message: **`can you scan my S3 buckets`**  
Assumption: conversation has **no** open request (or replace is OK).  
Architecture labels: UNDERSTAND / DECIDE / FULFILL / RESPOND / SUPPORTING — mapped onto existing functions, not a proposed rewrite.

## Compact flow

```text
logic/messages.js
  → processMessage                                          SUPPORTING (conductor)
  → getUsersActionState                                     SUPPORTING
  → CloudPilotIntelligence.understandMessage                UNDERSTAND
       → searchMessageForValues (region skipped)            UNDERSTAND
       → searchMessageForQuestion (S3 inventory skipped)    UNDERSTAND
       → searchMessageForAction → scan_s3                   UNDERSTAND  ← scan_s3 selected
  → interpretOpenRequestEffect                              SUPPORTING (no open request)
  → decideNextStep → buildNewRequestDecision                DECIDE
  → RequestWorkflow.store → startRequest                    FULFILL (create request row only)
  → RequestWorkflow.execute → no-op                         FULFILL (skipped — not confirmed)
  → RequestConversation.conversation                        RESPOND (route)
  → CloudPilotMessage.prepareRequestMessageReply            RESPOND
       → requestTemplates (new_action / missing fields)     RESPOND
       → optional generateRequestMessageReply (OpenAI polish) RESPOND / Intelligence
```

**On this turn Atlas / `scanS3Handler` is NOT called.** Confirmation (+ filled fields) is a later turn.

## Phase detail

### Entry

| | |
| --- | --- |
| Control | `logic/messages.js` → `cloudPilotMessageFunctions.processMessage(raw, conversationID, context)` |
| In | User text `"can you scan my S3 buckets"`, conversationID, optional selectedFinding |
| Out | processMessageOutcome with `cloudPilotMessage`, atlas payload, etc. |

### Load state — SUPPORTING

| | |
| --- | --- |
| Control | `requestLoadFunctions.getUsersActionState(conversationID)` |
| In | conversationID |
| Out | Empty-ish request state if nothing open (`pendingAction` null) |
| Next | understand |

### UNDERSTAND — Intelligence

| | |
| --- | --- |
| Control | `CloudPilotIntelligence.understandMessage` → `understand/masterUnderstanding.js` |
| In | message string + requestState |
| Calls | values, reply, conversation, question, action searches |
| Intelligence | Yes — this is the UNDERSTAND service |
| Context assembled? | Region skipped (no open request needing region). Action: Internal match usually wins; OpenAI Action Search only if Internal finds nothing **and** actionSearch=openai. For this phrase Internal matches `matchesScanS3Intent` (`scan` + `s3`) → **no** Action OpenAI / no `buildAIContext` for Final Response. |
| Out | `{ action: 'scan_s3', values: {}, reply: null, conversation: null, question: null, … }` |
| **Where scan_s3 selected** | `searchMessageForActionInternal` → `masterCloudPilotCapabilities.scan_s3.match` / `matchesScanS3Intent` |
| Next | `interpretOpenRequestEffect` then `decideNextStep` |

S3 inventory Question search is **skipped** because message contains `scan` (explicit scan stays on Action path).

### Open-request effect — SUPPORTING

| | |
| --- | --- |
| Control | `interpretOpenRequestEffect` |
| In | understanding + empty request state |
| Out | `affectsOpenRequest: false` |
| Next | decide |

### DECIDE — CloudPilot

| | |
| --- | --- |
| Control | `decideNextStep({ understanding, requestState })` |
| Path | `u.action === 'scan_s3'` → `shouldStartNewRequest` true → **`buildNewRequestDecision`** |
| Out | `chatType: cloudPilotResponding`, `request: { action: scan_s3, missing: ['region'], status: waiting_on_fields, … }`, `response.type: ask_for_missing_fields`, `replaceOpenRequest: true` |
| Confirmation? | **Not yet.** Fields incomplete → ask missing (region). After region complete, later decisions use `awaiting_confirmation` (scan_s3 has no executionModes). |
| Next | Request path (not GeneralConversation) |

### FULFILL (this turn = create request only)

| | |
| --- | --- |
| Control | `requests/workflow.store` → `requestFunctions.applyDecision` → **`startRequest`** |
| In | decision + conversationID |
| Out | DB `cloudpilot_requests` row created; status `waiting_on_fields`; missing `region` |
| Then | `RequestWorkflow.execute` → `executionFunctions.executeRequest` → **`shouldRunExecution` false** (response is not `execution_started`) → returns null / does not run |
| **When would scanS3Handler run?** | Later turn: user confirms while status `waiting_on_confirmation` → decide returns `EXECUTION_STARTED` → `executeRequest` → `AutomaticLogic` → `runAction('scan_s3')` → `scanS3Handler` → Atlas |

### RESPOND — this turn

| | |
| --- | --- |
| Control | `RequestConversation.conversation` |
| Path | No executionOutcome → map `ASK_FOR_MISSING_FIELDS` + store action `created` → `actionEvent: new_action` |
| Then | `CloudPilotMessage.prepareRequestMessageReply` |
| Templates | `requestTemplates.getRequestMessageReply` → missing-field / started copy for Scan S3 |
| Intelligence? | Optional: `generateRequestMessageReply` if MESSAGE_RESPONSE=openai — **custom presentation TASK**, not `masterFinalResponseContext` / General Chat |
| Out | User-facing string asking for region (and possibly request name prompt) |

## What this turn is NOT

- Not General Chat / `masterFinalResponseContext`
- Not Atlas S3 scan
- Not confirmation yet
- Not `"What S3 buckets do I have?"` (inventory question path)

## Suggested next trace (still no code)

Second message: **`yes`** (or region then confirm) after fields complete — maps confirmation → FULFILL execute → RESPOND with findings.



---

# Source: `feature_conversation.md`

# Feature Conversation

**Status:** Active  
**Codename:** `feature_conversation`  
**Last updated:** 2026-09-08  

**Related:** [Current Development](./current_development.md) · [contextTemp](../../contextTemp.md) · [CloudPilot Context how-to](../how_to/cloud_pilot_context.md) · [Feature Chat](../finished/feature_chat.md) · [MVP](../feature_mvp.md)

---

## Current step

**Step 2 done — Current State carries open-request DB facts.**  
**Architecture inspection + Capability/Scope notes recorded.**  
**Step 3 started — open-request effect interpretation (affect / leave alone / mixed).**  
**MVP AWS default region (locked): `us-west-2`** — no team/org/multi-region scope engine.

| Step | Goal | Status |
|------|------|--------|
| **1** | Prove open request exists? YES / NO | Done (temp test) |
| **2** | If YES: prove Current State has the useful DB facts | **Done** |
| **3** | If YES: does this message affect the open request? | **In progress** |
| **4** | Branch B / normal conversation when no open request | Not started |

Temp debug: `CLOUDPILOT_CURRENT_STATE_TEST=1` (early return after STEP 2; read-only).  
Unset / not `1` = normal CloudPilot pipeline.

---

## Architectural model (locked for this work)

**One conversation pipeline.** An open request runs *alongside* the conversation — not a separate restrictive “request mode.”

```text
                         USER MESSAGE
                              ↓
                    LOAD DATABASE STATE
                              ↓
                       OPEN REQUEST?
                              ↓
                   BUILD CURRENT CONTEXT
                              ↓
                 UNDERSTAND CURRENT MESSAGE
                              ↓
              Can answer questions / retrieve facts /
              start new work / normal conversation
                              +
                    IF OPEN REQUEST = YES
                              ↓
                 Does THIS message affect
                 the open request?
                              ↓
             information | confirm | cancel | leave alone
```

Unrelated questions must **not** cancel or advance the open request.  
Confirm-like language only advances when Current State says the request is ready for that.

Later interpretation (Step 3) needs trustworthy facts — that is why Step 2 exists.

---

# Architecture inspection (2026-09-08) — DO NOT CODE YET

Inspection only. No refactor, no agents, no multi-request support, no schema/prompt/bug fixes in this pass.

## High-level target (product)

```text
EVERY USER MESSAGE
    ↓
1. Load database state
    ↓
2. Open request? YES / NO   (DB — not OpenAI; MVP max one open request)
    ↓
3. Understand current user message
    ↓
4. Retrieve allowed read-only facts if needed
    ↓
5. Update / execute request state only when appropriate
    ↓
6. Build five contexts
    ↓
7. Generate one natural response
```

**Database = source of truth for request state.**

### Open request = YES — not a separate restrictive mode

Normal conversation still works. Determine whether **this message** affects the open request.

| User message (open: Scan EC2, waiting for region) | Desired |
|---------------------------------------------------|---------|
| `use us-west-2` | Update region; check readiness |
| `what is DynamoDB?` | Answer normally; **leave request untouched** |
| `use us-west-2 and also what is DynamoDB?` | Update request **and** answer DynamoDB in **one** natural reply |

Eventually (not now): provide / correct info, confirm, cancel, ask about request, unrelated questions — same turn possible.

### Open request = NO

Normal conversation: general Q&A and detect new requests (e.g. “scan my EC2”). Do not redesign new-request handling yet.

### Read-only capabilities vs requests

| | Meaning |
|--|---------|
| **REQUEST** | Work CloudPilot is managing / changing / explicitly executing |
| **READ CAPABILITY** | Quiet retrieve to answer a question (inventory, AI usage, billing, open requests, …) |

Example: “How many S3 buckets?” → need S3 inventory capability → retrieve facts → context → answer. **Do not** auto-create a “Scan S3” open request just to answer.

MVP clarification: use org/default region if reliable; else one short ask; never invent region; no multi-region intelligence yet.

### Five contexts (keep)

1. Identity · 2. Situation · 3. Knowledge · 4. Current State · 5. Current Question  

App owns truth/state; OpenAI understands language and writes the response. Gather facts first → one coherent context → one reply.

### Future multiple requests (do not build)

Avoid architecture that *permanently* assumes one forever. Later: named requests + clarification when “use us-west-2” is ambiguous. **Not now.** MVP stays max one open request.

---

## Inspection answers (current code vs target)

### 1. Message flow: `messages.js` → final response

```text
postMessage (atlas/logic/messages.js)
  → save user message
  → processMessage (cloudPilot/chat/cloudPilotMessageFunctions.js)
      → getCurrentUserMessage
      → getUsersActionState          // STEP 2 — DB open request
      → CloudPilotIntelligence.understandMessage
      → decideNextStep
      → IF GENERAL_CHAT_RESPONDING:
            GeneralConversation.conversation
              → prepareGeneralMessageReply → generateGeneralMessageReply
      → ELSE (CLOUD_PILOT_RESPONDING):
            RequestWorkflow.store
            (optional preflight)
            RequestWorkflow.execute
            RequestConversation.conversation
      → attach undo / atlas payload
  → save CloudPilot message
  → res.json
```

Temp: `CLOUDPILOT_CURRENT_STATE_TEST=1` short-circuits after STEP 2.

### 2. Where open request state is loaded

| Layer | Location |
|-------|----------|
| Pipeline | `processMessage` → `RequestStateFunctions.getUsersActionState(conversationID)` |
| Load | `requests/functions/requestLoadFunctions.js` → `getUsersActionState` |
| SQL | `Request.getOpenActionForConversation` — `is_open = 1 LIMIT 1` |
| Shape | `pendingAction`, `status`, `executionMode`, `workflowId`, `collected`, `missing`, `asked` |

**DB, not OpenAI.** MVP already max one open row per conversation.

### 3. Where request vs general conversation diverge

Primary gate: `decideNextStep` → `chatType`

- `GENERAL_CHAT_RESPONDING` → general path (skip store/execute)
- `CLOUD_PILOT_RESPONDING` → request path (store / execute / request speak)

Fork lives in `processMessage` after decide (+ question guardrail may rewrite general → question decision).

### 4. Can normal conversation continue cleanly while an open request exists?

**Partially — not cleanly / not by target design.**

Can reach general chat with an open request when understanding has no actionable action, no applicable values, no question, no confirm/cancel/mode reply, and status is not RUNNING / resource-scan waiting → `buildGeneralChatDecision()`; Current State can appear in the general system prompt.

**Does not continue cleanly when:**

- Same action rematched → re-prompt request chat, skip general
- Values in message → merge into open request
- Confirm/cancel/mode phrases → advance/close request
- Different new action → replace open request
- `ec2_inventory` / `s3_inventory` questions → **new scan request** (can replace open)
- `inventory_aws` / `show_billing` while open non-final → **blocked**
- Soft “yes” while waiting confirmation → may start execution

### 5. Where understanding checks signals

`understandMessage` (`cloudPilotIntelligence/understand/understandMessage.js`):

| Signal | Search |
|--------|--------|
| Values (region, …) | `searchMessageForValues` (uses `requestState`) |
| Confirm / cancel / mode | `searchMessageForReply` |
| Conversation commands | `searchMessageForConversation` |
| Questions | `searchMessageForQuestion` (open_requests → ai_spend → ec2_compute_cost → ec2_inventory → s3_inventory) |
| New / rematched actions | `searchMessageForAction` (**Current State excluded** from OpenAI classify) |

Interpretation of those signals is in **`decideNextStep`**, not understand.  
**There is no explicit “does this message affect the open request?” gate.**

### 6–7. Read-only capability–like paths today

| Capability | How it runs | Creates request? | Into five-context Current State? |
|------------|-------------|------------------|----------------------------------|
| Open requests Q | Known reply from loaded `requestState` | No | N/A (answers from state) |
| AI usage / spend Q | Immediate execute `show_ai_usage` | No | No — reply/atlas only |
| Billing (`show_billing`) | Immediate execute | No | No |
| AWS inventory phrase (`inventory_aws`) | Immediate execute | No | No |
| EC2 inventory natural Q | **`buildNewRequestDecision(scan_ec2)`** | **Yes** | Only after request row exists |
| S3 inventory natural Q | **`buildNewRequestDecision(scan_s3)`** | **Yes** | Same |
| EC2 compute cost Q | Known reply (pricing tables) | No | No |

**Critical gap vs target:** “How many S3 buckets?” is treated like starting Scan S3 work, not a quiet read capability. Read results are **not** folded into a shared turn-facts context for later interpretation — they become that turn’s reply.

Immediate reads (`inventory_aws`, `show_billing`) are **suppressed** when a non-final open request exists.

### 8. How Current State is built

`cloudPilotIntelligence/context/contextTypes/cloudPilotCurrentStateContext.js` → `buildCurrentStateContext`  
Assembled in `buildAIContext` / rendered in `buildSystemMessage.writeCurrentState`.

```js
// Open
{ hasOpenRequest: true, openRequest: { action, label, status, collected, missing, id?, executionMode?, waitingFor? }, createEc2? }

// Closed
{ hasOpenRequest: false, openRequest: null }
```

Source: already-loaded STEP 2 `requestState` (no second DB trip in the builder).

### 9. Who sees Current State today

| Consumer | Current State five-context block? |
|----------|-----------------------------------|
| General chat final reply | **Yes** |
| Action classification (OpenAI) | **No** (`includeCurrentState: false`) |
| Understand / decide | Raw `requestState` object — not the five-context block |
| Request final response | **No** — templates / SPEAK FACTS / different stack |
| Question / immediate execute | Handler facts or `requestState`, not Current State context object |

### 10. Smallest architectural gap vs target

```text
TARGET:  load → open YES/NO → understand → affect? (leave alone OK) → read facts → update only if appropriate → five contexts → one response

TODAY:   load → understand signals → decide binary chatType → General OR Request (store/execute/speak)
         five contexts mainly on General path; request path is a parallel presentation system
```

| Target step | Status |
|-------------|--------|
| Every message / load DB | Exists |
| Explicit OPEN YES/NO for routing | Weak — flag exists; not an interpretation gate |
| Understand | Exists |
| Affect open request without blocking normal chat | **Missing (Step 3)** |
| Allowed read without replacing/blocking request | **Partial** (spend/billing/inventory_aws immediate; EC2/S3 inventory create requests) |
| Update/execute only if appropriate | Heuristic only |
| Five contexts → one response | **Partial** (general yes; request path parallel) |

---

## Inspection summary

### 1. What already exists

- End-to-end turn: `postMessage` → `processMessage` → understand → decide → general **or** request → save reply  
- Open request from MySQL (`getUsersActionState` / `getOpenActionForConversation`) — max one  
- Understanding taxonomy: Action / Value / Reply / Conversation / Question  
- Decision layer: confirm, cancel, modes, field merge, new request, immediate execution, general chat, questions  
- Request store/execute workflow  
- Current State with open-request facts; wired into **general** chat system messages  
- Some read-ish behaviors (open-requests Q, AI spend, billing/inventory immediate, compute-cost Q)  
- Five-context scaffolding for general chat  

### 2. What is missing

- Explicit **“does this message affect the open request?”** (affect / confirm / cancel / **leave alone**)  
- True **one response** path that always builds five contexts (request speak is parallel)  
- Read capabilities that **never** replace/block an unrelated open request (esp. EC2/S3 inventory questions)  
- Feeding read results into turn context for interpretation (not only into the reply)  
- Situation often unused; Knowledge limited on general reply  
- Temp `CLOUDPILOT_CURRENT_STATE_TEST` still present  

### 3. What currently causes the request / general-chat conflict

1. **Binary fork** after decide — request mode re-asks instead of “leave alone + answer”  
2. **Action rematch** on soft language while same request is open  
3. **Value merge** treating incidental fields as request updates  
4. **Confirm/cancel** phrase matching without a dedicated affect/readiness gate  
5. **Inventory questions** → `buildNewRequestDecision` → close/replace open request  
6. **Immediate reads** blocked while a non-final open request exists
7. **New different action** always replaces the open request (one-open policy)  

### 4. SINGLE smallest next implementation step

**Implement Step 3:** after STEP 2 load + Current State facts, add an explicit  
**“does this message affect the open request?”** decision  
(`affect` / `confirm` / `cancel` / `leave alone`)  

Route **`leave alone`** to normal conversation / question fulfillment **without mutating** the open request.

Insertion point: between `understandMessage` and today’s aggressive branches in `decideNextStep` (or a thin helper called from `decideNextStep` when `pendingAction` is set), consuming Current State readiness so confirm only advances when status allows it.

Do this **before** broader tools/read redesign or removing the general-vs-request conversation split.

**STOP here until Step 3 is intentionally started.**

---

## Capability + Scope (aligned — do not build a generic scope engine yet)

**Yes — this aligns** with the inspection target (REQUEST vs READ CAPABILITY, clarification MVP, five contexts, one coherent reply). Capture it as a high-level product/architecture concept now; keep MVP implementation small.

### Separation

| Concept | Question it answers | Examples |
|---------|---------------------|----------|
| **Capability** | What can CloudPilot do? | Scan EC2, View S3 inventory, OpenAI spend, Pause EC2 |
| **Scope** | Against what should it do that? | org / team / account / region / instance / time period |

Do **not** bury workflow mechanics inside “what am I capable of.”  
Do **not** put operational scope inside **Identity** (who CloudPilot is). Scope belongs with **Current State / organization context** (and per-turn overrides).

### Example catalog (conceptual)

| Capability | Type | Scope it may need |
|------------|------|-------------------|
| Scan EC2 | Read (managed request today) | account/team + region |
| Scan S3 | Read (managed request today) | account/team, maybe region |
| View EC2 / S3 inventory | Read (quiet) | account/team + region |
| Get OpenAI Spend | Read | organization/team + time period |
| Get AWS Spend | Read | account/team + time period |
| Pause / Resume EC2 | Change | account/team + region + instance |
| Update EC2 Tag | Change | account/team + region + instance |
| Create EC2 | Change | account/team + region + configuration |

Type here is product language (**Read** vs **Change**). That is related to—but not identical to—today’s code split (`requiresWorkflow`, immediate execute, question handlers). Inventory-as-question vs Scan-as-request is exactly the gap called out in the inspection.

### Capability then scope

```text
USER: Scan EC2.          → CAPABILITY
USER: Just my team.      → SCOPE
USER: Only us-west-2.    → SCOPE

USER: Scan our team's EC2 instances in us-west-2.
→ CAPABILITY: Scan EC2
→ SCOPE: Team = user's team, Region = us-west-2
```

Defaults + one clarification when scope matters and is unknown — do not ask every time.

```text
Organization: Kite
Team: Platform
Default AWS region: us-west-2
```

`"Only check us-east-1 this time"` overrides for that operation without changing org default.

### Conceptual CURRENT SCOPE (later)

```text
CURRENT SCOPE
Organization: Kite
Team: Platform
AWS Account: Production
Region: us-west-2
```

Capabilities consume scope; not Identity.

### MVP — keep deliberately smaller

**Do not build a generic scope engine now.**

MVP catalog (product list, not a new subsystem):

```text
CLOUDPILOT CAPABILITIES

AWS
• Scan EC2 / Scan S3
• View EC2 inventory / View S3 inventory
• View AWS spend

AI
• View OpenAI spend

EC2 Changes
• Pause / Resume / Create / Delete EC2
• Update EC2 tags
```

Each capability declares a few needs (conceptual):

```text
Scan EC2        needs: region
Pause EC2       needs: region, instance
OpenAI Spend    needs: (nothing for MVP)
```

If required scope is known from trustworthy context → use it.  
If missing and necessary → **one** short clarification. Never invent region.

Multi-capability same turn (later polish, not Step 3 blocker):

```text
User: Scan EC2 for my team in us-west-2, and how much have we spent on OpenAI?

Capability 1: Scan EC2     Scope: team + us-west-2
Capability 2: OpenAI Spend Scope: team
→ gather → one coherent OpenAI response
```

### How this maps to code today (alignment check)

| Idea | Today | Gap |
|------|-------|-----|
| Capability list | Roughly `actionMap.js` + question searches | No single product “capability catalog”; inventory Q ≠ quiet read |
| Needs / required fields | `requiredFields` on actions (e.g. region) | Exists for workflow actions; not unified for quiet reads |
| Scope defaults | Org knowledge / env / collected fields — partial | No explicit CURRENT SCOPE context object |
| Scope in Identity | Identity is who CloudPilot is | **Agree: do not put team/region scope in Identity** |
| Read vs Change | Immediate execute vs `requiresWorkflow` vs questions | Inventory questions still create/replace **requests** |

### Relationship to next step

**Step 3** (affect open request?) is the active code step.  
Capability + Scope remains the **north-star abstraction** for later catalog / quiet reads / defaults — document now, implement small later. Do not start a generic scope engine before Step 3 is solid.

### MVP default AWS region (locked 2026-09-08)

```text
region = us-west-2
```

When a future quiet AWS read needs a region and the user did not specify one, assume `us-west-2`.  
Do **not** build team / org / account / multi-region clarification as part of Step 3.

Constant: `interpretOpenRequestEffect.js` → `MVP_DEFAULT_AWS_REGION` (recorded for later reads; Step 3 does not invent quiet S3/EC2 inventory redesign).

---

## Step 3 — Open request effect (implementation notes)

**Insertion:** after `understandMessage`, before `decideNextStep` (`cloudPilotMessageFunctions.processMessage`).

**Files:**

| File | Role |
|------|------|
| `cloudPilot/requests/interpretOpenRequestEffect.js` | Interpretation: affect / information / confirm / cancel / leave alone |
| `cloudPilot/chat/cloudPilotMessageFunctions.js` | Attach effect, log, apply info merge when continuing normal conversation |
| `cloudPilot/requests/decideNextStep.js` | Gate confirm/cancel/rematch; mixed → general/question without swallowing turn |

**Behavior:**

- Open request is background state, not a restrictive mode.
- `affectsOpenRequest` does **not** send the entire message into request-only workflow.
- Mixed: update applicable values (e.g. region) **and** continue general/question on the same original message.
- Confirm only when status is waiting on confirmation (and mode rules allow).
- Soft “yes” / “let’s do that” when **not** waiting on confirmation → leave alone.

**Log:**

```text
OPEN REQUEST EFFECT
affects: YES|NO
type: information|confirm|cancel
values:
  region: us-west-2
```

---

## What changed (Step 2)

### Files

| File | Change |
|------|--------|
| `cloudPilotIntelligence/context/contextTypes/cloudPilotCurrentStateContext.js` | Explicit `hasOpenRequest`; richer `openRequest` |
| `cloudPilotIntelligence/context/buildSystemMessage.js` | `writeCurrentState` renders action, status, collected, missing |
| `cloudPilot/chat/cloudPilotMessageFunctions.js` | Temp test builds Current State and returns a readable snapshot |

### Current State shape (now)

**Open request:**

```js
{
  hasOpenRequest: true,
  openRequest: {
    id: 69,                          // workflowId when present
    action: 'scan_ec2',
    label: 'Scan EC2',
    status: 'waiting_on_confirmation',
    collected: { region: 'us-west-2', request_name: 'MVP Prep' },
    missing: []
    // executionMode when set
    // waitingFor: alias of missing when non-empty (compat)
  }
}
```

**No open request:**

```js
{
  hasOpenRequest: false,
  openRequest: null
}
```

Source of truth remains DB / STEP 2: `getUsersActionState` → `Boolean(pendingAction)`.  
Still **not** OpenAI.

### System message excerpt (General Chat)

When Current State is included, OpenAI can see:

```text
CURRENT CLOUDPILOT STATE

HAS OPEN REQUEST: YES

Open request:
Action: Scan EC2 (scan_ec2)
Status: waiting_on_confirmation
Collected:
- region: us-west-2
Missing: none
```

### Temp test reply (`CLOUDPILOT_CURRENT_STATE_TEST=1`)

After STEP 2 only (no understand / decide / execute):

```text
Open request: YES

Type: scan_ec2
Action: Scan EC2
Status: waiting_on_confirmation
Collected:
- region: us-west-2
Missing: none
```

or:

```text
Open request: NO
```

---

## Manual checks

With `CLOUDPILOT_CURRENT_STATE_TEST=1` and API restarted:

1. **No open request** → send `hello` → `Open request: NO`
2. **Open Scan EC2**, region filled, waiting on confirm → send `hello` → YES + status + collected region + Missing: none

Unset the env (or anything other than `1`) to restore the normal pipeline.

---

## Explicitly not done yet

- Interpreting `"lets do that"` / `"yes"` against the open request  
- Leaving open request untouched during unrelated Q&A (needs Step 3)  
- Redesigning General vs Request Conversation split  
- Identity / Situation / Knowledge / Current Question changes  
- Removing the temp early-return flag  

---

## Longer roadmap (Phases 1–6)

The original “better conversation → tools → broader AWS → memory → safe actions → production” phases remain below for later. **Do not start Phase 2 tools work until the Current State → interpretation steps above are solid.**

---

# Phase 1 — MVP: Better Conversation (later / parallel polish)

**Goal:** Make CloudPilot feel much more natural, useful, and coherent with the infrastructure knowledge it already has.

### Model / OpenAI

* [ ] Move general conversation from `gpt-4o-mini` to a stronger current model
* [ ] Move general conversation to the Responses API
* [ ] Keep the existing deterministic AWS questions/actions working
* [ ] Do **not** redesign the entire AWS retrieval architecture yet

### Conversation quality

* [ ] Clean up the system/developer prompt
* [ ] Remove the duplicated current user message from the system prompt
* [ ] Keep permanent CloudPilot behavior/instructions separate from dynamic AWS context
* [ ] Make responses more conversational and less like generated reports
* [ ] Let the model naturally explain, compare, summarize, and answer follow-ups when it has enough information
* [ ] Make uncertainty explicit when CloudPilot does **not** have enough AWS information

### Conversation memory

* [ ] Improve beyond the simple “last 12 database rows” approach
* [ ] Preserve enough recent conversation for natural follow-ups
* [ ] Keep track of the current subject/resource when practical
* [ ] Avoid treating old AWS facts from conversation history as guaranteed current truth
* [ ] Make conversation continuity consistent across the main chat paths

### Existing context

* [x] Enrich Current State with open-request DB facts (`hasOpenRequest`, status, collected, missing)
* [ ] Continue supplying known AWS facts from the existing CloudPilot system
* [ ] Preserve the current grounding rules: don't invent resources, findings, costs, or state
* [ ] Preserve existing organization-knowledge behavior
* [ ] Preserve selected-finding allowlists
* [ ] Keep deterministic operations for questions CloudPilot already knows how to answer

### Basic validation

* [ ] Create ~10–20 realistic CloudPilot conversations
* [ ] Include follow-ups such as:

  * “What EC2 instances do I have?”
  * “Which ones are stopped?”
  * “Tell me more about that one.”
  * “Is that costing me anything?”
  * “What should I fix?”
  * “Why?”
* [ ] Compare old vs. new conversation quality
* [ ] Verify CloudPilot doesn't confidently invent missing AWS information

**Phase 1 success = CloudPilot feels substantially more like talking to ChatGPT, while keeping roughly the infrastructure capabilities it already has.**

---

# Phase 2 — AI Can Investigate AWS

**Goal:** Stop requiring CloudPilot to predict every possible infrastructure question beforehand.

* [ ] Add model tool/function calling
* [ ] Start with EC2 only
* [ ] Small read-only tool set (`search_resources`, `get_resource_details`, `get_cost_data`, `get_findings`, …)
* [ ] Multiple tool calls per turn; structured AWS data; freshness / scope
* [ ] Tools strictly read-only

**Phase 2 success = the AI can decide what infrastructure information it needs and retrieve it itself.**

---

# Phase 3 — Broader Infrastructure Understanding

**Goal:** Expand the successful EC2 pattern across AWS (S3, RDS, Lambda, networking, billing, findings, relationships, …).

---

# Phase 4 — Better Memory & Organizational Knowledge

**Goal:** Ongoing conversation subject + separate infrastructure truth + richer org knowledge.

---

# Phase 5 — From Answers → Safe Actions

**Goal:** Connect conversational intelligence to existing controlled remediation (confirm / modes / verify / undo).

```text
AI READ → fairly autonomous
AI CHANGE → CloudPilot authorization + safety controls
```

---

# Phase 6 — Production Quality / Scale

**Goal:** Eval suite, groundedness, cost/latency, security, telemetry.

---

## Roadmap order

```text
NOW — Context rebuild (existence → facts → interpretation → action)
        ↓
PHASE 1 polish — model / prompt / history quality
        ↓
PHASE 2 — AI retrieves EC2 itself
        ↓
PHASE 3–6 — broader AWS, memory, safe actions, production
```



---

# Source: `feature_chat_guardrails.md`

# Feature Chat Guardrails — Off-Topic Conversation

## What this does

Allow occasional non-technical conversation so CloudPilot feels natural, but prevent a conversation from drifting indefinitely away from CloudPilot’s purpose.

Casual answers are fine. Becoming a worse general ChatGPT is not.

## Status

**Future / backlog — do nothing for MVP demos.**

Current off-topic answers (e.g. LOTR) are harmless and even useful as a smoke that general chat works. Prioritize scan behavior, AI usage, and [Feature Chat](../finished/feature_chat.md) (friendlier request-field responses) before this.

**Codename:** `feature_chat_guardrails`  
**Related:** [Feature Chat](../finished/feature_chat.md) · [CloudPilot Context](../finished/feature_cloud_pilot_context.md) · [Future work](./future.md) · [Current Development](../current/current_development.md)

---

## Goal (one sentence)

Allow a little off-topic chat, then gently recenter on technology / cloud / engineering work using a **consecutive conversation streak** — not a lifetime counter.

---

## Proposed behavior

### 1st off-topic — answer normally + gentle redirect

User: *Which LOTR movie is your favorite?*

```text
I’d probably go with The Return of the King — hard to beat that ending.

I’m mainly here to help with technology, AWS, and your engineering work,
but I’m happy to entertain the occasional LOTR question.
```

Nicer than refusing.

### 2nd–3rd off-topic — still answer, shorter

User: *Who's your favorite character?*

```text
Sam is hard to beat.

But I should probably earn my keep eventually — what are we building or fixing?
```

### ~4th consecutive off-topic — stop answering the unrelated question

User: *What about Harry Potter?*

```text
I’m going to pull us back to work. I’m here primarily to help with your
technology, AWS, and engineering tasks. What can I help you with?
```

Use a **deterministic redirect** here — don’t keep spending tokens on the off-topic thread.

---

## Important: consecutive, not lifetime

```text
AWS question        → offTopicCount = 0
LOTR                → 1
LOTR                → 2
AWS question        → 0
Star Wars           → 1
```

A months-long conversation must not get blocked because the user asked four unrelated questions over time. Reset on any in-domain turn.

---

## Implementation sketch (later)

```text
User Message
    ↓
General Chat
    ↓
Is this related to CloudPilot's domain?
    ↓
YES → normal response + reset offTopicCount
NO  → increment offTopicCount
    ↓
1–3 → OpenAI can answer + remind user of CloudPilot's purpose
4+  → deterministic redirect (no off-topic answer)
```

Keep it small. Prefer a streak on the conversation (request/session state or recent message classification), not a new product platform.

---

## In-domain should be broad

Do **not** restrict to AWS only. Allow at least:

```text
AWS
software engineering
programming
databases
SQL
GitHub
DevOps
cloud
architecture
debugging
security
infrastructure
engineering questions
CloudPilot itself
workplace / technical questions
```

The filter only needs to catch things that are **clearly unrelated** (movies, sports, pure trivia, etc.).

---

## Locked when we pick this up

| Topic | Decision |
|-------|----------|
| Scope | General chat only — not request field collection / Questions |
| Counter | **Consecutive streak** per conversation; reset on in-domain |
| Soft limit | Answer + purpose reminder (~1–3) |
| Hard limit | Deterministic redirect (~4+); stop answering off-topic |
| Domain | Broad tech / engineering — not AWS-only |
| MVP | **Out** — backlog only |

---

## Non-goals (for this feature)

- Refusing the first casual question
- Lifetime / account-wide off-topic quotas
- Turning CloudPilot into a content-moderation system
- Blocking request workflows or Questions

---

## Priority reminder

Suggested order before this:

1. Scan behavior  
2. AI usage (live path)  
3. Friendlier OpenAI request-field responses — [feature_chat](../finished/feature_chat.md) (done)  
4. **This** off-topic guardrail



---

# Source: `feature_message_reply_followups.md`

# Message Reply Follow-ups — After Important Fixes

## What this is

Intentional leftovers from [Important Fixes](../finished/feature_important_fixes.md).

That feature shipped **naming clarity + mental model cleanup**. These items are **not** unfinished naming. They are separate architectural or organizational decisions. Do not reopen Important Fixes to do them.

**Status:** Future — **open:** #1 provider architecture · #4 responsibility leaks  
**Closed:** #2 general rename · #3 `questions/` pillar + Understanding vocabulary  
**Codename:** `feature_message_reply_followups`  
**Came from:** Closing [Important Fixes](../finished/feature_important_fixes.md) (2026-08-16)  
**Related:** [CloudPilot Turn](../how_to/cloud_pilot_turn.md) · [Intelligence Provider](../finished/feature_intelligence_provider.md) · [Questions](../finished/feature_questions.md) · [`questions/README.md`](../../../cloudPilot/questions/README.md)

---

## Why they were split out

| Leftover | What it really is | Status |
| -------- | ----------------- | ------ |
| Internal AI no-op for Request Message Reply | **Provider architecture follow-up** | Open |
| Two responsibility leaks | **Real logic-move refactors** | Open |
| `generateGeneralReply()` → `generateGeneralMessageReply()` | Tiny vocabulary cleanup | **Closed** |
| `questions/` folder + Understanding lock | Folder / product-boundary | **Closed** |

---

## Open follow-ups

### 1. Move deterministic Request Message Reply behind Internal AI

**Kind:** Provider architecture

**Today**

```text
getRequestMessageReply()          → deterministic text (templates)
prepareRequestMessageReply()      → holds that text
generateRequestMessageReply()
    Internal → { success: false, message: '' }   # no-op
    OpenAI   → reword or fail
caller keeps template text when Internal / OpenAI fails
```

**Target**

```text
getRequestMessageReplyContext()
    ↓
generateRequestMessageReply()
   ┌────┴────┐
Internal   OpenAI
   │          │
   └────┬─────┘
        ↓
 SAME shape: success + Message Reply text
```

Internal AI should return `success: true` + deterministic Message Reply. OpenAI returns reworded text (or falls back to Internal result). Caller should not keep a side copy of “template vs AI.”

**Touches:** `generateRequestMessageReply.js`, `CloudPilotMessage.prepareRequestMessageReply`, possibly where `getRequestMessageReply()` lives relative to Intelligence.

**Not:** A rename-only change.

---

### 4. Fix two responsibility leaks

**Kind:** Logic-move refactors (not renames)

| Leak | Where | What happens | Why wrong |
| ---- | ----- | ------------ | --------- |
| A | `generateGeneralMessageReply.js` | Org-knowledge search + DB resolve + Internal org Message Reply | Org Knowledge **Question** work inside General Message Reply |
| B | `getRequestMessageReply()` in `requestTemplates.js` | `execution_requested` → `AtlasExecution.startNewAtlasExecution(payload)` | Starts execution inside a Message Reply builder |

Leak A is the main **Question-related** misplacement today (see placement note below). Fixing these means moving logic to the right Turn stage — separate small features, not naming.

---

## Closed (do not reopen)

### 2. `generateGeneralReply()` → `generateGeneralMessageReply()` — closed 2026-08-16

File: `cloudPilotIntelligence/conversation/generateGeneralMessageReply.js`

### 3. `cloudPilot/questions/` ownership + Understanding — closed 2026-08-16

**Decision:** Keep `questions/` as the Question fulfillment pillar. Do not nest under `chat/` / `requests/`.

**UNDERSTANDING — LOCKED** (canonical copies: `understandMessage.js`, Turn how-to, `questions/README.md`):

```text
Action        → I want CloudPilot to DO something.
Value         → I'm TELLING CloudPilot something.
Question      → I want CloudPilot to TELL ME something it knows or can retrieve.
Conversation  → I want to TALK.
```

Understanding Conversation ≠ Turn Conversation (history).

**Question types** — Organizational Knowledge is a **type of Question**, not a rename of Question:

```text
Question
├── Organizational Knowledge Question
├── CloudPilot State Question      ← questions/openRequests.js
├── AWS State Question             ← scans
└── Usage Question                 ← scans/aiUsage
```

---

## Question placement note (audit — no code change)

| Layer | Where it lives | OK? |
|-------|----------------|-----|
| Classify | Intelligence `understand/search/questions/` | Yes |
| Route | `decideNextStep.resolveQuestionDecision` | Yes (Handle Request) |
| CloudPilot State speak | `questions/openRequests.js` | Yes |
| Glue | `RequestConversation` → `prepareKnownMessageReply` | Yes |
| Usage speak | `scans/aiUsage/` | Intentional (not under `questions/` yet) |
| AWS State | `scan_ec2` / `scan_s3` | Intentional |
| Org Knowledge **data** | `knowledge/` | Yes |
| Org Knowledge **Question path** | Still inside `generateGeneralMessageReply.js` | **Misplaced** → open leak #4A |

Not a `questions/` ownership problem — ownership is closed. Leak #4A is the remaining Question-shaped cleanup.

---

## Do not

- Reopen Important Fixes or closed #2 / #3 for these
- Bundle remaining items into one mega-refactor

## Suggested order

1. **#1** when Request Message Reply should match Internal \| OpenAI  
2. **#4** (A and/or B) when ready for real logic moves



---

# Source: `billing.md`

# Billing — Phase B1

**Last reviewed:** 2026-07-04

> Read-only. Answers: **“Where is my money going?”** (AWS)  
> Internal action: `show_billing` · User-facing: **Billing**  
> OpenAI spend is separate: [AI Spending](../finished/feature_ai_spending.md) — do not mix.

---

## Pipeline (same as inventory)

```text
Chat
  ↓ Understanding   → show_billing from natural phrases
  ↓ Decision        → immediate execution (no request row)
  ↓ Action          → billingAWS/billingAWSHandler.js
  ↓ Capability      → billing/getBillingSummary.js
  ↓ Atlas           → POST /billing/summary
  ↓ Speak + Dashboard → Message + Navigator
```

---

## Test phrases

```text
why is my aws bill so high
show my billing
show my aws bill
where is my money going
what am i being charged for
```

---

## Files

### API

```
capabilities/billing/getBillingSummary.js
services/actions/aws/billingAWS/
    billingAWSHandler.js
    atlasBillingFunctions.js
    atlasAWSBillingMessage.js
    atlasAWSBillingNavigator.js
```

### Atlas

```
api/routes/billing_route.py
api/services/billing_service.py
core/cloud/billing/get_spend_by_service.py
api/routes/test/billing_route_test.py   ← mock for Atlas Test mode
```

---

## IAM (required for live billing)

Atlas uses AWS profile **`atlas`** (`config/config.py` → `PROFILE`).

### 1. Enable Cost Explorer (once per account)

AWS Console → **Billing and Cost Management** → **Cost Explorer** → **Launch Cost Explorer** (if prompted).

### 2. Grant Cost Explorer read on the Atlas IAM user/role

Attach a policy like:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. Verify from your machine

```bash
curl -s -X POST http://127.0.0.1:8000/billing/summary \
  -H "Content-Type: application/json" \
  -d '{"period_days":30}'
```

- **`AccessDeniedException`** → IAM policy missing on the `atlas` profile (most common).
- **`success": true`** → billing works; retry chat.

### Mock billing (no AWS / no IAM)

In `atlas/app/main.py`, comment live billing import and use test:

```python
# from api.routes.billing_route import router as billing_router
from api.routes.test.billing_route_test import router as billing_router
```

Restart Atlas, then chat `why is my aws bill so high` — returns sample EC2/RDS/S3 totals.

---

## SQL seed

```sql
('show_billing', 'AWS Billing', 1)
```

in `doc/sql/master_sql.sql` — re-run seed or insert row if chat returns `action_type_not_found`.

Modern MySQL (8.0.19+):

```sql
INSERT INTO cloudpilot_actions (action_type, display_name, requires_execution)
VALUES ('show_billing', 'AWS Billing', 1)
AS new_action
ON DUPLICATE KEY UPDATE
    display_name = new_action.display_name,
    requires_execution = new_action.requires_execution;
```

---

## Phase B2 (later)

- EC2 / RDS drill-down tables in same Navigator file
- Surprise lines in Message file (no separate rules file yet)

---

## Product flow

```text
Billing   → Where is my money going?
Inventory → What do I have?
Scan      → What should I fix?
Change    → Fix it.
History   → What changed?
```



---

# Source: `feature_understand_costs.md`

# Feature: Understand AWS Costs

**Status:** Future — deferred from current (2026-09-23). Not started.  
**Priority:** High-value roadmap candidate; safe to defer  
**Primary capability:** Extend existing `show_billing`  
**MVP data source:** AWS Cost Explorer `GetCostAndUsage`  
**Later data sources:** CloudPilot inventory/scans and AWS Cost Optimization Hub

---

## Goal

Let CloudPilot understand and answer grounded AWS cost questions such as:

- How much have I spent this month?
- What are my five most expensive AWS services?
- Why is my bill higher?
- How much did EC2 cost last month?
- Did S3 get more expensive this month?
- Show daily AWS spending for the last 30 days.

The useful long-term loop is:

```text
Cost
  ↓
Explain the increase
  ↓
Investigate the related AWS resources
  ↓
Create a finding
  ↓
Propose a safe remediation
  ↓
Explain expected cost impact
  ↓
Execute only with the existing permission model
```

The MVP is not a full FinOps platform. It should answer a small set of cost questions accurately, clearly identify estimates and data lag, and offer grounded next steps.

---

## Important discovery: the basic capability already exists

This feature should extend the current billing path rather than build a parallel cost system.

Today:

```text
show_billing
  ↓
billingAWSHandler.js
  ↓
Atlas POST /billing/summary
  ↓
billing_service.py
  ↓
Cost Explorer GetCostAndUsage
  ↓
30 daily periods grouped by SERVICE
  ↓
UnblendedCost summary + Navigator table
```

Current behavior already provides:

- A `show_billing` capability in `masterCloudPilotCapabilities.js`
- Immediate informational execution with no open-request row
- A fixed 30-day query
- `UnblendedCost`
- Daily Cost Explorer retrieval grouped by AWS service
- Friendly service labels
- Total spend and service rows
- Deterministic chat text
- Navigator stats and a billing table
- Atlas mock route data for development
- Basic AccessDenied guidance

Therefore:

- Do not add a second overlapping `get_aws_costs` capability in MVP.
- Keep `show_billing` as the stable internal capability key.
- Improve its visible label and description to “AWS Costs” if desired.
- Add an `aws_costs` Question signal in Understand and map it to `show_billing` in Decide.
- Keep the old action phrases working during migration.

A future rename from `show_billing` to `get_aws_costs` is optional cleanup, not required functionality.

Related existing work:

- `doc/development/future/billing.md` documents the original Billing Phase B1 and live IAM/mock setup. Some Node paths in that older document predate the current folder organization.
- `doc/development/finished/finished.md` records the underlying billing pipeline as completed work.
- This document supersedes the older Phase B2 outline for future cost-understanding work; it does not replace the live setup instructions.

---

## Architecture fit

Use the current master turn:

```text
OPEN REQUEST
  ↓
UNDERSTAND
  ↓
DECIDE
  ↓
FULFILL
  ↓
RESPOND
```

AWS cost questions are informational:

- `requestType: "information"`
- `permission: "none"`
- `requiresWorkflow: false`
- `requiresExecution: true`
- No database request row
- Immediate grounded fulfillment

The user is asking CloudPilot to retrieve known AWS state, so the request belongs on the Question path—not General Chat and not a change workflow.

### Layer responsibilities

Node API / CloudPilot:

- Understand the user’s cost question.
- Normalize a small semantic query.
- Decide which capability fulfills it.
- Call Atlas.
- Format grounded product language and Navigator data.
- Never invent cost values.

Atlas route:

- HTTP body in and standard response envelope out.
- No business or AWS-query logic.

Atlas service:

- Validate normalized cost-query options.
- Convert semantic periods into exact date intervals.
- Orchestrate one or more scanner calls.
- Build comparisons and service deltas.

Atlas scanner:

- Create the Cost Explorer client.
- Call AWS.
- Handle pagination.
- Normalize AWS result pages without conversational wording.

Atlas models:

- Define normalized cost summary, service rows, daily rows, comparison values, currency, and estimate status if typed models are introduced.

CloudPilot inventory/rules:

- Later correlate billed service changes with observed resources.
- Keep measured cost facts separate from inferred causes.

---

## MVP product contract

### Supported questions

#### 1. Period total

Examples:

- How much have I spent this month?
- What was my AWS bill last month?
- Show my AWS costs for the last 30 days.

Response:

- Exact covered date range
- Total
- Currency
- Whether the newest data is estimated
- Data-freshness note when appropriate

#### 2. Top services

Examples:

- What is costing me the most?
- Show my top five AWS services.
- Where is my AWS money going?

Response:

- Period total
- Top services, descending by cost
- Dollar amount
- Percentage of positive gross service spend when useful
- Remaining services grouped as “Other” only in presentation, not in raw data

#### 3. One service

Examples:

- How much did EC2 cost last month?
- What am I spending on S3?
- Show Lambda cost this month.

Response:

- Service total
- Exact period
- Optional daily rows when explicitly requested
- No resource-level claim unless separately supported

#### 4. Period comparison

Examples:

- Why is my bill higher this month?
- Compare this month to last month.
- Did S3 get more expensive?

Response:

- Current-period total
- Comparable previous-period total
- Dollar delta
- Percent delta when the previous value is nonzero
- Largest positive service deltas
- Largest decreases when useful
- Clear wording that these are billed-service changes, not proven root causes

#### 5. Daily trend

Examples:

- Show daily spending for the last 30 days.
- Which day cost the most?

Response:

- Daily total rows
- Highest-cost day
- Total for the range
- Navigator table initially
- Chart support later only if the Navigator contract gains a real time-series view

---

## Explicitly out of MVP

- Forecasting the end-of-month bill
- Budgets and budget alerts
- Cost Anomaly Detection ingestion
- Savings Plans or Reserved Instance purchasing
- Cost Optimization Hub recommendations
- Exact cost per S3 bucket without trustworthy attribution
- Cost and Usage Report ingestion
- Multi-cloud costs
- Multi-account role assumption redesign
- A new persistent cost database
- Automatic remediation based only on cost
- An LLM calculating totals or deltas
- Replacing the AWS Billing console

---

## Understand design

### New Question identifier

Add:

```text
question: "aws_costs"
```

This means:

> The user wants grounded AWS billed cost or usage-cost information from Cost Explorer.

It does not mean:

- OpenAI usage spend
- Generic AWS pricing knowledge
- Estimated EC2 hourly price
- A request to change an AWS resource

### Detection precedence

Cost language currently overlaps two existing questions:

- `ai_spend`
- `ec2_compute_cost`

Use this precedence:

```text
1. open_requests
2. ai_spend
3. aws_costs
4. ec2_compute_cost
5. ec2_inventory
6. s3_inventory
```

Why:

- “How much have I spent on OpenAI?” must remain CloudPilot AI usage.
- “How much did EC2 cost last month?” is billed AWS spend.
- “How much does a t3.micro cost per hour?” is a pricing estimate.

### AWS billed-cost signals

Positive signals:

- AWS bill / billing
- AWS spend / spent
- charged / charges
- this month / last month / last 30 days
- cost increase / bill increase
- compare spend
- top expensive services
- daily AWS spend
- “where is my money going?”

Strong service-specific billed-cost signals:

- “S3 cost this month”
- “EC2 spend last month”
- “did Lambda get more expensive?”

### Exclusions

Do not classify as `aws_costs` when:

- The message explicitly says OpenAI, Open AI, AI usage, token spend, or model cost.
- The user asks “what does this instance type cost?” with per-hour/per-month estimate language but no billing period.
- The user asks a general definition such as “what is AWS billing?”
- The user asks to create, stop, resize, delete, or otherwise change a resource.

### Internal-first classification

MVP should use deterministic internal rules.

Reasons:

- Cost intent phrases are concrete.
- This avoids paying OpenAI to decide whether to query AWS billing.
- It is easier to test overlap with AI spend and EC2 pricing.
- The LLM must never be the source of cost facts.

An optional OpenAI classifier can be added later through the existing Intelligence configuration pattern, but it should return classification only.

### Proposed files

Add:

- `cloudPilotIntelligence/understand/search/questions/searchForAwsCosts.js`
- `cloudPilotIntelligence/context/searches/awsCostsSearchContext.js` only if an OpenAI classifier is later enabled

Update:

- `cloudPilotIntelligence/understand/search/searchMessageForQuestion.js`
- `cloudPilotIntelligence/understand/masterUnderstanding.js` comments/documentation
- `cloudPilotIntelligence/CloudPilotIntelligence.js` façade only if direct access is useful
- `config/cloudPilotAIConfig.js` only if optional OpenAI cost classification is added

---

## Structured cost query

Classification alone is not enough. Fulfillment needs a small normalized query.

Keep it separate from conversational prose:

```text
cost_query_type
cost_period
cost_service
cost_granularity
cost_top_n
cost_metric
```

Recommended values:

```text
cost_query_type:
  summary
  service_breakdown
  service_summary
  comparison
  daily_trend

cost_period:
  this_month
  last_month
  last_30_days

cost_granularity:
  monthly
  daily

cost_metric:
  UnblendedCost
```

Defaults:

```text
cost_query_type: service_breakdown
cost_period: this_month
cost_granularity: daily
cost_top_n: 5
cost_metric: UnblendedCost
```

### Extraction approach

Add a deterministic value extractor:

- `cloudPilotIntelligence/understand/search/values/searchMessageForCostQuery.js`

Call it from:

- `cloudPilotIntelligence/understand/search/searchMessageForValues.js`

The extractor should run only when the message has credible AWS cost language. It should not add cost values to unrelated open requests.

### Service normalization

Start with a small explicit alias catalog:

```text
ec2 → Amazon Elastic Compute Cloud - Compute and related EC2 service labels
s3 → Amazon Simple Storage Service
rds → Amazon Relational Database Service
lambda → AWS Lambda
data transfer → AWS Data Transfer
vpc → Amazon Virtual Private Cloud
nat gateway → VPC/NAT usage categories only when the query supports it
```

Do not guess arbitrary AWS service names. If a service cannot be mapped safely:

- Run the general service breakdown.
- State that the requested service filter was not recognized.
- Offer the actual returned service labels.

Keep the canonical AWS names in the Atlas query layer and friendly names in response formatting.

### Passing values through immediate execution

Today `buildImmediateCapabilityDecision` carries only the action name, and execution context receives capability defaults plus open-request fields.

Extend the immediate-execution envelope narrowly so it can carry validated informational inputs:

```text
decision.execute.action
decision.execute.values
```

Then merge:

```text
capability defaults
  ← decision.execute.values
  ← request-state collected values, when applicable
```

Do not create a request row for these values.

Likely updates:

- `cloudPilot/decide/masterDecision.js`
- `cloudPilot/execution/functions/executionFunctions.js`

Keep this generic enough for immediate informational capabilities, but do not redesign all request state.

---

## Decide behavior

Map:

```text
aws_costs → show_billing
```

Expected decision:

```text
chatType: cloudPilotResponding
response.type: immediate_execution
execute.action: show_billing
requestType: information
permission: none
request: null
```

Include the normalized cost values in `execute.values`.

Do not:

- Create an open request
- Ask for confirmation
- Route cost facts through General Chat
- Add a special response type if `IMMEDIATE_EXECUTION` already represents the flow correctly

Update:

- `cloudPilot/decide/masterDecision.js`

No new `decisionTypes.js` value should be necessary for MVP.

---

## Master capability changes

Evolve `show_billing` in:

- `cloudPilot/masterCloudPilotCapabilities.js`

Recommended capability meaning:

```text
type: show_billing
actionLabel: AWS Costs
requestType: information
permission: none
requiresWorkflow: false
requiresExecution: true
```

Defaults should become semantic query defaults instead of only `period_days: 30`.

Capability discovery:

```text
section: Explore AWS
description: Understand AWS costs and service-level changes
scope: Account-level Cost Explorer data; typically refreshed at least daily
```

`cloudPilotCanAnswer` should include only facts that survive the real data path:

- Total billed AWS cost for a supported period
- Cost grouped by AWS service
- Daily cost for a supported period
- Current-versus-previous comparable-period change
- Largest service-level increases and decreases
- Whether returned Cost Explorer periods are estimated

It must not claim:

- Exact cost for every resource
- Exact cost for every S3 bucket
- Root cause from cost data alone
- Guaranteed savings
- Real-time billing

Keep the existing direct action `match` phrases temporarily for backward compatibility. After the `aws_costs` Question path is proven, change `match` to `() => false` so Question search owns informational billing language, matching the existing inventory pattern.

---

## Atlas API contract

Keep the current route initially:

```text
POST /billing/summary
```

The body should accept normalized, bounded values—not raw Cost Explorer expressions:

```json
{
  "query_type": "comparison",
  "period": "this_month",
  "service": "S3",
  "granularity": "DAILY",
  "top_n": 5,
  "metric": "UnblendedCost"
}
```

Do not accept arbitrary client-supplied:

- IAM account scope
- Billing view ARN
- Raw Cost Explorer filter expressions
- Unbounded dates
- More than two group definitions

This keeps CloudPilot’s public contract small and prevents it from becoming a generic billing-query proxy.

### Response shape

Extend the existing response without breaking current consumers:

```json
{
  "query_type": "comparison",
  "period": {
    "key": "this_month",
    "label": "This month to date",
    "start": "2026-09-01",
    "end_exclusive": "2026-09-16"
  },
  "metric": "UnblendedCost",
  "currency": "USD",
  "estimated": true,
  "total_usd": 186.42,
  "services": [
    {
      "service": "EC2",
      "aws_service": "Amazon Elastic Compute Cloud - Compute",
      "amount_usd": 82.14
    }
  ],
  "daily": [
    {
      "date": "2026-09-01",
      "amount_usd": 5.21,
      "estimated": false
    }
  ],
  "comparison": {
    "basis": "month_to_date_vs_previous_month_same_number_of_days",
    "previous_start": "2026-08-01",
    "previous_end_exclusive": "2026-08-16",
    "current_total_usd": 186.42,
    "previous_total_usd": 115.12,
    "delta_usd": 71.30,
    "delta_percent": 61.94,
    "service_deltas": []
  }
}
```

The existing keys should remain available for the original summary path:

- `period_days`
- `period_start`
- `period_end`
- `services`
- `total_usd`

Deprecate old fields later only after all Node and frontend consumers are updated.

---

## Date and comparison semantics

Cost Explorer start dates are inclusive and end dates are exclusive.

Use UTC calendar dates and expose the exact range in every response.

### This month

```text
Start: first day of the current month
End: current UTC date (exclusive)
```

This normally means completed cost data through the prior date. Do not imply today is complete.

### Last month

```text
Start: first day of the previous month
End: first day of the current month
```

### Last 30 days

```text
Start: current UTC date minus 30 days
End: current UTC date (exclusive)
```

### Compare this month to last month

Do not compare an incomplete current month to the entire previous month by default.

Use:

```text
Current: current month-to-date
Previous: same number of elapsed calendar days in the previous month
```

Label the basis explicitly.

Optionally support full-month comparison only when the user asks for two completed months.

### Percent change

- If previous total is greater than zero, calculate percent delta.
- If previous total is zero and current is positive, return `delta_percent: null` and describe it as new spend.
- Do not emit Infinity.

---

## Atlas implementation

### Current files to evolve

- `atlas/app/api/routes/billing_route.py`
- `atlas/app/api/services/billing_service.py`
- `atlas/app/core/cloud/billing/get_spend_by_service.py`
- `atlas/app/api/routes/test/billing_route_test.py`

### Layer-aligned target

New AWS retrieval belongs under the scanner layer:

- `atlas/app/core/scanners/billing/cost_explorer_scanner.py`

Optional normalized models:

- `atlas/app/core/models/aws_costs.py`

The current `core/cloud/billing/get_spend_by_service.py` can remain as a temporary compatibility wrapper while callers migrate. Do not perform a broad folder cleanup in the same change.

### Scanner responsibilities

The scanner should:

1. Use the configured Atlas AWS profile.
2. Create the Cost Explorer client in `us-east-1`.
3. Call `GetCostAndUsage`.
4. Continue through every `NextPageToken`.
5. Preserve AWS service names and units.
6. Preserve negative values such as credits/refunds.
7. Preserve `Estimated` from each result period.
8. Return normalized rows without user-facing prose.
9. Catch AWS client errors in the existing safe-wrapper pattern.

### Important correction to current aggregation

The current scanner drops rows where `amount <= 0`.

That can produce an incorrect bill total because credits, refunds, and adjustments may be negative.

The improved implementation should:

- Preserve negative amounts in normalized data.
- Calculate net total including negative amounts.
- Keep “largest cost services” focused on positive spend.
- Optionally show credits/adjustments separately.
- Never round each daily row before calculating the final total.

Use decimal-safe arithmetic where practical. Round only at the presentation boundary.

### Pagination

The current implementation makes one request and ignores `NextPageToken`.

Add a bounded pagination loop:

- Repeat the same request with the returned token.
- Stop when no token remains.
- Guard against repeated tokens.
- Keep a conservative maximum-page safety limit.
- Return a clear partial/failure state rather than silently truncating.

### Service filtering

Use an exact Cost Explorer `SERVICE` dimension filter after alias normalization.

Some user concepts span multiple AWS billing service labels. EC2 is the main example:

- EC2 compute
- EBS
- Elastic Load Balancing
- Data Transfer
- VPC/NAT-related charges

For MVP:

- “EC2 cost” should mean EC2 compute unless the user asks for the broader EC2 stack.
- State the chosen scope in the response.
- Do not quietly add unrelated services to make a larger number.

### Usage type breakdown

“Why is S3 expensive?” often needs more than service totals.

A later Cost Explorer query may group by:

- `USAGE_TYPE`
- `REGION`
- Activated cost allocation tag

Do not sum `UsageQuantity` across mixed units. AWS explicitly warns that aggregated usage quantities are meaningless when hours, requests, and GB are mixed.

For MVP, service cost deltas are enough.

---

## Node provider and handler changes

### Atlas provider

Update:

- `providers/atlas/billing/getBillingSummary.js`

Pass the normalized query options instead of only `period_days`.

Keep it a thin Atlas transport adapter.

### Billing handler

Update:

- `cloudPilot/scans/billing/billingAWSHandler.js`

The handler currently ignores execution context and hardcodes 30 days.

Change it to:

1. Accept `executionContext`.
2. Read validated values from `executionContext.state.collected`.
3. Call the Atlas provider.
4. Validate the Atlas success envelope.
5. Build deterministic grounded text.
6. Build Navigator data.
7. Return the existing execution-result shape.

Do not parse natural language in the handler.

### Message builder

Evolve:

- `cloudPilot/scans/billing/atlasAWSBillingMessage.js`

Add deterministic message modes:

- Summary
- Service breakdown
- Service summary
- Comparison
- Daily trend
- No spend
- Cost Explorer unavailable

Required wording rules:

- State exact period.
- Say “estimated” when AWS marks data estimated.
- Say “increase is concentrated in…” rather than claiming a proven cause.
- Distinguish AWS billed cost from CloudPilot’s stored EC2 pricing estimate.
- Do not describe inventory size as a dollar attribution.
- Do not claim savings unless supplied by a recommendation source.

### Navigator adapter

Evolve:

- `cloudPilot/scans/billing/atlasAWSBillingNavigator.js`

MVP views:

- Stats: total, previous total, delta, top service
- Service table: service, current cost, previous cost, delta
- Daily table: date, cost, estimate status

The current Navigator supports stats, cards, tables, alerts, and actions but no explicit chart/time-series type.

Therefore:

- Use a daily table first.
- Do not add a fake unsupported chart shape.
- Add a Navigator time-series contract later with coordinated frontend support.

---

## Respond behavior

The billing handler’s grounded message remains the final known response for successful immediate execution.

Examples:

### Total

```text
Your estimated AWS cost for September 1–15 is $186.42.

Cost Explorer marks the latest period as estimated, and billing data can lag behind current usage.
```

### Top services

```text
Your estimated AWS cost for September 1–15 is $186.42.

Top services:
• EC2 — $82.14
• S3 — $51.08
• Data Transfer — $31.20
```

### Comparison

```text
Your month-to-date AWS cost is $186.42, up $71.30 (61.9%) from the same number of days last month.

The largest service-level increases are:
• EC2 — +$38.20
• S3 — +$24.10
• Data Transfer — +$11.40

That shows where billed cost changed; it does not yet prove which individual resources caused it.
```

### Previous period zero

```text
S3 has $8.42 of spend in this period and no spend in the comparable prior period, so a percentage change would be misleading.
```

### No spend

```text
I did not find AWS cost in the requested period.

This can also happen when Cost Explorer was enabled recently or the Atlas AWS identity cannot see the relevant billing scope.
```

---

## Conversation follow-ups

### MVP approach

Each message should be independently understandable where possible.

Examples:

- “What did S3 cost last month?”
- “Compare S3 this month to last month.”

Do not introduce a general agent loop or hidden billing session state.

Moving billing detection from Action matching to the Question path also matters when another request is open. The current Question flow can answer informational questions without replacing the unrelated request, while the legacy immediate Action matcher may be suppressed during an open workflow. Add an integration test for this behavior before removing the legacy billing phrases.

### Later contextual follow-ups

The desired conversation includes:

```text
User: What is costing me the most?
CloudPilot: EC2...
User: Why did it increase?
```

Reliable pronoun/follow-up resolution requires the previous structured cost query/result, not only generated prose.

Later, store a small read-only conversation result reference:

```text
lastCostQuery
lastCostSummary
selectedService
```

Then resolve “it,” “that service,” and “last month” against those facts.

Do not block the first Cost Explorer MVP on this.

---

## Cost-to-inventory correlation

This is the most valuable second phase.

Example:

```text
Cost Explorer:
S3 increased by $24

CloudPilot inventory:
14 buckets

CloudPilot scan:
1.8 TB total
620 GB older than 90 days
versioning/lifecycle/incomplete-upload findings
```

The system must preserve provenance:

```text
Measured:
S3 billed cost increased by $24.

Observed:
Bucket X contains 428 GB and 310 GB is older than 90 days.

Inference:
Old retained objects may be contributing to storage cost.

Not established:
Bucket X costs exactly $31.72.
```

### Suggested next-step actions

After a service-level cost response:

- EC2 increase → offer EC2 inventory or scan
- S3 increase → offer S3 inventory or scan
- RDS increase → offer RDS inventory only after that capability exists
- Unknown service → offer AWS inventory, not a fabricated specialized scan

These are suggestions, not automatic actions.

Accepting a scan offer must follow the current scan capability and permission behavior.

---

## S3 attribution guardrail

Cost Explorer can answer:

- Total S3 cost
- S3 cost over time
- S3 cost by supported usage type, region, tag, or cost category

It does not guarantee a perfect real-time dollar amount for every bucket.

Exact bucket attribution may require:

- Activated user-defined cost allocation tags
- Consistent bucket tagging
- Cost and Usage Reports
- A supported resource-level feature
- A clearly labeled internal estimate based on usage metrics

AWS `GetCostAndUsageWithResources` is opt-in and has strict support, granularity, service-filter, and time-range constraints. It must not be treated as a universal per-resource cost API.

For MVP:

- Do not call `GetCostAndUsageWithResources`.
- Do not say a bucket “accounts for” a dollar amount without attribution data.
- Combine S3 cost and inventory only as separate measured facts.

---

## Cost Optimization Hub — later phase

Cost Optimization Hub fits CloudPilot’s finding/remediation model well, but it should be a separate phase and likely a separate informational capability.

Potential future capability:

```text
get_cost_recommendations
```

Useful fields from AWS include:

- Resource ID and ARN
- Resource type
- Region and account
- Current resource configuration
- Recommended configuration
- Estimated monthly cost
- Estimated monthly savings
- Estimated savings percentage
- Implementation effort
- Restart needed
- Rollback possible
- Recommendation source
- Refresh timestamp

Important constraints:

- Cost Optimization Hub must be enabled.
- Recommendations refresh and recommendation IDs can expire after 24 hours.
- A recommendation is not permission to execute a change.
- CloudPilot must verify the current resource state before remediation.
- Every mutation continues through the existing confirmation/execution-mode safety model.
- Savings are AWS estimates, not guarantees.

Future flow:

```text
ListRecommendations
  ↓
GetRecommendation
  ↓
Normalize to CloudPilot finding
  ↓
Show current cost and estimated savings
  ↓
Offer remediation
  ↓
Verify resource
  ↓
Confirm + execute
```

Do not mix Cost Optimization Hub into the first Cost Explorer implementation.

---

## IAM, enablement, and account scope

### Cost Explorer enablement

Cost Explorer cannot be enabled through its API.

The AWS account must enable it in the Billing and Cost Management console.

AWS notes:

- Current-month data is generally available about 24 hours after enablement.
- Historical preparation can take longer.
- Cost Explorer updates data at least daily.

CloudPilot should report this accurately when data is unavailable.

### IAM

Atlas needs explicit least-privilege access:

```text
ce:GetCostAndUsage
```

Later operations require separate permissions.

Do not grant broad Billing administrator access solely for this feature.

### Organization behavior

- A standalone account sees its own cost.
- A member account generally sees its own accessible cost.
- A management account can see organization/member-account cost according to Cost Explorer and organization settings.
- Billing Conductor may change whether returned values are chargeable or pro forma.

MVP Atlas currently uses one configured AWS profile. Responses should describe the scope as the connected AWS billing identity, not “all your AWS accounts” unless account context proves that.

### Sensitive data

Cost and account data is sensitive.

- Keep raw Atlas billing logs behind existing debug logging controls.
- Do not log credentials, authorization headers, full Cost Explorer request signatures, or unnecessary account identifiers.
- Avoid persisting raw billing pages in conversation history.
- Return only normalized fields needed by chat and Navigator.

---

## Caching and API usage

Cost Explorer data updates at least daily; repeated identical calls do not need to hit AWS for every chat turn.

Add a small Atlas cache after correctness is proven:

- Key: connected account/profile identity + normalized query
- TTL: 15–60 minutes
- Never share cache entries across different account identities
- Cache successful normalized results
- Do not cache AccessDenied indefinitely
- Expose `retrieved_at` and optional `cache_hit` in internal metadata

Caching is useful for:

- Faster follow-ups
- Fewer Cost Explorer API requests
- More consistent values within one conversation

Do not add a database for the first cache; an in-process bounded cache is sufficient for MVP.

---

## Error behavior

Normalize errors into stable internal codes.

Required cases:

- `cost_explorer_not_enabled`
- `cost_explorer_access_denied`
- `cost_data_unavailable`
- `cost_query_invalid`
- `cost_query_throttled`
- `cost_pagination_failed`
- `atlas_unreachable`
- `billing_failed`

User-facing messages should be actionable but not expose raw AWS internals.

Examples:

Access denied:

```text
I can’t read AWS cost data with the connected Atlas profile. Grant `ce:GetCostAndUsage` and try again.
```

Not enabled:

```text
Cost Explorer must be enabled in the AWS Billing console first. AWS may take about 24 hours to prepare current-month data.
```

Data unavailable:

```text
AWS cost data is temporarily unavailable for that period. Try again later or request a shorter supported range.
```

Throttle:

```text
AWS is limiting Cost Explorer requests right now. Please try again shortly.
```

Do not turn AWS errors into a zero-dollar answer.

---

## Testing strategy

### Understand tests

Positive AWS cost cases:

- How much have I spent this month?
- Show my AWS bill.
- What are my top five AWS services?
- Why is my AWS bill higher?
- How much did EC2 cost last month?
- Did S3 get more expensive?
- Show daily AWS spend for the last 30 days.

Must not collide:

- How much have I spent on OpenAI? → `ai_spend`
- Show AI usage. → `ai_spend`
- How much does a t3.micro cost per hour? → `ec2_compute_cost`
- Estimate an EC2 instance price. → `ec2_compute_cost`
- What EC2 instances do I have? → `ec2_inventory`
- Scan my S3 buckets. → `scan_s3`
- What is Cost Explorer? → General Chat

### Decide tests

Verify `aws_costs`:

- Maps to `show_billing`
- Produces `IMMEDIATE_EXECUTION`
- Uses `permission: none`
- Creates no request row
- Carries normalized query values
- Leaves an unrelated open request unchanged
- Can merge unrelated open-request values only under existing mixed-message rules

### Atlas unit tests

Mock Cost Explorer for:

- One page
- Multiple pages
- Empty data
- Estimated latest period
- Positive service cost
- Negative credit/refund
- Multiple currency/unit values
- Previous-period zero
- Missing metric
- Repeated pagination token
- AccessDenied
- DataUnavailable
- Throttling/limit errors

Verify:

- End date is exclusive
- Current MTD comparison is fair
- Net total includes negative adjustments
- Top service ranking excludes credits as “expensive services”
- Rounding occurs only at presentation
- Service filtering uses canonical names

### Node handler tests

Verify:

- Execution values reach Atlas
- Existing no-value 30-day path remains compatible
- Atlas failure is not reported as success
- Deterministic summary text
- Deterministic comparison text
- Estimated/freshness wording
- Navigator service rows and daily rows
- No raw AWS payload in the public response unless explicitly enabled

### Integration matrix

Run through the full message pipeline:

```text
OPEN REQUEST → UNDERSTAND → DECIDE → FULFILL → RESPOND
```

Required checks:

1. This-month total
2. Top five services
3. Last-month EC2
4. Month-to-date comparison
5. S3 comparison
6. Daily 30-day trend
7. Cost Explorer disabled
8. IAM denied
9. Atlas unavailable
10. AWS cost question while an unrelated change request is open

Confirm:

- Master logs show `question: aws_costs`
- Decision shows immediate `show_billing`
- No request row is created
- Atlas runs once per uncached query
- Final response uses only Atlas values

---

## Implementation sequence

### Phase 0 — Prove the existing baseline

Before changing behavior:

- Run Atlas `POST /billing/summary` with `{"period_days": 30}`.
- Run “show my AWS bill” through the full chat pipeline.
- Capture OPEN REQUEST → UNDERSTAND → DECIDE → FULFILL → RESPOND logs.
- Verify immediate execution creates no request row.
- Verify the Atlas mock route still works without AWS access.
- Record the current response and Navigator shape as backward-compatibility fixtures.

**Checkpoint:** The existing Billing Phase B1 path is known to work before extension.

### Phase 1 — Lock semantics

Before coding:

- Keep `show_billing` as the existing capability key.
- Choose `UnblendedCost` as the MVP metric.
- Lock UTC/exclusive date behavior.
- Lock fair MTD comparison.
- Lock service alias scope.
- Lock no per-resource S3 claims.

### Phase 2 — Make the existing billing retrieval correct

Atlas:

- Add pagination.
- Preserve negative adjustments.
- Preserve currency/unit.
- Preserve estimate status.
- Use UTC dates.
- Improve normalized response.
- Add scanner/service tests.

Keep the existing 30-day request working.

**Checkpoint:** Existing “show my AWS bill” is more accurate without changing conversation behavior.

### Phase 3 — Understand AWS cost questions

Node:

- Add `searchForAwsCosts`.
- Add deterministic cost-query value extraction.
- Resolve overlap with `ai_spend` and `ec2_compute_cost`.
- Add question-search tests.

**Checkpoint:** Classification is correct before any new query behavior is enabled.

### Phase 4 — Carry query values through Decide/Fulfill

- Map `aws_costs` to `show_billing`.
- Add immediate-execution values.
- Merge values into execution context.
- Pass normalized options through the Atlas provider.
- Keep no-request-row behavior.

**Checkpoint:** Logs show the exact normalized query reaching the handler.

### Phase 5 — Add summary, service, comparison, and daily modes

Atlas:

- Resolve semantic periods.
- Query current and previous ranges.
- Compute service deltas.
- Support one-service filters.
- Return daily rows.

Node:

- Add deterministic message modes.
- Add Navigator stats and tables.

**Checkpoint:** All six MVP question examples return grounded results.

### Phase 6 — Failure and freshness UX

- Distinguish not enabled, denied, unavailable, throttled, and unreachable.
- Add estimated-data wording.
- Add exact period wording.
- Ensure failures never become `$0`.

### Phase 7 — Cache

- Add bounded in-process cache.
- Key by account/profile identity and normalized query.
- Expose retrieval timestamp internally.
- Test cache isolation.

### Phase 8 — Cost-to-inventory next steps

- Offer supported scans based on returned service.
- Preserve measured-versus-inferred provenance.
- Do not automatically scan or remediate.

### Phase 9 — Cost Optimization Hub

Only after the Cost Explorer flow is stable:

- Add a separate recommendations capability.
- Normalize AWS recommendations into findings.
- Connect supported recommendations to existing verification and remediation flows.

---

## Expected files

### Node API — likely additions

- `api/application/atlas/cloudPilotIntelligence/understand/search/questions/searchForAwsCosts.js`
- `api/application/atlas/cloudPilotIntelligence/understand/search/values/searchMessageForCostQuery.js`
- Tests beside the existing API test convention or under `api/test/application/atlas/`

### Node API — likely updates

- `api/application/atlas/cloudPilotIntelligence/understand/search/searchMessageForQuestion.js`
- `api/application/atlas/cloudPilotIntelligence/understand/search/searchMessageForValues.js`
- `api/application/atlas/cloudPilotIntelligence/understand/masterUnderstanding.js`
- `api/application/atlas/cloudPilot/decide/masterDecision.js`
- `api/application/atlas/cloudPilot/execution/functions/executionFunctions.js`
- `api/application/atlas/cloudPilot/masterCloudPilotCapabilities.js`
- `api/application/atlas/cloudPilot/scans/billing/billingAWSHandler.js`
- `api/application/atlas/cloudPilot/scans/billing/atlasBillingFunctions.js`
- `api/application/atlas/cloudPilot/scans/billing/atlasAWSBillingMessage.js`
- `api/application/atlas/cloudPilot/scans/billing/atlasAWSBillingNavigator.js`
- `api/application/atlas/providers/atlas/billing/getBillingSummary.js`
- `api/application/atlas/cloudPilotIntelligence/context/contextTypes/cloudPilotCapabilitiesContext.js` indirectly reflects the catalog; likely no logic change
- `api/test/scripts/ensure-cloudpilot-actions-seed.js` only if the stored display label changes from “AWS Billing” to “AWS Costs”

### Atlas — likely additions

- `atlas/app/core/scanners/billing/cost_explorer_scanner.py`
- `atlas/app/core/models/aws_costs.py` if typed models add value
- Billing scanner/service tests

### Atlas — likely updates

- `atlas/app/api/routes/billing_route.py`
- `atlas/app/api/services/billing_service.py`
- `atlas/app/core/cloud/billing/get_spend_by_service.py` compatibility wrapper or migration
- `atlas/app/api/routes/test/billing_route_test.py`

---

## Definition of done for Cost Explorer MVP

- AWS billed-cost questions are classified as `aws_costs`.
- OpenAI spend and EC2 estimated pricing still route correctly.
- `aws_costs` maps to the existing `show_billing` capability.
- Cost queries execute immediately with no request row.
- The user can request current month, last month, or last 30 days.
- The user can request total, top services, one service, comparison, or daily trend.
- Atlas handles every Cost Explorer page.
- Negative credits/refunds are not silently discarded.
- Date ranges are exact and end-exclusive.
- Current-month comparison uses an honest comparable prior range.
- Responses include currency, exact period, and estimated status.
- Failures never masquerade as zero spend.
- Navigator displays useful stats and tables without an unsupported chart contract.
- No exact S3 bucket cost is claimed without attribution.
- No LLM calculates or invents cost values.
- Existing `show_billing` behavior remains backward compatible.
- Tests cover classification collisions, date math, pagination, errors, and the full master pipeline.

---

## Later definition of done for cost-aware CloudPilot

- Cost increases can offer a relevant inventory/scan.
- Findings preserve cost-data provenance.
- Cost Optimization Hub recommendations can become read-only CloudPilot findings.
- Recommended changes show AWS-estimated monthly cost and savings.
- Restart and rollback details are shown before execution.
- Every cost-aware mutation still uses resource verification, confirmation, and the existing execution model.

---

## AWS references

- [Using the AWS Cost Explorer API](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-api.html)
- [GetCostAndUsage API](https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/API_GetCostAndUsage.html)
- [GetCostAndUsageWithResources API](https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/API_GetCostAndUsageWithResources.html)
- [Enabling Cost Explorer](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-enable.html)
- [Controlling access to Cost Explorer](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-access.html)
- [Cost allocation tags](https://docs.aws.amazon.com/cost-management/latest/userguide/cost-allocation-tags.html)
- [Cost Optimization Hub](https://docs.aws.amazon.com/cost-management/latest/userguide/cost-optimization-hub.html)
- [Cost Optimization Hub GetRecommendation](https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/API_CostOptimizationHub_GetRecommendation.html)



---

# Source: `feature_spending_hard_limit.md`

# Spending Hard Limit — AWS + OpenAI

## What this does

Sets a **hard monthly spending cap** across CloudPilot-tracked costs:

```text
Total spend (this month) = AWS (estimated) + OpenAI (estimated)
        ↓
Below warning  → normal
Above warning  → allow + warn
Above hard cap → block new spend
```

**Hard limit means:** CloudPilot refuses to **start new paid work** — OpenAI calls and AWS write actions (create EC2, etc.). Read-only actions (scan, billing summary, AI usage card) still work so you can see where money went.

This is **not** AWS Budgets or account-wide shutdown. Charges from outside CloudPilot (console, other tools, always-on infra) still accrue; CloudPilot blocks only what it controls.

## Status

**Plan locked — awaiting Step 1.**

## Next

Say **do Step 1** to create the safety table and seed OpenAI limits (same as [CloudPilot Safety](./feature_cloud_pilot_safety.md) Step 1).

**Codename:** `spendingHardLimit`  
**Related:** [CloudPilot Safety](./feature_cloud_pilot_safety.md) (Phase 1 — OpenAI) · [AI Spending](../finished/feature_ai_spending.md) · [Billing](../future/billing.md) · [Useful Price](../finished/feature_useful_price.md) · [Current Development](./current_development.md)

---

## Goal (one sentence)

Give CloudPilot one monthly **hard cap** on combined AWS + OpenAI spend, with honest estimates per source, and enforce it at every place CloudPilot can spend money.

---

## What already works (reuse, do not rebuild)

| Source | Measure spend | Status |
|--------|---------------|--------|
| **OpenAI** | `cloud_pilot_ai_usage` → `GET /ai/usage/summary` | ✅ Live |
| **AWS actual** | Atlas `POST /billing/summary` → Cost Explorer by service | ✅ Live (read-only) |
| **AWS estimate (EC2)** | `cloud_service_pricing` + `estimatePricing.js` | ✅ Live (t3.nano/micro) |
| **OpenAI gate (planned)** | `cloud_pilot_safety` + `checkSpendingLimit()` | 📋 [Safety doc](./feature_cloud_pilot_safety.md) — not coded yet |
| **Dashboard cards** | `AiUsageCard`; billing via chat `show_billing` | ✅ Partial — no unified total |

**Design rule (locked):**

```text
Usage tables / Cost Explorer  →  “How much have we spent?”
cloud_pilot_safety            →  “Are we allowed to spend more?”
Enforcement points            →  “Stop before the call that costs money”
```

Do **not** store `current_spend` in the safety table. Always compute from sources at check time.

---

## Spend model — two buckets, one total

### Bucket A — OpenAI (real-time, app-scoped)

- **Source:** Sum `estimated_cost` from `cloud_pilot_ai_usage` for current calendar month.
- **Accuracy:** Estimated from your rate table; label UI **Estimated OpenAI spend**.
- **Scope:** Only calls CloudPilot made (correct for this product).

### Bucket B — AWS (Cost Explorer + optional projection)

- **Primary source:** Atlas `get_spend_by_service()` — unblended cost by service, MTD or rolling 30 days aligned to **calendar month** for limit checks.
- **Services:** All services Cost Explorer returns (EC2, S3, RDS, Lambda, …). No manual service list to maintain.
- **Lag:** Cost Explorer is typically **~24 hours** behind. Plan must say so in UI and chat copy.
- **Optional projection (Phase 3):** For running EC2 instances with known hourly rates, add **projected remainder-of-month** so the total is less stale:

```text
aws_total = cost_explorer_mtd + projected_ec2_until_month_end
```

Projection uses existing `enrichEC2InstancesWithPricing` data from the latest EC2 scan. If no scan or no rate row → use Cost Explorer MTD only (honest, no fake precision).

### Combined total

```text
total_spend_usd = openai_mtd + aws_mtd   (+ optional aws_projection)
remaining_usd   = hard_limit - total_spend_usd
```

---

## Limits — one global cap + per-service rows (optional)

### V1 (recommended): Global monthly hard cap

One row in `cloud_pilot_safety`:

```text
user_id:          1
service:          total          ← special rollup key
spending_enabled: true
warning_limit:    80.00
hard_limit:       100.00
limit_period:     monthly
action:           block
```

`checkSpendingLimit(userId, 'total')` aggregates OpenAI + AWS before deciding.

### V1b: Per-service rows (same table, already designed)

Keep generic `service` column for future fine control:

| service | Example hard limit | Enforcement |
|---------|-------------------|-------------|
| `openai` | $5/mo | Block OpenAI in `openAIClient.js` |
| `aws` | $95/mo | Block AWS write actions |
| `total` | $100/mo | Block **both** when combined exceeds cap |

**Locked for MVP:** Implement `openai` + `total` first. Add `aws`-only row in Phase 3 if you want separate AWS ceiling.

---

## Enforcement map

Hard limit = **block before money moves**.

| Spend type | Enforcement point | On block |
|------------|-------------------|----------|
| OpenAI chat / classify | `providers/openAI/client/openAIClient.js` → `createOpenAiChatCompletion` | Return blocked outcome; caller uses Internal fallback (existing Safety design) |
| Create EC2 | `executionFunctions.js` before `runAction('create_ec2')` | Fail execution; friendly message: at spending limit |
| Toggle / pause / resume EC2 | Same gate (optional Phase 3b — pause **saves** money; default **allow**) | — |
| Delete EC2 | Allow (reduces future spend) | — |
| Scans (S3, EC2) | Allow (read-only; Cost Explorer API is free tier / negligible) | — |
| `show_billing`, `show_ai_usage` | Allow | — |
| S3 remediations (future) | Same gate as create when they incur cost | Block with reason |

**Single decision function:**

```text
cloudPilot/spending/checkSpendingLimit.js
  checkSpendingLimit({ userId, service, actionType? })
    → { allowed, warning, reason, spendSnapshot }
```

Callers never duplicate limit math.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    cloud_pilot_safety                    │
│         warning_limit / hard_limit / spending_enabled    │
└──────────────────────────┬──────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────────┐
│ OpenAI spend    │                 │ AWS spend           │
│ cloud_pilot_    │                 │ Atlas billing/summary│
│ ai_usage (MTD)  │                 │ + optional EC2 proj │
└────────┬────────┘                 └──────────┬──────────┘
         │                                     │
         └──────────────┬──────────────────────┘
                        ▼
           checkSpendingLimit(userId, 'total')
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
    openAIClient.js           executionFunctions.js
    (before OpenAI)           (before create_ec2, …)
```

### New / extended code homes

```text
cloudPilot/spending/
  checkSpendingLimit.js          ← decision owner
  getSpendSnapshot.js            ← OpenAI + AWS totals for UI/chat
  functions/spendingFunctions.js ← DB read for cloud_pilot_safety

providers/openAI/client/openAIClient.js   ← OpenAI enforce
cloudPilot/execution/functions/executionFunctions.js  ← AWS write enforce

capabilities/spending/getSpendSnapshot.js ← optional Atlas+billing glue
routes/spendingRoutes.js                  ← GET /spending/summary
```

---

## API + UI

### `GET /spending/summary`

Returns unified snapshot for Dashboard + chat:

```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "limits": {
      "warning_usd": 80,
      "hard_usd": 100,
      "enabled": true
    },
    "openai": { "mtd_usd": 11.72, "label": "estimated" },
    "aws": {
      "mtd_usd": 42.30,
      "by_service": [
        { "service": "EC2", "amount_usd": 28.50 },
        { "service": "S3", "amount_usd": 3.20 }
      ],
      "label": "cost_explorer",
      "lag_hours": 24
    },
    "total_mtd_usd": 54.02,
    "remaining_usd": 45.98,
    "status": "ok"
  }
}
```

`status`: `ok` | `warning` | `blocked` (at or over hard limit).

### Dashboard — `SpendingLimitCard` (new)

Place near top of Dashboard (alongside or replacing hidden `AiUsageCard`):

```text
Spending (this month)     $54.02 / $100.00
  AWS (estimated)         $42.30
  OpenAI (estimated)      $11.72
Status: OK · ~$46 remaining
```

No graphs in V1. Link “View breakdown” → chat `show spending` or expand inline service list.

### Chat

| Phrase | Action |
|--------|--------|
| `show my spending` / `spending limit` / `am I over budget` | New question `spending_summary` → handler loads `getSpendSnapshot` |
| At hard limit on create | Execution failure message includes current total + limit |

Reuse [Questions](../finished/feature_questions.md) pattern; do not mix with `show_billing` (AWS-only) or `show_ai_usage` (OpenAI-only).

---

## Phased delivery

Build in order. Each phase is shippable alone.

### Phase 1 — OpenAI hard limit (≈ CloudPilot Safety V1)

**Doc:** [feature_cloud_pilot_safety.md](./feature_cloud_pilot_safety.md)

- [ ] Step 1: `cloud_pilot_safety` table + seed `openai` row
- [ ] Step 2: `checkSpendingLimit(userId, 'openai')`
- [ ] Step 3: Gate `createOpenAiChatCompletion`
- [ ] Step 4: Warning log + hard block → Internal fallback
- [ ] Step 5: Offline verification

**Acceptance:** Spend over hard limit → no new OpenAI calls; chat still works via Internal.

---

### Phase 2 — Unified spend snapshot (read-only)

- [ ] `getSpendSnapshot.js` — OpenAI MTD + AWS MTD from existing APIs
- [ ] `GET /spending/summary`
- [ ] `SpendingLimitCard` on Dashboard
- [ ] Chat question `spending_summary` + handler
- [ ] Seed `total` row in `cloud_pilot_safety` (limits only; enforcement in Phase 3)

**Acceptance:** Dashboard and chat show combined total with AWS service breakdown; no blocking yet except Phase 1 OpenAI.

---

### Phase 3 — AWS write-action hard limit

- [ ] Extend `checkSpendingLimit` for `service: 'total'` and `'aws'`
- [ ] Gate `create_ec2` (and future paid remediations) in `executionFunctions.js`
- [ ] Friendly blocked message with `$X of $Y used`
- [ ] Optional: EC2 projection in AWS bucket (document in UI as estimate)

**Acceptance:** With MTD total ≥ hard limit, `create ec2` fails before Atlas call; scans and billing still work.

---

### Phase 4 — Polish (later)

- [ ] Email / notification on warning (out of scope for MVP)
- [ ] Per-action **pre-flight estimate** (“This instance ≈ $7.59/mo — you have $46 left”)
- [ ] Reconcile OpenAI against OpenAI Costs API (finance-grade)
- [ ] AWS Budgets **alert** (read-only webhook — does not replace CloudPilot gate)
- [ ] Admin UI to edit limits (V1: SQL seed / env defaults)

---

## Table shape (same as Safety — one table)

```sql
CREATE TABLE cloud_pilot_safety (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    service VARCHAR(50) NOT NULL,       -- openai | aws | total
    spending_enabled TINYINT(1) NOT NULL DEFAULT 1,
    warning_limit DECIMAL(10, 2) NOT NULL,
    hard_limit DECIMAL(10, 2) NOT NULL,
    limit_period VARCHAR(20) NOT NULL DEFAULT 'monthly',
    action VARCHAR(20) NOT NULL DEFAULT 'block',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_safety_user_service (user_id, service)
);
```

Example seed (one user, $100 total, $5 OpenAI sub-cap):

```sql
INSERT INTO cloud_pilot_safety (user_id, service, spending_enabled, warning_limit, hard_limit, limit_period, action)
VALUES
  (1, 'openai', 1, 3.00,  5.00,  'monthly', 'block'),
  (1, 'total',  1, 80.00, 100.00, 'monthly', 'block');
```

---

## Open decisions (lock before Phase 3)

| Question | Recommendation |
|----------|----------------|
| No safety row for user? | **Default ALLOW** + log warning (same as Safety doc) |
| Calendar month vs rolling 30 days? | **Calendar month** for limits; billing card can still show 30-day view |
| Block pause/resume at limit? | **No** — pause saves money; resume allowed unless you want stricter policy |
| AWS lag at limit boundary? | Block on **known** totals only; show disclaimer: “AWS portion may lag ~24h” |
| Mock / Atlas Test mode? | Test billing route returns fixed totals; spending gate uses same mock path |

---

## Acceptance (full feature)

| Scenario | Expect |
|----------|--------|
| Under warning | All spend paths allowed |
| Above warning, below hard | Allowed + warning in logs / card status |
| Above hard, OpenAI request | Blocked; Internal fallback |
| Above hard, `create ec2` | Blocked before Atlas; clear message |
| Above hard, `scan ec2` / `show billing` | Allowed |
| Dashboard | Shows AWS + OpenAI + total vs limit |
| Chat “what’s my spending?” | Unified summary, not two separate answers |

---

## What this explicitly does not do

- Shut down running EC2 or S3 in AWS automatically
- Enforce limits on AWS Console or other apps
- Guarantee real-time AWS totals (Cost Explorer lag)
- Replace AWS Budgets / Cost Anomaly Detection (optional complement later)
- Cap token usage per request (only monthly dollar cap)

---

## Relationship to CloudPilot Safety

[feature_cloud_pilot_safety.md](./feature_cloud_pilot_safety.md) is **Phase 1** of this plan. Implement Safety first unchanged; then Phase 2–3 extend the same `cloud_pilot_safety` table and `checkSpendingLimit()` to AWS + `total`.

When Phase 1 ships, mark Safety finished and keep this doc as the umbrella through Phase 3.



---

# Source: `capability_migration.md`

# CloudPilot Capability Layer — Single Function Entry Points

**Purpose:** Step-by-step plan to introduce `capabilities/` as the standardized execution surface between handlers and external engines (Atlas, OpenAI, etc.).

**Status:** Planned — no code until Step C1.

**Do this before:** [step_one_cleanup.md](./step_one_cleanup.md) (Phase U1–U3), then Step C1.

**Related:**

| Doc | Role |
|-----|------|
| [architecture.md](../architecture/architecture.md) | Stable reference — four layers + History, history rules |
| [step_one_cleanup.md](./step_one_cleanup.md) | Pre-capability cleanup — do U1–U3 first |
| [single_capabiity_change.md](./single_capabiity_change.md) | New & changed files map |
| [development_undo_feature.md](../architecture/development_undo_feature.md) | Undo reuses change capabilities |
| [../To_do.md](./to_do.md) | Active checklist |

**Last reviewed:** 2026-06-09

---

## What stays the same

The chat pipeline does **not** change. Every user message still runs STEPS 1–7. Only **what STEP 6 calls** (and optionally what STEP 7 calls for general chat) gets standardized.

```text
POST /message
  ↓
processMessage()                     ← Conversation Layer
  ↓
STEP 3  understandMessage
STEP 4  decideNextStep
STEP 5  applyDecision               ← requests
STEP 6  executeRequest              ← Execution Layer (when execution_started)
        ↓
        handler (thick)
        ↓
        capability (thin)             ← NEW — single entry point
        ↓
        Atlas / AWS                   ← Engine Layer
STEP 6B saveHistory()                 ← WHAT CHANGED — cross-cutting, NOT inside capability
STEP 7  buildResponse
```

**History rule (locked):** Capabilities return structured results. `saveHistory()` stays in STEP 6B after change success/failure. Capabilities do not insert history rows.

---

## Four layers + History

Four **layers** answer WHAT / WHEN / HOW / WHERE. **History** is a fifth **concept** — cross-cutting, not a layer — it records WHAT CHANGED after execution completes.

| Concept | Question | Home |
|---------|----------|------|
| **Conversation** | WHAT should happen? | `processMessage`, understand, decide, requests, responses |
| **Execution** | WHEN should it happen? | `executeRequest`, handlers (registry) |
| **Capability** | HOW do we do it? | `capabilities/` — `scanEC2`, `toggleEC2`, `getAllResources`, `generalChat` |
| **Engine** | WHERE do we talk? | Atlas, AWS, OpenAI (`services/chat/openAI/`), GitHub, Jira |
| **History** | WHAT CHANGED? | `services/history/` + STEP 6B — **not part of HOW** |

History intentionally sits outside the capability path:

```text
executeRequest()
    ↓
handler
    ↓
toggleEC2()          ← capability (HOW)
    ↓
Atlas                ← engine (WHERE)
    ↓
saveHistory()        ← WHAT CHANGED (changes only)
```

Capabilities return structured results. `saveHistory()` stays in STEP 6B after change success/failure. Capabilities do not insert history rows.

### Who calls capabilities?

| Caller | Example | Capability |
|--------|---------|------------|
| Chat (STEP 6) | User confirms scan | `scanEC2()` |
| Undo (later) | User says undo | `toggleEC2()` via `executeUndoPayload()` |
| Auto-remediation (future) | CPU idle 30 days | `resizeEC2()` |
| Public API (future) | `POST /api/toggle` | `toggleEC2()` |

Handlers stay **thick** (Navigator, chat copy, field context). Capabilities stay **thin** (HTTP / SDK call, normalized return shape).

---

## Target folder layout

```text
application/atlas/capabilities/     ← sibling to services/
├── scans/
│   ├── scanEC2.js
│   ├── scanS3.js
│   └── scanRDS.js
├── inventory/
│   ├── getAllResources.js
│   ├── listEC2Instances.js
│   └── listS3Buckets.js
├── changes/
│   ├── toggleEC2.js
│   ├── createEC2.js
│   ├── deleteEC2.js
│   └── resizeEC2.js
└── conversation/
    └── generalChat.js              ← see “General chat” section below
```

Handlers import with relative paths, e.g. `../../../../capabilities/changes/toggleEC2` from `services/actions/ec2/toggleEC2/`.

### Capability return shape (convention)

Each capability returns a normalized object handlers can rely on:

```javascript
{
  success: boolean,
  data: object | null,       // engine payload (Atlas body, OpenAI text, etc.)
  error: string | null
}
```

Handlers map `data` → Navigator, `cloudPilotMessage`, etc.

### Future metadata (not Step C1)

Later, optional exports for automation:

```javascript
toggleEC2.meta = { group: 'change', createsHistory: true }
scanEC2.meta = { group: 'scan', createsHistory: false }
```

Do not build meta registry until at least C2–C4 are done.

---

## General chat — is it a capability?

**Short answer:** Yes as a **single entry point**, but in a **fourth group** (`conversation/`), not mixed with scans/inventory/changes.

| | Cloud operations | General chat |
|--|------------------|--------------|
| Pipeline step | STEP 6 (`execution_started`) | STEP 7 (`generalChatResponding`) |
| Engine | Atlas → AWS | OpenAI |
| History | changes only | Never |
| Handler | Yes (scan/toggle handlers) | No — response builder calls capability directly today |

### Recommended shape

```text
STEP 7 buildResponse
  ↓ (chatType === generalChatResponding)
buildGeneralChatResponse
  ↓
capabilities/conversation/generalChat({ message, conversationID, context })
  ↓
openAIFunctions.sendGeneralChat()    ← engine stays in chat/openAI/
```

**Why a fourth group (`conversation/`), not mixed into `changes/` or a handler:**

- General chat is not “execute a CloudPilot action” — no request row lifecycle, no confirm, no Atlas.
- Symmetry still holds: one function to call, one place to mock, future API can expose `POST /api/chat`.
- Keeping the OpenAI SDK in `chat/openAI/` is fine — `generalChat()` is the thin wrapper (like `scanEC2()` wraps Atlas HTTP).

**What NOT to do:**

- Do not route general chat through STEP 6 / `executeRequest` just to “fit the pattern.”
- Do not put OpenAI logic inside handlers or inside `understandMessage`.

**When to implement:** Step C6 (after first scan + change capabilities prove the pattern).

---

## Implementation steps

Work in order. Each step is shippable and testable on its own. **Do not rename symbols repo-wide in the same pass as a folder move.**

---

### Step C0 — Lock the plan ✅

- [x] Document four layers and history separation
- [x] Confirm pipeline unchanged
- [x] This file

**Verify:** Review with architecture.md — no contradictions.

---

### Step C1 — Scaffold `capabilities/` + conventions

**Goal:** Empty structure + one README comment block in each folder; no behavior change.

**Tasks:**

1. Create `application/atlas/capabilities/{scans,inventory,changes,conversation}/`
2. Document capability conventions in [atlas README](../../../README.md) (`capabilities/` section) — return shape, “thin only”, history stays STEP 6B
3. Add `index.js` re-exports (optional) or direct requires from handlers

**Verify:** App boots; no imports switched yet.

---

### Step C2 — First change: `toggleEC2`

**Goal:** Prove change path + STEP 6B history unchanged.

**Tasks:**

1. Move HTTP body from `atlasEC2Functions.toggleEC2()` → `capabilities/changes/toggleEC2.js`
2. `atlasEC2Functions.toggleEC2` becomes thin re-export (deprecation comment) OR handler imports capability directly
3. `toggleEC2Handler` calls `capabilities/changes/toggleEC2(...)` — formatting/Navigator unchanged
4. Confirm `executeRequest` → `saveHistory()` still logs `STEP 6B: HISTORY SAVED` on automatic toggle

**Verify:**

- E2E toggle automatic → Atlas hit, history row, same chat/Navigator as before
- `grep atlasEC2Functions.toggleEC2` — only capability + legacy shim remain

---

### Step C3 — First scan: `scanEC2`

**Goal:** Prove scan path; no history.

**Tasks:**

1. Extract `capabilities/scans/scanEC2.js` from `atlasEC2Functions.scanEC2`
2. Wire `scanEC2Handler` → capability
3. Legacy shim on `atlasEC2Functions.scanEC2` if needed

**Verify:**

- `"scan ec2"` → region → confirm → scan runs; Navigator unchanged
- No row in `cloudpilot_history`

---

### Step C4 — Inventory: `getAllResources` (inventory_aws)

**Goal:** Prove `immediate_execution` path (STEP 6 without confirm).

**Tasks:**

1. Extract from inventory handler’s Atlas call → `capabilities/inventory/getAllResources.js`
2. Wire `inventoryAWSHandler` → capability

**Verify:**

- Inventory chat flow → resources on dashboard; no history row

---

### Step C5 — Remaining EC2 capabilities

**Goal:** Complete EC2 surface before cross-service work.

**Tasks:**

1. `createEC2`, `deleteEC2` → `capabilities/changes/`
2. Handlers updated; shims on `atlasEC2Functions` until C7

**Verify:** E2E create/delete test scripts pass.

---

### Step C6 — General chat entry point

**Goal:** Single function for OpenAI; wire live `sendGeneralChat` (currently stubbed in `buildGeneralChatResponse.js`).

**Tasks:**

1. Add `capabilities/conversation/generalChat.js` — calls `openAIFunctions.sendGeneralChat`
2. `buildGeneralChatResponse` → `generalChat({ message, conversationID, context })`
3. No STEP 6 changes

**Verify:**

- `"hi"` → OpenAI response (or configured stub in dev)
- No request row created; no Atlas call

---

### Step C7 — Remove legacy shims

**Goal:** One import path per capability.

**Tasks:**

1. Grep for direct `atlasEC2Functions.*` outside capabilities — replace with capability imports
2. Trim or delete moved functions from `atlasEC2Functions.js` (keep file if other EC2 helpers remain)

**Verify:** Grep clean; smoke all four EC2 flows.

---

### Step C8 — Undo uses capabilities (ties to H4)

**Goal:** Undo never calls Atlas directly.

**Tasks:**

1. `undoRegistry` maps `undo_payload.type` → change capability (e.g. `toggleEC2`)
2. `executeUndoPayload()` calls capability with payload args
3. STEP 6B still records undo history row after success

**Verify:** Undo toggle E2E; same `toggleEC2()` path as user confirm.

**See:** [development_undo_feature.md](../architecture/development_undo_feature.md) H4.

---

### Step C9 — Future consumers (deferred)

Not scheduled — documented so the model stays coherent.

| Consumer | Entry |
|----------|--------|
| Public API | Controller → capability |
| Auto-remediation job | Job → `capabilities/changes/resizeEC2` |
| PR generation | Already mode 3 in decision — may call capability or emit instructions only |

---

## Capability group ↔ history (reference)

| Group | Folder | STEP 6? | STEP 6B history? |
|-------|--------|---------|------------------|
| Scan | `scans/` | On confirm | No |
| Inventory | `inventory/` | Often immediate | No |
| Change | `changes/` | On confirm | Yes |
| Conversation | `conversation/` | No (STEP 7) | No |

---

## Per-message call map (reminder)

Every `POST /message` runs STEPS 1–7. Atlas/OpenAI run only when:

| Trigger | STEP 4 `response.type` | Capability called |
|---------|------------------------|-------------------|
| Confirm scan/toggle | `execution_started` | STEP 6 → handler → capability |
| Inventory | `immediate_execution` | STEP 6 → handler → capability |
| General chat | `general_chat` | STEP 7 → `generalChat()` |
| Missing fields / confirm prompt | `ask_for_missing_fields`, `awaiting_confirmation`, etc. | None |

---

## Exit criteria (whole initiative)

- [ ] All Atlas HTTP calls from chat flow go through `capabilities/`
- [ ] Handlers contain zero raw `fetch(ATLAS_BASE_URL + …)` 
- [ ] `saveHistory()` only in `executionFunctions.js` (STEP 6B), never inside capabilities
- [ ] Undo (H4) calls change capabilities only
- [ ] `generalChat()` is the only OpenAI entry from STEP 7
- [ ] Docs: architecture.md + this file match live layout

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-09 | Initial plan — four layers, C0–C9, general chat as `conversation/` |
| 2026-06-09 | `capabilities/` at atlas root (sibling to `services/`); History as cross-cutting WHAT CHANGED |



---

# Source: `single_capabiity_change.md`

# Capability Layer — New & Changed Files

**Purpose:** Inventory of what gets added or touched when implementing the capability layer (Steps C1–C8). No implementation in this doc — file and function map only.

**Related:**

| Doc | Role |
|-----|------|
| [capability_migration.md](./capability_migration.md) | Step-by-step plan (C0–C9) |
| [architecture.md](../architecture/architecture.md) | Four layers + History, history rules |

**Last reviewed:** 2026-06-09

---

## Four layers + History

Four **layers** answer WHAT / WHEN / HOW / WHERE. **History** is a fifth **concept** — cross-cutting, not a layer.

| Concept | Question | Pipeline home |
|---------|----------|---------------|
| **Conversation** | **What** should happen? | STEPS 3–5 — understand, decide, request state |
| **Execution** | **When** should it happen? | STEP 6 — gate on `execution_started` / `immediate_execution` |
| **Capability** | **How** do we do it? | `capabilities/` — `scanEC2()`, `toggleEC2()`, `generalChat()` |
| **Engine** | **Where** do we talk? | Atlas HTTP, OpenAI SDK, GitHub, Jira |
| **History** | **What changed?** | Cross-cutting — STEP 6B in `executionFunctions.js`; **not part of HOW** |

```text
executeRequest() → handler → toggleEC2() → Atlas → saveHistory()
```

**History rule (locked):** Capabilities return structured results. `saveHistory()` stays in STEP 6B (`executionFunctions.js`). Capabilities do not insert history rows.

**General chat nuance:** WHAT/WHEN still decided in Conversation (STEP 4). HOW is still a capability. Call site is STEP 7 (not STEP 6) because there is no CloudPilot request to execute.

---

## New files (by step)

### C1 — Scaffold

| File | Purpose |
|------|---------|
| [atlas README](../../../README.md) (`capabilities/` section) | Conventions: return shape, thin-only, history stays STEP 6B |
| `capabilities/index.js` | Optional re-exports — not required if handlers import directly |

Empty folders at C1:

```text
capabilities/scans/
capabilities/inventory/
capabilities/changes/
capabilities/conversation/
```

Optional shared engine helper (could wait until C2):

| File | Purpose |
|------|---------|
| `capabilities/_shared/fetchAtlasMutation.js` | Extract `fetchAtlasMutation()` from `atlasEC2Functions.js` — shared by change capabilities |

---

### C2 — First mutation

| File | New function |
|------|----------------|
| `capabilities/changes/toggleEC2.js` | `toggleEC2(requestBody)` — Atlas `POST /ec2/toggle` |

---

### C3 — First scan

| File | New function |
|------|----------------|
| `capabilities/scans/scanEC2.js` | `scanEC2(region)` — Atlas `POST /scan/ec2` |

---

### C4 — Inventory

| File | New function |
|------|----------------|
| `capabilities/inventory/getAllResources.js` | `getAllResources(options?)` — Atlas `POST /inventory/aws` (today’s `inventoryAWS()` body) |

Handler can remain `inventoryAWSHandler`; capability name aligns with product language.

---

### C5 — Remaining EC2 + S3

| File | New function |
|------|----------------|
| `capabilities/changes/createEC2.js` | `createEC2(requestBody)` |
| `capabilities/changes/deleteEC2.js` | `deleteEC2(requestBody)` |
| `capabilities/scans/scanS3.js` | `scanS3(region)` |

---

### C6 — General chat

| File | New function |
|------|----------------|
| `capabilities/conversation/generalChat.js` | `generalChat({ message, conversationID, context })` — wraps OpenAI engine |

Use **`conversation/`** not **`chat/`** — avoids collision with existing `services/chat/`.

---

### C8 — Undo (later, with H4)

| File | New function |
|------|----------------|
| `services/history/undoRegistry.js` | `executeUndoPayload(payload)` — maps `payload.type` → mutation capability |

Possibly also:

| File | New function |
|------|----------------|
| `services/history/functions/undoFunctions.js` | Orchestration: lookup → execute → save undo history row |

See [development_undo_feature.md](../architecture/development_undo_feature.md) H4.

---

## Changed files

### Handlers — import swap only (logic stays thick)

| File | Change |
|------|--------|
| `actions/ec2/toggleEC2/toggleEC2Handler.js` | `atlasEC2Functions.toggleEC2(...)` → `capabilities/changes/toggleEC2(...)` |
| `actions/ec2/scanEC2/scanEC2Handler.js` | → `capabilities/scans/scanEC2(...)` |
| `actions/ec2/createEC2/createEC2Handler.js` | → `capabilities/changes/createEC2(...)` |
| `actions/ec2/deleteEC2/deleteEC2Handler.js` | → `capabilities/changes/deleteEC2(...)` |
| `actions/s3/scanS3/scanS3Handler.js` | → `capabilities/scans/scanS3(...)` |
| `actions/aws/inventoryAWS/inventoryAWSHandler.js` | → `capabilities/inventory/getAllResources(...)` |

Handlers **keep:** field reads from `context.state.collected`, formatters, Navigator adapters, message builders, execution-mode branches (instructions / cli / pr).

**Import paths** (from `services/actions/…`):

| Handler | Require |
|---------|---------|
| `ec2/toggleEC2/toggleEC2Handler.js` | `../../../../capabilities/changes/toggleEC2` |
| `ec2/scanEC2/scanEC2Handler.js` | `../../../../capabilities/scans/scanEC2` |
| `responses/buildGeneralChatResponse.js` | `../../capabilities/conversation/generalChat` |

---

### Response layer — C6 only

| File | Change |
|------|--------|
| `responses/buildGeneralChatResponse.js` | Call `generalChat()` instead of inline stub / direct `openAIFunctions.sendGeneralChat` |

---

### Legacy Atlas wrappers — shrink over C2–C7

| File | Change |
|------|--------|
| `actions/ec2/atlasEC2Functions.js` | HTTP moves out; C2–C5 thin re-exports, then deleted or trimmed at C7 |
| `actions/aws/atlasAWSFunctions.js` | Same for `inventoryAWS` |
| `actions/s3/atlasS3Functions.js` | Same for `scanS3` |

Functions that **move out** of `atlasEC2Functions.js`:

- `fetchAtlasMutation()` → `_shared/` or per-change capability file
- `scanEC2()`, `createEC2()`, `deleteEC2()`, `toggleEC2()`

---

### Execution / history — mostly unchanged

| File | Change |
|------|--------|
| `executions/functions/executionFunctions.js` | No structural change — still `executeRequest`, `shouldRunExecution`, `saveHistory()` at STEP 6B |
| `history/functions/historyFunctions.js` | No change for C1–C7 |
| `history/historyBuilders/toggleEc2History.js` | No change |

---

## Explicitly unchanged

| File / area | Why |
|-------------|-----|
| `cloudPilotMessageFunctions.js` | Conversation layer — WHAT |
| `understanding/understandMessage.js` | WHAT |
| `decision/decideNextStep.js` | WHAT |
| `requests/functions/requestFunctions.js` | WHAT |
| `actions/actionMap.js` | Still maps `action_type` → handler |
| `responses/buildCloudPilotResponse.js` | STEP 7 copy for CloudPilot actions |
| `responses/buildResponse.js` | Router only — one path to general chat at C6 |
| `chat/openAI/openAIFunctions.js` | Engine layer — SDK stays here; called by `generalChat()` |
| All formatters / Navigator adapters / message builders | Handler concerns, not capabilities |
| `executions/AtlasExecution.js` | Legacy; not on critical path |

---

## Function map (before → after)

| Today | After | Group |
|-------|-------|-------|
| `atlasEC2Functions.toggleEC2()` | `toggleEC2()` in `capabilities/changes/` | change |
| `atlasEC2Functions.scanEC2()` | `scanEC2()` in `capabilities/scans/` | scan |
| `atlasEC2Functions.createEC2()` | `createEC2()` in `capabilities/changes/` | change |
| `atlasEC2Functions.deleteEC2()` | `deleteEC2()` in `capabilities/changes/` | change |
| `atlasS3Functions.scanS3()` | `scanS3()` in `capabilities/scans/` | scan |
| `atlasAWSFunctions.inventoryAWS()` | `getAllResources()` in `capabilities/inventory/` | inventory |
| `openAIFunctions.sendGeneralChat()` | Still exists — wrapped by `generalChat()` in `capabilities/conversation/` | conversation |
| *(none)* | `executeUndoPayload()` in `history/undoRegistry.js` | change (C8) |

Handler names stay the same (`toggleEC2Handler`, `scanEC2Handler`, etc.) — only the downstream call changes.

---

## Target folder layout

```text
capabilities/
├── _shared/
│   └── fetchAtlasMutation.js       ← optional
├── scans/
│   ├── scanEC2.js
│   └── scanS3.js
├── inventory/
│   └── getAllResources.js
├── changes/
│   ├── toggleEC2.js
│   ├── createEC2.js
│   └── deleteEC2.js
└── conversation/
    └── generalChat.js
```

---

## Capability group ↔ history

| Group | Folder | STEP 6? | STEP 6B history? |
|-------|--------|---------|------------------|
| Scan | `scans/` | On confirm | No |
| Inventory | `inventory/` | Often immediate | No |
| Change | `changes/` | On confirm | Yes |
| Conversation | `conversation/` | No (STEP 7) | No |

---

## File count summary

| Category | Count |
|----------|-------|
| New capability files | ~9 (`toggleEC2`, `scanEC2`, `scanS3`, `createEC2`, `deleteEC2`, `getAllResources`, `generalChat`, optional `_shared/fetchAtlasMutation`, optional `index.js`) |
| New undo files (C8) | 1–2 |
| Changed handlers | 6 |
| Changed response | 1 (`buildGeneralChatResponse.js`) |
| Shrunk / removed legacy | 3 (`atlasEC2Functions`, `atlasAWSFunctions`, `atlasS3Functions`) |
| Unchanged pipeline core | ~15+ files |

---

## Sanity checklist (before coding)

- [ ] No new STEP — still 1–7, 6B for history
- [ ] Handlers stay thick — 6 files change one import + one call each
- [ ] Registry untouched — `actionMap.js` does not need edits
- [ ] OpenAI stays engine — `openAIFunctions.js` not duplicated
- [ ] History not in capabilities — `executionFunctions.js` still owns `saveHistory()`
- [ ] Fourth group is `conversation/` — not `chat/`

---

## Smallest first slice (C1 + C2)

Roughly **4 new files, 1 handler edit, 1 legacy shim**:

1. Atlas README — `capabilities/` section
2. `capabilities/changes/toggleEC2.js`
3. Optional `capabilities/_shared/fetchAtlasMutation.js`
4. Edit `toggleEC2Handler.js` — one import + one call
5. `atlasEC2Functions.js` — thin re-export or trim

**Verify:** Toggle automatic E2E → Atlas hit, `STEP 6B: HISTORY SAVED`, same chat/Navigator as before.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-09 | Initial inventory — new/changed files and functions for C1–C8 |
| 2026-06-09 | `capabilities/` at atlas root; History as cross-cutting WHAT CHANGED |



---

# Source: `step_one_cleanup.md`

# Step One — Cleanup (before Capability Layer)

**Purpose:** Remove dead code and unused files **before** implementing the capability layer (Steps C1–C7). Cleanup first → smaller diffs, honest grep, no moving HTTP twice.

**Status:** Planned — not started.

**Do this before:** [step_one_cleanup.md](./step_one_cleanup.md) (Phase U1–U3), then Step C1.

**Related:**

| Doc | Role |
|-----|------|
| [capability_migration.md](./capability_migration.md) | Capability layer — C0–C9 |
| [single_capabiity_change.md](./single_capabiity_change.md) | New & changed files for capabilities |
| [architecture.md](../architecture/architecture.md) | Four layers, pipeline reference |
| [../To_do.md](./to_do.md) | Active checklist |

**Last reviewed:** 2026-06-09

---

## Why this order

1. Capability moves are mostly **import swaps** — dead code makes it hard to know what's actually called.
2. **Separate PRs** — cleanup vs capabilities are easier to review.
3. **Avoid double moves** — don't extract `toggleEC2` into `capabilities/`, then delete a file that still had the old copy in comments.

```text
Phase U  (this doc)     →  clean live tree
Phase C  (entry points) →  capabilities C1–C7
```

---

## Phase U steps

| Step | Focus | Risk |
|------|--------|------|
| **U1** | Dead comment blocks in live files | Low — smoke chat after |
| **U2** | Dead functions + unused imports in live files | Low |
| **U3** | Legacy `functions/functions.js` audit | Medium |
| **U4** | `doc/code/` snapshot archives | None (docs only) |
| **U5** | `state/ActionState.js` memory path | Medium — defer until DB-only confirmed |

---

## U1 — Dead comment blocks (highest value)

### Primary target: `services/cloudPilotMessageFunctions.js`

**Live path:** lines **45–210** — STEPS 1–7 (`processMessage`).

**Remove (after confirming nothing live references it):**

| Lines (approx) | Content |
|----------------|---------|
| ~213–560 | Old pipeline inside `/* … */` |
| ~562–588 | Commented `detectUserRequest` |
| ~754+ | Duplicate commented `processMessage` |

**Keep:**

| Function | Why |
|----------|-----|
| `processMessage` (45–210) | Live orchestrator |
| `getActionDefinition` | Exported / used externally |
| `getCurrentUserMessage` | STEP 1 |
| `cloneActionStatus` | Outcome shaping |
| `normalizeProcessMessageContext` | Context helper |

**Verify after U1:** App boots; `"scan ec2"`, `"toggle ec2"`, `"hi"` smokes pass.

---

## U2 — Dead functions + unused imports

### `services/cloudPilotMessageFunctions.js`

**Unused on live path (candidates to remove with dead block):**

| Import / function | Notes |
|-------------------|--------|
| `Functions` (`../functions/functions.js`) | Only used in commented old pipeline |
| `AtlasExecution` | Only in dead/commented paths in this file |
| `CloudPilotChat` | Only in dead/commented paths **in this file** — still live via `buildCloudPilotResponse.js` |
| `shouldStartNewAction` | Old pipeline only |
| `resolveNullActionEvent` | Old pipeline only |
| `handleGeneralChat` (local) | Replaced by `buildGeneralChatResponse.js` |
| `handleCloudPilotChatOLD` | Dead |

### Other live files

| File | Action |
|------|--------|
| `understanding/understandMessage.js` | Remove commented pre-Slice-1 block |

### Do not delete (still live)

| File | Used by |
|------|---------|
| `chat/CloudPilotChat.js` | `responses/buildCloudPilotResponse.js` (STEP 7) |
| `classes/AtlasExecution.js` | `CloudPilotChat.js` |
| All handlers, formatters, `actionMap.js` | STEP 6 |

**Verify after U2:** Same smokes as U1; grep for removed symbol names returns nothing in live code.

---

## U3 — `functions/functions.js` audit

**Location:** `application/atlas/functions/functions.js`

Superseded for field extraction by `understanding/search/*`.

| Consumer | What it uses |
|----------|--------------|
| `logic/messages.js` | `Functions.addHeader`, `Functions.addFooter` |
| `cloudPilotMessageFunctions.js` (dead) | `extractStructuredFields`, `determineRequestReadiness`, etc. |

**Goal:** Trim to what `messages.js` still needs, or move header/footer to a tiny util (e.g. `logic/logHelpers.js`).

**Functions likely removable after U1–U2:**

- `extractAwsRegion`, `extractInstanceType`, `extractName`, `extractInstanceId`
- `extractStructuredFields`, `fieldExtractors`
- `determineRequestReadiness`, `determineActionEvent`, `determineExecutionModeEvent`
- `extractExecutionMode`, `shouldStartExecution`, `userConfirmedAction`

**Verify after U3:** `POST /message` still logs header/footer; chat smokes pass.

---

## U4 — Doc snapshots (optional, low urgency)

Not runtime — safe to archive or delete when confident.

```text
application/atlas/doc/code/allCode.js
application/atlas/doc/code/allCodeTwo.js
application/atlas/doc/code/allCodeThree.js
application/atlas/doc/code/commentedCode.js
application/atlas/doc/code/buildAllCodeThree.js
doc/allCode/…                         ← repo-root duplicates (if present)
```

**Options:**

- Move to `doc/archive/code-snapshots/`
- Leave in place and skip until capability work is done
- Delete only after confirming nothing links to them

**No chat smoke required** — docs only.

---

## U5 — `state/ActionState.js` memory path (defer)

**Location:** `application/atlas/state/ActionState.js`

Still used as **in-memory fallback** in `requests/functions/requestLoadFunctions.js` when not in DB mode.

**Only remove when:**

- DB mode is always on in dev/prod
- Tests don't rely on in-memory state

Track in [../To_do.md](./to_do.md) — not part of U1–U2.

---

## Smoke checklist (after U1–U3)

Run before starting capability Step C1:

| Message | Expect |
|---------|--------|
| `"hi"` | General chat path (STEP 7); no request row |
| `"scan ec2"` → region → `"yes"` | Scan runs; Navigator; no history row |
| `"toggle ec2"` → fields → automatic → `"yes"` | Toggle runs; `STEP 6B: HISTORY SAVED` |

Also confirm:

- [ ] App boots without require errors
- [ ] No references to removed symbols in live `services/` code
- [ ] `cloudPilotMessageFunctions.js` is ~200 lines (not ~1000)

---

## Recommended sequence

```text
U1  →  trim cloudPilotMessageFunctions comment blocks
U2  →  remove dead helpers + unused imports
     →  smoke test
C1  →  scaffold capabilities/          ← capability_migration.md
C2  →  toggleEC2 first slice
U3  →  trim functions.js (when ready)
C3–C7 → remaining capabilities
U4  →  doc archives (optional)
U5  →  ActionState memory path (when DB-only)
```

---

## Files touched summary

| Step | Files likely changed |
|------|----------------------|
| U1 | `services/cloudPilotMessageFunctions.js` |
| U2 | `services/cloudPilotMessageFunctions.js`, `understanding/understandMessage.js` |
| U3 | `functions/functions.js`, possibly `logic/messages.js` |
| U4 | `doc/code/*` (move/delete only) |
| U5 | `state/ActionState.js`, `requests/functions/requestLoadFunctions.js` |

**Not touched in U1–U2:** handlers, `atlasEC2Functions.js`, registry, decision, requests, history, executions.

---

## Exit criteria (Phase U complete)

- [ ] Live `processMessage` is the only pipeline in `cloudPilotMessageFunctions.js`
- [ ] No unused imports in cleaned files
- [ ] `functions/functions.js` trimmed or scoped to header/footer only
- [ ] Chat smokes green
- [ ] Ready to start **C1** without grep noise from dead code

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-09 | Initial plan — U1–U5 before capability layer |



---

# Source: `feature_cloud_pilot_safety.md`

# CloudPilot Safety

## What this does

Adds a small **spending guardrail** in front of OpenAI so CloudPilot can fall
back to Internal behavior before OpenAI spend goes too far.

V1 scope:

```text
CloudPilot wants OpenAI
        ↓
checkSpendingLimit(userId, "openai")
        ↓
 allowed?
 /     \
yes     no
 ↓       ↓
OpenAI  Internal
```

This is **not** a general billing platform.  
This is **not** AWS service shutdown logic.  
This is a small product layer for **CloudPilot spending decisions**.

## Current step

**Plan locked — awaiting Step 1.**

## Next

Say **do Step 1** when ready to create the safety table and the first OpenAI row.

**Status:** Active  
**Codename:** `cloudPilotSafety`  
**Related:** [Spending Hard Limit](./feature_spending_hard_limit.md) (umbrella — AWS + OpenAI) · [Current Development](./current_development.md) · [AI Spending](../finished/feature_ai_spending.md) · [CloudPilot Context](../finished/feature_cloud_pilot_context.md) · [Use OpenAI Chat](../how_to/use_openai_chat.md)

> **Note:** This doc is **Phase 1** of [Spending Hard Limit](./feature_spending_hard_limit.md). OpenAI gate ships here; unified AWS + total cap follows in Phases 2–3.

---

## Goal (one sentence)

Prevent CloudPilot from making OpenAI calls when the configured spend limit for
the `openai` service says it should stop, while keeping all existing Internal
fallback behavior understandable and centralized.

---

## V1 boundaries

**In:**

- One generic safety table with **OpenAI as the first service**
- One row for one user
- Warning threshold + hard limit
- One centralized gate before OpenAI requests
- If blocked: skip OpenAI and use existing Internal path
- If warning exceeded: still allow, but log / alert

**Out:**

- AWS spending enforcement
- Disabling AWS services
- Daily / weekly / per-team policies
- Currency / invoice reconciliation
- Historical safety-event tables
- Full admin UI
- A special one-off `openai_safety` table

---

## Locked design decisions

| Topic | Decision |
|-------|----------|
| Table name | `cloud_pilot_safety` |
| Scope | Generic **spending guardrail** table, not OpenAI-only table |
| First service | `openai` |
| Service switch | `spending_enabled` (per service, not global) |
| Spend source of truth | Existing AI Usage / `cloud_pilot_ai_usage` |
| Safety responsibility | Decide whether spend is allowed, not compute spend |
| Hard-limit behavior | Block OpenAI and fall back to Internal |
| Warning-limit behavior | Allow call, but log / alert |
| Product code home | `cloudPilot/spending/` |
| Decision owner | `cloudPilot/spending/checkSpendingLimit.js` |
| Enforcement point | `providers/openAI/client/openAIClient.js` |

---

## Table shape (V1)

Do **not** store `current_spend` as the source of truth here.

Use AI Usage for:

```text
How much have we spent?
```

Use Safety for:

```text
Given what we've spent, are we allowed to make another call?
```

### Recommended V1 table

```text
cloud_pilot_safety

id
user_id
service
spending_enabled
warning_limit
hard_limit
limit_period
action
created_at
updated_at
```

Example first row:

```text
user_id:          1
service:          openai
spending_enabled: true
warning_limit:    3.00
hard_limit:       5.00
limit_period:     monthly
action:           disable
```

Notes:

- `service` is generic: `openai`, later `aws_ec2`, `aws_s3`, `anthropic`, etc.
- `spending_enabled=false` for `openai` means CloudPilot is not allowed to spend
  money on OpenAI.
- This does **not** imply a future AWS service should be auto-disabled. It only
  means the spending-control policy for that service says “do not spend more.”

---

## Architecture

```text
AI Usage
  "spent $0.83 this month"
        │
        ▼
cloudPilot/spending/
  "warning $3 / hard $5"
        │
        ▼
Is another OpenAI call allowed?
   /                  \
 yes                  no
  ↓                    ↓
OpenAI              Internal
```

### Single gate rule

All OpenAI paths must go through the same check:

- General Chat
- Region Search
- Action Search
- Open Requests Search
- AI Spend Search
- future OpenAI-backed CloudPilot features

Do **not** implement spending logic separately in each capability.

---

## Folder shape

```text
cloudPilot/
└── spending/
    ├── checkSpendingLimit.js
    └── functions/
        └── spendingFunctions.js
```

Ownership:

```text
providers/openAI/usage/
        ↓
measures spend

cloudPilot/spending/
        ↓
decides whether spending is allowed

providers/openAI/client/openAIClient.js
        ↓
enforces the decision
```

---

## Code boundary

The spending logic should **not** live inside `providers/openAI/client/`.

Lock this split:

```text
cloudPilot/spending/checkSpendingLimit.js
    owns the decision

providers/openAI/client/openAIClient.js
    asks for the decision
    enforces the result
```

Reason:

- `cloudPilot/spending/` is a product concern, not a provider concern
- `openAIClient.js` is still the right lowest common enforcement point
- the boundary stays clean when later services are added

Conceptually:

```javascript
const safety = await checkSpendingLimit(userId, "openai");

if (!safety.allowed) {
    return blockedOpenAIResult();
}

return callOpenAI();
```

Where `blockedOpenAIResult()` is shaped so existing callers can cleanly keep or
use their Internal behavior rather than crashing or inventing answers.

---

## How fallback should work

If OpenAI is blocked:

```text
OpenAI requested
   ↓
Safety says no
   ↓
Return "blocked by safety" outcome
   ↓
Caller uses existing Internal path
```

Examples:

| Capability | If OpenAI blocked |
|-----------|--------------------|
| General Chat | Return Internal stub / fallback behavior |
| Region Search | Use internal region search |
| Action Search | Use internal action rules |
| Open Requests Search | Use internal question classify |
| AI Spend Search | Use internal question classify |

The important point is: **Safety blocks spend, not product behavior.**

---

## Alerts / logs

V1 only needs simple logging.

### Warning threshold

If current spend exceeds `warning_limit`:

- allow OpenAI
- log a warning
- optionally surface later in dashboard / admin tools

### Hard limit

If current spend exceeds `hard_limit`, or `spending_enabled=false`:

- block OpenAI
- log that Safety blocked the call
- return control to existing Internal fallback path

Do not build a separate alerts table yet unless a real product need appears.

---

## Steps

### Step 1 — Safety table + seed

- [ ] Add `cloud_pilot_safety`
- [ ] Seed one `openai` row for one user
- [ ] Keep this separate from `cloud_pilot_ai_usage`

### Step 2 — Read safety + usage

- [ ] Add `checkSpendingLimit(userId, service)`
- [ ] Put it under `cloudPilot/spending/`
- [ ] Read limits from `cloud_pilot_safety`
- [ ] Read spend from existing AI Usage summary / aggregate path
- [ ] Return a small decision object, e.g. `allowed`, `warning`, `reason`

### Step 3 — Central OpenAI gate

- [ ] Call `checkSpendingLimit()` from the single lowest common OpenAI call point
- [ ] Do not duplicate spending logic in five capability files
- [ ] Preserve existing Internal fallback behavior

### Step 4 — Warning / hard-limit behavior

- [ ] Warning exceeded → allow + log
- [ ] Hard limit exceeded → block + fall back to Internal
- [ ] `spending_enabled=false` → block immediately

### Step 5 — Offline verification only

- [ ] Verify blocked outcome shape without intentionally spending more on OpenAI
- [ ] Verify callers still use Internal when OpenAI is blocked
- [ ] Verify warning path logs but still allows the call

---

## Acceptance

| Input | Expect |
|------|--------|
| `openai` row enabled, spend below warning | OpenAI allowed |
| Spend above warning, below hard limit | OpenAI allowed + warning logged |
| Spend above hard limit | OpenAI blocked; caller falls back to Internal |
| `spending_enabled=false` for `openai` | OpenAI blocked immediately |
| No safety row found | Fail safe decision must be explicit in code (lock before coding) |

---

## One open decision before coding

Lock this explicitly:

```text
If there is no cloud_pilot_safety row for (user_id, service),
should CloudPilot default to ALLOW or BLOCK?
```

My recommendation for V1:

- **Default to ALLOW**
- log loudly that the row is missing

Why:

- It avoids surprising outages during rollout
- You are already introducing a hard-limit control path
- Missing configuration is easier to fix than mysterious feature shutdown

If you want stricter behavior later, change it intentionally after rollout.

---

## Design rule

> **AI Usage measures spend. Safety decides whether more spend is allowed.**

That separation keeps the system small, understandable, and extensible.



---

# Source: `feature_clean_cloudpilot_folder.md`

# Feature: Clean `cloudPilot/` folder

Goal: understand and later simplify `api/application/atlas/cloudPilot/` chat + execution structure.

**Status:** Future — deferred from current (2026-09-23). Inspection only. Do not refactor until we decide.

**Architecture north star (locked with Intelligence cleanup):** CloudPilot owns the application turn — **UNDERSTAND (via Intelligence) → DECIDE → FULFILL → RESPOND (via Intelligence)**. Intelligence never jumps from understand into AWS retrieve/execute. See `feature_clean_cloudpilotintelligence_folder.md`. Prefer small fixes that restore that path over more folders. `processMessage` is the conductor.

Scope inspected:

```text
atlas/cloudPilot/

chat/
  general/
    generalChat.js
    GeneralConversation.js
    workflow.js

  presentation/
  request/
  templates/

  CloudPilotMessage.js
  cloudPilotMessageFunctions.js

execution/
  functions/
    executionFunctions.js
    runAction.js

  outcomes/
    outcomeRegistry.js

  AtlasExecution.js
```

Related (not this doc): `feature_clean_cloudpilotintelligence_folder.md` for Intelligence.

---

## Verdict

This area grew by layering intended architecture on top of a working pipeline. Several files are dead, placeholders, or duplicates of the same job.

Scan S3 / Scan EC2 mostly need:

```text
processMessage → request store/execute → handler → speak
```

Not half of what sits under `chat/general/` and the duplicate `AtlasExecution` path.

---

## Per-file inspection

For each file:

1. ONE primary responsibility
2. Who calls it
3. What it calls
4. Required for Scan S3 / Scan EC2 MVP?
5. Kind: entry / orchestration / business / presentation / execution / helper
6. Could responsibility live elsewhere?
7. Abstraction for unused functionality?
8. Rating: KEEP | QUESTION | SIMPLIFY | DEFER

### `chat/general/generalChat.js`

| | |
| --- | --- |
| Responsibility | Placeholder “OpenAI general chat”; always returns `not_implemented` |
| Callers | **Nobody** |
| Calls | Nothing useful |
| MVP? | No |
| Kind | Dead placeholder |
| Elsewhere? | Real job is `cloudPilotIntelligence/generateGeneralMessageReply` via `CloudPilotMessage` |
| Unused abstraction? | **Yes** |
| Rating | **SIMPLIFY** |

### `chat/general/GeneralConversation.js`

| | |
| --- | --- |
| Responsibility | Gate + speak for general turns: detect `generalChatResponding`, call `CloudPilotMessage.prepareGeneralMessageReply` |
| Callers | `cloudPilotMessageFunctions.processMessage` |
| Calls | `CloudPilotMessage` → Intelligence General Chat |
| MVP? | Yes (freeform / non-request turns) |
| Kind | Thin orchestration / speak entry |
| Elsewhere? | Could inline into `processMessage` (~20 lines) |
| Unused abstraction? | No — used but very thin |
| Rating | **QUESTION** |

### `chat/general/workflow.js`

| | |
| --- | --- |
| Responsibility | Placeholder no-op (`console.log` + `return null`); “reserved for future” |
| Callers | **Nobody** |
| Calls | Nothing |
| MVP? | No |
| Kind | Dead placeholder |
| Elsewhere? | N/A |
| Unused abstraction? | **Yes** — symmetry scaffolding |
| Rating | **SIMPLIFY** |

**Note:** The **real** workflow for Scan is `cloudPilot/requests/workflow.js` (`store` / `execute`), not this file. Filename under `general/` does not make that clear.

### `chat/presentation/getRequestMessageReplyContext.js`

| | |
| --- | --- |
| Responsibility | Fact bag for OpenAI polish of request UX (missing fields, confirm, …) |
| Callers | `CloudPilotMessage.prepareRequestMessageReply` |
| Calls | Helpers / field examples |
| MVP? | Yes (when MESSAGE_RESPONSE=openai) |
| Kind | Presentation prep |
| Elsewhere? | Could sit with templates or Intelligence request reply; separation OK |
| Unused? | No |
| Rating | **KEEP** |

### `chat/presentation/navigatorFunctions.js`

| | |
| --- | --- |
| Responsibility | Shape Navigator UI payloads (tables/cards) |
| Callers | S3/EC2 scan navigator adapters (also inventory/billing/history) |
| Calls | Pure helpers |
| MVP? | Yes if Navigator tables ship with scans |
| Kind | Presentation / UI adapter |
| Elsewhere? | Could live under `scans/`; under `chat/presentation` is a bit odd |
| Unused? | No for scans |
| Rating | **KEEP** (placement QUESTION) |

### `chat/request/RequestConversation.js`

| | |
| --- | --- |
| Responsibility | STEP 7 speak routing for request turns |
| Callers | `processMessage` after store/execute |
| Calls | `CloudPilotMessage`, history/open-requests, execution-mode strategies, create-EC2 guidance, … |
| MVP? | Yes |
| Kind | Orchestration (speak) |
| Elsewhere? | Could merge into `processMessage`; real branching worth a file |
| Unused? | No (some branches outside pure Scan MVP) |
| Rating | **KEEP** |

### `chat/templates/requestTemplates.js`

| | |
| --- | --- |
| Responsibility | Deterministic request UX copy by `actionEvent` |
| Callers | `CloudPilotMessage.prepareRequestMessageReply` |
| Calls | Field prompts, create-EC2 guidance, pricing; **dead branch** `AtlasExecution.startNewAtlasExecution` for `execution_requested` |
| MVP? | Yes for confirm/missing-field copy. `execution_requested` path **not** reached by current `RequestConversation` mapping |
| Kind | Presentation / copy |
| Elsewhere? | Fine as templates; executing Atlas from templates is confusing |
| Unused parts? | `execution_requested` leftover |
| Rating | **KEEP** / QUESTION (dead Atlas branch) |

### `chat/CloudPilotMessage.js`

| | |
| --- | --- |
| Responsibility | Package outgoing Message Reply (general / request / known); does not HTTP-send |
| Callers | `GeneralConversation`, `RequestConversation` |
| Calls | Intelligence, `requestTemplates`, `getRequestMessageReplyContext` |
| MVP? | Yes |
| Kind | Presentation front door |
| Elsewhere? | Could fold into conversation files; single packaging door is clear |
| Unused? | No |
| Rating | **KEEP** |

### `chat/cloudPilotMessageFunctions.js`

| | |
| --- | --- |
| Responsibility | Whole turn pipeline `processMessage` |
| Callers | `logic/messages.js` |
| Calls | Understand, decide, General/Request conversation, `requests/workflow`, verification, history, … |
| MVP? | Yes — **the** chat turn entry |
| Kind | Entry + orchestration |
| Elsewhere? | This is the center |
| Unused? | No |
| Rating | **KEEP** |

### `execution/functions/executionFunctions.js`

| | |
| --- | --- |
| Responsibility | STEP 6 orchestration: should run? context; automatic strategy; finish request; history |
| Callers | `requests/workflow.execute` ← `processMessage` |
| Calls | `AutomaticLogic` → `runAction`; request finish; history; undo |
| MVP? | Yes |
| Kind | Orchestration / execution |
| Elsewhere? | Overlaps historically with `AtlasExecution` |
| Unused? | No — **live** execute path |
| Rating | **KEEP** |

### `execution/functions/runAction.js`

| | |
| --- | --- |
| Responsibility | Look up `executionFunction` on master registry and call it |
| Callers | `AutomaticLogic.runAutomaticStrategy` only |
| Calls | e.g. `scanS3Handler` / `scanEC2Handler` |
| MVP? | Yes (thin but on path) |
| Kind | Helper / dispatch |
| Elsewhere? | Could be one function inside `executionFunctions.js` |
| Unused? | No |
| Rating | **QUESTION** |

### `execution/outcomes/outcomeRegistry.js`

| | |
| --- | --- |
| Responsibility | Map error codes → friendly English strings |
| Callers | EC2 change handlers, `scanEC2Handler` (failure), `history/undoRegistry`. **Not** `scanS3Handler` |
| Calls | Nothing external |
| MVP? | Not required for S3 happy path; useful for EC2 failure copy |
| Kind | Presentation helper for execution errors |
| Elsewhere? | Could be messages next to handlers; “registry” is a dict + helpers |
| Unused for S3 success? | Mostly irrelevant |
| Rating | **DEFER** (pure S3) / KEEP for EC2 errors |

Registered codes in `OUTCOME_MESSAGES`:  
`instance_not_found`, `instances_not_found`, `instance_terminated`, `invalid_instance_id`, `invalid_instance_state`, `same_instance`, `aws_toggle_failed`, `aws_terminate_failed`, `atlas_unreachable`, `missing_instance_ids`, `missing_instance_id`, `invalid_region`, `no_default_ami_for_region`, `aws_run_instances_failed`, `aws_tag_failed`, `missing_tag_key`, `missing_tag_value`, `execution_failed`  
Plus `DEFAULT_EXECUTION_FAILED` for toggle/delete/create/tag/pause/resume.

If removed: those handlers need inline strings; S3 success unchanged; undo/change EC2 failure copy degrades.

### `execution/AtlasExecution.js`

| | |
| --- | --- |
| Responsibility | Older “start execution + finish DB row” that calls `executionFunction` directly |
| Callers | **Only** `requestTemplates` when `actionEvent === 'execution_requested'` — current mapping **never** emits that |
| Calls | Master handler; Request DB helpers. `checkAtlasExecutionStatus` / `closeAtlasExecution` stubs/unused |
| MVP? | **Not on live Scan path** |
| Kind | Duplicate execution orchestration |
| Elsewhere? | Already in `executionFunctions` + `runAction` |
| Unused abstraction? | **Yes** |
| Rating | **SIMPLIFY** |

---

## `generalChat.js` vs `GeneralConversation.js`

| | `generalChat.js` | `GeneralConversation.js` |
| --- | --- | --- |
| Role | Unwired stub | Real general-turn entry used by `processMessage` |
| Boundary | None in practice | `isGeneralConversation` + `conversation()` → `CloudPilotMessage` |

Only `GeneralConversation` is real. `generalChat.js` does not delegate to it. Real GenAI is `generateGeneralMessageReply` via `CloudPilotMessage`.

---

## What “workflow” means

- `chat/general/workflow.js` — **owns nothing** (placeholder).
- `requests/workflow.js` — **owns** `store` (persist decision) + `execute` (STEP 6). This is the Scan workflow.

---

## What is an “outcome”?

An Atlas/handler **error code** (or failure) turned into user-facing copy via `outcomeRegistry`. Not the same as “conversation outcome” / `processMessage` return shape.

Why a registry? Centralize friendly strings so handlers don’t hardcode every template. Required only if we want that shared copy — not required for S3 happy path.

---

## Live Scan S3 path (confirm → run)

```text
HTTP messages.js
  ↓
cloudPilotMessageFunctions.processMessage()
  ↓
CloudPilotIntelligence.understandMessage()
  ↓
decideNextStep.decideNextStep()          // EXECUTION_STARTED on confirm
  ↓
requests/workflow.store()
  ↓
requests/workflow.execute()
  ↓
executionFunctions.executeRequest()
  ↓
AutomaticLogic.runAutomaticStrategy()
  ↓
runAction.runAction('scan_s3', context)
  ↓
scans/s3/scanS3Handler.js
  ↓
atlasS3Functions.scanS3(region)          // POST Atlas /scan/s3
  ↓
formatter + messageBuilder (+ navigator)
  ↓
executionFunctions finish request + history
  ↓
RequestConversation.conversation()       // executionOutcome message
  ↓
CloudPilotMessage.prepareKnownMessageReply()
  ↓
HTTP response
```

**Not on this path:** `generalChat.js`, `general/workflow.js`, `AtlasExecution.js`, `outcomeRegistry` (S3 success), General Chat Intelligence (unless a general turn).

---

## Ratings summary

| File | Rating |
| --- | --- |
| `generalChat.js` | SIMPLIFY |
| `GeneralConversation.js` | QUESTION |
| `general/workflow.js` | SIMPLIFY |
| `getRequestMessageReplyContext.js` | KEEP |
| `navigatorFunctions.js` | KEEP (placement QUESTION) |
| `RequestConversation.js` | KEEP |
| `requestTemplates.js` | KEEP / QUESTION |
| `CloudPilotMessage.js` | KEEP |
| `cloudPilotMessageFunctions.js` | KEEP |
| `executionFunctions.js` | KEEP |
| `runAction.js` | QUESTION |
| `outcomeRegistry.js` | DEFER (S3) / KEEP (EC2 errors) |
| `AtlasExecution.js` | SIMPLIFY |

---

## `masterContext/` vs this mess

**Orthogonal.** `masterContext/` (under Intelligence) clarifies which AI context ingredients a call gets. It does **not** fix chat/execution folder sprawl.

Prefer: understand / optionally remove dead paths here before more architecture in `cloudPilot/chat` + `execution`. Intelligence Final Response recipe can stay; pause more recipes until this area is clearer.

---

## Possible later cleanup (not started)

- Remove or quarantine dead: `generalChat.js`, `general/workflow.js`, unused `AtlasExecution` / `execution_requested` branch
- Decide fate of thin `GeneralConversation` / `runAction` layers
- Clarify naming: one “workflow” story (`requests/workflow.js`)
- Do not merge `operationContext` / `masterContext` into this cleanup

**Status:** Inspection only. No code changes from this doc yet.



---

# Source: `feature_clean_cloudpilotintelligence_folder.md`

# Feature: Clean `cloudPilotIntelligence/` folder

**Status:** Future — deferred from current (2026-09-23). Architecture ideas only. **Do not code / do not add or rename folders yet.**

Goal: make Intelligence a **service CloudPilot calls**, not a second application.

Package identity:

> CloudPilot Intelligence provides reasoning and language transformations that CloudPilot can perform using internal logic, OpenAI, or other intelligence providers. It does not own application workflow or AWS execution.

Related: `feature_clean_cloudpilot_folder.md` (application/orchestration mess).  
Scan conversation product work: `feature_better_chat.md`.

---

## Locked boundary

| Package | Owns |
| --- | --- |
| **`cloudPilot/`** | Application turn: decide, request state, permissions/capabilities, execute/retrieve, product workflow |
| **`cloudPilotIntelligence/`** | Thinking / language **services**: understand, improve, respond (+ shared context infrastructure) |

Intelligence does **not** decide whether an EC2 instance should be paused or whether a scan should run. CloudPilot does.

```text
CloudPilot = orchestrator
CloudPilot Intelligence = service CloudPilot asks when it needs intelligence
```

Conceptual front door (aspirational API shape — not implemented):

```js
CloudPilotIntelligence.understand(message, context)
CloudPilotIntelligence.improve(data, context)
CloudPilotIntelligence.respond(context)
```

**Rule going forward (anti-sprawl):**

> Prefer a small number of general-purpose functions and existing folders. Do not create a new file, folder, class, or specialized function merely because a new use case has a different name. Split only when the implementation or responsibility is materially different.

Start general. Split only when two uses actually need meaningfully different behavior.

---

## Three intelligence operations (meaningful verbs)

These are different jobs. Do not collapse them into one “AI chat” folder.

### `understand` — human language → structured meaning

Input is ambiguous user text:

```text
"yeah do that one in Oregon"
```

Output is structured meaning:

```js
{ confirmation: true, region: "us-west-2" }
```

Today this mostly lives under `understand/` (action, region, values, questions, …).

### `improve` — existing content → clearer content (same facts)

**One general operation** — not a folder of subtype files:

```js
CloudPilotIntelligence.improve(data, context)
```

```text
INPUT: whatever CloudPilot wants improved
+ CONTEXT / INSTRUCTION: what "better" means here
        ↓
CloudPilot Intelligence
        ↓
OUTPUT: improved version (same facts)
```

Same function, different goals via context — e.g.:

```js
improve(rule, { goal: "Make this understandable to a developer" });
improve(awsFinding, { goal: "Make this concise and explain the important risk" });
improve(documentation, { goal: "Easier for a new engineer" });
```

Do **not** start with:

```text
improve/improveFinding.js
improve/improveRule.js
improve/improveTechnicalMessage.js
…
```

unless those later need materially different implementation. Concept OK; empty `improve/` folder OK; no subtype sprawl until a real call site exists.

### `respond` — grounded context/results → user-facing message

```js
CloudPilotIntelligence.respond(context)
```

CloudPilot already understood, decided, and optionally acted/retrieved. Now it has question + state + findings (+ capabilities/history as needed) and asks: **what should I say?**

Today this mostly lives under `conversation/` (`generateGeneralMessageReply`, `generateRequestMessageReply`). Eventual rename target: `respond/`.

### How callers should think about Intelligence

CloudPilot should **not** have to know:

```text
run OpenAI region classifier
then internal action matcher
then OpenAI response generator
```

It asks Intelligence to **understand**, **improve**, or **respond**. The Intelligence implementation decides Internal vs OpenAI vs several small checks underneath.

`understand` may still keep specialized extractors **internally** (region/action/values) where deterministic behavior differs — but callers should prefer one `understand(message, context)` entry over a zoo of public APIs.

---

## What I would *not* keep as top-level ops (for now)

| Placeholder | Why defer |
| --- | --- |
| **`generate/`** | Fuzzy — respond and improve both “generate.” Only add when there is a concrete product verb (generate Terraform / CLI / docs / remediation plan). |
| **`explain/`** | Often just `improve` (“rewrite clearly”) or a later product distinction: improve = clearer wording, explain = why it matters. Wait until the product needs both. |

Do not organize today’s code around hypothetical folders.

---

## The whole turn (not a context phase)

**Handoff rule:** `understand/` returns meaning to CloudPilot. Intelligence does **not** jump from understanding into S3/EC2 retrieval or execution. CloudPilot fulfills; then may ask Intelligence to `respond` (or `improve`).

```text
User: "What S3 buckets do I have?"
              │
              ▼
       CloudPilot receives turn
              │
              ▼
CloudPilotIntelligence.understand(...)
              │
              ▼
        UNDERSTAND → "They need S3 inventory"
              │
              ▼
     RETURN TO CLOUDPILOT
              │
              ▼
      CloudPilot DECIDE → "I can retrieve this"
              │
              ▼
         FULFILL → Scan S3 / Atlas
              │
              ▼
         S3 DATA RETURNS
              │
              ▼
CloudPilotIntelligence.respond(...)
              │
              ▼
            USER
```

Whole-system stages:

```text
UNDERSTAND → DECIDE → FULFILL → RESPOND
```

| Stage | Owner | Job |
| --- | --- | --- |
| **UNDERSTAND** | Intelligence | Human language → structured meaning |
| **DECIDE** | CloudPilot | What does this understanding require? |
| **FULFILL** | CloudPilot | Make it true: retrieve, start/continue/execute request, or do nothing |
| **RESPOND** | Intelligence (when needed) | Say it to the user from grounded results |
| **IMPROVE** | Intelligence (optional) | Refine existing content/facts before or while responding |
| **CONTEXT** | Intelligence infrastructure | What each Intelligence call needs — not a turn stage |

**FULFILL** is preferred over “ACTION” at the turn level: answering “What S3 buckets do I have?” is fulfillment via retrieve, not the same kind of “action” as “Pause my EC2.”

Do **not** add a `fulfill/` folder (or `decide/` / `action/` / `retrieve/` inside Intelligence). **FULFILL is a mental name** for what existing `scans/`, `execution/`, and `executionModes/` already do. Architecture-driven folder creation is what we are avoiding.

### FULFILL: information vs remediation

Separate **what** needs fulfilling from **how** it gets fulfilled.

```text
WHAT                          HOW
pause_ec2                     automatic | cli | pr | instructions
retrieve S3 inventory         scan_s3 → Atlas   (not a remediation mode)
```

The four remediation / execution modes are **not** Intelligence types. They are four ways CloudPilot can fulfill a remediation decision:

```text
1. Instructions
2. CLI
3. PR
4. Automatic
```

```text
                    FULFILL
                       │
           ┌───────────┴───────────┐
           │                       │
      INFORMATION              REMEDIATION
           │                       │
       Scan / Get             Execution Mode
       Atlas / AWS                 │
                            ┌──────┼──────┬──────┐
                            ▼      ▼      ▼      ▼
                          Instr   CLI     PR    Auto
```

This matches existing `executionModes/` (and informational `scans/`). Master registry = actions (WHAT) + execution modes (HOW for remediations).

```text
USER
 │
 ▼
UNDERSTAND   Intelligence
 │
 ▼
DECIDE       CloudPilot
 │
 ▼
FULFILL      CloudPilot
 │
 ├── Need information? → Scan / Atlas / AWS
 └── Need remediation? → Instructions | CLI | PR | Automatic
 │
 ▼
RESPOND      Intelligence
 │
 ▼
USER
```

Examples:

| Mode | After DECIDE pause_ec2 | FULFILL | RESPOND |
| --- | --- | --- | --- |
| Automatic | mode = automatic | `executionModes/automatic` → runAction → pause handler → Atlas | “i-123 has been paused.” |
| CLI | mode = CLI | `executionModes/cli` → command text (no AWS change) | present the command |
| PR | mode = PR | open proposed infra change | “Here’s the PR…” |
| Instructions | mode = instructions | walkthrough | present steps |

Informational (“What S3 buckets do I have?”): FULFILL via scan/get — no remediation mode.

### `processMessage` as conductor (mental model — not a rewrite)

Today: `cloudPilot/chat/cloudPilotMessageFunctions.js` → `processMessage`.

Conceptual shape:

```js
async function processMessage(message) {
    // 1. What does the user mean?
    const understanding =
        await CloudPilotIntelligence.understand(message, state);

    // 2. CloudPilot decides what that understanding requires
    const decision =
        decideNextStep(understanding, state);

    // 3. CloudPilot fulfills it
    const result =
        await fulfillDecision(decision);

    // 4. Intelligence helps communicate the grounded result
    return CloudPilotIntelligence.respond({
        message,
        understanding,
        decision,
        result
    });
}
```

Not necessarily that exact code — **that mental model**.

`fulfillDecision` might mean:

```text
ANSWER_GENERAL     → nothing to retrieve
GET_S3_DATA        → S3 handler → Atlas
GET_EC2_DATA       → EC2 handler → Atlas
START_REQUEST      → requests/
CONTINUE_REQUEST   → requests/
EXECUTE_REQUEST    → execution/
```

```text
                    cloudPilot/
                        │ owns turn
                        ▼
                ┌── UNDERSTAND ──┐
                │  Intelligence  │
                └───────┬────────┘
                        │ returns meaning
                        ▼
                ┌───── DECIDE ─────┐
                │    CloudPilot    │
                └────────┬─────────┘
                         │
                         ▼
                ┌──── FULFILL ─────┐
                │    CloudPilot    │
                │ scan / action /  │
                │ request / answer │
                └────────┬─────────┘
                         │ real result
                         ▼
                ┌──── RESPOND ─────┐
                │   Intelligence   │
                └────────┬─────────┘
                         ▼
                        USER
```

So Intelligence’s top-level stays complete as:

```text
understand/ | improve/ | respond/ | context/ | CloudPilotIntelligence.js
```

The “missing piece” is not another Intelligence folder — it is a clear **handoff** inside the CloudPilot turn orchestrator.

**Context is not a pipeline stage** between Decide and Fulfill.

---

## Context = shared infrastructure for Intelligence calls

```text
                 CloudPilotIntelligence
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      UNDERSTAND       IMPROVE        RESPOND
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                       CONTEXT
                 "What does THIS call need?"
                         │
                  ┌──────┴──────┐
                  ▼             ▼
              Internal        OpenAI / future
```

Not every call needs every ingredient:

| Call | Typical needs |
| --- | --- |
| `understandRegion` | Current Question; maybe slim Current State |
| `improveFinding` | Original finding; maybe Capabilities; not History |
| `respond` (final) | Identity, Capabilities, Current State, Question, History, real findings |

### Where recipes (`masterContext`) belong

Prefer recipes **inside `context/`**, not as a sibling “capability” next to understand/improve/respond:

```text
context/
├── contextTypes/          WHAT each ingredient contains
├── masterContext/         WHICH ingredients THIS call gets (recipes) — only when needed
├── operationContext/      specialized search task payloads (while still needed)
├── buildContext.js
└── buildSystemMessage.js
```

**Same anti-sprawl rule for recipes:** do not auto-create `masterRegionContext`, `masterActionContext`, `masterFinalContext`, … just because calls *can* differ. Start with a **general** context-building mechanism (`buildAIContext` + options). Introduce a specialized recipe file only when requirements diverge enough to justify one.

Today `masterFinalResponseContext.js` already exists at Intelligence root — leave it; do not proliferate siblings until Scan chat is stable and a second recipe is clearly needed. Preference remains: recipes live under `context/` eventually, not as a fourth intelligence verb.

---

## Target Intelligence top-level (aspirational — not a rename sprint)

```text
cloudPilotIntelligence/

├── understand/              Human language → structured meaning
├── improve/                 Existing facts → clearer form (when we have a call site)
├── respond/                 Grounded package → user message  (today: conversation/)
├── context/                 Shared assemble/render + recipes (when justified)
└── CloudPilotIntelligence.js
```

Those folders should **not** automatically fill with specialized functions. Complexity stays underneath only where behavior is materially different.

Today:

- `conversation/` ≈ future `respond/`
- `improve/` empty — concept OK; one general `improve(data, context)` when first needed
- `explain/`, `generate/` — remove or leave empty; do not fill

Do **not** put DECIDE or ACTION/execution inside Intelligence — those stay in `cloudPilot/`.

---

## CloudPilot application (against this model)

```text
cloudPilot/
├── masterCloudPilotCapabilities.js   What am I allowed / capable of?
├── chat/                             Own the overall user-message turn
├── requests/                         Decide / manage persistent request workflow
├── execution/ + executionModes/      Execute approved work / how to deliver it
├── scans/                            Read AWS / gather information
├── actions/                          Change AWS
└── supporting data…                  history, pricing, knowledge, questions speak…
```

---

## Decide vocabulary (replace “Request vs General Chat” as the only fork)

Ask: **What does this message REQUIRE CloudPilot to do?**

| | Meaning | Today’s rough label |
| --- | --- | --- |
| **A** | Continue / change / cancel existing request | Request conversation |
| **B** | Start a new request | Request conversation |
| **C** | Retrieve information and answer | Often mislabeled “general” or forced through scan request |
| **D** | Answer without taking / retrieving CloudPilot data | True “general chat” |

Examples:

- “What tags does my S3 bucket have?” → **C** (retrieve), not D  
- “What is an S3 bucket?” → **D**  
- “Scan my S3 buckets” → **B** then confirm → execute  
- “yes” (with open scan waiting) → **A** → execute  

AI helps understand; **CloudPilot** checks capabilities and invokes handlers. AI does not secretly run AWS.

---

## Example flows (conceptual)

### “What tags does my S3 bucket have?”

```text
CloudPilot receives message
  → Intelligence UNDERSTAND
  → { intent: question, subject: s3, requestedFact: tags }
  → CloudPilot DECIDE (capabilities allow tags)
  → CloudPilot GET (S3 path → Atlas → AWS)
  → optional Intelligence IMPROVE on raw finding text
  → CloudPilot RESPOND (Intelligence may help wording with real findings)
  → "Bucket X has these tags…"
```

### “Scan my S3 buckets” → “yes”

```text
UNDERSTAND → scan_s3 action
CloudPilot DECIDE → create/update request, need confirmation
RESPOND → "Ready to scan. Run it?"

UNDERSTAND → confirmation
CloudPilot DECIDE using Current State
EXECUTE → Atlas
RESPOND with real result
```

---

## What went wrong recently (for cleanup mindset)

- Architecture layers and recipes were added while Scan conversation was still fragile  
- Extra folders / concepts ahead of working MVP made the turn hard to follow  
- Prefer: **small fixes that restore a clear UNDERSTAND → DECIDE → FULFILL → RESPOND path** before more Intelligence architecture  

`masterFinalResponseContext` / Capabilities projection may stay as-is if they work; **stop expanding** recipes and folder renames until chat turns are reliable again.

---

## Cleanup principles (when we touch code later)

1. **Start general; split only when behavior is materially different**  
2. Do not create `generate/` / `explain/` structure until product needs them  
3. `improve` = one general op + goal in context — not improveFinding/improveRule files  
4. Do not move decide/execute into Intelligence  
5. Context (+ recipes) stay shared Intelligence infrastructure; add recipe files sparingly  
6. Prefer deleting dead placeholders over adding symmetry stubs  
7. Small changes that make the live path readable beat large refactors  

**Next:** Stabilize Scan S3 / Scan EC2 conversation with the smallest possible fixes. Use this doc as the north star — not a build ticket to reorganize everything now.



---

# Source: `feature_code_reorganize.md`

# Feature Code Reorganize — moved

This future spec was **brought into current** as Important Fixes, now finished: [feature_important_fixes.md](../finished/feature_important_fixes.md).

Do not start work from this file. Use the finished feature (and [Message Reply Follow-ups](./feature_message_reply_followups.md) for leftovers).

**Codename (old):** `feature_code_reorganize`  
**Now:** `feature_important_fixes` (finished)



---

# Source: `feature_github_pull_requests.md`

# GitHub Pull Requests

## What this does

CloudPilot creates a safe GitHub pull request for a proposed infrastructure change instead of changing AWS directly.

## Current step

**Moved to future** — Implementation Steps 0–6 are largely ✅ (2026-07-19).
**Step 7 — Manual E2E** checklist remains open (also Step 5 “end-to-end from chat”
unchecked). Not active demo work right now.

## Next

When picked up again: complete **Step 7** pass checklist (chat → real PR → link;
no AWS from PR path), then archive to `finished/`.

**Status:** Future — deferred Step 7 E2E  
**Related:** [Current Development](../current/current_development.md) · [CloudPilot MVP](../feature_mvp.md) · [Archived EC2 operate MVP](./feature_mvp_ec2_operating_boundary.md) · [MVP plan](./mvp.md) · [Remediations](./remediations.md) · [Future work](./future.md)

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

Run **Step 7** manual E2E (reset base to `primary`, chat → Pull Request → verify GitHub + chat). Archive when that checklist passes.



---

# Source: `future_services.md`

# Future services — integrations (post-MVP)

**Status:** Deferred — not MVP scope  
**Last updated:** 2026-09-05  

> Canonical MVP stays **EC2 + S3** only: [feature_mvp.md](../feature_mvp.md).  
> Do not expand CloudPilot into these integrations until the MVP demo loop is reliable.

These are **adjacent product surfaces** (where engineers already work), not additional AWS resource types.

---

## Priority order

| Order  | Service                             | Why it matters to CloudPilot                                         |
| ------ | ----------------------------------- | -------------------------------------------------------------------- |
| **1**  | **Slack**                           | Bring CloudPilot to where engineers already communicate              |
| **2**  | **Jira**                            | Turn findings/problems into trackable work                           |
| **3**  | **GitHub**                          | Connect infrastructure findings to IaC, PRs, deployments and changes |
| **4**  | **Datadog**                         | Give CloudPilot much better operational/observability context        |
| **5**  | **PagerDuty**                       | Connect incidents to infrastructure diagnosis and response           |
| **6**  | **Confluence**                      | Give CloudPilot company-specific infrastructure knowledge/runbooks   |
| **7**  | **Splunk**                          | Expand troubleshooting through logs/security/operational data        |
| **8**  | **Microsoft Teams**                 | Similar value to Slack, important for larger enterprises             |
| **9**  | **ServiceNow**                      | Very valuable once you're selling into larger enterprises            |
| **10** | **Terraform Cloud / HCP Terraform** | Deeper infrastructure-change workflow                                |

---

## Related

- GitHub PR demo (prebuilt / deferred): [feature_github_pull_requests.md](./feature_github_pull_requests.md)
- Future index: [future.md](./future.md)



---

# Source: `updatingChatMyFindings.js`

/*
Open Requests Search correctly identifies that you're asking about requests.
Action Search runs afterward even though it isn't needed and returns {}.
*/
