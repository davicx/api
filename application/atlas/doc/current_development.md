# Current Development

**Last reviewed:** 2026-06-11

> Read [architecture.md](./architecture.md) first. Done: [finished_development.md](./finished_development.md). Later: [future_development.md](./future_development.md).

---

## Kite

- [ ] Send `conversationID` on every message
- [ ] Render `CloudPilotActionStatus` (status, missing, collected, request id, displayName)
- [ ] Render `navigatorResponse` (stats / tables from scan + inventory)
- [ ] Open actions dashboard table _(blocked on API P3C)_

### Kite integration — details

**Goal:** Connect Kite to `POST /message` and render CloudPilot + Navigator payloads.

| Task | Notes |
|------|-------|
| `conversationID` | Required for request scope — must be on every message |
| `CloudPilotActionStatus` | Surface open request state from API (`workflowId` in API today) |
| `navigatorResponse` | Generic renderer exists; wire to live message responses |
| Open actions table | Blocked until API emits `open_actions` Navigator table (P3C) |
| React Query cache | Later — `["navigator-data", groupID, conversationID]` |

---

## API

- [ ] **Field hardening P0** — EC2 ID, region, instance_type, malformed syntax + parser tests
- [ ] Test-mode smoke — create / toggle / delete / scan with Atlas Test imports
- [ ] `scan_ec2` `atlas_unreachable` parity (mutations already handle; scan may throw)
- [ ] Manual error smoke — Atlas stopped → friendly message, API stays up
- [ ] **P3C** — `open_actions` Navigator table in API response
- [ ] D2 — `cancelRequest` fully wired in `applyDecision` _(verify / finish)_
- [ ] Schema migration — `cloudpilot_actions` + `cloudpilot_requests` + `cloudpilot_executions`
- [ ] `functions/` folder restructure (requests / executions / navigator)
- [ ] Policy on routes (`allowed`, `reasonNotAllowed`)

### Field hardening P0 — details

**Priority:** Do before new actions (`resize_ec2`, etc.).

**Bug exposed in toggle E2E:** Unclosed quote in `primary_instance_id: "i-mistake` produced garbage ID (`i-mistake secondary_instance_id:`) that reached Atlas.

| # | Task | Notes |
|---|------|-------|
| 1 | EC2 instance ID validation | Reject before confirm: `^i-[0-9a-f]+$`; friendly re-prompt |
| 2 | Region validation | Allowlist or `^[a-z]{2}-[a-z]+-\d+$` |
| 3 | Instance type validation | Create flow — pattern or allowlist |
| 4 | Malformed field syntax | Unclosed quotes, broken `field: "value"` — do not merge into `collected` |
| 5 | Parser unit tests | Malformed quote; valid recovery; invalid ID; state preserved |
| 6 | Implicit bare ID mapping | **Deferred** — second bare `"i-…"` → `secondary_instance_id` works but is opaque; later confirm prompt |

**Likely touch points:** `understanding/search/`, field merge in decision/requests, optional `fieldValidators.js`.

**Exit criteria:** Invalid IDs cannot reach `4` / `yes` or Atlas; 4–6 tests cover malformed-quote regression.

**Keep working:** Missing-field recovery after bad input; request replacement after failure; one open request per conversation.

### Test-mode & error smoke — details

| Test | Expect |
|------|--------|
| Atlas Test imports + chat create/toggle/delete/scan | Success paths; Atlas logs `(TEST MOCK)` |
| Atlas stopped + mutation | `atlas_unreachable` message; API does not crash |
| Bad instance ID (after P0) | Rejected at field layer, not at Atlas |

### Requests & chat UX — details

| Task | Notes |
|------|-------|
| P3C open_actions table | `navigatorResponse` table: display_name, action_type, status, missing, run |
| Schema migration | See `database.md` |
| Restart mid-flow | Verify DB source of truth after `display_name` fix |
| `ActionState.js` memory mode | Gate to tests only; remove Map when green |
| `inventory_aws` request row | Decide if informational inventory needs persisted row |

**England rule (keep):** bare `4` and bare `yes` target focused request; prompts include quoted `display_name`.

### `functions/` restructure — details

Move per [architecture.md](./architecture.md) target layout — one PR per area (requests → executions → navigator). Do not rename symbols repo-wide in one pass.

---

## Atlas

- [ ] Test-mode smoke — confirm `(TEST MOCK)` logs on create / toggle / delete / scan
- [ ] Optional — capture live `MOCK_CREATE_DATA` (placeholder shape is sufficient for Test)
- [ ] Optional — add `Atlas Response:` log on live `POST /ec2/create` (toggle/delete have it)

### Atlas Test mode smoke — details

**Prerequisites:** `main.py` Test imports active; restart uvicorn.

| Route | Confirm |
|-------|---------|
| `POST /ec2/toggle` | Returns captured `MOCK_TOGGLE_DATA`; log shows `(TEST MOCK)` |
| `POST /ec2/delete` | Returns captured `MOCK_DELETE_DATA` |
| `POST /ec2/create` | Returns `MOCK_CREATE_DATA` placeholder |
| `POST /scan/ec2` | Returns `MOCK_SCAN_EC2_DATA` |

No AWS calls in Test mode. Flip Live imports in `main.py` when real mutations needed again.
