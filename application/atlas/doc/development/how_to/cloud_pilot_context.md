# CloudPilot Context — Chat vs Search

**Status:** Development guide  
**Use when:** Adding or changing OpenAI context, Search/Question prompts, Chat Identity, CURRENT STATE, or anything that might invent AWS / request facts in General Chat.

**Related:** [Finished feature](../finished/feature_cloud_pilot_context.md) · [Add an Intelligence Capability](./add_intelligence_capability.md) · [Use OpenAI Chat](./use_openai_chat.md) · [Questions](../finished/feature_questions.md)

---

## One-sentence rule

> **Search understands language. CloudPilot owns truth. Chat communicates truth.**

| Path | OpenAI job | Context |
|------|------------|---------|
| **Search / Question** | Classify or extract | Tiny TASK + examples + current message + JSON |
| **CloudPilot** | (not OpenAI) | DB, Atlas, open requests — real facts |
| **General Chat** | Speak naturally | Identity + optional Knowledge + CURRENT STATE + question + history |

---

## Invariants (do not break)

```text
General Chat          → CloudPilot Identity (includeIdentity: true)
Region / Open Requests / AI Spend Search
                      → TASK prompt only (includeIdentity: false)
                      → includeCurrentState: false
                      → no Knowledge, no default conversation history
Action Search         → catalog + rules; not Chat Identity
```

- Search is **not** a miniature Chat.
- Chat Identity must **never** become the Search system prompt.
- CURRENT STATE for Chat is **factual data only** (e.g. open request label + waiting for). No prose like “the user is trying to…”.
- Questions that need AWS facts (`ec2_inventory`, `s3_inventory`, spend, open requests) must **not** fall through to General Chat inventing answers.
  Pattern: [Route inventory question → scan](./route_inventory_question_to_scan.md).

---

## Where the code lives

```text
cloudPilotIntelligence/context/
  contextTypes/cloudPilotContext.js           # Chat Identity data
  contextTypes/cloudPilotCurrentStateContext.js  # Chat CURRENT STATE (open request)
  buildContext.js                             # includeIdentity / includeCurrentState
  buildSystemMessage.js                       # writeIdentity / writeCurrentState / …

understand/search/
  values/searchMessageForRegion.js            # tiny Region TASK
  questions/searchForOpenRequests.js          # tiny Open Requests TASK
  questions/searchForAiSpend.js               # tiny AI Spend TASK
  questions/searchForEc2Inventory.js          # Question → scan_ec2 grounded path
  searchMessageForQuestion.js                 # Question orchestrator
  searchMessageForAction.js                   # Action catalog (not Chat Identity)

providers/openAI/client/openAIClient.js
  summarizeSearchTaskContext()                # logs: Identity Not Used · ✓ Task · …
```

---

## Plan for future work (follow this order)

When changing context behavior, keep steps small and separate:

### 1. Chat Identity only

- Edit `cloudPilotContext.js` + `writeIdentity` only.
- Prove Chat prompts offline (`buildAISystemMessage`) — **no live OpenAI smoke**.
- Confirm Search builders still use `includeIdentity: false`.

### 2. One Search / Question TASK at a time

For each OpenAI Search/Question:

1. Keep `shouldRun…Search` gate.
2. Build **standalone** TASK + EXAMPLES + CURRENT MESSAGE + JSON (do not route through Chat Identity / Knowledge).
3. Use `OpenAIClient.summarizeSearchTaskContext()` for logs.
4. Verify prompt shape offline only.

Semantic example (Region):

> Is the user **providing** a region for the current open request?  
> Ask / reject / mention → `{}`. Not “find any region string.”

### 3. Chat CURRENT STATE (facts)

- Only when an open request exists.
- Shape:

```text
CURRENT CLOUDPILOT STATE

Open request:
Scan EC2
Waiting for: region

Use this information only when relevant to the user's current question.
```

- When the open request is **`create_ec2`**, also attach create knowledge facts from
  `createEC2Context` (meaning, choice fields, demo default, pricing/security rules).
  Still facts only — not guidance walkthrough copy. See
  [Friendly Create EC2](../finished/feature_friendly_create_instance.md).
- Do not dump Request IDs, full collected blobs, or instruction essays.

### 4. Grounded Questions (AWS / product facts)

If the user asks for **account truth** (counts, spend, open requests):

```text
Classify (Question Search)
  → CloudPilot loads / runs Atlas / reads DB
  → speakKnown or Action/scan path
  → never General Chat inventing facts
```

Prefer a named Question (`ec2_inventory`, `ai_spend`, `open_requests`) even if fulfillment temporarily reuses an Action (`scan_ec2`).

**Do not** redefine every factual question as a “scan” forever — keep the Question concept.

---

## Forbidden while developing context

- Do **not** smoke-test by sending real or test messages to OpenAI from the agent.
- Verify with OpenAI **off / preview-only**: inspect built messages and logs locally.
- Do **not** build a giant universal context framework, history-aware extractors for every field, or a generalized Question framework unless a specific step requires it.

---

## Offline checks (preferred)

```text
node -e 'require builders; print system / TASK messages; assert no Identity on Search'
```

Accept shapes:

| Built for | Must have | Must not have |
|-----------|-----------|---------------|
| Chat | VOICE / CLOUDPILOT / GROUNDING | Mandatory why/risks/impact sections |
| Region Search | TASK, PROVIDING, EXAMPLES | `You are CloudPilot`, VOICE, Knowledge |
| Chat + open scan | `CURRENT CLOUDPILOT STATE` + Scan EC2 | Invented AWS counts |

---

## Quick decision tree

```text
Is this classifying / extracting?
  → Search or Question — tiny TASK

Is this answering with user-specific AWS / request / spend facts?
  → CloudPilot path (Question or Action) — not General Chat

Is this conversation / explanation / product help?
  → General Chat — Identity + optional CURRENT STATE
```
