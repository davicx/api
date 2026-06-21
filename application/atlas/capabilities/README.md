# Capabilities

Thin functions that call Atlas or OpenAI — one entry point per product action.

**Location:** `application/atlas/capabilities/` — sibling to `services/`. **Full atlas code tree:** [../README.md](../README.md).

Handlers in `services/actions/` import from here for HOW.

## Layout

```text
capabilities/
├── scans/          scanEC2, scanS3
├── changes/        changeEC2.js (toggleEC2, createEC2, deleteEC2)
├── inventory/      getAllResources
├── conversation/   generalChat
└── atlas/          atlasPost.js    ← how we POST to Atlas
```

| Folder | What it is |
|--------|------------|
| `scans/` | Analyze AWS (no history row) |
| `changes/` | Change AWS — toggle, create, delete (history at STEP 6B) |
| `inventory/` | List what exists |
| `conversation/` | General chat via OpenAI |
| `atlas/` | Shared Atlas HTTP helper — not a product action |

## Wired vs placeholder

| Capability | Status |
|------------|--------|
| `changes/changeEC2` | **toggleEC2 live** via `toggleEC2Handler`; create/delete in same file — handlers still use `atlasEC2Functions` until wired |
| `scans/scanEC2` | **Live** — `scanEC2Handler` calls this |
| `scans/scanS3` | Placeholder — handler still uses `atlasS3Functions` |
| `inventory/getAllResources` | Placeholder — handler still uses `atlasAWSFunctions` |
| `conversation/generalChat` | Placeholder — C6 wires `buildGeneralChatResponse` |

## Call path (toggle — live)

```text
toggleEC2Handler  →  changes/changeEC2.toggleEC2  →  atlas/atlasPost  →  Atlas  →  saveHistory()
```

## Rules

- Capabilities return structured results — no request rows, no chat copy, no history inserts.
- `saveHistory()` stays in `services/executions/functions/executionFunctions.js` (STEP 6B).
- Handlers stay in `services/actions/`; they delegate here for HOW.

See [action_map.md](../doc/development/action_map.md) for WHAT / WHEN / RUN / HOW / WHERE per action.

See [capability_migration.md](../doc/development/capability_migration.md) for the step-by-step plan.
