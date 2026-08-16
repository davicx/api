# Feature Important Fixes — Clear names, clear folders

## What this does

Make CloudPilot readable six months from now: **one Turn is User Message → Understand Message → Handle Request → Prepare Message Reply → Reply Message**. Context is a shared `get…Context()` utility, not a stage.

This shipped **naming clarity + mental model cleanup** — **not** new product behavior.

## Status

**Finished** — 2026-08-16

```text
Feature finished.

Shipped:
- Turn vocabulary
- Message / Response / Message Reply vocabulary
- Request Message Reply naming cleanup
- speak/present/friendly/facts naming cleanup
- Context vs provider-adapter distinction
- Search provider pattern already completed separately

Follow-ups intentionally not part of this feature (see [Message Reply Follow-ups](../future/feature_message_reply_followups.md)):

**Still open**
1. Move deterministic Request Message Reply behind Internal AI
2. Fix two responsibility leaks (incl. Org Knowledge Question path inside general reply)

**Closed after this feature**
- ~~Rename generateGeneralReply() → generateGeneralMessageReply()~~
- ~~Decide questions/ folder ownership~~ — keep as Question pillar; Understanding locked
```

Detail: [Message Reply Follow-ups](../future/feature_message_reply_followups.md)

**Codename:** `feature_important_fixes`  
**Came from:** Chat after [Feature Chat](./feature_chat.md) — vocabulary confusion and reply-path naming overload. Absorbs the former future spec [feature_code_reorganize](../future/feature_code_reorganize.md).  
**Related:** [Message Reply Follow-ups](../future/feature_message_reply_followups.md) · [Intelligence Provider](./feature_intelligence_provider.md) · [Intelligence Provider how-to](../how_to/intelligence_provider.md) · [Current Development](../current/current_development.md) · [CloudPilot Turn](../how_to/cloud_pilot_turn.md) · [Useful Price](../current/feature_useful_price.md) · [Questions](./feature_questions.md) · [CloudPilot Context](../how_to/cloud_pilot_context.md) · [Intelligence front door](./feature_intelligence_front_door.md) · [Code cleanup](../architecture/code_cleanup.md)

---

## What shipped (Steps 1–5)

**Step 5 applied** — locked renames in code:

```text
buildRequestTemplateMessage()     → getRequestMessageReply()                    ✅
getRequestReplyFacts()            → getRequestMessageReplyContext()             ✅
shouldTryFriendlyReply()          → REMOVE (redundant; do not rename)           ✅
getFriendlyReplyContext()         → prepareFinalRequestMessageReplyForOpenAI()  ✅
generateFriendlyReply()           → generateRequestMessageReply()               ✅
replyContainsRequiredFacts()      → openAIResponseContainsRequiredValues()      ✅
presentRequestMessageInternal()   → generateRequestMessageReplyInternal()       ✅
presentRequestMessageOpenAI()     → generateRequestMessageReplyOpenAI()         ✅

speakGeneral()                    → prepareGeneralMessageReply()                ✅
speakRequest()                    → prepareRequestMessageReply()                ✅
speakKnown()                      → prepareKnownMessageReply()                  ✅
```

**Left as OK when finishing:** `processMessage()`. General name `generateGeneralMessageReply()` applied after close — see [follow-ups](../future/feature_message_reply_followups.md).

**Sacred vocabulary:**

```text
Message        = FROM the user → CloudPilot
Response       = FROM a provider (OpenAI / Internal AI) → CloudPilot
Message Reply  = FROM CloudPilot → the user
```

```text
prepare*  = package outgoing Message Reply (does NOT send)
generate* = Intelligence produces wording
```

[Intelligence Provider](./feature_intelligence_provider.md) Search TASK family finished separately.

## Next

None for this feature. Architectural leftovers: [Message Reply Follow-ups](../future/feature_message_reply_followups.md).

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

Keep these words sacred:

```text
Message        = FROM the user → CloudPilot
Response       = FROM a provider → CloudPilot
Message Reply  = FROM CloudPilot → the user

Never: bare “reply” for the user-facing output — use messageReply / Message Reply.
Never: call an OpenAI return value a Message Reply — that is a Response until accepted.
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

Take everything we now know and create the **one Message Reply** (Prepare stage — packaging; Reply Message stage sends/stores).

```text
internal result
known values
request result
errors
optional Intelligence wording
```

Must **not** perform new searches or determine request state.

### Reply Message

Send / store / return the **Message Reply** to the user.

### Context (utility, not a stage)

Anytime a stage needs Intelligence, **get operation Context** for that operation — then pass it to Internal AI | OpenAI.

```text
Operation Context
= what the operation knows / needs
= get…Context()
= object passed to Internal AI | OpenAI

Provider adapter
= translates operation Context into provider-specific input
= NOT called Context
  (example: prepareFinalRequestMessageReplyForOpenAI)
```

```text
getRequestMessageReplyContext()
getRegionSearchContext()
getFullMessageContext()          (General — today still buildAIContext)
```

```text
getRequestMessageReplyContext()
        ↓
RequestMessageReplyContext
        ↓
CloudPilotIntelligence
   ┌─────────┴─────────┐
Internal AI          OpenAI
                       ↓
prepareFinalRequestMessageReplyForOpenAI()
```

Prefer `get` **over** `build` for operation Context. Long names are fine. Do not stack leftover jargon (`buildChatSpeakProcessConversation`).

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
| **Speak**   | Was packaging door — now `prepare*MessageReply()`                         | Prepare Message Reply | **locked Step 5** |
| **Chat**    | Was `chat()` — now `generateGeneralReply()`                                 | Prepare Message Reply | **renamed Step 4** |
| **Present** | Was `presentRequestMessage()` — now `generateFriendlyReply()`               | Prepare Message Reply | **renamed Step 4** |
| **Write**   | Fill sections of a system prompt. Does not talk to the user.                | Context utility       | keep   |


```text
write                          →  text inside the OpenAI system prompt
generateGeneralMessageReply    →  Intelligence General Message Reply wording
generateRequestMessageReply    →  Intelligence Request Message Reply wording
prepare*MessageReply           →  package outgoing Message Reply (does NOT send)
request                        →  the job, not the sentence
```

```text
USER MESSAGE
     │
     ▼
Is this a REQUEST (do something)?
     │
     ├─ yes → Handle Request
     │         then prepareRequestMessageReply()
     │              getRequestMessageReply / generateRequestMessageReply
     │
     └─ no  → Question / scan result / execution outcome?
               ├─ yes → prepareKnownMessageReply()
               └─ no  → prepareGeneralMessageReply()
                            → generateGeneralMessageReply()
```

`speakFacts` felt wrong because it mixed **Request** (the job) with **Speak** (the reply). That payload is: *what we already know for this request reply.*

---



## Naming rule


| Job                      | Name like                            |
| ------------------------ | ------------------------------------ |
| Understand Message       | `understand…`, `search…`, `extract…` |
| Handle Request           | `scan…`, `create…`, `execute…`       |
| Prepare Message Reply    | prepare the one Message Reply (does not send) |
| Reply Message            | send / store / return the Message Reply |
| Operation Context        | `get…Context()` — what the operation knows / needs for Internal AI \| OpenAI |
| Provider adapter         | NOT `…Context()` — e.g. `prepareFinal…ForOpenAI()` |


Prefer `get` **over** `build` for context assemblers.

Locked naming rule (aligned with [Intelligence Provider](./feature_intelligence_provider.md)):

```text
Context
= what the operation knows / needs
= the object passed to Internal AI | OpenAI

OpenAI messages
= provider-specific formatting of that context (adapter — not named Context)

generate...MessageReply() → Intelligence produces Message Reply wording (provider-agnostic door)
```

### Internal AI vs OpenAI (mental model)

Do **not** think:

```text
OpenAI = AI
Internal = template / fallback
```

Think:

```text
CloudPilot Intelligence
        ↓
   choose provider
   ┌──────┴──────┐
