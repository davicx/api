# CloudPilot — Verify Existing Resource Before Request Modes

## What this does

Before CloudPilot offers Instructions, CLI, PR, or Automatic for an action
that targets an existing AWS resource, Atlas verifies the target exists.

First implementation scope:

```text
pause_ec2
resume_ec2
```

The policy applies to every future action that targets a named, existing
resource. `create_ec2`, scans, and inventory do not have a pre-existing target
and therefore do not opt in.

## Coverage matrix

| Action | Uses shared Atlas mock infrastructure | Preflight existence verification |
|---|---:|---:|
| `create_ec2` | Yes — creates a new Test resource | No — target does not exist yet |
| `pause_ec2` | Yes | Yes — one `instance_id` |
| `resume_ec2` | Yes | Yes — one `instance_id` |
| `delete_ec2` | Yes | Yes — one `instance_id` |
| `update_ec2_tag` / `delete_ec2_tag` | Yes | Yes — one `instance_id` |
| `toggle_ec2` | Yes | Yes — both primary and secondary IDs |
| `scan_ec2` | Yes — lists the same Test resources | No — it is the recovery path |
| future S3 mutation | Yes | Yes — `bucket_name`, using `scan_s3` on not found |

```text
Collect region + instance_id
        ↓
Atlas preflight verification
        ↓
FOUND     → offer allowed execution modes
NOT FOUND → stop this action and offer the existing scan_ec2 flow
ERROR     → show Atlas/AWS error; do not claim not found
```

## Current step

**Step 1 complete — shared Atlas Test infrastructure + `/ec2/verify` smoke
passed.**

## Next

Say **do Step 2** (CloudPilot preflight gate). Step 2 is intentionally not
started yet.

**Status:** Active (plan)  
**Codename:** `feature_verify_request`  
**Related:** [Current Development](./current_development.md) · [EC2 Pause / Resume](../finished/feature_pause_instance.md) · [Coding Style](../how_to/coding_style.md)

---

# End-of-day handoff — 2026-08-07

Stopped after **Step 1** only.

Completed today:

```text
atlas/app/core/mock/infrastructure.json
    → canonical Test EC2/S3 fixture

atlas/app/core/mock/infrastructure_store.py
    → resettable, mutable in-memory Test account

Atlas Test scan + pause + resume + /ec2/verify
    → read or mutate the same EC2 records

Live /ec2/verify
    → added through existing route → service → core operation layers
```

Verified against the running Atlas Test server:

```text
8/8 passed
known ID found
unknown ID not found
scan shows shared instance
pause changes state
verify and scan observe stopped state
resume returns it to running
unknown pause returns instance_not_found, never false success
```

No CloudPilot request workflow code changed. In particular, do **not** start
conversation behavior, action metadata, provider code, execution-mode gating,
or scan-offer handling until Step 2 is explicitly requested.

Next session:

```text
do Step 2
→ add pause/resume targetVerification metadata
→ add CloudPilot Atlas provider
→ run the asynchronous preflight after fields persist,
  before execution-mode speech
```

The reusable policy is documented in
[Verify an Existing Resource](../how_to/verify_existing_resource.md). It
applies to named existing-resource actions; `create_ec2` and scans use the
same mock account but do not preflight-verify a target.

---

# Senior review — actual cause and constraints

## The reported bug is real

Before Step 1, Atlas **Test** accepted any `instance_id` for pause/resume. Its
route copied fixed success data, then overwrote `instance_id` with the user
value:

```text
pause i-0a23
        ↓
Test /ec2/pause echoes i-0a23
        ↓
CloudPilot truthfully receives a success envelope,
but the mock has not established that i-0a23 exists
        ↓
false success message
```

The Test EC2 scan uses a separate, hard-coded list of instances. The operation
route and the scan route therefore do not currently share one mock account.

## Current workflow constraint

