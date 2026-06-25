# CloudPilot — `services/`

CloudPilot API orchestration lives here (formerly `functions/`). **Full atlas code tree:** [../README.md](../README.md) (code only, no `doc/`).

**Orchestrator (root):** `cloudPilotMessageFunctions.js` — STEPS 1–7 entry (`processMessage`). Uses `currentRequestState`, `activeRequestAction`, and `RequestStateFunctions` (import alias for `requestLoadFunctions.js`).

**Glossary:** **Message pipeline** + **General / Request Conversation** — [code_cleanup.md](../doc/development/code_cleanup.md).

**Capabilities (sibling folder):** `../capabilities/` — thin execution surface (`scanEC2`, `toggleEC2`, `generalChat`, …). Handlers in `actions/` delegate here for HOW; see `capabilities/README.md`.

---

## Folder organization (decision)

| Folder | Role |
|--------|------|
| `conversation/` | Conversation **systems** (General / Request) |
| `engines/llm/*` | LLM vendor SDKs — **not** in architecture as `openai/` top-level |
| `capabilities/conversation/` | Thin HOW wrapper |

Legacy `chat/`, `responses/` → migrate during [code_cleanup.md](../doc/development/code_cleanup.md) phases.

**Entry file:** prefer `conversation.js` over `chat.js` long-term; Phase 1 may use `chat.js`.

**Symmetry:** `general/workflow.js` exists as a no-op stub today (logs, returns) — reserved for future General Conversation hooks. `request/workflow.js` owns store/execute when Phase 1+ lands.

---

## Folders

| Folder | Role | Pipeline step |
|--------|------|----------------|
| `actions/` | Action registry + handlers | Handlers at STEP 6 |
| `chat/` | **Legacy** — SDK, CloudPilotChat, prompts | → `conversation/` + `engines/llm/` |
| `config/` | Configuration | `chatGPTconfig.js` (→ `engines/llm/openai/` optional) |
| `conversation/` | **Target** — General + Request conversation systems | General: after STEP 4; Request: STEP 5–7 |
| `decision/` | Decide which conversation | **STEP 4** |
| `executions/` | Perform work (Request Conversation) | **STEP 6** |
| `history/` | Change history + undo | **STEP 6B** |
| `navigator/` | Navigator / dashboard shaping | Response shaping |
| `requests/` | Request state persistence | **STEP 2**, **STEP 5** |
| `responses/` | **Legacy** STEP 7 routers/builders | → `conversation/request/conversation.js` |
| `understanding/` | Intent + entity extraction | **STEP 3** |

---

## Pipeline flow

```text
cloudPilotMessageFunctions.js
  STEP 1–4  normalize → load → understand → decide

  General Conversation? → conversation/general/ → return

  STEP 5  Request Conversation — maintain state   (requests/)
  STEP 6  Request Conversation — perform work    (executions/)
  STEP 7  Request Conversation — speak           (conversation/request/)
```

Handlers in `actions/` call `../capabilities/` for Atlas/OpenAI work. History is saved from `executions/functions/executionFunctions.js`, not from capabilities.

---

## Related docs

| Topic | Path |
|-------|------|
| **Action map (WHAT / WHEN / RUN / HOW / WHERE)** | `doc/development/action_map.md` |
| Message architecture + Phase 1 | `doc/development/code_cleanup.md` |
| Architecture (full reference) | `doc/development/architecture.md` |
| Capability layer plan | `doc/development/capability_migration.md` |
| Capability file map | `doc/development/single_capabiity_change.md` |
| Actions & understanding reference | `doc/ReadMe.md` |
