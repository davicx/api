# CloudPilot — Message Architecture

**Purpose:** CloudPilot’s message pipeline — how every user message is understood, decided, and handled. **Conversation** (General vs Request) is one layer of this architecture, not the whole story.

**Status:** Phase 1 done — conversation modules + orchestrator fork. Phase 2 (peel `responses/`) pending.

**Related:**

| Doc | Role |
|-----|------|
| [architecture.md](./architecture.md) | Full system reference |
| [step_one_cleanup.md](./step_one_cleanup.md) | Dead code cleanup |
| [capability_migration.md](./capability_migration.md) | Capability HOW layer |

**Last reviewed:** 2026-06-23

---

## Design principle

> **Every user message is exactly one conversation.**

Not one workflow, one execution, and one response as separate top-level ideas — **one conversation**.

Use this as a decision filter: if a change treats workflow, execution, and response as three unrelated user-facing concepts, it probably doesn’t fit the model.

---

## Message pipeline (full stack)

Early CloudPilot was organized around technologies (Atlas, OpenAI, handlers, responses). The durable model is organized around **intent**:

```text
User Message
      │
      ▼
Understand          What did the user mean?
      │
      ▼
Decide              Which conversation is this?
      │
      ▼
Conversation        General or Request
      │
      ▼
Workflow            What needs to happen? (Request only — internal)
      │
      ▼
Capabilities          How do we do it?
      │
      ▼
Atlas                 Where does it run?
```

**Conversation** is one part of the message architecture — not a synonym for the whole pipeline.

---

## Explain CloudPilot in one minute

> CloudPilot has one message pipeline. Every message is understood and decided, then becomes either a **General Conversation** or a **Request Conversation**. A Request Conversation orchestrates request state, may execute work through capabilities and Atlas, and then responds. A General Conversation gathers context and responds.

No vendor or implementation details required.

---

## What someone new must learn

1. **Understand** — What did the user mean?
2. **Decide** — Which conversation is this?
3. **General Conversation** — Talk with the user.
4. **Request Conversation** — Help the user accomplish work.

Everything else — request state, workflow operations, execution, history, capabilities, Atlas, AI — is **how Request Conversation orchestrates its turn** (or how General Conversation gathers context). Not separate top-level concepts in diagrams.

---

## Two conversation types (only two at the gate)

After Understand + Decide:

```text
User Message → Understand → Decide
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
General Conversation    Request Conversation
```

| Type | User intent |
|------|-------------|
| **General Conversation** | User is just talking |
| **Request Conversation** | User wants CloudPilot to help accomplish work |

Neither type is defined by OpenAI, Atlas, or the database. They are defined by **the kind of conversation CloudPilot is having.**

**Request Conversation orchestrates the full request turn** — it does not literally perform everything. It coordinates request state, workflow operations, capabilities, Atlas, AI (when used), and the spoken response.

### General Conversation (internal evolution)

```text
Today:     conversation() → engine (when wired)
Later:     context → knowledge → memory → prompt → engine → safety → message
```

### Request Conversation (internal evolution)

```text
Today:
    workflow.store()        (STEP 5)
    workflow.execute()      (STEP 6)
    conversation()          (STEP 7)

Later:
    request state → history → execution results
    → knowledge → prompt → engine (OpenAI, rules, or hybrid) → message
```

**Workflow** (store, execute) is an implementation detail inside Request Conversation — not a third top-level concept. The user never thinks *“now I’m entering the workflow.”*

---

## Four layers (they don’t overlap)

| Layer | Question |
|-------|----------|
| **Conversation** | What are we trying to accomplish? |
| **Workflow** | What needs to happen? |
| **Capabilities** | How do we do it? |
| **Atlas** | Where does it run? |

Conversation = intent. Workflow = operations inside Request Conversation. Capabilities = HOW. Atlas = WHERE.

Do not change this four-layer split.

---

