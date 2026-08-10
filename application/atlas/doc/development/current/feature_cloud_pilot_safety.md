# CloudPilot Safety

## What this does

Adds a small **spending guardrail** in front of OpenAI so CloudPilot can fall
back to Internal behavior before OpenAI spend goes too far.

V1 scope:

```text
CloudPilot wants OpenAI
        ↓
checkSpendingLimit(userId, "openai")
        ↓
 allowed?
 /     \
yes     no
 ↓       ↓
OpenAI  Internal
```

This is **not** a general billing platform.  
This is **not** AWS service shutdown logic.  
This is a small product layer for **CloudPilot spending decisions**.

## Current step

**Plan locked — awaiting Step 1.**

## Next

Say **do Step 1** when ready to create the safety table and the first OpenAI row.

**Status:** Active  
**Codename:** `cloudPilotSafety`  
**Related:** [Current Development](./current_development.md) · [AI Spending](../finished/feature_ai_spending.md) · [CloudPilot Context](../finished/feature_cloud_pilot_context.md) · [Use OpenAI Chat](../how_to/use_openai_chat.md)

---

## Goal (one sentence)

Prevent CloudPilot from making OpenAI calls when the configured spend limit for
the `openai` service says it should stop, while keeping all existing Internal
fallback behavior understandable and centralized.

---

## V1 boundaries

**In:**

- One generic safety table with **OpenAI as the first service**
- One row for one user
- Warning threshold + hard limit
- One centralized gate before OpenAI requests
- If blocked: skip OpenAI and use existing Internal path
- If warning exceeded: still allow, but log / alert

**Out:**

- AWS spending enforcement
- Disabling AWS services
- Daily / weekly / per-team policies
- Currency / invoice reconciliation
- Historical safety-event tables
- Full admin UI
- A special one-off `openai_safety` table

---

## Locked design decisions

| Topic | Decision |
|-------|----------|
| Table name | `cloud_pilot_safety` |
| Scope | Generic **spending guardrail** table, not OpenAI-only table |
| First service | `openai` |
| Service switch | `spending_enabled` (per service, not global) |
| Spend source of truth | Existing AI Usage / `cloud_pilot_ai_usage` |
| Safety responsibility | Decide whether spend is allowed, not compute spend |
| Hard-limit behavior | Block OpenAI and fall back to Internal |
| Warning-limit behavior | Allow call, but log / alert |
| Product code home | `cloudPilot/spending/` |
| Decision owner | `cloudPilot/spending/checkSpendingLimit.js` |
| Enforcement point | `providers/openAI/client/openAIClient.js` |

---

## Table shape (V1)

Do **not** store `current_spend` as the source of truth here.

Use AI Usage for:

```text
How much have we spent?
```

Use Safety for:

```text
Given what we've spent, are we allowed to make another call?
```

### Recommended V1 table

```text
cloud_pilot_safety

id
user_id
service
spending_enabled
warning_limit
hard_limit
limit_period
action
created_at
updated_at
```

Example first row:

```text
user_id:          1
service:          openai
spending_enabled: true
warning_limit:    3.00
hard_limit:       5.00
limit_period:     monthly
action:           disable
```

Notes:

- `service` is generic: `openai`, later `aws_ec2`, `aws_s3`, `anthropic`, etc.
- `spending_enabled=false` for `openai` means CloudPilot is not allowed to spend
  money on OpenAI.
- This does **not** imply a future AWS service should be auto-disabled. It only
  means the spending-control policy for that service says “do not spend more.”

---

## Architecture

```text
AI Usage
  "spent $0.83 this month"
        │
        ▼
cloudPilot/spending/
  "warning $3 / hard $5"
        │
        ▼
Is another OpenAI call allowed?
   /                  \
 yes                  no
  ↓                    ↓
OpenAI              Internal
```

### Single gate rule

All OpenAI paths must go through the same check:

- General Chat
- Region Search
- Action Search
- Open Requests Search
- AI Spend Search
- future OpenAI-backed CloudPilot features

Do **not** implement spending logic separately in each capability.

---

## Folder shape

```text
cloudPilot/
└── spending/
    ├── checkSpendingLimit.js
    └── functions/
        └── spendingFunctions.js
```

Ownership:

```text
providers/openAI/usage/
        ↓
measures spend

cloudPilot/spending/
        ↓
decides whether spending is allowed

providers/openAI/client/openAIClient.js
        ↓
enforces the decision
```

---

## Code boundary

The spending logic should **not** live inside `providers/openAI/client/`.

Lock this split:

```text
cloudPilot/spending/checkSpendingLimit.js
    owns the decision

providers/openAI/client/openAIClient.js
    asks for the decision
    enforces the result
```

Reason:

- `cloudPilot/spending/` is a product concern, not a provider concern
- `openAIClient.js` is still the right lowest common enforcement point
- the boundary stays clean when later services are added

Conceptually:

```javascript
const safety = await checkSpendingLimit(userId, "openai");

if (!safety.allowed) {
    return blockedOpenAIResult();
}

return callOpenAI();
```

Where `blockedOpenAIResult()` is shaped so existing callers can cleanly keep or
use their Internal behavior rather than crashing or inventing answers.

---

## How fallback should work

If OpenAI is blocked:

```text
OpenAI requested
   ↓
Safety says no
   ↓
Return "blocked by safety" outcome
   ↓
Caller uses existing Internal path
```

Examples:

| Capability | If OpenAI blocked |
|-----------|--------------------|
| General Chat | Return Internal stub / fallback behavior |
| Region Search | Use internal region search |
| Action Search | Use internal action rules |
| Open Requests Search | Use internal question classify |
| AI Spend Search | Use internal question classify |

The important point is: **Safety blocks spend, not product behavior.**

---

## Alerts / logs

V1 only needs simple logging.

### Warning threshold

If current spend exceeds `warning_limit`:

- allow OpenAI
- log a warning
- optionally surface later in dashboard / admin tools

### Hard limit

If current spend exceeds `hard_limit`, or `spending_enabled=false`:

- block OpenAI
- log that Safety blocked the call
- return control to existing Internal fallback path

Do not build a separate alerts table yet unless a real product need appears.

---

## Steps

### Step 1 — Safety table + seed

- [ ] Add `cloud_pilot_safety`
- [ ] Seed one `openai` row for one user
- [ ] Keep this separate from `cloud_pilot_ai_usage`

### Step 2 — Read safety + usage

- [ ] Add `checkSpendingLimit(userId, service)`
- [ ] Put it under `cloudPilot/spending/`
- [ ] Read limits from `cloud_pilot_safety`
- [ ] Read spend from existing AI Usage summary / aggregate path
- [ ] Return a small decision object, e.g. `allowed`, `warning`, `reason`

### Step 3 — Central OpenAI gate

- [ ] Call `checkSpendingLimit()` from the single lowest common OpenAI call point
- [ ] Do not duplicate spending logic in five capability files
- [ ] Preserve existing Internal fallback behavior

### Step 4 — Warning / hard-limit behavior

- [ ] Warning exceeded → allow + log
- [ ] Hard limit exceeded → block + fall back to Internal
- [ ] `spending_enabled=false` → block immediately

### Step 5 — Offline verification only

- [ ] Verify blocked outcome shape without intentionally spending more on OpenAI
- [ ] Verify callers still use Internal when OpenAI is blocked
- [ ] Verify warning path logs but still allows the call

---

## Acceptance

| Input | Expect |
|------|--------|
| `openai` row enabled, spend below warning | OpenAI allowed |
| Spend above warning, below hard limit | OpenAI allowed + warning logged |
| Spend above hard limit | OpenAI blocked; caller falls back to Internal |
| `spending_enabled=false` for `openai` | OpenAI blocked immediately |
| No safety row found | Fail safe decision must be explicit in code (lock before coding) |

---

## One open decision before coding

Lock this explicitly:

```text
If there is no cloud_pilot_safety row for (user_id, service),
should CloudPilot default to ALLOW or BLOCK?
```

My recommendation for V1:

- **Default to ALLOW**
- log loudly that the row is missing

Why:

- It avoids surprising outages during rollout
- You are already introducing a hard-limit control path
- Missing configuration is easier to fix than mysterious feature shutdown

If you want stricter behavior later, change it intentionally after rollout.

---

## Design rule

> **AI Usage measures spend. Safety decides whether more spend is allowed.**

That separation keeps the system small, understandable, and extensible.
