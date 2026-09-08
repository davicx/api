# Feature Conversation

**Status:** Active  
**Codename:** `feature_conversation`  
**Last updated:** 2026-09-06  

**Related:** [Current Development](./current_development.md) · [contextTemp](../../contextTemp.md) · [CloudPilot Context how-to](../how_to/cloud_pilot_context.md) · [Feature Chat](../finished/feature_chat.md) · [MVP](../feature_mvp.md)

---

## Current step

**Step 2 done — Current State carries open-request DB facts.**  
**Next on other machine: Step 3 — does this message affect the open request?** (do not start until Step 2 is re-verified with the temp flag)

| Step | Goal | Status |
|------|------|--------|
| **1** | Prove open request exists? YES / NO | Done (temp test) |
| **2** | If YES: prove Current State has the useful DB facts | **Done** |
| **3** | If YES: does this message affect the open request? | Not started |
| **4** | Branch B / normal conversation when no open request | Not started |

Temp debug: `CLOUDPILOT_CURRENT_STATE_TEST=1` (early return after STEP 2; read-only).  
Unset / not `1` = normal CloudPilot pipeline.

---

## Architectural model (locked for this work)

**One conversation pipeline.** An open request runs *alongside* the conversation — not a separate restrictive “request mode.”

```text
                         USER MESSAGE
                              ↓
                    LOAD DATABASE STATE
                              ↓
                       OPEN REQUEST?
                              ↓
                   BUILD CURRENT CONTEXT
                              ↓
                 UNDERSTAND CURRENT MESSAGE
                              ↓
              Can answer questions / retrieve facts /
              start new work / normal conversation
                              +
                    IF OPEN REQUEST = YES
                              ↓
                 Does THIS message affect
                 the open request?
                              ↓
             information | confirm | cancel | leave alone
```

Unrelated questions must **not** cancel or advance the open request.  
Confirm-like language only advances when Current State says the request is ready for that.

Later interpretation (Step 3) needs trustworthy facts — that is why Step 2 exists.

---

## What changed (Step 2)

### Files

| File | Change |
|------|--------|
| `cloudPilotIntelligence/context/contextTypes/cloudPilotCurrentStateContext.js` | Explicit `hasOpenRequest`; richer `openRequest` |
| `cloudPilotIntelligence/context/buildSystemMessage.js` | `writeCurrentState` renders action, status, collected, missing |
| `cloudPilot/chat/cloudPilotMessageFunctions.js` | Temp test builds Current State and returns a readable snapshot |

### Current State shape (now)

**Open request:**

```js
{
  hasOpenRequest: true,
  openRequest: {
    id: 69,                          // workflowId when present
    action: 'scan_ec2',
    label: 'Scan EC2',
    status: 'waiting_on_confirmation',
    collected: { region: 'us-west-2', request_name: 'MVP Prep' },
    missing: []
    // executionMode when set
    // waitingFor: alias of missing when non-empty (compat)
  }
}
```

**No open request:**

```js
{
  hasOpenRequest: false,
  openRequest: null
}
```

Source of truth remains DB / STEP 2: `getUsersActionState` → `Boolean(pendingAction)`.  
Still **not** OpenAI.

### System message excerpt (General Chat)

When Current State is included, OpenAI can see:

```text
CURRENT CLOUDPILOT STATE

HAS OPEN REQUEST: YES

Open request:
Action: Scan EC2 (scan_ec2)
Status: waiting_on_confirmation
Collected:
- region: us-west-2
Missing: none
```

### Temp test reply (`CLOUDPILOT_CURRENT_STATE_TEST=1`)

After STEP 2 only (no understand / decide / execute):

```text
Open request: YES

Type: scan_ec2
Action: Scan EC2
Status: waiting_on_confirmation
Collected:
- region: us-west-2
Missing: none
```

or:

```text
Open request: NO
```

---

## Manual checks

With `CLOUDPILOT_CURRENT_STATE_TEST=1` and API restarted:

1. **No open request** → send `hello` → `Open request: NO`
2. **Open Scan EC2**, region filled, waiting on confirm → send `hello` → YES + status + collected region + Missing: none

Unset the env (or anything other than `1`) to restore the normal pipeline.

---

## Explicitly not done yet

