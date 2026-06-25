# CloudPilot — `services/`

CloudPilot API orchestration lives here (formerly `functions/`). **Full atlas code tree:** [../README.md](../README.md) (code only, no `doc/`).

**Orchestrator (root):** `cloudPilotMessageFunctions.js` — STEPS 1–7 entry (`processMessage`). Uses `currentRequestState`, `activeRequestAction`, and `RequestStateFunctions` (import alias for `requestLoadFunctions.js`).

**Glossary:** **Message pipeline** + **General / Request Conversation** + **Change strategies** — [code_cleanup.md](../doc/development/code_cleanup.md).

**Capabilities (sibling folder):** `../capabilities/` — thin execution surface (`scanEC2`, `toggleEC2`, `generalChat`, …). Handlers in `actions/` delegate here for HOW; see `capabilities/README.md`.

---

## Folder organization (decision)

| Folder | Role |
|--------|------|
| `conversation/` | Conversation **systems** (General / Request) |
| `change/strategies/` | **Change strategies** — how mutating actions apply (instructions, CLI, PR, automatic) |
| `engines/llm/*` | LLM vendor SDKs — **not** in architecture as `openai/` top-level |
| `capabilities/conversation/` | Thin HOW wrapper |

Legacy `chat/` → `engines/llm/` (Phase 4). `responses/` removed in Phase 2. `change/strategies/` live (Phase 3b).

**Symmetry:** `general/workflow.js` no-op stub. `request/workflow.js` — `store()` + `execute()` (thin passthrough to requests/ + executions/).

---

## Folders

| Folder | Role | Pipeline step |
|--------|------|----------------|
| `actions/` | Action registry + handlers | Handlers at STEP 6 |
| `conversation/` | General + Request conversation systems | STEP 4 exit (General) / STEP 7 (Request speak) |
| `change/strategies/` | Change strategy implementations | STEP 6 (automatic) / STEP 7 (instructions, CLI, PR) |
| `chat/` | **Legacy** — CloudPilotChat, OpenAI SDK | → `engines/llm/` |
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

  General Conversation? → conversation/general/ → return

  STEP 5  Request Conversation — maintain state   (requests/)
  STEP 6  Request Conversation — perform work    (executions/; automatic change strategy)
  STEP 7  Request Conversation — speak           (conversation/request/)
                                                   (instructions / CLI / PR strategies when applicable)
```

Change strategies apply only to **change** actions (`actionTier: destructive` with `executionModes` in `actionMap.js`). Scan, inventory, undo, and conversation commands skip the strategy menu. See [code_cleanup.md § Request types and change strategies](../doc/development/code_cleanup.md#request-types-and-change-strategies).

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
