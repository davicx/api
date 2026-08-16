# Feature Important Fixes — Clear names, clear folders

## What this does

Make CloudPilot readable six months from now: **one Turn is User Message → Understand Message → Handle Request → Prepare Message Reply → Reply Message**. Context is a shared `get…Context()` utility, not a stage.

Six reply-path names are **already renamed** (Step 4). Remaining older words such as `speak*` / `processMessage` are optional Step 5 only.

This is naming, mental model, and folder honesty — **not** new product behavior.

## Current step

**Step 4 done** — six locked renames applied (behavior identical).  
[Intelligence Provider](../finished/feature_intelligence_provider.md) Search TASK family is also finished (same context → Internal | OpenAI). It is **not** part of this feature’s remaining work.

## Next

- Say **do Step 5** only if you want optional later renames (`speak*` / `processMessage` / `questions/` folder thinking).
- Or **move this feature to finished** if Step 5 is not needed now.

**Status:** Active (Step 4 done — optional Step 5, or finish)  
**Codename:** `feature_important_fixes`  
**Came from:** Chat after [Feature Chat](../finished/feature_chat.md) — vocabulary confusion and reply-path naming overload. Absorbs the former future spec [feature_code_reorganize](../future/feature_code_reorganize.md).  
**Related:** [Intelligence Provider](../finished/feature_intelligence_provider.md) · [Intelligence Provider how-to](../how_to/intelligence_provider.md) · [Current Development](./current_development.md) · [CloudPilot Turn](../how_to/cloud_pilot_turn.md) · [Useful Price](./feature_useful_price.md) · [Questions](../finished/feature_questions.md) · [CloudPilot Context](../how_to/cloud_pilot_context.md) · [Intelligence front door](../finished/feature_intelligence_front_door.md) · [Code cleanup](../architecture/code_cleanup.md)

---



## Goal (one sentence)

This is a **terminology + responsibility cleanup, not an architecture refactor**:
make it obvious which stage of the Turn you are in, and keep weird words out of the mental model.

---



## The problems

1. **Too many overloaded words.** `chat`, `speak`, `present`, `write`, `conversation`, and `navigator` make it harder to tell what layer a file belongs to.
2. `processMessage` **vs the Turn.** The function is the whole Turn. The stages inside it are Understand / Handle Request / Prepare Message Reply / Reply Message.
3. **Context is not a stage.** It is a utility used whenever a stage needs information for Intelligence.
4. **Folders do not have to match stages.** `context/`, `search/`, `requests/` can live underneath the Turn. Stages say where you are; folders say what kind of code it is.

---



## Locked mental model

```text
USER MESSAGE
    ↓
UNDERSTAND MESSAGE
    ↓
HANDLE REQUEST
    ↓
PREPARE MESSAGE REPLY
    ↓
REPLY MESSAGE
```


| Term                      | Meaning                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **User Message**          | One incoming message from the user.                                                                               |
| **Understand Message**    | Figure out what the user means. Classification, region search, extract values, determine request.                 |
| **Handle Request**        | Do the CloudPilot work. Scan, create, pause, look something up, deterministic logic. Skip if there is no request. |
| **Prepare Message Reply** | Take everything we now know and create the one message to send back.                                              |
| **Reply Message**         | Send / store / return that final message.                                                                         |
| **Context**               | Shared utility. Assemble information for one Intelligence / OpenAI call. **Not a stage.**                         |
| **Request**               | A job the user wants done (`create_ec2`, `scan_ec2`). Not a speaking verb.                                        |
| **Conversation**          | History of User Message ↔ Reply Message turns. **Not a stage.**                                                   |
| **Turn**                  | The whole flow from one User Message to one Reply Message.                                                        |


```text
ONE TURN
= User Message → Understand Message → Handle Request → Prepare Message Reply → Reply Message
```

Keep these two words sacred:

```text
User Message  = one thing the user sent CloudPilot
Reply Message = one thing CloudPilot sends the user
```

Calls into Intelligence are **not** more user messages. They are: get context, then ask Intelligence.

### Understand Message

Figure out what the user means.

```text
OpenAI classification
region search
extract values
determine request
```



