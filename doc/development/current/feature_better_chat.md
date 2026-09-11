# CloudPilot — Scan Conversation MVP

I want to simplify CloudPilot's conversation system and focus on getting **two capabilities working extremely well first**:

* Scan S3
* Scan EC2

The goal is not to add more features right now. The goal is to make conversation around these two capabilities feel natural, predictable, safe, and easy to debug.

Please **inspect the existing implementation before making changes**. Do not start a large refactor or build a generalized scope/agent framework. I want small, understandable changes.

---

# Locked decisions (inspection complete — not implemented yet)

## Master capabilities file

Rename **`actionMap.js` → `masterCloudPilotCapabilities.js`** when coding starts.

**Status (this slice):** Done — file renamed; JS requires updated. Docs may still say `actionMap` historically.

- This is a **rename of the existing registry**, not a second catalog.
- “Master” = high-level application source of truth for what CloudPilot can do (actions, handlers, fields, `cloudPilotCanAnswer`, orchestration metadata).
- Do **not** invent a parallel capabilities registry.
- Atlas remains implementation truth (scanners); the master only claims facts that survive **AWS → Atlas → formatter → API → conversation**.

## Sixth context type: Capabilities

Do **not** fold capabilities into Situation or Identity.

```text
Identity          → Who is CloudPilot?              cloudPilotContext.js
Capabilities      → What can I do / retrieve?       cloudPilotCapabilitiesContext.js  ← NEW
Situation         → What should I look for now?     cloudPilotSituationContext.js
Current State     → What is happening right now?    cloudPilotCurrentStateContext.js
Current Question  → What did the user just say?     currentQuestionContext.js
Knowledge         → Org/product facts               organizationKnowledgeContext.js
(+ Conversation History — separate; not a contextType file)
```

Pipeline:

```text
masterCloudPilotCapabilities.js
        │  MASTER APPLICATION SOURCE OF TRUTH
        ↓
cloudPilotCapabilitiesContext.js
        │  projects ONLY model-relevant fields
        ↓
buildContext.js  (includeCapabilities on/off)
        ↓
buildSystemMessage.js
        ↓
OpenAI
```

Do **not** dump raw master fields into the model (`match`, `executionFunction`, `messages`, etc.).

Render order: **Identity → Capabilities → Situation → Current State → Current Question → Knowledge**  
(Capabilities before Situation.)

## Locked `cloudPilotCanAnswer` (truthful)

**EC2 — Scan EC2**

```js
cloudPilotCanAnswer: [
  "instance identity and name",
  "instance state",
  "instance type",
  "tags",
  "region",
  "average CPU utilization",
  "estimated On-Demand compute cost when a stored rate exists"
]
```

Scope: regional; MVP default region `us-west-2`.  
Do **not** advertise IP or launch information yet.

**S3 — Scan S3**

```js
cloudPilotCanAnswer: [
  "bucket names",
  "tags",
  "bucket region",
  "default encryption",
  "versioning",
  "public access signals",
  "lifecycle rules",
  "access logging"
]
```

Scope: **account-wide** bucket inventory (not region-filtered).

## Known MVP cleanup (defer)

`scan_s3` still has workflow `requiredFields: ['region']` even though inventory is account-wide.  
Do not describe S3 results as region-filtered. Revisit removing region as required **after** conversation/state behavior is stable.

## MVP context switches (experiment)

```text
Identity            ✓
Capabilities        ✓ NEW
Situation           ✓
Current State       ✓
Current Question    ✓
Knowledge           ✕ off for this experiment
Conversation History ✓ small (try 4–6 messages)
```

Always include: *Do not invent AWS services, actions, or facts outside this capabilities list.*

Assembly / toggles live in `buildAIContext` (`buildContext.js`) + history env flags. Extend that layer for `includeCapabilities` when coding — not a new framework.

## "What can you do?" (already exists — keep)

Phrase like **"What can you do?"** maps to action `show_capabilities` in the master registry (`actionMap.js` → later `masterCloudPilotCapabilities.js`).

