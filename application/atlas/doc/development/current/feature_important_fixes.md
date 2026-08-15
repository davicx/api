# Feature Important Fixes — Clear names, clear folders

## What this does

Make CloudPilot readable six months from now: **one Turn is Message → Process Message → Prepare Reply → Reply**, confusing legacy words such as `speak`, `chat`, `present`, and `write` are inspected and simplified, and small helpers are not top-level product folders.

This is naming, mental model, and folder honesty — **not** new product behavior. Do not change runtime code until a step is asked for.

## Current step

**Step 2 done** — awaiting review before **Step 3** (request reply names; behavior identical).

## Next

Review the vocabulary how-to.  
Then say **do Step 3** to rename request-reply functions to the names approved after Step 1. Do **not** start that rename pass until that review is accepted.

**Status:** Active (Step 2 done — awaiting review before Step 3)  
**Codename:** `feature_important_fixes`  
**Came from:** Chat after [Feature Chat](../finished/feature_chat.md) — vocabulary confusion and reply-path naming overload. Absorbs the former future spec [feature_code_reorganize](../future/feature_code_reorganize.md).  
**Related:** [Current Development](./current_development.md) · [CloudPilot Turn](../how_to/cloud_pilot_turn.md) · [Useful Price](./feature_useful_price.md) · [Questions](../finished/feature_questions.md) · [CloudPilot Context](../how_to/cloud_pilot_context.md) · [Intelligence front door](../finished/feature_intelligence_front_door.md) · [Code cleanup](../architecture/code_cleanup.md)

---

## Goal (one sentence)

This is a **terminology + responsibility cleanup, not an architecture refactor**:
make it obvious which code is processing the Message, assembling Message Context,
or preparing the Reply, while preserving existing behavior.

---

## The problems

1. **Too many overloaded words.** `chat`, `speak`, `present`, `write`, `conversation`, and `navigator` make it harder to tell what layer a file belongs to.
2. **`processMessage` vs “Message Processing.”** The function is the whole turn; the term “Message Processing” should mean only the processing half.
3. **Conversation is doing too much semantic work.** It should mean the history/container of Message ↔ Reply turns, not a processing stage.
4. **Prepare Reply vocabulary is still too “engineery.”** `speak`, `present`, `known`, and `chat` make the reply path harder to understand than it needs to be.
5. **Some file names fight the mental model.** The system mostly works already; the confusion is terminology and responsibility more than architecture.

---

## Locked mental model

```text
ONE MESSAGE
    ↓
PROCESS MESSAGE
    - understand
    - search / gather
    - decide
    - execute
    ↓
PREPARE REPLY
    ↓
ONE REPLY
```

| Term | Meaning |
|------|---------|
| **Message** | One incoming user message. |
| **Process Message** | Understand the message, determine what needs to happen, run searches/lookups/request processing as needed. |
| **Search** | Retrieve information needed to process the message. |
| **Message Context** | Information assembled for a particular Intelligence operation. Not a top-level stage. |
| **Prepare Reply** | Build the one final response that will go back to the user. |
| **Reply** | The final message returned to the user. |
| **Conversation** | The history/container of Message ↔ Reply turns. **Not** a processing stage. |
| **CloudPilotIntelligence** | CloudPilot's GenAI brain/front door. Both Process Message and Prepare Reply may ask it for help. |
| **CloudPilotMessage** | CloudPilot's voice. It prepares the one final user-facing message. |
| **Turn** | The whole flow from one Message to one Reply. |

```text
ONE TURN
= Message → Process Message → Prepare Reply → Reply
```

### Process Message

**Purpose:** Figure out what the user means and what CloudPilot should do.

```text
Understand · Search · Find region · Load request
Collect fields · Decide · Execute · Get results
```

Some of this uses OpenAI. Some is Internal. That is okay.

**Test:** Are we figuring something out, or doing something because of the user's message? → **Process Message**

### Message Context

