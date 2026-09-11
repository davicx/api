# Feature: Clean `cloudPilot/` folder

Goal: understand and later simplify `api/application/atlas/cloudPilot/` chat + execution structure.

**Do not refactor until we decide.** This doc captures an inspection of the actual code (Scan Conversation MVP context).

**Architecture north star (locked with Intelligence cleanup):** CloudPilot owns the application turn — **UNDERSTAND (via Intelligence) → DECIDE → FULFILL → RESPOND (via Intelligence)**. Intelligence never jumps from understand into AWS retrieve/execute. See `feature_clean_cloudpilotintelligence_folder.md`. Prefer small fixes that restore that path over more folders. `processMessage` is the conductor.

Scope inspected:

```text
atlas/cloudPilot/

chat/
  general/
    generalChat.js
    GeneralConversation.js
    workflow.js

  presentation/
  request/
  templates/

  CloudPilotMessage.js
  cloudPilotMessageFunctions.js

execution/
  functions/
    executionFunctions.js
    runAction.js

  outcomes/
    outcomeRegistry.js

  AtlasExecution.js
```

Related (not this doc): `feature_clean_cloudpilotintelligence_folder.md` for Intelligence.

---

## Verdict

This area grew by layering intended architecture on top of a working pipeline. Several files are dead, placeholders, or duplicates of the same job.

Scan S3 / Scan EC2 mostly need:

```text
processMessage → request store/execute → handler → speak
```

Not half of what sits under `chat/general/` and the duplicate `AtlasExecution` path.

---

## Per-file inspection

For each file:

1. ONE primary responsibility
2. Who calls it
3. What it calls
4. Required for Scan S3 / Scan EC2 MVP?
5. Kind: entry / orchestration / business / presentation / execution / helper
6. Could responsibility live elsewhere?
7. Abstraction for unused functionality?
8. Rating: KEEP | QUESTION | SIMPLIFY | DEFER

### `chat/general/generalChat.js`

| | |
| --- | --- |
| Responsibility | Placeholder “OpenAI general chat”; always returns `not_implemented` |
| Callers | **Nobody** |
| Calls | Nothing useful |
| MVP? | No |
| Kind | Dead placeholder |
| Elsewhere? | Real job is `cloudPilotIntelligence/generateGeneralMessageReply` via `CloudPilotMessage` |
| Unused abstraction? | **Yes** |
| Rating | **SIMPLIFY** |

### `chat/general/GeneralConversation.js`

| | |
| --- | --- |
| Responsibility | Gate + speak for general turns: detect `generalChatResponding`, call `CloudPilotMessage.prepareGeneralMessageReply` |
| Callers | `cloudPilotMessageFunctions.processMessage` |
| Calls | `CloudPilotMessage` → Intelligence General Chat |
| MVP? | Yes (freeform / non-request turns) |
| Kind | Thin orchestration / speak entry |
| Elsewhere? | Could inline into `processMessage` (~20 lines) |
| Unused abstraction? | No — used but very thin |
| Rating | **QUESTION** |

### `chat/general/workflow.js`

| | |
| --- | --- |
| Responsibility | Placeholder no-op (`console.log` + `return null`); “reserved for future” |
| Callers | **Nobody** |
| Calls | Nothing |
| MVP? | No |
| Kind | Dead placeholder |
| Elsewhere? | N/A |
| Unused abstraction? | **Yes** — symmetry scaffolding |
| Rating | **SIMPLIFY** |

**Note:** The **real** workflow for Scan is `cloudPilot/requests/workflow.js` (`store` / `execute`), not this file. Filename under `general/` does not make that clear.

### `chat/presentation/getRequestMessageReplyContext.js`

| | |
| --- | --- |
| Responsibility | Fact bag for OpenAI polish of request UX (missing fields, confirm, …) |
| Callers | `CloudPilotMessage.prepareRequestMessageReply` |
| Calls | Helpers / field examples |
| MVP? | Yes (when MESSAGE_RESPONSE=openai) |
| Kind | Presentation prep |
| Elsewhere? | Could sit with templates or Intelligence request reply; separation OK |
| Unused? | No |
| Rating | **KEEP** |

### `chat/presentation/navigatorFunctions.js`

| | |
| --- | --- |
| Responsibility | Shape Navigator UI payloads (tables/cards) |
| Callers | S3/EC2 scan navigator adapters (also inventory/billing/history) |
| Calls | Pure helpers |
| MVP? | Yes if Navigator tables ship with scans |
| Kind | Presentation / UI adapter |
| Elsewhere? | Could live under `scans/`; under `chat/presentation` is a bit odd |
| Unused? | No for scans |
| Rating | **KEEP** (placement QUESTION) |

