# CloudPilot / Atlas — Current Development

**Purpose:** Single source of truth for what we are working on, what is done, and what is deferred.

**Last reviewed:** 2026-06-10 (STEP 5 spec — request language, `reason` on outcome, no mutation/infer naming)

**Reference docs (not todo lists):**

| Topic | Path |
|-------|------|
| Actions & input types (STEP 3 understanding) | `doc/ReadMe.md` |
| Database schema (actions, requests, executions) | `doc/database/database.md` |
| Add a new action | `doc/instructions/adding_new_action.md` |
| Atlas → Navigator mapping | `doc/instructions/converting_atlas_data.md` |
| Legacy request SQL (being replaced) | `doc/sql/cloudpilot_workflows_phase1.sql` |
| EC2 chat samples | `api/README.md` |
| Create tags / delete safety (future) | `api/doc/instructions/cloudpilot_tagging_metadata.md` |

---

## Terminology (2026-06-06)

**The word *workflow* is retired in docs and product language.** Use **request** only.

| Old (do not use) | New |
|------------------|-----|
| workflow | **request** |
| open workflow | **open request** |
| workflow row | **request row** |
| `cloudpilot_workflows` | **`cloudpilot_requests`** (target schema — see `database.md`) |

**Code still uses legacy names** (`workflowId`, `focused_workflow_id`, `cloudpilot_workflows`, `ActionState`, etc.) until a dedicated rename pass. This doc and new schema use **request**; treat old identifiers as aliases for the same concept.

---

## Architecture (read once)

Three layers — use these names in docs and code reviews:

```text
1. Action definition (static)     actionRegistry.js — scan_ec2, toggle_ec2, …
2. Request (user request)           cloudpilot_requests row — collect fields, confirm, cancel, resume
3. Execution (actual work)        Atlas/AWS run — today updates request row; target: cloudpilot_executions
```

**Layering:**

```text
Atlas         = execution engine (AWS mutations)
Navigator/API = orchestration + request state + UI shaping
Kite          = generic renderer
```

**Phase 1 request policy:** one open request per `conversation_id` (`is_open = 1`). History stays as closed rows.

**Naming:** `action_type` = machine key (`toggle_ec2`). `display_name` = human label ("Toggle EC2 Lab Environment"). Defer `action_name` slug until multi-open.

---

## Target code layout (`functions/`)

Align folders with the three layers: **actions** (static) → **requests** (user request state) → **executions** (Atlas/AWS runs). No code move yet — this is the target shape.

```text
functions/
│
├── actions/                          ← keep as-is (registry + handlers)
│   ├── actionRegistry.js
│   ├── aws/
│   └── ec2/
│
├── requests/
│   ├── Requests.js                   ← DB class (today: classes/Actions.js → cloudpilot_requests)
│   ├── requestStatusFunctions.js     ← waiting_on_* helpers (today: actionStatusFunctions.js)
│   ├── requestConversationFunctions.js  ← open-requests list, focus switch (today: workflowConversationFunctions.js)
│   └── requestFieldFunctions.js      ← field extractors (today: functions.js — region, instance_id, execution mode)
│
├── executions/
│   ├── Executions.js                 ← NEW — cloudpilot_executions CRUD (not built yet)
│   └── AtlasExecution.js             ← run handlers (today: classes/AtlasExecution.js)
│
├── chat/                             ← keep (CloudPilotChat, chatOutcomeRegistry, openAI/)
├── navigator/                        ← today: navigatorResponseFunctions.js at functions root
│   └── navigatorResponseFunctions.js
├── config/                           ← keep (chatGPTconfig.js)
│
└── cloudPilotMessageFunctions.js     ← orchestrator (processMessage) — stays at root for now
```

### Old → new file map

| Today | Target |
|-------|--------|
| `classes/Actions.js` | `requests/Requests.js` |
| `actionStateFunctions.js` | `requests/Requests.js` (state bridge: get/set open request — colocate or split later if file grows) |
| `actionStatusFunctions.js` | `requests/requestStatusFunctions.js` |
| `workflowConversationFunctions.js` | `requests/requestConversationFunctions.js` |
| `functions.js` (Atlas field extractors) | `requests/requestFieldFunctions.js` |
| `classes/AtlasExecution.js` | `executions/AtlasExecution.js` |
| *(none)* | `executions/Executions.js` |
| `navigatorResponseFunctions.js` | `navigator/navigatorResponseFunctions.js` |
| `state/ActionState.js` | **Remove** after memory mode dropped |
| `state/focusedWorkflowFunctions.js` | **Merge into** `requestConversationFunctions.js` (wire up — currently orphaned) |
| `state/conversationStateFunctions.js` | **Remove** (unused) |
| `classes/` folder | **Remove** when empty |

### Rules for the move

- **Rename with the folder**, not before — one PR per area (requests, then executions, then navigator).
- **`actions/`** stays untouched during request refactor.
- **`Requests.js`** talks to `cloudpilot_requests`; **`Executions.js`** talks to `cloudpilot_executions` — same Post.js-style static methods as today.
- **`cloudPilotMessageFunctions.js`** imports from `requests/` and `executions/`; avoid circular requires.
- Delete **`state/`** only after `ActionState.js` memory path is gone and focused-request logic lives under `requests/`.

---

## Pipeline rebuild (`processMessage`) — **active work**

**Goal:** Replace the old ~500-line interleaved pipeline with inspectable steps. Each step logs one object; orchestrator stays thin.

```text
Message
  ↓ STEP 1  Normalize message
  ↓ STEP 2  Load current request (DB)
  ↓ STEP 3  Understand message        → understanding
  ↓ STEP 4  Decide next step          → decision              ✅
  ↓ STEP 5  Apply decision to request → start / update / finish / cancel / skip  ← NEXT
  ↓ STEP 6  Execute (if needed)       → execution
  ↓ STEP 7  Respond once              → response
```

**Golden rule:** understand once → decide once → apply once → respond once. No re-check loops.

---

## STEP 5: CURRENT TO DO

**Goal:** Persist the STEP 4 decision to `cloudpilot_requests` — at most one DB write per message. This is the layer that gives CloudPilot **memory** between messages.

**Start boring:** **create**, **update**, **skip** first (D1). Once those logs look perfect, add **finish**, **cancel**, replace (D2).

### Mental model — request language, not “mutation”

STEP 5 does **not** look at `chatType`. It only reads the **decision object** from STEP 4.

STEP 4 already decided. STEP 5 does **not** re-decide, **infer**, or introduce abstract “mutation” types. It routes to plain request operations:

