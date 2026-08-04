# Questions

## What this does

CloudPilot answers questions about information it already knows. It does not guess, create a request, run AWS, or use OpenAI to invent facts.

First example:

```text
Do I have any open requests?
```

## Current step

**Step 1 — Answer the Open Requests question.**

## Next

Step 2 — Make sure Questions never fall into general OpenAI chat.

**Status:** Active  
**Related:** [Current Development](./current_development.md) · [Open Requests design](../architecture/open_requests.md) · [OpenAI Logs](./feature_openai_logs.md) · [Responsibility refactor](../finished/responsibility_refactor.md)

---

## Incident that forced this

```text
User: do i have any open requests
```

With general chat OpenAI on, CloudPilot invented AWS-console advice.

**Why:**

1. Phrases matched “open **actions**”, not “open **requests**”.
2. Speak for `LIST_OPEN_REQUESTS` missing (history has a builder; open requests don’t).
3. Fallthrough → Conversation → OpenAI invented facts CloudPilot already owns.

OpenAI stays **off** until the Question path works Internal.

---

## Locked boundary

```text
cloudPilotIntelligence/     →  "What did the user mean?"
cloudPilot/                 →  "How does CloudPilot fulfill it?"
providers/                  →  What external systems CloudPilot talks to
```

(“What can CloudPilot do?” is reserved for the **Capabilities** question — not the whole `cloudPilot/` folder.)

Example:

```text
User: "Do I have any open requests?"

CloudPilot Intelligence
-----------------------
What did they mean?
kind     = question
question = open_requests

CloudPilot
----------
How does CloudPilot fulfill it?
questions/openRequests/  (orchestrate)
    ↓
requests/                (owns the data)
    ↓
speakKnown()
```

No AI reasoning required for that answer. Facts only.

---

## Three kinds of turns

Every user message falls into one of three buckets — easy to explain to another developer:

```text
Talk with me.                    → Conversation
Answer something you already know. → Question
Do something.                    → Action
```

```text
User Message
      │
      ▼
CloudPilot Intelligence
-----------------------
What did they mean?

Conversation | Question | Action
      │
      ▼
CloudPilot
----------
Conversation → Chat
Question     → Feature answers (orchestrated)
Action       → Requests → Execution
```

| Kind | Product meaning | Executes AWS? | Mutates request? | OpenAI? |
|------|-----------------|---------------|------------------|---------|
| **Conversation** | Talk with the user | No | No | Optional (open-ended only) |
| **Question** | Ask CloudPilot about its own state/knowledge | No | No | Optional wording later; **never invent facts** |
| **Action** | Perform work (scan, create, toggle, …) | Often yes | Often yes | Optional extractors only (e.g. region) |

**Product term: Questions** (not “Queries”).  
Internally they behave like reads; to the user they are simply asking CloudPilot something.

---

## Core rule — Question vs `questions/` folder

```text
Questions are a CloudPilot capability (a kind of turn).

The questions/ folder is the orchestration layer for answering them —
only when a thin entry is useful.
```

Not every Question needs a folder under `questions/`.

History already owns data **and** `buildHistoryResponse()`. The speak router calls that directly — no `questions/history/` wrapper.

---

## Core rule — ownership

```text
Questions never own the underlying data.

Questions orchestrate an answer by calling the feature that owns that data.
```

```text
Open Requests  →  requests/
History        →  history/          (keep as its own top-level folder)
Inventory      →  scans/ (or inventory owner)
AI Usage       →  usage / billing owner
Capabilities   →  capabilities/
Current Request → requests/
```

Reuse this six months from now whenever a new Question appears.

---

## Questions catalog (product)

None of these execute work. They answer from CloudPilot-owned knowledge/state.

```text
Questions (capability)
├── Open Requests
├── History
├── Capabilities
├── AI Usage
├── Inventory
├── Current Request
├── Findings
└── Costs
```

---

## Actions stay clear

```text
Actions
├── Scan EC2
├── Scan S3
├── Create EC2
├── Delete EC2
├── Toggle EC2
└── Update Tag
```

Those perform work. Region search and other value extractors help **Actions**; they are not Questions.

---

## Requests stay narrow

`requests/` manages the **lifecycle of an action** — not answering questions.

```text
Requests
├── Create Request
├── Collect Missing Fields
├── Update Request
├── Close Request
└── Undo Request   (as tied to request/history policy)
```

Open requests as a **Question** reads request rows; it does not create/update/close them.

---

## Folder layout

```text
cloudPilot/
│
├── actions/                 # Action definitions / handlers
├── requests/                # Request lifecycle + request row data
│
├── questions/               # Orchestration only (when needed)
│   ├── openRequests/        # NEW Step 1 — delegates to requests/
│   └── currentRequest/      # later — delegates to requests/
│
├── history/                 # OWNS history data + buildHistoryResponse (KEEP)
├── capabilities/            # OWNS catalog + respond helpers
├── scans/
├── execution/
└── …
```

