# MVP — One magical vertical slice (EC2)

**Last reviewed:** 2026-07-17

**Status:** Active — all other product work lives in [long_term/](./long_term/).

> **Chat & context (part of this work):** [cloud_pilot_chat.md](./cloud_pilot_chat.md)  
> **Architecture & how-to:** [architecture/architecture.md](./architecture/architecture.md)  
> **Deferred:** [long_term/to_do.md](./long_term/to_do.md) · [long_term/scans.md](./long_term/scans.md) · [long_term/remediations.md](./long_term/remediations.md)

---

## Product reframe (locked)

> **You're not demoing "AWS scanning."**  
> **You're demoing "CloudPilot helping me make a good decision — and fitting into how engineering teams already work."**

That's the memorable product. Scan is input; **explain → decide → deliver change (instructions / CLI / PR / automatic) → undo** is the show.

**Work now is mostly editing, not building.** Chat, scan, tags, EC2 ops, four execution modes, undo, and context (C1) largely exist. MVP = **curate, hide, and polish copy + dashboard**.

---

## Official demo goal

> Start from an existing small instance. Create a new micro instance **without executing** (show Instructions + CLI). Scan finds low CPU. Recommend moving production to the smaller instance via a **tiny Terraform Pull Request**. Then show **Automatic** with undo on a traffic-spike rollback. End on **History**.

**Story constraint:** Keep Terraform intentionally tiny — one EC2 resource, one-line diff. The audience remembers the PR moment, not a wall of IaC.

**Why PR lives on the switch (not create):**

| Moment | Mode story | Why |
|--------|------------|-----|
| **Create micro** | Instructions + CLI only | Teaches “CloudPilot can give you commands if you don’t want automation.” A create PR is usually big and feels forced. |
| **Switch / resize to micro** | **Pull Request** | Real engineering workflow. Tiny diff (`t3.small` → `t3.micro`) is instantly understandable. |
| **Traffic spike rollback** | **Automatic** + Undo | Shows the other execution mode and trust. |

---

## Super simple demo checklist

Run this end-to-end before calling MVP done. Chat leads. Dashboard supports.

### 1) Existing small instance

Live resource already in the account (e.g. `t3.small` / current primary).

- [ ] Instance is running and visible to scan
- [ ] No PR on this beat — just the live baseline

---

### 2) Create new micro instance

Show guidance. **Do not execute.**

- [ ] Instructions
- [ ] CLI
- [ ] _(Skip)_ CloudPilot Fix It / Automatic on this beat
- [ ] _(Skip)_ Pull Request on create — feels forced; save PR for Beat 4

**Teaching moment:** CloudPilot can give you commands when you don’t want automation.

---

### 3) Scan

CloudPilot finds low CPU utilization.

- [ ] Scan runs cleanly on the account
- [ ] Finding: underutilized / low CPU (plain language, not rule IDs)
- [ ] Optional second finding: missing Team tag (if still in MVP profile)
- [ ] Chat explains what it found and why it matters

---

### 4) Switch / resize — **this is the PR beat**

CloudPilot recommends moving production from the current instance to the smaller one.

```text
I recommend moving production from the current instance to the smaller instance.

How would you like to apply this?

○ Instructions
○ CLI
● Pull Request
○ Automatic
```

- [ ] Mode picker shown with all four options
- [ ] **Pull Request** selected for the demo climax
- [ ] Tiny Terraform PR generated (intentionally one-file / one-resource if needed)

```diff
resource "aws_instance" "kite_env" {
-  instance_type = "t3.small"
+  instance_type = "t3.micro"
}
```

- [ ] Copy: *For organizations using Infrastructure as Code, CloudPilot doesn’t make the change directly — it prepares a pull request for review.*
- [ ] PR created confirmation in chat

**The 15-second moment people remember:**

```text
Recommended Action: Resize to t3.micro
Execution Mode: ● Pull Request
✓ Pull Request Created
```

---

### 5) Traffic spike — Automatic + Undo

Demonstrate Automatic (and that it can be reversed).

- [ ] Automatic execution path works for the rollback / switch-back story
- [ ] Undo / Roll Back available after the change
- [ ] CloudPilot switches back (or restores prior state) automatically when asked to undo

---

### 6) History

Show recent actions, then undo from history.

```text
Created EC2 instance
Switched traffic
Undo
```

- [ ] History lists the demo actions clearly
- [ ] Click / ask Undo
- [ ] Everything restores to the expected prior state

---

## Goal (one sentence)

**Natural chat → existing small + guided create (instructions/CLI) → scan finds low CPU → PR for switch to micro → automatic rollback → history/undo — demoable in a few minutes.**