### Handle Request

Do the CloudPilot work. Skip when there is no request (general chat, some questions).

```text
scan EC2
create EC2
pause EC2
look something up
run deterministic logic
```



### Prepare Message Reply

Take everything we now know and create the **one message we're going to send back**.

```text
internal result
known values
request result
errors
optional Intelligence wording
```

Must **not** perform new searches or determine request state.

### Reply Message

Send / store / return the final message.

### Context (utility, not a stage)

Anytime a stage needs Intelligence, **get context** for that operation.

```text
context.getSearchRegionContext()
context.getFullMessageContext()
context.getFriendlyReplyContext()
context.getCreateEC2Context()
```

Or whatever specific contexts actually exist.

**Naming test:** If a function's job is assembling information to send to OpenAI / Intelligence, it belongs conceptually under `context`, and the caller should `get…Context()`.

Prefer `get` **over** `build`. The caller does not care whether context is built, loaded, merged, or calculated:

```js
const context = getFullMessageContext(...)
```

There may be many Intelligence operations in one Turn. Each can `get` its own context. Long names are fine if they say what they get. Do not stack leftover jargon (`buildChatSpeakProcessConversation`).

Do **not** make every folder match a Turn stage.

`CloudPilotIntelligence` stays the existing GenAI front door (Internal / OpenAI / future provider stay inside it). No new facade. It is not itself a Turn stage.

```text
USER MESSAGE
    ↓
UNDERSTAND MESSAGE
    ↓
HANDLE REQUEST          (skip if none)
    ↓
PREPARE MESSAGE REPLY
    ↓
REPLY MESSAGE
```

Anytime OpenAI is needed, from any of those stages:

```text
get … Context()
    ↓
CloudPilotIntelligence
    ↓
result
```

---



## Legacy implementation words under inspection

These were **existing implementation words**. Step 4 renamed the reply-path ones marked below. `speak*` / `processMessage` remain until optional Step 5.


| Word        | Means in current code                                                       | Stage today           | Status |
| ----------- | --------------------------------------------------------------------------- | --------------------- | ------ |
| **Request** | A job the user wants done (scan, create, missing region, confirm).          | Handle Request        | keep   |
| **Speak**   | Package the outgoing reply (`speakGeneral` / `speakRequest` / `speakKnown`) | Prepare Message Reply | Step 5 optional |
| **Chat**    | Was `chat()` — now `generateGeneralReply()`                                 | Prepare Message Reply | **renamed Step 4** |
| **Present** | Was `presentRequestMessage()` — now `generateFriendlyReply()`               | Prepare Message Reply | **renamed Step 4** |
| **Write**   | Fill sections of a system prompt. Does not talk to the user.                | Context utility       | keep   |


```text
write                 →  text inside the OpenAI system prompt
generateGeneralReply  →  OpenAI / Internal answers general conversation
generateFriendlyReply →  OpenAI rephrases a request template (optional)
speak*                →  package whatever we got and send it to the user
request               →  the job, not the sentence
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
     │              optional generateFriendlyReply
     │
     └─ no  → Question / scan result / execution outcome?
               ├─ yes → speakKnown (already have the words)
               └─ no  → speakGeneral → generateGeneralReply()
                            writeIdentity / writeCurrentState / …
                            then OpenAI answers
```

`speakFacts` felt wrong because it mixed **Request** (the job) with **Speak** (the reply). That payload is: *what we already know for this request reply.*

---



## Naming rule


| Job                      | Name like                            |
| ------------------------ | ------------------------------------ |
| Understand Message       | `understand…`, `search…`, `extract…` |
| Handle Request           | `scan…`, `create…`, `execute…`       |
| Prepare Message Reply    | prepare the one reply to send        |
| Reply Message            | return / store the final message     |
| Context for Intelligence | `get…Context()`                      |


If a function assembles information to send to OpenAI / Intelligence, it belongs conceptually under `context`. Prefer `get` **over** `build`.

Locked naming rule:

```text
get...Facts()      → returns known facts
get...Context()    → returns Intelligence context
generate...Reply() → generates reply wording
```