```text
What should happen to the request?

  startRequest()    → new row
  updateRequest()   → sync open row from decision.request
  finishRequest()   → close row (is_open = 0, completed)     ← D2
  cancelRequest()   → cancel row                               ← D2
  (otherwise)       → skip — no DB write; return outcome inline in applyDecision
```

```js
const requestOutcome = await applyDecision(decision, {
  conversationID,
  context: processMessageContext,
  requestState: currentActionState
});
```

**`applyDecision`** is a thin router: read flags STEP 4 already set (`request`, `closeRequest`, `response.type`, …) → call the matching function. **`chatType` is for STEP 7** (which handler speaks).

**Do not use** names like `inferMutation`, `buildMutationPayload`, `resolveMutationType`, or `executeMutation` — code should read like the CloudPilot business process.

### Folder layout (`functions/requests/`)

**D1 (ship first):**

```text
requests/
├── applyDecision.js    ← entry; orchestrator calls only this
├── startRequest.js     ← create row
└── updateRequest.js    ← sync decision.request → DB
```

**D2 (after D1 logs are green):**

```text
├── finishRequest.js    ← Actions.finishAction
└── cancelRequest.js    ← Actions.cancelAction
```

**No `skipRequest.js`.** Skipping is not a request operation — it is “nothing to do” handled inline in `applyDecision.js`.

**Litmus test:** could a new engineer understand this folder in 30 seconds?

Wire in `cloudPilotMessageFunctions.js`:

```js
//STEP 5: Request update
const requestOutcome = await applyDecision(decision, { conversationID, context, requestState: currentActionState });

console.log("STEP 5: REQUEST UPDATE:");
console.log(JSON.stringify(requestOutcome, null, 2));
console.log(" ");
```

Reuse existing DB primitives underneath (`ActionStateFunctions`, `Actions.js`) — do not reimplement field loops from the old commented pipeline.

### Return shape (first version)

```js
{
  success: true,
  action: "created" | "updated" | "skipped" | "finished" | "cancelled",
  reason: "general_chat_no_request",
  requestID: null,
  request: null,
  error: null
}
```

| Field | Meaning |
|-------|---------|
| `action` | What STEP 5 did — CloudPilot language for logs (`created`, `updated`, `skipped`, `finished`, `cancelled`) |
| `reason` | **Always set when `action === "skipped"`** (and optional on other outcomes). Makes terminal debugging painless. |
| `request` | Loaded state after write (same shape as STEP 2), or `null` when skipped |
| `requestID` | `workflowId` when a row was created or touched |

**Example skip reasons (extend as needed):**

| `reason` | When |
|----------|------|
| `general_chat_no_request` | Idle + `decision.request === null` |
| `immediate_execution_no_row` | `inventory_aws` — STEP 6 runs, no request row |
| `no_request_change` | Open request + chat scene only (`resolveRequestChat` — target matches current row) |
| `conversation_intent_only` | list / focus / status — respond in STEP 7, no row write |

**Example logs:**

```text
STEP 5: REQUEST UPDATE
  action: created

STEP 5: REQUEST UPDATE
  action: updated

STEP 5: REQUEST UPDATE
  action: skipped
  reason: general_chat_no_request
```

### Build plan (3 parts — do A + B together first)

| Part | Scope | Proves |
|------|-------|--------|
| **A** | **startRequest** — create new row | `toggle ec2` → row in `cloudpilot_requests`; next message INITIAL STATE shows `pendingAction` |
| **B** | **updateRequest** — fields + status | `region: "us-west-2"` merges into open row; `missing` shrinks, `collected` grows |
| **C** | **finishRequest** / **cancelRequest** / replace | Mode 1–3 finishes row; cancel; new action replaces open row |

**First ship: Part A + B (D1)** — the real win is:

```text
toggle ec2
region: "us-west-2"
```

both persist. Part C (D2) follows once create / update / skip logs look perfect.

### Decision → request action map

| Decision signal | STEP 5 function | `action` |
|-----------------|-----------------|----------|
| `decision.request` set, no open row | `startRequest()` | `created` |
| `decision.request` set, open row, target differs from current | `updateRequest()` | `updated` |
| No row write needed | inline in `applyDecision` | `skipped` + `reason` |
| `response.type === "immediate_execution"` | inline skip | `skipped` + `reason: immediate_execution_no_row` |
| _(D2)_ `decision.closeRequest === true` | `finishRequest()` | `finished` |
| _(D2)_ `response.type === "request_cancelled"` | `cancelRequest()` | `cancelled` |
| _(D2)_ new action while row open | `cancelRequest()` + `startRequest()` | `cancelled` then `created` (or document single outcome) |

### Test checklist (A + B / D1)

1. `toggle ec2` → `action: "created"` → next message INITIAL STATE has `pendingAction: "toggle_ec2"`
2. `region: "us-west-2"` (with open toggle) → `action: "updated"` → `collected.region` set, `missing` no longer includes `region`
3. `hi` (idle) → `action: "skipped"`, `reason: "general_chat_no_request"`
4. `scan ec2` + region in one message → `action: "created"` with `collected.region` already set, `status: waiting_on_confirmation`

### What STEP 5 is not

- Does not re-run understanding or **re-decide** (no `infer*` helpers)
- Does not call Atlas / AWS (STEP 6)
- Does not generate chat text (STEP 7)
- Does not branch on `chatType`

---

**Target `processMessage` shape:**

```js
async function processMessage(rawUserMessage, conversationID, context) {
  const message = getCurrentUserMessage(rawUserMessage);
  const state = await loadCurrentRequest(conversationID);
  const understanding = await understandMessage(message);

  const decision = decideNextStep({ message, state, understanding });

  return await performDecision(decision, { conversationID, context, message, state, understanding });
}
```

**Layers (folder targets):**

| Layer | Folder | One question |
|-------|--------|--------------|
| Understanding | `functions/understanding/` | What did the user say? |
| Decision | `functions/decision/` | What do we do now? |
| Requests | `functions/requests/` | How do requests change? (DB) |
| Execution | `functions/execution/` | Run the thing (Atlas/AWS) |
| Response | `functions/chat/` + `functions/responses/` | User-facing text |

**Import style:** one namespace per module — e.g. `const UnderstandingFunctions = require('./understanding/understandMessage');` then `UnderstandingFunctions.understandMessage(...)`. No destructured requires in the orchestrator.

### What is live today (2026-06-06)

| Step | Status | Code |
|------|--------|------|
| STEP 1 Normalize | ✅ Live | `getCurrentUserMessage` |
| STEP 2 Load request | ✅ Live | `ActionStateFunctions.getUsersActionState` → `cloudpilot_requests` via `Actions.js` |
| STEP 3 Understand | ✅ Live | `UnderstandingFunctions.understandMessage(message)` — stateless |
| STEP 4 Decide | ✅ Live | `DecisionFunctions.decideNextStep` — logs `chatType` + `response.type` |
| STEP 5+ | ❌ Not wired | `applyDecision` next; old STEP 4–8 still **commented** in `cloudPilotMessageFunctions.js` |