`requests/decideNextStep.js` is deliberately synchronous and has no database,
chat, or Atlas responsibilities. It currently turns “fields complete” directly
into `waiting_on_execution_mode`.

Atlas verification is asynchronous HTTP. It must **not** be inserted into the
pure decision function. The correct boundary is a small workflow preflight
after request state has been stored and before the request conversation emits
the execution-mode prompt.

```text
STEP 3 Understand (Internal | OpenAI)
        ↓
STEP 4 Decide (pure)
        ↓
STEP 5 Store request fields
        ↓
NEW: verify target through Atlas
        ↓
STEP 7 speak modes / not-found scan offer
```

This preserves the separation of concerns:

```text
Internal / OpenAI → understand user intent and values
Atlas             → determine infrastructure truth
CloudPilot        → decide conversation progression
```

---

# Locked behavior

## Found

```text
User supplies region + instance_id
        ↓
Atlas reports exists: true
        ↓
CloudPilot offers the action’s existing execution modes
```

For `pause_ec2` / `resume_ec2`, those modes remain:

```text
Instructions
CLI Commands
Cloud Pilot Does It
```

There is still no PR mode for pause/resume.

## Not found

```text
Atlas reports exists: false
        ↓
Do not expose any execution mode
Do not generate CLI or instructions for the target
Do not allow automatic confirmation
        ↓
CloudPilot:
I couldn't find EC2 instance <id> in <region>.

Would you like me to scan EC2 and show you the instances you have?
```

When the user replies `yes`, CloudPilot reuses the existing `scan_ec2`
handler/action. It does not create a second inventory implementation or a
special “find instance” action.

## Atlas/AWS error

```text
invalid credentials / permissions / unavailable Atlas / malformed request
        ↓
verification error response
        ↓
do not report exists: false
do not offer execution modes
do not offer scan as a substitute for an infrastructure error
```

## Execution remains defensive

Preflight verification is a UX and safety gate, not a replacement for AWS
operation validation. The target can disappear between verification and
Automatic execution. `pause_instance()` / `resume_instance()` retain their
existing final AWS lookup and `instance_not_found` handling.

---

# Architecture lock

## 1. Action metadata pattern for existing-resource actions

Define the declarative verification metadata pattern for existing-resource
actions, and add it initially only to `pause_ec2` and `resume_ec2`. A list
keeps one-target and two-target actions in the same current `actionMap` style:

```js
targetVerification: {
    resourceType: 'ec2',
    regionField: 'region',
    scanAction: 'scan_ec2',
    targets: [
        { idField: 'instance_id' }
    ]
}
```

`toggle_ec2` uses the same shape:

```js
targetVerification: {
    resourceType: 'ec2',
    regionField: 'region',
    scanAction: 'scan_ec2',
    targets: [
        { idField: 'primary_instance_id' },
        { idField: 'secondary_instance_id' }
    ]
}
```

This avoids hard-coded action names in the verification gate and fits the
existing action registry pattern: action definitions declare facts; request
workflow code applies the declared policy. Do not register this metadata for
`create_ec2`, because create intentionally does not target an existing
instance.

After pause/resume prove the initial path, add the metadata to:

```text
delete_ec2
update_ec2_tag
delete_ec2_tag
toggle_ec2 (requires a two-target design, not this single-target MVP)
future S3 mutations
```

## 2. Atlas owns verification

Initial endpoint:

```text
POST /ec2/verify

{
  "region": "us-west-2",
  "instance_id": "i-0abc123"
}
```

Success, found:

```json
{
  "success": true,
  "data": {
    "exists": true,
    "resource_type": "ec2",
    "resource_id": "i-0abc123",
    "region": "us-west-2",
    "state": "running"
  }
}
```

Success, not found:

```json
{
  "success": true,
  "data": {
    "exists": false,
    "resource_type": "ec2",
    "resource_id": "i-0a23",
    "region": "us-west-2"
  }
}
```

