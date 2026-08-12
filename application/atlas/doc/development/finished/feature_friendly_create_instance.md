# Friendly Create EC2 Experience

## What this does

Make **create EC2** feel like CloudPilot is safely guiding you through AWS — not like operating a command console.

The action already works (including Atlas **Test** mocks with no live AWS). This feature adds a **create-only** product experience:

| Piece | Answers |
|-------|---------|
| **`createEC2Context`** | What should CloudPilot **know** about this request? |
| **`createEC2Guidance`** | How should CloudPilot **walk the user** through it? |

Then the **existing** request / action flow runs unchanged.

**Do not complicate Atlas execution** (route → function → boto3/mock → result stays as-is).  
**Do not build a guidance framework** — two files, one request, prove the idea.

## Status

**Finished** — Steps 0–4 + acceptance against Atlas **Test** (OpenAI off templates primary; create context attached to Chat CURRENT STATE when `create_ec2` is open). Step 5 Kite Create · Cancel deferred (chat confirm OK).

**Codename:** `feature_friendly_create_instance`  
**Related:** [Current Development](../current/current_development.md) · [Finished index](./finished.md) · [CloudPilot MVP](../current/feature_mvp.md) · [CloudPilot Context](./feature_cloud_pilot_context.md) · [CloudPilot Images](./feature_images.md) · [Pause / Resume](./feature_pause_instance.md) · [Coding Style](../how_to/coding_style.md) · [CloudPilot Context how-to](../how_to/cloud_pilot_context.md)

---

# Step 0 — Speak-point map (2026-08-11)

Inspect only. No files added or refactored.

## Folder placement

```text
cloudPilot/actions/createEC2/
  createEC2Handler.js          EXISTING — keep here
  createEC2Context.js          NEW in Step 1 — beside handler
  createEC2Guidance.js         NEW in Step 1 — beside handler
```

Stay under `actions/createEC2/`. Do not create `requests/createEC2/`.

## Speak-point map

```text
STARTED
  file/function:
    cloudPilot/chat/request/RequestConversation.js
      → mapResponseTypeToActionEvent('ask_for_missing_fields') = 'new_action'
        when requestOutcome.action === 'created'
    cloudPilot/chat/CloudPilotMessage.js → speakRequest()
    cloudPilot/chat/templates/requestTemplates.js
      → cloudPilotRespondNewRequest()
  current speaker:
    actionMap.create_ec2.messages.started
      ("Preparing EC2 create.")
    OR fieldPromptExamples.buildMissingFieldsMessage() when fields missing
  proposed create guidance hook:
    In cloudPilotRespondNewRequest(), if actionDefinition.type === 'create_ec2',
    call createEC2Guidance.buildStartedMessage(...) instead of
    messages.started / generic missing intro.
    Include the START choices list (name, region, instance type).

MISSING
  file/function:
    RequestConversation.mapResponseTypeToActionEvent
      → 'missing_fields_given' when requestOutcome.action === 'updated'
    requestTemplates.js → cloudPilotRespondMissingFieldsGiven()
    fieldPromptExamples.js → buildMissingFieldsMessage()
  current speaker:
    Generic "Great, I now have the <field>." + missing-field format examples
  proposed create guidance hook:
    In cloudPilotRespondMissingFieldsGiven(), if create_ec2,
    call createEC2Guidance.buildMissingFieldsMessage(...)
    Keep fieldPromptExamples for the copy-paste lines;
    Guidance owns the educational wrapper / demo-default wording.

READY / MODE PICK
  file/function:
    decideNextStep → RESPONSE_TYPE.AWAITING_EXECUTION_MODE
    RequestConversation → actionEvent 'awaiting_execution_mode'
    requestTemplates.js → cloudPilotRespondAwaitingExecutionMode()
  current speaker:
    Hardcoded:
      "Everything is ready.
       How would you like me to perform this action?
       1. Instructions
       2. CLI Commands
       3. Pull Request
       4. Cloud Pilot Does It"
  proposed create guidance hook:
    In cloudPilotRespondAwaitingExecutionMode(), if create_ec2,
    call createEC2Guidance.buildReadyReviewMessage(collected)
    then append the existing mode list.
    Show ACTUAL choices (name / region / instance type / cost if known).
    Prefer “I have everything I need…” over “Everything is ready.”

CONFIRM
  file/function:
    decideNextStep → RESPONSE_TYPE.AWAITING_CONFIRMATION
      (after user picks automatic / mode 4)
    RequestConversation → actionEvent 'awaiting_confirmation'
    requestTemplates.js → cloudPilotRespondAwaitingConfirmation()
  current speaker:
    actionMap.create_ec2.messages.ready
      ("Everything is ready for the EC2 create.")
    + "Would you like me to execute this action?"
    + optional "Execution mode: automatic"
  proposed create guidance hook:
    In cloudPilotRespondAwaitingConfirmation(), if create_ec2,
    call createEC2Guidance.buildConfirmMessage(collected, executionMode).
    Repeat ACTUAL choices and say this creates a real AWS resource.

SUCCESS
  file/function:
    RequestConversation.conversation()
      first branch: if executionOutcome.ran && cloudPilotMessage
        → CloudPilotMessage.speakKnown(executionOutcome)
    createEC2Handler.js currently builds:
      "Created EC2 instance <id> in <region>."
  current speaker:
    createEC2Handler (execution result message)
  proposed create guidance hook:
    Keep createEC2Handler free of rich presentation.
    Preferred: after Automatic execution, in RequestConversation
    (or a thin success speak helper), if pendingAction === 'create_ec2'
    and execution succeeded, replace/wrap the handler message with
    createEC2Guidance.buildSuccessMessage(executionResult, collected).
    Success claims only facts from atlasResponse / known collected fields.
    Do not put walkthrough copy into createEC2Handler.js.
```

