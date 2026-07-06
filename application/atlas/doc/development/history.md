# History — MVP complete

**Last reviewed:** 2026-07-05

> **Shipped:** [finished.md](./finished.md) · **Deferred:** [future_work.md](./future_work.md) · **Deep reference:** [architecture/development_undo_feature.md](./architecture/development_undo_feature.md)

**Scope:** `cloudpilot_history` (what CloudPilot **changed**) and listing recent changes in chat/dashboard. Not the same as `list_open` (open workflows) or “recent requests” (future — [future_work.md](./future_work.md#history--undo)).

---

## MVP story (complete)

```text
Scan → Inspect (dashboard) → Change → History → Undo
```

Users can make a change, see what happened, and undo the latest undoable change. That loop is **shipped** for EC2 tag updates, toggle, and create (see finished.md).

---

## What shipped

| Area | Delivered |
|------|-----------|
| **Recording** | `cloudpilot_history` rows on automatic mutations; before/after + `undo_payload` |
| **Undo** | Chat `undo` + `undoRegistry`; latest undoable row per conversation |
| **List history** | `show my recent history` → chat + Navigator table |
| **Dashboard** | **History** table: Change \| Resource \| Status \| Undo \| When |
| **Change column** | Timeline copy (“Changed tag CloudPilot-Test from A to B”) |
| **Undo button** | One button on **newest undoable** row; confirm → same path as chat `undo` |
| **Tag golden path** | Phase T (scan tags) + Phase G (`update_ec2_tag` + restore undo) |
| **Naming** | `action_name`, frozen `action_display_name`, `action_record_key` on history rows |

Full checklist: [finished.md](./finished.md#api--change-history--undo-mvp--2026-07).

---

## Intentionally deferred (not MVP)

Do not block demos on these — see [future_work.md](./future_work.md):

- Delete EC2 **recreate** undo (H8)
- “Show my recent **requests**” (H11)
- Undo an arbitrary history row (H15)
- Full audit / diff UI (H17)
- Saved Actions, chat inspect, tag table polish

---

## Core principle (unchanged)

**History = change tracking and rollback.** The mutation is just the recipe. Same table later powers audit trail and richer UI; undo was the first consumer.

Builders are **resource-oriented** (`historyBuilders/ec2History.js`), not one file per action name.

---

## Code layout (quick map)

```text
services/history/
    classes/History.js              ← insert, getLatestUndoable, listRecent, markReverted
    functions/historyFunctions.js   ← saveHistory, buildHistoryResponse, listRecentHistory
    functions/undoFunctions.js
    historyBuilders/ec2History.js   ← update_ec2_tag (+ toggle/create legacy builders)
    historyNavigatorAdapter.js      ← Change column, undo_enabled, dashboard shape
    undoRegistry.js

Kite/
    NavigatorDataRenderer.js        ← History table, Undo button, tooltips
    DashboardPage.js                  ← undo via chatContext + refresh history
```

---

## Related docs

| Topic | Path |
|-------|------|
| Schema | `doc/sql/master_sql.sql` |
| Undo semantics (create/delete) | [architecture/development_undo_feature.md](./architecture/development_undo_feature.md) |
| Pipeline / conversation commands | [architecture/architecture.md](./architecture/architecture.md) |
| Billing (separate read-only feature) | [billing.md](./billing.md) |
| Scan MVP | [scans.md](./scans.md) |
| Platform backlog | [To_do.md](./To_do.md) |

---

## Product flow (where History sits)

```text
Billing     → Where is my money going?   (see billing.md — B1 shipped)
Inventory   → What do I have?
Scan        → What should I fix?
Change      → Fix it.
History     → What changed?              (MVP complete — history.md)
```

**Deferred / polish:** [future_work.md](./future_work.md)
