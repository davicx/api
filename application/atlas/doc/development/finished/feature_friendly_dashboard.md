# Friendly Dashboard — S3 Findings MVP

## What this does

Make the **S3** dashboard feel like **CloudPilot helping the user understand and
fix AWS problems**, not an AWS configuration/admin table.

Default dashboard answers:

1. **What is wrong?**
2. **How important is it?**
3. **What does it mean?**
4. **What can I do about it?**

**Status:** Finished — 2026-08-14. Steps 1–5 + 7 done. Step 6 moved to [S3 remediation modes](../future/feature_s3_remediation_modes.md).  
**Codename:** `feature_friendly_dashboard`  
**Aligned with:** User Cursor Plan — Friendly S3 Findings Dashboard (2026-08-12)

**Related:**
* [Current Development](../current/current_development.md)
* [S3 remediation modes](../future/feature_s3_remediation_modes.md) — former Step 6
* [Make scans useful](../future/make_scans_useful.md)
* [Remediations](../future/remediations.md)
* [CloudPilot MVP](../current/feature_mvp.md)

---

## Feeling we want

> CloudPilot should not just identify AWS problems. It should explain them in
> normal language and give the user a clear path toward resolving them.

**Product rule (locked):**

> A finding should never be a dead-end warning. Every finding must provide a
> clear next action.

MVP actions: **Fix** and **Review**. (**Learn More** later if needed.)

---

## Alignment check

| Theme | Prior plan | This constrained MVP | Status |
|-------|------------|----------------------|--------|
| Findings table as hero | Yes | Yes — **exact structure/wording** | Aligned |
| Fix / Review every row | Yes | Yes — Fix ≠ mutate AWS | Aligned |
| Presentation map, keep scanner | Yes | Yes — simple `recommendation` → display map | Aligned |
| Friendly S3 buckets + View details | Yes | Yes | Aligned |
| Environment summary | Yes | Yes — compact, no KPI wall | Aligned |
| No giant remediation rewrite | Implied | **Hard lock** | Strengthened |
| No full dashboard redesign | CSS deferred | **Hard lock** — no cards/tiles/charts | Strengthened |
| Hide internal codes in UI | Yes | Explicit examples locked | Aligned |
| Scope | S3 (+ maybe EC2) | **S3 only** for this pass | Locked S3 |
| Learn More | Optional MVP | **Later** — Fix/Review only now | Locked |

**Verdict:** Yes — same product direction. This update **narrows** scope and
forbids creative layout drift. Findings table must stay **extremely close** to
the target table below.

---

## Problem today

Still reads like:

```text
Default encryption disabled | high | active | security | ENABLE_DEFAULT_ENCRYPTION
```

User should see:

```text
Encryption is off | customer-uploads-demo | 🔴 High | New files aren't encrypted by default. | Fix
```

---

## 1. Findings table — exact target (do not invent a new layout)

Keep UI **as close as possible** to this structure and wording:

| Finding | Resource | Priority | What this means | |
|---------|----------|----------|-----------------|---|
| **Public access protection is off** | customer-uploads-demo | 🔴 High | This bucket could be more exposed than intended. | **Fix** |
| **Encryption is off** | customer-uploads-demo | 🔴 High | New files aren't encrypted by default. | **Fix** |
| **Bucket may allow public access** | customer-uploads-demo | 🔴 High | The bucket policy needs to be reviewed. | **Review** |
| **Public file permissions found** | customer-uploads-demo | 🔴 High | Some files may be publicly accessible. | **Fix** |
| **Versioning is off** | customer-uploads-demo | 🟡 Medium | Deleted or overwritten files may be harder to recover. | **Fix** |
| **No lifecycle policy** | customer-uploads-demo | 🟢 Low | Old files may be costing more than necessary. | **Fix** |
| **Access logging is off** | customer-uploads-demo | 🟢 Low | You have less visibility into who accesses this bucket. | **Fix** |
| **Missing Name tag** | customer-uploads-demo | 🟢 Low | This bucket is harder to identify and organize. | **Fix** |

### Important

Do **not** expose internal recommendation codes in the normal table:

```text
ENABLE_PUBLIC_ACCESS_BLOCK
ENABLE_DEFAULT_ENCRYPTION
ADD_LIFECYCLE_POLICY
REVIEW_BUCKET_POLICY
```

Those stay in data/backend so CloudPilot can choose the action. User-facing UI
speaks normally.

**Do not** get creative with cards, tiles, charts, or a substantially different
layout for this MVP.

---

## 2. Every finding has an action

| Action | When |
|--------|------|
| **Fix** | CloudPilot has a concrete remediation it can help perform |
| **Review** | Investigate before a potentially dangerous change |

Examples:

```text
ENABLE_DEFAULT_ENCRYPTION  → Fix
ENABLE_VERSIONING          → Fix
ADD_LIFECYCLE_POLICY       → Fix
REVIEW_BUCKET_POLICY       → Review
```

Do not assume every AWS problem can safely be automatically changed.

---

## 3. Fix means “help me resolve this” — not “mutate AWS now”

**Keep the Fix buttons.** They signal CloudPilot’s direction: findings aren’t
dead-end warnings.

### MVP flow (S3)

```text
Finding → Fix → Chat (finding selected) → honest “coming soon”
```

Example Chat reply:

```text
Fixing this finding is coming soon.

CloudPilot found the issue, but automatic remediation for this S3 finding
isn't available yet.
```

### Later (when S3 remediation exists — same as EC2)

```text
How would you like to fix this?
  · Automatic
  · Instructions
  · CLI
  · Pull Request
```

**Do not** build those four choices for S3 in this MVP. None of the S3
remediations work yet — a fake menu creates work and looks unfinished.

**Review** also opens Chat with the finding selected (review-oriented copy OK).

**Demo tip:** Don’t click Fix on S3. Show the scan and findings, point at the
buttons (“same flow as EC2”), then demo **real EC2 remediation** separately.

---

## 4. Friendly text separate from raw finding data

Do **not** rewrite the scanner.

Scanner can keep returning:

```js
{
  finding: "Default encryption disabled",
  severity: "high",
  status: "active",
  bucket: "customer-uploads-demo",
  category: "security",
  recommendation: "ENABLE_DEFAULT_ENCRYPTION"
}
```

Presentation layer maps to:

```js
{
  title: "Encryption is off",
  meaning: "New files aren't encrypted by default.",
  action: "Fix"
}
```

MVP: a **simple map** is enough — not a giant generic framework:

```js
const findingDisplay = {
  ENABLE_DEFAULT_ENCRYPTION: {
    title: "Encryption is off",
    meaning: "New files aren't encrypted by default.",
    action: "Fix"
  },
  REVIEW_BUCKET_POLICY: {
    title: "Bucket may allow public access",
    meaning: "The bucket policy needs to be reviewed.",
    action: "Review"
  }
  // …remaining S3 codes used in the target table
};
```

---

## 5. Simplify main S3 bucket table

Default summary (not Encryption/Lifecycle/Public Block/… columns):

| Bucket | Region | Health | Findings | |
|--------|--------|--------|----------|---|
| **customer-uploads-demo** | us-west-2 | 🔴 Needs attention | **8 findings** | View |
| **kite-app-assets** | us-west-2 | 🟢 Healthy | No findings | View |

---

## 6. Keep technical details (on View)

Click **View** → friendly-second / AWS-detail:

```text
### customer-uploads-demo

Encryption: Off
Public access protection: Off
Versioning: Off
Logging: Off
Lifecycle policy: None

4 security
2 reliability
1 cost
1 configuration
```

**Friendly summary first → AWS details second.** Do not remove AWS information.

---

## 7. Small environment summary (above tables)

```text
### Your AWS environment

1 resource needs attention

CloudPilot found 8 things worth looking at in customer-uploads-demo.
Four are security-related, so I'd start there.

[ Review findings ]
```

Compact only. No analytics/KPI dashboard. No charts.

---

## 8. Priority styling

```text
🔴 High
🟡 Medium
🟢 Low
```

Severity helps prioritize. Do **not** paint entire rows bright red/yellow/green.
Dashboard stays clean and calm.

---

## 9. Page hierarchy (S3)

