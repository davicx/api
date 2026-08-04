# CloudPilot — Open Requests

**Status:** Plan — see parent Question Feature design  
**Goal:** Let users ask what open requests they have; respond in chat now, table in chat + dashboard later  
**Work type:** Question feature + grounded list response (+ Navigator / dashboard later)  
**Last updated:** 2026-08-03  
**Parent plan:** [question_feature.md](./question_feature.md) — open requests are a **Question** under `cloudPilot/questions/`; data stays in `requests/`  
**Related:** [current.md](./current.md) · [cloud_pilot_capabilities.md](./cloud_pilot_capabilities.md)

---

## Architecture note

Open requests are a **Question** (read `cloudpilot_requests`), same family as history — not a request workflow and not general chat.

Entry: `cloudPilot/questions/openRequests/` · Data owner: `requests/` · History stays in `history/`.

Full design: [question_feature.md](./question_feature.md).

---

## Goal

User can ask anytime:

```text
What open requests do I have?
What am I waiting on?
Show my open requests
List open requests
```

CloudPilot answers with the **current open request(s)** for this conversation (and later, org/dashboard scope).

Long term:

```text
Chat reply (short summary)
  +
Navigator / chat table of open requests
  +
Dashboard open-requests view
```

---

## Product principle

Open requests are **CloudPilot workflow state**, not AI invention.

```text
Source of truth = cloudpilot_requests (is_open = 1)
  ↓
Build grounded open-request catalog
  ↓
Internal speak (deterministic) first
  ↓
Optional OpenAI wording later (same facts only)
```

Same pattern as capabilities / history:

> **Should I run?** then **How should I run?**

---

## What already exists

| Piece | Status |
|---|---|
| Phrases → `list_open` in `searchMessageForConversation.js` | Partial — “open **actions**” wording; missing “open **requests**” |
| `decideNextStep` → `RESPONSE_TYPE.LIST_OPEN_REQUESTS` | Wired |
| Request store skips write for list intent | Wired |
| Speak path for `LIST_OPEN_REQUESTS` | **Missing** — no dedicated handler like history |
| `navigatorResponse` table for open requests | **Missing** |
| Dashboard open-requests page | **Missing** (future) |
| Multi-open requests per conversation | **Policy today:** one open request per `conversation_id` |

Today the intent is recognized but the speak path does not yet build a real open-requests answer the way history does.

---

## Target chat behavior (Phase 1)

### Idle / no open request

```text
User: What open requests do I have?

CloudPilot:
You have no open requests right now.
```

### One open request (current MVP policy)

```text
User: What open requests do I have?

CloudPilot:
You have 1 open request:

• Scan EC2
  Status: waiting on fields
  Missing: region
  Request ID: 61
```

Optional short hint:

```text
Say the missing field (for example region: "us-west-2"), or ask "what's the status?"
```

### No request mutation

Listing open requests must:

- create no new request row
- close no request
- run no AWS / Atlas execution
- write no history row

---

## Target phrases (expand existing list)

Keep current “open actions” phrases. Add request wording:

```text
what open requests do I have
what open requests do i have
show open requests
show my open requests
list open requests
list my open requests
open requests
my open requests
what am i waiting on          (already maps to list_open)
```

Prefer exact / careful matching so `"help me create ec2"` does not become list_open.

---

## Architecture (fits current pipeline)

```text
STEP 3  understand → conversation = list_open
STEP 4  decide     → LIST_OPEN_REQUESTS
STEP 5  store      → skip (no DB write)
STEP 6  execute    → skip
STEP 7  speak      → buildOpenRequestsResponse(conversationID)
```

Mirror history:

```text
HistoryFunctions.buildHistoryResponse(conversationID)
  ↓
OpenRequestsFunctions.buildOpenRequestsResponse(conversationID)
```

Suggested home:

```text
cloudPilot/requests/functions/openRequestsFunctions.js
```

or next to history if you prefer a shared “list” folder later. Prefer `requests/` because source of truth is request state.

---

## Response shape (chat + Navigator)

### Chat text

Deterministic Internal message from grounded rows.

### atlasResponse / navigatorResponse (Phase 2)

```text
atlasResponse: {
  type: 'open_requests',
  requests: [ ... ]
}

navigatorResponse: {
  type: 'table',
  title: 'Open Requests',
  columns: [...],
  rows: [...]
}
```

Suggested columns:

| Column | Source |
|---|---|
| Request | `request_name` / `conversation_title` / action label |
| Action | `pendingAction` / actionLabel |
| Status | `status` |
| Missing | `missing[]` |
| Mode | `executionMode` |
| ID | `workflowId` / request id |

Kite already renders generic Navigator tables — reuse that path (same idea as history / inventory).

---

## Phased rollout

### Phase 1 — Chat answer (MVP)

1. Expand match phrases to include “open requests”.
2. Add `buildOpenRequestsResponse(conversationID)`.
3. Wire `RequestConversation` for `LIST_OPEN_REQUESTS` (like `LIST_HISTORY`).
4. Load open request(s) for this conversation from existing Request APIs.
5. Deterministic chat text for 0 or 1 open request.
6. Verify: no DB write, no execution, no history row.
7. Commit and stop.

### Phase 2 — Table in chat (Navigator)

1. Attach `navigatorResponse` table payload.
2. Verify Kite shows open-requests table under the chat reply.
3. Keep chat summary short; table holds detail.
4. Commit and stop.

### Phase 3 — Dashboard

1. API endpoint or reuse message payload for dashboard “Open Requests” panel.
2. Scope: conversation first, then org/user later if needed.
3. Link/focus into a request (“work on #61”) using existing `focus_switch` when multi-open exists.

### Phase 4 — Multi-open (only when product is ready)

Today: **one open request per conversation**.

Later:

- multiple open requests
- list + focus by id / title
- `conversation_title` / request name for human labels (see database.md)

Do **not** expand multi-open in Phase 1–2.

---

## AI (optional, later)

Same invocation rule as other AI functions:

```text
shouldRespondOpenRequests()?
  ↓ true
Build grounded open-request catalog
  ↓
respondOpenRequestsInternal()
  or
respondOpenRequestsOpenAI()   // wording only; reuse MESSAGE_RESPONSE
  ↓
Internal fallback
```

Phase 1–2 stay Internal only. No new env var required.

---

## Out of scope (this plan)

- Creating / cancelling / confirming requests (already other paths)
- Changing one-open-per-conversation policy
- Inventing requests that are not in the DB
- Full org-wide request search across all users (dashboard Phase 3+)

---

## Acceptance checks (Phase 1)

- `What open requests do I have?` with no open request → clear empty reply
- Same question with open `scan_ec2` waiting on region → lists that request + missing fields
- No new `cloudpilot_requests` row
- No Atlas call
- Does not steal unrelated messages (e.g. `scan ec2`)

---

## Next

**Parent plan:** [question_feature.md](./question_feature.md).

Say **go Phase 1** there to implement Open Requests Question (phrases + `questions/openRequests` + speak wire).
Say **go** to start Phase 1 only (chat answer, Internal, no table yet).