- Interpreting `"lets do that"` / `"yes"` against the open request  
- Leaving open request untouched during unrelated Q&A (needs Step 3)  
- Redesigning General vs Request Conversation split  
- Identity / Situation / Knowledge / Current Question changes  
- Removing the temp early-return flag  

---

## Longer roadmap (Phases 1–6)

The original “better conversation → tools → broader AWS → memory → safe actions → production” phases remain below for later. **Do not start Phase 2 tools work until the Current State → interpretation steps above are solid.**

---

# Phase 1 — MVP: Better Conversation (later / parallel polish)

**Goal:** Make CloudPilot feel much more natural, useful, and coherent with the infrastructure knowledge it already has.

### Model / OpenAI

* [ ] Move general conversation from `gpt-4o-mini` to a stronger current model
* [ ] Move general conversation to the Responses API
* [ ] Keep the existing deterministic AWS questions/actions working
* [ ] Do **not** redesign the entire AWS retrieval architecture yet

### Conversation quality

* [ ] Clean up the system/developer prompt
* [ ] Remove the duplicated current user message from the system prompt
* [ ] Keep permanent CloudPilot behavior/instructions separate from dynamic AWS context
* [ ] Make responses more conversational and less like generated reports
* [ ] Let the model naturally explain, compare, summarize, and answer follow-ups when it has enough information
* [ ] Make uncertainty explicit when CloudPilot does **not** have enough AWS information

### Conversation memory

* [ ] Improve beyond the simple “last 12 database rows” approach
* [ ] Preserve enough recent conversation for natural follow-ups
* [ ] Keep track of the current subject/resource when practical
* [ ] Avoid treating old AWS facts from conversation history as guaranteed current truth
* [ ] Make conversation continuity consistent across the main chat paths

### Existing context

* [x] Enrich Current State with open-request DB facts (`hasOpenRequest`, status, collected, missing)
* [ ] Continue supplying known AWS facts from the existing CloudPilot system
* [ ] Preserve the current grounding rules: don't invent resources, findings, costs, or state
* [ ] Preserve existing organization-knowledge behavior
* [ ] Preserve selected-finding allowlists
* [ ] Keep deterministic operations for questions CloudPilot already knows how to answer

### Basic validation

* [ ] Create ~10–20 realistic CloudPilot conversations
* [ ] Include follow-ups such as:

  * “What EC2 instances do I have?”
  * “Which ones are stopped?”
  * “Tell me more about that one.”
  * “Is that costing me anything?”
  * “What should I fix?”
  * “Why?”
* [ ] Compare old vs. new conversation quality
* [ ] Verify CloudPilot doesn't confidently invent missing AWS information

**Phase 1 success = CloudPilot feels substantially more like talking to ChatGPT, while keeping roughly the infrastructure capabilities it already has.**

---

# Phase 2 — AI Can Investigate AWS

**Goal:** Stop requiring CloudPilot to predict every possible infrastructure question beforehand.

* [ ] Add model tool/function calling
* [ ] Start with EC2 only
* [ ] Small read-only tool set (`search_resources`, `get_resource_details`, `get_cost_data`, `get_findings`, …)
* [ ] Multiple tool calls per turn; structured AWS data; freshness / scope
* [ ] Tools strictly read-only

**Phase 2 success = the AI can decide what infrastructure information it needs and retrieve it itself.**

---

# Phase 3 — Broader Infrastructure Understanding

**Goal:** Expand the successful EC2 pattern across AWS (S3, RDS, Lambda, networking, billing, findings, relationships, …).

---

# Phase 4 — Better Memory & Organizational Knowledge

**Goal:** Ongoing conversation subject + separate infrastructure truth + richer org knowledge.

---

# Phase 5 — From Answers → Safe Actions

**Goal:** Connect conversational intelligence to existing controlled remediation (confirm / modes / verify / undo).

```text
AI READ → fairly autonomous
AI CHANGE → CloudPilot authorization + safety controls
```

---

# Phase 6 — Production Quality / Scale

**Goal:** Eval suite, groundedness, cost/latency, security, telemetry.

---

## Roadmap order

```text
NOW — Context rebuild (existence → facts → interpretation → action)
        ↓
PHASE 1 polish — model / prompt / history quality
        ↓
PHASE 2 — AI retrieves EC2 itself
        ↓
PHASE 3–6 — broader AWS, memory, safe actions, production
```
