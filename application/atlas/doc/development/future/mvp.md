# MVP — One magical vertical slice (EC2)

**Last reviewed:** 2026-07-17

**Status:** Active — all other product work lives in [future/](../future/).

> **Active work:** [Current Development](../current/current_development.md)  
> **Architecture & how-to:** [Architecture](../architecture/architecture.md) · [How-to guides](../how_to/how_to_guides.md)  
> **Deferred:** [to_do.md](./to_do.md) · [scans.md](./scans.md) · [remediations.md](./remediations.md)

---

## Opening line (say this first)

> **CloudPilot helps engineers understand, change, and safely manage AWS infrastructure.**

Then the whole demo maps to one story:

| Capability | Demo beat |
|------------|-----------|
| **Understand** | Scan + Chat (“Why?”) |
| **Recommend** | Switch workload to prepared `t3.micro` |
| **Change** | Instructions / CLI / PR / Automatic |
| **Trust** | History + Undo |

**Locked narrative: Option A — two-instance switch/toggle.**  
Do **not** tell a one-instance “resize in place” story for MVP. If you only have one live instance, there is nothing to toggle to.

**Stop adding demo scenarios after this.** This is already a strong ~6-minute MVP. Polish the loop and put it in front of engineers.

---

## Locked setup: Option A (two instances)

**Why Option A (not Option B):** MVP already has primary / secondary / toggle / history / undo. Option A uses that. Option B (single instance resize + undo resize) is closer to some real customers, but needs a real EC2 resize path and throws away the toggle work — skip for MVP.

### Before the demo starts

| Instance | Type | State |
|----------|------|-------|
| `production-small` | `t3.small` | 🟢 **Running** (production) |
| `production-micro` | `t3.micro` | ⚪ **Stopped** (standby / prepared replacement) |

You don’t need a long explanation. Just say:

> "I've already prepared a smaller replacement instance."

CloudPilot’s job in the room is to **switch production over** — not invent a resize engine.

### Option B (not MVP — one instance)

One running `t3.small` → recommend resize to `t3.micro` → Automatic resizes → Undo resizes back. Cleaner “real customer” story someday; **not** the locked MVP path.

---

## Super simple To Do list

Run end-to-end before calling MVP done.

### 0) Pre-demo setup

- [ ] `production-small` (`t3.small`) — **Running**
- [ ] `production-micro` (`t3.micro`) — **Stopped**
- [ ] Dashboard clean; history empty / quiet

### 1) Existing environment

- [ ] Show production: running small
- [ ] Standby micro visible as prepared (stopped)
- [ ] Line: *“I've already prepared a smaller replacement instance.”*

### 2) Generate changes (optional short beat)

Show that CloudPilot can **generate** (how you could prepare a replacement). **Do not execute create in the room.**

- [ ] Instructions
- [ ] CLI
- [ ] _(Skip)_ Automatic create
- [ ] _(Skip)_ Create Pull Request

### 3) Scan

- [ ] Finding: running small is underutilized / low CPU
- [ ] Recommendation: switch workload to the prepared micro
- [ ] Ask “Why?” → CloudPilot explains in plain English

### 4) Apply recommendation — **PR (centerpiece)**

- [ ] Mode picker: Instructions / CLI / **Pull Request** / Automatic
- [ ] Demo selects **Pull Request**
- [ ] Tiny Terraform diff shown (IaC story for the switch)
- [ ] PR created confirmation

### 5) Production change — Automatic (toggle)

- [ ] After “PR reviewed and merged,” **Automatic** performs the switch
- [ ] Start `production-micro` / stop `production-small` (toggle)
- [ ] Shows CloudPilot can execute approved actions — not only generate code

### 6) Traffic spike → History + Undo

- [ ] Traffic increased (simulated is fine)
- [ ] Recommend returning to the larger instance
- [ ] History shows the switch
- [ ] **Undo** switches back (micro stopped / small running again)
- [ ] End

---

## Demo story (words)

### Pre-demo

Account already has:

- 🟢 `production-small` (`t3.small`) — Running  
- ⚪ `production-micro` (`t3.micro`) — Stopped  

---

### 1. Existing environment

> "Here's my production environment."

Running small is live. Micro is the prepared standby.

> "I've already prepared a smaller replacement instance."

---

### 2. Generate changes (optional)

> "CloudPilot can also generate the steps to prepare a replacement — Instructions or CLI — if you want to run them yourself."

