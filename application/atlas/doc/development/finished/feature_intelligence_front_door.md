# Intelligence Front Door

## What this does

Makes `CloudPilotIntelligence.js` the **only front door** for GenAI.

If someone asks “Where does CloudPilot talk to AI?”, the answer is one file:

```text
cloudPilotIntelligence/CloudPilotIntelligence.js
```

That file does not need to hold every implementation. It is the entry point. Every GenAI capability starts there and delegates to smaller modules.

## Status

**Finished** — 2026-08-04  

Shipped:

- `CloudPilotIntelligence.chat()` → `conversation/chat.js`
- `CloudPilotMessage.speakGeneral` is a thin voice wrapper
- Understand methods remain under FUNCTIONS B
- `speakKnown` / `speakRequest` unchanged

**Related:** [Current Development](../current/current_development.md) · [Organizational Knowledge](../current/feature_organizational_knowledge.md) · [Use OpenAI Chat](../how_to/use_openai_chat.md) · [OpenAI Logs](./feature_openai_logs.md)

---

## Why this exists

Previously almost everything intelligent lived under Intelligence — **except** the biggest GenAI path (`speakGeneral` → OpenAI). That inconsistency is fixed: every GenAI feature (including Organizational Knowledge) plugs into the same door.

---

## Locked idea

**Do not move the `chat/` folder.**  
The folder is fine. GenAI guts live behind Intelligence; `speakGeneral` only selects the strategy and packages the result.

**CloudPilotMessage is the product's voice. CloudPilotIntelligence is the product's brain.**

| Layer | Owns | Think of it as |
|-------|------|----------------|
| **CloudPilotMessage** (Voice) | Select speaking strategy; package for UI; `formatOutgoing`; never do AI reasoning | “I have something to say. How should I present it?” |
| **CloudPilotIntelligence** (Brain) | Understand; GenAI context/history; org knowledge; Internal vs OpenAI; generate text | “What should CloudPilot say?” |
| **providers/openAI** | External AI transport | “Talk to the model.” |

Speaking strategies (product presentation — stay in CloudPilotMessage):

```text
speakGeneral()
speakKnown()
speakRequest()
(+ later: speakError, speakConfirmation, speakUndo, …)
```

Not AI capabilities — presentation strategies.

**General Chat is not a product feature.**  
It is an entry point into the brain: Intelligence `chat()`.

Name:

```text
Conversation → chat()
```

not `generalChat()`.

CloudPilot still decides *which* conversation (general vs request vs follow-up).  
Intelligence only receives context and thinks.

English-like flow (locked) — Message **bookends** Intelligence:

```text
processMessage()
      ↓
GeneralConversation
      ↓
CloudPilotMessage.speakGeneral()     # voice: which strategy?
      ↓
CloudPilotIntelligence.chat()        # brain: GenAI
      ↓
CloudPilotMessage.formatOutgoing()   # voice: package for UI
      ↓
Return to UI
```

```text
CloudPilotMessage  →  CloudPilotIntelligence  →  CloudPilotMessage
     (how)                    (what)                   (package)
```

Three layers, little overlap:

```text
CloudPilot              → user experience
CloudPilotIntelligence  → reasoning
Providers               → external AI / systems
```

---

## Gather Context, then speak once

Search / understand functions are **not** “AI features that answer the user.”

They are **context gatherers**:

```text
User Message
      │
      ▼
CloudPilot
      │
Gather Context (Intelligence understand / search)
      │
      ├── searchForAction()
      ├── searchForRegion()
      ├── searchForResource() / values
      ├── searchForOrganizationalKnowledge()
      └── …future searches (GitHub, Jira, cost center, runbook, …)
      │
Each asks: "Did I find something useful?"
Each returns structured facts only — never the user-facing answer.
      │
      ▼
CloudPilot builds the situation context
(current request, history, AWS findings, org knowledge, region, action, …)
      │
      ▼
Decide speaking strategy
      │
      ├── speakKnown / speakRequest  → deterministic product answer (Questions, templates)
      │
      └── speakGeneral
                │
                ▼
        CloudPilotIntelligence.chat(context)   ← exactly one GenAI speak
                │
                ▼
        One response
```

Mental rename for the understand phase:

```text
Gather Context   (not “run a bunch of AI features”)
```

Scales cleanly: new `searchForX()` only adds facts. CloudPilot still answers **once** per user message.

**Important nuance (locked):**  
Not every turn calls `chat()`. Questions (open requests, history) and request templates stay on `speakKnown` / `speakRequest`.  
`chat()` is used when the product chooses the GenAI conversation strategy — and then there is **exactly one** GenAI call for that turn, with all gathered context already attached.

