# CloudPilot — EC2 Pause / Resume (`pause_ec2` / `resume_ec2`)

## What this does

Add two explicit single-instance actions:

```text
pause_ec2   → running → stopped   (AWS StopInstances)
resume_ec2  → stopped → running   (AWS StartInstances)
```

Separate from `toggle_ec2` (primary/secondary swap). Do not remove or redesign toggle.

## Current step

**Phase 1–2 complete — inspection + plan only. Waiting for approval before coding.**

## Next

Approve this plan, then say **do Step 1** (Atlas stop/start endpoints).

**Status:** Active (plan)  
**Codename:** `feature_pause_instance`  
**Related:** [Current Development](./current_development.md) · [Add New Action](../how_to/add_new_action.md) · [Add Intelligence Capability](../how_to/add_intelligence_capability.md) · [Coding Style](../how_to/coding_style.md)

---

# Phase 1–2 Report — CURRENT STATE

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
- Instructions via DB instruction_for keys (optional seed later)

Missing
- Atlas POST /ec2/stop (or /ec2/pause) and POST /ec2/start (or /ec2/resume)
- Core ops: stop/start one instance + state inspect + already-stopped/running no-op
- CloudPilot actions pause_ec2 / resume_ec2 (handlers + actionMap entries)
- Match rules so pause/stop vs resume/start do not collide with create/delete/toggle
- CLI templates for pause/resume
- History builders + undo handlers for pause ↔ resume
- Instructions rows (optional; can ship Automatic first)
- PR support — not applicable; omit `pr` from executionModes

Files that need changes
- atlas/app/api/routes/ec2_operation_routes.py
  - add stop/start (pause/resume) routes
- atlas/app/api/services/ec2_operation_service.py
  - wire service functions
- atlas/app/core/cloud/ec2/operations/  (new or extend manage_instances.py)
  - stop_instance / start_instance with describe + waiters + safe no-op
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
- api/.../cloudPilotIntelligence/understand/search/searchMessageForAction.js
  - only if catalog/prompt examples need pause/resume hints (catalog is dynamic — likely no change)

New files needed
- atlas/.../operations/pause_resume_instances.py (or stop_start_instances.py)
  - single-instance stop/start core
- api/.../cloudPilot/actions/pauseEC2/pauseEC2Handler.js
- api/.../cloudPilot/actions/resumeEC2/resumeEC2Handler.js
- api/.../cloudPilot/history/historyBuilders/pauseEc2History.js
- api/.../cloudPilot/history/historyBuilders/resumeEc2History.js
- api/.../cloudPilotIntelligence/understand/search/pauseInstance/searchMessageForPauseInstance.js
  - Internal + OpenAI-capable search (see Intelligence section below)
- api/.../cloudPilotIntelligence/understand/search/resumeInstance/searchMessageForResumeInstance.js
  - same pattern for resume
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

# Target behavior

### Pause

```text
load instance (describe)
→ if running (or pending): stop → wait stopped → success
→ if already stopped: safe "already paused" success (no-op)
→ if terminated / missing: error
```

### Resume

```text
load instance (describe)
→ if stopped: start → wait running → success
→ if already running: safe "already running" success (no-op)
→ if terminated / missing: error
```

---

# Intelligence / search (Internal | OpenAI)

## Important finding

`searchMessageForAction` already is the Action Search front door:

- **Internal:** `actionMap.match()`
- **OpenAI:** optional fallback; catalog = all `actionMap` actions

So pause/resume **do not need a second product OpenAI capability** if they are proper `actionMap` entries — OpenAI will see them in the catalog automatically.

## Still add dedicated search files (your style)

Match [Add Intelligence Capability](../how_to/add_intelligence_capability.md): one public entry, Internal + OpenAI implementations in the **same file**, clearly labeled.

```text
cloudPilotIntelligence/understand/search/

pauseInstance/
    searchMessageForPauseInstance.js
        searchMessageForPauseInstance()           ← public gateway
        searchMessageForPauseInstanceInternal()
        searchMessageForPauseInstanceOpenAI()     ← optional; prefer reusing Action Search OpenAI

resumeInstance/
    searchMessageForResumeInstance.js
        searchMessageForResumeInstance()
        searchMessageForResumeInstanceInternal()
        searchMessageForResumeInstanceOpenAI()
```

