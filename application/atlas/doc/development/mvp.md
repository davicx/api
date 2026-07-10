# MVP — One magical vertical slice (EC2)

**Last reviewed:** 2026-07-09

**Status:** Active — all other product work lives in [long_term/](./long_term/).

> **Chat & context (part of this work):** [cloud_pilot_chat.md](./cloud_pilot_chat.md)  
> **Architecture & how-to:** [architecture/architecture.md](./architecture/architecture.md)  
> **Deferred:** [long_term/to_do.md](./long_term/to_do.md) · [long_term/scans.md](./long_term/scans.md) · [long_term/remediations.md](./long_term/remediations.md)

---

## Product reframe (locked)

> **You're not demoing "AWS scanning."**  
> **You're demoing "CloudPilot helping me make a good decision."**

That's the memorable product. Scan is input; **explain → decide → fix → undo** is the show.

**Work now is mostly editing, not building.** Chat, scan, tags, EC2 ops, four execution modes, undo, and context (C1) largely exist. MVP = **curate, hide, and polish copy + dashboard**.

---

## Official demo goal

> A user asks CloudPilot to scan their EC2 instances. CloudPilot identifies **one underutilized instance** and **one missing Team tag**, explains both in plain language, shows estimated savings, lets the user **delete** the unused instance (modes 1–4), then **adds a Team tag** and **undoes** that change — all through a clean conversational interface.

**Story constraint:** Design for **ONE EC2 instance** in the room (`dev-web-server`).

**Two demo beats (different actions, different trust stories):**

| Beat | Action | Why |
|------|--------|-----|
| **Cost fix** | **`delete_ec2`** on underutilized instance | Already shipped; no new stop action. Delete = clear savings story (“remove unused resource”). |
| **History / undo** | **`update_ec2_tag`** (add Team tag) → **undo** | Low risk, reversible, perfect trust demo. **Undo is shown here — not on delete.** |

`toggle_ec2` stays in codebase for two-instance labs; not in first-run demo.

---

## Goal (one sentence)

**Natural chat → one instance, two findings → clean decision UI → pick how to fix (1–4) → undo → cost shown — demoable in three minutes.**

Not: “CloudPilot scans EC2, S3, RDS, IAM…”  
Yes: *“Wow, that was incredibly easy.”*

---

## Milestone filter

Before starting any task, ask:

> Does this make the **3-minute EC2 demo** clearer, or is it platform sprawl?

If sprawl → [long_term/](./long_term/). **Hide, don’t delete.**

---

## What “coming soon” means (hide, not remove)

Keep code; remove from default chat/demo path:

| Hidden for MVP | Still in repo |
|----------------|---------------|
| `scan_s3`, `inventory_aws` (broad), RDS, pipeline scans | Handlers, Atlas routes, docs in `long_term/` |
| Extra EC2 rules (public IP, legacy type, stopped instance, …) | Rule files + registry entries |
| PR remediations (mode 3) | [long_term/remediations.md](./long_term/remediations.md) |
| Multi-open requests UI, capability migration, new service scans | [long_term/to_do.md](./long_term/to_do.md) |
| Full Navigator wall (stats + instances + findings tables) | Adapters stay; MVP shows **decision card** first |

**Product label in chat when user asks for hidden features:** “Coming soon — we’re perfecting EC2 first.”

---

## 3-minute demo script (acceptance test)

Run this end-to-end before calling MVP done. **One instance. Chat leads. Dashboard supports.**

### Beat 1 — Scan

**User:** “Scan my EC2 instances.”

**CloudPilot:** “I found one instance that may be costing you money.” _(then natural-language detail — not rule IDs)_

### Beat 2 — Dashboard (decision card only)

```text
Potential Savings

Estimated Savings          $18/month
Resource                   dev-web-server
Status                     Running

Recommendations

⚠️ Underutilized            Average CPU: 2% (last 7 days)
⚠️ Missing Team tag         Ownership unknown

[Fix it]   [Show AWS details ▼]
```

### Beat 3 — Chat explains (star of the demo)

