# Questions

## What this does

CloudPilot answers questions about information it already knows. It does not invent facts.

First example:

```text
Do I have any open requests?
```

## Status

**Finished** — Step 1 (Question path + grounded open-requests answer) and Step 2 (guardrail vs general OpenAI chat).

**Related:** [Current Development](../current/current_development.md) · [Open Requests design](../architecture/open_requests.md) · [OpenAI Logs](./feature_openai_logs.md) · [AI Spending](./feature_ai_spending.md)

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

Open Requests and AI Spend are **Questions**, not Values and not Actions.

---

## How it works

```text
User: Do I have any open requests?
      │
      ▼
searchForOpenRequests()     # classify only
      │
      ▼
question = open_requests
      │
      ▼
decideNextStep → LIST_OPEN_REQUESTS   # never GENERAL_CHAT
      │
      ▼
questions/openRequests.js → speakKnown()   # Internal facts
```

```dotenv
CLOUDPILOT_AI_ENABLED=false
CLOUDPILOT_OPEN_REQUESTS_SEARCH=internal   # or openai (classify only)
CLOUDPILOT_MESSAGE_RESPONSE=openai         # general chat only — not Question facts
```

**Locked boundary**

```text
Intelligence  →  “Are they asking about open requests?”
CloudPilot    →  “Load open requests and answer.”
```

Even with `CLOUDPILOT_MESSAGE_RESPONSE=openai`, Question answers stay on `speakKnown` / handlers — never `CloudPilotIntelligence.chat()`.

---

## Folder layout

```text
cloudPilotIntelligence/understand/search/
  searchMessageForQuestion.js
  questions/
    searchForAiSpend.js
    searchForOpenRequests.js

cloudPilot/
  questions/
    openRequests.js
```

---

## Steps

### Step 0 — Design

- [x] Classification + Internal | OpenAI search shape
- [x] Search classifies; CloudPilot owns facts

### Step 1 — Implement

- [x] Question orchestrator + AI Spend migration
- [x] Open Requests classify + grounded speak
- [x] ENV `CLOUDPILOT_OPEN_REQUESTS_SEARCH`

### Step 2 — Guardrail

- [x] `resolveQuestionDecision()` — Questions never become general chat
- [x] processMessage correction if a Question is mis-routed to general chat
- [x] Smoke with `MESSAGE_RESPONSE=openai`: open requests / AI spend stay Internal; `hello` still general

---

## Acceptance

| Input | Expected |
|-------|----------|
| `do i have any open requests` (idle) | Deterministic “no open requests” |
| Same with open `scan_ec2` waiting on region | Lists that request + missing |
| Same with `MESSAGE_RESPONSE=openai` | Still Internal speak — no `chat()` |
| `what’s my OpenAI spend?` | `question = ai_spend` → `show_ai_usage` |
| `hello` | Still general conversation |
| `scan ec2` | Still Action |
| Side effects | No new request row, no Atlas, no invented list |