Long literal names are fine (`getSearchRegionContext`). Do **not** stack leftover jargon (`buildChatSpeakProcessConversation`).
Do **not** put Internal / OpenAI in Prepare Message Reply names. Those stay behind `CloudPilotIntelligence`.
Do **not** make every folder match a Turn stage.

### `processMessage` collision

```text
IMPORTANT:

Understand Message / Handle Request / Prepare Message Reply / Reply Message
= architectural stages

processMessage()
= current implementation name for the whole Turn

They are not the same thing.
```

Do not rename `processMessage()` in Step 3 or Step 4. That remains a later decision.

### General Chat is fused

- **Decide it is general chat** → Understand Message
- **Write the general-chat reply** → Prepare Message Reply (today `generateGeneralReply()` still attaches org knowledge while it writes — known leak, do not fix here)

Handle Request is skipped when there is no request. That is a real difference, not a naming bug.

---



## Locked preferred names

**Step 4 applied these.** Do not invent replacements. Historical old → new map:


```text
buildRequestSpeakFacts()
→ getRequestReplyFacts()          ✅ applied

shouldPresentRequestMessage()
→ shouldTryFriendlyReply()        ✅ applied

buildRequestPresentationMessages()
→ getFriendlyReplyContext()       ✅ applied

presentRequestMessage()
→ generateFriendlyReply()         ✅ applied

presentedMessageKeepsFacts()
→ replyContainsRequiredFacts()    ✅ applied

chat()
→ generateGeneralReply()          ✅ applied
```

```text
REQUEST REPLY

getRequestReplyFacts()
        ↓
shouldTryFriendlyReply()
        ↓ YES
getFriendlyReplyContext()
        ↓
generateFriendlyReply()
        ↓
replyContainsRequiredFacts()
        ↓
Reply Message
```

```text
GENERAL REPLY

getFullMessageContext()          today still: buildAIContext()
        ↓
generateGeneralReply()
        ↓
Reply Message
```

`shouldTryFriendlyReply()` asks: should we bother asking Intelligence to make this reply friendlier? It is **not** “do facts exist?” and **not** “is OpenAI on?”

`replyContainsRequiredFacts()` asks: did the generated wording still include required values (region, `1–4` modes, cost)? Fail → keep the template.

`getFullMessageContext()` is the General-path context name in this diagram. `buildAIContext()` is not in the locked rename list.

`speakKnown` / `speakGeneral` / `speakRequest` / `processMessage()` stay optional Step 5.
Provider Internal / OpenAI functions stay **inside** Intelligence.

**Related (done elsewhere):** Search TASK operations now use `get…SearchContext()` → same object → Internal | OpenAI — see [Intelligence Provider](../finished/feature_intelligence_provider.md). That work is finished and is **not** Step 5 of this feature.

Today’s map:


| Today | Job |
|-------|-----|
| `understandMessage`, region/action/question search | Understand Message |
| `decideNextStep`, collect fields, execute | Handle Request |
| `buildRequestTemplateMessage` | Prepare Message Reply — deterministic template |
| `getRequestReplyFacts` | Get facts the Request Reply must preserve |
| `getFriendlyReplyContext` | Get context for the friendly rewrite |
| `generateFriendlyReply` | Generate optional friendlier Request Reply |
| `generateGeneralReply` | Generate General Reply from scratch |
| `speakKnown` / `speakGeneral` / `speakRequest` | Prepare Message Reply front doors (current names) |
| `processMessage()` | the **Turn** |


---



## Folders — keep stable unless truly misleading

Top-level `cloudPilot/` folders should be left alone unless a name is truly misleading.


| Folder       | Job                                                                  |
| ------------ | -------------------------------------------------------------------- |
| `chat/`      | Current home of user-facing reply code. Name may be revisited later. |
| `requests/`  | Track the open job                                                   |
| `actions/`   | Do the AWS work                                                      |
| `scans/`     | Read AWS / Atlas                                                     |
| `history/`   | What changed / undo                                                  |
| `knowledge/` | Facts CloudPilot already stores                                      |
| `questions/` | **Open — see below.** Product “Question” vs this folder.             |


