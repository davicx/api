# CloudPilot — Master Error & Outcome Fixes

**Purpose:** Plan safe handling when mutations fail expected ways (deleted instances, invalid IDs, Atlas down) — **without crashing the API** and **without scary “error” UX** for normal business outcomes.

**Status:** Complete — code implemented (2026-05-24). Manual E2E tests 7–8 still recommended.

**Last reviewed:** 2026-05-30

**Related:** `MASTER_TODO.md` (Stage 0.2, Stage 4), `Master_Database.md` (workflow `failed` + future outcome codes)

**Trigger:** Toggle on already-deleted instances → Atlas HTTP 500 → API throw → `messages.js` crash. Delete/toggle on stale workflow also exposed `messages.js` guard gap.

---

## Core idea: three different things

Do not conflate these:

| Concept | Meaning | User should see |
|---------|---------|-----------------|
| **Crash** | Node/API process or request handler breaks | Broken app — **never acceptable** for remediation failure |
| **Outcome** | Expected business result — action did not run or could not run | Friendly CloudPilot explanation |
| **Failure (internal)** | Workflow/execution did not complete AWS change | `status: failed` in state/DB — **not** exposed as “ERROR” in chat |

**Deleted instance is an outcome, not a server error.**

```text
InvalidInstanceID.NotFound  →  outcome: instance_not_found
                              →  NOT HTTP 500
                              →  NOT thrown exception in API
                              →  NOT "Unknown error" in chat
```

CloudPilot is an **orchestration engine**. Orchestration works best when outcomes are **data** that flows through layers — not exceptions that blow up the stack.

---

## How it should behave (user experience)

### Instance not found (example)

**User did:** Confirmed toggle on instance IDs that were already terminated.

**User should see** something like:

```text
I couldn't find one or both of those EC2 instances in us-west-2.
They may have been deleted. Please check the instance IDs and try again.
```

**User should NOT see:**

- HTTP 500 / Internal Server Error
- Stack traces or nodemon crash
- Generic “I could not toggle the EC2 instances.” with no reason
- Chat labeled as a system “error” when the app itself worked fine

### Turn success vs remediation success

| Layer | Instance not found |
|-------|---------------------|
| **AWS** | Instance absent — normal |
| **Atlas** | Returns envelope: `success: false`, outcome code, clear `message` — **HTTP 200** |
| **Handler** | `success: false` for execution; **`cloudPilotMessage`** = friendly explanation |
| **Chat/API** | Request completes; CloudPilot reply **saved and shown** — **API does not crash** |
| **Workflow state** | `status: failed` (or `cancelled`) — internal; user already got the friendly line |

**Important:** `processMessage` / `postMessage` should treat “CloudPilot answered the user appropriately” as a **successful chat turn**, even when the **remediation did not run**. Only true infrastructure breaks (DB down, unhandled exception) should fail the HTTP request.

---

## Risk ranking (fix order)

| Issue | Impact | Fix priority |
|-------|--------|--------------|
| `messages.js` crash on failed CloudPilot | 🔴 High — takes down API | **1** |
| Atlas HTTP 500 on expected AWS outcomes | 🟠 Medium — breaks client parsing | **2–3** |
| Partial toggle (stop primary, secondary gone) | 🟠 Medium — makes things worse | **2** (preflight) |
| Friendly outcome messages in chat | 🟢 Low UX — but part of same pass | **5** |

A failed remediation is a **normal business outcome**. The system must **fail safely**.

---

## Pattern: Validate → Execute → (Verify later)

For destructive / remediation actions (toggle, delete):

```text
1. Validate   — preflight before any AWS mutation
2. Execute    — boto calls with ClientError → structured outcome (backstop)
3. Verify     — optional later (waiters, post-check)
```

**Toggle-specific:** Preflight is **mandatory**, not optional.

Without preflight:

```text
Primary exists, secondary deleted
  → stop primary ✓
  → start secondary ✗
  → user is worse off
```

With preflight:

```text
describe_instances(primary, secondary)
  → secondary missing
  → return instance_not_found
  → no stop/start attempted
```

---

## Ship order (agreed)

Implement in this sequence:

```text
1. messages.js guard
   → Never read cloudPilotMessageOutcome.newMessage unless save succeeded
   → Failed remediation must not crash Node

2. Atlas preflight validation (toggle; delete as needed)
   → describe_instances before stop/start or terminate
   → same_instance check (primary === secondary)

3. Atlas ClientError → service_error
   → No HTTP 500 for expected AWS outcomes
   → HTTP 200 + success: false + outcome code

4. atlasEC2Functions — parse structured envelope
   → Do not throw on success: false
   → Return body; reserve throw / atlas_unreachable for true transport failures

5. Handler friendly messages (toggleEC2Handler, then deleteEC2Handler)
   → Map outcome codes → cloudPilotMessage (friendly, not alarming)
```

**Done when:** Deleted instances → friendly message, workflow marked failed internally, API stays up, **no partial toggle**.

---

## Outcome codes (internal)

Use stable **outcome codes** in Atlas `errors[]` (or dedicated field later). These are for machines and logs — **not** copy-pasted to users as “Error: …”.

