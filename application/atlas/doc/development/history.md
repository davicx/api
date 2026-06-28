# History & Requests — To Do

**Last reviewed:** 2026-06-26

> **Shipped (H0–H7, H9–H14, naming):** [finished.md](./finished.md) · **Deep reference:** [architecture/development_undo_feature.md](./architecture/development_undo_feature.md) · **Main backlog:** [To_do.md](./To_do.md)

**Scope:** `cloudpilot_history` (what CloudPilot **changed**) and listing **recent requests** (`cloudpilot_requests`). Not the same as `list_open` (open workflows only).

---

## History row naming (three fields)

Every `cloudpilot_history` row stores **three** action identifiers:

| Column | Role | Example |
|--------|------|---------|
| **`action_name`** | Machine key — routing, builders, undo registry | `toggle_ec2` |
| **`action_display_name`** | Frozen user-facing label (UI, chat table) | `davey Toggle EC2 on June 26` |
| **`action_record_key`** | Computer key — copied from request `display_name_internal` | `toggle_ec2_global_20260626_143001_14` |

**Rules**

- `action_name` stays literal and unchanged — never parse UI copy for undo or routing.
- On mutation, history **copies** from the linked request row:
  - `request.display_name` → `history.action_display_name`
  - `request.display_name_internal` → `history.action_record_key`
- If the request is renamed later, history does **not** change (frozen audit snapshot).
- Undo rows: `Undo {original action_display_name}` and new internal key via `undo_*` + UTC timestamp.

---

## Request naming (two fields)

Every `cloudpilot_requests` row stores:

| Column | Role | Example |
|--------|------|---------|
| **`action_name`** | Human label (unchanged this milestone) | `Toggle EC2` |
| **`display_name_internal`** | CloudPilot-generated unique key (never updated) | `toggle_ec2_global_20260626_143001_14` |
| **`display_name`** | User-facing name (renamable via `request_name: "..."` in chat) | `davey Toggle EC2 on June 26` |

**Default `display_name`:** `{requested_by_user} {Action Name} on {Friendly Date}` (from `created_at`).

**Internal key format:** `{action_type}_{region_or_global}_{yyyymmdd_hhmmss}_{request_id}` (UTC).

**Code:** `services/requests/functions/requestNameFunctions.js`, `functions/atlasTimeFunctions.js` (`formatUtcCompactTimestamp`, `formatFriendlyMonthDay`).

**Schema:** `doc/sql/alter_cloudpilot_requests_display_name_internal.sql`

**Not in this milestone:** dedicated rename command (optional `request_name` in chat updates `display_name` now).

**Optional naming in chat:** While collecting fields, CloudPilot prompts:

```text
Do you want to name this request?

request_name: "updating kite S3"
```

User reply `request_name: "My label"` updates `display_name` on the request row (stored in `collected.request_name` too).

**Shipped (API):** request `display_name_internal` + default `display_name`; history copies both on mutation; optional `request_name` prompt; history Navigator column **Action Name** shows `action_display_name`.

---

## Checklist (in order)

### Phase 1 — Finish recording & undo

- [x] **H5** — Failed toggle → `cloudpilot_history` row (`history_status = failed`, `undo_available = 0`)
- [x] **H6** — API `undoAvailable` hint on `POST /message` response _(Kite UI still open)_
- [x] **H7** — `create_ec2` history + undo (delete created instance)
- [ ] **H8** — `delete_ec2` history + recreate undo (new instance from `resource_state_before`) — **Phase 1B**
- [ ] **Atlas** — Toggle response includes before/after states (preferred for `saveHistory`)
- [ ] **Atlas** — Delete response / preflight includes metadata for recreate (name, instance_type, tags, region)
- [ ] **Atlas** — Test mocks include state fields for toggle; recreate fields for delete
- [ ] **Kite** — Show “Undo available” when `undoAvailable: true`
- [ ] **Kite** — Undo button / “undo last toggle”

### Phase 2 — Show recent history & requests (chat commands)

- [x] **H9** — `History.listRecentHistoryByConversation()` — **Method A4**, limit **5**
- [x] **H10** — Understanding — **list_history** phrases
- [ ] **H11** — Understanding — **recent requests** phrases → `list_recent_requests`
- [x] **H12** — `decideNextStep` — `LIST_HISTORY` conversation command
- [x] **H13** — Speak — chat message + Navigator table (`buildHistoryResponse`)
- [x] **H14** — Navigator history table — **Action Name** column uses `action_display_name`
- [ ] **Kite** — Verify Dashboard renders history table; recent-requests table (blocked on H11)

### Phase 3 — Later

- [ ] **H15** — Targeted undo — `undo change #3` / `undo toggle_ec2` (not only latest)
- [ ] **H16** — `deleteEc2History.js` builder _(createEc2History.js shipped in H7)_
- [ ] **H17** — Change history UI — full audit trail, diffs, version restore

---

## Full description

### What we are building

**CloudPilot Change History** (`cloudpilot_history`) records every mutating action — what changed, before/after, whether undo is available. **Undo** is the first consumer; **list recent history** is the second.

**Recent requests** is a sibling feature: show the last few **request rows** (`cloudpilot_requests`) — what the user asked CloudPilot to do — whether or not a history row exists (e.g. scan still in progress, or failed before mutation).

| User says | Data source | Today |
|-----------|-------------|--------|
| “list open actions” / `list_open` | Open `cloudpilot_requests` only | ✅ shipped |
| “undo” | Latest undoable `cloudpilot_history` row | ✅ shipped (toggle) |
| “show my recent **history**” | Last 5 `cloudpilot_history` rows | ✅ shipped (H9–H14) |
| “show my recent **requests**” | Last 5 `cloudpilot_requests` rows | ❌ H11–H13 |

---

### Phase 1 — Finish recording & undo

**Shipped:** H0 schema, H1 save on toggle success, H2 undoable log, H4 full undo vertical slice, **H5–H7 Phase 1A**, request/history naming, **H9–H14 list history**.

| Task | Notes |
|------|-------|
| **H5** | On failed toggle (Atlas error or handler failure), still `INSERT` history — `history_status = failed`, `undo_available = 0` |
| **H6** | Response field e.g. `undoAvailable: true` when latest row qualifies — Kite can show affordance without parsing message text |
| **H7** | After `create_ec2` automatic success — history builder + `undo_create_ec2` (delete instance) |
| **H8** | Before `delete_ec2` — capture `resource_state_before`; undo = **recreate** new instance (honest UX) |
| **Atlas** | Rich before/after on toggle; delete preflight returns name, type, tags, region for recreate |
| **Kite** | Undo chip/button after H6 |

**Touch points:** `executionFunctions.js` (STEP 6B), `history/historyBuilders/`, `history/classes/History.js`, `undoRegistry.js`, handlers.

**Exit criteria:** Success and failure both recorded for toggle; create/delete history + undo recipes wired; Kite shows undo when available.

---

### Phase 2 — Recent history & recent requests

#### H9 — `History.listRecentHistoryByConversation` (Method A4)

Add to `services/history/classes/History.js`:

```text
//Method A4: List change history for a conversation (limit 5 for now)
static async listRecentHistoryByConversation({ conversationId, limit = 5 })
```

- Query `cloudpilot_history` WHERE `conversation_id = ?` ORDER BY `created_at` DESC LIMIT 5
- Return mapped rows (same shape as `getLatestUndoableRow` / `mapHistoryRowFromDb`)
- Orchestration wrapper in `historyFunctions.js` e.g. `listRecentHistory(conversationId)`

**Recent requests** can reuse existing `Request.getActionsByConversation(conversationId, { limit: 5 })` — no new DB method required unless you want a dedicated **Method** on `Request.js` for clarity.

#### H10 / H11 — Understanding (phrase examples)

Extend `search/searchMessageForConversation.js` (or dedicated extractor):

**Recent history** (`list_history`):

```text
show my recent history
can you show me my recent history
what did i change recently
recent changes
change history
```

**Recent requests** (`list_recent_requests`):

```text
show my recent requests
can you show me my recent requests
what have i asked you to do
recent requests
my last requests
```

**Rule:** Do not collide with `list_open` (open only) or `status` (focused request).

#### H12 — Decision

In `decideNextStep.js`:

- `u.conversation === 'list_history'` → `response.type = list_recent_history` (name TBD in `decisionTypes.js`)
- `u.conversation === 'list_recent_requests'` → `response.type = list_recent_requests`
- No request mutation; no STEP 6 execution (same class as `list_open`)

#### H13 — Speak

In `RequestConversation` → `CloudPilotMessage` / `requestTemplates.js`:

- Load rows via historyFunctions / Request class
- Format human-readable list for chat, e.g.:

```text
Your last 5 changes:
1. toggle_ec2 — i-123:i-456 — completed — undo available
2. ...
```

```text
Your last 5 requests:
1. scan_ec2 — completed
2. toggle_ec2 — waiting_on_fields
...
```

#### H14 — Navigator (optional)

If Kite should render a table (like scan findings), add a small adapter under `navigator/` that shapes history or request rows into `navigatorResponse.tables[]`. Chat copy in H13 still works without this.

**Exit criteria:** User can ask “show my recent history” or “show my recent requests” in chat and get the last 5 items for that `conversationID`.

---

### Phase 3 — Later

- **H15** — Disambiguated undo (pick row from history list)
- **H16** — Additional history builders as new actions ship
- **H17** — Full change-history product UI

---

## Code layout (target)

```text
services/history/
    classes/History.js
        Method A1  insertHistoryRow
        Method A2  getLatestUndoableRow
        Method A3  markHistoryReverted
        Method A4  listRecentByConversation   ← H9
    functions/
        historyFunctions.js                   ← listRecentHistory wrapper
        undoFunctions.js
    historyBuilders/
        toggleEc2History.js
        createEc2History.js                   ← H7
        deleteEc2History.js                   ← H8
    historyNavigatorAdapter.js
    functions/
        historyFunctions.js                   ← listRecentHistory, buildHistoryResponse
        historyActionNameFunctions.js         ← action_display_name, action_record_key
    undoRegistry.js

services/requests/classes/Request.js
    getActionsByConversation(id, { limit: 5 })  ← already exists for H11

services/understanding/search/
    searchMessageForConversation.js           ← H10, H11 phrases

services/decision/decideNextStep.js           ← H12

services/conversation/templates/requestTemplates.js   ← H13 speak
```

---

## Related docs

| Topic | Path |
|-------|------|
| Schema | `doc/database/database.md` · `doc/sql/master_sql.sql` |
| Undo semantics (create/delete) | [architecture/development_undo_feature.md](./architecture/development_undo_feature.md) |
| Pipeline / conversation commands | [architecture/architecture.md](./architecture/architecture.md) |
| Code map | [../README.md](../README.md) |
