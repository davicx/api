# Finished Development

**Last reviewed:** 2026-06-11

> Read [architecture.md](./architecture.md) first.

---

## Kite

- [x] Generic Navigator renderer (client) — stats, tables, columns, alerts
- [x] Foundation to display `navigatorResponse` from API (scan + inventory payloads)

---

## API

### Pipeline (`processMessage` STEP 1–7)

- [x] Full loop: **Understand → Decide → Persist → Execute → Respond**
- [x] STEP 1–7 wired in `cloudPilotMessageFunctions.js`
- [x] Node always calls Atlas HTTP — no Node-side mock execution
- [x] General chat routing (`hi` → OpenAI) when idle
- [x] Failed execution → friendly outcome; conversation continues
- [x] New request replaces failed / completed open request (one open per conversation)

### Understanding (STEP 3)

- [x] `understandMessage` + all `searchMessageFor*` extractors
- [x] Action, region, instance IDs, name, instance_type, structured fields
- [x] Reply (confirm, cancel, modes 1–4)
- [x] Conversation (list_open, status, focus_switch)
- [x] Ambiguous action detection

### Decision & requests (STEP 4–5)

- [x] `decideNextStep` — chatType + response types
- [x] `applyDecision` — start / update / skip (+ finish on success path via `finishRequest`)
- [x] Destructive tier: execution mode `4` → confirm → execute
- [x] Informational tier: confirm → execute (scan, inventory immediate)

### Execution & handlers (STEP 6–7)

- [x] `executeRequest` → `actionMap` handlers → Atlas
- [x] `buildCloudPilotResponse` — success/failure chat copy
- [x] `scan_ec2`, `inventory_aws`, `general_chat`
- [x] `create_ec2`, `delete_ec2`, `toggle_ec2` handlers (automatic mode → Atlas)

### EC2 mutations — live E2E

- [x] Create — fields → `4` → `yes` → instance created
- [x] Toggle — live AWS stop/start through new pipeline
- [x] Delete — termination through new pipeline
- [x] Cross-action sequence — create → toggle → delete on test instances
- [x] Not-found outcomes — friendly messages, API stays up

### Requests & database

- [x] Durable request rows in MySQL + `Actions.js`
- [x] `display_name` from registry `actionLabel`
- [x] Statuses: `waiting_on_fields`, `waiting_on_execution_mode`, `waiting_on_confirmation`, `running`, terminal
- [x] MySQL default (`CLOUDPILOT_STATE_BACKEND=mysql`)
- [x] Focused request tracking (P2C)
- [x] England-rule copy in `CloudPilotChat.js` (P3A)
- [x] Open-actions list + focus switch (P3B)
- [x] Reads/writes via `Actions` + `getUsersActionState`

### Navigator (API contract)

- [x] `navigatorResponseFunctions.js`
- [x] `inventory_aws` + `scan_ec2` Navigator adapters
- [x] Opt-in `raw` on read adapters

### Error & outcome handling (code)

- [x] `messages.js` — failed remediation does not crash API
- [x] Atlas toggle/delete preflight → structured envelope
- [x] `atlasEC2Functions.fetchAtlasMutation` — no throw on `success: false`
- [x] `chatOutcomeRegistry` — friendly messages with `{instance_id}`, `{region}`, etc.
- [x] Orchestration guards — repeat intent, failed request, null events

### Field extractors & registry

- [x] `create_ec2`, `delete_ec2`, `toggle_ec2` in `actionMap.js`
- [x] Field extractors: region, name, instance_type, instance_id, primary/secondary IDs
- [x] Instance-id heuristic (one bare `i-…` per message)

---

## Atlas

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

- [x] `Atlas Response:` log on successful toggle (`ec2_operation_routes.py`)
- [x] `Atlas Response:` log on successful delete