## Handler boundary confirmation

Success speak can happen **after** execution without growing presentation inside
`createEC2Handler.js`:

```text
STEP 6 execute → createEC2Handler returns atlas data + thin/default message
STEP 7 RequestConversation sees executionOutcome
        → create-specific success guidance uses atlasResponse facts
        → speakKnown(rich create success)
```

Handler may keep a short fallback message for non-conversation callers; rich
create UX belongs in Guidance.

## Step 1 touch map (preview only)

```text
NEW
  actions/createEC2/createEC2Context.js
  actions/createEC2/createEC2Guidance.js

UPDATE (thin create_ec2 branch only)
  chat/templates/requestTemplates.js
    cloudPilotRespondNewRequest  ← Step 1 start
```

Steps 2–3 wire READY / CONFIRM / SUCCESS. Do not start those in Step 1.

---

## Feeling we want

> AWS is complicated, but CloudPilot knows what's happening, explains it, shows consequences, asks before anything important, and keeps helping after the action completes.

Different requests should eventually feel different (create = educational/reassuring; delete = cautious; pause = simple) — **same CloudPilot architecture**, different per-request experience. Prove it on create first.

---

## Locked architecture

```text
Existing request flow  → WHEN
createEC2Context       → WHAT CLOUDPILOT KNOWS
createEC2Guidance      → HOW CLOUDPILOT EXPLAINS
createEC2Handler       → WHAT CLOUDPILOT DOES
```

`createEC2Guidance` is **not** an orchestrator. The existing request flow decides
the stage (`STARTED`, `MISSING`, `READY`, `CONFIRM`, success after execution);
guidance only supplies the create-specific experience for that stage.

`createEC2Handler.js` stays free of presentation: no walkthrough strings,
recommendations, pricing explanations, or UI behavior.

---

## Locked decisions

| Topic | Decision |
|-------|----------|
| Where the work lives | **CloudPilot** — not Atlas core |
| Split | **Context** (knowledge/rules) vs **Guidance** (walkthrough) — two concepts, two files |
| Scope | **`create_ec2` only** — no `RequestContextRegistry`, `GuidanceEngine`, etc. |
| Later pattern | If delete/pause grow the same pair, *then* you’ve discovered a real pattern |
| Execution layer | **Unchanged** — same handler → Atlas `/ec2/create` |
| Orchestrator | **Existing CloudPilot request flow owns WHEN** — Guidance does not become a new orchestration layer |
| Handler boundary | `createEC2Handler.js` **does**, not **speaks** |
| Live AWS for this feature | Optional; demo fine on Atlas **Test** mocks |
| Pricing | **Estimated compute cost** when CloudPilot has data — never invent; not “total bill”; never hardcode real prices in Context |
| “Securely” language | **Forbidden** unless CloudPilot knows real protections |
| Reassure with truth | “I’ll show you exactly what will be created before anything changes.” |
| Success claims | Success guidance must describe **facts from the execution result**. Do not claim tags, status, pricing, or protections unless known. |
| Instance-type suggestion | Suggest a small type only when CloudPilot has enough information; otherwise offer `t3.micro` as a **demo/default choice**, not a workload recommendation |
| Post-create alerts / pause | Suggest next actions; label **Coming soon / Demo** until real |
| Confirm UX | Prefer **Create · Cancel** UI later; chat `yes` OK until then |
| Deterministic speak | Guidance drives start / review / confirm / success with OpenAI **off**; context feeds Chat/OpenAI when on |
| OpenAI timing | Steps 1–3 first with OpenAI off; Step 4 Context→Chat only after deterministic create feels excellent |
| Major new abstraction | **Forbidden** in this feature — no framework / engine / registry unless a later second request type proves the pattern |

