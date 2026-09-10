# CloudPilot — EC2 Pause / Resume (`pause_ec2` / `resume_ec2`)

## What this does

Add two explicit single-instance actions:

```text
pause_ec2   → running → stopped   (AWS StopInstances)
resume_ec2  → stopped → running   (AWS StartInstances)
```

Separate from `toggle_ec2` (primary/secondary swap). Do not remove or redesign toggle.

## Status

**Finished** — `pause_ec2` / `resume_ec2` end-to-end against Atlas **Test** (AWS off). Live AWS full pass still optional when ready.

**Codename:** `feature_pause_instance`  
**Related:** [Current Development](../current/current_development.md) · [Finished index](./finished.md) · [Add New Action](../how_to/add_new_action.md) · [Coding Style](../how_to/coding_style.md)

---

# Senior review — final architecture

```text
EC2 PAUSE / RESUME — CURRENT STATE

Already exists
- Atlas toggle uses boto3 stop_instances + start_instances + waiters
  (atlas/app/core/cloud/ec2/operations/toggle_instances.py)
- Atlas routes: POST /ec2/toggle, /ec2/create, /ec2/delete, /ec2/tag, …
- CloudPilot provider: providers/atlas/ec2/changeEC2.js → atlasPost('/ec2/toggle'|create|delete|tag)
- Full action pipeline: actionMap → requests/fields → executionModes → handler → Atlas → history
- Single-instance field pattern: delete_ec2 / update_ec2_tag use region + instance_id
- Instance id / region extractors: searchMessageForInstanceId, searchMessageForRegion
- Action Search front door (Internal | OpenAI): searchMessageForAction.js
  OpenAI catalog is built dynamically from actionMap — new actions appear automatically
- History + undo registry pattern (toggle / create / tag)
- Destructive executionModes: instructions | cli | pr | automatic
- CLI templates exist (create_ec2 only today); PR live for toggle_ec2 only
- Missing-field / confirmation flow for destructive actions

Can reuse
- delete_ec2Handler shape (region + instance_id → Atlas → outcome message)
- changeEC2.js thin POST helpers (add pauseEC2 / resumeEC2 next to toggleEC2)
- manage_instances.py / toggle_instances.py session + waiter patterns for new core ops
- searchMessageForAction Internal match via actionMap.match + OpenAI catalog
- HISTORY_BUILDERS + undoRegistry pattern (pause undo → resume, resume undo → pause)
- executionModes automatic path (runAction → handler)
- CliLogic / cliTemplates pattern for stop-instances / start-instances strings
- Instructions engine via DB `instruction_for` keys

Missing
- Atlas POST `/ec2/pause` and `/ec2/resume`
- Core operations: state inspection + AWS stop/start + waiters + state-aware no-op
- CloudPilot actions pause_ec2 / resume_ec2 (handlers + actionMap entries)
- Match rules so pause/stop vs resume/start do not collide with create/delete/toggle
- CLI templates for pause/resume
- History builders + undo handlers for pause ↔ resume
- Instructions rows for `pause_ec2` and `resume_ec2`
- PR support — not applicable; omit `pr` from executionModes

Files that need changes
- atlas/app/api/routes/ec2_operation_routes.py
  - add `POST /ec2/pause` and `POST /ec2/resume`
- atlas/app/api/routes/test/ec2_operation_routes_test.py
  - add matching mock pause/resume routes so Atlas Test remains AWS-free
- atlas/app/api/services/ec2_operation_service.py
  - wire service functions
- atlas/app/core/cloud/ec2/operations/
  - import and call `pause_instance()` / `resume_instance()`
- api/.../providers/atlas/ec2/changeEC2.js
  - pauseEC2() / resumeEC2() atlasPost helpers
- api/.../cloudPilot/actionMap.js
  - pause_ec2 + resume_ec2 definitions (match, fields, modes, messages)
- api/.../cloudPilot/executionModes/cli/CliLogic.js + cliTemplates.js
  - generate stop/start CLI
- api/.../cloudPilot/history/functions/historyFunctions.js
  - register HISTORY_BUILDERS
- api/.../cloudPilot/history/undoRegistry.js
  - undo handlers pause ↔ resume
- api/.../doc/sql/cloudpilot_instructions.sql or a focused seed file
  - add curated instructions for pause/resume

New files needed
- atlas/.../operations/pause_resume_instances.py
  - `pause_instance()` / `resume_instance()` — one-instance state machine
- api/.../cloudPilot/actions/pauseEC2/pauseEC2Handler.js
- api/.../cloudPilot/actions/resumeEC2/resumeEC2Handler.js
- api/.../cloudPilot/history/historyBuilders/pauseEc2History.js
- api/.../cloudPilot/history/historyBuilders/resumeEc2History.js
```