- Match phrases include: `what can you do`, `what do you do`, `what are your capabilities`, `help`, etc.
- Response is built from the **live allowed action catalog** (`buildCapabilitiesCatalog` / `capability.section` + `capability.description` on each action).
- Internal = deterministic bullets; OpenAI (`CLOUDPILOT_MESSAGE_RESPONSE=openai`) = natural rephrase of the **same grounded catalog** (no inventing).
- This is **not** General Chat inventing a list — CloudPilot owns the facts.

Desired shape (natural):

```text
I can:
- Scan your S3 buckets
- Scan your EC2 instances
- Create a new instance
- …
```

Same master source of truth as the future `cloudPilotCapabilitiesContext` projection. When the master is honest (MVP Scan S3/EC2 + other `allowed` actions), this answer stays honest.

OpenAI message logs: keep the readable `formatOpenAIMessagesForLog` dump (real newlines, not `\n` escapes).

---

# Inspection: AI-call pipeline + `masterContext/` (no files created)

## Verdict (style / organization)

You are identifying a real layer — **“for this AI call, which ingredients?”** — but **most of it already exists under another name**, incomplete and uneven.

Today you effectively have:

| Layer | Today | Your mental model |
| ----- | ----- | ----- |
| Ingredients | `context/contextTypes/` | same |
| Per-call packaging | `context/operationContext/get*SearchContext.js` | half of “recipe” (task purpose / catalog / examples) |
| Ingredient assembly | `buildAIContext(options)` | builds selected blocks |
| Render | `buildSystemMessage.js` | same |
| History | **global** `OPENAI_SEND_CONVERSATION_HISTORY` + limit — only wired in **General Chat** | should be per-call recipe |

What is **missing** is not a brand-new idea — it is making **one consistent recipe object** that owns:

```text
includeIdentity / Capabilities / Situation / Current State / Knowledge
+ conversationHistory { include, limit }
+ situationTypes (when Situation is on)
```

…and having **every OpenAI-capable call** go through that path.

Right now some calls use `buildAIContext` flags, some invent their own TASK prompts in adapters, and history is a global env only General Chat reads. That is why it feels like a missing “master” layer even though `operationContext/` already exists.

**Naming preference (locked directionally, not coded):**  
`masterContext/` fits your “master = high-level” language better than `operationContext/` for the **recipe** role.  
Do **not** create a third parallel prompt system. Either:

1. Evolve `operationContext/` → thin recipes that call `buildAIContext` + history, **or**
2. Introduce `masterContext/` as recipes and keep `operationContext/` only if still needed for Internal/OpenAI shared **task payloads** (catalog, examples, outputFormat).

Smallest useful set comes from **real calls below** — not inventing four files tomorrow.

---

## 1. Every place an AI request can happen in one user message

One turn = `processMessage` → `understandMessage` (multiple searches) → decide → speak (General **or** Request Message Reply).

### Understand phase (can run several searches; OpenAI only if feature env = `openai` **and** master AI on)

| Call site | Question it answers | OpenAI today? |
| ----- | ----- | ----- |
| `searchMessageForRegion` | Did the user provide/change a region for the open request? | Optional (`CLOUDPILOT_REGION_SEARCH`) — only when open request needs region |
| `searchMessageForAction` | Does this message map to an approved action? | Optional fallback when Internal finds nothing (`CLOUDPILOT_ACTION_SEARCH`) |
| `searchForOpenRequests` | Is this an open-requests question? | Optional classify |
| `searchForAiSpend` | Is this an AI-spend question? | Optional classify |
| `searchForOrganizationalKnowledge` | Is this an org-knowledge question / extract ref? | Optional (also used when attaching knowledge for General Chat) |
| `searchForEc2Inventory` / `S3` / `Ec2ComputeCost` | Inventory / cost question classify | **Internal only** today |
| Name / instance id / type / tags / reply / conversation | Value / signal extract | **Internal only** (no OpenAI) |