Internal AI    OpenAI
```

Internal AI’s **current** implementation may be deterministic copy / parsing. That is an implementation detail. Tomorrow it can change without renaming the operation.

Avoid **template** in architecture / new names unless you mean “today’s Internal AI implementation.” Prefer **Request Reply** / **operation result**.

`shouldTryFriendlyReply()` belongs to the old worldview (“fancy AI vs template”). Its concept goes away — **REMOVE**, do not rename.

Do **not** call the OpenAI `{ systemMessage, messages }` package `…Context()`.
Do **not** use `Context` for unrelated helpers.
Long literal names are fine (`getRegionSearchContext`). Do **not** stack leftover jargon (`buildChatSpeakProcessConversation`).
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
REQUEST MESSAGE REPLY — target mental model

getRequestMessageReplyContext()
        ↓
CloudPilot Intelligence
        ↓
   choose provider
   ┌──────┴──────┐
Internal AI    OpenAI
      ↓            ↓
      SAME REQUEST MESSAGE REPLY
```

```text
REQUEST MESSAGE REPLY — today (honest gap; naming toward the target)

getRequestMessageReply()          preferred ← today: buildRequestTemplateMessage()
  (deterministic copy still built OUTSIDE the provider door)
        ↓
getRequestMessageReplyContext()   preferred ← today: getRequestReplyFacts()
        ↓
context null? → keep that Message Reply (never enter optional path)
context set?  → generateRequestMessageReply(context)   preferred ← generateFriendlyReply()
                   ↓
              choose provider
              ┌──────┴──────┐
         Internal AI*    OpenAI
         (*target: success + deterministic Message Reply; today still no-op)
                              ↓
              prepareFinalRequestMessageReplyForOpenAI()  preferred ← getFriendlyReplyContext()
                              ↓
                         send to OpenAI
                              ↓
              OpenAI Response
                              ↓
              openAIResponseContainsRequiredValues()  preferred ← replyContainsRequiredFacts()
                              ↓
              Request Message Reply (to user)

REMOVED: shouldTryFriendlyReply()
  Old worldview: “try fancy AI or keep template?”
  Goes away with Internal AI | OpenAI as two providers of one operation.
```

`shouldTryFriendlyReply()` — **resolved: REMOVE, do not rename.** Even more clearly wrong under Internal AI | OpenAI. Only caller is `speakRequest` after non-null context; same question twice; concept from “template vs AI.”

`openAIResponseContainsRequiredValues()` (today `replyContainsRequiredFacts()`): did the **OpenAI Response** still include required values? Fail → keep Internal result as the Message Reply.

**Later (not this rename pass):** move deterministic Request Message Reply production *behind* Internal AI so the target diagram matches code. Until then, prefer names that don’t cement “template vs AI.”

```text
GENERAL MESSAGE REPLY

getFullMessageContext()          today still: buildAIContext() — name TBD
        ↓
generateGeneralMessageReply()    preferred ← today: generateGeneralReply()
        ↓
Message Reply
```

`getFullMessageContext()` / `buildAIContext()` not fully renamed yet — leave unresolved until inspected.

`prepareGeneralMessageReply()` (today `speakGeneral`) packages that Message Reply — does not send.
Provider Internal AI / OpenAI functions stay **inside** Intelligence.

### `generateFriendlyReply()` → `generateRequestMessageReply()` (locked)

**Preferred name:** `generateRequestMessageReply()`

One operation door for Request Message Reply. Matches Internal AI | OpenAI. Drops “Friendly.” Uses **messageReply** vocabulary.

**Target (structural, when applying):** always return the Request Message Reply — Internal AI succeeds with deterministic text; OpenAI succeeds with reword (or falls back to Internal result). Not `success: false` + caller keeps a side copy.