> I noticed this EC2 instance has averaged about 2% CPU over the past week. If it's no longer needed, deleting it could save approximately $18 per month. I also couldn't determine who owns it because it's missing a **Team** tag — I can add one for you if you'd like.

### Beat 4 — How to fix (show all four — differentiator)

**Cost finding → delete** (underutilized instance):

```text
How would you like to remove this unused instance?

1. Show Instructions
2. Generate CLI
3. Create Pull Request
4. CloudPilot Fix It
```

### Beat 5 — CloudPilot Fix It (mode 4) — delete

> Here's exactly what I'll do:
>
> Delete EC2 instance `dev-web-server`  
> Estimated savings: $18/month  
> This cannot be undone. The instance will be terminated.
>
> _(Confirm before execute.)_

### Beat 6 — Tag + undo (history demo — separate beat)

After scan (or on a second instance), CloudPilot asks:

> Would you like me to add a Team tag? Platform / Backend / Frontend / DevOps

**User:** approves → `update_ec2_tag` runs → history saved.

**User:** “Undo last change.”

**CloudPilot:** “Restored previous tag configuration.”

**This is where undo is demoed** — not on delete.

### Also verify

1. **Empty account:** friendly empty message — not Atlas error, not a finding wall.
2. **Full loop:** create instance → scan → delete underutilized (or delete demo instance) → create again → scan → add Team tag → undo tag.
3. **Teardown:** delete any remaining test instances.

Someone should walk away saying: *“I wish AWS worked like that.”*

---

## Recommended order of work

Do these **in sequence**. Each step unlocks the next demo beat.

| Step | Milestone | Outcome |
|------|-----------|---------|
| **0** | **M0 + M0b** | MVP mode on; hidden services gated; **“What can you do?”** works |
| **1** | **M1** | Scan returns 2 rules only; empty account message |
| **2** | **M2** | Decision card dashboard (not table wall) |
| **3** | **M7 (C2–C4)** | Chat explains scan in plain English (OpenAI optional) |
| **4** | **M3 + M4** | Delete underutilized instance; all 4 modes on delete |
| **5** | **M6 Beat B** | Tag add via `update_ec2_tag` |
| **6** | **M5** | Undo on tag change |
| **7** | **M8** | Run full demo script; fix gaps |
| **8** | **M9** | Document pattern for S3 later |

**Start with Step 0** — users (and you) need to know what's live before scanning.

---

## Checklist (in order)

### M0 — Scope lock + hide mechanism (documented — **not implemented yet**)

Principle: **hide, don’t delete.** Two small touch points — no env flags, no second registry, no commenting out huge `actionMap` blocks.

- [ ] Confirm Atlas runs on **Python 3.13** (3.14 breaks boto3 XML on macOS)
- [ ] Implement hide mechanism below when starting Step 0
- [ ] Move any stray active checklist items out of MVP into [long_term/to_do.md](./long_term/to_do.md) _(user done — keep synced)_

#### Two layers (different files)

| Layer | Controls | MVP mechanism |
|-------|----------|---------------|
| **API (Node)** | What chat can **start** — scan s3, inventory, toggle… | **One allowlist** — skip non-listed actions in action search |
| **Atlas (Python)** | Which **scan rules** run | **Comment out** entries in `get_ec2_rules()` → `all_rules` dict |

Atlas HTTP routes for S3/RDS can stay registered — harmless if the API never calls them.

---

#### API — one allowlist (preferred over commenting out `actionMap`)

**Do not** comment out whole action blocks in `actionMap.js` (~500 lines, top-level `require()`s, easy to break).

**Do** add one list and one filter:

**File:** `services/understanding/search/searchMessageForAction.js`  
(or a tiny `services/config/mvpEnabledActions.js` imported there)

```js
// MVP: only these action types are matchable from chat
const MVP_ENABLED_ACTIONS = [
    'scan_ec2',
    'create_ec2',
    'delete_ec2',
    'update_ec2_tag',
    'general_chat'
];
```

**Logic:** when looping `Object.values(actionMap)`, if `action.type` is not in `MVP_ENABLED_ACTIONS`, skip (treat as no match).

**Enabled — MVP demo:**