Atlas service failures keep the normal error envelope (`success: false` and an
error code). They must never be converted to `{ exists: false }`.

The live implementation reuses the existing `describe_instances` behavior
already present in:

```text
core/cloud/ec2/operations/pause_resume_instances.py
core/cloud/ec2/operations/manage_instances.py
```

Extract a small, focused lookup helper only after confirming it eliminates
duplication cleanly. Do not create a generic `verifyResource()` framework for
one EC2 target type.

## 3. One Atlas Test infrastructure source of truth

The current Test routes have divergent hard-coded data:

```text
ec2_operation_routes_test.py → operation-specific success constants
ec2_scan_routes_test.py      → unrelated scan instance list
```

Replace the duplicated instance facts with one fixture:

```text
atlas/app/core/mock/infrastructure.json
atlas/app/core/mock/infrastructure_store.py
```

`infrastructure.json` is the readable seed of the fake AWS account. The
store loads it into memory for the Test process and provides narrow EC2
operations:

```text
list_ec2(region)
get_ec2(instance_id, region)
stop_ec2(instance_id, region)
start_ec2(instance_id, region)
reset_for_test()
```

Why an in-memory store rather than writing the JSON on every action:

- pause/resume state must be shared by verify, scan, and action routes;
- mutating a checked-in fixture would leave developer workspaces dirty;
- the fixture remains simple, deterministic, and easy to reset.

The Test scan maps this source to its existing scan response shape. Test
pause/resume read and mutate the same source rather than echoing arbitrary
IDs. This is the required correction that makes the demo truthful.

Do not use MySQL for mock infrastructure, and do not add separate mock
inventories per feature.

## 4. Conversation state for the scan offer

Add a narrow request status:

```text
waiting_on_resource_scan
```

When verification returns not found:

```text
original pause/resume request
    status: waiting_on_resource_scan
    execution_mode: null
    collected: preserves region + requested instance_id
```

The new response type emits the deterministic not-found + scan question.
While in this status:

```text
yes → close/replace the failed target request, start scan_ec2 with the
      preserved region, and execute the existing scan handler directly

no  → close/cancel the failed target request and acknowledge no scan
```

This requires a dedicated decision branch before ordinary execution-mode and
confirmation handling. Reusing the generic `confirm` behavior without a
status would be unsafe: `yes` would otherwise be interpreted as permission to
execute the original mutation.

The scan reuse is behavioral, not a duplicate action:

```text
scan_ec2 actionMap entry
        ↓
existing scanEC2Handler
        ↓
existing EC2 scan formatter, message builder, Navigator adapter
```

No separate “scan after verify failure” handler or inventory service.

---

# Request flow

## Valid Test/Live target

```text
pause ec2
        ↓
collect region + instance_id
        ↓
POST /ec2/verify
        ↓ exists=true
Everything is ready.
Choose execution mode
        ↓
existing Instructions / CLI / Automatic behavior
```

## Invalid Test/Live target

```text
pause ec2
        ↓
collect region + instance_id
        ↓
POST /ec2/verify
        ↓ exists=false
I couldn't find EC2 instance i-0a23 in us-west-2.

Would you like me to scan EC2 and show you the instances you have?
        ↓ yes
existing scan_ec2 execution and response
```

## Understanding is intentionally unchanged

Both Internal and OpenAI action search already converge on the same
normalized request state:

```text
action: pause_ec2 | resume_ec2
values: { region, instance_id }
```

Verification runs after that convergence. There is no OpenAI-specific or
Internal-specific verification code, prompt, database record, or fallback.

---

# Files expected to change

## Atlas (`atlas/`)

```text
app/core/mock/infrastructure.json               # NEW canonical Test account
app/core/mock/infrastructure_store.py           # NEW in-memory fixture access

app/core/cloud/ec2/...                          # UPDATE/NEW small EC2 lookup helper
app/api/services/ec2_operation_service.py       # UPDATE verify_ec2_instance
app/api/routes/ec2_operation_routes.py          # UPDATE POST /ec2/verify

app/api/routes/test/ec2_operation_routes_test.py # UPDATE verify + pause/resume
app/api/routes/test/ec2_scan_routes_test.py      # UPDATE derive EC2 inventory
```