**Today:** still the optional OpenAI-reword / Internal-no-op door. Rename first; structure later if asked.

### `presentRequestMessageInternal()` → `generateRequestMessageReplyInternal()` (locked)

**Preferred name:** `generateRequestMessageReplyInternal()`

Internal AI implementation of Request Message Reply. Same door family as `generateRequestMessageReply()`.

```text
generateRequestMessageReply()
        ↓
choose provider
   ┌────┴────┐
generateRequestMessageReplyInternal(context)
generateRequestMessageReplyOpenAI(context)    preferred ← presentRequestMessageOpenAI()
```

**Contract (target):** Request Message Reply context IN → Message Reply result OUT (same as OpenAI).

**Today:** still a no-op `{ success: false }`. Structural fix when applying code later.

### `presentRequestMessageOpenAI()` → `generateRequestMessageReplyOpenAI()` (locked)

**Preferred name:** `generateRequestMessageReplyOpenAI()`

OpenAI provider for Request Message Reply — same naming family as Internal.

**What it does:** prepare package → call OpenAI → validate Response → return Message Reply text or failure.


**Related (done elsewhere):** Search TASK operations now use `get…SearchContext()` → same object → Internal | OpenAI — see [Intelligence Provider](./feature_intelligence_provider.md). That work is finished and is **not** Step 5 of this feature.

Today’s map:


| Today | Preferred (Step 5) | Job |
|-------|--------------------|-----|
| `understandMessage`, region/action/question search | — | Understand Message |
| `decideNextStep`, collect fields, execute | — | Handle Request |
| `buildRequestTemplateMessage` | `getRequestMessageReply` | Deterministic Request Message Reply (today outside provider door) |
| `getRequestReplyFacts` | `getRequestMessageReplyContext` | Operation context for Request Message Reply (Internal AI \| OpenAI) |
| `shouldTryFriendlyReply` | **REMOVE** | Old “fancy AI vs template” gate; redundant; concept going away |
| `getFriendlyReplyContext` | `prepareFinalRequestMessageReplyForOpenAI` | OpenAI-only adapter: package context → messages for OpenAI |
| `generateFriendlyReply` | `generateRequestMessageReply` | One Request Message Reply operation door (Internal AI \| OpenAI) |
| `presentRequestMessageInternal` | `generateRequestMessageReplyInternal` | Internal AI provider — context IN → Message Reply OUT |
| `presentRequestMessageOpenAI` | `generateRequestMessageReplyOpenAI` | OpenAI provider — context IN → Message Reply OUT |
| `replyContainsRequiredFacts` | `openAIResponseContainsRequiredValues` | Guard: did the OpenAI Response still include required values? |
| `generateGeneralReply` | later: `generateGeneralMessageReply` | General Message Reply from scratch |
| `speakGeneral` / `speakRequest` / `speakKnown` | `prepareGeneralMessageReply` / `prepareRequestMessageReply` / `prepareKnownMessageReply` | Package outgoing Message Reply (does not send) |
| `processMessage()` | later | the **Turn** |


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
| `questions/` | **CloudPilot State Question** reply (`openRequests.js`) — `questions/` is a kept product pillar |


`pricing/` **stays where it is.** It is two helper files (hourly lookup + daily/monthly estimate). Scan Cost column uses it. Create-EC2 speak uses it. It may be small, but it is not confusing enough to justify touching working code in this feature.

It is **not** billing (`scans/billing/` = AWS bill) and **not** OpenAI token cost (`providers/openAI/usage/`).

```text
KEEP:    pricing   (rate lookup used by scan + create speak)
KEEP:    questions (Understanding Question pillar — see questions/README.md)
```



### Decided: keep `cloudPilot/questions/` — closed

**Locked / closed:** `questions/` stays a product pillar for Question fulfillment. Ownership is not an open item anymore.