**Verdict:** Yes — this is a **small extension** of the existing EC2 action system (closest cousins: `delete_ec2` for fields/handler shape, `toggle_ec2` for stop/start AWS calls). No architecture refactor.

**Stop — wait for approval before coding.**

---

# Goal (locked)

| Action | Meaning | AWS |
|--------|---------|-----|
| `pause_ec2` | Pause one instance | `StopInstances` |
| `resume_ec2` | Resume one instance | `StartInstances` |

Inputs (both):

```text
region
instance_id
```

Never pick an arbitrary instance. Never terminate. Never resize. Do not change `toggle_ec2`.

---

# Product naming vs AWS implementation (locked)

```text
USER / CLOUDPILOT       ATLAS HTTP             AWS IMPLEMENTATION

pause_ec2          →    POST /ec2/pause   →    pause_instance()
resume_ec2         →    POST /ec2/resume  →    resume_instance()

                                               ec2.stop_instances()
                                               ec2.start_instances()
```

**Pause / resume** are the friendly product terms. **Stop / start** are AWS implementation details.

---

# Target behavior — state-aware (locked)

### Pause

| State before | Behavior | Result |
|--------------|----------|--------|
| `running` | Stop → wait `stopped` | changed |
| `stopping` | Wait `stopped`; do not call StopInstances | already transitioning; no CloudPilot mutation |
| `stopped` | Do nothing | no-op success |
| `pending` | Wait `running` → stop → wait `stopped` | changed |
| `shutting-down` / `terminated` | Do nothing | error |
| missing | Do nothing | error |

### Resume

| State before | Behavior | Result |
|--------------|----------|--------|
| `stopped` | Start → wait `running` | changed |
| `pending` | Wait `running`; do not call StartInstances | already transitioning; no CloudPilot mutation |
| `running` | Do nothing | no-op success |
| `stopping` | Wait `stopped` → start → wait `running` | changed |
| `shutting-down` / `terminated` | Do nothing | error |
| missing | Do nothing | error |

The operation returns `state_before`, `state_after`, `noop`, and `changed_by_cloudpilot`.

`noop` means no StartInstances/StopInstances call was made. `changed_by_cloudpilot` means this request actually initiated the state transition. A wait-only request may observe a changed state, but it must return `changed_by_cloudpilot: false`.

It must not pick another instance.

---

# Intelligence / action detection — no new search files

## Important finding

`searchMessageForAction` already is the Action Search front door:

- **Internal:** `actionMap.match()`
- **OpenAI:** optional fallback; catalog = all `actionMap` actions

So pause/resume are **actions**, not dedicated Intelligence capabilities.

```text
searchMessageForAction()
    ↓
Internal: actionMap.match()
OpenAI: actionMap dynamic catalog
    ↓
pause_ec2 / resume_ec2
```

There are **no** new `pauseInstance/` or `resumeInstance/` search folders/files. This avoids duplicate classification and duplicate OpenAI billing. `searchMessageForAction.js` needs no code change because its catalog is dynamically built from `actionMap`.

### Internal phrase guidance

| Intent | Prefer match when message has | Avoid colliding with |
|--------|-------------------------------|----------------------|
| `pause_ec2` | `pause`, or `stop` + (`ec2` \| `instance`) | `delete`, `terminate`, `toggle`, `switch` |
| `resume_ec2` | `resume`, or `start` + (`ec2` \| `instance`) | `create`, `toggle`, `switch` |

Examples that should resolve:

```text
Pause this EC2 instance.
Pause i-123456.
Stop my EC2 instance.
Resume this EC2 instance.
Resume i-123456.
Start my EC2 instance.
```

Missing `instance_id` / `region` → existing request missing-field flow (same as delete).

---

# Files & folders — create / update

## Atlas (Python) — NEW + UPDATE