Show briefly. **Don't execute create** during the demo. The standby is already there.

---

### 3. Scan

> "Let's see what CloudPilot notices."

Finding:

- Low CPU on the running small
- Recommendation:

  > "This workload appears overprovisioned. I recommend switching to the prepared t3.micro."

Ask:

> "Why?"

CloudPilot explains in plain English.

---

### 4. Apply recommendation (PR)

This is the centerpiece.

CloudPilot:

> I recommend switching this workload to the prepared t3.micro.

Execution options:

- Instructions
- CLI
- **Pull Request** ← Demo
- Automatic

Show a tiny Terraform diff (IaC representation of the switch / preferred instance).

```diff
resource "aws_instance" "kite_env" {
-  instance_type = "t3.small"
+  instance_type = "t3.micro"
}
```

PR created.

This is the moment people remember.

---

### 5. Production change (Automatic toggle)

> "After the PR is reviewed and merged, CloudPilot can perform the change."

Use **Automatic**:

- Start `production-micro`
- Stop `production-small`

This demonstrates that CloudPilot isn't just generating code — it can also execute approved actions.

---

### 6. Traffic spike → History + Undo

A few minutes later...

> "Traffic increased."

Whether it's simulated or not doesn't matter.

CloudPilot recommends returning to the larger instance.

Show **History**, then **Undo** — switches back to the original state (small running, micro stopped).

```text
History

✓ Generated switch pull request
✓ Switched workload to production-micro
Undo
```

Click Undo.

Everything returns to the original state.

End.

---

## Official demo goal

> Start with two instances: running `t3.small` + stopped `t3.micro`. Scan finds the small underutilized and recommends switching to the prepared micro. Apply via **Pull Request** (tiny Terraform). After “merge,” **Automatic** toggles (start micro / stop small). On a traffic spike, **Undo** from History switches back. End.

**Story constraint:** Keep Terraform intentionally tiny. Automatic = toggle you already have — not a live EC2 resize API for MVP.

**Mode map (locked):**

| Beat | Mode | Why |
|------|------|-----|
| Optional generate | Instructions + CLI only | CloudPilot **generates**; standby already prepared |
| Apply recommendation | **Pull Request** | Enterprise climax — tiny, believable IaC |
| Production change (post-merge) | **Automatic** | Toggle: start micro / stop small |
| Traffic spike | **Undo** (from History) | Trust — restore original primary |
| History | Shows PR + switch | Trust |

---

## Goal (one sentence)

**Understand → recommend switch → change (PR + Automatic toggle) → trust (History/Undo) — about a 6-minute demo on two prepared instances.**

Not: “CloudPilot scans EC2, S3, RDS, IAM…”  
Not: one-instance live resize for MVP  
Yes: *“This understands infrastructure and fits how we ship changes.”*

---

## Milestone filter

Before starting any task, ask:

> Does this make the **demo To Do list above** clearer, or is it platform sprawl?

If sprawl → [future/](../future/). **Hide, don’t delete.**  
**Do not add more demo scenarios** until this loop is polished and shown to real users.

---

## What “coming soon” means (hide, not remove)

Keep code; remove from default chat/demo path:

| Hidden for MVP | Still in repo |
|----------------|---------------|
| `scan_s3`, `inventory_aws` (broad), RDS, pipeline scans | Handlers, Atlas routes, docs in `future/` |
| Extra EC2 rules (public IP, legacy type, stopped instance, …) | Rule files + registry entries |
| Multi-open requests UI, capability migration, new service scans | [future/to_do.md](../future/to_do.md) |
| Full Navigator wall (stats + instances + findings tables) | Adapters stay; MVP shows **decision card** first |
| Real EC2 resize-in-place (Option B) | Later — use toggle for MVP |

**Product label in chat when user asks for hidden features:** “Coming soon — we’re perfecting EC2 first.”

**Mode 3 (PR) is MVP for the apply-recommendation beat** — not deferred. Keep create-instance PR out of the primary demo path (too noisy); use a tiny Terraform story for the preferred instance / switch.

---

## Demo script (acceptance test)

Same story as the To Do list — scripted for speaking aloud. ~6 minutes.

### Pre-demo

`production-small` running. `production-micro` stopped.

### Beat 1 — Existing environment

> "Here's my production environment. I've already prepared a smaller replacement instance."

### Beat 2 — Generate (optional)

Briefly show Instructions / CLI as generate. **Don't create live.**

### Beat 3 — Scan + Why

