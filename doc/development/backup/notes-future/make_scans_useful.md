# Make scans useful — conversation-first UX

**Last reviewed:** 2026-07-05

> **Scanner status:** [scans.md](./scans.md) · **Shipped:** [finished.md](../finished/finished.md) · **Later:** [future_work.md](./future.md)

---

## Problem

The **scanner works.** The **UX does not yet.**

Today `scan s3` feels like AWS Console Lite:

```text
S3 Buckets          Findings
─────────────       ─────────────
bucket1             Finding
bucket2             Finding
bucket3             Finding
                    Finding
                    Finding
                    …
```

CloudPilot’s value is not displaying data. It is **guiding the user** — explaining what matters, tradeoffs, and next steps.

**Pause RDS** until S3 (and EC2) scans feel like an assistant, not a dashboard.

---

## Product philosophy

> **CloudPilot never changes cloud infrastructure without explaining why, the benefits, and the possible consequences.**

- **Unusual**, not **wrong** — AWS best practices are defaults, not universal truth (public website buckets, CDN origins, cross-account access, etc.).
- **Advisor**, not **alarm** — “Here’s what I found → why it matters → what changes if you fix it → you decide.”
- **Conversation first** — chat leads; Dashboard provides context, not the primary experience.

Example: **Block Public Access not fully enabled** does **not** mean the bucket is public. It means AWS would *allow* certain public configurations. Fixing it may be correct — or it may break an intentional public site.

---

## Target conversation flow (S3 demo)

This is the experience we are building toward.

### Step 1 — List buckets

```text
You:   show my S3 buckets

CloudPilot:
       Found 4 buckets.

       • insta-app-bucket-tutorial-two
       • elasticbeanstalk-us-west-2
       • elasticbeanstalk-us-east-1
       • codepipeline-us-west-2-…

       Which one would you like to inspect?
```

**Implementation note:** Prefer the EC2 pattern — Question `s3_inventory` → `scan_s3`
(see [feature_s3_inventory_ask](../finished/feature_s3_inventory_ask.md) and
[route inventory → scan](../how_to/route_inventory_question_to_scan.md)).
Inventory-phrase shortcuts via `inventory_aws` remain optional later.

### Step 2 — Scan one bucket

```text
You:   scan insta-app-bucket-tutorial-two
       (or: scan S3 bucket insta-app-bucket-tutorial-two)

CloudPilot:
       6 recommendations for insta-app-bucket-tutorial-two

       🔴 Encryption disabled
          Why: Objects are not encrypted at rest.
          Confidence: High — recommended for most private buckets.
          [Fix]

       🟡 Versioning disabled
          Why: Deleted files cannot be recovered from this bucket.
          Confidence: Medium — review storage and cost tradeoffs.
          [Fix]

       🟢 No lifecycle policy
          Why: Old objects may keep costing money.
          Confidence: Low — common on dev buckets.
          [Fix]
```

**Implementation note:** Optional `bucket` filter on `POST /scan/s3` + collect bucket name in `scan_s3` action (easy/medium).

### Step 3 — Account-wide scan (optional)

When the user says `scan s3` without a bucket name, **summarize first**, then offer drill-down:

```text
You:   scan s3

CloudPilot:
       Scanned 4 buckets.

       Most common recommendations:
       • 4 buckets — default encryption disabled
       • 4 buckets — versioning disabled
       • 4 buckets — no lifecycle policy
       • 2 buckets — missing Name tag

       Which bucket would you like to inspect?
       • insta-app-bucket-tutorial-two
       • elasticbeanstalk-us-west-2
       …
```

Do **not** dump 24 identical rows. Aggregate by recommendation, then drill down.

---

## Three layers (architecture)

```text
Layer 1 — AWS facts
  Scanner + rules (Atlas)
  Bucket, encryption, versioning, ACL, policy, tags, …

        ↓

Layer 2 — CloudPilot Knowledge
  What it means, benefits, tradeoffs, questions, confidence, safe action labels
  Owned by CloudPilot — not OpenAI

        ↓

Layer 3 — AI presentation (optional)
  Rewrite for tone, length, audience
  Only when needed — static text is fine for MVP demo
```

**Do not** send raw findings to OpenAI and ask it to invent meaning. CloudPilot owns accuracy; AI rewrites presentation if desired.

**Future:** Organization knowledge (Layer 2+) — “marketing-assets bucket is *expected* to be public” suppresses or reframes findings. Requires config store; not MVP.

---

## CloudPilot Knowledge (Layer 2)

One entry per `rule_id`. Example: `s3_public_access_block_disabled`

