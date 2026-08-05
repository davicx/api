# Finished

**Last reviewed:** 2026-08-04

> **Active work:** [Current Development](../current/current_development.md) · **To do:** [to_do.md](../future/to_do.md) · **Architecture:** [architecture/](../architecture/)

---

## Recently finished (2026-08-04)

- [x] **Intelligence Front Door** — GenAI via `CloudPilotIntelligence.chat()` — [feature_intelligence_front_door.md](./feature_intelligence_front_door.md)
- [x] **OpenAI Logs** — per-capability blocks after pipeline STEPs — [feature_openai_logs.md](./feature_openai_logs.md)

---

## CloudPilot folder organization (2026-08)

### Project A — responsibility folders

- [x] `conversation/` → `chat/`
- [x] `decision/` → `requests/`
- [x] `changes/` → `remediations/` (temporary name)
- [x] scans / billing / inventory / aiUsage under read-only tree
- [x] navigator helper → `chat/presentation/`
- [x] Docs + empty-folder cleanup
- Detail: [cloud_pilot_refactor.md](./cloud_pilot_refactor.md)
- Related superseded drafts: [responsibility_refactor.md](./responsibility_refactor.md) · [project_structure_plan.md](./project_structure_plan.md)

### Project C — actions + execution modes

- [x] Mutation handlers → `actions/`
- [x] Automatic / CLI / Instructions / PR → `executionModes/`
- [x] Delete empty `remediations/`
- [x] Style pass: `FUNCTIONS` TOC + `//STEP` inside mode logic files
- Detail: [cloud_pilot_project_c.md](./cloud_pilot_project_c.md)

### Project B — Intelligence facade

- [x] `CloudPilotIntelligence.js` facade entry
- [x] Move `chat/understand/**` → `cloudPilotIntelligence/understand/**`
- [x] STEP 3 calls `CloudPilotIntelligence.understandMessage`
- [x] Internal / OpenAI region selection preserved inside Intelligence
- [x] `respond` / `explain` / `improve` / `generate` remain placeholders
- Detail: [cloud_pilot_project_b.md](./cloud_pilot_project_b.md)

### AI Invocation Rules (2026-08)

- [x] Philosophy: only expensive AI work when that function is needed
- [x] Design rule: **Should I run?** then **How should I run?** (Internal | OpenAI)
- [x] Phase 1 — `shouldRunRegionSearch()` (open request + region missing)
- [x] Phase 2 — Region Search verified with OpenAI ENV off (Internal)
- [x] Phase 3 — General Chat verified with OpenAI ENV off (Internal)
- [x] Phase 4 — Capabilities `shouldRespondCapabilities` + Internal / OpenAI path (ENV off)
- Detail: [cloud_pilot_openai_rollout.md](./cloud_pilot_openai_rollout.md)

---

## Checklist — work done

### Message architecture (2026-06)

- [x] Phase 1 — General / Request Conversation fork in orchestrator; General skips STEPS 5–6
- [x] Phase 2 — Retire `responses/`; speak logic in `conversation/`
- [x] Phase 3 — `conversation/request/workflow.js` (`store` / `execute`)
- [x] Phase 3b — `change/strategies/` (instructions, CLI, PR, automatic)
- [x] Phase 4 — `CloudPilotMessage.js`; retire `chat/` folder
- [x] `GeneralConversation.js` / `RequestConversation.js` rename
- [x] `engines/llm/openai/` — OpenAI SDK home
- [x] `executions/outcomes/outcomeRegistry.js` — handler outcome copy
- [x] Request vs change vs strategy vocabulary documented — [architecture/code_cleanup.md](../architecture/code_cleanup.md)

### Kite

- [x] Generic Navigator renderer (client) — stats, tables, columns, alerts
- [x] Foundation to display `navigatorResponse` from API (scan + inventory payloads)

### API — pipeline (`processMessage` STEP 1–7)

- [x] Full loop: **Understand → Decide → Persist → Execute → Respond**
- [x] STEP 1–7 wired in `cloudPilotMessageFunctions.js`
- [x] Node always calls Atlas HTTP — no Node-side mock execution
- [x] General chat routing when idle
- [x] Failed execution → friendly outcome; conversation continues
- [x] New request replaces failed / completed open request (one open per conversation)

### API — understanding (STEP 3)

- [x] `understandMessage` + all `searchMessageFor*` extractors
- [x] Action, region, instance IDs, name, instance_type, structured fields
- [x] Reply (confirm, cancel, modes 1–4)
- [x] Conversation (list_open, status, focus_switch)
- [x] Ambiguous action detection

### API — decision & requests (STEP 4–5)

- [x] `decideNextStep` — chatType + response types
- [x] `applyDecision` — start / update / skip (+ finish on success path)
- [x] Destructive tier: execution mode `4` → confirm → execute
- [x] Informational tier: confirm → execute (scan; inventory immediate)

### API — execution & speak (STEP 6–7)

- [x] `executeRequest` → `actionMap` handlers → Atlas
- [x] Request speak via `RequestConversation` → `CloudPilotMessage`
- [x] `scan_ec2`, `inventory_aws`, `general_chat`
- [x] `create_ec2`, `delete_ec2`, `toggle_ec2` handlers (automatic mode → Atlas)

### API — EC2 mutations (live E2E)

- [x] Create — fields → `4` → `yes` → instance created
- [x] Toggle — live AWS stop/start through pipeline
- [x] Delete — termination through pipeline
- [x] Cross-action sequence — create → toggle → delete on test instances
- [x] Not-found outcomes — friendly messages, API stays up

### API — requests & database

