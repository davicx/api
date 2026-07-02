# To Do

**Last reviewed:** 2026-06-27

> **Active work:** [history.md](./history.md) (Phase 1B H8, Kite undo) · **[remediations.md](./remediations.md)** (Mode 3 — Pull Request strategy)  
> **Done:** [finished.md](./finished.md) · **Architecture & reference:** [architecture/](./architecture/)

---

## Checklist (in order)

### Current

All active API work is **history Phase 1B** — see **[history.md](./history.md)**. **PR remediations (mode 3)** — see **[remediations.md](./remediations.md)**.

#### Remediations — PR delivery (phased — [remediations.md](./remediations.md))

- [x] Phase 0 — `cloudpilot_infrastructure` repo scaffold
- [x] Phase 1 — `config/github/githubClient.js`
- [x] Phase 2 script — `test/scripts/createDemoPullRequest.js`
- [ ] Phase 2 run — real PR on GitHub (stop here until demo works)
- [ ] Phase 3 — `cloudpilot-apply.yml` + `POST /github/apply` + Atlas
- [ ] Phase 4 — wire `change/strategies/pr.js` (`create_ec2` only)
- [ ] Phase 5 — history after PR apply
- [ ] Phase 6 — undo revert PR

### Future

#### Kite

- [ ] Send `conversationID` on every message
- [ ] Render `CloudPilotActionStatus` (status, missing, collected, request id, displayName)
- [ ] Render `navigatorResponse` (stats / tables from scan + inventory)
- [ ] Open actions dashboard table _(blocked on API P3C)_
- [ ] React Query cache for Navigator — `["navigator-data", groupID, conversationID]`
- [ ] Better column formatting (`currency`, `status` alignment)
- [ ] Opt-in developer `raw` mode (default off)
- [ ] Multi-open requests UI — table with **Run** per row; `run 1` disambiguation
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

- [ ] **Capability layer C1–C7** — [architecture/capability_migration.md](./architecture/capability_migration.md)
- [ ] **Step one cleanup U1–U3** — [architecture/step_one_cleanup.md](./architecture/step_one_cleanup.md)
- [ ] Code cleanup phases — dead comments, `functions.js` duplicates, historical `doc/code/` _(see Future details)_

#### API — product & platform

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

- [add_s3.md](./add_s3.md) — expand S3 rules (demo tier shipped)
- [add_rds.md](./add_rds.md) — RDS scanner + chat action
- [add_pipeline.md](./add_pipeline.md) — CodePipeline / CodeBuild scan

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

See **[history.md](./history.md)** — undo (H5–H8), Atlas metadata, Kite undo UI, and new chat commands for **recent history** and **recent requests** (H9–H14).

---

### Future

#### Kite integration

Connect Kite to `POST /message`. Required: `conversationID` on every message. Render `CloudPilotActionStatus`, `navigatorResponse`, and (when P3C ships) open actions table. Polish: React Query cache, column formatting, multi-open UI, mode indicator. History table UI: [history.md](./history.md) Phase 2–3.

#### API — field hardening P0

**Priority:** Before new actions (`resize_ec2`, etc.). Reject invalid EC2 IDs, regions, instance types, and malformed `field: "value"` syntax before confirm/Atlas. Parser unit tests for unclosed-quote regression.

**Touch points:** `understanding/search/`, decision/requests merge, optional `fieldValidators.js`.

#### API — capabilities & code cleanup

Standardize HOW layer under `capabilities/` (C1–C7). Pre-cleanup U1–U3 removes dead pipeline code. See [architecture/capability_migration.md](./architecture/capability_migration.md) and [architecture/step_one_cleanup.md](./architecture/step_one_cleanup.md).

#### API — Learn / Test / Live

Product modes: **Learn** (explain only), **Test** (mocks), **Live** (AWS). Today Test = Atlas `main.py` import toggle. Future: per-deployment mode, user-facing copy, Learn handlers without Atlas.

#### API — execution & requests

`cloudpilot_executions` audit table; multi-open requests; `operation_id`; long-running runs survive restart.

#### Scan expansion

**Principle:** EC2 complete → S3 → Security Groups → EBS → RDS → orchestration. Quality bar: plain-English title, severity, concrete recommendation. S3 demo tier largely shipped — see [finished.md](./finished.md). Per-service plans: [add_s3.md](./add_s3.md), [add_rds.md](./add_rds.md), [add_pipeline.md](./add_pipeline.md).

#### Atlas (future)

Tag-based toggle, delete safety gates, AMI hardening, waiters, API-driven Test mode.

#### Deprecated / rename (when ready)

- `atlas_actions` table — superseded by `cloudpilot_requests`
- `workflowId` → `requestId` rename pass in code identifiers