Not: “CloudPilot scans EC2, S3, RDS, IAM…”  
Yes: *“This understands infrastructure and fits how we ship changes.”*

---

## Milestone filter

Before starting any task, ask:

> Does this make the **demo checklist above** clearer, or is it platform sprawl?

If sprawl → [long_term/](./long_term/). **Hide, don’t delete.**

---

## What “coming soon” means (hide, not remove)

Keep code; remove from default chat/demo path:

| Hidden for MVP | Still in repo |
|----------------|---------------|
| `scan_s3`, `inventory_aws` (broad), RDS, pipeline scans | Handlers, Atlas routes, docs in `long_term/` |
| Extra EC2 rules (public IP, legacy type, stopped instance, …) | Rule files + registry entries |
| Multi-open requests UI, capability migration, new service scans | [long_term/to_do.md](./long_term/to_do.md) |
| Full Navigator wall (stats + instances + findings tables) | Adapters stay; MVP shows **decision card** first |

**Product label in chat when user asks for hidden features:** “Coming soon — we’re perfecting EC2 first.”

**Mode 3 (PR) is MVP for the switch/resize beat** — not deferred. Keep create-instance PR out of the primary demo path (too noisy); use a tiny one-resource Terraform story for switch.

---

## 3-minute demo script (acceptance test)

Same story as the super simple checklist — scripted for speaking aloud.

### Beat 1 — Existing small instance

Show the live baseline (current production-ish small instance). No change yet.

### Beat 2 — Create micro (instructions + CLI only)

**User:** “Create a new micro instance.”

**CloudPilot:** shows Instructions and CLI — user can run them themselves. **Do not auto-execute.** Do not open a create PR.

### Beat 3 — Scan

**User:** “Scan my EC2 instances.”

**CloudPilot:** “I found an underutilized instance.” _(plain language — avg CPU, lookback, savings)_

### Beat 4 — Switch via Pull Request (star of the demo)

> I recommend moving production from the current instance to the smaller instance.

Mode picker → **Pull Request** → tiny Terraform diff → PR created.

> For organizations using Infrastructure as Code, CloudPilot doesn't make the change directly—it prepares a pull request for review.

### Beat 5 — Traffic spike → Automatic + Undo

Show Automatic for a rollback / switch-back. Undo / Roll Back restores prior state.

### Beat 6 — History

History shows create / switch / undo. Click Undo. Everything restores.

### Also verify

1. **Empty account:** friendly empty message — not Atlas error, not a finding wall.
2. **PR quality:** one-line `instance_type` change is visible and believable.
3. **Teardown:** delete any leftover test instances after the room.

Someone should walk away saying: *“I wish AWS worked like that.”*

---

## Recommended order of work

Do these **in sequence**. Each step unlocks the next demo beat.

| Step | Milestone | Outcome |
|------|-----------|---------|
| **0** | **M0 + M0b** | MVP mode on; hidden services gated; **“What can you do?”** works |
| **1** | **M1** | Scan returns MVP rules; empty account message |
| **2** | **M2** | Decision card dashboard (not table wall) |
| **3** | **M7 (C2–C4)** | Chat explains scan in plain English (OpenAI optional) |
| **4** | **M3 + M4** | Create shows Instructions + CLI; **switch uses PR**; Automatic for rollback |
| **5** | **M5 + M6** | History + Undo on the automatic / reversible beat |
| **6** | **M8** | Run full demo checklist; fix gaps |
| **7** | **M9** | Document pattern for S3 later |

**Start with Step 0** — users (and you) need to know what's live before scanning.

---

## Checklist (technical milestones)

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
    'toggle_ec2',
    'update_ec2_tag',
    'general_chat'
];
```

**Logic:** when looping `Object.values(actionMap)`, if `action.type` is not in `MVP_ENABLED_ACTIONS`, skip (treat as no match).

**Enabled — MVP demo:**

| Action | Role |
|--------|------|
| `scan_ec2` | Find underutilized (+ optional missing Team tag) |
| `create_ec2` | Stand up micro — **demo Instructions + CLI only** |
| `toggle_ec2` | Switch / traffic story — **PR + Automatic + Undo** |
| `delete_ec2` | Teardown / optional cost delete path |
| `update_ec2_tag` | Optional tag beat if still needed |
| `general_chat` | Fallback + “what can you do?” |

**Disabled — not in allowlist (handlers stay in repo for tests/manual):**

| Action | Why hidden |
|--------|------------|
| `scan_s3` | Coming soon — S3 scan wall not MVP |
| `inventory_aws` | Console-like inventory |
| `show_billing` | Separate product beat |

**Alternatives (not recommended for MVP):**

| Approach | Verdict |
|----------|---------|
| Comment out entire `actionMap` entries + `require()` | Fragile — avoid |
| Set each hidden `match: () => false` | Works but scattered — worse than one list |
| `CLOUDPILOT_MVP_MODE` env + two registries | Overkill for now — add later if needed |

**Uncomment / extend allowlist** when S3 is ready for demo — one line per action.

---

#### Atlas — comment out scan rules (simplest for Python)

**File:** `atlas/app/core/engine/rule_registry.py` → `get_ec2_rules()` → `all_rules` dict

**Leave uncommented (MVP — low CPU is required; Team tag optional):**

```text
low_cpu / ec2_low_cpu
missing_team_tag / ec2_missing_team_tag   ← optional second finding
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