---

## Target facade

```text
CloudPilotIntelligence.js

FUNCTIONS A: Conversation
    A1: chat(...)

FUNCTIONS B: Understand
    B1: understandMessage
    B2: understandRegion
    B3: understandAction
    B4: understandResource
    B5: understandOrganizationalKnowledge   # later / with org-knowledge feature

FUNCTIONS C: Explain      (placeholder)
FUNCTIONS D: Improve      (placeholder)
FUNCTIONS E: Generate     (placeholder)
```

Capabilities, not a pile of one-off features:

```text
CloudPilot
      │
      ▼
CloudPilotIntelligence
      │
      ├── chat()
      ├── understand...
      ├── explain()
      ├── improve()
      └── generate()
```

---

## Responsibility split

| Layer | Owns |
|-------|------|
| **CloudPilot** | Product turn: decide Conversation / Question / Action; `speakKnown` templates; when AI is allowed |
| **CloudPilotIntelligence** | All GenAI: `chat()`, understand extractors that use AI, future explain/improve/generate |
| **providers/openAI** | Transport only (HTTP, usage, raw completion) |

```text
CloudPilot
      │
      ▼
Should I use AI?
      │
      ▼
CloudPilotIntelligence.chat()
      │
      ├── buildContext()
      ├── buildConversationHistory()
      ├── appendAWSContext()            # when available
      ├── appendOrganizationKnowledge() # when understand says so
      ├── Call OpenAI  OR  Internal stub
      └── Return response
```

There is exactly one place to look for “how CloudPilot talks to AI.”

---

## What stays in CloudPilot

* `decideNextStep` — Conversation vs Question vs Action
* `speakKnown` — deterministic answers (open requests, history, templates)
* Thin wrappers like `CloudPilotMessage.speakGeneral` that **call** `chat()` and shape the CloudPilot message result

What moves behind the facade:

* Context assembly for GenAI chat
* History for GenAI chat
* Internal stub vs OpenAI send
* OpenAI logging for that chat call

---

## Organizational Knowledge becomes small

It is not a special responder. It is **context for Conversation**.

```text
Understand
      │
searchForOrganizationalKnowledge()
      │
OrganizationKnowledgeFunctions.load()   # one matching row
      │
append to chat context
      │
CloudPilotIntelligence.chat()
```

Same pattern later for other context providers. No `respondS3Knowledge.js`.

---

## Steps

### Step 1 — Design lock (this doc)

- [x] Intelligence is the only GenAI front door
- [x] Name the umbrella **Conversation** with `chat()`
- [x] Understand becomes FUNCTIONS B
- [x] Org knowledge = context provider, not a separate response system

### Step 2 — Facade shape only

1. [x] Reorder `CloudPilotIntelligence.js` comments and exports:
   - A Conversation → `chat` (stub until Step 3)
   - B Understand → existing understand methods
   - C–E placeholders renumbered
2. [x] No behavior change for users yet (`speakGeneral` still owns GenAI).

### Step 3 — Implement `chat()`

1. [x] Lift GenAI pieces from `CloudPilotMessage.speakGeneral` into `cloudPilotIntelligence/conversation/chat.js`.
2. [x] Keep ENV: master off → stub; `MESSAGE_RESPONSE=openai` → live send.
3. [x] Keep OpenAI logs on the same path.
4. [x] `CloudPilotIntelligence.chat()` delegates to that module.

### Step 4 — Thin CloudPilot wrapper

1. [x] `speakGeneral` calls `CloudPilotIntelligence.chat(...)`.
2. [x] Still returns CloudPilot message shape via `formatOutgoing`.
3. [x] `speakKnown` / `speakRequest` unchanged.

### Step 5 — Docs

1. [x] Update [Use OpenAI Chat](../how_to/use_openai_chat.md) to point at `chat()`.
2. [x] Move this feature to `finished/`; Organizational Knowledge still points at “append context → `chat()`”.

---

## Out of scope

* Building explain / improve / generate
* Moving `speakKnown` into Intelligence
* Regex for org knowledge
* Turning OpenAI on by default
* Redesigning Questions / Actions

---

## Acceptance

| Check | Expected |
|-------|----------|
| “Where is GenAI?” | `CloudPilotIntelligence.js` |
| General conversation | Goes through `chat()` |
| Known / template answers | Still `speakKnown` in CloudPilot |
| Org knowledge (when built) | Extra context into `chat()`, not a new speak system |
| OpenAI off | Stub still works via `chat()` |
