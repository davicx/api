# Code Cleanup — Conversation Engines & Orchestrator Clarity

**Purpose:** Document planned structure and naming so the codebase reads clearly — especially **what kind of conversation CloudPilot is having** and **where words are generated**.

**Status:** Partially done — orchestrator glossary + request-state renames shipped; conversation-engine split planned (no code yet).

**Related:**

| Doc | Role |
|-----|------|
| [architecture.md](./architecture.md) | Glossary, first gate (Request Workflow vs General Chat), pipeline |
| [step_one_cleanup.md](./step_one_cleanup.md) | Dead code cleanup before capability layer |
| [capability_migration.md](./capability_migration.md) | Capability layer — C0–C9 |

**Last reviewed:** 2026-06-23

---

## The real problem

The bigger issue is not function names alone — it is **discoverability**.

When reading `processMessage()`, you should immediately know:

1. Is this **General Chat** or **Request Chat**?
2. **Where are the words generated?**

Today General Chat is buried:

```text
processMessage()
  ↓
ResponseFunctions.buildResponse()
  ↓
buildGeneralChatResponse()
  ↓
sendGeneralChat()   ← stubbed; three layers down
```

Someone asking *"Where does ChatGPT get called?"* cannot answer from the orchestrator. The pipeline does not tell the story.

---

## Core idea: two conversation engines

Not two LLMs. Not two providers.

Two **conversation engines** — split by **intent**, not **implementation**:

```text
User Message
      │
      ▼
Understand
      │
      ▼
Decide
      │
 ┌────┴────┐
 │         │
 ▼         ▼
General    Request
 Chat       Chat
```

| Engine | Meaning |
|--------|---------|
| **GeneralChat** | The user is just talking. Not a request. |
| **RequestChat** | The user is interacting with CloudPilot to accomplish work. |

How words are produced inside each engine is an implementation detail that can change over time (templates, OpenAI, Anthropic, rules, CloudPilot LLM).

---

## Workflow vs conversation (important separation)

Do **not** move Steps 5–7 into `RequestChat.chat()`.

`processMessage()` stays the orchestrator. The value of that file is the visible pipeline:

```text
STEP 1  Normalize
STEP 2  Load Request
STEP 3  Understand
STEP 4  Decide
STEP 5  Store
STEP 6  Execute
STEP 7  Speak
```

| Term | Means | Steps |
|------|--------|-------|
| **Request Workflow** | Doing the work — store state, run Atlas | 5–6 |
| **Request Chat** | Producing the words CloudPilot says on a request turn | 7 only |
| **General Chat** | Producing the words for a non-request turn | early exit after 4 |

**`RequestChat` is not "the request workflow."** It is simply the thing that produces words for a request.

---

## Target shape of `processMessage()`

```text
STEP 1  Normalize
STEP 2  Load Request
STEP 3  Understand
STEP 4  Decide

General Chat?
    ↓
GeneralChat.chat()
    ↓
return

Otherwise (Request path)…

STEP 5  Store
STEP 6  Execute
STEP 7  RequestChat.chat()

return
```

Orchestrator pseudocode:

```javascript
// STEP 1–4: normalize, load, understand, decide

if (isGeneralChat(decision)) {
    return finishOutcome(await GeneralChat.chat({ currentUserMessage, conversationID, context }));
}

// Request Workflow — pipeline stays visible
// STEP 5: applyDecision(...)
// STEP 6: executeRequest(...)

const chatMessage = await RequestChat.chat({
    decision,
    conversationID,
    currentUserMessage,
    requestState: currentRequestState,
    requestOutcome,
    executionOutcome,
    context
});

return finishOutcome(chatMessage);
```

Decision signal in code today: `decision.chatType === 'generalChatResponding'` (helper: `isGeneralChat(decision)`).

---

## What each engine does

### GeneralChat.chat() — entire General Chat lane

Called once after STEP 4. Skips Steps 5–6 (no request row, no Atlas).

```text
Today:
GeneralChat.chat()
    ↓
OpenAI (sendGeneralChat)

Later:
GeneralChat.chat()
    ↓
buildGeneralChatContext()
    ↓
OpenAI (or other engine)
```

### RequestChat.chat() — STEP 7 only

Called after Steps 5–6. Does **not** replace store or execute.

```text
Today:
RequestChat.chat()
    ├─ execution already ran?     → executionOutcome.cloudPilotMessage
    ├─ user-requested mode 1–3?   → instructions / CLI / PR stubs
    └─ default                    → CloudPilotChat.handleCloudPilotChat()

Later (same interface):
RequestChat.chat()
    ↓
buildRequestContext()
    ↓
OpenAI / Anthropic / CloudPilot LLM / rules + LLM
```

Steps 5–6 unchanged when Step 7's engine changes.

---

## Identical interface

Both engines expose the same call pattern:

```javascript
const message = await GeneralChat.chat(input);
const message = await RequestChat.chat(input);
```

Shared return shape (keep wire compatibility): `cloudPilotMessage`, `chatType`, `atlasResponse`, `error`, `success`.

`processMessage` merges into `processMessageOutcome` via a small `finishOutcome()` helper.

---

## Folder layout (target)

```text
services/chat/
    generalChat.js       → GeneralChat.chat()
    requestChat.js       → RequestChat.chat()
    openAI/              → engine (implementation detail; not the architectural lane)
```