### Speak phase (at most one of these owns the user-facing wording)

| Call site | Question it answers | OpenAI today? |
| ----- | ----- | ----- |
| `generateGeneralMessageReply` | What should CloudPilot say in general chat? | Optional (`CLOUDPILOT_MESSAGE_RESPONSE`) — uses `buildAIContext` + **history** |
| `generateRequestMessageReply` | Rephrase Request Conversation template without inventing facts? | Optional polish — **custom TASK**, no `buildAIContext`, **no history** |

Questions (ec2_inventory, s3_inventory, …) are guarded away from inventing via General Chat; they answer from CloudPilot/Atlas facts, not MESSAGE_RESPONSE.

**Scan S3 / Scan EC2 conversation** typically touches: Region (while collecting) → Action (new request) → Request Message Reply (fields / confirm) → later General Chat for freeform / “what can you do?” style turns. Inventory questions are separate Internal classify paths.

---

## 2–4. What each receives today vs what it actually needs

### Region Search

- **Today:** `getRegionSearchContext` → custom `TASK` / EXAMPLES system prompt. No Identity, Capabilities, Situation contextType, Current State, Knowledge, history.
- **Needs:** Current Question + Situation(region) + maybe slim Current State (so it knows region is being collected). Capabilities / Identity / Knowledge / history usually **off**.
- **Gap:** Situation `region` piece already exists in `cloudPilotSituationContext.js` but Region OpenAI **does not use** `buildAIContext` / Situation — it duplicates purpose in `operationContext`.

### Action Search

- **Today:** `getActionSearchContext` (catalog + purpose) + `buildAIContext` with `includeIdentity/CurrentState/Knowledge: false` (so basically Current Question only). Catalog rules duplicated again in the user message. No Situation. No history. Capabilities not projected as contextType (catalog is a side channel).
- **Needs:** Current Question + Capabilities (or catalog projection) + Situation(action_search) + maybe Current State. Identity / Knowledge / history **off**.
- **Gap:** Closest existing “recipe” already — just incomplete and catalog not going through Capabilities contextType.

### Request Message Reply (confirmation / missing fields polish)

- **Today:** `getRequestMessageReplyContext` facts + giant presentation TASK. No shared contextTypes. History off (correct).
- **Needs:** Mostly **facts + speak rules** (not full Identity/Capabilities brain). Current State facts are already in the reply context. Optional tiny Identity. Capabilities usually unnecessary if template owns truth. History **off**.
- **Gap:** Parallel prompt system; should stay narrow — may remain a special recipe that does **not** dump full chat context.

### General / Final response (`generateGeneralMessageReply`)

- **Today:** `buildAIContext(context)` defaults → Identity + Current State + Current Question + Knowledge (on by default) + Situation only if `situationTypes` passed (**usually none**). History from **global** env (default limit **12**). No Capabilities yet.
- **Needs (MVP experiment):** Identity + Capabilities + Situation + Current State + Current Question; Knowledge **off**; history **4–6**.
- **Gap:** This is the natural `masterFinalResponseContext` recipe. History should move from “global only” into this recipe (env can remain default ceiling).

### Question classifiers (open_requests, ai_spend, org knowledge)

- **Today:** Own `operationContext` + custom OpenAI adapters; history off.
- **Needs:** Narrow Situation + Current Question; usually no Identity/Capabilities/history.
- **MVP Scan S3/EC2:** not the first recipes to invent unless you are debugging those questions.

---

## 5. Grouping under the same master recipe

Recommended grouping from **real** calls:

| Recipe (conceptual) | Covers |
| ----- | ----- |
| **Final response** | `generateGeneralMessageReply` only (the “talk to the person” call) |
| **Action search** | `searchMessageForAction` OpenAI path |
| **Region search** | `searchMessageForRegion` OpenAI path |
| **Request speak / polish** | `generateRequestMessageReply` — keep separate; it is rephrase-facts, not reason-with-full-brain |
| **Question classify** (later, one shared pattern) | open_requests / ai_spend / org_knowledge — same shape; do not create three masters tomorrow |

