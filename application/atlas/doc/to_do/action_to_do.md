# Action / Workflow — To Do Plan

**Purpose:** Next chunk of work after EC2 mutations API wiring — durable workflows, human-friendly naming, open-actions UX, and conversational run/confirm (not command-line disambiguation until truly needed).

**Status:** P0 + P1C implemented — restart hydration live; P1D (DB-only) next

**Last reviewed:** 2026-06-01 (review: defer `action_name`, England rule, DB-first order, open-actions table + Run Now row)

**Related:**

- `doc/Master_Database.md` — schema, `Actions.js`, resolution rules
- `doc/MASTER_TODO.md` — EC2 mutations + Navigator
- `application/atlas/functions/classes/Actions.js` — already exists (write path partial)
- `application/atlas/state/ActionState.js` — in-memory mock to replace

---

## Goal (one sentence)

Move from in-memory `ActionState` to **MySQL workflow records**, give every open action a **`display_name`**, show open actions on dashboard + chat (with **Run Now** buttons later), and keep chat **conversational** — bare `4` and bare `yes` work when context is clear.

---

## Phase 1 vs Phase 2 (conscious split)

This is the main architectural decision — **do not solve multi-workflow orchestration before MySQL replaces `ActionState`.**

| | **Phase 1 (MVP)** | **Phase 2 (later)** |
|---|-------------------|---------------------|
| Open workflows per conversation | **One** (`is_open = 1`) | Many concurrent |
| User identifiers | **`id` + `display_name`** | + optional slug / fuzzy match |
| Run / confirm | Bare **`4`** and bare **`yes`** OK | Disambiguation when ambiguous |
| Disambiguation | **`focused_workflow_id`** + England rule | `run 1`, `run toggle ec2`, pick-from-list |
| `action_name` slug | **Deferred** — not needed yet | Maybe, if lots of workflows |

```text
Phase 1: One open workflow · bare yes works · DB is truth
Phase 2: Multiple workflows · names / disambiguation when ambiguity exists
```

---

## Naming (MVP: `display_name` only)

### What MVP needs

| Field | Example | Purpose |
|-------|---------|---------|
| **`id`** | `17` | Stable row id — `run 1` in Phase 2 |
| **`display_name`** | `Toggle EC2 Lab Environment` | Human label in chat, dashboard, prompts |
| **`action_type`** | `toggle_ec2` | Registry kind (machine) |

### What we defer: `action_name` slug

Previously planned: `action_name = toggle_lab` for `yes toggle_lab`.

**Decision:** Wait on `action_name` for MVP. It adds little until many workflows exist. Feels command-line; CloudPilot should feel **conversational**.

- Column may exist in schema — leave **NULL** or ignore in Phase 1
- Phase 2 disambiguation: **`run 1`**, **`run toggle ec2`**, partial **`display_name`** match — no slug required

Example row (MVP):

```json
{
  "id": 17,
  "action_type": "toggle_ec2",
  "display_name": "Toggle EC2 Lab Environment",
  "status": "waiting_on_confirmation",
  "execution_mode": "automatic",
  "is_open": 1
}
```

### When `display_name` is set

| When | Behavior |
|------|----------|
| **User starts action** | Auto from registry `actionLabel` + context, e.g. `Toggle EC2 Lab Environment` |
| **User renames (later)** | “Call this Nightly Cost Savings” → update `display_name` |

### Schema (plan)

```sql
ALTER TABLE cloudpilot_workflows
  ADD COLUMN display_name VARCHAR(255) NULL;
```

(`action_name` column optional / unused in Phase 1.)

---

## User-friendly status (not everything “pending”)

Add **`status`** values (or a derived **`status_label`**) that tell the user what CloudPilot needs:

| Status | Meaning | Example copy |
|--------|---------|--------------|
| `waiting_on_fields` | Missing collected fields | “Waiting on bucket name” |
| `waiting_on_execution_mode` | Fields done; need 1–4 | “Choose how to run” |
| `waiting_on_confirmation` | Ready; need yes | “Waiting on confirmation” |
| `running` | Atlas executing | “In progress” |
| `completed` / `failed` / `cancelled` | Closed (`is_open = 0`) | History |

Optional umbrella: **`attention_required`** = any open status where user must act.

Dashboard + “show open actions” should show **`waiting_on_confirmation`**, not raw `ready`.

---

## Work stream 1 — Database instead of mock state (DO FIRST)

**Biggest risk today:**

```text
restart server → lose workflow
```

Remove that before naming, UX polish, or open-actions table.

**Today:**

```text
processMessage → ActionState (in-memory Map) → optional write sync to DB
```

**Target:**

```text
processMessage → Actions.js (MySQL read + write) → ActionState removed
```

### Tasks

