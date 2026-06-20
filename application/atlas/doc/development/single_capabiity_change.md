# Capability Layer — New & Changed Files

**Purpose:** Inventory of what gets added or touched when implementing the capability layer (Steps C1–C8). No implementation in this doc — file and function map only.

**Related:**

| Doc | Role |
|-----|------|
| [use_single_function_entry_points.md](./use_single_function_entry_points.md) | Step-by-step plan (C0–C9) |
| [architecture.md](./architecture.md) | Four layers, history rules |

**Last reviewed:** 2026-06-09

---

## Four layers

| Layer | Question | Pipeline home |
|-------|----------|---------------|
| **Conversation** | **What** should happen? | STEPS 3–5 — understand, decide, request state |
| **Execution** | **When** should it happen? | STEP 6 — gate on `execution_started` / `immediate_execution` |
| **Capability** | **How** do we do it? | Thin functions — `scanEC2()`, `toggleEC2()`, `generalChat()` |
| **Engine** | **Where** do we talk? | Atlas HTTP, OpenAI SDK, GitHub, Jira |

**History rule (locked):** Capabilities return structured results. `saveHistory()` stays in STEP 6B (`executionFunctions.js`). Capabilities do not insert history rows.

**General chat nuance:** WHAT/WHEN still decided in Conversation (STEP 4). HOW is still a capability. Call site is STEP 7 (not STEP 6) because there is no CloudPilot request to execute.

---

## New files (by step)

### C1 — Scaffold

| File | Purpose |
|------|---------|
| `services/capabilities/README.md` | Conventions: return shape, thin-only, history stays STEP 6B |
| `services/capabilities/index.js` | Optional re-exports — not required if handlers import directly |

Empty folders at C1:

```text
services/capabilities/scans/
services/capabilities/inventory/
services/capabilities/mutations/
services/capabilities/conversation/
```

Optional shared engine helper (could wait until C2):

| File | Purpose |
|------|---------|
| `services/capabilities/_shared/fetchAtlasMutation.js` | Extract `fetchAtlasMutation()` from `atlasEC2Functions.js` — shared by mutations |

---

### C2 — First mutation

| File | New function |
|------|----------------|
| `services/capabilities/mutations/toggleEC2.js` | `toggleEC2(requestBody)` — Atlas `POST /ec2/toggle` |

---

### C3 — First scan

| File | New function |
|------|----------------|
| `services/capabilities/scans/scanEC2.js` | `scanEC2(region)` — Atlas `POST /scan/ec2` |

---

### C4 — Inventory

| File | New function |
|------|----------------|
| `services/capabilities/inventory/getAllResources.js` | `getAllResources(options?)` — Atlas `POST /inventory/aws` (today’s `inventoryAWS()` body) |

Handler can remain `inventoryAWSHandler`; capability name aligns with product language.

---

### C5 — Remaining EC2 + S3

| File | New function |
|------|----------------|
| `services/capabilities/mutations/createEC2.js` | `createEC2(requestBody)` |
| `services/capabilities/mutations/deleteEC2.js` | `deleteEC2(requestBody)` |
| `services/capabilities/scans/scanS3.js` | `scanS3(region)` |

---

### C6 — General chat

| File | New function |
|------|----------------|
| `services/capabilities/conversation/generalChat.js` | `generalChat({ message, conversationID, context })` — wraps OpenAI engine |

Use **`conversation/`** not **`chat/`** — avoids collision with existing `services/chat/`.

---

### C8 — Undo (later, with H4)

| File | New function |
|------|----------------|
| `services/history/undoRegistry.js` | `executeUndoPayload(payload)` — maps `payload.type` → mutation capability |

Possibly also:

| File | New function |
|------|----------------|
| `services/history/functions/undoFunctions.js` | Orchestration: lookup → execute → save undo history row |

See [development_undo_feature.md](./development_undo_feature.md) H4.

---

## Changed files

### Handlers — import swap only (logic stays thick)

| File | Change |
|------|--------|
| `actions/ec2/toggleEC2/toggleEC2Handler.js` | `atlasEC2Functions.toggleEC2(...)` → `capabilities/mutations/toggleEC2(...)` |
| `actions/ec2/scanEC2/scanEC2Handler.js` | → `capabilities/scans/scanEC2(...)` |
| `actions/ec2/createEC2/createEC2Handler.js` | → `capabilities/mutations/createEC2(...)` |
| `actions/ec2/deleteEC2/deleteEC2Handler.js` | → `capabilities/mutations/deleteEC2(...)` |
| `actions/s3/scanS3/scanS3Handler.js` | → `capabilities/scans/scanS3(...)` |
| `actions/aws/inventoryAWS/inventoryAWSHandler.js` | → `capabilities/inventory/getAllResources(...)` |

Handlers **keep:** field reads from `context.state.collected`, formatters, Navigator adapters, message builders, execution-mode branches (instructions / cli / pr).

---

### Response layer — C6 only

| File | Change |
|------|--------|
| `responses/buildGeneralChatResponse.js` | Call `generalChat()` instead of inline stub / direct `openAIFunctions.sendGeneralChat` |

---

### Legacy Atlas wrappers — shrink over C2–C7

| File | Change |
|------|--------|
| `actions/ec2/atlasEC2Functions.js` | HTTP moves out; C2–C5 thin re-exports, then deleted or trimmed at C7 |
| `actions/aws/atlasAWSFunctions.js` | Same for `inventoryAWS` |
| `actions/s3/atlasS3Functions.js` | Same for `scanS3` |

Functions that **move out** of `atlasEC2Functions.js`:

- `fetchAtlasMutation()` → `_shared/` or per-mutation file
- `scanEC2()`, `createEC2()`, `deleteEC2()`, `toggleEC2()`

---

### Execution / history — mostly unchanged

| File | Change |
|------|--------|
| `executions/functions/executionFunctions.js` | No structural change — still `executeRequest`, `shouldRunExecution`, `saveHistory()` at STEP 6B |
| `history/functions/historyFunctions.js` | No change for C1–C7 |
| `history/historyBuilders/toggleEc2History.js` | No change |

---

## Explicitly unchanged

| File / area | Why |
|-------------|-----|
| `cloudPilotMessageFunctions.js` | Conversation layer — WHAT |
| `understanding/understandMessage.js` | WHAT |
| `decision/decideNextStep.js` | WHAT |
| `requests/functions/requestFunctions.js` | WHAT |
| `actions/actionRegistry.js` | Still maps `action_type` → handler |
| `responses/buildCloudPilotResponse.js` | STEP 7 copy for CloudPilot actions |
| `responses/buildResponse.js` | Router only — one path to general chat at C6 |
| `chat/openAI/openAIFunctions.js` | Engine layer — SDK stays here; called by `generalChat()` |
| All formatters / Navigator adapters / message builders | Handler concerns, not capabilities |
| `classes/AtlasExecution.js` | Legacy; not on critical path |

---

## Function map (before → after)

| Today | After | Group |
|-------|-------|-------|
| `atlasEC2Functions.toggleEC2()` | `toggleEC2()` in `capabilities/mutations/` | mutation |
| `atlasEC2Functions.scanEC2()` | `scanEC2()` in `capabilities/scans/` | scan |
| `atlasEC2Functions.createEC2()` | `createEC2()` in `capabilities/mutations/` | mutation |
| `atlasEC2Functions.deleteEC2()` | `deleteEC2()` in `capabilities/mutations/` | mutation |
| `atlasS3Functions.scanS3()` | `scanS3()` in `capabilities/scans/` | scan |
| `atlasAWSFunctions.inventoryAWS()` | `getAllResources()` in `capabilities/inventory/` | inventory |
| `openAIFunctions.sendGeneralChat()` | Still exists — wrapped by `generalChat()` in `capabilities/conversation/` | conversation |
| *(none)* | `executeUndoPayload()` in `history/undoRegistry.js` | mutation (C8) |

Handler names stay the same (`toggleEC2Handler`, `scanEC2Handler`, etc.) — only the downstream call changes.

---

## Target folder layout

```text
services/capabilities/
├── _shared/
│   └── fetchAtlasMutation.js       ← optional
├── scans/
│   ├── scanEC2.js
│   └── scanS3.js
├── inventory/
│   └── getAllResources.js
├── mutations/
│   ├── toggleEC2.js
│   ├── createEC2.js
│   └── deleteEC2.js
└── conversation/
    └── generalChat.js
```

---

## Capability group ↔ history

| Group | Folder | STEP 6? | STEP 6B history? |
|-------|--------|---------|------------------|
| Scan | `scans/` | On confirm | No |
| Inventory | `inventory/` | Often immediate | No |
| Mutation | `mutations/` | On confirm | Yes |
| Conversation | `conversation/` | No (STEP 7) | No |

---

## File count summary

| Category | Count |
|----------|-------|
| New capability files | ~9 (`toggleEC2`, `scanEC2`, `scanS3`, `createEC2`, `deleteEC2`, `getAllResources`, `generalChat`, optional `_shared/fetchAtlasMutation`, optional `index.js`) |
| New undo files (C8) | 1–2 |
| Changed handlers | 6 |
| Changed response | 1 (`buildGeneralChatResponse.js`) |
| Shrunk / removed legacy | 3 (`atlasEC2Functions`, `atlasAWSFunctions`, `atlasS3Functions`) |
| Unchanged pipeline core | ~15+ files |

---

## Sanity checklist (before coding)

- [ ] No new STEP — still 1–7, 6B for history
- [ ] Handlers stay thick — 6 files change one import + one call each
- [ ] Registry untouched — `actionRegistry.js` does not need edits
- [ ] OpenAI stays engine — `openAIFunctions.js` not duplicated
- [ ] History not in capabilities — `executionFunctions.js` still owns `saveHistory()`
- [ ] Fourth group is `conversation/` — not `chat/`

---

## Smallest first slice (C1 + C2)

Roughly **4 new files, 1 handler edit, 1 legacy shim**:

1. `services/capabilities/README.md`
2. `services/capabilities/mutations/toggleEC2.js`
3. Optional `services/capabilities/_shared/fetchAtlasMutation.js`
4. Edit `toggleEC2Handler.js` — one import + one call
5. `atlasEC2Functions.js` — thin re-export or trim

**Verify:** Toggle automatic E2E → Atlas hit, `STEP 6B: HISTORY SAVED`, same chat/Navigator as before.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-09 | Initial inventory — new/changed files and functions for C1–C8 |