Do **not** invent `masterRequestUpdateContext` until inspection shows a dedicated AI call for it (field updates today are mostly Internal extract + DB).

---

## 6. Recommended `masterContext/` structure (smallest useful)

Based on Scan S3 + Scan EC2 reality — **names not final, files not created**:

```text
cloudPilotIntelligence/
└── masterContext/                    ← recipes (high-level “what to send”)
    ├── masterFinalResponseContext.js   ← General Chat speaker
    ├── masterActionSearchContext.js    ← Action OpenAI fallback
    ├── masterRegionContext.js          ← Region OpenAI
    └── masterRequestSpeakContext.js    ← Request Message Reply polish (optional name)
```

Each file should be mostly config, e.g.:

```js
// Conceptual only — do not implement yet
{
  includeIdentity: true,
  includeCapabilities: true,
  includeCurrentState: true,
  includeKnowledge: false,
  situationTypes: [/* … */],
  conversationHistory: { include: true, limit: 6 }
}
```

Then: recipe → `buildAIContext` → `buildAISystemMessage` → OpenAI.

Keep `context/operationContext/` only while search still needs Internal/OpenAI shared **task payloads** (examples, outputFormat). Long-term, Situation + Capabilities should replace duplicated TASK prose — adapters stay thin.

**Tomorrow:** do not create all four. Start by defining recipes on paper / in this doc; implement only when coding Capabilities + Final Response.

---

## 7. Where conversation-history on/off + limit should live

**Today:** only in `CLOUDPILOT_AI_CONFIG` (`OPENAI_SEND_CONVERSATION_HISTORY`, `OPENAI_CONVERSATION_HISTORY_LIMIT`), consumed almost only by `generateGeneralMessageReply`. Every search/polish path hardcodes history **off** in logs and never loads history.

**Target:** history is a field on the **master recipe**, not a separate confusing global for “all AI”:

```text
masterFinalResponseContext.conversationHistory = { include: true, limit: 6 }
masterRegionContext.conversationHistory       = { include: false }
masterActionSearchContext.conversationHistory = { include: false }
masterRequestSpeakContext.conversationHistory = { include: false }
```

Env vars can remain **defaults / ceilings** (ops override), but the recipe is the source of truth for “does this call get history?”

That is the cleanup that makes “what prompt are we sending?” answerable by opening one master file.

---

# Core Context Model

Six first-class concepts for the model, plus conversation history:

| Concept | Question | File / source |
| ----- | ----- | ----- |
| Identity | Who is CloudPilot? | `cloudPilotContext.js` |
| Capabilities | What can I do / retrieve? | `cloudPilotCapabilitiesContext.js` ← from master |
| Situation | What should I look for / do this turn? | `cloudPilotSituationContext.js` |
| Current State | What is happening right now? | `cloudPilotCurrentStateContext.js` |
| Current Question | What did the user just say? | `currentQuestionContext.js` |
| Knowledge | What does this org/product know? | `organizationKnowledgeContext.js` (off for MVP) |
| Conversation History | Continuity only | env / history builder (not a contextType) |

Situation must **not** absorb tools, tool return facts, or “what the user can ask.” That belongs in Capabilities.

---

## 1. CAPABILITIES

What CloudPilot is capable of doing or retrieving.

Authoritative application truth: `masterCloudPilotCapabilities.js`.  
Model-facing projection only: `cloudPilotCapabilitiesContext.js`.

For MVP, the list must reflect **real working functionality** only (see Locked `cloudPilotCanAnswer` above).

> Capabilities answer: "What can CloudPilot know or do?"

Eventually this same catalog answers: "What can you do?"

---

## 2. CURRENT STATE

Current State answers:

> "What is happening right now?"

This should come from authoritative application/DB state.

For example:

```text
Open request:
Scan S3

Region:
us-west-2

Request name:
MVP Scan S3

Status:
waiting_on_confirmation
```

This is more authoritative than conversation history.

VERY IMPORTANT RULE:

If conversation history says:

```text
"Okay, starting your scan..."
```

but the database/current state says:

```text
waiting_on_confirmation
```

then the scan HAS NOT STARTED.

Current State wins.

The model must never infer execution state from an old assistant message when authoritative state exists.

---

## 3. CURRENT QUESTION

The current user message is the primary thing CloudPilot is responding to.

Examples:

```text
"scan my S3 buckets"
```

```text
"yes"
```

```text
"cancel"
```

```text
"what tags does my bucket have?"
```

```text
"what about my EC2 instances?"
```

The model should interpret these using Current State + Capabilities (+ Situation for turn guidance).

---

## 4. CONVERSATION HISTORY

I currently send roughly the last 10–12 messages.

I suspect this may sometimes be making things MORE confusing.

For this MVP, I want to experiment with something smaller, probably around **4–6 recent messages**.

Conversation history exists to help understand:

* references
* follow-up questions
* conversational continuity
* things like "that bucket", "what about EC2?", etc.

It should NOT determine workflow state.

The context should explicitly tell the model something like:

```text
RECENT CONVERSATION

This history is provided only to understand references,
follow-up questions, and natural conversation.

It is NOT authoritative for workflow state.

For current requests, confirmations, collected parameters,
and execution status, use CURRENT STATE.
```

Do NOT send organizational knowledge as part of this MVP experiment.

I want to remove unrelated context while getting Scan S3 + Scan EC2 correct.

---

# Two Different Ways Scan Works

This is an important distinction.

## MODE A — Explicit Scan

Example:

```text
User:
Scan my EC2 instances.
```

This is an explicit workflow.

Conceptually:

```text
User asks for scan
    ↓
Identify EC2 scan capability
    ↓
Collect required information
    ↓
Ask for confirmation if confirmation is required
    ↓
Execute scan
    ↓
Return actual findings
```

This is the workflow we have already been working on.

CloudPilot must never say that the scan started before execution actually happened.

If the request is:

```text
waiting_on_confirmation
```

CloudPilot should clearly ask for confirmation.

Example:

```text
Everything is ready.

Scan EC2 in us-west-2 as "MVP EC2 Scan"?

Confirm to run it, or cancel.
```

Not:

```text
Great! I'm starting the scan now.
```

unless the scan actually starts.

---

# MODE B — Scan/Read Used to Answer a Question

This is different.

Example:

```text
User:
What tags does my S3 bucket have?
```

The user's goal is NOT:

```text
perform an S3 scan
```

The user's goal is:

```text
tell me the tags
```

CloudPilot may need to inspect AWS to obtain that information.

Conceptually:

```text
User asks AWS question
    ↓
Do we already have reliable current information?
    ↓
YES → answer
    ↓
NO
    ↓
Does AVAILABLE CAPABILITIES say CloudPilot
can retrieve this information?
    ↓
YES
    ↓
Use the appropriate read/scan capability
    ↓
Answer the user's actual question
```

I do NOT want this interaction:

```text
User:
What tags does my bucket have?

CloudPilot:
Would you like me to perform an S3 scan?
```

if CloudPilot already has permission/capability to retrieve the information.

The scan/read is an implementation detail.

CloudPilot should simply retrieve what it needs and answer.

This distinction is important:

> Sometimes scan is the user's requested workflow.
>
> Sometimes scan is simply a tool CloudPilot uses to answer the user's question.

---

# MVP REGION

For now, keep this intentionally simple.

Default AWS region:

```text
us-west-2
```

I do not want team/multi-region complexity yet.

If I ask something like:

```text
What EC2 instances do I have?
```

or:

```text
What S3 buckets do I have?
```

CloudPilot should generally use the MVP default of:

```text
us-west-2
```

rather than unnecessarily asking me for a region.

We can build more sophisticated region behavior later.