| Task | Detail |
|------|--------|
| **1.1 Read path** | Orchestration reads from `Actions.getOpenActionForConversation` — not Map |
| **1.2 Write path** | All field/status/mode updates → `Actions.updateAction` |
| **1.3 Single source of truth** | No dual Map + sync |
| **1.4 Remove ActionState** | Shim only during migration, then delete |
| **1.5 Env flag** | `CLOUDPILOT_STATE_BACKEND=memory` for e2e only |

### MVP policy

**One open workflow per conversation** — matches today; keeps England rule simple.

### Exit criteria

- Restart Node mid-flow → workflow survives; chat continues
- Same create/delete/toggle scripts work

---

## Work stream 2 — `display_name` + `focused_workflow_id`

### `display_name`

- Set on `createAction` from registry label + light context
- Include in **every** CloudPilot prompt while that workflow is focused

### `focused_workflow_id` (important — before disambiguation logic)

Track which workflow the conversation is “about”:

```text
User: create an EC2 instance
... conversation ...
User: region us-west-2
User: 4
User: yes
```

Even if another workflow row exists in history, the user is obviously on the EC2 create — **England rule**.

**Plan:**

- Set `focused_workflow_id` when user starts or updates a workflow
- Bare `4` / `yes` apply to **focused** workflow, not “newest row” guessing
- Store: in-memory on request context first, or column `focused_workflow_id` on conversation (later)

**Do focused workflow before building complicated multi-match disambiguation.**

---

## Work stream 3 — Conversational UX (England rule)

**Strongest part of the plan — fight to keep it.**

CloudPilot should feel conversational, not Jira/ServiceNow.

### Natural (Phase 1 — target)

```text
User: 4

CloudPilot:
Execution mode set to automatic for "Toggle EC2 Lab Environment".
Would you like me to execute this action?

User: yes
```

### Avoid for MVP (command-line feel)

```text
User: yes toggle_lab
```

Only require extra tokens when **ambiguity actually exists** (Phase 2, multiple open).

### Rules

| Rule | Phase 1 | Phase 2 |
|------|---------|---------|
| Show **`display_name`** in ready/confirm/mode prompts | Always (focused workflow) | Always |
| Bare **`4`** | OK if focused workflow | OK if focused; else disambiguate |
| Bare **`yes`** | OK if focused workflow | OK if focused; else disambiguate |
| Extra disambiguation | Not needed (one open) | `run 1`, `run toggle ec2`, pick from list |

### Example ready copy

```text
Everything is ready for "Toggle EC2 Lab Environment".
Execution mode: automatic
Would you like me to execute this action?
```

Not: “Everything is ready for the EC2 toggle” (too generic when multiple actions exist later).

### Exit criteria

- All ready/confirm/mode messages include `display_name`
- Bare `4` and `yes` work with one open + focused workflow

---

## Work stream 4 — Open actions table (dashboard + chat)

High value beyond AWS — foundation for a real **operations platform**.

### User intents

```text
show open actions
what am I waiting on
list my actions
```

### Chat list

```text
Open actions

1. Toggle EC2 Lab Environment
   Type: toggle_ec2
   Status: waiting_on_confirmation
   Mode: automatic

2. Delete Old Bucket
   Type: delete_s3
   Status: waiting_on_bucket_name
```

(Phase 1: usually 0 or 1 item.)

### Kite dashboard — Navigator table

Table id: `open_actions`. Columns (plan):

| display_name | action_type | status | missing | run |
|--------------|-------------|--------|---------|-----|

**Run Now row (placeholder for MVP UI):**

Add an **extra trailing row** in the table payload — empty data row labeled **Run Now**, with **`run`** column (and optionally others) set to render as **`button`** via column metadata (`cellType: "button"` when Kite supports it).

Example shape (conceptual):

```json
{
  "id": "open_actions",
  "view_type": "table",
  "title": "Open Actions",
  "columns": [
    { "key": "display_name", "label": "Action", "type": "text" },
    { "key": "action_type", "label": "Type", "type": "text" },
    { "key": "status", "label": "Status", "type": "status" },
    { "key": "missing", "label": "Needs", "type": "text" },
    { "key": "run", "label": "Run", "type": "button" }
  ],
  "rows": [
    {
      "row_id": "17",
      "display_name": "Toggle EC2 Lab Environment",
      "action_type": "toggle_ec2",
      "status": "waiting_on_confirmation",
      "missing": "confirmation",
      "run": "Run"
    },
    {
      "row_id": "open_actions_run_now",
      "display_name": "Run Now",
      "action_type": "",
      "status": "",
      "missing": "",
      "run": "button"
    }
  ]
}
```

**Phase 1:** buttons are visual placeholders — click handler wired later.  
**Phase 2:** Run triggers confirm flow for that `row_id` / workflow.

Future table vision:

| Action | Status |
|--------|--------|
| Toggle EC2 Lab Environment | waiting_on_confirmation |
| Investigate RDS Cost Spike | waiting_on_fields |
| Create S3 Lifecycle Policy | running |

### API placement

Navigator `tables[]` inside `navigatorResponse.data` (see MASTER_TODO Part 2).

### Exit criteria

- Intent → chat summary + dashboard table
- Table includes Run Now placeholder row with button column metadata
- List alone does not execute AWS (Run wired later)

---

## Phase 2 — Multi-open + disambiguation (later)

Only after Phase 1 stable.

| Feature | Approach |
|---------|----------|
| Multiple `is_open = 1` rows | Relax one-open constraint |
| Disambiguation | **`run 1`**, **`run toggle ec2`**, fuzzy **`display_name`** — not slug-first |
| Optional `action_name` slug | Only if display matching insufficient |
| Named confirm | Only when bare `yes` matches 0 or 2+ workflows |

---

## Suggested implementation order

```text
1. Database — MySQL replaces ActionState (remove restart risk)
2. display_name + focused_workflow_id + user-friendly status labels
3. UX — England rule copy; bare 4 / bare yes
4. Open actions — chat list + dashboard table + Run Now placeholder row
5. Phase 2 — multi-open, disambiguation, Run button behavior, optional action_name
```

**Do not** block step 1 on naming or open-actions UI.

---

## Implementation phases (small, testable slices)

You already have a **hybrid** today: `Actions.createAction` on new intent + `syncOpenWorkflowRowFromMemory` after memory updates. Reads still come from `ActionState` Map. These phases finish the flip **without a big-bang rewrite**.

Each phase has: **change → how to test → rollback if broken**.

### Phase 0 — Schema ready (no app behavior change)

**Change:**

- Confirm `cloudpilot_workflows` exists (run `doc/sql/cloudpilot_workflows_phase1.sql` if needed)
- Add `display_name` column if missing

**Test:**

```sql
SHOW CREATE TABLE cloudpilot_workflows;
SELECT id, conversation_id, action_type, display_name, status, is_open FROM cloudpilot_workflows LIMIT 5;
```

**Done when:** Table exists; `display_name` column present.

---

### Phase 1A — DB writes on create only (mostly done — verify)

**Change:** New action intent → `Actions.createAction` (already wired). Confirm row appears in MySQL.

**Test:**

1. Chat: `Create an ec2 instance`
2. Query DB: one row, `is_open = 1`, `action_type = create_ec2`

**Done when:** Row created on intent; no duplicate open rows for same conversation.

---

### Phase 1B — DB writes on every update (verify sync)

**Change:** After field/status/mode updates, `syncOpenWorkflowRowFromMemory` pushes to DB (already called in several places). Verify all update paths call sync.

**Test:**

1. Start create → send `region: "us-west-2"`
2. Query DB: `collected` JSON has region; `missing` array shrinks

**Done when:** DB row matches memory after each message turn.

---

### Phase 1C — Read from DB on load (the big flip — part 1)

**Change:** Add helper `loadWorkflowForConversation(conversationId)` that:

1. Calls `Actions.getOpenActionForConversation`
2. Maps DB row → same shape as `getActionStatus()` today
3. If row exists and memory is empty (e.g. after restart), **hydrate** orchestration from DB

**Test (the killer test):**

1. Start create → send region + name fields
2. **Restart Node**
3. Send next missing field or `4`
4. CloudPilot continues without “start over”

**Done when:** Restart mid-flow works using DB row alone.

**Rollback:** Feature flag `CLOUDPILOT_STATE_BACKEND=memory` skips DB read.

---

### Phase 1D — DB as source of truth (remove dual write)

**Change:**

- Replace `actionState.setField` / `setStatus` / `setExecutionMode` / `markAsked` with `Actions.updateAction` (or thin wrapper)
- Remove `syncOpenWorkflowRowFromMemory` — no memory-then-sync
- `getActionStatus` reads DB only (or delete and use `Actions` everywhere)

**Test:**

1. Full create flow: intent → fields → `4` → `yes` → instance created
2. Full delete flow same way
3. Restart mid-flow still works (Phase 1C test)

**Done when:** No `ActionState` Map updates on hot path; delete or gate `ActionState.js`.

---

### Phase 2A — `display_name` on create

**Change:**

- On `createAction`, set `display_name` from `actionRegistry[actionType].actionLabel` (optionally + context later)
- Migration already applied in Phase 0

**Test:**

1. Start toggle → query DB: `display_name` = e.g. `Toggle EC2`
2. No change to chat behavior yet

**Done when:** Every new row has non-null `display_name`.

---

### Phase 2B — User-friendly `status` values

**Change:** Map internal transitions to clearer statuses:

- missing fields → `waiting_on_fields`
- all fields, no mode → `waiting_on_execution_mode`
- ready for confirm → `waiting_on_confirmation`
- executing → `running`
- finish → `completed` / `failed`, `is_open = 0`

**Test:**

1. Walk create through each step; query DB `status` after each message
2. Status matches what user would understand

**Done when:** Dashboard/chat can show status without translating `ready` → English.

---

### Phase 2C — `focused_workflow_id` (in-process)

**Change:** In `processMessage`, track `focusedWorkflowId` = open row id being updated this turn. Bare `4` / `yes` target focused row.

**Test:**

1. Single open workflow — unchanged behavior
2. (Optional) Log focused id each turn for debugging

**Done when:** Execution mode + confirm always attach to focused workflow id, not guessed from memory keys.

---

### Phase 3A — England rule copy (chat only)

**Change:** CloudPilotChat ready / mode / confirm messages include `display_name`:

```text
Everything is ready for "Toggle EC2 Lab Environment".
Execution mode: automatic. Would you like me to execute this action?
```

Bare `4` and bare `yes` unchanged.

**Test:**

1. Toggle flow through ready → confirm messages mention display name
2. Bare `4` and `yes` still work

**Done when:** User sees friendly name in every pre-execute prompt.

---

### Phase 3B — “Show open actions” (chat list)

**Change:**

- Intent match: `show open actions`, `what am I waiting on`, etc.
- Handler calls `Actions.getAllOpenActions` + `getMissingActionInfo`
- CloudPilot replies with numbered list (no dashboard yet)

**Test:**

1. Mid-create → `what am I waiting on` → list shows one action, status, missing fields
2. No open row → friendly empty message

**Done when:** Chat-only open-actions works.

---

### Phase 3C — Open actions Navigator table (Kite dashboard)

**Change:**

- Add small adapter: open rows → `navigatorResponse.data.tables[]` with `id: open_actions`
- Columns: display_name, action_type, status, missing, run
- Extra **Run Now** row: `display_name: "Run Now"`, `run: "button"` (placeholder)

**Test:**

1. Same intent as 3B → response includes `tables[0].id === "open_actions"`
2. Kite renders table + button placeholder row
3. Click Run does nothing yet (Phase 2 product)

**Done when:** Dashboard shows open actions table from API.

---

### Phase 4 — Later (not MVP)

- Multi-open workflows per conversation
- `run 1` / fuzzy display_name disambiguation
- Run button wired to confirm + execute
- Optional `action_name` slug

---

### Suggested sprint order

```text
Week-style slices (each shippable):

  P0  Schema
  P1A Verify create → DB
  P1B Verify sync on update
  P1C Read after restart  ← first real win
  P1D DB only, drop memory
  P2A display_name
  P2B status labels
  P2C focused_workflow_id
  P3A England copy
  P3B Chat open-actions list
  P3C Dashboard table + Run Now row
```

**Stop and test after every phase.** Do not start 3C until 1D passes restart test.

---

## Testing plan (manual)

| Test | Expect |
|------|--------|
| Mid-flow API restart | Workflow preserved |
| Ready message | Includes `display_name` |
| User: `4` (one open, focused) | Mode set; conversational reply |
| User: `yes` (one open, focused) | Executes; no slug required |
| `show open actions` | Chat list + table with status labels |
| Dashboard table | Data row + Run Now row with button column |
| Two open (Phase 2) | Bare `yes` → pick list; `run 1` works |

---

## Out of scope (this doc)

- `cloudpilot_executions` / `operation_id` (Master_Database Phase 2)
- Bulk actions (“delete 5 instances”)
- `action_name` slug in Phase 1
- Run button click → execute (placeholder only in Phase 1 table)

---

## Decisions (locked for planning)

| # | Decision | Choice |
|---|----------|--------|
| 1 | `action_name` in MVP? | **No — defer**; `id` + `display_name` enough |
| 2 | Bare `yes` / bare `4`? | **Yes** when focused / one open (England rule) |
| 3 | Implementation order | **Database first**, then names, UX, open actions |
| 4 | Disambiguation style (Phase 2) | **`run 1` / display text** — not slug commands |
| 5 | `focused_workflow_id` | **Before** complex disambiguation |
| 6 | Status labels | **`waiting_on_*`** not generic pending |
| 7 | Open actions table | **Yes** — plus **Run Now** placeholder row |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-01 | Initial plan |
| 2026-06-01 | Review: defer `action_name`; England rule; DB-first order; `focused_workflow_id`; user-friendly status; open-actions table + Run Now button row; Phase 1/2 split |
| 2026-06-01 | Added **Implementation phases** P0–P3C: small testable slices; restart test at 1C |
| 2026-06-01 | **P0 + P1C shipped:** `display_name` schema, `workflowStateFunctions.js`, hydrate on `processMessage` start |