> "Let's see what CloudPilot notices."

Running small underutilized. Recommend switch to prepared micro. Ask **“Why?”**

### Beat 4 — Apply via Pull Request (centerpiece)

> I recommend switching this workload to the prepared t3.micro.

Mode picker → **Pull Request** → tiny Terraform diff → PR created.

### Beat 5 — Production change (Automatic toggle)

> "After the PR is reviewed and merged, CloudPilot can perform the change."

**Automatic:** start micro / stop small.

### Beat 6 — Traffic spike → History + Undo

> "Traffic increased."

History → **Undo** → original state (small running, micro stopped). End.

### Also verify

1. **Empty account:** friendly empty message — not Atlas error, not a finding wall.
2. **PR quality:** one-line `instance_type` change is visible and believable.
3. **Toggle reliability:** Automatic switch and Undo always leave one primary running.
4. **Teardown:** leave account in a known state after the room.

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
| **4** | **M3 + M4** | Pre-demo two instances; **PR on recommend switch**; Automatic toggle; Undo from History |
| **4b** | **M10** | Mode 1 Instructions — step table + API + simple stepper (`create_ec2`) |
| **5** | **M5 + M6** | History + Undo — trust beat |
| **6** | **M8** | Run full demo checklist; fix gaps |
| **7** | **M9** | Document pattern for S3 later |

**Start with Step 0** — users (and you) need to know what's live before scanning.

---

## Checklist (technical milestones)

### M0 — Scope lock + hide mechanism (documented — **not implemented yet**)

Principle: **hide, don’t delete.** Two small touch points — no env flags, no second registry, no commenting out huge `actionMap` blocks.

- [ ] Confirm Atlas runs on **Python 3.13** (3.14 breaks boto3 XML on macOS)
- [ ] Implement hide mechanism below when starting Step 0
- [ ] Move any stray active checklist items out of MVP into [future/to_do.md](../future/to_do.md) _(user done — keep synced)_

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
| `create_ec2` | Optional / pre-demo — prepare standby micro (Instructions + CLI generate; standby ready before room) |
| `toggle_ec2` | **Core demo** — Automatic switch + Undo |
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
• Switching workloads with a pull request or automatic change
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

**Pre-demo / Beat 1 — Two instances ready:**

- [ ] `production-small` running, `production-micro` stopped
- [ ] Line ready: *“I've already prepared a smaller replacement instance.”*

**Beat 2 — Generate (optional):**

- [ ] Instructions + CLI shown briefly
- [ ] Do **not** execute create in the live room
- [ ] Do **not** open a create-instance PR

**Beat 4 — Apply recommendation:** enterprise PR climax.

- [ ] Recommendation: switch workload to prepared `t3.micro`
- [ ] Mode picker shows all four options
- [ ] **Pull Request** path produces a **tiny** Terraform change
- [ ] Copy explains IaC review workflow

**Beat 5 — Production change (Automatic toggle):**

- [ ] After “PR reviewed and merged,” **Automatic** starts micro / stops small
- [ ] Uses existing toggle path — not a real resize API

**Beat 6 — Traffic spike → History + Undo:**

- [ ] Traffic spike narrative (simulated OK)
- [ ] History lists PR + switch
- [ ] **Undo** restores original primary (small running, micro stopped)

**Optional — delete teardown:**

- [ ] `delete_ec2` available for cleanup after the room

---

### M4 — Execution modes 1–4 (show all four — different beats)

All four modes appear in the **demo** — but not all on the same action.

| Mode | Label in demo | Where it shines |
|------|---------------|-----------------|
| **1** | Show Instructions | Optional generate / prepare story — **M10** loads steps from DB |
| **2** | Generate CLI | Optional generate / prepare story |
| **3** | Create Pull Request | **Apply recommendation** — enterprise climax |
| **4** | CloudPilot Fix It (Automatic) | **Production toggle** (start micro / stop small) |

- [ ] Mode picker copy clear (1–4 labels above)
- [ ] Apply beat: PR emphasized (tiny diff)
- [ ] Production beat: Automatic = toggle
- [ ] Trust beat: History + Undo (not a second Automatic required)
- [ ] Confirm → execute → friendly outcome where execution happens
- [ ] `atlas_unreachable` / Atlas 500 → clear message (Atlas running? Python 3.13?)

**Tiny Terraform tip (allowed for MVP):** one EC2 resource / one-line preferred-type change is enough. Audience doesn’t need a full account Terraform.