```text
atlas/app/core/cloud/ec2/operations/
├── toggle_instances.py          # unchanged
├── manage_instances.py          # may reuse helpers OR leave as-is
└── pause_resume_instances.py    # NEW
        pause_instance(body)     # inspect → AWS stop → waiter
        resume_instance(body)    # inspect → AWS start → waiter

atlas/app/api/services/ec2_operation_service.py   # UPDATE
        pause_ec2_instance(body)
        resume_ec2_instance(body)

atlas/app/api/routes/ec2_operation_routes.py      # UPDATE
        POST /ec2/pause
        POST /ec2/resume

atlas/app/api/routes/test/ec2_operation_routes_test.py  # UPDATE
        POST /ec2/pause / POST /ec2/resume mock responses (no AWS)
```

Suggested request body (mirror delete):

```json
{ "region": "us-west-2", "instance_id": "i-0abc123" }
```

Suggested success data shape:

```json
{
  "action": "pause",
  "status": "SUCCESS",
  "region": "us-west-2",
  "instance_id": "i-0abc123",
  "state_before": "running",
  "state_after": "stopped",
  "noop": false,
  "changed_by_cloudpilot": true
}
```

(`noop: true` when already in desired state.)

## CloudPilot providers — UPDATE

```text
providers/atlas/ec2/changeEC2.js
    // existing: toggleEC2, createEC2, deleteEC2, updateEC2Tag, deleteEC2Tag
    pauseEC2(requestBody)    // NEW — atlasPost('/ec2/pause', …)
    resumeEC2(requestBody)   // NEW — atlasPost('/ec2/resume', …)
```

## CloudPilot actions — NEW

```text
cloudPilot/actions/
├── toggleEC2/toggleEC2Handler.js     # unchanged
├── deleteEC2/deleteEC2Handler.js     # pattern to copy
├── pauseEC2/
│   └── pauseEC2Handler.js            # NEW
│         pauseEC2Handler(context)
└── resumeEC2/
    └── resumeEC2Handler.js           # NEW
          resumeEC2Handler(context)
```

Handler responsibilities (same style as delete):

1. Read `collected.region`, `collected.instance_id`
2. Call `ChangeEC2Functions.pauseEC2` / `resumeEC2`
3. Return `{ success, cloudPilotMessage, error, atlasResponse }`

## actionMap — UPDATE

```text
cloudPilot/actionMap.js
    pause_ec2: { … }
    resume_ec2: { … }
```

Shared shape (both):

| Field | Value |
|-------|--------|
| `actionTier` | `destructive` |
| `requiresWorkflow` | `true` |
| `requiresExecution` | `false` |
| `executionModes` | `['instructions', 'cli', 'automatic']` — **no `pr`** |
| `requiredFields` | `['region', 'instance_id']` |
| `executionFunction` | pause / resume handler |
| `capability.section` | `Manage EC2` |

`match:` lives directly in each action definition. Keep pause/stop vs resume/start distinct from toggle/create/delete.

## Execution modes — UPDATE

```text
cloudPilot/executionModes/cli/cliTemplates.js
    buildPauseEc2Cli(collected)     # NEW
    buildResumeEc2Cli(collected)    # NEW

cloudPilot/executionModes/cli/CliLogic.js
    # handle pause_ec2 / resume_ec2 like create_ec2

cloudPilot/executionModes/pr/PrLogic.js
    # no change — omit pr from executionModes so UI should not offer it
    # if mode somehow selected → existing unsupported message is fine

doc/sql/cloudpilot_instructions.sql (or seed file)
    # REQUIRED: instruction_for = pause_ec2 / resume_ec2
```

CLI shape:

```bash
aws ec2 stop-instances \
  --instance-ids <instance_id> \
  --region <region>
```

```bash
aws ec2 start-instances \
  --instance-ids <instance_id> \
  --region <region>
```

## History / undo — NEW + UPDATE

```text
cloudPilot/history/historyBuilders/
├── pauseEc2History.js     # NEW — buildPauseEc2HistoryFields
└── resumeEc2History.js    # NEW — buildResumeEc2HistoryFields

cloudPilot/history/functions/historyFunctions.js   # UPDATE HISTORY_BUILDERS
cloudPilot/history/undoRegistry.js                 # UPDATE
    pause_ec2_undo → call resume capability
    resume_ec2_undo → call pause capability
```

Conceptual undo:

```text
pause_ec2  undo → resume_ec2
resume_ec2 undo → pause_ec2
```

### State-aware undo rule (locked)

Undo reverses a state change that **CloudPilot actually made** — not merely an action name or a state it happened to observe.