| Code | When | Friendly message direction (handler) |
|------|------|--------------------------------------|
| `instance_not_found` | ID not in `describe_instances` / NotFound | Couldn't find instance(s) in {region}; may have been deleted |
| `instance_terminated` | State is `terminated` | Instance(s) already terminated; can't toggle/delete again |
| `invalid_instance_id` | Malformed ID | That instance ID doesn't look valid |
| `invalid_instance_state` | Wrong state for action | Instance isn't in a state that allows this action |
| `same_instance` | primary_id === secondary_id | Primary and secondary must be different instances |
| `aws_toggle_failed` | Other boto ClientError on toggle | Short AWS-safe summary |
| `aws_terminate_failed` | Other boto on delete | Same |
| `atlas_unreachable` | Fetch/network/Atlas down | CloudPilot couldn't reach the execution service |

Add `same_instance` early — users will paste the same ID twice.

---

## Layer responsibilities

### Atlas (Python)

**Files:**

```text
atlas/app/core/cloud/ec2/operations/toggle_instances.py
atlas/app/core/cloud/ec2/operations/manage_instances.py   # delete parity
atlas/app/api/routes/ec2_operation_routes.py
```

**Rules:**

- Expected AWS outcomes → `service_error(code, message)` → route → `json_response_for_service_error` → **HTTP 200**, `success: false`
- Preflight `describe_instances` before mutating (toggle mandatory)
- `ClientError` wrap on stop/start/wait/terminate as backstop
- Never uncaught boto → 500 for “instance not found”

### API — `atlasEC2Functions.js`

**Rules:**

- Parse JSON body even when HTTP status is 4xx/5xx (once Atlas returns 200 for outcomes, status is usually 200 anyway)
- If `success === false` → **return** parsed object to handler
- If network/parse failure → structured `atlas_unreachable` — handler maps to friendly message, still no crash

### API — handlers (`toggleEC2Handler`, `deleteEC2Handler`, …)

**Rules:**

- Map outcome code → **`cloudPilotMessage`** (friendly, complete sentences)
- Return `success: false` for **execution** outcome
- Do not `throw` for expected outcomes
- Mirror create handler structure

### API — `messages.js`

**Rules:**

- If CloudPilot produced a `cloudPilotMessage`, save it and return to client when possible — **even when execution failed**
- Guard: only access `cloudPilotMessageOutcome.newMessage` when defined
- Distinguish: chat turn failed vs remediation did not run

### API — orchestration

When a workflow is already open, CloudPilot must not fall through to `unknown_workflow_event`:

- Repeat same intent while fields missing → `workflow_in_progress` (re-prompt missing fields)
- Repeat same intent while ready → `awaiting_confirmation` or `awaiting_execution_mode`
- Confirm after failed execution → `workflow_failed` (ask user to restart)
- Execution in flight → `workflow_running`
- Fallback with open workflow → same as `workflow_in_progress`

Known gaps still separate (intent tuning):

- Name contains `toggle` → create hijacked as toggle (substring match)

See `Master_Database.md` resolution rules when persisting workflows.

---

## Standard response envelope (unchanged contract)

Atlas and handlers already target:

```json
{
  "success": false,
  "message": "Could not find instance i-xxx in us-west-2",
  "errors": ["instance_not_found"],
  "data": {}
}
```

**`success: false`** means “the requested AWS action did not complete” — not “the server failed.”

Handler adds **`cloudPilotMessage`** for chat — warmer than Atlas `message` if needed.

---

## Future: `cloudpilot_workflows` / executions

When Phase 1 DB lands, store outcomes without losing context:

| Field | Example |
|-------|---------|
| `status` | `failed` |
| Outcome code | `instance_not_found` (column or JSON on row) |
| Outcome message | Friendly text or Atlas message |

User sees history: *“Toggle failed — instances not found”* — not a raw stack trace.

Aligns with `Master_Database.md` workflow lifecycle; no schema change required in this doc.

---

## Incidents that motivated this doc

| Incident | Symptom | Root cause |
|----------|---------|------------|
| Toggle after delete | Atlas 500, API throw, nodemon crash | Toggle no ClientError; `!response.ok` throw; `messages.js` guard |
| Delete repeat intent | `unknown_workflow_event`, crash | `actionEvent: null` + same `messages.js` guard |
| Name contains `toggle` | Create → toggle hijack | Intent substring match (separate fix — intent tuning) |

---

## Checklist (implementation)

- [x] **1.** `messages.js` — guard `cloudPilotMessageOutcome`; save/show friendly reply on failed remediation
- [x] **2.** Atlas toggle — preflight `describe_instances` + `same_instance`
- [x] **3.** Atlas toggle — `ClientError` → `service_error`; route returns 200 envelope
- [x] **4.** Atlas delete — `instance_not_found` / `terminated` mapping (parity)
- [x] **5.** `atlasEC2Functions` — mutations return parsed envelope; no throw on `success: false`
- [x] **6.** `toggleEC2Handler` / `deleteEC2Handler` — outcome code → friendly `cloudPilotMessage`
- [x] **6b.** Orchestration — repeat intent, failed-workflow confirmation, no crash on `unknown_workflow_event`
- [ ] **7.** Manual test: toggle deleted IDs → friendly message, API up, primary not stopped if secondary missing
- [ ] **8.** Manual test: Atlas stopped → `atlas_unreachable` friendly message, API up

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-24 | Orchestration — resolveNullActionEvent, workflow_in_progress/failed/running handlers, failed+yes guard |
| 2026-05-24 | Phase 1 implemented — messages.js guard, outcomeRegistry, atlasEC2Functions fetchAtlasMutation, handler outcome mapping, Atlas preflight |
| 2026-05-30 | Initial plan — outcome vs crash; ship order; preflight mandatory for toggle; `same_instance`; friendly UX vs internal `failed` |