---

### M4b — Pull Request (toggle story — real GitHub, tiny Terraform)

> **Full checklist:** [GitHub Pull Requests](../current/feature_github_pull_requests.md) — use simple Step numbers.

> **Goal:** Prove CloudPilot can **prepare a PR for infrastructure changes** — not that it can edit any repo.
> **Action:** `toggle_ec2` only for the demo climax. Skip create-instance PR.
> **Where:** Node (`pr.js`) — Atlas not involved (PR prepares source; Automatic later toggles AWS).

**Infra repo:** [`cloudpilot_infrastructure`](../../../../../cloudpilot_infrastructure) — demo-only. Keep it tiny under `environments/kite/` (see GitHub Pull Requests feature).

**Same pattern as CLI:** `pr.js` → toggle builder → GitHub client.  
String replace one value. No OpenAI. No Terraform parser for MVP.

Follow [GitHub Pull Requests](../current/feature_github_pull_requests.md) using simple numbered Steps.

**After “merge” in the room:** Automatic = existing Atlas toggle (stop primary / start secondary). Do **not** auto-apply Terraform on merge for MVP.

**Later (not MVP):** OpenAI / parser edits richer Terraform; merge → apply workflow. Same `buildPrStrategy` entry point.

> **Note:** [future/remediations.md](../future/remediations.md) still describes an older `create_ec2` + JSON intent path. **Locked MVP demo uses toggle + Terraform tfvars instead.**

---

### M5 — Undo (demo on toggle)

History MVP is shipped — **demo undo on the Automatic toggle, not on create-PR.**

- [ ] Toggle change saves history row; copy says undo available
- [ ] History Undo → restores prior primary/standby state
- [ ] Undo failure → friendly message, conversation continues
- [ ] PR path: prepare for review — do **not** pretend PR merge is silently undone without history story

See [finished/history.md](../finished/history.md) for shipped baseline.

---

### M6 — Full demo loop

Aligns with the **super simple To Do list** at the top (**Option A**).

- [ ] Pre-demo: small running + micro stopped
- [ ] Existing environment shown; standby explained in one line
- [ ] Optional Instructions + CLI (generate only)
- [ ] Scan — underutilized small + “Why?”
- [ ] Apply recommendation — **PR**
- [ ] Production change — **Automatic toggle**
- [ ] Traffic spike → History + **Undo** → original state
- [ ] Optional teardown via `delete_ec2`

---

### M7 — CloudPilot Chat / AI ([Current Development](../current/current_development.md))

Deterministic by default; optional AI behind **three independent flags**. **Part of MVP — not a separate project.**

- [x] Context builder + conversation history foundation
- [ ] **Feature 1** — Explain findings (`OPENAI_EXPLAIN_FINDINGS`) — highest demo ROI
- [ ] **Feature 2** — Friendly request conversations (`OPENAI_FRIENDLY_REQUESTS`) — one ask at a time
- [ ] **Feature 3** — Intent understanding (`OPENAI_INTENT_UNDERSTANDING`) — same STEP 3 contract
- [ ] Templates stay for confirmations, errors, mode picker — AI enhances explanation / asks / intent only
- [ ] **Feature 4** — AI recommendations (prioritize what to do) — *not MVP*

**MVP chat example (target — scan → recommend switch):**

> This workload appears overprovisioned. I recommend switching to the prepared t3.micro. For teams using Infrastructure as Code, I can open a pull request with that change for review.

---

### M10 — Instructions Mode 1 (teach first)

**Philosophy:** CloudPilot teaches first, automates second.  
**SQL:** [cloudpilot_instructions.sql](../../sql/cloudpilot_instructions.sql)  
**Shape:** one row = one step. No `total_steps` / `current_step` in DB (UI owns progress).

```text
Teach → user builds → (later) CloudPilot validates → recommend improvements
```

#### Phase A — Data + API (MVP foundation)

- [ ] Create `cloudpilot_instructions` table (see SQL doc)
- [ ] Seed ~5–8 steps for `create_ec2` (demo-quality copy; images optional)
- [ ] API: get steps by `instruction_for`, ordered by `step_number`
- [ ] Wire Mode 1 / “Show Instructions” to that endpoint

#### Phase B — UI (MVP)

- [ ] Simple stepper: title, instruction, warnings, estimated time, Next / Back / Skip optional
- [ ] “Open in AWS Console” external link where useful
- [ ] Mark complete in UI → “Instructions finished”
- [ ] Optional screenshots per step (even 3–5 sell the story)

