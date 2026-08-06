# Questions

## What this does

CloudPilot answers questions about information it already knows. It does not invent facts.

First example:

```text
Do I have any open requests?
```

## Current step

**Step 1 — Implement** ✅ (search path + open-requests speak wired)

## Next

Step 2 — Guardrail: this path never falls into general OpenAI chat for facts.

**Status:** Active  
**Related:** [Current Development](./current_development.md) · [Open Requests design](../architecture/open_requests.md) · [OpenAI Logs](../finished/feature_openai_logs.md)

---

## Incident that forced this

```text
User: do i have any open requests
```

Fell through to general chat → OpenAI invented AWS-console advice.

**Why:** nothing classified this as an open-requests question, and there was no speak path for the list.

---

## Locked classification

```text
Action       → “Do something”
Value        → “What information did the user provide?”
Question     → “What known information is the user requesting?”
Conversation → “Talk with me”
Reply        → “Confirm / cancel / select”
```

Examples:

```text
Turn off my EC2 in us-west-2
  action = toggle_ec2
  values.region = us-west-2

Do I have any open requests?
  question = open_requests
```

Open Requests and AI Spend are **Questions**, not Values and not Actions.

---

## What Step 1 is

Add an Intelligence search that answers:

> Is the user asking about open requests?

Same shape as region:

```text
searchForOpenRequests()
        │
        ▼
CLOUDPILOT_OPEN_REQUESTS_SEARCH
        │
   ┌────┴─────┐
   │          │
Internal   OpenAI
```

```text
searchForOpenRequestsInternal()
searchForOpenRequestsOpenAI()
```

- **Search** only classifies (`open_requests` or no hit). It does **not** load the DB or write the chat reply.
- **CloudPilot** loads open requests from `requests/` and answers with `speakKnown`.
- OpenAI (when that ENV is on) only helps **detect** the question — never invents the list.

```text
User: Do I have any open requests?
      │
      ▼
searchForOpenRequests()     # classify
      │
      ▼
question = open_requests
      │
      ▼
CloudPilot
  questions/openRequests.js # use loaded request state
  speakKnown()
```

---

## ENV

```dotenv
CLOUDPILOT_AI_ENABLED=false          # master; OFF always wins
CLOUDPILOT_OPEN_REQUESTS_SEARCH=internal   # or openai
```

Step 1 ships with **Internal** phrases. Flip to `openai` when you want AI classify (master must be on).

---

## Locked boundary

```text
Intelligence  →  “Are they asking about open requests?”
CloudPilot    →  “Load open requests and answer.”
```

---

## Folder layout (Step 1)

```text
cloudPilotIntelligence/
  CloudPilotIntelligence.js
    → searchForOpenRequests()
  understand/search/
    searchMessageForQuestion.js     # NEW question orchestrator
    questions/                      # NEW classification folder
      searchForAiSpend.js           # MOVE from values/
      searchForOpenRequests.js      # NEW; Internal + OpenAI in one file

    searchMessageForValues.js
    values/
      searchMessageForRegion.js
      searchMessageForName.js
      …

cloudPilot/
  questions/                    # NEW fulfillment folder
    openRequests.js             # NEW grounded response builder
  requests/                     # owns request rows
```

No per-capability subfolder yet. Each Question capability stays one file until it earns more structure.

### Understanding shape

```json
{
  "action": "general_chat",
  "values": {},
  "question": "open_requests",
  "conversation": null,
  "reply": null
}
```

`searchMessageForQuestion()` runs the Question classifiers and returns one question signal.

```text
searchMessageForQuestion()
  ├── searchForAiSpend()
  └── searchForOpenRequests()
```

`decideNextStep()` handles `question` before general Conversation:

```text
ai_spend      → existing AI usage fulfillment
open_requests → LIST_OPEN_REQUESTS
```

---

## Steps

### Step 0 — Design

- [x] Open-requests question is classified by `searchForOpenRequests`
- [x] Internal | OpenAI via `CLOUDPILOT_OPEN_REQUESTS_SEARCH`
- [x] Search does not answer; CloudPilot owns facts
- [x] OpenAI off for *answering* this question
- [x] Questions are separate from Actions, Values, Conversation, and Reply
- [x] AI Spend moves from `values/` to the Question search path

### Step 1 — Implement

1. [x] Add `searchMessageForQuestion.js` and `understand/search/questions/`.
2. [x] Move `searchForAiSpend.js` from `values/` to `questions/`; return `question = ai_spend`.
3. [x] Add `questions/searchForOpenRequests.js`:
   - TOC style
   - `shouldRun`
   - public selector
   - Internal phrases
   - OpenAI classifier
4. [x] Add `question` to `understandMessage()` output.
5. [x] Add `CLOUDPILOT_OPEN_REQUESTS_SEARCH=internal|openai` + token limit.
6. [x] Add `cloudPilot/questions/openRequests.js` using the already-loaded request state.
7. [x] Wire `question = open_requests` → `LIST_OPEN_REQUESTS` → builder → `speakKnown`.
8. [x] Smoke Internal and OpenAI classification; facts always come from CloudPilot.

### Step 2 — Guardrail

With `MESSAGE_RESPONSE=openai`, open-requests facts still come from Internal speak — not general chat.

---

## Acceptance

| Input | Expected |
|-------|----------|
| `do i have any open requests` (idle) | Deterministic “no open requests” |
| Same with open `scan_ec2` waiting on region | Lists that request + missing |
| `what’s my OpenAI spend?` | `question = ai_spend`; existing grounded usage reply |
| `hello` | Still Conversation |
| `scan ec2` | Still Action |
| `scan ec2 in us-west-2` | Action + `values.region`; no Question |
| Side effects | No new request row, no Atlas, no invented list |

---

## Next

Ready to implement Step 1: Question orchestrator + AI Spend migration + Open Requests classification and grounded answer.