---

# Example Context Sent to Model

Conceptually I want the model context to become something like:

```text
CLOUDPILOT ROLE

You are CloudPilot.
Help users understand and operate their cloud infrastructure.

--------------------------------------------------

AVAILABLE CAPABILITIES

EC2
- scan instances
- retrieve state
- retrieve instance type / size
- retrieve tags
- retrieve pricing information

S3
- scan buckets
- retrieve tags
- retrieve region
- retrieve encryption
- retrieve public access settings
- retrieve versioning

MVP default region: us-west-2

--------------------------------------------------

CURRENT STATE

Open request:
Scan S3

Region:
us-west-2

Request name:
MVP Scan S3

Status:
waiting_on_confirmation

--------------------------------------------------

RECENT CONVERSATION

[4–6 recent messages]

History helps interpret conversation.
It does not override CURRENT STATE.

--------------------------------------------------

CURRENT USER MESSAGE

"yes"
```

Do not blindly implement this exact string format.

Inspect the existing context-building code and determine the smallest clean change that gives us these conceptual sections.

---

# Capability Catalog vs Current State

Keep these concepts separate.

## Capability Catalog

Answers:

```text
What can CloudPilot know/do?
```

Examples:

```text
EC2:
- scan
- state
- instance type
- tags
- pricing

S3:
- scan
- tags
- encryption
- public access
- versioning
```

## Current State

Answers:

```text
What is happening right now?
```

Example:

```text
type: scan_s3
region: us-west-2
status: waiting_on_confirmation
request_name: MVP Scan
```

Do not mix these into one concept.

---

# Important Behavioral Rules

For this MVP:

1. One open request at a time.

2. Current DB/application state is authoritative.

3. Conversation history never overrides Current State.

4. Never claim an AWS operation started unless it actually started.

5. If the current state requires confirmation, clearly ask for confirmation.

6. Simple responses such as:

```text
yes
no
cancel
go ahead
do it
```

should be interpreted in relation to the current open request.

7. Use `us-west-2` as the MVP default rather than repeatedly asking for region.

8. If the user asks for an AWS fact that CloudPilot is allowed to retrieve, use the appropriate capability and answer the question.

9. Don't unnecessarily expose internal scan mechanics to the user.

10. If the user changes subjects, recognize it.

Example:

```text
User:
What tags does my S3 bucket have?

CloudPilot:
...

User:
What about my EC2 instances?
```

Do not force the EC2 question into the previous S3 workflow.

11. For synchronous operations, return the actual result/findings in the same interaction.

Do NOT say:

```text
The scan is running. I'll let you know when it's finished.
```

if there is no asynchronous mechanism that will actually send another message.

12. Do not add organizational knowledge to this context yet.

---

# Acceptance Conversation

I want this kind of conversation to work reliably:

```text
User:
Scan my S3 buckets.

CloudPilot:
Sure. I'll use us-west-2.
[collect request name if we still require one]

User:
Call it MVP Scan.

CloudPilot:
Ready to scan S3 in us-west-2 as "MVP Scan."
Run it?

User:
Yes.

CloudPilot:
[actually executes]
[returns real findings]

User:
Which buckets have encryption enabled?

CloudPilot:
[answers from reliable findings or retrieves the information]

User:
What tags does bucket X have?

CloudPilot:
[retrieves tags if necessary]
[answers]

User:
What about my EC2 instances?

CloudPilot:
[recognizes subject switch]
[answers or retrieves EC2 information appropriately]
```

Also test:

```text
What can you do?
```

Expected: natural list from the live catalog (Scan S3, Scan EC2, Create EC2, …) — not inventing services. Prefer Internal bullets or OpenAI polish of that same catalog (`show_capabilities`), not freeform General Chat.

```text
scan S3
cancel
```

```text
scan EC2
yes
```

```text
scan S3
change the name to Test Scan
yes
```

```text
what size is my EC2 instance?
```

```text
how much is that instance costing me?
```