| Action | Role |
|--------|------|
| `scan_ec2` | Find underutilized + missing Team tag |
| `create_ec2` | Stand up test instance |
| `delete_ec2` | Cost fix |
| `update_ec2_tag` | Tag + undo demo |
| `general_chat` | Fallback + “what can you do?” |

**Disabled — not in allowlist (handlers stay in repo for tests/manual):**

| Action | Why hidden |
|--------|------------|
| `scan_s3` | Coming soon — S3 scan wall not MVP |
| `inventory_aws` | Console-like inventory |
| `show_billing` | Separate product beat |
| `toggle_ec2` | Demo uses delete, not toggle — avoids confusion |

**Alternatives (not recommended for MVP):**

| Approach | Verdict |
|----------|---------|
| Comment out entire `actionMap` entries + `require()` | Fragile — avoid |
| Set each hidden `match: () => false` | Works but scattered — worse than one list |
| `CLOUDPILOT_MVP_MODE` env + two registries | Overkill for now — add later if needed |

**Uncomment / extend allowlist** when S3 (or toggle) is ready for demo — one line per action.

---

#### Atlas — comment out scan rules (simplest for Python)

**File:** `atlas/app/core/engine/rule_registry.py` → `get_ec2_rules()` → `all_rules` dict

**Leave uncommented (MVP — exactly two rules once Team rule exists):**

```text
low_cpu / ec2_low_cpu
missing_team_tag / ec2_missing_team_tag   ← add rule; replace missing_name_tag for MVP
```

**Comment out** everything else in that dict, e.g.:

```text
missing_name_tag, stopped_instance, legacy_instance_type, public_ip_attached, …
```

Same pattern for `get_s3_rules()` if S3 scan is ever hit directly — comment out all S3 rules or leave file untouched (API won’t call `/scan/s3` in MVP).

**Do not comment out:**

- Rule **files** under `core/cloud/ec2/rules/` — keep for later
- Atlas routes in `main.py` — uncalled routes are fine
- Handler folders in API — tests may still use them

**Optional later:** API passes explicit `rules: ["low_cpu", …]` on scan — not needed if Atlas dict is the single source of truth for MVP.

---

#### “What can you do?” — separate from allowlist

Capabilities onboarding (**M0b**) uses a **static manifest** — not `Object.values(actionMap)`.

Why: friendly wording, no leaked hidden actions, no dependency on match functions.

Allowlist = what chat can **trigger**. Manifest = what we **tell the user** we support.

---

#### When user asks for a hidden service

No error. Template (see M0b):

> S3 and RDS are coming soon — right now I can help with EC2 (scan, create, delete, tags, undo tag changes).

---

#### Restore checklist (when expanding beyond MVP)

1. Add action type to `MVP_ENABLED_ACTIONS`
2. Uncomment rules in `rule_registry.py`
3. Update M0b capability manifest copy
4. Run demo script beat for that service

---

### M0b — “What can you do?” / supported services (onboarding)

User should be able to ask anytime (idle chat, no open request):

- “What can you do?”
- “What services are supported?”
- “What can CloudPilot help with?”
- “Help”

**Target reply (MVP — EC2 only, plain English):**

```text
Right now I can help you with EC2 instances, including:

• Scanning for cost and setup issues (like underutilized instances or missing Team tags)
• Creating and deleting instances
• Adding or updating tags
• Undoing recent tag changes

Other AWS services like S3 and RDS are coming soon. What would you like to do?
```

**Implementation notes (when coding — not now):**

- Static **MVP capabilities manifest** (one file or `actionMap` slice) — not generated from full registry (avoids listing hidden S3/RDS)
- Detect via understanding layer (`conversation` intent or `general_chat` sub-intent) — no workflow row needed
- If user asks for hidden service: short answer + “coming soon” + point back to EC2 list
- Works with `OPENAI_ENHANCED_REPLIES=false` (template) and `true` (AI may rephrase; must not invent capabilities)