**Understanding (in progress — STEP 3 only, no actions yet):**

```text
understanding/
├── understandMessage.js              ← orchestrator entry (Function F1)
└── search/
    ├── searchMessageForAction.js     ← ✅ action type
    ├── searchMessageForRegion.js
    ├── searchMessageForStructuredFields.js
    ├── searchMessageForInstanceId.js
    ├── searchMessageForInstanceType.js
    ├── searchMessageForName.js
    ├── searchMessageForValues.js     ← composes all field extractors
    ├── searchMessageForReply.js
    └── searchMessageForConversation.js
```

- **Exit criteria (understanding done):** ✅ Slices 3b–5 complete — STEP 3 populates full `messageUnderstanding`. **No DB writes, no chat response, no Atlas/AWS** until STEP 4 `processRequest` (next phase).
- When **idle**: runs `searchMessageForAction` → e.g. `"toggle_ec2"` or `"general_chat"`
- When **open request**: returns `action: null` (continuations — moves to `processRequest` in Slice 2)

**`messageUnderstanding` shape (log at STEP 3):**

```json
{
  "action": "toggle_ec2" | "general_chat" | null,
  "values": {},
  "reply": null,
  "conversation": null,
  "ambiguous": false,
  "candidates": [],
  "source": "rules",
  "confidence": 1
}
```

### Why STEP 3 logs matter but nothing “happens” yet (expected)