| Field | Example |
|-------|---------|
| **title** | Block Public Access is not fully enabled |
| **action_label** | Enable Block Public Access |
| **meaning** | AWS allows one or more public-access protections to be disabled on this bucket. |
| **why_it_matters** | Increases the chance the bucket could become public accidentally. |
| **benefits** | Prevents accidental exposure via future policies or ACLs. |
| **possible_impact** | May break workloads that intentionally require public S3 access. |
| **questions** | Is this bucket intentionally public? Hosting a website? Does another service rely on public access? |
| **confidence** | `medium` |
| **confidence_reason** | Preventive setting — bucket may still be completely private today. |
| **review_hint** | Review if intentional |

Rules stay thin (facts + trigger). Knowledge file holds voice and tradeoffs.

**Location (planned):** e.g. `services/knowledge/s3Rules.js` or JSON keyed by `rule_id`.

---

## CloudPilot Confidence

Teach users: **don’t blindly click Fix.**

Every recommendation can show:

```text
Confidence: Medium ★★★☆☆
Reason: Recommended for most private buckets; may break intentional public access.
```

| Level | When |
|-------|------|
| **High** | Clear signal (public ACL, missing encryption on sensitive pattern) |
| **Medium** | Good default, context-dependent (BPA, versioning, policy parsing) |
| **Low** | Organizational / cost hygiene (Name tag, lifecycle on dev buckets) |

Curated per rule in Knowledge file — no ML required for MVP.

Also show **scope**: “Applies to 4 of 4 buckets” vs “Applies to this bucket only.”

---

## Terminology

| Old | New (chat + Navigator) |
|-----|--------------------------|
| Findings | **Recommendations** |
| `ENABLE_PUBLIC_ACCESS_BLOCK` | **Enable Block Public Access** |
| Fix immediately | **Review if intentional** |

---

## Work tiers — what moves CloudPilot forward fastest?

### 🟢 Very easy (hours)

Presentation only. Huge ROI. No engine changes for most items.

- [ ] Rename Findings → Recommendations (chat + Navigator table title)
- [ ] Human-friendly action labels (Knowledge map or formatter)
- [ ] Aggregated account summary (“4 buckets — encryption disabled”)
- [ ] Group by severity (High / Medium / Low)
- [ ] “Show my S3 buckets” match phrases on inventory
- [ ] “Scan &lt;bucket-name&gt;” per-bucket scan
- [ ] Conversational wording (“review if intentional”)
- [ ] Static one-line explanation per rule in chat
- [ ] Better chat summaries (replace count-only messages)
- [ ] CloudPilot Confidence + reason (static per rule)
- [ ] Recommendation scope (“4 of 4 buckets”)

### 🟡 Easy / medium (1–3 days)

CloudPilot starts feeling **different** here.

- [ ] CloudPilot Knowledge file — one entry per S3 rule (8 rules)
- [ ] Advisor blocks: why / benefits / impact / questions
- [ ] Per-bucket drill-down in chat (full card list for one bucket)
- [ ] Optional OpenAI Layer 3 — rewrite Knowledge text only (with static fallback)
- [ ] Same pattern for EC2 scan message + knowledge

**Primary files:** `atlasS3MessageBuilder.js`, `atlasS3ScanNavigatorAdapter.js`, new knowledge file, optional `run_s3_scan` bucket filter.

### 🟠 Medium (several days)

Capability expansion — do **after** S3 conversation UX demos well.

- [ ] RDS / IAM / Security Groups / Lambda scanners
- [ ] Billing → dynamic “Scan S3” (when S3 tops spend)
- [ ] Recommendation cards in Kite (if beyond chat formatting)
- [ ] Fix button → Instructions only (first remediation slice)

### 🔴 Hard (weeks) — future CloudPilot

- Organization knowledge and exception policies
- Terraform / GitHub / Jira / Slack context
- Learning from feedback
- Enterprise policy engine

### 🔴 Very hard (months) — platform

- Automatic remediation, PR generation, approval workflows
- AI inferring organizational intent without config
- Cross-system reasoning

---

## MVP demo stack (recommended order)

1. Aggregated summary + bucket list + Recommendations rename  
2. Human labels + Confidence + review hints  
3. Knowledge file for 8 S3 rules  
4. Per-bucket scan phrase + drill-down chat  
5. One full advisor block (Block Public Access) + Fix → Instructions or “coming soon”  

Skip RDS until a real `scan s3` on your own account reads like a teammate.

---

## Fix button (future beat)

Scan → recommendation → **[Fix]** → choose path:

```text
• Automatic
• Pull Request
• AWS CLI
• Instructions
```

MVP: explain first; Fix can stub to Instructions or “coming soon.” Remediation wiring: [remediations.md](./remediations.md).

---

## Demo arc (when UX ships)

```text
Show my S3 buckets
  → list A, B, C, D
Scan bucket A
  → 6 recommendations for A (advisor voice)
Scan s3 (account)
  → aggregated summary → pick a bucket
```

Dashboard stays available for users who want the spreadsheet view.

---

## Related docs

- [scans.md](./scans.md) — rules, build order, Navigator shape  
- [remediations.md](./remediations.md) — change layer after scan  
- [future_work.md](./future.md) — deferred platform items  
