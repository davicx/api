# Current Development

**Last reviewed:** 2026-06-09

> Read [architecture.md](./architecture.md) first. Done: [finished_development.md](./finished_development.md). Later: [future_development.md](./future_development.md). Undo: [development_undo_feature.md](./development_undo_feature.md).

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
- [x] `services/` folder restructure (requests / history / executions / navigator)
- [x] **Change History H1** — `saveHistory()` row after toggle automatic (`STEP 6B: HISTORY SAVED`)
- [x] **Change History H2** — `getLatestUndoable()` log after save (`STEP 6C`)
- [ ] **Capability layer C1–C7** — single entry points — [capability_migration.md](./capability_migration.md)
- [ ] **Step one cleanup U1–U3** — before capabilities — [step_one_cleanup.md](./step_one_cleanup.md)

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

Move per [architecture.md](./architecture.md) — **done** (`application/atlas/services/`). One PR per area for any future service additions.

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

---

## Scan expansion

**Principle:** Small → working → prove value → expand. Finish EC2 before touching another service.

**Quality bar:** 10 excellent findings beat 100 mediocre ones. Ship a rule only if you would show it on a 15-minute prospect call. Every finding needs plain-English title, severity, explanation, and a **concrete recommendation** (not remediation).

**Demo build order:**

```text
1. EC2 complete (6 rules)     ← validates full stack; copy this pattern later
2. S3 (3 rules)               ← visual, high wow
3. Security Groups (3 rules)  ← classic security scan
   ─── product already demos well ───
4. EBS
5. RDS
6. scan_aws orchestration     ← way later; thin layer over the five scanners
```

**Per-service chat actions (demo tier):** `scan_ec2` → `scan_s3` → `scan_security_groups` → `scan_ebs` → `scan_rds`. Defer umbrella `scan_aws` until each scanner is excellent standalone.

### EC2 — demo v1 (Phase 0)

**Today:** Scanner + rules engine + `POST /scan/ec2` + Navigator + `scan_ec2` chat action + mock mode. **Five rules wired**; snapshot rule deferred.

**Scanner:** `public_ip` / `has_public_ip` done. `volume_ids` deferred (`ec2_no_recent_snapshot` later).

| Rule | Status | Demo line |
|------|--------|-----------|
| `ec2_low_cpu` | [x] | Instance barely used — may be overpaying |
| `ec2_missing_name_tag` | [x] | Cannot tell what this server is for |
| `ec2_stopped_instance` | [x] | Stopped instances still costing storage |
| `ec2_legacy_instance_type` | [x] | Legacy instance type — worse price/performance |
| `ec2_public_ip_attached` | [x] | Instance exposed directly to the internet |
| `ec2_no_recent_snapshot` | deferred | Server has no recent backup — after S3 |

**Also:**

- [ ] `ec2_low_cpu` — only evaluate when `state == running`
- [ ] Register all rules in `rule_registry.py` (aliases per rule)
- [ ] Recommendation copy pass — title, description, severity, `recommendation.description`, `summary` per rule
- [ ] `MOCK_SCAN_EC2_DATA` — one clean sample finding per rule for Test mode demos
- [ ] Navigator findings table — optional **Rule** column from `metadata.rule_id` or `issue.code`

**Exit criteria:** Live scan in one region returns findings across all six rule types when the account has matching resources; Test mode demos without AWS.

### S3 — demo v1 (Phase 1)

- [x] `core/cloud/s3/scanner.py` + 3 rules
- [x] `POST /scan/s3` + `s3_scan_service.py`
- [x] API: `scan_s3` action + Navigator adapter
- [x] `MOCK_SCAN_S3_DATA` (test routes)
- [x] `s3_public_access_block_disabled`
- [x] `s3_default_encryption_off`
- [x] `s3_no_lifecycle_policy`
- [x] DB seed — `scan_s3` in `cloudpilot_actions` (`node test/scripts/ensure-cloudpilot-actions-seed.js`)

### Security Groups — demo v1 (Phase 2)

| Rule | Demo line |
|------|-----------|
| `sg_ssh_open_to_world` | SSH (22) open to the internet |
| `sg_rdp_open_to_world` | RDP (3389) open to the internet |
| `sg_db_port_open_to_world` | Database port open to the internet |

- [ ] `core/cloud/security_groups/` (or `ec2_network/`) scanner + rules
- [ ] `POST /scan/security-groups` + API `scan_security_groups` action

### Later — EBS, RDS, orchestration

**EBS v1:** `ebs_unattached_volume`, `ebs_old_snapshot`, `ebs_unencrypted_volume` (gp2→gp3 later).

**RDS v1:** `rds_publicly_accessible`, `rds_backups_disabled`, `rds_single_az_likely_production` (low CPU, old generation later).

**Deferred:** Lambda, CloudWatch Logs, ELB, IAM, CloudTrail — not needed for demo package.

### Finding quality checklist (every new rule)

| Field | Requirement |
|-------|-------------|
| `issue.title` | Short, plain English (~60 chars) |
| `issue.description` | 1–2 sentences — why it matters |
| `issue.severity` | Business impact — backup and public IP should feel urgent |
| `recommendation.description` | Concrete next step — not “review this resource” |
| `summary` | One sentence for a live demo |
| `metadata.rule_id` | Stable snake_case id |
| `cost` | When calculable; omit beats a fake number |

**Habit:** Write the demo sentence and recommendation **before** implementing detection logic.
