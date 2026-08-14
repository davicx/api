# Feature Important Fixes — Clear names, clear folders

## What this does

Make CloudPilot readable six months from now: **one Turn is Message Processing then Response Building**, the words **request / speak / chat / present / write** mean different layers, and **small helpers are not top-level product folders**.

This is naming, mental model, and folder honesty — **not** new product behavior. Do not change runtime code until a step is asked for.

## Current step

**Plan locked** — awaiting **Step 1** (glossary / comments only).

## Next

Say **do Step 1** to write the vocabulary into a how-to. Do not start function renames or folder moves until that step (or a later numbered step) is asked for.

**Status:** Active (awaiting Step 1)  
**Codename:** `feature_important_fixes`  
**Came from:** Chat after [Feature Chat](../finished/feature_chat.md) — vocabulary confusion + `cloudPilot/pricing/` sitting next to big folders. Absorbs the former future spec [feature_code_reorganize](../future/feature_code_reorganize.md).  
**Related:** [Current Development](./current_development.md) · [Useful Price](./feature_useful_price.md) · [Questions](../finished/feature_questions.md) · [CloudPilot Context](../how_to/cloud_pilot_context.md) · [Intelligence front door](../finished/feature_intelligence_front_door.md) · [Code cleanup](../architecture/code_cleanup.md)

---

## Goal (one sentence)

**Turn = A then B.** Names stay long and literal. Keep the word **Request** on the request-reply path. Helpers like pricing nest under a real product job, not as a peer of chat / requests / scans.

---

## The problems

1. **Too many speaking verbs.** `chat`, `speak`, `present`, `write`, and `speakFacts` sound like five jobs. They are layers.
2. **`processMessage` vs “Message Processing.”** The function is the whole turn (A + B). The term A is only the figuring-out half.
3. **`pricing/` looks like a pillar.** It is two lookup files, not a conversation type or a workflow.
4. **`questions/` may be the same kind of mismatch** — product idea is big; the folder is one fulfillment file. Not decided. Think through before any move.

---

## Locked vocabulary — A then B

```text
USER MESSAGE
     ↓
A. MESSAGE PROCESSING
     ↓
CloudPilot now knows what is happening / what to do
     ↓
B. RESPONSE BUILDING
     ↓
USER GETS MESSAGE
```

| Term | Meaning |
|------|---------|
| **Turn** | One user message all the way to one CloudPilot reply. Today this is `processMessage()`. |
| **A. Message Processing** | Figure out what the user means and what CloudPilot should do. |
| **B. Response Building** | Take what CloudPilot already knows and prepare the message the user will receive. |

### A. Message Processing

**Purpose:** Figure out what the user means and what CloudPilot should do.

```text
Understand · Search · Find region · Load request
Collect fields · Decide · Execute · Get results
```

Some of this uses OpenAI. Some is Internal. That is okay.

**Test:** Are we figuring something out, or doing something because of the user's message? → **A**

### B. Response Building

**Purpose:** Take everything CloudPilot now knows and prepare the message the user will receive.

```text
Known facts/results
      ↓
Build internal/template response
      ↓
Optionally use OpenAI for friendly wording
      ↓
Final CloudPilot message
```

**Test:** Are we taking what we already know and turning it into the user's response? → **B**

```text
                CLOUDPILOT

USER
  │
  ▼
┌──────────────────────────────┐
│ A. MESSAGE PROCESSING        │
│ What does the user want?     │
│ What do we know / need?      │
│ What should we do? Do it.    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ B. RESPONSE BUILDING         │
│ What should we tell them?    │
│ Internal or OpenAI wording?  │
│ Build final response.        │
└──────────────┬───────────────┘
               │
               ▼
              USER
```

Region Search and Decide are both **A** (they process differently). Request templates and friendly OpenAI wording are both **B** (they build differently).

Intelligence can stay the GenAI front door. It should not be the mental model. A vs B should.

---

## Word map — request, speak, chat, present, write

These are **not** five equal jobs.

| Word | Means in CloudPilot | Layer |
|------|---------------------|-------|
| **Request** | A job the user wants done (scan, create, missing region, confirm). Not a speaking verb. | A (the workflow) |
| **Speak** | Build the message we send back (`CloudPilotMessage`: `speakGeneral` / `speakRequest` / `speakKnown`) | B front door |
| **Chat** | General-conversation OpenAI reply (`CloudPilotIntelligence.chat()`). Not all messaging. Questions must never call this. | B (A leftover fused in) |
| **Present** | Friendly rewrite of an already-built **request** template. Wording only. Fail → template. | B, inside `speakRequest` |
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
     ├─ yes → process the request (A)
     │         then speakRequest (B)
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
| A — learning or doing | verb of finding / deciding / executing | `searchRegion()`, `decideRequest()`, `executeRequest()` |
| B — telling | verb of building / wording a reply | `buildRequestResponseMessage()`, `createFriendlyRequestResponse()` |

Keep **Request** on request-conversation B names. Do **not** collapse to `buildContext()` or `createResponse()`. Prefer longer, literal names. Test: *I can open this six months from now and immediately know what it does.*

### `processMessage` collision

**`processMessage` in code is A + B, not A.**

Lock this even if the function is not renamed:

- **Turn** / handle user message = A then B (the function you already have)
- **Message Processing** = A only
- **Response Building** = B only

Do not use “process message” for both.