### `chat/request/RequestConversation.js`

| | |
| --- | --- |
| Responsibility | STEP 7 speak routing for request turns |
| Callers | `processMessage` after store/execute |
| Calls | `CloudPilotMessage`, history/open-requests, execution-mode strategies, create-EC2 guidance, … |
| MVP? | Yes |
| Kind | Orchestration (speak) |
| Elsewhere? | Could merge into `processMessage`; real branching worth a file |
| Unused? | No (some branches outside pure Scan MVP) |
| Rating | **KEEP** |

### `chat/templates/requestTemplates.js`

| | |
| --- | --- |
| Responsibility | Deterministic request UX copy by `actionEvent` |
| Callers | `CloudPilotMessage.prepareRequestMessageReply` |
| Calls | Field prompts, create-EC2 guidance, pricing; **dead branch** `AtlasExecution.startNewAtlasExecution` for `execution_requested` |
| MVP? | Yes for confirm/missing-field copy. `execution_requested` path **not** reached by current `RequestConversation` mapping |
| Kind | Presentation / copy |
| Elsewhere? | Fine as templates; executing Atlas from templates is confusing |
| Unused parts? | `execution_requested` leftover |
| Rating | **KEEP** / QUESTION (dead Atlas branch) |

### `chat/CloudPilotMessage.js`

| | |
| --- | --- |
| Responsibility | Package outgoing Message Reply (general / request / known); does not HTTP-send |
| Callers | `GeneralConversation`, `RequestConversation` |
| Calls | Intelligence, `requestTemplates`, `getRequestMessageReplyContext` |
| MVP? | Yes |
| Kind | Presentation front door |
| Elsewhere? | Could fold into conversation files; single packaging door is clear |
| Unused? | No |
| Rating | **KEEP** |

### `chat/cloudPilotMessageFunctions.js`

| | |
| --- | --- |
| Responsibility | Whole turn pipeline `processMessage` |
| Callers | `logic/messages.js` |
| Calls | Understand, decide, General/Request conversation, `requests/workflow`, verification, history, … |
| MVP? | Yes — **the** chat turn entry |
| Kind | Entry + orchestration |
| Elsewhere? | This is the center |
| Unused? | No |
| Rating | **KEEP** |

### `execution/functions/executionFunctions.js`

| | |
| --- | --- |
| Responsibility | STEP 6 orchestration: should run? context; automatic strategy; finish request; history |
| Callers | `requests/workflow.execute` ← `processMessage` |
| Calls | `AutomaticLogic` → `runAction`; request finish; history; undo |
| MVP? | Yes |
| Kind | Orchestration / execution |
| Elsewhere? | Overlaps historically with `AtlasExecution` |
| Unused? | No — **live** execute path |
| Rating | **KEEP** |

### `execution/functions/runAction.js`

| | |
| --- | --- |
| Responsibility | Look up `executionFunction` on master registry and call it |
| Callers | `AutomaticLogic.runAutomaticStrategy` only |
| Calls | e.g. `scanS3Handler` / `scanEC2Handler` |
| MVP? | Yes (thin but on path) |
| Kind | Helper / dispatch |
| Elsewhere? | Could be one function inside `executionFunctions.js` |
| Unused? | No |
| Rating | **QUESTION** |

### `execution/outcomes/outcomeRegistry.js`

| | |
| --- | --- |
| Responsibility | Map error codes → friendly English strings |
| Callers | EC2 change handlers, `scanEC2Handler` (failure), `history/undoRegistry`. **Not** `scanS3Handler` |
| Calls | Nothing external |
| MVP? | Not required for S3 happy path; useful for EC2 failure copy |
| Kind | Presentation helper for execution errors |
| Elsewhere? | Could be messages next to handlers; “registry” is a dict + helpers |
| Unused for S3 success? | Mostly irrelevant |
| Rating | **DEFER** (pure S3) / KEEP for EC2 errors |

Registered codes in `OUTCOME_MESSAGES`:  
`instance_not_found`, `instances_not_found`, `instance_terminated`, `invalid_instance_id`, `invalid_instance_state`, `same_instance`, `aws_toggle_failed`, `aws_terminate_failed`, `atlas_unreachable`, `missing_instance_ids`, `missing_instance_id`, `invalid_region`, `no_default_ami_for_region`, `aws_run_instances_failed`, `aws_tag_failed`, `missing_tag_key`, `missing_tag_value`, `execution_failed`  
Plus `DEFAULT_EXECUTION_FAILED` for toggle/delete/create/tag/pause/resume.

