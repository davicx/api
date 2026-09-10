# Feature Conversation

**Status:** Active  
**Codename:** `feature_conversation`  
**Last updated:** 2026-09-08  

**Related:** [Current Development](./current_development.md) · [contextTemp](../../contextTemp.md) · [CloudPilot Context how-to](../how_to/cloud_pilot_context.md) · [Feature Chat](../finished/feature_chat.md) · [MVP](../feature_mvp.md)

---

## Current step

**Step 2 done — Current State carries open-request DB facts.**  
**Architecture inspection + Capability/Scope notes recorded.**  
**Step 3 started — open-request effect interpretation (affect / leave alone / mixed).**  
**MVP AWS default region (locked): `us-west-2`** — no team/org/multi-region scope engine.

| Step | Goal | Status |
|------|------|--------|
| **1** | Prove open request exists? YES / NO | Done (temp test) |
| **2** | If YES: prove Current State has the useful DB facts | **Done** |
| **3** | If YES: does this message affect the open request? | **In progress** |
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

# Architecture inspection (2026-09-08) — DO NOT CODE YET

Inspection only. No refactor, no agents, no multi-request support, no schema/prompt/bug fixes in this pass.

## High-level target (product)

```text
EVERY USER MESSAGE
    ↓
1. Load database state
    ↓
2. Open request? YES / NO   (DB — not OpenAI; MVP max one open request)
    ↓
3. Understand current user message
    ↓
4. Retrieve allowed read-only facts if needed
    ↓
5. Update / execute request state only when appropriate
    ↓
6. Build five contexts
    ↓
7. Generate one natural response
```

**Database = source of truth for request state.**

### Open request = YES — not a separate restrictive mode

Normal conversation still works. Determine whether **this message** affects the open request.

| User message (open: Scan EC2, waiting for region) | Desired |
|---------------------------------------------------|---------|
| `use us-west-2` | Update region; check readiness |
| `what is DynamoDB?` | Answer normally; **leave request untouched** |
| `use us-west-2 and also what is DynamoDB?` | Update request **and** answer DynamoDB in **one** natural reply |

Eventually (not now): provide / correct info, confirm, cancel, ask about request, unrelated questions — same turn possible.

### Open request = NO

Normal conversation: general Q&A and detect new requests (e.g. “scan my EC2”). Do not redesign new-request handling yet.

### Read-only capabilities vs requests

| | Meaning |
|--|---------|
| **REQUEST** | Work CloudPilot is managing / changing / explicitly executing |
| **READ CAPABILITY** | Quiet retrieve to answer a question (inventory, AI usage, billing, open requests, …) |

Example: “How many S3 buckets?” → need S3 inventory capability → retrieve facts → context → answer. **Do not** auto-create a “Scan S3” open request just to answer.

MVP clarification: use org/default region if reliable; else one short ask; never invent region; no multi-region intelligence yet.

### Five contexts (keep)

1. Identity · 2. Situation · 3. Knowledge · 4. Current State · 5. Current Question  

App owns truth/state; OpenAI understands language and writes the response. Gather facts first → one coherent context → one reply.

### Future multiple requests (do not build)

Avoid architecture that *permanently* assumes one forever. Later: named requests + clarification when “use us-west-2” is ambiguous. **Not now.** MVP stays max one open request.

---

## Inspection answers (current code vs target)

### 1. Message flow: `messages.js` → final response

```text
postMessage (atlas/logic/messages.js)
  → save user message
  → processMessage (cloudPilot/chat/cloudPilotMessageFunctions.js)
      → getCurrentUserMessage
      → getUsersActionState          // STEP 2 — DB open request
      → CloudPilotIntelligence.understandMessage
      → decideNextStep
      → IF GENERAL_CHAT_RESPONDING:
            GeneralConversation.conversation
              → prepareGeneralMessageReply → generateGeneralMessageReply
      → ELSE (CLOUD_PILOT_RESPONDING):
            RequestWorkflow.store
            (optional preflight)
            RequestWorkflow.execute
            RequestConversation.conversation
      → attach undo / atlas payload
  → save CloudPilot message
  → res.json
```

Temp: `CLOUDPILOT_CURRENT_STATE_TEST=1` short-circuits after STEP 2.

### 2. Where open request state is loaded