**Purpose:** Assemble the information a particular Intelligence operation needs.

Examples:

```text
CloudPilot identity
Current user message
Current request
Known AWS facts
Search instructions
Org knowledge
```

Context is input to an Intelligence operation. It is **not** a stage in the Turn,
it is **not** the final reply, and it is **not** itself a user Message.

Different Intelligence operations can use different contexts during one Message.

For example:

```text
Understand Context
- user's message
- available requests/actions
- instructions for understanding

Region Search Context
- user's message
- open request
- known region
- instructions for finding region

General Reply Context
- CloudPilot identity
- user's message
- conversation history
- current state
- knowledge

Request Reply Context
- internal/template response
- known request values
- wording instructions
```

Lock this vocabulary:

```text
Message = one thing the user sent CloudPilot
Reply   = one thing CloudPilot sends the user
```

Everything in between should be described as:

```text
Intelligence operations that receive Message Context
```

not as more user Messages.

### Prepare Reply

**Purpose:** Take everything CloudPilot now knows and prepare the message the user will receive.

```text
Known facts/results
      ↓
Build internal/template response
      ↓
Optionally ask Intelligence for friendly wording
      ↓
Final CloudPilot message
```

**Rule:** Prepare Reply may be deterministic, template-based, Intelligence-generated, or an Intelligence rewrite of an internal response. It must **not** perform new searches or determine request state.

Inside Prepare Reply, the long-term vocabulary goal is mostly **Reply** /
**Response Message** language, not `speak` / `present` / `chat` vocabulary.

Helpful personification:

```text
CloudPilotIntelligence = the brain
CloudPilotMessage      = the voice
```

**No new facade.** `CloudPilotIntelligence` already hides Internal / OpenAI / future provider.
This plan's names should respect that facade, not expose the provider choice.

```text
prepare  = CloudPilotMessage gets the final Reply ready
generate = CloudPilotIntelligence generates something
build    = deterministic construction of data/text
```

```text
Prepare  → voice
Generate → brain
Build    → construct something deterministically
```

CloudPilotIntelligence may use Internal, OpenAI, or a future provider **inside the brain**.
That choice is not CloudPilotMessage's concern.

The rest of CloudPilot should conceptually say:

```text
Intelligence, help me understand this.
Intelligence, search this context for a region.
Intelligence, generate friendly request wording.
Intelligence, generate a general reply.
```

not:

```text
Send another Message.
Call OpenAI directly from the mental model.
Choose Internal vs OpenAI from Prepare Reply.
```

```text
                CLOUDPILOT

USER
  │
  ▼
┌──────────────────────────────┐
│ PROCESS MESSAGE              │
│ What does the user want?     │
│ What do we know / need?      │
│ Search / gather / decide / do│
│ Message Context →            │
│ CloudPilotIntelligence       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ PREPARE REPLY                │
│ What should we tell them?    │
│ CloudPilotMessage (voice)    │
│ Ask Intelligence if needed   │
│ Message Context →            │
│ CloudPilotIntelligence       │
└──────────────┬───────────────┘
               │
               ▼
              USER
```

Region Search and Decide are both **Process Message**. Request templates and friendly Intelligence wording are both **Prepare Reply**.

CloudPilotIntelligence can stay the GenAI front door. It should not be the mental model.

```text
ONE TURN
= Message → Process Message → Prepare Reply → Reply
```

---

## Legacy implementation words under inspection

These are **existing implementation words**, not terminology we are committed to preserve.

| Word | Means in CloudPilot | Layer |
|------|---------------------|-------|
| **Request** | A job the user wants done (scan, create, missing region, confirm). Not a speaking verb. | Process Message / workflow |
| **Speak** | Build the message we send back (`CloudPilotMessage`: `speakGeneral` / `speakRequest` / `speakKnown`) | Prepare Reply front door |
| **Chat** | General-conversation OpenAI reply (`CloudPilotIntelligence.chat()`). Not all messaging. Questions must never call this. | Prepare Reply (with some fused thinking) |
| **Present** | Friendly rewrite of an already-built **request** template. Wording only. Fail → template. | Prepare Reply |
| **Write** | Fill sections of the **system prompt** for `chat()` (`writeIdentity`, `writeCurrentState`, `writeKnowledge`). Does not talk to the user. | Prompt assembly for chat |