`pricing/` **stays where it is.** It is two helper files (hourly lookup + daily/monthly estimate). Scan Cost column uses it. Create-EC2 speak uses it. It may be small, but it is not confusing enough to justify touching working code in this feature.

It is **not** billing (`scans/billing/` = AWS bill) and **not** OpenAI token cost (`providers/openAI/usage/`).

```text
KEEP:    pricing   (rate lookup used by scan + create speak)
OPEN:    questions (product idea is big; folder is thin — think through)
```



### Open: `cloudPilot/questions/`

**Do not move this folder yet.** We are not sure it belongs as a top-level pillar, and we have not thought it through enough.

What is true today:

- **Question** as a product idea *is* big: not general chat, not a request to *do* work. “What open requests do I have?” / “what S3 buckets do I have?” / AI spend. Classify → CloudPilot loads truth → `speakKnown`. Must never invent in `generateGeneralReply()`.
- `cloudPilot/questions/` is small: one file, `openRequests.js`, which only *builds the reply* for open requests. Data still lives in `requests/`.
- **Finding** that it is a Question lives in Intelligence (`understand/search/questions/`). Inventory Questions are fulfilled by **scans** (`scan_ec2` / `scan_s3`), not by this folder.

So the word **Question** is currently split across Intelligence search, this one speak helper, `requests/` data, and scan fulfillment. That may be correct (A vs B, data vs speak), or the top-level folder may be overstating a helper the way `pricing/` does.

**Decision later, not now:** keep `questions/` as a product folder and grow it, nest the helper under `chat/` / `requests/`, or leave the split and only document it. No Step to move it until that is decided.

---



## Non-goals

- New product behavior
- A major architecture refactor
- A new Intelligence facade (the existing `CloudPilotIntelligence` door is enough)
- Exposing Internal / OpenAI names in Prepare Message Reply
- A generic presentation engine for every conversation type
- Merging request wording into general chat
- Moving `pricing/`
- Moving `questions/` until the open note is decided
- A giant context framework
- Live OpenAI smokes just to prove a rename
- Replacing confusing names with stacked jargon (`buildChatSpeakProcessConversation`)



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
  1. `cloudPilotIntelligence/conversation/generateGeneralReply.js` performs org-knowledge search + DB resolve before generating the reply
  2. `cloudPilot/chat/templates/requestTemplates.js` still contains `execution_requested` → `AtlasExecution.startNewAtlasExecution(payload)` inside a template builder



#### Step 1 findings (inspection only — layer names below used the older model)

The **RENAME DIRECTION** column is **not approved**. Step 3 locked the six names; **Step 4 applied them**. Rows below keep the **pre-Step-4** names for history.


| CURRENT NAME (then)                  | PLAIN ENGLISH                                                                                            | INPUT                                         | INTELLIGENCE                                               | OUTPUT                                                      | LAYER                               | RENAME DIRECTION                                           | LOGIC MOVE                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------- | -------------------------------- |
| `processMessage()`                   | Full Turn orchestrator                                                                                   | raw user message, conversation ID, context    | yes, via `CloudPilotIntelligence.understandMessage()`      | final CloudPilot result with one Reply                      | **Turn**                            | eventual `handleTurn()` is plausible, not needed now       | None                             |
| `speakGeneral()`                     | Asks Intelligence for a general reply, then packages it                                                  | process-message context                       | yes, via `CloudPilotIntelligence.generateGeneralReply()` (was `chat()`) | final user-facing Reply                                     | **Prepare Reply**                   | likely `prepareGeneralReply()`                             | None in this function            |
| `speakRequest()`                     | Builds deterministic request reply, optionally asks Intelligence to make it friendlier, then packages it | request payload + chat type                   | yes, via `CloudPilotIntelligence.generateFriendlyReply()` (was `presentRequestMessage()`) | final user-facing Reply                                     | **Prepare Reply**                   | likely `prepareRequestReply()`                             | None in this function            |
| `speakKnown()`                       | Takes already-known reply content and packages it                                                        | outcome object containing `cloudPilotMessage` | no                                                         | final user-facing Reply                                     | **Prepare Reply**                   | maybe `prepareKnownReply()`                                | None                             |
| `buildRequestSpeakFacts()` → now `getRequestReplyFacts()` | Builds a payload of known request information for optional friendly rewriting                            | request payload + deterministic template text | no                                                         | intermediate known-info object, **not** final Reply         | supporting helper for Prepare Reply | locked + applied                                           | None                             |
| `presentRequestMessage()` → now `generateFriendlyReply()` | Decides whether to use Intelligence for friendly request wording; falls back to internal no-op           | known-info payload                            | yes                                                        | intermediate friendly wording, not the packaged Reply       | **Prepare Reply**                   | locked + applied                                           | None in the orchestration        |
| `buildRequestPresentationMessages()` → now `getFriendlyReplyContext()` | Builds the AI prompt/messages for friendly request wording                                               | request known-info payload                    | this **is** the Message Context builder for that operation | AI-operation payload (`systemMessage`, `messages`, summary) | **Message Context helper**          | locked + applied                                           | None                             |
| `chat()` → now `generateGeneralReply()` | Generates the general conversational reply                                                               | process-message context                       | this is the Intelligence implementation entry              | generated general reply                                     | **Prepare Reply**, with a leak      | locked + applied                                           | **possible responsibility leak** |