### Recommended wiring (avoid double OpenAI billing)

```text
searchMessageForActionInternal(message)
    → if searchMessageForPauseInstanceInternal hits → pause_ec2
    → else if searchMessageForResumeInstanceInternal hits → resume_ec2
    → else existing actionMap.match loop
```

OpenAI path stays **only** in `searchMessageForActionOpenAI` (existing). Dedicated `*OpenAI` functions can:

- call the shared Action Search OpenAI path, **or**
- stay as stubs that return null and let Action Search OpenAI handle unknown phrasing

Do **not** run three separate OpenAI completions for one message.

### Internal phrase guidance

| Intent | Prefer match when message has | Avoid colliding with |
|--------|-------------------------------|----------------------|
| `pause_ec2` | `pause` (+ ec2/instance optional), or `stop` + (ec2\|instance) | `delete`, `terminate`, `toggle`, `switch` |
| `resume_ec2` | `resume` (+ ec2/instance optional), or `start` + (ec2\|instance) without `create` | `create`, `toggle`, `switch` |

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
        execute_pause(body)      # stop one instance
        execute_resume(body)     # start one instance

atlas/app/api/services/ec2_operation_service.py   # UPDATE
        pause_ec2_instance(body)
        resume_ec2_instance(body)

atlas/app/api/routes/ec2_operation_routes.py      # UPDATE
        POST /ec2/pause   (or /ec2/stop)
        POST /ec2/resume  (or /ec2/start)
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
  "noop": false
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

`match:` can delegate to Internal search helpers (preferred) or inline includes — keep pause/stop vs resume/start distinct from toggle/create/delete.

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

cloudPilot/executionModes/instructions/
    # works when DB has instruction_for = pause_ec2 / resume_ec2
    # optional seed in a later step
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

Only for Automatic successful (or intentional no-op?) completions — follow existing toggle/create rules (`shouldRecordHistoryForExecution`). Prefer recording real state changes; no-op already-paused may skip undo or record with `undo_available: false` — decide in Step implementation to match current builders.

## Intelligence — NEW

```text
cloudPilotIntelligence/understand/search/
├── searchMessageForAction.js          # UPDATE — call pause/resume Internal helpers first
├── pauseInstance/
│   └── searchMessageForPauseInstance.js   # NEW
└── resumeInstance/
    └── searchMessageForResumeInstance.js  # NEW
```

Values extractors (`instance_id`, `region`) — **reuse as-is**; no new value search required.

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

### Step 1 — Atlas pause / resume endpoints

- [ ] Core `execute_pause` / `execute_resume` (describe, stop/start, waiters, no-op)
- [ ] Service + routes `POST /ec2/pause`, `POST /ec2/resume`
- [ ] Smoke with Test mode or real AWS

### Step 2 — Provider + handlers + actionMap

- [ ] `pauseEC2` / `resumeEC2` in `changeEC2.js`
- [ ] `pauseEC2Handler` / `resumeEC2Handler`
- [ ] `actionMap` entries (no `pr` in executionModes)
- [ ] Smoke Automatic with known instance

### Step 3 — Intelligence search

- [ ] `searchMessageForPauseInstance.js` / `searchMessageForResumeInstance.js`
- [ ] Wire Internal into `searchMessageForActionInternal`
- [ ] Confirm OpenAI catalog picks up new actions when Action Search = openai
- [ ] Phrase tests: pause/stop/resume/start; no collision with delete/create/toggle

### Step 4 — CLI (+ optional Instructions seed)

- [ ] CLI templates + CliLogic branches
- [ ] Optional: SQL seed for instructions `pause_ec2` / `resume_ec2`

### Step 5 — History / undo

- [ ] History builders + HISTORY_BUILDERS
- [ ] undoRegistry pause ↔ resume
- [ ] Smoke undo after Automatic pause/resume

### Step 6 — Acceptance

- [ ] Pause running instance → stopped
- [ ] Pause already stopped → already paused
- [ ] Resume stopped → running
- [ ] Resume already running → already running
- [ ] Missing instance_id → ask
- [ ] Chat phrases map to correct action
- [ ] toggle_ec2 unchanged

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