| Layer | Location |
|-------|----------|
| Pipeline | `processMessage` → `RequestStateFunctions.getUsersActionState(conversationID)` |
| Load | `requests/functions/requestLoadFunctions.js` → `getUsersActionState` |
| SQL | `Request.getOpenActionForConversation` — `is_open = 1 LIMIT 1` |
| Shape | `pendingAction`, `status`, `executionMode`, `workflowId`, `collected`, `missing`, `asked` |

**DB, not OpenAI.** MVP already max one open row per conversation.

### 3. Where request vs general conversation diverge

Primary gate: `decideNextStep` → `chatType`

- `GENERAL_CHAT_RESPONDING` → general path (skip store/execute)
- `CLOUD_PILOT_RESPONDING` → request path (store / execute / request speak)

Fork lives in `processMessage` after decide (+ question guardrail may rewrite general → question decision).

### 4. Can normal conversation continue cleanly while an open request exists?

**Partially — not cleanly / not by target design.**

Can reach general chat with an open request when understanding has no actionable action, no applicable values, no question, no confirm/cancel/mode reply, and status is not RUNNING / resource-scan waiting → `buildGeneralChatDecision()`; Current State can appear in the general system prompt.

**Does not continue cleanly when:**

- Same action rematched → re-prompt request chat, skip general
- Values in message → merge into open request
- Confirm/cancel/mode phrases → advance/close request
- Different new action → replace open request
- `ec2_inventory` / `s3_inventory` questions → **new scan request** (can replace open)
- `inventory_aws` / `show_billing` while open non-terminal → **blocked**
- Soft “yes” while waiting confirmation → may start execution

### 5. Where understanding checks signals

`understandMessage` (`cloudPilotIntelligence/understand/understandMessage.js`):

| Signal | Search |
|--------|--------|
| Values (region, …) | `searchMessageForValues` (uses `requestState`) |
| Confirm / cancel / mode | `searchMessageForReply` |
| Conversation commands | `searchMessageForConversation` |
| Questions | `searchMessageForQuestion` (open_requests → ai_spend → ec2_compute_cost → ec2_inventory → s3_inventory) |
| New / rematched actions | `searchMessageForAction` (**Current State excluded** from OpenAI classify) |

Interpretation of those signals is in **`decideNextStep`**, not understand.  
**There is no explicit “does this message affect the open request?” gate.**

### 6–7. Read-only capability–like paths today

| Capability | How it runs | Creates request? | Into five-context Current State? |
|------------|-------------|------------------|----------------------------------|
| Open requests Q | Known reply from loaded `requestState` | No | N/A (answers from state) |
| AI usage / spend Q | Immediate execute `show_ai_usage` | No | No — reply/atlas only |
| Billing (`show_billing`) | Immediate execute | No | No |
| AWS inventory phrase (`inventory_aws`) | Immediate execute | No | No |
| EC2 inventory natural Q | **`buildNewRequestDecision(scan_ec2)`** | **Yes** | Only after request row exists |
| S3 inventory natural Q | **`buildNewRequestDecision(scan_s3)`** | **Yes** | Same |
| EC2 compute cost Q | Known reply (pricing tables) | No | No |

**Critical gap vs target:** “How many S3 buckets?” is treated like starting Scan S3 work, not a quiet read capability. Read results are **not** folded into a shared turn-facts context for later interpretation — they become that turn’s reply.

Immediate reads (`inventory_aws`, `show_billing`) are **suppressed** when a non-terminal open request exists.

### 8. How Current State is built

`cloudPilotIntelligence/context/contextTypes/cloudPilotCurrentStateContext.js` → `buildCurrentStateContext`  
Assembled in `buildAIContext` / rendered in `buildSystemMessage.writeCurrentState`.

```js
// Open
{ hasOpenRequest: true, openRequest: { action, label, status, collected, missing, id?, executionMode?, waitingFor? }, createEc2? }

// Closed
{ hasOpenRequest: false, openRequest: null }
```

Source: already-loaded STEP 2 `requestState` (no second DB trip in the builder).

### 9. Who sees Current State today

| Consumer | Current State five-context block? |
|----------|-----------------------------------|
| General chat final reply | **Yes** |
| Action classification (OpenAI) | **No** (`includeCurrentState: false`) |
| Understand / decide | Raw `requestState` object — not the five-context block |
| Request final response | **No** — templates / SPEAK FACTS / different stack |
| Question / immediate execute | Handler facts or `requestState`, not Current State context object |

### 10. Smallest architectural gap vs target