**No `questions/history/`.** History stays in `history/`; router calls `buildHistoryResponse()`.

| Question | How CloudPilot fulfills it | Data / heavy logic owner |
|----------|----------------------------|---------------------------|
| Open Requests | `questions/openRequests/` → speak | `requests/` |
| History | speak → `history.buildHistoryResponse()` | **`history/`** |
| Capabilities | speak → `capabilities/` | `capabilities/` |
| AI Usage | later entry or direct call | usage / billing owner |
| Inventory | later entry or direct call | scans / inventory |
| Current Request | `questions/currentRequest/` later | `requests/` |

---

## How code looks today (honest)

| Concept | Today | Gap |
|---------|--------|-----|
| Understand | `action`, `conversation`, `values`, `reply` | No explicit `kind` / `question` yet |
| Conversation | `GENERAL_CHAT` → `speakGeneral` | Must not absorb Questions |
| Question: History | `list_history` → `buildHistoryResponse` in **`history/`** | Works — reference (no questions/ wrap) |
| Question: Open requests | `list_open` → `LIST_OPEN_REQUESTS` | Phrases incomplete; speak / orchestration missing |
| Question: Status | `REQUEST_STATUS` → templates | Partial; treat as Question |
| Question: Capabilities | catalog respond | Exists under `capabilities/` |
| Action | actionMap + requests + execute | OK |
| Region | value extractor for Actions | Not a Question |

Step 1 does **not** require renaming every understand field to `kind` yet. Keep `conversation: 'list_open'` if needed; treat it as a Question signal in the router. Explicit `kind` can come later.

---

## Steps

### Step 0 — Design (this doc)

- [x] Lock Intelligence vs CloudPilot wording
- [x] Product term **Questions**; `questions/` = orchestration only
- [x] Ownership rule: Questions never own the data
- [x] Requests = lifecycle only; `history/` stays separate (no wrap)
- [x] OpenAI off until Step 1 is green

### Step 1 — Open Requests Question (fixes the incident)

**Unchanged implementation intent.** Internal only. Mirror history speak path.

1. Expand phrases in `searchMessageForConversation.js` (“open requests”, “do i have any open requests”, …).
2. Add orchestration entry: `cloudPilot/questions/openRequests/` → `buildOpenRequestsResponse(conversationID)`  
   Delegates load to `requests/` APIs (`getUsersActionState` / `Request.getOpen*` / optionally reword `getMissingActionInfo`).
3. Wire speak for `LIST_OPEN_REQUESTS` → builder → `speakKnown` (same pattern as history calling `buildHistoryResponse`).
4. Smoke: idle empty reply; one open scan + missing region; no DB write; no Atlas; no OpenAI.
5. Commit and stop.

**Do not** move or wrap `history/`.  
**Do not** invent `kind` JSON unless it falls out naturally.

#### Files (Step 1)

| File | Change |
|------|--------|
| `cloudPilotIntelligence/…/searchMessageForConversation.js` | Phrases |
| `cloudPilot/questions/openRequests/…` | **NEW** `buildOpenRequestsResponse` |
| `cloudPilot/chat/request/RequestConversation.js` | Wire `LIST_OPEN_REQUESTS` |
| Docs | Mark Step 1 done |

Already OK: `decideNextStep`, store skip, `LIST_OPEN_REQUESTS` type, history path.

### Step 2 — Guardrail

Question response types never call `speakGeneral` / invent via OpenAI.  
Smoke with `MESSAGE_RESPONSE=openai`: open-requests still Internal facts.

### Step 3 — More Questions (optional)

Navigator table for open requests.  
Optional thin `questions/currentRequest/`.  
Optional OpenAI **wording only** on grounded catalogs.  
Still no forced wrappers for history/capabilities if direct calls are enough.

### Step 4 — Explicit understand shape (optional)

```json
{
  "kind": "question",
  "question": "open_requests"
}
```

Only if Steps 1–2 feel cramped. Not mixed into Step 1.

---

## What not to do

- Put open-requests answering inside request create/update machinery.
- Create `questions/history/` or move `history/` under `questions/`.
- Assume every Question needs a `questions/<name>/` folder.
- Let Questions own DB tables that belong to another feature.
- Use OpenAI to invent open-request / history / usage lists.
- Treat region search as a Question.
- Turn general chat OpenAI back on before Step 1 acceptance.
- Build factories/registries in Step 1 — wire only.

---

## Acceptance (Step 1 = incident fixed)

| Input | Expected |
|-------|----------|
| `do i have any open requests` (idle) | Deterministic “no open requests” |
| Same with open `scan_ec2` waiting on region | Lists request + missing |
| `show my history` | Still works via **`history/`** directly |
| `scan ec2` | Still Action → requests |
| `hello` | Still Conversation |
| Side effects | No new request row, no Atlas, no OpenAI billing for this question |

---

## Next

Say **go Step 1** to implement the Open Requests Question (phrases + `questions/openRequests` + speak wire).  
OpenAI stays off.