## CloudPilot (`api/application/atlas/`)

```text
providers/atlas/ec2/changeEC2.js                 # UPDATE verifyEC2
cloudPilot/.../resourceVerificationFunctions.js  # NEW narrow preflight bridge
cloudPilot/actionMap.js                          # UPDATE targetResource metadata
cloudPilot/requests/decisionTypes.js             # UPDATE verification response type
cloudPilot/requests/functions/requestStatusFunctions.js # UPDATE scan-offer status
cloudPilot/requests/decideNextStep.js            # UPDATE yes/no scan bridge only
cloudPilot/chat/cloudPilotMessageFunctions.js    # UPDATE run preflight after store
cloudPilot/chat/request/RequestConversation.js   # UPDATE deterministic scan-offer speech
cloudPilot/chat/templates/requestTemplates.js    # UPDATE only if template mapping is cleaner
```

Exact placement of the CloudPilot preflight helper should follow the current
request/execution ownership after implementation starts. It must not live in
`cloudPilotIntelligence`, which is concerned with understanding rather than
infrastructure truth.

---

# Implementation steps (after approval)

### Step 1 — Atlas Test source of truth + verification

- [x] Inspect all fields currently consumed from Test EC2 scan output
- [x] Add a canonical `infrastructure.json` containing the demo EC2 resources
- [x] Add a resettable in-memory Test store; no database and no fixture writes
- [x] Make Test scan, Test verify, and Test pause/resume use that store
- [x] Add `POST /ec2/verify` with distinct found, not-found, and error contracts
- [x] Reuse/live-extract EC2 lookup behavior without duplicating boto3 calls

### Step 2 — CloudPilot preflight gate

- [ ] Add `targetVerification` metadata to only pause/resume
- [ ] Add Atlas provider `verifyEC2`
- [ ] Run verification after fields persist and before execution-mode speech
- [ ] Found → preserve the existing execution-mode flow
- [ ] Verification error → block progression with the real error

### Step 3 — Not found → existing scan

- [ ] Add `waiting_on_resource_scan` and a deterministic not-found response
- [ ] `yes` replaces the blocked mutation with the existing regional `scan_ec2`
- [ ] `no` cancels/closes the blocked mutation without a scan
- [ ] Ensure `yes` cannot reach Automatic execution for the not-found target

### Step 4 — Verification and regression smoke

- [ ] Test found/not-found/error at the Atlas endpoint
- [ ] Test Test-mode scan and pause/resume read the same instance state
- [ ] Pause/resume valid target → verify → mode selection
- [ ] Invalid target → no mode selection → scan offer
- [ ] `yes` → existing scan output; `no` → no scan
- [ ] Internal and OpenAI understanding paths converge at the same verification gate
- [ ] Simulate target disappearance after preflight; Automatic reports action error, never false success

---

# Acceptance criteria

```text
Invalid EC2 ID in Atlas Test cannot reach Instructions, CLI, or Automatic

Valid EC2 ID in Atlas Test can proceed normally

Test scan, verification, and pause/resume use one shared fake account

“yes” after not-found runs existing scan_ec2, not the blocked mutation

Atlas/AWS errors are not mislabeled as “not found”

Live pause/resume still performs its final AWS state validation
```

---

# Scope control

This feature establishes the required pattern for all named existing-resource
actions. It implements the pattern first for single-target EC2 actions; each
later resource type uses the same action metadata and workflow gate, but may
need a resource-specific Atlas endpoint.

Do not add S3 verification, database-backed mock infrastructure, a generic
resource registry, new inventory actions, or a generic resource-management
framework in this feature.