```text
pause_ec2:  running → stopped, noop=false
  changed_by_cloudpilot=true
  → history row; undo_available=true; undo → resume

pause_ec2:  stopped → stopped, noop=true
  changed_by_cloudpilot=false
  → history row may be kept; undo_available=false

pause_ec2: stopping → stopped, noop=true
  changed_by_cloudpilot=false
  → history row may be kept; undo_available=false

resume_ec2: stopped → running, noop=false
  changed_by_cloudpilot=true
  → history row; undo_available=true; undo → pause

resume_ec2: running → running, noop=true
  changed_by_cloudpilot=false
  → history row may be kept; undo_available=false

resume_ec2: pending → running, noop=true
  changed_by_cloudpilot=false
  → history row may be kept; undo_available=false
```

This prevents “Pause an already stopped instance” from creating an Undo that starts it.

Values extractors (`instance_id`, `region`) are reused as-is; no new value search required.

---

# Conversation behavior

Uses existing Request Conversation:

1. Detect `pause_ec2` / `resume_ec2`
2. Collect `region` + `instance_id` (missing-field prompts from actionMap messages)
3. User picks execution mode (1 Instructions / 2 CLI / 4 Automatic — no PR)
4. Automatic → confirm if current destructive flow requires it → handler → Atlas
5. History row when applicable

---

# Safety

- Require `instance_id` + `region` + action before Automatic
- `pause` ≠ terminate/delete
- Already correct state → safe no-op message
- No multi-instance, scheduler, or cost optimization in this feature

---

# Scope control — out of scope

```text
pause until Monday / cron / EventBridge
multi-instance pause
environment-level pause
redesign toggle
new remediation framework
architecture refactor
forcing PR mode
```

---

# Implementation steps (after approval)

### Step 1 — Atlas state-aware pause / resume

- [x] Core `pause_instance` / `resume_instance` (describe, state table, stop/start, waiters, no-op)
- [x] Service + routes `POST /ec2/pause`, `POST /ec2/resume`
- [x] Test routes return matching mock state/noop response shapes
- [x] Smoke Atlas Test mode — no AWS

### Step 2 — Provider + handlers + actionMap

- [x] `pauseEC2` / `resumeEC2` in `changeEC2.js`
- [x] `pauseEC2Handler` / `resumeEC2Handler`
- [x] `actionMap` entries (no `pr` in executionModes)
- [x] Smoke Automatic with known instance

### Step 3 — Action matching (no Intelligence files)

- [x] Add `actionMap.match()` rules for pause/stop and resume/start
- [ ] Confirm dynamic OpenAI catalog picks up both actions when Action Search = openai
- [x] Phrase tests: pause/stop/resume/start; no collision with delete/create/toggle

### Step 4 — CLI + Instructions

- [x] CLI templates + CliLogic branches
- [x] SQL seed / rows for Instructions `pause_ec2` / `resume_ec2`
- [x] Smoke Instructions mode end-to-end

### Step 5 — History / undo

- [x] History builders include `state_before`, `state_after`, `noop`, `changed_by_cloudpilot`
- [x] HISTORY_BUILDERS sets `undo_available=false` unless `changed_by_cloudpilot=true`
- [x] undoRegistry pause ↔ resume
- [x] Smoke undo after Automatic pause/resume

### Step 6 — Acceptance

- [x] Pause running instance → stopped
- [x] Pause already stopped → already paused
- [x] Resume stopped → running
- [x] Resume already running → already running
- [x] Pending/stopping behavior follows state contract
- [x] Missing instance_id → ask
- [x] Chat phrases map to correct action
- [x] Instructions, CLI, and Automatic work; PR never offered
- [x] No-op never surfaces an Undo that reverses a state CloudPilot did not change
- [x] toggle_ec2 unchanged

---

# Coding style reminders

Follow [coding_style.md](../how_to/coding_style.md) and existing EC2 files:

- `FUNCTIONS A:` TOC blocks; labeled Function A1 / A2 …
- No drive-by refactors; do not delete commented code
- Descriptive names (no one-letter domain vars)
- Thin Atlas provider; thick behavior stays in Atlas core + CloudPilot handler messages

---

# Success criteria

```text
CloudPilot understands pause/resume
        ↓
targets one known EC2 instance (region + instance_id)
        ↓
Automatic → Atlas → stop/start + verify
        ↓
History records (when appropriate)
        ↓
Undo reverses pause ↔ resume
        ↓
toggle_ec2 untouched
```