```text
TARGET:  load → open YES/NO → understand → affect? (leave alone OK) → read facts → update only if appropriate → five contexts → one response

TODAY:   load → understand signals → decide binary chatType → General OR Request (store/execute/speak)
         five contexts mainly on General path; request path is a parallel presentation system
```

| Target step | Status |
|-------------|--------|
| Every message / load DB | Exists |
| Explicit OPEN YES/NO for routing | Weak — flag exists; not an interpretation gate |
| Understand | Exists |
| Affect open request without blocking normal chat | **Missing (Step 3)** |
| Allowed read without replacing/blocking request | **Partial** (spend/billing/inventory_aws immediate; EC2/S3 inventory create requests) |
| Update/execute only if appropriate | Heuristic only |
| Five contexts → one response | **Partial** (general yes; request path parallel) |

---

## Inspection summary

### 1. What already exists

- End-to-end turn: `postMessage` → `processMessage` → understand → decide → general **or** request → save reply  
- Open request from MySQL (`getUsersActionState` / `getOpenActionForConversation`) — max one  
- Understanding taxonomy: Action / Value / Reply / Conversation / Question  
- Decision layer: confirm, cancel, modes, field merge, new request, immediate execution, general chat, questions  
- Request store/execute workflow  
- Current State with open-request facts; wired into **general** chat system messages  
- Some read-ish behaviors (open-requests Q, AI spend, billing/inventory immediate, compute-cost Q)  
- Five-context scaffolding for general chat  

### 2. What is missing

- Explicit **“does this message affect the open request?”** (affect / confirm / cancel / **leave alone**)  
- True **one response** path that always builds five contexts (request speak is parallel)  
- Read capabilities that **never** replace/block an unrelated open request (esp. EC2/S3 inventory questions)  
- Feeding read results into turn context for interpretation (not only into the reply)  
- Situation often unused; Knowledge limited on general reply  
- Temp `CLOUDPILOT_CURRENT_STATE_TEST` still present  

### 3. What currently causes the request / general-chat conflict

1. **Binary fork** after decide — request mode re-asks instead of “leave alone + answer”  
2. **Action rematch** on soft language while same request is open  
3. **Value merge** treating incidental fields as request updates  
4. **Confirm/cancel** phrase matching without a dedicated affect/readiness gate  
5. **Inventory questions** → `buildNewRequestDecision` → close/replace open request  
6. **Immediate reads** blocked while a non-terminal open request exists  
7. **New different action** always replaces the open request (one-open policy)  

### 4. SINGLE smallest next implementation step

**Implement Step 3:** after STEP 2 load + Current State facts, add an explicit  
**“does this message affect the open request?”** decision  
(`affect` / `confirm` / `cancel` / `leave alone`)  

Route **`leave alone`** to normal conversation / question fulfillment **without mutating** the open request.

Insertion point: between `understandMessage` and today’s aggressive branches in `decideNextStep` (or a thin helper called from `decideNextStep` when `pendingAction` is set), consuming Current State readiness so confirm only advances when status allows it.

Do this **before** broader tools/read redesign or removing the general-vs-request conversation split.

**STOP here until Step 3 is intentionally started.**

---

## Capability + Scope (aligned — do not build a generic scope engine yet)

**Yes — this aligns** with the inspection target (REQUEST vs READ CAPABILITY, clarification MVP, five contexts, one coherent reply). Capture it as a high-level product/architecture concept now; keep MVP implementation small.

### Separation

| Concept | Question it answers | Examples |
|---------|---------------------|----------|
| **Capability** | What can CloudPilot do? | Scan EC2, View S3 inventory, OpenAI spend, Pause EC2 |
| **Scope** | Against what should it do that? | org / team / account / region / instance / time period |

Do **not** bury workflow mechanics inside “what am I capable of.”  
Do **not** put operational scope inside **Identity** (who CloudPilot is). Scope belongs with **Current State / organization context** (and per-turn overrides).

### Example catalog (conceptual)

| Capability | Type | Scope it may need |
|------------|------|-------------------|
| Scan EC2 | Read (managed request today) | account/team + region |
| Scan S3 | Read (managed request today) | account/team, maybe region |
| View EC2 / S3 inventory | Read (quiet) | account/team + region |
| Get OpenAI Spend | Read | organization/team + time period |
| Get AWS Spend | Read | account/team + time period |
| Pause / Resume EC2 | Change | account/team + region + instance |
| Update EC2 Tag | Change | account/team + region + instance |
| Create EC2 | Change | account/team + region + configuration |