## Context layer (symmetric future)

Same pipeline shape; different context sources. **Conversation modules choose an engine; they do not hard-code a vendor.**

```text
General Conversation:
    Context → Knowledge → Prompt → engine

Request Conversation:
    Request State → History → Execution Results
    → Knowledge → Prompt → engine (or rules first; engine only if needed)
```

Add `context.js`, `prompts.js`, etc. per side when ready — not required for Phase 1.

---

## Target shape of `processMessage()`

**Keep STEP 1–7 visible** in one file. Do not hide 5–7 inside an opaque wrapper from the orchestrator.

```text
STEP 1  Normalize
STEP 2  Load Request
STEP 3  Understand
STEP 4  Decide

if General Conversation
    return GeneralConversation.conversation()

STEP 5  Request Conversation — maintain state
STEP 6  Request Conversation — perform work
STEP 7  Request Conversation — speak

return
```

Orchestrator pseudocode:

```javascript
// STEP 1–4: normalize, load, understand, decide

if (isGeneralConversation(decision)) {
    return finishOutcome(
        await GeneralConversation.conversation({ currentUserMessage, context: processMessageContext })
    );
}

// STEP 5 — Request Conversation: maintain state
const requestOutcome = await RequestWorkflow.store(decision, { ... });

// STEP 6 — Request Conversation: perform work
const executionOutcome = await RequestWorkflow.execute(decision, { ... });

// STEP 7 — Request Conversation: speak
const message = await RequestConversation.conversation({
    decision,
    conversationID,
    currentUserMessage,
    requestOutcome,
    requestState: currentRequestState,
    executionOutcome,
    context: processMessageContext
});

return finishOutcome(message);
```

Decision signal today: `decision.chatType === 'generalChatResponding'` (helper: `isGeneralConversation(decision)`).

---

## Folder layout

### Conversation systems (intent)

```text
services/conversation/
    general/
        conversation.js       ← entry (Phase 1)
        workflow.js             ← no-op stub today (symmetry + future hooks)
        context.js              → later

    request/
        conversation.js         ← speak (STEP 7 entry)
        workflow.js             ← store(), execute()
        context.js              → later
```

**`general/workflow.js`** — empty placeholder for now. Logs `General Conversation workflow not being used yet` and returns. General Conversation does not run store/execute today; the file keeps the folder symmetric with `request/` and leaves a hook for future work (memory, session context, safety gates, etc.).

**Naming note:** Prefer **`conversation.js`** as the entry file over `chat.js`. Phase 1 may ship `chat.js` and rename later without behavior change.

### Engines (implementation — vendor-agnostic in architecture)

Conversation systems **must not** bake in “OpenAI” as an architectural dependency. The engine is swappable.

```text
services/engines/
    llm/                      ← or ai/ — architecture doc uses this level
        openai/                 ← implementation only (today’s chat/openAI/)
        anthropic/              → future
        local/                  → future
```

**Do not** put `engines/openai/` at the top level in architecture diagrams — that locks the model to one vendor. Phase 1 may still import from existing `chat/openAI/` paths; migrate under `engines/llm/openai/` when convenient. **Not blocking Phase 1.**

Legacy `services/chat/` and `services/config/chatGPTconfig.js` → migrate into `engines/llm/openai/` over time.

### No collision

| Path | Role |
|------|------|
| `services/conversation/` | Message **conversation** systems |
| `services/engines/llm/*` | **LLM vendor SDKs** (implementation) |
| `capabilities/conversation/` | Thin capability HOW wrapper |

`responses/` → absorbed into `conversation/request/`. Remove `buildResponse()` router from orchestrator.

---

## Layer map (folders)