### General Chat is fused

- **Decide it is general chat** → A
- **Write the general-chat reply** → B (today `chat()` still thinks a bit while it writes)

Request path splits A and B. Questions split too (search = A, `speakKnown` = B). General Chat does not. That is a real difference, not a naming bug.

---

## Proposed request-path names (when a rename step is asked)

Feature Chat’s B path is correct. The names are the confusing part.

| Current | Suggested | Plain English |
|---------|-----------|---------------|
| `speakRequest()` | `buildRequestResponseMessage()` | Build the response we're sending for a request |
| `buildRequestSpeakFacts()` | `buildRequestResponseContext()` | Gather the known info needed to write that response |
| `speakFacts` | `requestResponseContext` | The known information for the response |
| `presentRequestMessage()` | `createFriendlyRequestResponse()` | Try to create the friendly version of the response |
| `presentRequestMessageOpenAI()` | `createFriendlyRequestResponseWithOpenAI()` | Have OpenAI create the friendly response |
| `presentRequestMessageInternal()` | `useInternalRequestResponse()` | Don't use OpenAI; keep internal/template response |
| `shouldPresentRequestMessage()` | `shouldCreateFriendlyRequestResponse()` | Decide whether friendly rewriting applies |
| `buildRequestPresentationMessages()` | `buildOpenAIRequestResponsePrompt()` | Build what gets sent to OpenAI |
| `presentedMessageKeepsFacts()` | `friendlyRequestResponseKeepsKnownValues()` | Make sure OpenAI didn't drop known values |

```text
CloudPilotMessage.js
    ↓
buildRequestResponseContext.js
    ↓
createFriendlyRequestResponse.js
```

Leave `speakGeneral` and `speakKnown` in their own families. Do not pull them into this Request naming, or it will look like one presentation engine for everything.

**Tweaks to keep:**

1. **`requestResponseContext` vs Intelligence “context.”** Better than `speakFacts`. If the collision hurts, use `requestResponseKnownInfo`. Never `buildContext()`.
2. The fact-guard is not suggestions-only (mode 1–4, collected confirm values, acknowledged field, estimated cost). Prefer `friendlyRequestResponseKeepsKnownValues()`.
3. Friendly create often does nothing (Internal no-op). Optional parent name: `tryCreateFriendlyRequestResponse()`.

Today’s map (do not rewrite yet):

| Today | Job |
|-------|-----|
| `understandMessage`, region/action/question search | A |
| `decideNextStep`, collect fields, execute | A |
| `buildRequestTemplateMessage` | B |
| `buildRequestSpeakFacts` | B — pack known info for the reply |
| `presentRequestMessage` | B — optional friendly wording |
| `speakKnown` | B, Internal only |
| `speakGeneral` / `chat()` | B slot, A+B fused |
| `CloudPilotIntelligence` | mixed A and B behind one GenAI door |
| `processMessage()` | the **Turn** (A then B) |

---

## Folders — BIG vs small

Top-level `cloudPilot/` folders should be **product jobs**:

| Folder | Job |
|--------|-----|
| `chat/` | Build the user-facing message |
| `requests/` | Track the open job |
| `actions/` | Do the AWS work |
| `scans/` | Read AWS / Atlas |
| `history/` | What changed / undo |
| `knowledge/` | Facts CloudPilot already stores |
| `questions/` | **Open — see below.** Product “Question” vs this folder. |

**`pricing/` is not a big CloudPilot responsibility.** It is two helper files (hourly lookup + daily/monthly estimate). Scan Cost column uses it. Create-EC2 speak uses it. That is a **shared lookup**, not a conversation type and not a workflow.

It is **not** billing (`scans/billing/` = AWS bill) and **not** OpenAI token cost (`providers/openAI/usage/`).

```text
BIG:     chat  requests  actions  scans  history  knowledge
SMALL:   pricing  (rate lookup used by scan + create speak)
UNSURE:  questions  (product idea is big; folder is thin — think through)
```

**Later nest (do not move while [Useful Price](./feature_useful_price.md) is still in current):** next to **knowledge**, not under `scans/ec2/` (create would depend on scans) and not only under `actions/createEC2/` (scan uses it too). Same pattern as org knowledge: CloudPilot DB owns the truth; do not invent; omit if missing.

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
- A generic presentation engine for every conversation type
- Merging request wording into general chat
- Moving `pricing/` before Useful Price is finished
- Moving `questions/` until the open note is decided
- A giant context framework
- Live OpenAI smokes just to prove a rename

---

## Steps

### Step 1 — Glossary / comments only

- [ ] How-to (or short glossary) with Turn / A / B and the word map
- [ ] Optionally note in comments that `processMessage` is the Turn
- [ ] No function renames, no file moves

### Step 2 — Request B names (behavior identical)

- [ ] Rename Feature Chat request-response functions and the two files to the table above
- [ ] Keep templates, fact-guard, and fallback unchanged

### Step 3 — Nest `pricing/` (after Useful Price is finished)

- [ ] Move the two pricing files next to knowledge (or equivalent supporting home)
- [ ] Fix requires only; no estimate-behavior change

### Step 4 — Optional later

- [ ] `speakGeneral` / `speakKnown` names
- [ ] Whether `processMessage` should become `handleUserTurn` or similar
- [ ] Think through `cloudPilot/questions/` (product Question vs thin folder) — no move until decided
