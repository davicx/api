# CloudPilot — Message Architecture

**Purpose:** CloudPilot’s message pipeline — how every user message is understood, decided, and handled. **Conversation** (General vs Request) is one layer of this architecture, not the whole story.

**Status:** Phase 1–4 done. `chat/` removed. Optional: `context.js`, wire live OpenAI in `CloudPilotMessage`.

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

**Change** and **Strategy** are not additional pipeline layers — they are a **fork inside Request Workflow** when the active action mutates infrastructure. See [Request types and change strategies](#request-types-and-change-strategies).

---

## Request types and change strategies

A **request** is the full thing the user is trying to accomplish this turn — scan EC2, toggle EC2, undo, status, list open, etc. That is what **Request Conversation** orchestrates.

Not every request is the same *kind* of work. After Decide, when the active action is known:

```text
Request Conversation
        │
        ▼
What kind of action is this?

Information                    Change
(scan, inventory, status)      (toggle, create, delete)
        │                              │
        ▼                              ▼
Continue workflow              Once ready: choose change strategy
(no strategy menu)                     │
                                       ▼
                               How should CloudPilot apply this change?

                               1 Instructions
                               2 CLI
                               3 PR
                               4 Automatic
```

### Which requests use strategies?

| Request / action | Uses change strategies? |
|------------------|-------------------------|
| Scan EC2 | No |
| Inventory AWS | No |
| Scan S3 | No |
| Undo | No — conversation command |
| Status | No — conversation command |
| List open | No — conversation command |
| Toggle EC2 | Yes |
| Create EC2 | Yes |
| Delete EC2 | Yes |

The four options are **not** a request concern. They apply only when the active action is a **change** (today: `actionTier: 'destructive'` in `actionMap.js` with `executionModes` defined).

CloudPilot is not asking *“how should I answer this request?”* It is asking *“how should I apply this change?”* — a different question.

### Vocabulary

| Term | Meaning |
|------|---------|
| **Information request** | Read-only or reporting work — scan, inventory. No strategy menu. |
| **Change request** | Mutates infrastructure — toggle, create, delete. Strategy required when ready. |
| **Change strategy** | How the change is carried out — instructions, CLI, PR, automatic. User picks 1–4. |
| **Conversation command** | Workflow/decision control — undo, status, list open, confirm, cancel. Not a strategy. |

**Strategy** is stronger than **mode** long-term: it describes the user's choice (*how should this change happen?*), not a slot label. Code may still use `executionMode` / `executionModes` in state and `actionMap` until renamed.

### Code alignment today

| Concept | Code location |
|---------|----------------|
| Information vs change | `actionMap.js` — `actionTier: 'informational' \| 'destructive'` |
| Strategy list per action | `actionMap.js` — `executionModes: ['instructions', 'cli', 'pr', 'automatic']` |
| Strategy selection gate | `actionRequiresExecutionModeSelection()` in `actionMap.js` |
| User picks 1–4 | `decideNextStep.js` → `handleExecutionModeSelection()` |
| Automatic strategy (STEP 6) | `executionFunctions.js` → `change/strategies/automatic.js` |
| Instructions / CLI / PR (STEP 7) | `RequestConversation` → `change/strategies/` or `CloudPilotMessage.speakKnown()` |

Policy metadata may keep the word **destructive** (`actionTier`) even as architecture docs use **change** for product intent.

### Strategy implementations

Strategies are **not** children of `conversation/request/`. They are shared modules invoked from Request Workflow (automatic) and Request Conversation speak (instructions, CLI, PR).

```text
services/
    conversation/
        general/
        request/
            workflow.js         ← universal: all requests
            RequestConversation.js     ← universal: all requests

    change/
        strategies/
            instructions.js     ← STEP 7 speak
            cli.js
            pr.js
            automatic.js        ← STEP 6 execute
```

Future strategies (Terraform, CloudFormation, GitHub Actions) add files under `change/strategies/` without renaming the concept.

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
    CloudPilotMessage.js      ← how CloudPilot speaks (single voice)
    templates/
        fieldPromptExamples.js
        requestTemplates.js   ← request workflow copy (was CloudPilotChat)
    general/
        GeneralConversation.js
        workflow.js
        context.js              → later
    request/
        RequestConversation.js
        workflow.js
        context.js              → later

services/change/
    strategies/ ...

services/engines/
    llm/openai/openAIFunctions.js

services/executions/
    outcomes/outcomeRegistry.js
```

**`general/workflow.js`** — empty placeholder for now. Logs `General Conversation workflow not being used yet` and returns. General Conversation does not run store/execute today; the file keeps the folder symmetric with `request/` and leaves a hook for future work (memory, session context, safety gates, etc.).

**Naming note:** Entry files are **`GeneralConversation.js`** and **`RequestConversation.js`** (not generic `conversation.js` — avoids collision with Kite `functions/classes/Conversation.js`).

### Engines (implementation — vendor-agnostic in architecture)

Conversation systems **must not** bake in “OpenAI” as an architectural dependency. The engine is swappable.

```text
services/engines/
    llm/                      ← or ai/ — architecture doc uses this level
        openai/                 ← live (`openAIFunctions.js`)
        anthropic/              → future
        local/                  → future
```

**Do not** put `engines/openai/` at the top level in architecture diagrams — that locks the model to one vendor.

`services/chat/` **deleted** (Phase 4). `services/config/chatGPTconfig.js` may migrate under `engines/llm/openai/` later.

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
| CloudPilotMessage | `conversation/CloudPilotMessage.js` |
| Workflow ops | `conversation/request/workflow.js` |
| Change strategies | `change/strategies/` |
| Capabilities | `capabilities/` |
| Atlas | `capabilities/atlas/atlasPost.js` |
| Engines | `engines/llm/*` (implementation) |
| Response (legacy) | `responses/` → retiring |

Avoid **Response** as the name for conversation modules.

---

## Where things are today

**No LLM API call on the live general path.**

- STEP 1 `normalizeUserMessageForModel()` — `engines/llm/openai/openAIFunctions.js`
- General: `GeneralConversation` → `CloudPilotMessage.speakGeneral()` (stub)
- Request: `RequestConversation` → `CloudPilotMessage.speakRequest()` / `speakKnown()` (templates + strategies)
- General path skips STEPS 5–6 after STEP 4

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

### Phase 2 — Peel ✅ done

Moved logic from `responses/` into `conversation/`. Deleted `buildResponse.js`, `buildCloudPilotResponse.js`, `buildGeneralChatResponse.js`. Strategy stubs interim home was `conversation/request/modes/` → now `change/strategies/` (Phase 3b ✅).

### Phase 3 — Workflow module ✅ done

`conversation/request/workflow.js` — thin `store()` / `execute()` passthrough. Context layer (`context.js`, `prompts.js`) still future.

### Phase 3b — Change strategies folder ✅ done

1. Created `services/change/strategies/`.
2. Moved `conversation/request/modes/userRequested*.js` → `change/strategies/` (`instructions.js`, `cli.js`, `pr.js`, `automatic.js`).
3. Updated imports in `executionFunctions.js`, `conversation/request/RequestConversation.js`.
4. Deleted `request/modes/`.

No behavior change — correct architectural home for change-only logic.

### Phase 4 — CloudPilotMessage + retire `chat/` ✅ done

1. Added `conversation/CloudPilotMessage.js` — single speak voice (`speakGeneral`, `speakRequest`, `speakKnown`).
2. Moved `CloudPilotChat` → `conversation/templates/requestTemplates.js`.
3. Moved `fieldPromptExamples` → `conversation/templates/`.
4. Moved `openAI/` → `engines/llm/openai/`.
5. Moved `chatOutcomeRegistry` → `executions/outcomes/outcomeRegistry.js`.
6. Wired `GeneralConversation` and `RequestConversation` through `CloudPilotMessage`.
7. Deleted `services/chat/`.

### Phase 5 — Context + live engine (future)

`context.js`, `prompts.js` per conversation side. Wire `sendGeneralChat` in `CloudPilotMessage.speakGeneral()`.

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
| **Information request** | Read-only action — no change strategy |
| **Change request** | Mutating action — strategy menu when ready (`actionTier: destructive`) |
| **Change strategy** | How a change is applied — instructions, CLI, PR, automatic |
| **CloudPilotMessage** | How CloudPilot speaks — templates today; engine/hybrid later |
| **Conversation command** | undo, status, list open, confirm, cancel — not a strategy |

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
| `request/modes/` as home for strategy files | Strategies are change-only, not universal request logic |
| **CloudPilotChat** as architecture | Absorbed into `CloudPilotMessage` + `templates/requestTemplates.js` |
| **`chat/` folder** | Retired — each file re-homed by responsibility |
| **Mode** as architecture term | Prefer **change strategy** in docs; `executionMode` in code is fine until rename |

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
| Consciously defer | `context.js` / `prompts.js`; live OpenAI in `CloudPilotMessage` |

Phase 1 changes how the story reads — not what the system does (except General skips 5–6). That is the right first commit.