> S3 and RDS are coming soon — right now I can help with EC2 (scan, create, switch, tags, undo).

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

• Scanning for cost and setup issues (like underutilized instances)
• Creating instances (I can show instructions or CLI)
• Switching / resizing with a pull request or automatic change
• Undoing recent changes from history

Other AWS services like S3 and RDS are coming soon. What would you like to do?
```

**Implementation notes (when coding — not now):**

- Static **MVP capabilities manifest** (one file or `actionMap` slice) — not generated from full registry (avoids listing hidden S3/RDS)
- Detect via understanding layer (`conversation` intent or `general_chat` sub-intent) — no workflow row needed
- If user asks for hidden service: short answer + “coming soon” + point back to EC2 list
- Works with `OPEN_AI_LIVE_SEND_ALL_MESSAGES_WILL_CAUSE_BILLING=false` (template) and `true` (AI may rephrase; must not invent capabilities)

- [ ] Define trigger phrases for “capabilities / help” intent
- [ ] Define MVP capability copy (EC2 bullets above)
- [ ] Hidden service ask → “Coming soon — we're perfecting EC2 first.”
- [ ] Verify reply when open request exists vs idle (still helpful; don't break workflow)

---

### M1 — EC2 scan: low CPU first, data-driven copy

**Keep for MVP demo:**

| Rule | User-facing label | Why |
|------|-------------------|-----|
| **Low CPU / underutilized** | Underutilized | Core demo finding — avg CPU %, last 7 days, savings estimate. |
| **Missing Team tag** _(optional)_ | Missing Team tag | Ownership story if still useful; not required for the PR climax. |

**Code note:** Atlas today has `ec2_missing_name_tag` (checks `Name` tag). If Team tag stays in MVP, add **`Team` tag** rule + comment out other rules per **M0 hide mechanism**.

**Turn off for MVP** — comment out in `rule_registry.py` (see M0), do not delete rule files:

- `public_ip_attached`, `legacy_instance_type`, `stopped_instance`, `missing_name_tag` (when Team rule replaces it), etc.

- [ ] MVP scan profile runs **low_cpu** (and optional Team tag) on the demo narrative
- [ ] Finding presentation: CPU %, lookback window, estimated monthly savings (even approximate)
- [ ] Atlas: empty region → `resourcesScanned: 0`, success (not 500)
- [ ] API: empty resources — *“You do not have any EC2 instances currently running in {region}.”*
- [ ] Scan openers: *“I found an underutilized instance.”* (plain language)

---

### M2 — Dashboard: decision card, not console

**Principle:** Don't build another dashboard. **Chat is the star;** dashboard shows only what's needed for the current decision.

Target layout:

```text
Potential Savings
Estimated Savings    $18/month
Resource             current primary / underutilized instance
Status               Running

