# Ask what S3 buckets I have → run S3 scan

## What this does

Let users ask for their S3 buckets in natural language. CloudPilot treats that as
an inventory-style **Question**, then fulfills it by running the existing
**`scan_s3`** path (Atlas → chat + Navigator) — same idea as EC2.

```text
Before:  "what S3 buckets do I have" → General Chat invents / shrugs
After:   same phrase → Question s3_inventory → scan_s3 (region → confirm → Atlas)
Also:    "scan s3" still works as the explicit Action
```

## Current step

**Plan locked — awaiting Step 1** (intent match + Question → `scan_s3`).

## Next

Say **do Step 1** when ready to implement.

**Status:** Active (plan only — no code yet)  
**Codename:** `feature_s3_inventory_ask`  
**Related:**
* [How-to: Route inventory question → scan](../how_to/route_inventory_question_to_scan.md) ← **pattern for every service**
* [CloudPilot Context](../finished/feature_cloud_pilot_context.md) / [how-to](../how_to/cloud_pilot_context.md)
* [Questions](../finished/feature_questions.md)
* [Make scans useful](../future/make_scans_useful.md) — richer S3 conversation UX (later)
* [Chat prompts](../../chat_prompts.md)
* EC2 reference: `matchesScanEC2Intent` + `searchForEc2Inventory.js` → `ec2_inventory` → `scan_ec2`

---

## Feeling we want

> Asking “what buckets do I have?” feels like CloudPilot checking AWS — not chatting about S3 in the abstract.

---

## Locked decisions

| Topic | Decision |
|-------|----------|
| User goal | Natural **list / what do I have** for S3 → real Atlas data |
| Fulfillment | **`scan_s3`** — reuse handler, region field, confirm, Navigator |
| Not fulfillment | **`inventory_aws`** — mock is empty locally; different product shape; deferred |
| Understanding | **Question** `s3_inventory` (like `ec2_inventory`) — not General Chat |
| Explicit command | `"scan s3"` stays **Action** `scan_s3` (must contain `scan` + `s3`) |
| Natural ask | Question path; **must not** invent bucket lists in Chat |
| Intent match | Broaden like EC2: `matchesScanS3Intent` (buckets / show / list / how many / do I have) |
| General knowledge | `"what is S3?"` / `"what is a bucket?"` → stay General Chat |
| Org knowledge | Separate — purpose/importance of a **named** bucket (`feature_organizational_knowledge`) |
| Region | Still required on `scan_s3` (same as today / EC2 scan) |
| Atlas local | **S3 scan mock** — same **5 buckets** as org knowledge seed (`s3_scan_routes_test.py`) |
| Mock bucket names | Aligned with `seed_cloudpilot_organization_knowledge.sql` |
| OpenAI | Question classify Internal-first (mirror EC2 inventory MVP); no inventing lists |
| Make-scans-useful Step 2+ | Drill-down / one-bucket scan / advisor copy — **out** of this MVP |

---

## Why scan (not inventory) for MVP

```text
"what S3 buckets do I have"
        │
        ▼
Want: CloudPilot checks AWS and answers with real resources
        │
   ┌────┴────┐
scan_s3     inventory_aws
✅ local mock  ❌ empty mock
✅ chat+Nav    thin list only
✅ already shipped path
```

[`make_scans_useful`](../future/make_scans_useful.md) suggested inventory phrases for a
friendly list-first UX. That can still happen later. **This feature** locks the EC2
pattern: inventory-style **Question → existing scan Action**.

---

## Target flow

```text
User: what S3 buckets do I have
        │
        ▼
searchForS3Inventory()     # classify only → { question: 's3_inventory' }
  (explicit "scan …" skipped — Action owns that)
        │
        ▼
decideNextStep
  question s3_inventory → buildNewRequestDecision({ action: 'scan_s3', values })
        │
        ▼
Same as today: ask region (if missing) → ready → confirm → POST /scan/s3
        │
        ▼
Atlas (local test mock or live) → message builder + Navigator buckets/findings
```

Explicit:

```text
User: scan s3
        │
        ▼
Action Search → scan_s3   # no Question needed
```

---

## Boundaries (do not confuse)

| Phrase | Path |
|--------|------|
| `scan s3` | Action `scan_s3` |
| `what S3 buckets do I have` / `show my s3 buckets` / `list my buckets` | Question `s3_inventory` → `scan_s3` |
| `what is S3?` | General Chat |
| `what is sam-youtube-demo for?` | Org knowledge (if resolved) |
| `show me all my aws resources` | `inventory_aws` (unchanged; still weak locally) |

---

## Implementation sketch (no code in this step)

| Piece | Role |
|-------|------|
| `actionMap.matchesScanS3Intent` + `scan_s3.match` | Explicit scan **or** natural bucket inventory ask |
| `questions/searchForS3Inventory.js` | Question classify; skip explicit `scan` |
| `searchMessageForQuestion.js` | Return `s3_inventory` when hit |
| `decideNextStep.resolveQuestionDecision` | `s3_inventory` → `scan_s3` + values |
| Atlas | No change required for local — test router already mocks `/scan/s3` |

Mirror files: `matchesScanEC2Intent`, `searchForEc2Inventory.js`, `ec2_inventory` branch in `resolveQuestionDecision`.

Full recipe: [route_inventory_question_to_scan.md](../how_to/route_inventory_question_to_scan.md).

---

## Steps

### Step 1 — Intent + Question → `scan_s3`

- [ ] Add `matchesScanS3Intent` (EC2-shaped; buckets / S3 ownership / list-show-how-many)
- [ ] Point `scan_s3.match` at it (keep requiring S3 signal; explicit `scan` still wins)
- [ ] Add `searchForS3Inventory` (Internal); wire into question orchestrator
- [ ] `resolveQuestionDecision`: `s3_inventory` → `scan_s3`
- [ ] Guard: `"what is S3"` / `"what is a bucket"` do **not** become inventory

### Step 2 — Smoke (Atlas local test)

- [ ] `what S3 buckets do I have` → starts `scan_s3` (asks region if needed)
- [ ] `us-west-2` → `yes` → 5 mock buckets (aligned with org knowledge seed)
- [ ] `scan s3` still works as Action
- [ ] `hello` / `what is S3?` → not `scan_s3`
- [ ] Org knowledge prompt still works when appropriate (separate path)

### Step 3 — Docs + close

- [ ] Update [chat_prompts.md](../../chat_prompts.md)
- [ ] Acceptance table below → PASS
- [ ] Move this doc to `finished/`; index in `finished.md` / `current_development.md`

---

## Acceptance (MVP)

| Check | Expected | Result |
|-------|----------|--------|
| `what S3 buckets do I have` | Routes to `scan_s3` request (not General Chat) | |
| Completes scan (local Atlas) | Lists mock buckets + findings path works | |
| `scan s3` | Still Action `scan_s3` | |
| `what is S3?` | General Chat — no scan | |
| Named org-knowledge ask | Still org path when applicable | |
| No invented bucket list in Chat when Question/scan should own it | Pass | |

---

## Out of scope (this feature)

* Filling `inventory_aws` mock / “show all AWS resources”
* Single-bucket drill-down advisor UX ([make_scans_useful](../future/make_scans_useful.md))
* Renaming Atlas mock buckets to match org-knowledge seed
* OpenAI Question classify (optional later; Internal is enough)
* Changing org-knowledge tables or Search

---

## Shipped

_(empty until Step 3)_