```text
S3
│
├── Your AWS environment   (short CloudPilot summary)
├── Findings               (friendly actionable table)  ← main experience
└── S3 Buckets             (simplified resource overview)
```

Findings > raw inventory.

---

## Visual / CSS plan (do not change CSS until Step 5)

Match the clean Findings mock when styling ships:

* White surface, ample whitespace
* No vertical borders, no zebra stripes
* Thin horizontal row dividers only
* Generous padding; calm density
* Finding bold; resource monospace; Fix/Review bold text actions
* Priority = emoji/dot + label only (not full-row alarm colors)
* Dedicated Findings table wrapper — do not restyle every Bootstrap table
* **No** cards, tiles, or charts for this MVP

Until Step 5: structure + copy with existing Bootstrap is OK.

---

## Locked decisions

| Topic | Decision |
|-------|----------|
| Scope | **S3 only** this pass |
| Layout | Findings table **exactly** like target — no creative redesign |
| Scanner | **Unchanged** — keep codes/severity/category |
| Display map | Simple `recommendation` → `{ title, meaning, action }` — **Kite-only (1A)** |
| Map location | **Kite frontend** — presentation language, not AWS truth; no shared infra yet |
| Empty state | **No scan results yet** + **Scan AWS** CTA on Dashboard (2B) — works without Chat |
| Findings UI | New **`FriendlyFindingsTable`** (3A); raw/technical view via **View technical details** (no feature flag). **Do not delete** existing Navigator / admin table components. |
| Shell | **S3 / Findings section** on Dashboard (4B) — not whole `/dashboard` gated on S3 |
| Fix automatically | **Not for S3 MVP** — do not build Automatic / Instructions / CLI / PR choices for S3 yet |
| Fix button | **Show Fix** on every actionable finding; click → **Chat with finding selected** → simple “coming soon” for S3 |
| Review button | Keep for investigate-first findings (e.g. bucket policy); same Chat handoff OK with review-oriented copy |
| Multi-bucket | **Group by bucket (6B)**; within bucket sort High → Medium → Low; top summary aggregates |
| Fix click | Opens **Chat** (finding selected) — **does not** mutate AWS; **does not** open a fake four-mode panel for S3 |
| Remediation | Reuse EC2 execution model **later**; S3 Fix is product signal + Chat stub only for this MVP |
| Bucket table | Health + findings count + View |
| Technical details | On **View** drill-down (not removed) |
| Summary | Compact template copy; no KPI wall / charts |
| Priority UI | 🔴🟡🟢 + word; no full-row color washes |
| CSS | Deferred to Step 5; plan only until then |
| Org knowledge reframes | **Out** of this MVP |
| EC2 findings table | **Out** of this MVP |
| Demo note | **Don’t click Fix** in the S3 demo; point at buttons, then demo **real EC2 remediation** separately |

### MVP calls locked (2026-08-12)

```text
1A  Map → Kite-only
2B  Empty → Dashboard Scan AWS CTA
3A  New FriendlyFindingsTable (+ technical details link)
4B  S3 section on Dashboard (room for EC2 later)
5   Fix → Chat + “coming soon” for S3 (revised; was 5C)
6B  Findings grouped by bucket, High→Medium→Low inside
```

**#5 revised (locked):**

> Fix button → show on every actionable finding. Clicking opens the finding in
> Chat. For S3 MVP, Chat returns a simple “coming soon” response. Do **not**
> build the four remediation choices (Automatic / Instructions / CLI / PR) for
> S3 yet.

Example Chat response after Fix:

```text
Fixing this finding is coming soon.

CloudPilot found the issue, but automatic remediation for this S3 finding
isn't available yet.
```

That keeps the product direction (**findings → help resolve**) without fake
capability or a dead-end four-mode panel.

---

## MVP constraints

**DO**

* Keep existing scanner data and recommendation codes
* Add friendly presentation text
* Show **Fix** / **Review** on findings (product signal)
* Fix → select finding + open Chat → honest “coming soon” for S3
* Preserve technical details on View
* Smallest clean change — friendly + actionable S3 results

**DO NOT**

