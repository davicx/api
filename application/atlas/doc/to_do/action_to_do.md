# Action / Workflow — To Do Plan

**Purpose:** Next chunk of work after EC2 mutations API wiring — durable workflows, human-friendly naming, open-actions UX, and conversational run/confirm (not command-line disambiguation until truly needed).

**Status:** Planning only — no implementation in this doc.

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