```text
write   →  text inside the OpenAI system prompt
chat    →  OpenAI uses that prompt to answer general conversation
present →  OpenAI rephrases a request template
speak   →  package whatever we got and send it to the user
request →  the job, not the sentence
```

```text
USER MESSAGE
     │
     ▼
Is this a REQUEST (do something)?
     │
     ├─ yes → process the request
     │         then speakRequest
     │              template
     │              optional present (friendly wording)
     │
     └─ no  → Question / scan result / execution outcome?
               ├─ yes → speakKnown (already have the words)
               └─ no  → speakGeneral → chat()
                            writeIdentity / writeCurrentState / …
                            then OpenAI answers
```

`speakFacts` felt wrong because it mixed **Request** (the job) with **Speak** (the reply). That payload is: *what we already know for this request reply.*

---

## Naming rule

| Job | Name like | Example |
|-----|-----------|---------|
| Process Message — learning or doing | verb of finding / deciding / executing | `searchRegion()`, `decideRequest()`, `executeRequest()` |
| Prepare Reply — voice | `prepare...Reply()` | `prepareRequestReply()`, `prepareGeneralReply()`, `prepareKnownReply()` |
| Intelligence — brain | `generate...()` | `generateFriendlyRequestReply()`, `generateGeneralReply()` |
| Deterministic construction | `build...()` | `buildRequestKnownInfo()`, `buildRequestTemplateMessage()` |

Keep **Request** on request-conversation reply names. Do **not** collapse to `buildContext()` or `createResponse()`. Prefer longer, literal names. Test: *I can open this six months from now and immediately know what it does.*

Do **not** put Internal / OpenAI in CloudPilotMessage names. Those stay behind `CloudPilotIntelligence`.

### `processMessage` collision

**`processMessage` in code is the whole turn, not just Process Message.**

Lock this even if the function is not renamed:

- **Turn** / handle user message = Process Message then Prepare Reply (the function you already have)
- **Message Processing** = Process Message only
- **Response Building** / **Prepare Reply** = the reply-building half only

Do not use “process message” for both.

### General Chat is fused

- **Decide it is general chat** → Process Message
- **Write the general-chat reply** → Prepare Reply (today `chat()` still thinks a bit while it writes)

Request path splits processing and reply-building. Questions split too (search = Process Message, `speakKnown` = Prepare Reply). General Chat does not. That is a real difference, not a naming bug.

### Reply-language direction (examples only — not preferred names yet)

Within Prepare Reply, the system should get simpler, not more clever.

These are **examples of possible directions**, not approved names.
Step 1 already inspected the real functions. Do not treat this table as the rename list.

| Today | Example direction only | Meaning |
|------|------------------------|---------|
| `speakRequest()` | `prepareRequestReply()` | CloudPilotMessage prepares the final Request Reply |
| `speakKnown()` | `prepareKnownReply()` | CloudPilotMessage packages an already-known Reply |
| `speakGeneral()` | `prepareGeneralReply()` | CloudPilotMessage prepares a general Reply |
| `chat()` | `generateGeneralReply()` | CloudPilotIntelligence generates general reply wording |
| `presentRequestMessage()` | `generateFriendlyRequestReply()` | CloudPilotIntelligence generates friendly request wording |
| `buildRequestSpeakFacts()` | `buildRequestKnownInfo()` | Gather known request information. **Not** GenAI Message Context. |
| `buildRequestTemplateMessage` | `buildRequestTemplateMessage()` | Deterministic request reply text |

---

## Possible request-reply rename direction (examples only — not preferred names yet)