---

## Context vs Guidance (aligned)

```text
                    createEC2Context
                     facts / rules
                          │
                          ▼
User → Existing create_ec2 request flow
              │
              ├── STARTED  → createEC2Guidance
              ├── MISSING  → createEC2Guidance
              ├── READY    → createEC2Guidance
              ├── CONFIRM  → createEC2Guidance
              └── SUCCESS  → createEC2Guidance
                          │
                          ▼
                   Existing execution
                          │
                          ▼
                     Atlas / Test
```

### 1. Request Context — what CloudPilot should know

```text
create_ec2_context  →  createEC2Context.js

- What creating an EC2 instance means
- What instance type means
- What region means
- Pricing reasoning rules CloudPilot has available
- Security considerations (what we can / cannot claim)
- What happens after creation
- Available follow-up actions
```

Answers: **"What does CloudPilot need to know about this request?"**

Context can know:

```text
Instance type affects compute cost.
Region can affect pricing.
Running continuously costs more than stopping when unused.
Only show an estimate when CloudPilot has pricing data.
Estimate is compute cost, not total AWS bill.
```

Context must **not** hardcode actual current prices like `t3.micro = $7.59/month`.

### 2. Request Guidance — how CloudPilot should guide the user

```text
create_ec2_guidance  →  createEC2Guidance.js

BEFORE COLLECTING INFORMATION
- Explain what we're about to do
- Reassure: nothing is created yet

WHILE COLLECTING INFORMATION
- Explain unfamiliar fields
- Suggest a small instance only when CloudPilot has enough
  information to make that recommendation
- Otherwise offer t3.micro as a demo/default choice,
  not as a workload recommendation

BEFORE EXECUTION
- Show a review
- Explain estimated cost (when known)
- Clearly say this creates a real AWS resource
- Ask for confirmation

AFTER EXECUTION
- Explain what was created from known execution-result facts
- Show status, tags, price only when known from the result
- Suggest cost alert / pause (Coming soon until live)
```

Answers: **"How should CloudPilot walk the user through this request?"**

### Choices summary pattern (not a new system)

Create guidance should repeat the same small set of choices at the start and again when values are known:

```text
START (choices we will collect)
• name
• region
• instance type (instanceSize)

READY / CONFIRM / SUCCESS (actual choices)
• name: …
• region: …
• instance type: …
```

This is copy structure inside `createEC2Guidance.js`, not a new choices engine, form framework, or request-state redesign. The existing request flow still owns collecting those fields.

## MVP file layout (two files + thin entry — no framework)

Prefer co-locating with create (exact folder may match current `actions/createEC2` vs `requests/createEC2` after Step 0 inspect):

```text
cloudPilot/
  actions/createEC2/          # or requests/createEC2/ if that fits better
    createEC2Handler.js       # existing — Atlas call (unchanged responsibility)
    createEC2Context.js       # NEW — request-specific knowledge
    createEC2Guidance.js      # NEW — walkthrough copy / stages
```

Optional thin `createEC2.js` only if it helps export helpers — **not** a registry or framework.

**Only `create_ec2` imports these.**  
Later evidence may add `deleteEC2Context` / `pauseEC2Guidance` — not now.

Wire guidance into existing speak points by calling create-specific helpers when `action === create_ec2` — avoid a global GuidanceEngine.

---

## Current vs desired (demo script)

### 1. Start — user: `create ec2` (Guidance: before collecting)

```text
Sure — I can help you create a small EC2 instance.

I'll walk you through the important choices before anything is created.

We'll need:
• Name — how you'll recognize the server
• Region — where AWS will run it
• Instance type — determines computing power and cost

For this demo, we can use t3.micro, one of AWS's smallest general-purpose types.

Nothing will be created until you review and approve it.
```

### 2. Fields collected — ready for mode pick (Guidance: before execution / review)

```text
I have everything I need to create your EC2 instance.

Name: my-app-server
Region: us-west-2
Instance: t3.micro
Estimated compute cost: about $X/month if left running continuously*

CloudPilot will only create the instance after you approve the action.

How would you like to create it?
1. Instructions
2. CLI Commands
3. Pull Request
4. CloudPilot Does It
```

\* Only when estimate is known. Be honest if PR is unsupported for create.

### 3. Automatic confirmation (Guidance: before execution)

```text
CloudPilot can create this for you.

I'm going to create my-app-server, a t3.micro instance in us-west-2.

This will start an actual AWS resource and may incur AWS charges.

Create instance?

Create · Cancel
```

### 4. Success (Guidance: after execution + Context follow-ups)

