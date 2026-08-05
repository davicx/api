# Questions

## What this does

CloudPilot answers questions about information it already knows. It does not invent facts.

First example:

```text
Do I have any open requests?
```

## Current step

**Step 1 — Detect open-requests questions + answer from CloudPilot data.**

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

## What Step 1 is (only this)

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

- **Search** only classifies (hit or `{}`). It does **not** load the DB or write the chat reply.
- **CloudPilot** loads open requests from `requests/` and answers with `speakKnown`.
- OpenAI (when that ENV is on) only helps **detect** the question — never invents the list.

```text
User: Do I have any open requests?
      │
      ▼
searchForOpenRequests()     # classify
      │
      ▼
CloudPilot
  questions/openRequests/   # load from requests/
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
    searchForOpenRequests.js    # shouldRun + Internal | OpenAI

cloudPilot/
  questions/openRequests/       # buildOpenRequestsResponse → requests/
  requests/                     # owns the rows
```

---

## Steps

### Step 0 — Design

- [x] Open-requests question is classified by `searchForOpenRequests`
- [x] Internal | OpenAI via `CLOUDPILOT_OPEN_REQUESTS_SEARCH`
- [x] Search does not answer; CloudPilot owns facts
- [x] OpenAI off for *answering* this question

### Step 1 — Implement

1. Facade: `searchForOpenRequests()` + Internal phrases (“open requests”, “do i have any open requests”, …).
2. Optional OpenAI classify path behind `CLOUDPILOT_OPEN_REQUESTS_SEARCH=openai`.
3. `questions/openRequests/` → `buildOpenRequestsResponse(conversationID)` via `requests/`.
4. Wire `LIST_OPEN_REQUESTS` → `speakKnown`.
5. Smoke: idle empty; one open scan + missing region; no invented OpenAI facts.
6. Commit and stop.

### Step 2 — Guardrail

With `MESSAGE_RESPONSE=openai`, open-requests facts still come from Internal speak — not general chat.

---

## Acceptance

| Input | Expected |
|-------|----------|
| `do i have any open requests` (idle) | Deterministic “no open requests” |
| Same with open `scan_ec2` waiting on region | Lists that request + missing |
| `hello` | Still Conversation |
| `scan ec2` | Still Action |
| Side effects | No new request row, no Atlas, no invented list |

---

## Next

Say **go Step 1** to implement `searchForOpenRequests` + CloudPilot answer path.