Recommendations
⚠️ Underutilized      Avg CPU 2% · last 7 days
```

- [ ] API: MVP Navigator shape — **Potential Savings card + recommendation list** (not 3 full tables by default)
- [ ] Kite: summary card first; **Show AWS details** expands full tables
- [ ] No rule IDs (`ec2_low_cpu`) or AWS jargon in default UI
- [ ] User-facing label: **Recommendations** (not “Findings”)
- [ ] Underutilized row shows **metrics** (CPU %, period) — not just severity badge

---

### M3 — Demo actions by beat (modes matter)

**Beat 2 — Create micro:** teach non-automation.

- [ ] Create flow surfaces **Instructions** and **CLI**
- [ ] Demo path does **not** require executing create
- [ ] Demo path does **not** open a create-instance PR (too much Terraform noise)

**Beat 4 — Switch / resize:** enterprise PR climax.

- [ ] Recommendation: move production to the smaller instance / resize to `t3.micro`
- [ ] Mode picker shows all four options
- [ ] **Pull Request** path produces a **tiny** Terraform change (one resource / one line if “cheating” for MVP)
- [ ] Copy explains IaC review workflow (CloudPilot prepares PR; does not force direct change)

**Beat 5 — Automatic + Undo:**

- [ ] Automatic path works for traffic spike / switch-back
- [ ] Undo / Roll Back restores prior state

**Optional — delete teardown:**

- [ ] `delete_ec2` available for cleanup after the room
- [ ] Honest copy: destructive delete is not the undo demo

---

### M4 — Execution modes 1–4 (show all four — different beats)

All four modes appear in the **demo** — but not all on the same action. That's clearer storytelling.

| Mode | Label in demo | Where it shines |
|------|---------------|-----------------|
| **1** | Show Instructions | **Create micro** — trust / self-serve |
| **2** | Generate CLI | **Create micro** — trust / self-serve |
| **3** | Create Pull Request | **Switch / resize** — enterprise climax |
| **4** | CloudPilot Fix It (Automatic) | **Traffic spike rollback** — then Undo |

- [ ] Mode picker copy clear (1–4 labels above)
- [ ] Create beat: Instructions + CLI emphasized
- [ ] Switch beat: PR emphasized (tiny diff)
- [ ] Automatic beat: Fix It + Undo
- [ ] Confirm → execute → friendly outcome where execution happens
- [ ] `atlas_unreachable` / Atlas 500 → clear message (Atlas running? Python 3.13?)

**Tiny Terraform tip (allowed for MVP):** manage one EC2 resource in one file. Audience doesn’t care that the whole “IaC” is:

```terraform
resource "aws_instance" "kite_env" {
  instance_type = "t3.small"
}
```

CloudPilot changes one line. Opens a PR. Looks fantastic.

---

### M5 — Undo (demo on Automatic / reversible change)

History MVP is shipped — **demo undo on the reversible switch/rollback beat, not on create-PR.**

- [ ] Automatic / toggle change saves history row; copy says undo available
- [ ] “Undo last change” / History Undo → restores prior state
- [ ] Undo failure → friendly message, conversation continues
- [ ] PR path: prepare for review — do **not** pretend PR merge is silently undone in AWS without history story

See [long_term/history.md](./long_term/history.md) for shipped baseline.

---

### M6 — Full demo loop

Aligns with the **super simple checklist** at the top.

- [ ] Existing small instance ready
- [ ] Create micro — Instructions + CLI shown (no execute required)
- [ ] Scan — low CPU finding
- [ ] Switch recommendation — **PR** with tiny `instance_type` diff
- [ ] Traffic spike / rollback — **Automatic** + Undo
- [ ] History lists actions; Undo restores
- [ ] Optional teardown via `delete_ec2`

---

### M7 — CloudPilot Chat ([cloud_pilot_chat.md](./cloud_pilot_chat.md))

Context is the upgrade that makes it feel like ChatGPT. **Part of MVP — not a separate project.**

- [x] **C1** — Context builder + STEP 7a log
- [ ] **C2** — `OPEN_AI_LIVE_SEND_ALL_MESSAGES_WILL_CAUSE_BILLING=true` → live general chat; fallback to templates
- [ ] **C3** — `relevant_context` from active request (action, fields, display name)
- [ ] **C4** — Post-**EC2**-scan summary in chat (4–6 lines); full data behind “Show AWS details”
- [ ] **C5** — Knowledge for **`ec2_low_cpu`** (+ Team tag if still in profile)
- [ ] Templates stay for confirmations, errors, mode picker — AI enhances explanation only

**MVP chat example (target — scan → recommend switch):**

> I found an underutilized instance averaging about 2% CPU over the past week. I recommend moving production to the smaller instance. For teams using Infrastructure as Code, I can open a pull request with that change for review.

---

### M8 — Polish & demo hardening

- [ ] Run **super simple demo checklist** on a prepared account
- [ ] Test mode smoke: Atlas test routes for scan + toggle without AWS
- [ ] Kite: `conversationID` on every message (if not already)
- [ ] Remove or gate developer noise from default UI (raw Atlas, STEP logs in prod)
- [ ] Confirm PR screenshot / chat confirmation shows the tiny `instance_type` diff

---

### M9 — MVP done → unhide pattern

Only after M0–M8 green:

- [ ] Write “vertical slice pattern” note (scan → explain → deliver via mode → undo → cost) for S3 reuse
- [ ] Pull first item from [long_term/scans.md](./long_term/scans.md) using **same UX**, not new dashboard

---

## Explicitly not MVP (see long_term)

- S3 / RDS / pipeline scan expansion
- Create-instance Pull Request as the star of the demo (noisy Terraform)
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
| [long_term/remediations.md](./long_term/remediations.md) | PR / mode details beyond MVP polish |
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
| 2026-07-17 | Demo reframe: existing small → create micro (Instructions+CLI) → scan → **PR on switch/resize** → Automatic+Undo → History; super simple checklist; toggle back in MVP allowlist |