- [ ] Define trigger phrases for “capabilities / help” intent
- [ ] Define MVP capability copy (EC2 bullets above)
- [ ] Hidden service ask → “Coming soon — we're perfecting EC2 first.”
- [ ] Verify reply when open request exists vs idle (still helpful; don't break workflow)

---

### M1 — EC2 scan: two rules, one instance, data-driven copy

**Keep for MVP demo (exactly two rules):**

| Rule | User-facing label | Why |
|------|-------------------|-----|
| **Low CPU / underutilized** | Underutilized | Cost story — show **avg CPU %**, **last 7 days**, **~$18/mo** estimate. Feels data-driven, not “rule-driven.” |
| **Missing Team tag** | Missing Team tag | Companies care about ownership (`Team`, `Environment`, `Application`, `Owner`, `CostCenter`). CloudPilot explains *why* it matters. |

**Code note:** Atlas today has `ec2_missing_name_tag` (checks `Name` tag). MVP needs **`Team` tag** rule — small rule add + comment out other rules per **M0 hide mechanism**. Common tag keys for later: Name, Environment, Team, Application, Owner, CostCenter.

**Turn off for MVP** — comment out in `rule_registry.py` (see M0), do not delete rule files:

- `public_ip_attached`, `legacy_instance_type`, `stopped_instance`, `missing_name_tag` (when Team rule replaces it), etc.

- [ ] MVP scan profile runs **exactly 2 rules** on **one instance** narrative
- [ ] Finding presentation: CPU %, lookback window, estimated monthly savings (even approximate)
- [ ] Atlas: empty region → `resourcesScanned: 0`, success (not 500)
- [ ] API: empty resources — *“You do not have any EC2 instances currently running in {region}.”*
- [ ] Scan openers: *“I found one instance that may be costing you money.”* (when one finding cluster)

---

### M2 — Dashboard: decision card, not console

**Principle:** Don't build another dashboard. **Chat is the star;** dashboard shows only what's needed for the current decision.

Target layout (see demo script Beat 2):

```text
Potential Savings
Estimated Savings    $18/month
Resource             dev-web-server
Status               Running

Recommendations
⚠️ Underutilized      Avg CPU 2% · last 7 days
⚠️ Missing Team tag   Ownership unknown
```

- [ ] API: MVP Navigator shape — **Potential Savings card + recommendation list** (not 3 full tables by default)
- [ ] Kite: summary card first; **Show AWS details** expands full tables
- [ ] No rule IDs (`ec2_low_cpu`) or AWS jargon in default UI
- [ ] User-facing label: **Recommendations** (not “Findings”)
- [ ] Underutilized row shows **metrics** (CPU %, period) — not just severity badge

---

### M3 — Cost fix: delete underutilized instance

**Primary cost action:** **`delete_ec2`** — already live; no stop action needed.

- [ ] Scan finding (underutilized) links to **delete** remediation
- [ ] Pre-execute copy (“CloudPilot Fix It”):

  ```text
  Delete EC2 instance {name}
  Estimated savings: $18/month
  This cannot be undone. The instance will be terminated.
  ```

- [ ] Honest copy: **no undo on delete** (undo demo is the tag beat — see M5/M6)
- [ ] Post-execute: short success — instance terminated, savings context (not raw JSON)

---

### M4 — Execution modes 1–4 (show all four in demo)

All four modes on the **same** fix — that's a killer differentiator. **Literally show the picker in the demo.**

| Mode | Label in demo | MVP priority |
|------|---------------|----------------|
| **1** | Show Instructions | P0 — trust builder |
| **2** | Generate CLI | P0 — show in demo |
| **3** | Create Pull Request | P1 — works or honest “coming soon” for stop; EC2 create PR exists |
| **4** | CloudPilot Fix It | P0 — live demo climax |

- [ ] Mode picker copy exactly as demo script (1–4 labels above)
- [ ] Uses **display_name** where request is named
- [ ] Confirm → execute → friendly outcome
- [ ] `atlas_unreachable` / Atlas 500 → clear message (Atlas running? Python 3.13?)

---

### M5 — Undo (demo on tag only)

History MVP is shipped — **demo undo on `update_ec2_tag`, not on delete.**

- [ ] Tag change saves history row; copy says undo available
- [ ] “Undo last change” after tag → restores prior tag state
- [ ] Undo failure → friendly message, conversation continues
- [ ] Delete path: confirm destructive action clearly; do **not** promise undo

See [long_term/history.md](./long_term/history.md) for shipped baseline.

---

### M6 — Full demo loop

Empty account after bill reset — two beats:

**Beat A — Cost (delete):**

- [ ] `create_ec2` — one instance (`dev-web-server`, t3.micro)
- [ ] `scan_ec2` — underutilized + missing Team tag
- [ ] `delete_ec2` — remove unused instance (modes 1–4 on delete)

**Beat B — Trust (tag + undo):**

- [ ] `create_ec2` again (or use second instance if account allows)
- [ ] Scan surfaces missing Team tag
- [ ] “Add Team tag?” → `update_ec2_tag` (Platform / Backend / …)
- [ ] **Undo** tag change — history demo climax
- [ ] Optional: `delete_ec2` teardown

Tag + delete actions already exist — **copy + wiring + demo order**, not new architecture.

---

### M7 — CloudPilot Chat ([cloud_pilot_chat.md](./cloud_pilot_chat.md))

Context is the upgrade that makes it feel like ChatGPT. **Part of MVP — not a separate project.**

- [x] **C1** — Context builder + STEP 7a log
- [ ] **C2** — `OPENAI_ENHANCED_REPLIES=true` → live general chat; fallback to templates
- [ ] **C3** — `relevant_context` from active request (action, fields, display name)
- [ ] **C4** — Post-**EC2**-scan summary in chat (4–6 lines); full data behind “Show AWS details”
- [ ] **C5** — Knowledge for **`ec2_low_cpu`** + **`ec2_missing_team_tag`** only (meaning, risk, tradeoff — never invent findings)
- [ ] Templates stay for confirmations, errors, mode picker — AI enhances explanation only

**MVP chat example (target — combines both findings on one instance):**

> I noticed this EC2 instance has averaged about 2% CPU over the past week. If it's no longer needed, deleting it could save approximately $18 per month. I also couldn't determine who owns it because it's missing a Team tag — I can add one for you if you'd like.

---

### M8 — Polish & demo hardening

- [ ] Run 3-minute demo script on **empty account** and **one-instance account**
- [ ] Test mode smoke: Atlas test routes for scan + toggle without AWS
- [ ] Kite: `conversationID` on every message (if not already)
- [ ] Remove or gate developer noise from default UI (raw Atlas, STEP logs in prod)

---

### M9 — MVP done → unhide pattern

Only after M0–M8 green:

- [ ] Write “vertical slice pattern” note (scan → explain → fix → undo → cost) for S3 reuse
- [ ] Pull first item from [long_term/scans.md](./long_term/scans.md) using **same UX**, not new dashboard

---

## Explicitly not MVP (see long_term)

- S3 / RDS / pipeline scan expansion
- PR remediation demo (mode 3)
- 10+ rules per service
- Multi-open requests, saved actions, Learn/Test/Live product modes
- Capability migration cleanup
- Billing automation beyond cost **display** in chat

---

## Related docs

| Doc | Role |
|-----|------|
| [cloud_pilot_chat.md](./cloud_pilot_chat.md) | Context, knowledge, enhanced replies — **M7** |
| [long_term/make_scans_useful.md](./long_term/make_scans_useful.md) | Conversation-first philosophy (reference) |
| [long_term/history.md](./long_term/history.md) | Undo — shipped baseline for **M5** |
| [instructions/adding_new_action.md](../instructions/adding_new_action.md) | When adding actions later |
| [instructions/converting_atlas_data.md](../instructions/converting_atlas_data.md) | Navigator shaping |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-09 | Initial MVP checklist — EC2 vertical slice, hide-not-delete, chat integrated as M7 |
| 2026-07-09 | Reframe: decision assistant not scanner; one instance; Team tag; show all 4 modes in demo |
| 2026-07-09 | Cost fix = delete_ec2; undo demo = update_ec2_tag only (not delete) |
| 2026-07-09 | M0b: “What can you do?” onboarding; recommended step order table |
| 2026-07-09 | M0 hide mechanism: API allowlist + Atlas rule_registry comment-out (doc only, not implemented) |