If removed: those handlers need inline strings; S3 success unchanged; undo/change EC2 failure copy degrades.

### `execution/AtlasExecution.js`

| | |
| --- | --- |
| Responsibility | Older “start execution + finish DB row” that calls `executionFunction` directly |
| Callers | **Only** `requestTemplates` when `actionEvent === 'execution_requested'` — current mapping **never** emits that |
| Calls | Master handler; Request DB helpers. `checkAtlasExecutionStatus` / `closeAtlasExecution` stubs/unused |
| MVP? | **Not on live Scan path** |
| Kind | Duplicate execution orchestration |
| Elsewhere? | Already in `executionFunctions` + `runAction` |
| Unused abstraction? | **Yes** |
| Rating | **SIMPLIFY** |

---

## `generalChat.js` vs `GeneralConversation.js`

| | `generalChat.js` | `GeneralConversation.js` |
| --- | --- | --- |
| Role | Unwired stub | Real general-turn entry used by `processMessage` |
| Boundary | None in practice | `isGeneralConversation` + `conversation()` → `CloudPilotMessage` |

Only `GeneralConversation` is real. `generalChat.js` does not delegate to it. Real GenAI is `generateGeneralMessageReply` via `CloudPilotMessage`.

---

## What “workflow” means

- `chat/general/workflow.js` — **owns nothing** (placeholder).
- `requests/workflow.js` — **owns** `store` (persist decision) + `execute` (STEP 6). This is the Scan workflow.

---

## What is an “outcome”?

An Atlas/handler **error code** (or failure) turned into user-facing copy via `outcomeRegistry`. Not the same as “conversation outcome” / `processMessage` return shape.

Why a registry? Centralize friendly strings so handlers don’t hardcode every template. Required only if we want that shared copy — not required for S3 happy path.

---

## Live Scan S3 path (confirm → run)

```text
HTTP messages.js
  ↓
cloudPilotMessageFunctions.processMessage()
  ↓
CloudPilotIntelligence.understandMessage()
  ↓
decideNextStep.decideNextStep()          // EXECUTION_STARTED on confirm
  ↓
requests/workflow.store()
  ↓
requests/workflow.execute()
  ↓
executionFunctions.executeRequest()
  ↓
AutomaticLogic.runAutomaticStrategy()
  ↓
runAction.runAction('scan_s3', context)
  ↓
scans/s3/scanS3Handler.js
  ↓
atlasS3Functions.scanS3(region)          // POST Atlas /scan/s3
  ↓
formatter + messageBuilder (+ navigator)
  ↓
executionFunctions finish request + history
  ↓
RequestConversation.conversation()       // executionOutcome message
  ↓
CloudPilotMessage.prepareKnownMessageReply()
  ↓
HTTP response
```

**Not on this path:** `generalChat.js`, `general/workflow.js`, `AtlasExecution.js`, `outcomeRegistry` (S3 success), General Chat Intelligence (unless a general turn).

---

## Ratings summary

| File | Rating |
| --- | --- |
| `generalChat.js` | SIMPLIFY |
| `GeneralConversation.js` | QUESTION |
| `general/workflow.js` | SIMPLIFY |
| `getRequestMessageReplyContext.js` | KEEP |
| `navigatorFunctions.js` | KEEP (placement QUESTION) |
| `RequestConversation.js` | KEEP |
| `requestTemplates.js` | KEEP / QUESTION |
| `CloudPilotMessage.js` | KEEP |
| `cloudPilotMessageFunctions.js` | KEEP |
| `executionFunctions.js` | KEEP |
| `runAction.js` | QUESTION |
| `outcomeRegistry.js` | DEFER (S3) / KEEP (EC2 errors) |
| `AtlasExecution.js` | SIMPLIFY |

---

## `masterContext/` vs this mess

**Orthogonal.** `masterContext/` (under Intelligence) clarifies which AI context ingredients a call gets. It does **not** fix chat/execution folder sprawl.

Prefer: understand / optionally remove dead paths here before more architecture in `cloudPilot/chat` + `execution`. Intelligence Final Response recipe can stay; pause more recipes until this area is clearer.

---

## Possible later cleanup (not started)

- Remove or quarantine dead: `generalChat.js`, `general/workflow.js`, unused `AtlasExecution` / `execution_requested` branch
- Decide fate of thin `GeneralConversation` / `runAction` layers
- Clarify naming: one “workflow” story (`requests/workflow.js`)
- Do not merge `operationContext` / `masterContext` into this cleanup

**Status:** Inspection only. No code changes from this doc yet.
