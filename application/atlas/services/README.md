# CloudPilot — `services/`

CloudPilot API orchestration lives here (formerly `functions/`). **Full atlas code tree:** [../README.md](../README.md) (code only, no `doc/`).

**Orchestrator (root):** `cloudPilotMessageFunctions.js` — STEPS 1–7 entry (`processMessage`). Uses `currentRequestState`, `activeRequestAction`, and `RequestStateFunctions` (import alias for `requestLoadFunctions.js`).

**Glossary:** **Request** = user workflow · **Action** = registry entry (`actionMap`) · **General Chat** = not a request. First gate after STEP 3+4: **Request Workflow** (CloudPilot) vs **General Chat** (OpenAI). Details: `doc/development/architecture.md`.

**Capabilities (sibling folder):** `../capabilities/` — thin execution surface (`scanEC2`, `toggleEC2`, `generalChat`, …). Handlers in `actions/` delegate here for HOW; see `capabilities/README.md`.

---

## Folders

| Folder | Role | Pipeline step |
|--------|------|----------------|
| `actions/` | Action registry + handlers | Static definitions; handlers run at STEP 6 via registry |
| `chat/` | OpenAI + chat utilities | Response helpers (`CloudPilotChat`, outcomes, prompts) |
| `config/` | Configuration | e.g. `chatGPTconfig.js` |
| `decision/` | Decide what happens next | **STEP 4** — `decideNextStep.js` |
| `executions/` | Execute approved requests | **STEP 6** — `executionFunctions.js`, `runAction.js`, `AtlasExecution.js` |
| `history/` | Change history + undo | **STEP 6B** — audit rows after execution (WHAT CHANGED) |
| `navigator/` | Navigator / dashboard shaping | Stats, tables, columns on responses |
| `requests/` | Request lifecycle + persistence | **STEP 2** load, **STEP 5** apply — `classes/Request.js`, `requestFunctions.js` |
| `responses/` | Build user-facing responses | **STEP 7** — `buildResponse.js` |
| `understanding/` | Intent + entity extraction | **STEP 3** — `understandMessage.js`, `search/*` |

---

## Pipeline flow

```text
cloudPilotMessageFunctions.js
  STEP 1  normalize (local helper)
  STEP 2  requests/          load open request (RequestStateFunctions)
  STEP 3  understanding/     what is the user trying to do?
  STEP 4  decision/          what should happen next?
  STEP 5  requests/          applyDecision (Request Workflow only)
  STEP 6  executions/        executeRequest → runAction → handler → ../capabilities/
  STEP 6B history/           saveHistory() (changes only — after Atlas returns)
  STEP 7  responses/         buildResponse (CloudPilot or OpenAI)
```

Handlers in `actions/` call `../capabilities/` for Atlas/OpenAI work. History is saved from `executions/functions/executionFunctions.js`, not from capabilities.

---

## Related docs

| Topic | Path |
|-------|------|
| **Action map (WHAT / WHEN / RUN / HOW / WHERE)** | `doc/development/action_map.md` |
| Architecture | `doc/development/architecture.md` |
| Capability layer plan | `doc/development/capability_migration.md` |
| Capability file map | `doc/development/single_capabiity_change.md` |
| Actions & understanding reference | `doc/ReadMe.md` |