Type here is product language (**Read** vs **Change**). That is related to—but not identical to—today’s code split (`requiresWorkflow`, immediate execute, question handlers). Inventory-as-question vs Scan-as-request is exactly the gap called out in the inspection.

### Capability then scope

```text
USER: Scan EC2.          → CAPABILITY
USER: Just my team.      → SCOPE
USER: Only us-west-2.    → SCOPE

USER: Scan our team's EC2 instances in us-west-2.
→ CAPABILITY: Scan EC2
→ SCOPE: Team = user's team, Region = us-west-2
```

Defaults + one clarification when scope matters and is unknown — do not ask every time.

```text
Organization: Kite
Team: Platform
Default AWS region: us-west-2
```

`"Only check us-east-1 this time"` overrides for that operation without changing org default.

### Conceptual CURRENT SCOPE (later)

```text
CURRENT SCOPE
Organization: Kite
Team: Platform
AWS Account: Production
Region: us-west-2
```

Capabilities consume scope; not Identity.

### MVP — keep deliberately smaller

**Do not build a generic scope engine now.**

MVP catalog (product list, not a new subsystem):

```text
CLOUDPILOT CAPABILITIES

AWS
• Scan EC2 / Scan S3
• View EC2 inventory / View S3 inventory
• View AWS spend

AI
• View OpenAI spend

EC2 Changes
• Pause / Resume / Create / Delete EC2
• Update EC2 tags
```

Each capability declares a few needs (conceptual):

```text
Scan EC2        needs: region
Pause EC2       needs: region, instance
OpenAI Spend    needs: (nothing for MVP)
```

If required scope is known from trustworthy context → use it.  
If missing and necessary → **one** short clarification. Never invent region.

Multi-capability same turn (later polish, not Step 3 blocker):

```text
User: Scan EC2 for my team in us-west-2, and how much have we spent on OpenAI?

Capability 1: Scan EC2     Scope: team + us-west-2
Capability 2: OpenAI Spend Scope: team
→ gather → one coherent OpenAI response
```

### How this maps to code today (alignment check)

| Idea | Today | Gap |
|------|-------|-----|
| Capability list | Roughly `actionMap.js` + question searches | No single product “capability catalog”; inventory Q ≠ quiet read |
| Needs / required fields | `requiredFields` on actions (e.g. region) | Exists for workflow actions; not unified for quiet reads |
| Scope defaults | Org knowledge / env / collected fields — partial | No explicit CURRENT SCOPE context object |
| Scope in Identity | Identity is who CloudPilot is | **Agree: do not put team/region scope in Identity** |
| Read vs Change | Immediate execute vs `requiresWorkflow` vs questions | Inventory questions still create/replace **requests** |

### Relationship to next step

**Step 3** (affect open request?) is the active code step.  
Capability + Scope remains the **north-star abstraction** for later catalog / quiet reads / defaults — document now, implement small later. Do not start a generic scope engine before Step 3 is solid.

### MVP default AWS region (locked 2026-09-08)

```text
region = us-west-2
```

When a future quiet AWS read needs a region and the user did not specify one, assume `us-west-2`.  
Do **not** build team / org / account / multi-region clarification as part of Step 3.

Constant: `interpretOpenRequestEffect.js` → `MVP_DEFAULT_AWS_REGION` (recorded for later reads; Step 3 does not invent quiet S3/EC2 inventory redesign).

---

## Step 3 — Open request effect (implementation notes)

**Insertion:** after `understandMessage`, before `decideNextStep` (`cloudPilotMessageFunctions.processMessage`).

**Files:**

| File | Role |
|------|------|
| `cloudPilot/requests/interpretOpenRequestEffect.js` | Interpretation: affect / information / confirm / cancel / leave alone |
| `cloudPilot/chat/cloudPilotMessageFunctions.js` | Attach effect, log, apply info merge when continuing normal conversation |
| `cloudPilot/requests/decideNextStep.js` | Gate confirm/cancel/rematch; mixed → general/question without swallowing turn |

**Behavior:**

- Open request is background state, not a restrictive mode.
- `affectsOpenRequest` does **not** send the entire message into request-only workflow.
- Mixed: update applicable values (e.g. region) **and** continue general/question on the same original message.
- Confirm only when status is waiting on confirmation (and mode rules allow).
- Soft “yes” / “let’s do that” when **not** waiting on confirmation → leave alone.

**Log:**

```text
OPEN REQUEST EFFECT
affects: YES|NO
type: information|confirm|cancel
values:
  region: us-west-2
```

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