`responses/` becomes an **implementation detail inside `requestChat.js`** (today's `buildCloudPilotResponse`, modes, `CloudPilotChat`). **`processMessage` should not import `responses/` directly.**

Remove the dual-path **`buildResponse()` router** — the fork lives in the orchestrator, not buried in STEP 7.

---

## Where OpenAI is touched today (reference)

**Live `processMessage` path: OpenAI is not called today.**

STEP 1 uses `openAIFunctions.normalizeUserMessageForModel()` — **internal only** (trim + empty check). It does **not** hit the OpenAI API. It lives in the OpenAI module as a shared helper; that is not "using OpenAI."

```text
processMessage (today)
  STEP 1  normalizeUserMessageForModel()   ← internal trim/validate only
  STEP 2–4  load / understand / decide
  STEP 5–6  store / execute                ← runs for all messages today (General Chat no-ops)
  STEP 7  buildResponse()
            ├─ General Chat → buildGeneralChatResponse → sendGeneralChat()  ← stubbed
            └─ Request      → buildCloudPilotResponse → CloudPilotChat
```

After cleanup: General Chat exits after STEP 4; OpenAI call site is **`GeneralChat.chat()`** — one obvious line in `processMessage`.

---

## Current naming (overloaded)

| Today | Problem |
|-------|---------|
| `buildResponse()` | Dual-path router hidden in STEP 7; "response" = everything |
| `buildGeneralChatResponse()` | General Chat discoverability buried |
| `buildCloudPilotResponse()` | Sounds like product name, not "Request Chat engine" |
| `ResponseFunctions.buildResponse` in orchestrator | Hides conversation type |

---

## Target naming

| Today | Target |
|-------|--------|
| Early General Chat path (new) | `GeneralChat.chat()` in `chat/generalChat.js` |
| STEP 7 Request path | `RequestChat.chat()` in `chat/requestChat.js` |
| `responses/buildResponse.js` | **Remove** — fork moves to orchestrator |
| `responses/buildGeneralChatResponse.js` | Logic moves into `generalChat.js` |
| `responses/buildCloudPilotResponse.js` | Logic moves into `requestChat.js` (or imported by it) |
| Orchestrator STEP 7 call | `RequestChat.chat(...)` |
| Orchestrator after STEP 4 | `GeneralChat.chat(...)` + early return |

Prefer **`RequestChat`** over `getRequestWorkflowMessage` — Request Chat is the conversation engine, not the workflow.

Keep **`CloudPilotChat`** as an internal implementation detail inside `requestChat.js`.

Keep **`chatType`** on outcomes (`generalChatResponding` vs `cloudPilotResponding`) for clients/debug.

---

## Context Layer (next) — hooks

Context builders live **inside** each engine, not in the orchestrator:

```text
GeneralChat.chat()
    buildGeneralChatContext()
    → engine

RequestChat.chat()
    buildRequestContext()     ← request state, decision, execution, navigator
    → engine
```

**`buildRequestContext`** may include: `requestState`, `decision`, `executionOutcome`, `actionDefinition`, missing/collected fields, Navigator / Atlas summary when present.

**`buildGeneralChatContext`** may include: user message, conversation history (later). Not request workflow state on the General Chat path.

---

## Glossary (Request vs Action) — done in orchestrator

Already applied in `cloudPilotMessageFunctions.js` and [architecture.md](./architecture.md):

| Term | Meaning |
|------|---------|
| **Request** | User wants CloudPilot to do something — workflow in `cloudpilot_requests` |
| **Action** | Thing CloudPilot knows how to do — `scan_ec2`, `toggle_ec2`, … in `actionMap` |
| **General Chat** | Not a request — conversation engine; OpenAI today |
| **Request Chat** | Words for a request turn — conversation engine; templates today |

Orchestrator renames (done):

| Was | Now |
|-----|-----|
| `currentActionState` | `currentRequestState` |
| `activeAction` | `activeRequestAction` |
| `ActionStateFunctions` | `RequestStateFunctions` (import alias for `requestLoadFunctions.js`) |

Deferred legacy names: `ActionState` class, `getUsersActionState`, `emptyActionState`, `actionStatus` on API outcome, `cloudPilotMessage` wire field.

---

## What not to rename (yet)

| Item | Why wait |
|------|----------|
| `cloudPilotMessage` on API outcome | Clients / Kite may depend on field name |
| `processMessageOutcome` | Larger surface — separate pass |
| `CloudPilotChat` | Internal to `requestChat.js` |
| `ActionState` class / `getUsersActionState` | Wide rename — dedicated pass |

---

## Recommended order of work

| Step | Work | Risk |
|------|------|------|
| **1** | Add `chat/generalChat.js` — `GeneralChat.chat()`; wire live `sendGeneralChat` | Low |
| **2** | Add `chat/requestChat.js` — `RequestChat.chat()`; move logic from `buildCloudPilotResponse` | Low |
| **3** | Orchestrator: early return after STEP 4 for General Chat; STEP 7 calls `RequestChat.chat()` only | Low |
| **4** | Remove `buildResponse()` router and direct `responses/` imports from orchestrator | Low |
| **5** | Update [architecture.md](./architecture.md) — conversation engines + orchestrator shape | None |
| **6** | Add `buildGeneralChatContext` / `buildRequestContext` | Medium — Context Layer |

Do **1–3** before adding more response logic.

---

## Exit test (after cleanup)

Open `processMessage()` only — without opening sub-files, confirm:

1. **General Chat** → `GeneralChat.chat()` appears right after STEP 4 (early return).
2. **Request path** → Steps 5–6 visible; STEP 7 is `RequestChat.chat()`.
3. No `ResponseFunctions.buildResponse()` in the orchestrator.
4. OpenAI / General Chat is not three layers deep.

Smoke: `"hello"` → General Chat, skips 5–6; `"scan ec2"` → Steps 5–6 run, then `RequestChat.chat()`.
