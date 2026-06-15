# Appendix — Historical Notes & Changelog

**Purpose:** Archived pipeline rebuild specs, incremental rollout history, and doc changelog. For **current** system design see [architecture.md](./architecture.md).

**Last reviewed:** 2026-06-11

---

## Kite

_(No historical Kite-specific appendix content yet.)_

---

## API

### Pipeline rebuild history

The monolithic `processMessage` (~500 lines, interleaved flags) was replaced incrementally:

| Era | State |
|-----|--------|
| 2026-06-06 | STEP 1–3 live; STEP 5+ “not wired” |
| 2026-06-09 | Understanding Slices 3b–5 complete; Decision D0 |
| 2026-06-10 | STEP 5–7 wired; Node mock execution removed |
| 2026-06-11 | Full E2E verified — create / toggle / delete live + Atlas Test |

**Old flags retired by `decideNextStep`:**

```text
cloudPilotShouldRespond, actionTransitionedToReady, actionPendingConfirmation,
executionModeSelected, newActionStarted, fieldsUpdated, actionEvent,
determineActionEvent, resolveNullActionEvent, detectUserRequest
```

### STEP 5 spec (historical — implemented)

STEP 5 applies STEP 4 decision only — no re-decide, no `chatType`, no mutation vocabulary.

```text
startRequest()   → new row
updateRequest()  → sync decision.request
finishRequest()  → close row (D2)
cancelRequest()  → cancel row (D2 — partial wiring)
skip             → inline in applyDecision + reason
```

**Return shape:**

```js
{
  success: true,
  action: "created" | "updated" | "skipped" | "finished" | "cancelled",
  reason: "general_chat_no_request",  // when skipped
  requestID: null,
  request: null,
  error: null
}
```

**Skip reasons:** `general_chat_no_request`, `immediate_execution_no_row`, `no_request_change`, `conversation_intent_only`, `ambiguous_no_write`, `finish_cancel_deferred_d2`.

### Understanding build history (Slices 1–5)

| Slice | Content | Status |
|-------|---------|--------|
| 1 | `understanding/` folder + `searchMessageForAction` | ✅ |
| 3 | Region via `searchMessageForRegion` | ✅ |
| 3b | Instance IDs, structured fields, name, instance_type | ✅ |
| 4 | `searchMessageForReply` | ✅ |
| 5 | `searchMessageForConversation` | ✅ |
| 2 | Stateless `understandMessage(message)` — drop actionState arg | Deferred to decision phase (done in D0) |

**Exit test (passed 2026-06-09):** `toggle ec2`, region in message, bare IDs, `yes`, `4`, `cancel`, list open, `hello` → general_chat.

### Decision phase rollout (D0–D7)

| Slice | Scope | Status |
|-------|-------|--------|
| D0 | Stateless understanding + `decideNextStep` + STEP 4 log | ✅ |
| D1 | `applyDecision` + start + update + skip | ✅ |
| D2 | finish + cancel + replace | Partial |
| D3 | execution + mode 4 confirm | ✅ |
| D4 | Response layer | ✅ |
| D5 | `immediate_execution` (inventory_aws) | ✅ |
| D6 | Conversation + ambiguous | ✅ |
| D7 | Delete commented pipeline | → [future_development.md](./future_development.md) CLEAN UP |

### Old → new file map (rename pass — planned)

| Today | Target |
|-------|--------|
| `classes/Actions.js` | `requests/Requests.js` |
| `actionStateFunctions.js` | colocate with Requests or split later |
| `actionStatusFunctions.js` | `requests/requestStatusFunctions.js` |
| `workflowConversationFunctions.js` | `requests/requestConversationFunctions.js` |
| `functions.js` (field extractors) | `requests/requestFieldFunctions.js` (mostly superseded by `understanding/search/`) |
| `classes/AtlasExecution.js` | `executions/AtlasExecution.js` |
| `navigatorResponseFunctions.js` | `navigator/navigatorResponseFunctions.js` |
| `state/ActionState.js` | Remove after memory mode dropped |
| `state/focusedWorkflowFunctions.js` | Merge into requestConversation (orphaned) |

### Incremental rollout (original P0–P6 table)

| Phase | What |
|-------|------|
| P0 | DB tables + `Actions.js` |
| P1 | Understanding + STEP 3 log |
| P2 | Field apply via updateRequest |
| P3 | Reply / execution mode |
| P4 | startRequest + open request visible in STEP 2 |
| P5 | buildResponse |
| P6 | executeRequest / Atlas |

### Capability migration map

| Capability | Old location | New home |
|------------|--------------|----------|
| Detect action intent | `detectUserRequest` | `understanding` |
| Extract fields | `functions.js` / STEP 5 | `understanding` |
| Confirm / cancel / mode | `functions.js` | `understanding` |
| Start / replace request | STEP 4 commented | `startRequest` |
| Apply fields | STEP 5 commented | `updateRequest` |
| Execute on confirm | STEP 7/8 commented | `executeRequest` |
| General chat | STEP 8 OpenAI | `route: openai` / `buildCloudPilotResponse` |
| Chat copy | `CloudPilotChat.js` | Unchanged — fed by STEP 7 |

### Consolidated source files (2026-06-06)

This doc previously absorbed: `MASTER_TODO.md`, `Master_Database.md`, `Master_Error_Fixes.md`, `action_to_do.md`.

---

## Atlas

_(Historical Atlas notes: Stage 0 optional hardening, legacy `/remediations/ec2/auto` alias — see `atlas/app/ReadMe.md`.)_

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-11 | **Doc split:** `architecture.md`, `current_development.md`, `finished_development.md`, `future_development.md`, `appendix.md` |
| 2026-06-11 | Pipeline E2E verified; field hardening P0; Learn/Test/Live vision |
| 2026-06-10 | STEP 6: removed Node mock; Atlas-only mock via `main.py` |
| 2026-06-10 | STEP 5 naming: request language, `reason` on skip |
| 2026-06-09 | STEP 5 spec, STEP 4 live, understanding complete, CLEAN UP plan |
| 2026-06-06 | Pipeline rebuild section; target `functions/` layout; terminology (workflow → request) |
| 2026-06-06 | Consolidated master todo docs into single file |
| 2026-05-28 | EC2 mutation API wiring |
| 2026-05-24 | Error/outcome handling; Navigator contract |
