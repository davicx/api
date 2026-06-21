# Capabilities

Thin, single-purpose execution functions — the stable surface for Atlas HTTP, OpenAI, and future engines.

**Location:** `application/atlas/capabilities/` — sibling to `services/`, not inside it. Handlers under `services/actions/` import from here.

**Not built yet (C1 scaffold).** Handlers in `services/actions/` still call `atlasEC2Functions.js` etc. directly until migration.

## Planned layout

```text
capabilities/
├── scans/           scanEC2, scanS3, …
├── inventory/       getAllResources, …
├── mutations/       toggleEC2, createEC2, deleteEC2, …
└── conversation/    generalChat, …
```

## Four layers (+ History)

| Concept | Question | Role |
|---------|----------|------|
| **Conversation** | WHAT should happen? | STEPS 3–5 — understand, decide, request state |
| **Execution** | WHEN should it happen? | STEP 6 — gate on `execution_started` / `immediate_execution` |
| **Capability** | HOW do we do it? | Thin functions — `scanEC2()`, `toggleEC2()`, `generalChat()` |
| **Engine** | WHERE do we talk? | Atlas HTTP, OpenAI SDK, GitHub, Jira |
| **History** | WHAT CHANGED? | Cross-cutting — **not a layer** |

History sits **outside** the capability path — a record of what happened, not part of HOW:

```text
executeRequest()
    ↓
handler
    ↓
toggleEC2()          ← capability (HOW)
    ↓
Atlas                ← engine (WHERE)
    ↓
saveHistory()        ← STEP 6B — WHAT CHANGED (mutations only)
```

## Rules

- Capabilities return structured results only — no request rows, no chat copy, no history inserts.
- `saveHistory()` stays in `services/executions/functions/executionFunctions.js` (STEP 6B).
- Registry + handlers stay in `services/actions/`; they delegate to capabilities for HOW.

## Return shape (convention)

```javascript
{ success: boolean, data: object | null, error: string | null }
```

See [capability_migration.md](../doc/development/capability_migration.md) for the step-by-step plan (C0–C9).