| Layer | Location |
|-------|----------|
| Message orchestrator | `cloudPilotMessageFunctions.js` |
| Understand | `understanding/` |
| Decide | `decision/` |
| Conversation | `conversation/general/`, `conversation/request/` |
| Workflow ops | `conversation/request/workflow.js` |
| Capabilities | `capabilities/` |
| Atlas | `capabilities/atlas/atlasPost.js` |
| Engines | `engines/llm/*` (implementation) |
| Response (legacy) | `responses/` → retiring |

Avoid **Response** as the name for conversation modules.

---

## Where things are today

**No LLM API call on the live path.**

- STEP 1 `normalizeUserMessageForModel()` — trim/validate only.
- General: `buildGeneralChatResponse` → stubbed `sendGeneralChat`.
- Request: `buildCloudPilotResponse` → `CloudPilotChat` (templates).
- General path still runs STEPS 5–6 today (no-ops) — Phase 1 adds early exit after STEP 4.

---

## Phased implementation

### Phase 1 — Tiny (wrap + fork) ← **start here**

Architecture change without behavior change (except General skips 5–6).

1. Add `conversation/general/chat.js` (or `conversation.js`) — wrap `buildGeneralChatResponse`.
2. Add `conversation/request/chat.js` (or `conversation.js`) — wrap `buildCloudPilotResponse`.
3. Orchestrator: early return for General Conversation after STEP 4.
4. Orchestrator: STEP 7 → Request Conversation entry; update STEP 5–7 comments.
5. Remove `ResponseFunctions.buildResponse` from orchestrator.

Do **not** make Phase 1 bigger. No engine folder move required yet.

### Phase 2 — Peel

Move logic from `responses/` into conversation modules. Consider `chat.js` → `conversation.js` rename.

### Phase 3 — Workflow module + context

`workflow.js` wraps store/execute. `context.js` / `prompts.js` per side.

### Phase 4 — Engines + docs

Migrate `chat/openAI/` → `engines/llm/openai/`. Align [architecture.md](./architecture.md) vocabulary.

---

## Glossary

| Term | Meaning |
|------|---------|
| **Message pipeline** | Understand → Decide → Conversation → Workflow → Capabilities → Atlas |
| **Conversation** | General or Request — kind of turn after Decide |
| **General Conversation** | Normal talk; no request work |
| **Request Conversation** | Orchestrates a request turn — state, work, speak |
| **Request** | User wants something done — `cloudpilot_requests` row |
| **Action** | Thing CloudPilot can do — `actionMap` entry |
| **Workflow** (internal) | store + execute inside Request Conversation |

Orchestrator renames (done): `currentRequestState`, `activeRequestAction`, `RequestStateFunctions`.

---

## What not to do

| Anti-pattern | Why |
|--------------|-----|
| Call this doc only “Conversation Architecture” | Conversation is one layer of the **message** pipeline |
| Vendor names in architecture diagrams (`engines/openai/` as top level) | Engine is implementation; use `engines/llm/` |
| Conversation modules importing OpenAI directly as architecture | Choose engine behind an interface |
| Third top-level “Request Workflow” in diagrams | Workflow is inside Request Conversation |
| Hide STEPS 5–7 in orchestrator | Loses onboarding |
| `responses/` as the conversation home | Wrong boundary |

---

## Exit test

Open `processMessage()` only:

1. General Conversation → obvious call after STEP 4 + return.
2. STEPS 5–7 labeled **Request Conversation** (maintain state / perform work / speak).
3. No `buildResponse()` in orchestrator.
4. Two conversation types at the gate; full message stack documented here.

Smoke: `"hello"` → General, skips 5–6. `"scan ec2"` → Request through 5–7.

---

## Readiness

**Ready for Phase 1.**

| Ready | Notes |
|-------|--------|
| Message architecture agreed | Pipeline + two conversations + four layers |
| Phase 1 scope | Wrap + fork + comments only |
| Risk | Low |
| Consciously defer | `engines/llm/` migration; `conversation.js` rename; `architecture.md` full pass |

Phase 1 changes how the story reads — not what the system does (except General skips 5–6). That is the right first commit.