```text
what tags does it have?
```

The last example is especially important because recent conversation SHOULD help resolve what "it" means.

That is a good use of conversation history.

---

# Implementation Approach

Before coding:

1. Inspect the existing conversation/context pipeline.
2. Identify exactly where:

   * system instructions are built
   * Current State is loaded
   * recent conversation is loaded
   * capabilities are currently represented
   * intent/action selection happens
   * Scan S3 is invoked
   * Scan EC2 is invoked
3. Report back what currently exists and where these concepts should fit.
4. Identify anything in the current implementation that conflicts with this design.

Then make SMALL changes.

Do not rewrite the whole conversation system.

Do not create a generalized agent framework.

Do not create a large scope engine.

Do not add RDS, Lambda, Jira, Slack, organizational knowledge, remediation, or unrelated features.

The target is:

```text
Scan S3
+
Scan EC2
+
excellent conversation
```

---

# Build Order

Work in this order:

```text
1. Capability catalog for S3 + EC2
        ↓
2. Clean authoritative Current State
        ↓
3. Reduce / clearly label recent conversation
        ↓
4. Perfect explicit Scan S3
        ↓
5. Perfect explicit Scan EC2
        ↓
6. Add direct factual AWS questions
        ↓
7. Test follow-ups and pronouns
        ↓
8. Test cancel / confirmation
        ↓
9. Test switching between S3 and EC2
```

Do not move ahead just because one happy-path test passes.

---

# Definition of Success

Success tomorrow is NOT:

```text
CloudPilot supports lots of AWS actions.
```

Success is:

```text
I can talk naturally to CloudPilot about S3 and EC2
and it consistently understands:

- what I am asking
- what it is capable of retrieving
- what request is currently open
- whether confirmation is required
- whether something actually executed
- what previous conversation is relevant
- when I changed subjects
```

I want these two capabilities to become the clean foundation we can expand later.

Once this works, adding another AWS service should increasingly mean:

```text
add capability
+
add tool/data retrieval
+
reuse conversation model
```

rather than redesigning CloudPilot's conversation system every time.

---

# Turn trace (actual code — no redesign)

Message: **`can you scan my S3 buckets`**  
Assumption: conversation has **no** open request (or replace is OK).  
Architecture labels: UNDERSTAND / DECIDE / FULFILL / RESPOND / SUPPORTING — mapped onto existing functions, not a proposed rewrite.

## Compact flow

```text
logic/messages.js
  → processMessage                                          SUPPORTING (conductor)
  → getUsersActionState                                     SUPPORTING
  → CloudPilotIntelligence.understandMessage                UNDERSTAND
       → searchMessageForValues (region skipped)            UNDERSTAND
       → searchMessageForQuestion (S3 inventory skipped)    UNDERSTAND
       → searchMessageForAction → scan_s3                   UNDERSTAND  ← scan_s3 selected
  → interpretOpenRequestEffect                              SUPPORTING (no open request)
  → decideNextStep → buildNewRequestDecision                DECIDE
  → RequestWorkflow.store → startRequest                    FULFILL (create request row only)
  → RequestWorkflow.execute → no-op                         FULFILL (skipped — not confirmed)
  → RequestConversation.conversation                        RESPOND (route)
  → CloudPilotMessage.prepareRequestMessageReply            RESPOND
       → requestTemplates (new_action / missing fields)     RESPOND
       → optional generateRequestMessageReply (OpenAI polish) RESPOND / Intelligence
```

**On this turn Atlas / `scanS3Handler` is NOT called.** Confirmation (+ filled fields) is a later turn.

## Phase detail

### Entry

| | |
| --- | --- |
| Control | `logic/messages.js` → `cloudPilotMessageFunctions.processMessage(raw, conversationID, context)` |
| In | User text `"can you scan my S3 buckets"`, conversationID, optional selectedFinding |
| Out | processMessageOutcome with `cloudPilotMessage`, atlas payload, etc. |

### Load state — SUPPORTING