Canonical lock: [`questions/README.md`](../../../cloudPilot/questions/README.md) · [CloudPilot Turn](../how_to/cloud_pilot_turn.md) · [Follow-ups](../future/feature_message_reply_followups.md) (closed #3).

Organizational Knowledge Questions are a **type of Question**, not a rename of Question. Org Knowledge *path still living in general reply* is leak #4A in follow-ups — not a reason to reopen this folder decision.

---



## Non-goals

- New product behavior
- A major architecture refactor
- A new Intelligence facade (the existing `CloudPilotIntelligence` door is enough)
- Exposing Internal / OpenAI names in Prepare Message Reply
- A generic presentation engine for every conversation type
- Merging request wording into general chat
- Moving `pricing/`
- Moving `questions/` (decision: keep as pillar)
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
  2. `cloudPilot/chat/templates/requestTemplates.js` still contains `execution_requested` → `AtlasExecution.startNewAtlasExecution(payload)` inside `buildRequestTemplateMessage()`



#### Step 1 findings (inspection only — layer names below used the older model)

> **Historical table** — uses older bare “Reply” / Prepare Reply wording. Current/target vocabulary is **Message Reply**. Do not treat this table as the locked naming map.

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
2. `cloudPilot/chat/templates/requestTemplates.js` `buildRequestTemplateMessage()` still contains `execution_requested` → `AtlasExecution.startNewAtlasExecution(payload)`. That is execution/process behavior inside a reply-message builder.



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



### Step 5 — One-at-a-time reply-path names (applied)

**Rule was:** Lock names here one at a time; change code only when asked to apply. **Applied.**

- [x] Locked vocabulary: **Message** / **Response** / **Message Reply** (`messageReply` in code names)
- [x] `buildRequestTemplateMessage()` → `getRequestMessageReply()`
- [x] `getRequestReplyFacts()` → `getRequestMessageReplyContext()`
- [x] `shouldTryFriendlyReply()` → **REMOVE**
- [x] `getFriendlyReplyContext()` → `prepareFinalRequestMessageReplyForOpenAI()`
- [x] `generateFriendlyReply()` → `generateRequestMessageReply()`
- [x] `replyContainsRequiredFacts()` → `openAIResponseContainsRequiredValues()`
- [x] `presentRequestMessageInternal()` → `generateRequestMessageReplyInternal()`
- [x] `presentRequestMessageOpenAI()` → `generateRequestMessageReplyOpenAI()`
- [x] `speakGeneral()` → `prepareGeneralMessageReply()`
- [x] `speakRequest()` → `prepareRequestMessageReply()`
- [x] `speakKnown()` → `prepareKnownMessageReply()`
- [x] **OK (unchanged):** `processMessage()` · `generateGeneralMessageReply()` preferred later
- [x] Applied locked Step 5 renames to code

**Step 5:** 11 renames + 1 remove — **applied.** `prepare*` does not send — Reply Message stage does.

### `speak*` → `prepare*MessageReply()` (locked)

| Today | Preferred | Job |
|-------|-----------|-----|
| `speakGeneral` | `prepareGeneralMessageReply` | Get General wording + package Message Reply |
| `speakRequest` | `prepareRequestMessageReply` | Get Request wording + package Message Reply |
| `speakKnown` | `prepareKnownMessageReply` | Words already known + package Message Reply |

```text
prepare*  = CloudPilotMessage prepares the outgoing Message Reply (does NOT send)
generate* = Intelligence produces wording
```

**Does not send.** These return a packaged outcome (`cloudPilotMessage`, `chatType`, …).  
**Reply Message** stage (inside/`after` `processMessage`) is what sends/stores to the user.

**Known** = already-known wording (Question / scan / execution / error / cancel / change-strategy) — specific here; keep.

**Keep:** `processMessage()` · `generateGeneralMessageReply()`.

**Not Step 5:** Search same-context Internal | OpenAI — already finished in [Intelligence Provider](./feature_intelligence_provider.md).  
**Not Step 5:** Fixing the two responsibility leaks above — see [Message Reply Follow-ups](../future/feature_message_reply_followups.md).