**Important Step 1 answer:** `getRequestReplyFacts()` (was `buildRequestSpeakFacts()`) is **known request information**, not GenAI Message Context.

**Responsibility leaks** (describe only, do not fix yet):

1. `cloudPilotIntelligence/conversation/generateGeneralReply.js` does org-knowledge search + DB resolve. That is Process Message work inside Prepare Reply.
2. `cloudPilot/chat/templates/requestTemplates.js` `buildRequestTemplateMessage()` still contains `execution_requested` → `AtlasExecution.startNewAtlasExecution(payload)`. That is execution/process behavior inside a template builder.



### Step 2 — Write the vocabulary down

- [x] How-to with User Message / Understand Message / Handle Request / Prepare Message Reply / Reply Message / Context — [CloudPilot Turn](../how_to/cloud_pilot_turn.md)
- [x] Optionally note in comments that `processMessage` is the Turn
- [x] No function renames, no file moves



### Step 3 — Inspect the two remaining condition functions (no code changes)

- [x] Read `shouldPresentRequestMessage()` — what condition does it actually test?
- [x] Read `presentedMessageKeepsFacts()` — what does it check, and what does it return?
- [x] Propose a name for each from that condition. Do **not** force symmetry with the locked four
- [x] No function renames, no file moves, no behavior changes



### Step 4 — Apply locked names (behavior identical)

- [x] Rename the **locked names** (the six above; `chat()` → `generateGeneralReply()` is included)
- [x] Keep templates, fact-guard, fallback, and OpenAI ON/OFF behavior unchanged
- [x] Do not rename `speakGeneral()`, `speakKnown()`, `speakRequest()`, or `processMessage()`

Applied map:

```text
getRequestReplyFacts()       ← buildRequestSpeakFacts()
shouldTryFriendlyReply()     ← shouldPresentRequestMessage()
getFriendlyReplyContext()    ← buildRequestPresentationMessages()
generateFriendlyReply()      ← presentRequestMessage()
replyContainsRequiredFacts() ← presentedMessageKeepsFacts()
generateGeneralReply()       ← chat()
```

Files: `getRequestReplyFacts.js`, `generateFriendlyReply.js`, `generateGeneralReply.js`.
Provider helpers `presentRequestMessageInternal` / `presentRequestMessageOpenAI` stay behind Intelligence.



### Step 5 — Optional later

- [ ] `speakGeneral` / `speakKnown` / `speakRequest` names
- [ ] Whether `processMessage` should become `handleUserTurn` or similar
- [ ] Think through `cloudPilot/questions/` (product Question vs thin folder) — no move until decided

**Not Step 5:** Search same-context Internal | OpenAI — already finished in [Intelligence Provider](../finished/feature_intelligence_provider.md).  
**Not Step 5:** Fixing the two responsibility leaks above — only if a later feature asks.