Feature Chat’s request reply path may mostly be correct. The names are the confusing part.
These examples show the kind of simplification we want. They are **not**
approved names and **not** the Step 3 rename list.

Step 1 found `buildRequestSpeakFacts()` is **known request information**,
not GenAI Message Context. Do not name it `...Context()`.

| Current | Example direction only | Plain English |
|---------|------------------------|---------------|
| `speakRequest()` | `prepareRequestReply()` | Prepare the final Reply for a Request |
| `buildRequestSpeakFacts()` | `buildRequestKnownInfo()` | Gather known request values/information |
| `speakFacts` | `requestKnownInfo` | Known request information |
| `presentRequestMessage()` | `generateFriendlyRequestReply()` | Ask Intelligence for friendly request wording |
| `shouldPresentRequestMessage()` | `shouldGenerateFriendlyRequestReply()` | Decide whether friendly generation should be attempted |
| `buildRequestPresentationMessages()` | `buildFriendlyRequestReplyMessageContext()` | Build Message Context for this Intelligence operation |
| `presentedMessageKeepsFacts()` | `friendlyRequestReplyKeepsKnownValues()` | Verify generated wording retained required values |

Leave these **out of the architectural naming discussion**. They can keep existing inside Intelligence:

```text
presentRequestMessageOpenAI()
presentRequestMessageInternal()
```

They are provider details behind:

```text
CloudPilotMessage.prepareRequestReply()
        ↓
CloudPilotIntelligence.generateFriendlyRequestReply()
        ↓
    Internal / OpenAI / future provider
```

Same for general chat. Do not make Internal/OpenAI names part of this refactor's mental model:

```text
CloudPilotMessage.prepareGeneralReply()
        ↓
CloudPilotIntelligence.generateGeneralReply()
        ↓
    Internal / OpenAI / future provider
```

**Tweaks to keep:**

1. **Known info vs Intelligence “context.”** `buildRequestSpeakFacts()` is known request information. Never `buildContext()`. Only `buildRequestPresentationMessages()` is actually Message Context.
2. The fact-guard is not suggestions-only (mode 1–4, collected confirm values, acknowledged field, estimated cost). Prefer `friendlyRequestReplyKeepsKnownValues()`.
3. Friendly create often does nothing (Internal no-op). That fallback stays **inside** Intelligence. Optional outer name: `tryGenerateFriendlyRequestReply()`.

Today’s map (do not rewrite yet):

| Today | Job |
|-------|-----|
| `understandMessage`, region/action/question search | Process Message |
| `decideNextStep`, collect fields, execute | Process Message |
| `buildRequestTemplateMessage` | Prepare Reply |
| `buildRequestSpeakFacts` | Prepare Reply — pack known info for the reply |
| `presentRequestMessage` | Prepare Reply — optional friendly wording |
| `speakKnown` | Prepare Reply — package already-known wording |
| `speakGeneral` | Prepare Reply — voice asks Intelligence for a general Reply |
| `chat()` | Intelligence generate-general-reply entry (provider choice stays inside) |
| `CloudPilotIntelligence` | GenAI brain/front door used by both Process Message and Prepare Reply |
| `CloudPilotMessage` | Voice / reply-preparation front door |
| `processMessage()` | the **Turn** (one Message in, one Reply out) |

---

## Folders — keep stable unless truly misleading

Top-level `cloudPilot/` folders should be left alone unless a name is truly misleading.

| Folder | Job |
|--------|-----|
| `chat/` | Current home of user-facing reply code. Name may be revisited later. |
| `requests/` | Track the open job |
| `actions/` | Do the AWS work |
| `scans/` | Read AWS / Atlas |
| `history/` | What changed / undo |
| `knowledge/` | Facts CloudPilot already stores |
| `questions/` | **Open — see below.** Product “Question” vs this folder. |

**`pricing/` stays where it is.** It is two helper files (hourly lookup + daily/monthly estimate). Scan Cost column uses it. Create-EC2 speak uses it. It may be small, but it is not confusing enough to justify touching working code in this feature.

