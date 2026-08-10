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

## Current step

**Plan locked — awaiting Step 0 / Step 1.**

## Next

Say **do Step 0** to inspect the current create speak points and confirm the exact file-touch map.  
Then say **do Step 1** to add `createEC2Context` + `createEC2Guidance` and wire guided start.

**Status:** Active (plan)  
**Codename:** `feature_friendly_create_instance`  
**Related:** [Current Development](./current_development.md) · [CloudPilot Context](../finished/feature_cloud_pilot_context.md) · [CloudPilot Images](../finished/feature_images.md) · [Pause / Resume](../finished/feature_pause_instance.md) · [Coding Style](../how_to/coding_style.md)

---

## Feeling we want

> AWS is complicated, but CloudPilot knows what's happening, explains it, shows consequences, asks before anything important, and keeps helping after the action completes.

Different requests should eventually feel different (create = educational/reassuring; delete = cautious; pause = simple) — **same CloudPilot architecture**, different per-request experience. Prove it on create first.

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
| Post-create alerts / pause | Suggest next actions; label **Coming soon / Demo** until real |
| Confirm UX | Prefer **Create · Cancel** UI later; chat `yes` OK until then |
| Deterministic speak | Guidance drives start / review / confirm / success with OpenAI **off**; context feeds Chat/OpenAI when on |
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
- Suggest a small instance when appropriate

BEFORE EXECUTION
- Show a review
- Explain estimated cost (when known)
- Clearly say this creates a real AWS resource
- Ask for confirmation

AFTER EXECUTION
- Explain what was created
- Show status, tags, price (when known)
- Suggest cost alert / pause (Coming soon until live)
```

Answers: **"How should CloudPilot walk the user through this request?"**

---

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

### Step 0 — Inspect

- [ ] Confirm folder: beside `createEC2Handler` vs under `requests/createEC2/`
- [ ] Map speak stages: started → missing → ready/modes → confirm → success
- [ ] Confirm success speak can happen after execution result without pushing presentation into `createEC2Handler.js`

### Step 1 — Add the two files + guided start

- [ ] `createEC2Context.js` + `createEC2Guidance.js` (create only)
- [ ] Wire **before collecting** intro (nothing created until approval)
- [ ] Smoke OpenAI off + Atlas Test

### Step 2 — Review + mode pick

- [ ] Guidance review summary (name / region / type / cost if known)
- [ ] Honest PR handling for create
- [ ] Use “I have everything I need to create your EC2 instance” wording (not “ready to create”)

### Step 3 — Confirm + success

- [ ] Safer automatic confirm
- [ ] Rich success + Coming soon next steps
- [ ] Keep `createEC2Handler.js` free of presentation
- [ ] End-to-end Atlas Test

### Step 4 — Optional: feed Context into Chat

- [ ] When OpenAI is on for create-related speak, attach `createEC2Context`
- [ ] Templates remain primary with OpenAI off

### Step 5 — Kite Create · Cancel (optional)

- [ ] UI confirm controls

### Step 6 — Acceptance

| Check | Expected |
|-------|----------|
| Only create uses context/guidance files | No registry / engine |
| `create ec2` | Calm guided intro |
| Ready | Review before modes |
| Mode 4 | Explicit confirm + charges |
| Success (Test) | Rich card + Coming soon labels |
| No false “secure” | |
| OpenAI off | Friendly flow still works |
| No framework | No `GuidanceEngine` / registry / extra orchestration layer |
| Handler boundary | `createEC2Handler.js` still just does the work |

---

## Relationship to other active work

| Feature | Overlap |
|---------|---------|
| [CloudPilot Context](../finished/feature_cloud_pilot_context.md) | Global Chat Identity vs tiny **Search** — this is **per-request** create experience |
| [Pause / Resume](../finished/feature_pause_instance.md) | Success may **point at** pause; pause/resume shipped separately |

---

## Success criteria

```text
conversation → explanation → review → approval → create → running resource → ongoing help
```

Proven with **two files on one request**, not a new platform layer.