#### Phase C — Validate after finish (north star — after Mode 1 works)

- [ ] On finish: “I’ll quickly check that everything looks healthy…”
- [ ] Targeted scan / checks on what should exist
- [ ] Checklist results: ✓ / ⚠ with short recommendations
- [ ] Only then offer `[Fix Automatically]` for safe items

#### Phase D — Expand (later)

- [ ] More `instruction_for` keys (`toggle_ec2`, `create_s3`, …)
- [ ] Image annotations / highlight rectangles
- [ ] Org-specific instruction overrides (if needed)

**Warnings JSON example:**

```json
[
  { "type": "cost", "message": "Choose t3.micro to stay in Free Tier." },
  { "type": "security", "message": "Do not allow SSH from 0.0.0.0/0." }
]
```

---

### M8 — Polish & demo hardening

- [ ] Run **super simple To Do list** end-to-end (~6 minutes)
- [ ] Test mode smoke: Atlas test routes for scan + toggle without AWS
- [ ] Kite: `conversationID` on every message (if not already)
- [ ] Remove or gate developer noise from default UI (raw Atlas, STEP logs in prod)
- [ ] Confirm PR screenshot / chat confirmation shows the tiny `instance_type` diff

---

### M9 — MVP done → unhide pattern

Only after M0–M8 green:

- [ ] Write “vertical slice pattern” note (scan → explain → deliver via mode → undo → cost) for S3 reuse
- [ ] Pull first item from [future/scans.md](../future/scans.md) using **same UX**, not new dashboard

---

## Explicitly not MVP (see long_term)

- S3 / RDS / pipeline scan expansion
- Create-instance Pull Request as the star of the demo (noisy Terraform)
- One-instance live resize (Option B) as the MVP path
- More demo scenarios beyond the locked Option A switch story
- Instruction image highlight rectangles / annotated overlays (M10 Phase D)
- Post-instruction mentor validate loop before Mode 1 steps ship (M10 Phase C — north star, not blocker)
- 10+ rules per service
- Multi-open requests, saved actions, Learn/Test/Live product modes
- Capability migration cleanup
- Billing automation beyond cost **display** in chat

---

## Related docs

| Doc | Role |
|-----|------|
| [Current Development](../current/current_development.md) | Active CloudPilot feature work — **M7** |
| [../sql/cloudpilot_instructions.sql](../../sql/cloudpilot_instructions.sql) | Instructions step table — **M10** |
| [future/make_scans_useful.md](../future/make_scans_useful.md) | Conversation-first philosophy (reference) |
| [finished/history.md](../finished/history.md) | Undo — shipped baseline for **M5** |
| [future/remediations.md](../future/remediations.md) | PR / mode details beyond MVP polish |
| [instructions/adding_new_action.md](../../instructions/adding_new_action.md) | When adding actions later |
| [instructions/converting_atlas_data.md](../../instructions/converting_atlas_data.md) | Navigator shaping |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-09 | Initial MVP checklist — EC2 vertical slice, hide-not-delete, chat integrated as M7 |
| 2026-07-09 | Reframe: decision assistant not scanner; one instance; Team tag; show all 4 modes in demo |
| 2026-07-09 | Cost fix = delete_ec2; undo demo = update_ec2_tag only (not delete) |
| 2026-07-09 | M0b: “What can you do?” onboarding; recommended step order table |
| 2026-07-09 | M0 hide mechanism: API allowlist + Atlas rule_registry comment-out (doc only, not implemented) |
| 2026-07-17 | Demo reframe: existing small → create micro (Instructions+CLI+CloudPilot Fix It) → scan → **PR on switch/resize** → Automatic+Undo → History; super simple checklist; toggle back in MVP allowlist |
| 2026-07-17 | Fix Beat 2: CloudPilot Fix It creates the micro instance (do not skip Automatic on create); still skip PR on create |
| 2026-07-17 | Locked **switch/toggle** story: To Do list + demo words; Beat 2 generate-only again; PR → Automatic production change → Automatic traffic spike → History/Undo; stop adding scenarios |
| 2026-07-17 | Locked **Option A** (two instances): running small + stopped micro; Automatic = toggle; traffic spike → History Undo; Option B resize deferred |
| 2026-07-17 | **M10 Instructions**: one-step-per-row table + Phase A–D todos; SQL `cloudpilot_instructions.sql` |