It is **not** billing (`scans/billing/` = AWS bill) and **not** OpenAI token cost (`providers/openAI/usage/`).

```text
KEEP:    pricing   (rate lookup used by scan + create speak)
OPEN:    questions (product idea is big; folder is thin — think through)
```

### Open: `cloudPilot/questions/`

**Do not move this folder yet.** We are not sure it belongs as a top-level pillar, and we have not thought it through enough.

What is true today:

- **Question** as a product idea *is* big: not general chat, not a request to *do* work. “What open requests do I have?” / “what S3 buckets do I have?” / AI spend. Classify → CloudPilot loads truth → `speakKnown`. Must never invent in `chat()`.
- **`cloudPilot/questions/`** is small: one file, `openRequests.js`, which only *builds the reply* for open requests. Data still lives in `requests/`.
- **Finding** that it is a Question lives in Intelligence (`understand/search/questions/`). Inventory Questions are fulfilled by **scans** (`scan_ec2` / `scan_s3`), not by this folder.

So the word **Question** is currently split across Intelligence search, this one speak helper, `requests/` data, and scan fulfillment. That may be correct (A vs B, data vs speak), or the top-level folder may be overstating a helper the way `pricing/` does.

**Decision later, not now:** keep `questions/` as a product folder and grow it, nest the helper under `chat/` / `requests/`, or leave the split and only document it. No Step to move it until that is decided.

---

## Non-goals

- New product behavior
- A major architecture refactor
- A new Intelligence facade (the existing `CloudPilotIntelligence` door is enough)
- Exposing Internal / OpenAI names in CloudPilotMessage / Prepare Reply
- A generic presentation engine for every conversation type
- Merging request wording into general chat
- Moving `pricing/`
- Moving `questions/` until the open note is decided
- A giant context framework
- Live OpenAI smokes just to prove a rename

## Strong rule for planning and coding

> If changing a name requires changing how the system behaves, stop and explain why.

> Step 1 should describe architectural imperfections, not repair them.

Prefer:

- renaming over rewriting
- moving a function over rewriting its implementation
- preserving OpenAI ON/OFF behavior exactly
- preserving deterministic fallbacks exactly

---

## Steps

### Step 1 — Inspect + map only (no code changes)

- [x] Inspect existing message / request / response files against this mental model
- [x] For each relevant file/function: say which concept it belongs to, what it does, whether it already matches, whether it only needs renaming, whether logic actually needs to move, and proposed old → new names
- [x] Treat `speak`, `present`, `chat`, and `known` as existing implementation vocabulary, not terminology we are committed to preserve
- [x] If a Prepare Reply function currently performs a search, makes a request decision, or changes workflow state, flag it as a responsibility leak. Do **not** fix it yet.
- [x] Estimate the work: **SMALL / MEDIUM / LARGE**
- [x] No function renames, no file moves, no behavior changes

Expected Step 1 output for each confusing function:

```text
CURRENT NAME:

PLAIN ENGLISH:
Exactly what does it do?

INPUT:
What information does it receive?

INTELLIGENCE:
Does it call CloudPilotIntelligence?
If yes, what Message Context does it assemble?

OUTPUT:
Does it return known information, an intermediate value,
or the final user-facing Reply?

LAYER:
Process Message / Prepare Reply / supporting helper

RENAME:
Suggested only after the above is understood.

LOGIC MOVE:
None / possible responsibility leak
```

Step 1 result: **SMALL–MEDIUM**

- **Mostly rename/import/doc work** on the reply side
- **Likely 2 file renames + several function renames**
- **Two responsibility leaks found** (describe, do not fix in this feature unless a later step explicitly asks)
  1. `cloudPilotIntelligence/conversation/chat.js` performs org-knowledge search + DB resolve before generating the reply
  2. `cloudPilot/chat/templates/requestTemplates.js` still contains `execution_requested` → `AtlasExecution.startNewAtlasExecution(payload)` inside a template builder