| | |
| --- | --- |
| Control | `requestLoadFunctions.getUsersActionState(conversationID)` |
| In | conversationID |
| Out | Empty-ish request state if nothing open (`pendingAction` null) |
| Next | understand |

### UNDERSTAND — Intelligence

| | |
| --- | --- |
| Control | `CloudPilotIntelligence.understandMessage` → `understand/understandMessage.js` |
| In | message string + requestState |
| Calls | values, reply, conversation, question, action searches |
| Intelligence | Yes — this is the UNDERSTAND service |
| Context assembled? | Region skipped (no open request needing region). Action: Internal match usually wins; OpenAI Action Search only if Internal finds nothing **and** actionSearch=openai. For this phrase Internal matches `matchesScanS3Intent` (`scan` + `s3`) → **no** Action OpenAI / no `buildAIContext` for Final Response. |
| Out | `{ action: 'scan_s3', values: {}, reply: null, conversation: null, question: null, … }` |
| **Where scan_s3 selected** | `searchMessageForActionInternal` → `masterCloudPilotCapabilities.scan_s3.match` / `matchesScanS3Intent` |
| Next | `interpretOpenRequestEffect` then `decideNextStep` |

S3 inventory Question search is **skipped** because message contains `scan` (explicit scan stays on Action path).

### Open-request effect — SUPPORTING

| | |
| --- | --- |
| Control | `interpretOpenRequestEffect` |
| In | understanding + empty request state |
| Out | `affectsOpenRequest: false` |
| Next | decide |

### DECIDE — CloudPilot

| | |
| --- | --- |
| Control | `decideNextStep({ understanding, requestState })` |
| Path | `u.action === 'scan_s3'` → `shouldStartNewRequest` true → **`buildNewRequestDecision`** |
| Out | `chatType: cloudPilotResponding`, `request: { action: scan_s3, missing: ['region'], status: waiting_on_fields, … }`, `response.type: ask_for_missing_fields`, `replaceOpenRequest: true` |
| Confirmation? | **Not yet.** Fields incomplete → ask missing (region). After region complete, later decisions use `awaiting_confirmation` (scan_s3 has no executionModes). |
| Next | Request path (not GeneralConversation) |

### FULFILL (this turn = create request only)

| | |
| --- | --- |
| Control | `requests/workflow.store` → `requestFunctions.applyDecision` → **`startRequest`** |
| In | decision + conversationID |
| Out | DB `cloudpilot_requests` row created; status `waiting_on_fields`; missing `region` |
| Then | `RequestWorkflow.execute` → `executionFunctions.executeRequest` → **`shouldRunExecution` false** (response is not `execution_started`) → returns null / does not run |
| **When would scanS3Handler run?** | Later turn: user confirms while status `waiting_on_confirmation` → decide returns `EXECUTION_STARTED` → `executeRequest` → `AutomaticLogic` → `runAction('scan_s3')` → `scanS3Handler` → Atlas |

### RESPOND — this turn

| | |
| --- | --- |
| Control | `RequestConversation.conversation` |
| Path | No executionOutcome → map `ASK_FOR_MISSING_FIELDS` + store action `created` → `actionEvent: new_action` |
| Then | `CloudPilotMessage.prepareRequestMessageReply` |
| Templates | `requestTemplates.getRequestMessageReply` → missing-field / started copy for Scan S3 |
| Intelligence? | Optional: `generateRequestMessageReply` if MESSAGE_RESPONSE=openai — **custom presentation TASK**, not `masterFinalResponseContext` / General Chat |
| Out | User-facing string asking for region (and possibly request name prompt) |

## What this turn is NOT

- Not General Chat / `masterFinalResponseContext`
- Not Atlas S3 scan
- Not confirmation yet
- Not `"What S3 buckets do I have?"` (inventory question path)

## Suggested next trace (still no code)

Second message: **`yes`** (or region then confirm) after fields complete — maps confirmation → FULFILL execute → RESPOND with findings.
