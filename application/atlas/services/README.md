# CloudPilot — `services/`

CloudPilot API orchestration lives here (formerly `functions/`). **Full atlas code tree:** [../README.md](../README.md) (code only, no `doc/`).

**Orchestrator (root):** `cloudPilotMessageFunctions.js` — STEPS 1–7 entry (`processMessage`). Uses `currentRequestState`, `activeRequestAction`, and `RequestStateFunctions` (import alias for `requestLoadFunctions.js`).

**Glossary:** **Message pipeline** + **General / Request Conversation** + **CloudPilotMessage** — [code_cleanup.md](../doc/development/architecture/code_cleanup.md).

**Capabilities (sibling folder):** `../capabilities/` — thin execution surface (`scanEC2`, `toggleEC2`, `generalChat`, …). Handlers in `actions/` delegate here for HOW; see `capabilities/README.md`.

---

## Folder organization (decision)

| Folder | Role |
|--------|------|
| `conversation/` | Conversation **systems** + **CloudPilotMessage** (speak) + templates |
| `change/strategies/` | **Change strategies** — how mutating actions apply |
| `engines/llm/*` | LLM vendor SDKs — implementation only |
| `executions/outcomes/` | Handler execution outcome copy |
| `capabilities/conversation/` | Thin HOW wrapper |

`responses/` removed (Phase 2). `chat/` removed (Phase 4).

**Symmetry:** `general/workflow.js` no-op stub. `request/workflow.js` — `store()` + `execute()`.

---

## Folders

| Folder | Role | Pipeline step |
|--------|------|----------------|
| `actions/` | Action registry + handlers | Handlers at STEP 6 |
| `conversation/` | General + Request + CloudPilotMessage | STEP 4 exit / STEP 7 |
| `change/strategies/` | Change strategy implementations | STEP 6 (automatic) / STEP 7 (1–3) |
| `engines/llm/` | OpenAI SDK | STEP 1 normalize; general speak (future) |
| `executions/outcomes/` | Post-execution outcome messages | Handler copy |
| `decision/` | Decide which conversation | **STEP 4** |
| `executions/` | Perform work (Request Conversation) | **STEP 6** |
| `history/` | Change history + undo | **STEP 6B** |
| `navigator/` | Navigator / dashboard shaping | Response shaping |
| `requests/` | Request state persistence | **STEP 2**, **STEP 5** |
| `understanding/` | Intent + entity extraction | **STEP 3** |

---

## Pipeline flow

```text
cloudPilotMessageFunctions.js
  STEP 1–4  normalize → load → understand → decide

  General Conversation? → GeneralConversation → CloudPilotMessage → return

  STEP 5  Request Conversation — maintain state   (requests/)
  STEP 6  Request Conversation — perform work    (executions/)
  STEP 7  Request Conversation — speak           (RequestConversation → CloudPilotMessage)
```

Change strategies apply only to **change** actions (`actionTier: destructive` with `executionModes` in `actionMap.js`). See [code_cleanup.md](../doc/development/architecture/code_cleanup.md).

---

## Related docs

| Topic | Path |
|-------|------|
| **Action map (WHAT / WHEN / RUN / HOW / WHERE)** | `doc/development/architecture/action_map.md` |
| Message architecture | `doc/development/architecture/code_cleanup.md` |
| Architecture (full reference) | `doc/development/architecture/architecture.md` |
| To do / finished | `doc/development/To_do.md`, `doc/development/finished.md` |
| Capability layer plan | `doc/development/architecture/capability_migration.md` |
| Capability file map | `doc/development/architecture/single_capabiity_change.md` |
| Actions & understanding reference | `doc/ReadMe.md` |
