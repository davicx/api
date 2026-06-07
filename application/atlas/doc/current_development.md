# CloudPilot / Atlas — Current Development

**Purpose:** Single source of truth for what we are working on, what is done, and what is deferred.

**Last reviewed:** 2026-06-06

**Reference docs (not todo lists):**

| Topic | Path |
|-------|------|
| Add a new action | `doc/instructions/adding_new_action.md` |
| Atlas → Navigator mapping | `doc/instructions/converting_atlas_data.md` |
| Workflow SQL (CREATE / ALTER) | `doc/sql/cloudpilot_workflows_phase1.sql` |
| EC2 chat samples | `api/README.md` |
| Create tags / delete safety (future) | `api/doc/instructions/cloudpilot_tagging_metadata.md` |

---

## Architecture (read once)

Three layers — use these names in docs and code reviews:

```text
1. Action definition (static)     actionRegistry.js — scan_ec2, toggle_ec2, …
2. Workflow (user request)          cloudpilot_workflows row — collect fields, confirm, cancel, resume
3. Execution (actual work)        Atlas/AWS run — today updates workflow row; target: cloudpilot_executions
```

**Layering:**

```text
Atlas         = execution engine (AWS mutations)
Navigator/API = orchestration + workflow + UI shaping
Kite          = generic renderer
```

**Phase 1 workflow policy:** one open workflow per `conversation_id` (`is_open = 1`). History stays as closed rows.

**Naming:** `action_type` = machine key (`toggle_ec2`). `display_name` = human label ("Toggle EC2 Lab Environment"). Defer `action_name` slug until multi-open.

---

## 1) Current Development

### A. Workflow & chat UX

**Goal:** Durable workflows, conversational confirm, open-actions visibility.

| Task | Status | Notes |
|------|--------|-------|
| **P3C — Open actions Navigator table** | **Next** | `open_actions` table in `navigatorResponse`; columns: display_name, action_type, status, missing, run; Run Now placeholder row |
| **Policy on routes** | Not started | `allowed`, `reasonNotAllowed` on message routes / responses |
| **Restart mid-flow test** | Verify | DB is source of truth in mysql mode — confirm after schema fix (`display_name`) |
| **Remove / gate `ActionState.js`** | Partial | `CLOUDPILOT_STATE_BACKEND=memory` for tests only; delete Map when restart test is green |
| **`inventory_aws` workflow row** | Decide | Does informational inventory need a persisted row on start? |

**England rule (keep):** bare `4` and bare `yes` target focused workflow; prompts include quoted `display_name`.

**Do not start yet:** multiple open workflows per conversation, `run 1` disambiguation, wired Run button → execute.

---

### B. EC2 mutations (create / delete / toggle)

**Goal:** All three run end-to-end in **`automatic`** mode with manual AWS verification.

**API wiring:** Done for create, delete, toggle (handlers, registry, Atlas clients, field extractors, chat workflow).

| Task | Status | Notes |
|------|--------|-------|
| **Manual AWS E2E — create** | Needs verify | Intent → fields → `4` → `yes` → instance running + tags |
| **Manual AWS E2E — delete** | Needs verify | Instance `terminating` / `terminated` |
| **Manual AWS E2E — toggle** | Needs verify | Primary stopped, secondary running |
| **Stage 4 — cross-action sequence** | Needs | create → toggle → delete on test instances; document cleanup |
| **Stage 4 — failure paths** | Needs verify | Missing fields, bad IDs, wrong state — friendly messages |
| **Atlas unreachable** | Needs | Structured `atlas_unreachable` for all three handlers (no fetch crash) |
| **Stage 0 — Atlas hardening** | Optional | Toggle `ClientError` wrapping; AMI strategy (`DEFAULT_AMIS`) |
| **E2E scripts** | Partial | `e2e-create-ec2.js`, `e2e-delete-ec2.js` exist; toggle script optional |

**Prerequisites:** Atlas at `ATLAS_BASE_URL`, AWS profile `atlas`, test region aligned with defaults, two instance IDs for toggle.

**Exit criteria (all three):** Chat in automatic mode changes AWS; success returns non-null `atlasResponse`; manual verify in console.

---

### C. Kite integration

**Goal:** Connect Kite to `POST /message` and render CloudPilot + Navigator payloads.

| Task | Status | Notes |
|------|--------|-------|
| Send `conversationID` on every message | Kite | Required for workflow scope |
| Render `CloudPilotActionStatus` | Kite | status, missing, collected, workflowId, displayName |
| Render `navigatorResponse` | Kite | stats / tables from scan + inventory (done on API side) |
| Open actions dashboard table | Blocked on P3C | API must emit `open_actions` table first |
| React Query cache for Navigator | Later | `["navigator-data", groupID, conversationID]` |

---

### D. Error & outcome handling (remaining manual tests)

**Code:** Complete (2026-05-24). Outcomes are data, not crashes.

| Task | Status | Notes |
|------|--------|-------|
| Toggle deleted IDs → friendly message, no partial stop/start | Manual test | Preflight should block |
| Atlas stopped → `atlas_unreachable`, API stays up | Manual test | All mutation handlers |

**Pattern:** Validate → Execute → (Verify later). Deleted instance = **outcome**, not HTTP 500.

---

## 2) Finished Development

### Workflow & database

- [x] `cloudpilot_workflows` table + `Actions.js` (create, update, finish, get open, list)
- [x] `display_name` on create from registry `actionLabel`
- [x] User-friendly statuses (`waiting_on_fields`, `waiting_on_execution_mode`, `waiting_on_confirmation`, `running`, terminal states)
- [x] MySQL as source of truth (`actionStateFunctions.js`, `CLOUDPILOT_STATE_BACKEND=mysql` default)
- [x] `focused_workflow_id` in-process (P2C)
- [x] England-rule copy in `CloudPilotChat.js` (P3A)
- [x] Chat open-actions list — “what am I waiting on”, focus switch by name/index (P3B)
- [x] Dual-write bridge removed from hot path; reads/writes via `Actions` + `getUsersActionState`

### EC2 mutations — API code

- [x] `create_ec2`, `delete_ec2`, `toggle_ec2` in `actionRegistry.js`
- [x] Handlers mirror `createEC2Handler` pattern; automatic mode calls Atlas
- [x] Field extractors: region, name, instance_type, instance_id, primary/secondary IDs
- [x] Instance-id heuristic guard (one bare `i-…` per message for shared extractor)

### Navigator UI contract

- [x] `navigatorResponseFunctions.js` — stats, tables, columns, alerts
- [x] Kite generic renderer (client)
- [x] `inventory_aws` + `scan_ec2` Navigator adapters wired
- [x] Opt-in `raw` on read adapters

### Error & outcome handling (code)

- [x] `messages.js` guard — failed remediation does not crash API
- [x] Atlas toggle preflight + `ClientError` → structured envelope
- [x] `atlasEC2Functions` — parse envelope; no throw on `success: false`
- [x] Handlers map outcome codes → friendly `cloudPilotMessage`
- [x] Orchestration guards for repeat intent / failed workflow / null events

### Informational actions

- [x] `scan_ec2`, `inventory_aws`, `general_chat` registry + handlers

---

## 3) Long Term Ideas (Not being worked on)

### Execution persistence (Phase 2)

- `cloudpilot_executions` table — `execution_id`, `workflow_id`, `operation_id`, request/response JSON, audit trail
- Separate **workflow** (intent + collected fields) from **execution** (AWS run)
- `AtlasExecution.js` creates execution row instead of only updating workflow status
- Long-running runs survive Node restart; retries = new execution row on same workflow

### `operation_id` + mutation metadata (Stage 0.5)

- Generate `operation_id` when execution starts; pass through handlers to Atlas
- Shared context: `execution_mode`, `initiated_by`, `requested_at`
- Not persisted until execution table exists

### Multi-open workflows (Phase 2 product)

- Relax one-open-per-conversation constraint
- Kite table with **Run** per row; disambiguation: `run 1`, fuzzy `display_name`
- Optional `action_name` slug; `resolveWorkflow()` Rules 1–6
- Named confirm only when ambiguous

### EC2 hardening (Stage 5+)

- Toggle by tags/roles (`cloudpilot-role: primary/secondary`) — no raw IDs in chat
- Delete safety: only `cloudpilot-managed=true` instances
- Destructive confirmation copy before final confirm
- `automatic_safe` / rollback / monitoring execution modes
- Navigator adapters for mutate actions (create/delete/toggle results)
- Waiters after create (running) / delete (terminated)

### Platform & credentials

- Rollback / undo (after stable mutation flow + execution history)
- Per-user / multi-account AWS credentials
- Bulk actions (“delete 5 instances” → 5 workflow rows)
- More actions: `resize_ec2`, security scan, cost report, RDS, IAM, Terraform

### Deprecated / do not use

- **`atlas_actions`** table — early sketch; superseded by `cloudpilot_workflows`. No JS references.

### Navigator / Kite polish

- Persist Navigator data (React Query cache rules)
- Better column formatting in Kite (`currency`, `status` alignment)
- Opt-in developer `raw` mode default-off
- File naming cleanup pass (separate chore)
- Avoid premature abstraction (schema engines, dynamic plugin registries)

---

## Suggested order (today)

```text
1. Fix / confirm cloudpilot_workflows schema (display_name) — done if table recreated
2. P3C — open_actions Navigator table (API)
3. Kite — wire POST /message + render action status + navigator tables
4. Manual AWS E2E — create, delete, toggle + Stage 4 cross-action
5. Policy fields on routes
6. Phase 2 — executions table + operation_id (when ready for audit/retries)
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-06 | Consolidated `MASTER_TODO.md`, `Master_Database.md`, `Master_Error_Fixes.md`, `action_to_do.md` (and duplicate `to_do/` copies) into this file |
| 2026-06-01 | Prior docs: workflow phases P0–P3B shipped; P3C next |
| 2026-05-28 | EC2 mutation API wiring complete; manual AWS pending |
| 2026-05-24 | Error/outcome handling implemented; Navigator contract + adapters |