```text
Your EC2 instance is running. ✓

my-app-server
i-0123456789
t3.micro · us-west-2

Status: Running
Estimated compute cost: ~$X/month if continuously running   ← only if known

I've tagged the instance so CloudPilot can identify and manage it later.
← only if the create result confirms the tag was applied

You can now ask me things like:
• Pause this instance
• How much is this costing me?
• Show me this instance

…alert if over $5 / pause when unused…
(Coming soon / Demo — until pause & alerts are live)
```

---

## Architecture boundary

```text
Existing CloudPilot request flow
  owns WHEN

createEC2Context
  owns WHAT CLOUDPILOT KNOWS

createEC2Guidance
  owns HOW CLOUDPILOT EXPLAINS

createEC2Handler
  owns WHAT CLOUDPILOT DOES
```

**Out of scope**

- Atlas create / boto3 changes
- `RequestContextRegistry` / `GuidanceEngine` / `GuidanceStepManager` / factories
- Real cost-alert or schedule-pause backends (Coming soon only)
- False “secure” claims
- Rewriting toggle / delete / pause UX (may copy the two-file idea later)

---

## Files likely touched (when coding)

| Area | Path | Change |
|------|------|--------|
| Context | `…/createEC2/createEC2Context.js` | **NEW** — knowledge block |
| Guidance | `…/createEC2/createEC2Guidance.js` | **NEW** — stage copy builders |
| Started / missing | existing speak points | Call guidance for create |
| Ready + modes | `chat/templates/requestTemplates.js` | If `create_ec2`, use guidance review |
| Confirm | `requestTemplates.js` | Create-specific confirm via guidance |
| Success | existing speaking / outcome layer | After execution result, call create guidance success |
| Chat (optional) | append create context when OpenAI speaks about create | Context only |
| Kite (later) | Create · Cancel buttons | Step 5 |

---

## Implementation steps (after approval)

### Step 0 — Inspect only (no code changes)

- [x] Folder placement: beside `createEC2Handler` under `actions/createEC2/`
- [x] Speak-point map recorded above (STARTED → SUCCESS)
- [x] Success speak can happen after execution without presentation in handler

### Step 1 — Add the two files + guided start

- [x] `createEC2Context.js` + `createEC2Guidance.js` (create only)
- [x] Wire **before collecting** intro (nothing created until approval)
- [x] Smoke OpenAI off + Atlas Test

### Step 2 — Review + mode pick

- [x] Guidance review summary (name / region / type / cost if known)
- [x] Honest PR handling for create
- [x] Use “I have everything I need to create your EC2 instance” wording (not “ready to create”)

### Step 3 — Confirm + success

- [x] Safer automatic confirm (`buildConfirmMessage` → `cloudPilotRespondAwaitingConfirmation`)
- [x] Rich success + Coming soon next steps (`buildSuccessMessage` via `RequestConversation`)
- [x] Success claims only facts from the execution result (no tags/status unless in atlasResponse)
- [x] Keep `createEC2Handler.js` free of presentation (short fallback only; speak wraps on create success)
- [x] End-to-end Atlas Test

### Step 4 — Optional: feed Context into Chat

Do **not** combine with Steps 1–3. Deterministic OpenAI-off create must feel
excellent first.

- [x] When OpenAI is on for create-related speak, attach `createEC2Context` (CURRENT STATE `createEc2` facts when pendingAction is `create_ec2`)
- [x] Templates remain primary with OpenAI off

### Step 5 — Kite Create · Cancel (optional)

- [ ] UI confirm controls — **deferred** (chat `yes` / Create · Cancel text OK; not required to finish this feature)

### Step 6 — Acceptance

| Check | Expected | Result |
|-------|----------|--------|
| Only create uses context/guidance files | No registry / engine | Pass |
| `create ec2` | Calm guided intro | Pass |
| Collecting fields | `t3.micro` is demo/default unless CloudPilot can honestly recommend | Pass |
| Ready | Review before modes | Pass |
| Mode 4 | Explicit confirm + charges | Pass |
| Success (Test) | Rich card + Coming soon labels | Pass |
| Success claims | No tags/status/price claims unless known from result | Pass |
| No false “secure” | | Pass |
| OpenAI off | Friendly flow still works | Pass |
| No framework | No `GuidanceEngine` / registry / extra orchestration layer | Pass |
| Handler boundary | `createEC2Handler.js` still just does the work | Pass |

---

## Relationship to other active work

| Feature | Overlap |
|---------|---------|
| [CloudPilot Context](./feature_cloud_pilot_context.md) | Global Chat Identity vs tiny **Search** — this is **per-request** create experience |
| [Pause / Resume](./feature_pause_instance.md) | Success may **point at** pause; pause/resume shipped separately |

---

## Success criteria

```text
conversation → explanation → review → approval → create → running resource → ongoing help
```

Proven with **two files on one request**, not a new platform layer.