#### Step 1 findings (inspection only — no renames yet)

| CURRENT NAME | PLAIN ENGLISH | INPUT | INTELLIGENCE | OUTPUT | LAYER | RENAME DIRECTION | LOGIC MOVE |
|--------------|---------------|-------|--------------|--------|-------|------------------|------------|
| `processMessage()` | Full Turn orchestrator | raw user message, conversation ID, context | yes, via `CloudPilotIntelligence.understandMessage()` | final CloudPilot result with one Reply | **Turn** | eventual `handleTurn()` is plausible, not needed now | None |
| `speakGeneral()` | Asks Intelligence for a general reply, then packages it | process-message context | yes, via `CloudPilotIntelligence.chat()` | final user-facing Reply | **Prepare Reply** | likely `prepareGeneralReply()` | None in this function |
| `speakRequest()` | Builds deterministic request reply, optionally asks Intelligence to make it friendlier, then packages it | request payload + chat type | yes, via `CloudPilotIntelligence.presentRequestMessage()` | final user-facing Reply | **Prepare Reply** | likely `prepareRequestReply()` | None in this function |
| `speakKnown()` | Takes already-known reply content and packages it | outcome object containing `cloudPilotMessage` | no | final user-facing Reply | **Prepare Reply** | maybe `prepareKnownReply()` | None |
| `buildRequestSpeakFacts()` | Builds a payload of known request information for optional friendly rewriting | request payload + deterministic template text | no | intermediate known-info object, **not** final Reply | supporting helper for Prepare Reply | `buildRequestKnownInfo()` — **not** `...Context()` | None |
| `presentRequestMessage()` | Decides whether to use Intelligence for friendly request wording; falls back to internal no-op | known-info payload | yes | intermediate friendly wording, not the packaged Reply | **Prepare Reply** | likely `generateFriendlyRequestReply()` | None in the orchestration |
| `buildRequestPresentationMessages()` | Builds the AI prompt/messages for friendly request wording | request known-info payload | this **is** the Message Context builder for that operation | AI-operation payload (`systemMessage`, `messages`, summary) | **Message Context helper** | something like `buildFriendlyRequestReplyMessageContext()` | None |
| `chat()` | Generates the general conversational reply | process-message context | this is the Intelligence implementation entry | generated general reply | **Prepare Reply**, with a leak | maybe `generateGeneralReply()` | **possible responsibility leak** |

**Important Step 1 answer:** `buildRequestSpeakFacts()` is **known request information**, not GenAI Message Context.

**Responsibility leaks** (describe only, do not fix yet):

1. `cloudPilotIntelligence/conversation/chat.js` does org-knowledge search + DB resolve. That is Process Message work inside Prepare Reply.
2. `cloudPilot/chat/templates/requestTemplates.js` `buildRequestTemplateMessage()` still contains `execution_requested` → `AtlasExecution.startNewAtlasExecution(payload)`. That is execution/process behavior inside a template builder.

### Step 2 — Write the vocabulary down

- [x] How-to (or short glossary) with Message / Process Message / Search / Message Context / Prepare Reply / Reply / Conversation — [CloudPilot Turn](../how_to/cloud_pilot_turn.md)
- [x] Optionally note in comments that `processMessage` is the Turn
- [x] No function renames, no file moves

### Step 3 — Request reply names (behavior identical)

- [ ] Rename Feature Chat request-response functions/files to the names **approved after Step 1 inspection**
- [ ] The example tables above are possible directions only, not the approved rename list
- [ ] Keep templates, fact-guard, fallback, and OpenAI ON/OFF behavior unchanged

### Step 4 — Optional later

- [ ] `speakGeneral` / `speakKnown` names
- [ ] Whether `processMessage` should become `handleUserTurn` or similar
- [ ] Think through `cloudPilot/questions/` (product Question vs thin folder) — no move until decided