1. **Understanding still filling in** — `values` has region only; instance IDs, structured fields, `reply`, `conversation` still stubs. See [Finish understanding (STEP 3)](#finish-understanding-step-3--before-processrequest).
2. **No STEP 4** — even when STEP 3 is complete, `processRequest` does not run yet: no request rows created, no fields saved to DB, no confirm/execute.
3. **No response layer** — HTTP reply may stay empty (`success: false`) until `buildResponse` — that is OK.

**Your mental model is correct:** when understanding is done, every message should produce a full STEP 3 object like the shape below — same data we used to parse inline, but extracted only. Actions come in the **next** step (`processRequest`).

### Incremental rollout

| Phase | What | Test |
|-------|------|------|
| **P0** | DB: `cloudpilot_actions` + `cloudpilot_requests` + seed; `Actions.js` migrated | STEP 2 loads without `ER_NO_SUCH_TABLE` |
| **P1** | `understanding/` + STEP 3 log | `toggle ec2` → `"action": "toggle_ec2"`; idle `hello` → `"general_chat"` |
| **P4 (next)** | `requests/processRequest.js` + STEP 4 log `requestOutcome` | After `toggle ec2`, **next** message INITIAL STATE shows open request + `missing` |
| **P2** | `searchMessageForValues.js` + Request applies fields | `region: "us-west-2"` updates `collected` / shrinks `missing` |
| **P3** | `searchMessageForReply.js` — mode `1`–`4`, confirm `yes` | Destructive tier flow |
| **P5** | `responses/buildResponse.js` | Chat text returns in API response |
| **P6** | `executions/processExecution.js` | Atlas runs on confirm |

**First STEP 4 slice:** general_chat routing + start/replace request (old commented STEP 4 only). Defer field apply, status transitions, execution until P2/P3.

**Target `requestOutcome` (log at STEP 4):**

```json
{
  "actionEvent": "general_chat" | "new_request_created" | null,
  "shouldExecute": false,
  "shouldRespond": true,
  "requestState": { "pendingAction", "status", "missing", "collected", ... },
  "activeRequest": "toggle_ec2" | null,
  "errors": []
}
```

**Request guardrail:** `action === "general_chat"` only when idle + no registry match. `action === null` with open request = continuation — never start a new row.

### How to test locally

1. `npm start` (default port **3003**)
2. `POST /message` with `conversationID`, `messageFrom`, `messageCaption`
3. Watch **server terminal** for STEP 2 / STEP 3 (and STEP 4 when added) — not only the HTTP body

```bash
curl -X POST http://localhost:3003/message \
  -H "Content-Type: application/json" \
  -d '{"conversationID":1,"messageFrom":"davey","messageCaption":"toggle ec2","masterSite":"kite"}'
```

Chat samples: repo root `README.md` (EC2 mutations section).

### Key files

| File | Role |
|------|------|
| `functions/cloudPilotMessageFunctions.js` | Orchestrator (`processMessage`) |
| `functions/understanding/understandMessage.js` | STEP 3 entry (Function F1) |
| `functions/understanding/search/searchMessageForAction.js` | Registry intent (rules) |
| `functions/actions/actionStateFunctions.js` | STEP 2 state bridge |
| `functions/classes/Actions.js` | MySQL `cloudpilot_requests` (target rename: `requests/Requests.js`) |
| `doc/database/database.md` | Schema + seed SQL |

Old message parsing in `cloudPilotMessageFunctions.js` (commented STEP 5/6/7) and removed `detectUserRequest` are marked `TO DO: remove me` — superseded by `understanding/` + `requests/processRequest`.

---

## Understanding: To Do

**Goal:** Three clean layers — understanding (extract signals), request processing (decide A–F), execution (run AWS).

**Current focus:** Finish **Layer 1 only**. Populate STEP 3 for all message types we supported before. **No actions yet** — `processRequest` is the next phase after understanding is complete.

---

### Finish understanding (STEP 3) — before `processRequest`

When this section is done, any user message should fill in:

```json
{
  "action": "scan_ec2",
  "values": {},
  "reply": null,
  "conversation": null,
  "ambiguous": false,
  "candidates": [],
  "source": "rules",
  "confidence": 1
}
```

…with real data in each field when the message contains it. Nothing downstream runs yet.

| `messageUnderstanding` field | Search function | Status | Old source (`functions.js` / elsewhere) |
|-----------------------------|-----------------|--------|----------------------------------------|
| `action` | `searchMessageForAction` | ✅ Done | `detectUserRequest` / registry `match()` |
| `values.region` | `searchMessageForRegion` | ✅ Done | `extractAwsRegion` |
| `values.instance_id` | `searchMessageForValues` | ✅ Done | `extractInstanceId` |
| `values.primary_instance_id` | `searchMessageForValues` | ✅ Done | `extractInstanceId` (toggle) |
| `values.secondary_instance_id` | `searchMessageForValues` | ✅ Done | `extractInstanceId` (toggle) |
| `values.name` | `searchMessageForValues` | ✅ Done | `extractName` (create) |
| `values.instance_type` | `searchMessageForValues` | ✅ Done | `extractInstanceType` (create) |
| `values.*` (structured) | `searchMessageForValues` | ✅ Done | `extractStructuredFields` — `field: "value"` |
| `reply` | `searchMessageForReply` | ✅ Done | `userConfirmedAction`, `extractExecutionMode`, cancel phrases |
| `conversation` | `searchMessageForConversation` | ✅ Done | `workflowConversationFunctions` (list/focus/status) |
| `ambiguous` / `candidates` | `searchMessageForAction` | ✅ Done | multi-match registry |

**Suggested build order (understanding only):**

```text
1. Slice 3b — searchMessageForValues: instance IDs + structured field: "value"
2. Slice 4   — searchMessageForReply: yes, cancel, execution mode 1–4
3. Slice 5   — searchMessageForConversation: status, list open actions, focus switch
4. Slice 2   — understandMessage(message) stateless; open-request guard moves to processRequest (optional last in understanding phase)
```

**Exit test (understanding complete):**

```text
"toggle ec2"                              → action: "toggle_ec2"
"toggle ec2 in us-west-2"                 → action + values.region
"i-0abc123"                               → values.primary_instance_id or instance_id (heuristic)
'primary_instance_id: "i-0abc123"'        → values.primary_instance_id
"yes"                                     → reply: "confirm"
"4"                                       → reply: execution mode
"cancel"                                  → reply: "cancel"
"what am I waiting on"                    → conversation: "list_open"
"hello"                                   → action: "general_chat", empty values
```

After exit test passes → start **processRequest** (STEP 4). That layer decides A–F and touches the DB; understanding does not.

**Status (2026-06-09):** Slices 3b, 4, 5 done — STEP 3 parses all fields. Slice 2 (stateless entry) deferred to `processRequest` phase.

---

### Actions & input reference (STEP 3)

**Actions** — intent phrases → `action`:

| Action | Example messages |
|--------|------------------|
| `general_chat` | `hello`, `hi` (no action match) |
| `inventory_aws` | `show me all my aws resources`, `show my aws resources` |
| `scan_ec2` | `scan ec2`, `scan ec2 in us-west-2` |
| `toggle_ec2` | `toggle ec2`, `switch ec2` |
| `create_ec2` | `create ec2`, `create instance` |
| `delete_ec2` | `delete ec2`, `delete instance` |

**Values** — field inputs → `values` (any action; composed in `searchMessageForValues`):

| Field | Example input |
|-------|----------------|
| `region` | `us-west-2`, `region: "us-west-2"`, embedded in `scan ec2 in us-west-2` |
| `instance_id` | `i-0abc123def4567890` (single bare ID) |
| `primary_instance_id` | `primary_instance_id: "i-0abc123def4567890"`, first of two bare IDs |
| `secondary_instance_id` | `secondary_instance_id: "i-0xyz9876543210fed"`, second of two bare IDs |
| `name` | `name it my-demo-server`, `call it my-demo-server`, bare `my-demo.server` |
| `instance_type` | `t3.micro`, `instance_type: "t3.micro"` |
| Any registry field | `field_name: "value"` (quoted structured format) |

**Required fields per action** (for `processRequest` later — collected via `values` over one or more messages):

| Action | Required `values` keys |
|--------|------------------------|
| `scan_ec2` | `region` |
| `toggle_ec2` | `region`, `primary_instance_id`, `secondary_instance_id` |
| `create_ec2` | `name`, `region`, `instance_type` |
| `delete_ec2` | `region`, `instance_id` |
| `inventory_aws` | _(none — immediate execution when wired)_ |
| `general_chat` | _(none)_ |

**Reply** — confirm / mode / cancel → `reply`:

| Input | `reply` value |
|-------|----------------|
| `yes`, `confirm`, `run it`, `do it`, `proceed`, `execute` | `confirm` |
| `cancel`, `stop`, `never mind`, `abort`, `quit`, … | `cancel` |
| `1` | `instructions` |
| `2` | `cli` |
| `3` | `pr` |
| `4` | `automatic` |

**Conversation** — meta intents → `conversation`:

| Input | `conversation` value |
|-------|----------------------|
| `what am i waiting on`, `list open actions`, `show my open actions`, … | `list_open` |
| `what is the status`, `show status`, `where are we`, … | `status` |
| `switch to 2`, `focus on Toggle EC2`, `use delete ec2`, … | `focus_switch` |

---

### Architecture (target)

```text
Layer 1  understandMessage(message)           → signals only, no DB
Layer 2  processRequest(signals, requestState) → categories A–F, DB writes
Layer 3  executeRequest(requestState)          → Atlas/AWS when told to
```

**One sentence per function:**

| Function | Job |
|----------|-----|
| `understandMessage()` | Extract signals from a message. |
| `searchMessageForAction()` | Find an action in a message. |
| `searchMessageForRegion()` | Find an AWS region in a message. |
| `searchMessageForValues()` | Find all structured field values in a message. |
| `searchMessageForReply()` | Find confirm, cancel, or execution mode in a message. |
| `searchMessageForConversation()` | Find status/list/focus conversation intents in a message. |
| `processRequest()` | Decide what to do with the signals given current request state. |
| `executeRequest()` | Run the action. |

**Rule:** Every search function answers one question. No request state inside understanding. Conditional logic (“only if region is missing”) lives in `processRequest`.

### Slice 3 — Field extraction (region)

| Task | Status | Notes |
|------|--------|-------|
| Implement `searchMessageForRegion` | ✅ Done | Regex from `functions.js` `extractAwsRegion` |
| Implement `searchMessageForValues` (region only) | ✅ Done | Composes `searchMessageForRegion` → `values.region` |

### Slice 3b — Field extraction (toggle / create / delete fields)

| Task | Status | Notes |
|------|--------|-------|
| Instance IDs in `searchMessageForValues` | ✅ Done | `instance_id`, `primary_instance_id`, `secondary_instance_id` |
| Structured `field: "value"` in `searchMessageForValues` | ✅ Done | `searchMessageForStructuredFields` |
| `name`, `instance_type` in `searchMessageForValues` | ✅ Done | `searchMessageForName`, `searchMessageForInstanceType` |

**Test (STEP 3 log only — no DB):**

```text
"toggle ec2 in us-west-2"           → values: { "region": "us-west-2" }
"i-0abc123"                         → values: { "primary_instance_id": "i-0abc123" } (or instance_id)
'primary_instance_id: "i-0abc123"'  → values: { "primary_instance_id": "i-0abc123" }
```

### Slice 4 — Reply extraction (understanding only)

| Task | Status | Notes |
|------|--------|-------|
| Implement `searchMessageForReply` | ✅ Done | confirm, cancel, execution mode `1`–`4` |

**Test (STEP 3 log only):**

```text
"yes"    → reply: "confirm"
"4"      → reply: execution mode (e.g. "automatic")
"cancel" → reply: "cancel"
```

### Slice 5 — Conversation (understanding only)

| Task | Status | Notes |
|------|--------|-------|
| Implement `searchMessageForConversation` | ✅ Done | Status question, list open actions, focus switch |

### Slice 2 — Stateless understanding (first step of Decision phase)

| Task | Status | Notes |
|------|--------|-------|
| `understandMessage(message)` — drop `actionState` arg | Planned | Always run all searches; no open-request guard in understanding |
| Remove `buildUnderstandingContext` from understanding | Planned | Interpretation moves to `decideNextStep` |

---

## Pipeline: Decision → Requests → Execution

**Status:** Understanding complete (STEP 3). **Next:** Decision layer — same incremental style as understanding.

**Replaces:** commented STEPS 4–8 in `cloudPilotMessageFunctions.js`, inline flags (`cloudPilotShouldRespond`, `fieldsUpdated`, `actionTransitionedToReady`, …), `determineActionEvent`, `resolveNullActionEvent`.

---

### 1. Understanding — ✅ done

```text
understanding/
├── understandMessage.js
└── search/
    ├── searchMessageForAction.js
    ├── searchMessageForRegion.js
    ├── searchMessageForStructuredFields.js
    ├── searchMessageForInstanceId.js
    ├── searchMessageForInstanceType.js
    ├── searchMessageForName.js
    ├── searchMessageForValues.js      ← composes field searches
    ├── searchMessageForReply.js
    └── searchMessageForConversation.js
```

Output: `understanding` — see `doc/ReadMe.md`. No DB. No route. No state mutation.

---

### 2. Decision — **next build**

**Job:** Given `understanding` + `requestState`, return **one** `decision`.

```text
decision/
├── decideNextStep.js       ← entry (orchestrator calls only this)
├── decisionTypes.js        ← route + event constants
└── (later) determineRoute.js, determineEvent.js if file grows
```

**Decision shape:**

```js
{
  route: "cloudpilot" | "openai",
  event: "new_request" | "missing_fields_given" | ... ,
  action: "toggle_ec2",           // when relevant
  values: { region: "us-west-2" }, // when relevant
  executionMode: "automatic"       // when reply is 1-4
}
```

**Deletes these old flags** — all become `decision.route` + `decision.event`:

```text
cloudPilotShouldRespond
actionTransitionedToReady
actionPendingConfirmation
executionModeSelected
newActionStarted
fieldsUpdated
actionEvent (inline variable)
```

**`decideNextStep` priority** (first match wins — captures old logic):

```text
1.  understanding.ambiguous                    → event: ambiguous_action
2.  understanding.reply === "cancel"           → event: request_cancelled
3.  understanding.conversation === "list_open" → event: list_open_actions
4.  understanding.conversation === "focus_switch" → event: focus_switch
5.  understanding.conversation === "status"    → event: request_status
6.  understanding.reply is execution mode (1-4) + state ready for mode → event: execution_mode_selected
7.  understanding.reply === "confirm" + waiting_on_confirmation → event: execution_confirmed
8.  understanding.reply === "confirm" + state.status === "failed" → event: workflow_failed (old 7C)
9.  understanding.action + not general_chat + no open / replace allowed → event: new_request
10. understanding.action + not general_chat + same as open request (repeat intent) → event: request_chat (old resolveNull → workflow_in_progress)
11. state.pendingAction + values present (matching missing) → event: missing_fields_given
12. state.pendingAction + no decision yet → event: request_chat (maps old resolveNullActionEvent)
13. understanding.action === inventory path + requiresExecution + no workflow → event: immediate_execution (inventory_aws)
14. else → route: openai, event: general_chat
```

**`request_chat` sub-events** (derived from state when event is `request_chat` — old `resolveNullActionEvent`):

| State condition | Chat sub-event (for `CloudPilotChat`) |
|-----------------|--------------------------------------|
| `status === running` | `workflow_running` |
| `status === failed` | `workflow_failed` |
| ready + needs mode + no `executionMode` | `awaiting_execution_mode` |
| ready + (mode set or non-destructive) | `awaiting_confirmation` |
| `missing.length > 0` | `workflow_in_progress` |

**Old `actionEvent` → new `decision.event` map:**

| Old (`CloudPilotChat`) | New (`decideNextStep`) |
|------------------------|-------------------------|
| `new_action` | `new_request` |
| `missing_fields_given` | `missing_fields_given` |
| `awaiting_execution_mode` | `execution_mode_selected` or `request_chat` → sub |
| `awaiting_confirmation` | `request_chat` → sub |
| `execution_requested` | `execution_confirmed` |
| `workflow_in_progress` | `request_chat` → sub |
| `workflow_running` | `request_chat` → sub |
| `workflow_failed` | `request_chat` → sub or `workflow_failed` |
| _(OpenAI path)_ | `general_chat` |

**Core slice (build first — your starter):**

```js
function decideNextStep({ state, understanding }) {
  if (understanding.action && understanding.action !== "general_chat" && shouldStartNewRequest(state, understanding)) {
    return { route: "cloudpilot", event: "new_request", action: understanding.action, values: understanding.values };
  }
  if (state.pendingAction && hasApplicableValues(state, understanding.values)) {
    return { route: "cloudpilot", event: "missing_fields_given", values: understanding.values };
  }
  if (state.pendingAction && understanding.reply === "confirm" && isWaitingOnConfirmation(state)) {
    return { route: "cloudpilot", event: "execution_confirmed" };
  }
  if (state.pendingAction) {
    return { route: "cloudpilot", event: "request_chat" };
  }
  return { route: "openai", event: "general_chat" };
}
```

Log at **STEP 4: DECISION**.

---

### 3. Requests — apply decision (**STEP 5 — CURRENT TO DO**)

**Job:** STEP 4 decided; `applyDecision` routes to **start / update / finish / cancel / skip** (once per message). Reads only the **decision object** — not `chatType`. No `inferMutation` or mutation vocabulary.

**D1 files:**

```text
requests/
├── applyDecision.js
├── startRequest.js
└── updateRequest.js
```

**D2 adds:** `finishRequest.js`, `cancelRequest.js`. Skip stays inline in `applyDecision.js`.

```text
applyDecision()
  if create  → startRequest()
  if update  → updateRequest()
  if finish  → finishRequest()      // D2
  if cancel  → cancelRequest()      // D2
  else       → skip (inline + reason)
```

Log at **STEP 5: REQUEST UPDATE** (`action` + `reason` when skipped). See [STEP 5: CURRENT TO DO](#step-5-current-to-do) for full spec, return shape, and D1 test plan.

**DB tables:** `cloudpilot_requests` (read/write), `cloudpilot_actions` (lookup `action_id`). `cloudpilot_workflows` retired.

---

### 4. Execution — run when decision says so

```text
execution/
├── executeRequest.js       ← entry
└── AtlasExecution.js       ← move from classes/ (existing)
```

| `decision.event` | Execution |
|------------------|-----------|
| `execution_confirmed` | `executeRequest(state)` → handler → Atlas |
| `immediate_execution` | `inventory_aws` — no request row (old STEP 4 immediate) |

Log at **STEP 6: EXECUTION**. No understanding. No decision re-run.

---

### 5. Response — respond once

```text
performDecision()
  → applyDecision()      // apply once (start / update / finish / cancel / skip)
  → executeRequest()   // if decision requires
  → buildResponse()    // CloudPilotChat or OpenAI — once
```

| `decision.chatType` | Handler |
|---------------------|---------|
| `generalChatResponding` | `handleGeneralChat` |
| `cloudPilotResponding` | `handleCloudPilotChat` |

Log at **STEP 7: RESPONSE**. Map `decision.event` → `actionEvent` for `CloudPilotChat` during transition (alias table above).

---

### Incremental rollout (Decision phase)

| Slice | Build | Test |
|-------|-------|------|
| **D0** | `understandMessage(message)` stateless + `decideNextStep` + STEP 4 log | ✅ Done |
| **D1** | `applyDecision` + `startRequest` + `updateRequest` + skip inline (`reason` on outcome) | `toggle ec2` then `us-west-2` persists; idle `hi` → skipped + reason |
| **D2** | `finishRequest` + `cancelRequest` + replace | Mode 1–3 → `action: finished`; cancel works |
| **D3** | `execution` + mode 4 confirm | Atlas runs on automatic + yes |
| **D4** | Response layer (`handleGeneralChat` / `handleCloudPilotChat`) | Chat text in API |
| **D5** | `immediate_execution` (`inventory_aws`) | No request row; Atlas inventory |
| **D6** | Conversation + ambiguous paths | list_open, focus, status, ambiguous |
| **D7** | Delete commented pipeline + old flags | CLEAN UP Phase 2 |

---

### What used to work — checklist

| Capability | Old location | New home |
|------------|--------------|----------|
| Detect action intent | `detectUserRequest` / STEP 3 | ✅ `understanding` |
| Extract region, IDs, name, type | STEP 5 / `functions.js` | ✅ `understanding` |
| Confirm / cancel / mode 1-4 | STEP 6F/7 / `functions.js` | ✅ `understanding` |
| List open actions / focus | `workflowConversationFunctions` | ✅ `understanding.conversation` → `decideNextStep` |
| Start / replace request | STEP 4 | `decideNextStep` → `startRequest` |
| Apply fields to request | STEP 5 | `updateRequest` |
| Status transitions | STEP 6A/6F | `setRequestStatus` / `setExecutionMode` |
| Resolve “what chat event?” | `resolveNullActionEvent` | `decideNextStep` → `request_chat` sub-events |
| Execute on confirm | STEP 7/8 | `execution_confirmed` → `executeRequest` |
| Inventory immediate | STEP 4 `shouldExecuteImmediately` | `immediate_execution` |
| General chat | STEP 8 OpenAI branch | `route: openai` |
| Chat copy per event | `CloudPilotChat.js` | Keep — fed by `performDecision` |
| Ambiguous action | `getAction` multi-match | `decideNextStep` → `ambiguous_action` |
| One open request per conversation | `createAction` guard | `startRequest` (unchanged) |
| Replace on new action | `closeOpenActionBeforeStartingNew` | `startRequest` (unchanged) |

---

## CLEAN UP

**Goal:** Remove dead code left over from the pipeline rebuild and understanding move. **Do soon** — no behavior change if done in the order below. Full audit: 2026-06-09 (after Slice 1 + region).

### Phase 1 — Safe now (orphaned files, zero live requires)

| Task | Status | File / item |
|------|--------|-------------|
| Delete orphaned conversation state | Planned | `state/conversationStateFunctions.js` — old in-memory flow; superseded by `understanding/` + DB |
| Delete orphaned focus tracking | Planned | `state/focusedWorkflowFunctions.js` — never wired |
| Delete orphaned open-actions intents | Planned | `functions/workflowConversationFunctions.js` — never wired to STEP 3 |
| Remove unused import | Planned | `logic/messages.js` — `require('../state/ActionState')` imported but unused |

**Keep for now:** `state/ActionState.js` — still used when `CLOUDPILOT_STATE_BACKEND=memory`.

### Phase 2 — `cloudPilotMessageFunctions.js` (live path is STEP 1–3 only)

| Task | Status | Notes |
|------|--------|-------|
| Remove commented STEP 4–8 block (~lines 115–462) | Planned | Superseded by `processRequest` + `buildResponse` |
| Remove commented `detectUserRequest` | Planned | Replaced by `searchMessageForAction` |
| Remove `//GOAL`, `//FINAL`, `//APPENDIX` blocks (~lines 653–916) | Planned | Historical sketches only |
| Remove dead imports on live path | Planned | `Functions`, `AtlasExecution`, `CloudPilotChat` — only used inside comments today |
| Review helpers only used in comments | Planned | `getActionDefinition`, `handleGeneralChat`, `cloneActionStatus`, `shouldStartNewAction`, `resolveNullActionEvent` — delete or move to `requests/` when STEP 4 lands |

### Phase 3 — Duplicate / legacy logic (after understanding + processRequest slices)

| Task | Status | Notes |
|------|--------|-------|
| Delete `parseMessage.js`, `getAction.js` | ✅ Done | Replaced by `understandMessage.js`, `search/searchMessageForAction.js` |
| Remove `extractAwsRegion` from `functions/functions.js` | Planned | Duplicate of `search/searchMessageForRegion.js` |
| Move remaining field extractors | ✅ Done | Now in `understanding/search/`; remove duplicates from `functions.js` in cleanup |
| Move reply / event helpers | Planned | `extractExecutionMode`, `userConfirmedAction`, `determineActionEvent`, `shouldStartExecution` → `searchMessageForReply` + `processRequest` |
| Gut or delete `functions/functions.js` | Planned | Only required by commented pipeline today; empty once Phase 2–3 done |

### Phase 4 — Docs (optional, low risk)

| Task | Status | Notes |
|------|--------|-------|
| Mark doc snapshots as historical | Planned | `doc/code/allCode.js`, `doc/code/allCodeTwo.js` — show old `detectUserRequest` pipeline |
| Retire legacy SQL doc | Planned | `doc/sql/cloudpilot_workflows_phase1.sql` — superseded by `doc/database/database.md` |

### Suggested cleanup order

```text
1. Phase 1 — delete 3 orphaned files + unused import in messages.js
2. Phase 2 — strip commented blocks + dead imports in cloudPilotMessageFunctions.js
3. Continue understanding / processRequest slices (Slices 2–6)
4. Phase 3 — remove duplicates from functions.js after logic lives in understanding/ + requests/
5. Phase 4 — doc hygiene when convenient
```

**Rule:** One cleanup PR per phase; run same STEP 3 curl tests after each (`hi`, `toggle ec2`, `scan ec2`, `toggle ec2 in us-west-2`).

---

## 1) Current Development

### A. Requests & chat UX

**Goal:** Durable requests, conversational confirm, open-actions visibility.

| Task | Status | Notes |
|------|--------|-------|
| **Schema migration** | Planned | `cloudpilot_actions` + `cloudpilot_requests` + `cloudpilot_executions` — see `database.md` |
| **P3C — Open actions Navigator table** | **Next** | `open_actions` table in `navigatorResponse`; columns: display_name, action_type, status, missing, run; Run Now placeholder row |
| **Policy on routes** | Not started | `allowed`, `reasonNotAllowed` on message routes / responses |
| **Restart mid-flow test** | Verify | DB is source of truth in mysql mode — confirm after schema fix (`display_name`) |
| **Remove / gate `ActionState.js`** | Partial | `CLOUDPILOT_STATE_BACKEND=memory` for tests only; delete Map when restart test is green |
| **`inventory_aws` request row** | Decide | Does informational inventory need a persisted row on start? |

### E. `functions/` folder restructure (planned)

**Goal:** Match folder names to actions / requests / executions layers (see [Target code layout](#target-code-layout-functions)).

| Task | Status | Notes |
|------|--------|-------|
| **Create `requests/`** | Planned | Move + rename per old → new map; update requires |
| **Create `executions/`** | Planned | Move `AtlasExecution.js`; add `Executions.js` when execution table lands |
| **Create `navigator/`** | Planned | Move `navigatorResponseFunctions.js` |
| **Wire `focusedWorkflowFunctions`** | Planned | Merge into `requestConversationFunctions.js` (file exists but unused today) |
| **Remove `state/`** | Planned | After memory mode + focused-request merge |
| **Remove `classes/`** | Planned | After `Requests.js` + `executions/` move |

**Do not** rename symbols across the whole repo in one pass — move files first, then terminology (`workflowId` → `requestId`) as a follow-up.

**England rule (keep):** bare `4` and bare `yes` target the focused request; prompts include quoted `display_name`.

**Do not start yet:** multiple open requests per conversation, `run 1` disambiguation, wired Run button → execute.

---

### B. EC2 mutations (create / delete / toggle)

**Goal:** All three run end-to-end in **`automatic`** mode with manual AWS verification.

**API wiring:** Done for create, delete, toggle (handlers, registry, Atlas clients, field extractors, chat request flow).

| Task | Status | Notes |
|------|--------|-------|
| **Manual AWS E2E — create** | Needs verify | Intent → fields → `4` → `yes` → instance running + tags |
| **Manual AWS E2E — delete** | Needs verify | Instance `terminating` / `terminated` |
| **Manual AWS E2E — toggle** | Needs verify | Primary stopped, secondary running |
| **Stage 4 — cross-action sequence** | Needs | create → toggle → delete on test instances; document cleanup |
| **Stage 4 — failure paths** | Needs verify | Missing fields, bad IDs, wrong state — friendly messages |
| **Atlas unreachable** | Needs | Structured `atlas_unreachable` for all three handlers (no fetch crash) |
| **Stage 0 — Atlas hardening** | Optional | Toggle `ClientError` wrapping; AMI strategy (`DEFAULT_AMIS`) |
| **E2E scripts** | Partial | `e2e-create-ec2.js`, `e2e-delete-ec2.js` exist; toggle script optional |

**Prerequisites:** Atlas at `ATLAS_BASE_URL`, AWS profile `atlas`, test region aligned with defaults, two instance IDs for toggle.

**Exit criteria (all three):** Chat in automatic mode changes AWS; success returns non-null `atlasResponse`; manual verify in console.

---

### C. Kite integration

**Goal:** Connect Kite to `POST /message` and render CloudPilot + Navigator payloads.

| Task | Status | Notes |
|------|--------|-------|
| Send `conversationID` on every message | Kite | Required for request scope |
| Render `CloudPilotActionStatus` | Kite | status, missing, collected, request id (`workflowId` in API today), displayName |
| Render `navigatorResponse` | Kite | stats / tables from scan + inventory (done on API side) |
| Open actions dashboard table | Blocked on P3C | API must emit `open_actions` table first |
| React Query cache for Navigator | Later | `["navigator-data", groupID, conversationID]` |

---

### D. Error & outcome handling (remaining manual tests)

**Code:** Complete (2026-05-24). Outcomes are data, not crashes.

| Task | Status | Notes |
|------|--------|-------|
| Toggle deleted IDs → friendly message, no partial stop/start | Manual test | Preflight should block |
| Atlas stopped → `atlas_unreachable`, API stays up | Manual test | All mutation handlers |

**Pattern:** Validate → Execute → (Verify later). Deleted instance = **outcome**, not HTTP 500.

---

## 2) Finished Development

### Requests & database

- [x] Durable request rows in MySQL (`cloudpilot_workflows` today → `cloudpilot_requests` target) + `Actions.js`
- [x] `display_name` on create from registry `actionLabel`
- [x] User-friendly statuses (`waiting_on_fields`, `waiting_on_execution_mode`, `waiting_on_confirmation`, `running`, terminal states)
- [x] MySQL as source of truth (`actionStateFunctions.js`, `CLOUDPILOT_STATE_BACKEND=mysql` default)
- [x] Focused request tracking in-process (P2C — code: `focused_workflow_id`)
- [x] England-rule copy in `CloudPilotChat.js` (P3A)
- [x] Chat open-actions list — “what am I waiting on”, focus switch by name/index (P3B)
- [x] Dual-write bridge removed from hot path; reads/writes via `Actions` + `getUsersActionState`

### EC2 mutations — API code

- [x] `create_ec2`, `delete_ec2`, `toggle_ec2` in `actionRegistry.js`
- [x] Handlers mirror `createEC2Handler` pattern; automatic mode calls Atlas
- [x] Field extractors: region, name, instance_type, instance_id, primary/secondary IDs
- [x] Instance-id heuristic guard (one bare `i-…` per message for shared extractor)

### Navigator UI contract

- [x] `navigatorResponseFunctions.js` — stats, tables, columns, alerts
- [x] Kite generic renderer (client)
- [x] `inventory_aws` + `scan_ec2` Navigator adapters wired
- [x] Opt-in `raw` on read adapters

### Error & outcome handling (code)

- [x] `messages.js` guard — failed remediation does not crash API
- [x] Atlas toggle preflight + `ClientError` → structured envelope
- [x] `atlasEC2Functions` — parse envelope; no throw on `success: false`
- [x] Handlers map outcome codes → friendly `cloudPilotMessage`
- [x] Orchestration guards for repeat intent / failed request / null events

### Informational actions

- [x] `scan_ec2`, `inventory_aws`, `general_chat` registry + handlers

---

## 3) Long Term Ideas (Not being worked on)

### Execution persistence (Phase 2)

- `cloudpilot_executions` table — `execution_id`, `request_id`, `operation_id`, request/response JSON, audit trail
- Separate **request** (intent + collected fields) from **execution** (AWS run)
- `AtlasExecution.js` creates execution row instead of only updating request status
- Long-running runs survive Node restart; retries = new execution row on same request

### `operation_id` + mutation metadata (Stage 0.5)

- Generate `operation_id` when execution starts; pass through handlers to Atlas
- Shared context: `execution_mode`, `initiated_by`, `requested_at`
- Not persisted until execution table exists

### Multi-open requests (Phase 2 product)

- Relax one-open-per-conversation constraint
- Kite table with **Run** per row; disambiguation: `run 1`, fuzzy `display_name`
- Optional `action_name` slug; request resolution Rules 1–6 (legacy: `resolveWorkflow()`)
- Named confirm only when ambiguous

### EC2 hardening (Stage 5+)

- Toggle by tags/roles (`cloudpilot-role: primary/secondary`) — no raw IDs in chat
- Delete safety: only `cloudpilot-managed=true` instances
- Destructive confirmation copy before final confirm
- `automatic_safe` / rollback / monitoring execution modes
- Navigator adapters for mutate actions (create/delete/toggle results)
- Waiters after create (running) / delete (terminated)

### Platform & credentials

- Rollback / undo (after stable mutation flow + execution history)
- Per-user / multi-account AWS credentials
- Bulk actions (“delete 5 instances” → 5 request rows)
- More actions: `resize_ec2`, security scan, cost report, RDS, IAM, Terraform

### Deprecated / do not use

- **`atlas_actions`** table — early sketch; superseded by `cloudpilot_requests`. No JS references.
- **“Workflow”** as a product/doc term — use **request** only.

### Navigator / Kite polish

- Persist Navigator data (React Query cache rules)
- Better column formatting in Kite (`currency`, `status` alignment)
- Opt-in developer `raw` mode default-off
- File naming cleanup pass (separate chore)
- Avoid premature abstraction (schema engines, dynamic plugin registries)

---

## Suggested order (today)

```text
1. Decision phase — D0 stateless understanding, D1 decideNextStep, D2–D8 apply/execute/respond (see Pipeline: Decision → Requests → Execution)
3. CLEAN UP — Phase 1 then Phase 2 (see [CLEAN UP](#clean-up)) — soon, no new features
4. Adopt cloudpilot_actions + cloudpilot_requests + cloudpilot_executions (database.md) — Actions.js done; run SQL if not yet
5. P3C — open_actions Navigator table (API)
6. functions/ restructure — requests/ then executions/ then navigator/ (see section 1E)
7. Kite — wire POST /message + render action status + navigator tables
8. Manual AWS E2E — create, delete, toggle + Stage 4 cross-action
9. Policy fields on routes
10. CLEAN UP — Phase 3–4 after processRequest lands
11. Phase 2 product — Executions.js + operation_id (when ready for audit/retries)
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-09 | **STEP 5 spec:** `applyDecision` — decision-only apply layer; A+B first; return shape; added [STEP 5: CURRENT TO DO](#step-5-current-to-do) |
| 2026-06-10 | **STEP 5 naming:** request language (`startRequest`, `updateRequest`, `finishRequest`, `cancelRequest`); **`reason` on outcome**; no `inferMutation` / mutation jargon; D1 = 3 files, skip inline; D2 = finish + cancel |
| 2026-06-09 | **STEP 4 live:** `decideNextStep` + `chatType` (`generalChatResponding` / `cloudPilotResponding`); D0 complete |
| 2026-06-09 | **Understanding complete (Slices 3b–5):** all field/reply/conversation parsers; **Actions & input reference** table added |
| 2026-06-09 | **Understanding plan:** "Finish STEP 3 before processRequest" — field/reply/conversation table + exit test; actions deferred to next phase |
| 2026-06-09 | **CLEAN UP** section added — phased dead-code removal plan (orphaned files, commented pipeline, duplicates) |
| 2026-06-09 | **Understanding Slice 3 (region):** `searchMessageForRegion` + `searchMessageForValues` wire-up; STEP 3 logs `values.region` |
| 2026-06-09 | **Understanding Slice 1:** restructured `understanding/` — `understandMessage` entry, `searchMessageFor*` files, stubs; added **Understanding: To Do** section (Slices 2–6) |
| 2026-06-06 | **Pipeline rebuild:** section added — STEP 1–3 live (`understanding/`), STEP 4 next; why region/fields not persisted yet; test curl |
| 2026-06-06 | **Target `functions/` layout:** `requests/`, `executions/`, `navigator/` — old → new file map; section 1E |
| 2026-06-06 | **Terminology:** *workflow* retired — use **request** only; target tables `cloudpilot_requests` / `cloudpilot_executions` per `database.md` |
| 2026-06-06 | Consolidated `MASTER_TODO.md`, `Master_Database.md`, `Master_Error_Fixes.md`, `action_to_do.md` (and duplicate `to_do/` copies) into this file |
| 2026-06-01 | Prior docs: request phases P0–P3B shipped; P3C next |
| 2026-05-28 | EC2 mutation API wiring complete; manual AWS pending |
| 2026-05-24 | Error/outcome handling implemented; Navigator contract + adapters |


One thing I would change
This part:


{
  "replaceOpenRequest": true
}

is showing up even when there is no open request.
Example:


{
  "pendingAction": null
}

then:


{
  "replaceOpenRequest": true
}

for a brand new scan.
Not a bug, but slightly confusing.
I'd expect:



