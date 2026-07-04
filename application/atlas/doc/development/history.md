# History & Requests — To Do

**Last reviewed:** 2026-07-03 (Phase T + G golden path verified; tag inspect UX polish backlog)

> **Shipped (H0–H7, H9–H14, naming):** [finished.md](./finished.md) · **Deep reference:** [architecture/development_undo_feature.md](./architecture/development_undo_feature.md) · **Main backlog:** [To_do.md](./To_do.md)

**Scope:** `cloudpilot_history` (what CloudPilot **changed**) and listing **recent requests** (`cloudpilot_requests`). Not the same as `list_open` (open workflows only).

---

## Core principle

**History = change tracking and rollback. The mutation is just the recipe.**

Every change has the same lifecycle:

```text
Scan
↓
Find resource
↓
Inspect
↓
Change (mutation)
↓
History
↓
Undo
```

History is **not** “the EC2 undo feature.” It is the framework for representing and reversing **any** cloud change. The mutation is pluggable:

| Today | Tomorrow | Later |
|-------|----------|-------|
| `update_ec2_tag` | `resize_ec2`, `update_s3_tag` | `update_s3_bucket_policy`, `terraform_pr` |

Nothing in the History engine changes — only the mutation recipe and its undo payload.

**Undo is not the product.** Undo is the first consumer of Change History. Same table later powers: audit trail, diffs, version restore, change UI.

---

## Change categories (by operational impact)

Categorize by **risk / operational impact**, not by “metadata vs infrastructure.” Updating an IAM or S3 bucket policy is metadata but can break production.

| Category | Role | Examples |
|----------|------|----------|
| **Safe changes** | Build and demo History/Undo with almost no operational risk | `update_ec2_tag`, `update_s3_tag`, rename-style updates |
| **Operational changes** | Same history engine; higher impact | `toggle_ec2`, `resize_ec2`, security groups, CFN/TF apply |

Both are first-class. Safe changes are the **golden path** while the framework hardens. Operational changes already proved the pipeline (`toggle_ec2`, `create_ec2`) and stay supported — they are not demoted.

---

## Product UX model

```text
Scan → Find → Inspect → Change → History → Undo
```

Not a separate Tag Manager. Enrich scan results; users discover a resource, inspect metadata, make a small change, then use History/Undo — all in one workflow.

**Milestone (end-to-end):**

```text
Scan EC2
↓
Tags: 5 (click)
↓
See CloudPilot-Test = A
↓
Update tag → B
↓
History
↓
Undo → A
```

---

## Phase T — Tag discovery (dashboard only; before Phase G)

Prerequisite for a natural golden path. **No chat inspection yet** — that is a separate problem (remembering scan results + inspect intents). Dashboard is enough for the first complete story.

### T1 — Scan includes tags

Atlas already returns `instance.tags`. Formatter keeps the full set as an array (not only `cloudpilot-role`):

```json
{
  "instanceID": "i-065…",
  "name": "Kite-env",
  "state": "running",
  "tags": [
    { "key": "Name", "value": "Kite-env" },
    { "key": "cloudpilot-role", "value": "primary" },
    { "key": "CloudPilot-Test", "value": "A" }
  ]
}
```

Still derive `role` from tags for the Role column. No new AWS calls.

**Touch:** `atlasEC2Formatter.js` (+ Atlas test mocks if tags are omitted).

### T2 — Instances table: Tags = count (clickable)

| Name | Instance ID | … | Role | **Tags** |
|------|-------------|---|------|----------|
| Kite-env | i-065… | … | primary | **5** |

- Cell value = `tags.length` (or `0`)
- Count is **clickable** — do not dump all keys in the main table
- Row carries full `tags` so click needs no extra AWS call

**Touch:** `atlasEC2ScanNavigatorAdapter.js` + **Kite** (open detail on click).

### T3 — Click → key/value detail table

| Tag Key | Value | Actions |
|---------|-------|---------|
| Name | Kite-env | *(empty for now)* |
| cloudpilot-role | primary | |
| CloudPilot-Test | A | |

Rules:

- First column is **Tag Key**, not Name (AWS tags are key/value pairs)
- **Actions** column exists now (empty) so Update later is seamless — do not implement edit yet
- Detail context includes `instance_id`, `region`, `name` for future `update_ec2_tag`

**Shared builder (not tag-specific):**

```text
buildKeyValueTable([{ key, value }, …])
→ columns: Key | Value | Actions
```

Today: EC2 tags. Tomorrow: S3/IAM tags, env vars, Parameter Store, headers, metadata — same builder.

**Touch:** navigator helpers (e.g. `navigatorFunctions` or small shared adapter) + Kite detail view.

### Phase T checklist

- [x] **T1** — Scan model includes `tags[]` on each instance
- [x] **T2** — Tags count column on EC2 instances table (clickable)
- [x] **T3** — Click → Tag Key \| Value \| Actions via `buildKeyValueTable` (Actions empty)

**Exit criteria:** After scan EC2, user can click Tags count and see all tag key/value pairs for that instance. ✅ Verified (2026-07-03).

### Tag inspect UX polish (future — after Phase G)

Dashboard tag detail works as the **inspection view** that complements chat (not a dashboard replacing chat). Keep that balance.

**What works (keep):**

- Tags count → click → detail table is natural
- Tag Key / Value clearer than cramming tags into the main EC2 table
- Empty **Actions** column reserves space for Update later without redesign
- Title **"Tags — Kite-env"** gives good context

**Improvements (do not implement yet):**

- [ ] **Sort CloudPilot tags first** — surface `CloudPilot-*`, `cloudpilot-*`, `Name` above AWS-generated keys (`aws:*`, `elasticbeanstalk:*`, `aws:cloudformation:*`). Optional separator row e.g. `--- AWS Tags ---`
- [ ] **Wrap or truncate long values** — CloudFormation ARNs dominate the table; wrap nicely or truncate with `…` and click to copy/expand
- [ ] **Actions column affordance** — before edit exists, show subtle `Coming Soon` or disabled `Update` so the column purpose is obvious
- [ ] **Soft-fill from last scan** — missing-field examples use real `region` / `instance_id` from last scan in conversation (examples only; not auto-`collected`)

**Golden path demo (end-to-end story):**

```text
Scan EC2
    ↓
See "Tags: 12"
    ↓
Click
    ↓
CloudPilot-Test = B
    ↓
Update to A (chat: update_ec2_tag)
    ↓
History
    ↓
Undo
    ↓
CloudPilot-Test = B
```

### Deferred — chat inspection (not Phase T)

Do **not** build yet:

- `tags_name` / `tags_resource_id` special fields
- Resolve tags from “last scan results” in conversation

Those mix tag discovery with conversation memory. Dashboard already covers inspect.

**Later (after Phase G is solid):** natural-language **inspect** intent, not special fields:

```text
intent = inspect_ec2_tags
collected: { resource_name: "Kite-env" }  or  { instance_id: "i-065…" }
```

Phrases: “Show me the tags for Kite-env”, “What tags does Kite-env have?” Same pattern later for security groups, volumes, ENIs, etc. — all **inspect** intents.

---

## Canonical example: `update_ec2_tag` (golden path)

**After Phase T.** Smallest safe mutation that proves the full architecture:

```text
User → Navigator → Atlas → AWS Update Tag → History → Undo
```

No instance stop/start, no downtime, no cost, instant.

Chat is enough to drive the mutation (no chat inspect required):

```text
Update CloudPilot-Test to B
Update tag CloudPilot-Test on Kite-env
```

### Action design

- **`action_name`:** `update_ec2_tag` (generic — not tied to one key)
- **Default tag key in development:** `CloudPilot-Test` (demo default only; user can pass `Environment`, `Owner`, `Project`, etc.)
- **Fields (MVP):** `region`, `instance_id`, `tag_key` (default `CloudPilot-Test`), `tag_value`

### Store only what changed

Do **not** snapshot every tag on the instance. Store only keys CloudPilot touched:

```json
{
  "before": { "CloudPilot-Test": "A" },
  "after": { "CloudPilot-Test": "B" }
}
```

If the key was absent before:

```json
{
  "before": {},
  "after": { "CloudPilot-Test": "A" }
}
```

### Undo payload = desired end state

Payload describes **what should exist after undo**, not a procedure flag.

Tag existed before (restore value):

```json
{
  "type": "restore_ec2_tag",
  "instance_id": "i-123",
  "region": "us-west-2",
  "tag_key": "CloudPilot-Test",
  "tag_exists": true,
  "tag_value": "A"
}
```

Tag was missing before (remove key):

```json
{
  "type": "restore_ec2_tag",
  "instance_id": "i-123",
  "region": "us-west-2",
  "tag_key": "CloudPilot-Test",
  "tag_exists": false
}
```

Undo handler:

```text
tag_exists?
  yes → write tag_key = tag_value
  no  → delete tag_key
```

### Three-state matrix

| Before | After | Undo |
|--------|-------|------|
| missing | `A` | delete tag |
| `A` | `B` | set tag to `A` |
| failed update | — | history row, `undo_available = 0` |

### Golden path demo

```text
Scan EC2
↓
Tags: 5 (click) — Phase T
↓
See CloudPilot-Test = A
↓
Update CloudPilot-Test tag (update_ec2_tag) — Phase G
↓
History row (before/after + undo_payload)
↓
Undo
↓
Tag restored or removed
```

Once this is rock solid, other mutations are “another recipe”: `update_s3_tag`, `toggle_ec2`, `resize_ec2`, PR apply, etc.

---

## History builders (resource-oriented)

Builders understand the **resource type**, not every individual action.

**Do not** add `updateEc2TagHistory.js`. Prefer:

```text
history/
    historyBuilders/
        ec2History.js      ← EC2 mutations (tag today; toggle/resize/create later)
        s3History.js       ← later
        iamHistory.js      ← later
```

Today `ec2History.js` builds history for `update_ec2_tag`. Later the same module can branch on `action_name` for `toggle_ec2`, `resize_ec2`, `create_ec2`, etc. — same history object shape.

**Existing files** (`toggleEc2History.js`, `createEc2History.js`) stay until folded into `ec2History.js` (optional cleanup, not blocking). New work goes through the resource-oriented builder.

**History row shape is shared.** Only `action_name`, `target_*`, `resource_state_*`, and `undo_payload` differ per recipe.

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

### Phase T — Tag discovery (dashboard; do this first)

- [x] **T1** — Scan includes `tags[]` on each instance
- [x] **T2** — Tags count column (clickable)
- [x] **T3** — Click → Tag Key \| Value \| Actions via `buildKeyValueTable` (Actions empty)

**Exit criteria:** Scan → click Tags count → see key/value pairs. No chat inspect. ✅

**Polish (future):** sort CloudPilot tags first; truncate long values; Actions affordance; soft-fill from last scan — see [Tag inspect UX polish](#tag-inspect-ux-polish-future--after-phase-g).

### Phase G — Golden path: `update_ec2_tag` (after Phase T)

Safe change that proves History end-to-end. Prefer this over new operational recipes (H8, etc.) until solid. Chat can drive the update; dashboard already covers inspect.

- [x] **G1** — Catalog + understanding — seed `update_ec2_tag` action; phrases (`update ec2 tag`, `update CloudPilot-Test to B`, …)
- [x] **G2** — Fields — collect `region`, `instance_id`, `tag_key` (default `CloudPilot-Test`), `tag_value`
- [x] **G3** — Capability / Atlas — get current tag value; set tag; delete tag (for undo when `tag_exists: false`)
- [x] **G4** — Automatic execution — STEP 6 runs `update_ec2_tag` like other mutations
- [x] **G5** — History builder — `historyBuilders/ec2History.js` for `update_ec2_tag` (touched keys only in before/after)
- [x] **G6** — `saveHistory` on success and failure (`failed` → `undo_available = 0`)
- [x] **G7** — Undo payload — `restore_ec2_tag` with `tag_exists` + optional `tag_value` (desired end state)
- [x] **G8** — `undoRegistry` — handler: exists → write value; missing → delete key; undo row `undo_update_ec2_tag`
- [x] **G9** — E2E — scan → click tags → update tag → list history → undo → tag restored/removed
- [ ] **G10** — Docs — note in [finished.md](./finished.md) when G1–G9 ship; optional fold of `toggleEc2History` / `createEc2History` into `ec2History.js`

**Exit criteria:** Full milestone — scan → inspect (dashboard) → update → history → undo — without touching instance power state. ✅ Core path verified (2026-07-03).

### Phase 1 — Finish recording & undo (operational — already mostly shipped)

- [x] **H5** — Failed toggle → `cloudpilot_history` row (`history_status = failed`, `undo_available = 0`)
- [x] **H6** — API `undoAvailable` hint on `POST /message` response _(Kite UI still open)_
- [x] **H7** — `create_ec2` history + undo (delete created instance)
- [ ] **H8** — `delete_ec2` history + recreate undo (new instance from `resource_state_before`) — **defer until after Phase G**
- [ ] **Atlas** — Toggle response includes before/after states (preferred for `saveHistory`)
- [ ] **Atlas** — Delete response / preflight includes metadata for recreate (name, instance_type, tags, region)
- [ ] **Atlas** — Test mocks include state fields for toggle; recreate fields for delete
- [ ] **Kite** — Show “Undo available” when `undoAvailable: true`
- [ ] **Kite** — Undo button / “undo last change” (not toggle-specific)

### Phase 2 — Show recent history & requests (chat commands)

- [x] **H9** — `History.listRecentHistoryByConversation()` — **Method A4**, limit **5**
- [x] **H10** — Understanding — **list_history** phrases
- [ ] **H11** — Understanding — **recent requests** phrases → `list_recent_requests`
- [x] **H12** — `decideNextStep` — `LIST_HISTORY` conversation command
- [x] **H13** — Speak — chat message + Navigator table (`buildHistoryResponse`)
- [x] **H14** — Navigator history table — **Action Name** column uses `action_display_name`
- [ ] **Kite** — Verify Dashboard renders history table; recent-requests table (blocked on H11)

### Phase 3 — Later

- [ ] **H15** — Targeted undo — `undo change #3` / `undo update_ec2_tag` (not only latest)
- [ ] **H16** — More EC2 recipes in `ec2History.js` (e.g. `delete_ec2` recreate) — **not** one tiny builder file per action
- [ ] **H17** — Change history UI — full audit trail, diffs, version restore
- [ ] **H18** — Other safe recipes — `update_s3_tag`, `update_iam_tag`, … (same pattern, resource builders)
- [ ] **T4** — Chat inspect — `intent = inspect_ec2_tags` with `resource_name` or `instance_id` (natural language; **not** `tags_name` / `tags_resource_id`). After Phase G only.
- [ ] **T5** — More inspect intents — security groups, volumes, ENIs, etc.
- [ ] **T6** — Tag detail polish — CloudPilot tags first; long-value wrap/truncate; Actions `Coming Soon` / disabled Update — see [Tag inspect UX polish](#tag-inspect-ux-polish-future--after-phase-g)
- [ ] **T7** — Soft-fill field examples from last scan (region / instance_id) — examples only, not auto-collected
- [ ] **H19** — **Saved Actions** — named reusable operations (structured `action` + `parameters` + `display_name`; `run Kite Security Scan`; not “macros”). Complements History/Undo — see [To_do.md](./To_do.md)

---

## Full description

### What we are building

**CloudPilot Change History** (`cloudpilot_history`) records every mutating action — what changed, before/after, whether undo is available. **Undo** is the first consumer; **list recent history** is the second.

The mutation is pluggable. History does not care whether the recipe is a tag update or an instance toggle — only that `resource_state_before` / `resource_state_after` and `undo_payload` (desired end state) are reliable.

**Future product trio** (with [Saved Actions](./To_do.md#api--saved-actions-future) — do not implement yet):

| Concept | Role |
|---------|------|
| **Saved Actions** | Reusable operations (things users do often) — store structured request, not chat text |
| **History** | Completed operations (things already done) |
| **Undo** | Reverse a completed change |

```text
Saved Actions → Run "Toggle Backup" → History → Undo
```

Terminology: prefer **Saved Actions**, not “macros.”

**Recent requests** is a sibling feature: show the last few **request rows** (`cloudpilot_requests`) — what the user asked CloudPilot to do — whether or not a history row exists (e.g. scan still in progress, or failed before mutation).

| User says | Data source | Today |
|-----------|-------------|--------|
| “list open actions” / `list_open` | Open `cloudpilot_requests` only | ✅ shipped |
| “undo” | Latest undoable `cloudpilot_history` row | ✅ shipped (toggle; **next:** tag) |
| “show my recent **history**” | Last 5 `cloudpilot_history` rows | ✅ shipped (H9–H14) |
| “show my recent **requests**” | Last 5 `cloudpilot_requests` rows | ❌ H11–H13 |

---

### Phase T — Tag discovery plan (dashboard)

Implement **before** Phase G. Read-only; no mutation, no history rows.

| Step | Work | Notes |
|------|------|-------|
| **T1** | Formatter keeps `tags[]` | Atlas already has tags; stop dropping them |
| **T2** | Tags count column | Clickable; value = `tags.length` |
| **T3** | Detail table | `buildKeyValueTable` → Tag Key \| Value \| Actions (empty) |

**Do not:** chat inspect; `tags_name` / `tags_resource_id`; resolve from conversation scan memory; `buildEc2TagsTable` (use generic key/value builder).

**Kite:** click Tags count → open key/value detail. API supplies tags on the instance row / detail payload.

---

### Phase G — Golden path plan (`update_ec2_tag`)

Implement **after** Phase T. Reuse existing pipeline: STEP 6 → capability → `saveHistory` (STEP 6B) → `undoRegistry`. Do not invent a second history path.

| Step | Work | Notes |
|------|------|-------|
| **G1** | Action catalog + phrases | `cloudpilot_actions` row; understanding maps chat → `update_ec2_tag` |
| **G2** | Field collection | `region`, `instance_id`, `tag_key` (default `CloudPilot-Test`), `tag_value` |
| **G3** | Atlas / capability | Read tag (or missing); put tag; delete tag |
| **G4** | Automatic mode | Same delivery path as toggle/create |
| **G5** | `ec2History.js` | Build `target_*`, before/after (**touched keys only**), `undo_payload` |
| **G6** | Success + failure history | Failed → `history_status = failed`, `undo_available = 0` |
| **G7–G8** | Undo | `restore_ec2_tag` desired end state; register in `undoRegistry.js` |
| **G9** | Manual E2E | Scan → click tags → update tag → history → undo |
| **G10** | Cleanup / docs | Optional merge of older EC2 builders into `ec2History.js` |

**Touch points:** `actionMap` / actions seed, understanding search, EC2 capability (or Atlas tag endpoints), `executionFunctions.js` (STEP 6B), `history/historyBuilders/ec2History.js`, `undoRegistry.js`, request naming defaults.

**Do not:** name builders after tags; store full tag maps in history; use `delete_if_missing` — use `tag_exists` + `tag_value`.

---

### Phase 1 — Finish recording & undo (operational)

**Shipped:** H0 schema, H1 save on toggle success, H2 undoable log, H4 full undo vertical slice, **H5–H7 Phase 1A**, request/history naming, **H9–H14 list history**.

| Task | Notes |
|------|-------|
| **H5** | On failed toggle (Atlas error or handler failure), still `INSERT` history — `history_status = failed`, `undo_available = 0` |
| **H6** | Response field e.g. `undoAvailable: true` when latest row qualifies — Kite can show affordance without parsing message text |
| **H7** | After `create_ec2` automatic success — history builder + `undo_create_ec2` (delete instance) |
| **H8** | Before `delete_ec2` — capture `resource_state_before`; undo = **recreate** new instance (honest UX). **After Phase G.** |
| **Atlas** | Rich before/after on toggle; delete preflight returns name, type, tags, region for recreate |
| **Kite** | Undo chip/button after H6 — label as undo **change**, not toggle-only |

**Touch points:** `executionFunctions.js` (STEP 6B), `history/historyBuilders/`, `history/classes/History.js`, `undoRegistry.js`, handlers.

**Exit criteria (operational):** Success and failure both recorded for toggle; create/delete history + undo recipes wired; Kite shows undo when available.

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
- **H16** — More recipes inside resource builders (`ec2History.js`, later `s3History.js`) — not one file per action
- **H17** — Full change-history product UI
- **H18** — More safe changes (`update_s3_tag`, …) once Phase G is solid
- **T4** — Chat inspect (`inspect_ec2_tags` intent; natural language; no special `tags_*` fields)
- **T5** — More inspect intents (security groups, volumes, …)

---

## Code layout (target)

```text
services/actions/ec2/scanEC2/
    atlasEC2Formatter.js                      ← T1: keep tags[]
    atlasEC2ScanNavigatorAdapter.js           ← T2: Tags count column

services/navigator/functions/
    navigatorFunctions.js                     ← T3: buildKeyValueTable (Key | Value | Actions)

services/history/
    classes/History.js
        Method A1  insertHistoryRow
        Method A2  getLatestUndoableRow
        Method A3  markHistoryReverted
        Method A4  listRecentByConversation   ← H9
    functions/
        historyFunctions.js                   ← listRecentHistory, buildHistoryResponse, saveHistory
        undoFunctions.js
        historyActionNameFunctions.js         ← action_display_name, action_record_key
    historyBuilders/
        ec2History.js                         ← Phase G (update_ec2_tag; later other EC2 recipes)
        toggleEc2History.js                   ← existing; optional fold into ec2History.js
        createEc2History.js                   ← H7; optional fold into ec2History.js
        s3History.js                          ← later (H18)
    historyNavigatorAdapter.js
    undoRegistry.js                           ← restore_ec2_tag (G8), toggle_ec2_restore, delete_ec2_undo, …

services/requests/classes/Request.js
    getActionsByConversation(id, { limit: 5 })  ← already exists for H11

services/understanding/search/
    searchMessageForConversation.js           ← H10, H11, G1 phrases; T4 later (inspect)

services/decision/decideNextStep.js           ← H12

services/conversation/templates/requestTemplates.js   ← H13 speak

Kite (Dashboard)
    Click Tags count → key/value detail table   ← T2 / T3
```

---

## Related docs

| Topic | Path |
|-------|------|
| Schema | `doc/database/database.md` · `doc/sql/master_sql.sql` |
| Undo semantics (create/delete) | [architecture/development_undo_feature.md](./architecture/development_undo_feature.md) |
| Pipeline / conversation commands | [architecture/architecture.md](./architecture/architecture.md) |
| Tagging metadata (create defaults) | [../../../../doc/instructions/cloudpilot_tagging_metadata.md](../../../../doc/instructions/cloudpilot_tagging_metadata.md) |
| Code map | [../README.md](../README.md) |