* Rewrite the scanner
* Build S3 four-mode remediation UI for this MVP
* Build a generic remediation framework
* Create lots of new backend abstractions
* Mutate AWS just because Fix was clicked
* Show **Fix automatically** (or four choices) that don’t work for S3
* Remove technical information
* Redesign the whole dashboard / turn Step 1 into an architecture refactor
* Add charts to “look like a dashboard”
* Expose internal constants to normal users
* Invent cards/tiles instead of the target table
* Share/map infrastructure on the API for this MVP
* **Delete or replace existing Kite components** (Navigator, admin findings table, Chat panels). Add new files beside them.

---

## Suggested steps (when coding)

### Step 1 — Simple S3 finding display map (DONE)

Kite-only presentation map in `kite/src/functions/findings/s3FindingDisplay.js`.

* Maps live Atlas codes (`ENABLE_*` / `rule_id` / `issue.code`) → `{ title, meaning, action }`
* Groups by bucket, High → Medium → Low
* Does not change the scanner

### Step 2 — Findings table (DONE)

* New `FriendlyFindingsTable` — existing `NavigatorDataRenderer` and admin table kept
* S3 section on Dashboard; **View technical details** reveals the old Navigator / raw table
* Fix / Review selects the finding and opens Chat (coming-soon copy is Step 3)

### Step 3 — Environment summary + empty state + Fix→Chat stub (DONE)

* Compact “Your AWS environment” when findings exist
* Empty: **No scan results yet** + **Scan AWS** CTA (same `scan s3` path as Chat)
* Friendly table also reads Navigator `s3_findings` rows (so a scan shows up even if Chat context only has Navigator)
* Chat scan preview uses friendly finding titles (not the admin buckets table)
* Chat scan speak: “things worth looking at” + open Dashboard
* Fix/Review → Chat shows honest **coming soon** copy for S3

### Step 4 — Friendly S3 buckets table + View detail (DONE)

* New `FriendlyS3BucketsTable`: Bucket / Region / Health / Findings / View
* View shows encryption, public access, versioning, logging, lifecycle + category counts
* Original Navigator S3 Buckets + EC2 tables (including **Tags**) are unchanged — **View original tables**
* EC2 scan uses the same friendly Findings table (new) so `scan ec2` is not admin-first

### Step 5 — CSS pass to match mock (DONE)

* Dedicated `friendlyDashboard.css` on new tables only
* Original Navigator / Bootstrap admin tables unchanged
* Thin horizontal dividers, no zebra, no vertical borders, calm padding

### Step 6 — Real S3 remediation modes

**Moved to future:** [feature_s3_remediation_modes.md](../future/feature_s3_remediation_modes.md)

When an S3 action works end-to-end, wire Automatic · Instructions · CLI · Pull Request. Until then Chat stays “coming soon.”

### Step 7 — Acceptance (MVP success test)

- [x] After `scan s3`, Dashboard shows friendly grouped findings — not admin rows by default
- [x] Every mapped finding shows **Fix** or **Review** (no internal `ENABLE_*` titles)
- [x] Fix/Review → Chat with finding selected + S3 “coming soon” copy
- [x] No fake S3 four-mode remediation menu
- [x] Original Navigator tables remain behind **View original tables**
- [x] Empty Dashboard: **No scan results yet** + **Scan AWS**

Verified 2026-08-14 from Kite (`FriendlyFindingsTable`, `s3FindingDisplay.js`, `DashboardPage`, `ChatPage`) + Atlas mock finding codes.

**Live demo tip:** Don’t click Fix on S3; show scan + findings, gesture at
buttons (“same remediation flow as EC2”), then demo **real EC2 Fix** separately.

---

## Open questions

**None blocking Step 1.**

Optional (Step 2–3):

* **Scan AWS CTA** — same path Chat uses for `scan s3`? (Preferred: yes.)
* **Fix→Chat** — navigate to `/chat` with `selectedFinding` already in context (preferred), or open a mini panel first? Prefer **go to Chat** to match “Finding → Fix → Chat.”

---

## Next

_(none — archived)_

MVP closed 2026-08-14. Friendly S3 Findings Dashboard is the default; original
tables stay behind **View original tables**. S3 Fix is Chat “coming soon.”
Real S3 remediation modes live in future.