- [x] Durable request rows in MySQL + `Request.js`
- [x] `display_name` from registry `actionLabel`
- [x] Statuses: `waiting_on_fields`, `waiting_on_execution_mode`, `waiting_on_confirmation`, `running`, terminal
- [x] MySQL default (`CLOUDPILOT_STATE_BACKEND=mysql`)
- [x] Focused request tracking (P2C)
- [x] England-rule copy in request templates (P3A)
- [x] Open-actions list + focus switch (P3B)
- [x] `services/` folder restructure (requests / history / executions / navigator / conversation)

### API — change history & undo (MVP — 2026-07)

- [x] **H0** — `cloudpilot_history` in `master_sql.sql`
- [x] **H1** — `saveHistory()` after toggle automatic success (`STEP 6B`)
- [x] **H2** — `getLatestUndoable()` log after save (`STEP 6C`)
- [x] **H3** — Undo intent dry run _(superseded by H4)_
- [x] **H4** — Execute undo + link rows (`undoRegistry`, `undoFunctions`, STEP 6)
- [x] **H5** — Failed toggle → history row (`failed`, `undo_available = 0`)
- [x] **H6** — API `undoAvailable` hint on `POST /message` response
- [x] **H7** — `create_ec2` history + undo (delete created instance)
- [x] **H9** — `History.listRecentHistoryByConversation()` (limit 5)
- [x] **H10** — Understanding — `list_history` phrases
- [x] **H12** — `decideNextStep` — `LIST_HISTORY` conversation command
- [x] **H13** — Speak — chat message + Navigator table (`buildHistoryResponse`)
- [x] **H14** — History Navigator table — **Change** column, Resource, Status, Undo, When
- [x] Request/history naming — `action_display_name`, `action_record_key`, optional `request_name`
- [x] Atlas — reuse toggle with swapped targets from `undo_payload`
- [x] Atlas — `restore_ec2_tag` undo path

**Phase T — Tag discovery (dashboard)**

- [x] **T1** — Scan model includes `tags[]` on each instance
- [x] **T2** — Tags count column (clickable)
- [x] **T3** — Click → Tag Key | Value | Actions via `buildKeyValueTable`

**Phase G — Golden path `update_ec2_tag`**

- [x] **G1–G9** — action, fields, Atlas tag read/write/delete, `ec2History.js`, undo, E2E verified

**Kite — History dashboard (2026-07)**

- [x] Dashboard renders History table from `navigatorResponse`
- [x] **Change** timeline copy (not Action Name)
- [x] Resource truncation + `resource_full` hover
- [x] **Undo** button — newest undoable row only (stack undo; calls chat `undo`)
- [x] `chatContext` in `AtlasFindingsContext` for dashboard undo

**Deferred:** [future_work.md](../future/future.md) (H8, H11, H15+, tag polish, targeted undo).

### API — Billing (Phase B1 — 2026-07)

- [x] `show_billing` — Cost Explorer by service (`ce:GetCostAndUsage`)
- [x] `capabilities/billing/getBillingSummary.js` + `billingAWS/` handler, message, navigator
- [x] Atlas `POST /billing/summary` + test mock route

See [billing.md](../future/billing.md).

### API — scan (EC2 + S3 demo)

See [scans.md](../future/scans.md) for MVP plan and service order.

### API — Navigator contract

- [x] `navigatorResponseFunctions.js`
- [x] `inventory_aws` + `scan_ec2` Navigator adapters
- [x] Opt-in `raw` on read adapters

### API — error & outcome handling

- [x] `messages.js` — failed remediation does not crash API
- [x] Atlas toggle/delete preflight → structured envelope
- [x] `atlasEC2Functions.fetchAtlasMutation` — no throw on `success: false`
- [x] `outcomeRegistry` — friendly messages with `{instance_id}`, `{region}`, etc.
- [x] Orchestration guards — repeat intent, failed request, null events

### API — field extractors & action map

- [x] `create_ec2`, `delete_ec2`, `toggle_ec2` in `actionMap.js`
- [x] Field extractors: region, name, instance_type, instance_id, primary/secondary IDs
- [x] Instance-id heuristic (one bare `i-…` per message)

### API — scan (S3 demo tier)

- [x] `core/cloud/s3/scanner.py` + 3 rules
- [x] `POST /scan/s3` + `s3_scan_service.py`
- [x] API: `scan_s3` action + Navigator adapter
- [x] `MOCK_SCAN_S3_DATA` (test routes)
- [x] `s3_public_access_block_disabled`, `s3_default_encryption_off`, `s3_no_lifecycle_policy`
- [x] DB seed — `scan_s3` in `cloudpilot_actions`

### API — scan (EC2 demo v1 — partial)

- [x] Five EC2 rules wired: low CPU, missing name tag, stopped instance, legacy type, public IP

---

## Atlas — done

### Live routes & AWS

- [x] `POST /ec2/create` — `create_instance` (boto3)
- [x] `POST /ec2/toggle` — stop primary, start secondary, waiters
- [x] `POST /ec2/delete` — terminate with preflight
- [x] `POST /scan/ec2` — full scan + findings
- [x] Preflight errors → `success: false` envelope (not HTTP 500)

### Test routes & mocks

- [x] Test route package `api/routes/test/`
- [x] `MOCK_SCAN_EC2_DATA` — captured from live scan
- [x] `MOCK_TOGGLE_DATA` — captured from live toggle
- [x] `MOCK_DELETE_DATA` — captured from live delete
- [x] `MOCK_CREATE_DATA` — placeholder (valid shape)
- [x] `main.py` Live ↔ Test import toggle documented

### Capture logging (Live)

- [x] `Atlas Response:` log on successful toggle
- [x] `Atlas Response:` log on successful delete

---

## Notes

Older pipeline rebuild history and doc changelog: [architecture/appendix.md](../architecture/appendix.md).
