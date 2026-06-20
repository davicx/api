# CloudPilot Capability Layer — Single Function Entry Points

**Purpose:** Step-by-step plan to introduce `capabilities/` as the standardized execution surface between handlers and external engines (Atlas, OpenAI, etc.).

**Status:** Planned — no code until Step C1.

**Do this before:** [step_one_cleanup.md](./step_one_cleanup.md) (Phase U1–U3), then Step C1.

**Related:**

| Doc | Role |
|-----|------|
| [architecture.md](./architecture.md) | Stable reference — four layers + History, history rules |
| [step_one_cleanup.md](./step_one_cleanup.md) | Pre-capability cleanup — do U1–U3 first |
| [single_capabiity_change.md](./single_capabiity_change.md) | New & changed files map |
| [development_undo_feature.md](./development_undo_feature.md) | Undo reuses mutation capabilities |
| [current_development.md](./current_development.md) | Active checklist |

**Last reviewed:** 2026-06-09

---

## What stays the same

The chat pipeline does **not** change. Every user message still runs STEPS 1–7. Only **what STEP 6 calls** (and optionally what STEP 7 calls for general chat) gets standardized.

```text
POST /message
  ↓
processMessage()                     ← Conversation Layer
  ↓
STEP 3  understandMessage
STEP 4  decideNextStep
STEP 5  applyDecision               ← requests
STEP 6  executeRequest              ← Execution Layer (when execution_started)
        ↓
        handler (thick)
        ↓
        capability (thin)             ← NEW — single entry point
        ↓
        Atlas / AWS                   ← Engine Layer
STEP 6B saveHistory()                 ← WHAT CHANGED — cross-cutting, NOT inside capability
STEP 7  buildResponse
```

**History rule (locked):** Capabilities return structured results. `saveHistory()` stays in STEP 6B after mutation success/failure. Capabilities do not insert history rows.

---

## Four layers + History

Four **layers** answer WHAT / WHEN / HOW / WHERE. **History** is a fifth **concept** — cross-cutting, not a layer — it records WHAT CHANGED after execution completes.

| Concept | Question | Home |
|---------|----------|------|
| **Conversation** | WHAT should happen? | `processMessage`, understand, decide, requests, responses |
| **Execution** | WHEN should it happen? | `executeRequest`, handlers (registry) |
| **Capability** | HOW do we do it? | `capabilities/` — `scanEC2`, `toggleEC2`, `getAllResources`, `generalChat` |
| **Engine** | WHERE do we talk? | Atlas, AWS, OpenAI (`services/chat/openAI/`), GitHub, Jira |
| **History** | WHAT CHANGED? | `services/history/` + STEP 6B — **not part of HOW** |

History intentionally sits outside the capability path:

```text
executeRequest()
    ↓
handler
    ↓
toggleEC2()          ← capability (HOW)
    ↓
Atlas                ← engine (WHERE)
    ↓
saveHistory()        ← WHAT CHANGED (mutations only)
```

Capabilities return structured results. `saveHistory()` stays in STEP 6B after mutation success/failure. Capabilities do not insert history rows.

### Who calls capabilities?

| Caller | Example | Capability |
|--------|---------|------------|
| Chat (STEP 6) | User confirms scan | `scanEC2()` |
| Undo (later) | User says undo | `toggleEC2()` via `executeUndoPayload()` |
| Auto-remediation (future) | CPU idle 30 days | `resizeEC2()` |
| Public API (future) | `POST /api/toggle` | `toggleEC2()` |

Handlers stay **thick** (Navigator, chat copy, field context). Capabilities stay **thin** (HTTP / SDK call, normalized return shape).

---

## Target folder layout

```text
application/atlas/capabilities/     ← sibling to services/
├── scans/
│   ├── scanEC2.js
│   ├── scanS3.js
│   └── scanRDS.js
├── inventory/
│   ├── getAllResources.js
│   ├── listEC2Instances.js
│   └── listS3Buckets.js
├── mutations/
│   ├── toggleEC2.js
│   ├── createEC2.js
│   ├── deleteEC2.js
│   └── resizeEC2.js
└── conversation/
    └── generalChat.js              ← see “General chat” section below
```

Handlers import with relative paths, e.g. `../../../../capabilities/mutations/toggleEC2` from `services/actions/ec2/toggleEC2/`.

### Capability return shape (convention)

Each capability returns a normalized object handlers can rely on:

```javascript
{
  success: boolean,
  data: object | null,       // engine payload (Atlas body, OpenAI text, etc.)
  error: string | null
}
```

Handlers map `data` → Navigator, `cloudPilotMessage`, etc.

### Future metadata (not Step C1)

Later, optional exports for automation:

```javascript
toggleEC2.meta = { group: 'mutation', createsHistory: true }
scanEC2.meta = { group: 'scan', createsHistory: false }
```

Do not build meta registry until at least C2–C4 are done.

---

## General chat — is it a capability?

**Short answer:** Yes as a **single entry point**, but in a **fourth group** (`conversation/`), not mixed with scans/inventory/mutations.

| | Cloud operations | General chat |
|--|------------------|--------------|
| Pipeline step | STEP 6 (`execution_started`) | STEP 7 (`generalChatResponding`) |
| Engine | Atlas → AWS | OpenAI |
| History | mutations only | Never |
| Handler | Yes (scan/toggle handlers) | No — response builder calls capability directly today |

### Recommended shape

```text
STEP 7 buildResponse
  ↓ (chatType === generalChatResponding)
buildGeneralChatResponse
  ↓
capabilities/conversation/generalChat({ message, conversationID, context })
  ↓
openAIFunctions.sendGeneralChat()    ← engine stays in chat/openAI/
```

**Why a fourth group, not `mutations/` or a handler:**

- General chat is not “execute a CloudPilot action” — no request row lifecycle, no confirm, no Atlas.
- Symmetry still holds: one function to call, one place to mock, future API can expose `POST /api/chat`.
- Keeping the OpenAI SDK in `chat/openAI/` is fine — `generalChat()` is the thin wrapper (like `scanEC2()` wraps Atlas HTTP).

**What NOT to do:**

- Do not route general chat through STEP 6 / `executeRequest` just to “fit the pattern.”
- Do not put OpenAI logic inside handlers or inside `understandMessage`.

**When to implement:** Step C6 (after first scan + mutation capabilities prove the pattern).

---

## Implementation steps

Work in order. Each step is shippable and testable on its own. **Do not rename symbols repo-wide in the same pass as a folder move.**

---

### Step C0 — Lock the plan ✅

- [x] Document four layers and history separation
- [x] Confirm pipeline unchanged
- [x] This file

**Verify:** Review with architecture.md — no contradictions.

---

### Step C1 — Scaffold `capabilities/` + conventions

**Goal:** Empty structure + one README comment block in each folder; no behavior change.

**Tasks:**

1. Create `application/atlas/capabilities/{scans,inventory,mutations,conversation}/`
2. Add `capabilities/README.md` — return shape, “thin only”, history stays STEP 6B
3. Add `index.js` re-exports (optional) or direct requires from handlers

**Verify:** App boots; no imports switched yet.

---

### Step C2 — First mutation: `toggleEC2`

**Goal:** Prove mutation path + STEP 6B history unchanged.

**Tasks:**

1. Move HTTP body from `atlasEC2Functions.toggleEC2()` → `capabilities/mutations/toggleEC2.js`
2. `atlasEC2Functions.toggleEC2` becomes thin re-export (deprecation comment) OR handler imports capability directly
3. `toggleEC2Handler` calls `capabilities/mutations/toggleEC2(...)` — formatting/Navigator unchanged
4. Confirm `executeRequest` → `saveHistory()` still logs `STEP 6B: HISTORY SAVED` on automatic toggle

**Verify:**

- E2E toggle automatic → Atlas hit, history row, same chat/Navigator as before
- `grep atlasEC2Functions.toggleEC2` — only capability + legacy shim remain

---

### Step C3 — First scan: `scanEC2`

**Goal:** Prove scan path; no history.

**Tasks:**

1. Extract `capabilities/scans/scanEC2.js` from `atlasEC2Functions.scanEC2`
2. Wire `scanEC2Handler` → capability
3. Legacy shim on `atlasEC2Functions.scanEC2` if needed

**Verify:**

- `"scan ec2"` → region → confirm → scan runs; Navigator unchanged
- No row in `cloudpilot_history`

---

### Step C4 — Inventory: `getAllResources` (inventory_aws)

**Goal:** Prove `immediate_execution` path (STEP 6 without confirm).

**Tasks:**

1. Extract from inventory handler’s Atlas call → `capabilities/inventory/getAllResources.js`
2. Wire `inventoryAWSHandler` → capability

**Verify:**

- Inventory chat flow → resources on dashboard; no history row

---

### Step C5 — Remaining EC2 capabilities

**Goal:** Complete EC2 surface before cross-service work.

**Tasks:**

1. `createEC2`, `deleteEC2` → `capabilities/mutations/`
2. Handlers updated; shims on `atlasEC2Functions` until C7

**Verify:** E2E create/delete test scripts pass.

---

### Step C6 — General chat entry point

**Goal:** Single function for OpenAI; wire live `sendGeneralChat` (currently stubbed in `buildGeneralChatResponse.js`).

**Tasks:**

1. Add `capabilities/conversation/generalChat.js` — calls `openAIFunctions.sendGeneralChat`
2. `buildGeneralChatResponse` → `generalChat({ message, conversationID, context })`
3. No STEP 6 changes

**Verify:**

- `"hi"` → OpenAI response (or configured stub in dev)
- No request row created; no Atlas call

---

### Step C7 — Remove legacy shims

**Goal:** One import path per capability.

**Tasks:**

1. Grep for direct `atlasEC2Functions.*` outside capabilities — replace with capability imports
2. Trim or delete moved functions from `atlasEC2Functions.js` (keep file if other EC2 helpers remain)

**Verify:** Grep clean; smoke all four EC2 flows.

---

### Step C8 — Undo uses capabilities (ties to H4)

**Goal:** Undo never calls Atlas directly.

**Tasks:**

1. `undoRegistry` maps `undo_payload.type` → mutation capability (e.g. `toggleEC2`)
2. `executeUndoPayload()` calls capability with payload args
3. STEP 6B still records undo history row after success

**Verify:** Undo toggle E2E; same `toggleEC2()` path as user confirm.

**See:** [development_undo_feature.md](./development_undo_feature.md) H4.

---

### Step C9 — Future consumers (deferred)

Not scheduled — documented so the model stays coherent.

| Consumer | Entry |
|----------|--------|
| Public API | Controller → capability |
| Auto-remediation job | Job → `capabilities/mutations/resizeEC2` |
| PR generation | Already mode 3 in decision — may call capability or emit instructions only |

---

## Capability group ↔ history (reference)

| Group | Folder | STEP 6? | STEP 6B history? |
|-------|--------|---------|------------------|
| Scan | `scans/` | On confirm | No |
| Inventory | `inventory/` | Often immediate | No |
| Mutation | `mutations/` | On confirm | Yes |
| Conversation | `conversation/` | No (STEP 7) | No |

---

## Per-message call map (reminder)

Every `POST /message` runs STEPS 1–7. Atlas/OpenAI run only when:

| Trigger | STEP 4 `response.type` | Capability called |
|---------|------------------------|-------------------|
| Confirm scan/toggle | `execution_started` | STEP 6 → handler → capability |
| Inventory | `immediate_execution` | STEP 6 → handler → capability |
| General chat | `general_chat` | STEP 7 → `generalChat()` |
| Missing fields / confirm prompt | `ask_for_missing_fields`, `awaiting_confirmation`, etc. | None |

---

## Exit criteria (whole initiative)

- [ ] All Atlas HTTP calls from chat flow go through `capabilities/`
- [ ] Handlers contain zero raw `fetch(ATLAS_BASE_URL + …)` 
- [ ] `saveHistory()` only in `executionFunctions.js` (STEP 6B), never inside capabilities
- [ ] Undo (H4) calls mutation capabilities only
- [ ] `generalChat()` is the only OpenAI entry from STEP 7
- [ ] Docs: architecture.md + this file match live layout

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-09 | Initial plan — four layers, C0–C9, general chat as `conversation/` |
| 2026-06-09 | `capabilities/` at atlas root (sibling to `services/`); History as cross-cutting WHAT CHANGED |
