# Spending Hard Limit — AWS + OpenAI

## What this does

Sets a **hard monthly spending cap** across CloudPilot-tracked costs:

```text
Total spend (this month) = AWS (estimated) + OpenAI (estimated)
        ↓
Below warning  → normal
Above warning  → allow + warn
Above hard cap → block new spend
```

**Hard limit means:** CloudPilot refuses to **start new paid work** — OpenAI calls and AWS write actions (create EC2, etc.). Read-only actions (scan, billing summary, AI usage card) still work so you can see where money went.

This is **not** AWS Budgets or account-wide shutdown. Charges from outside CloudPilot (console, other tools, always-on infra) still accrue; CloudPilot blocks only what it controls.

## Status

**Plan locked — awaiting Step 1.**

## Next

Say **do Step 1** to create the safety table and seed OpenAI limits (same as [CloudPilot Safety](./feature_cloud_pilot_safety.md) Step 1).

**Codename:** `spendingHardLimit`  
**Related:** [CloudPilot Safety](./feature_cloud_pilot_safety.md) (Phase 1 — OpenAI) · [AI Spending](../finished/feature_ai_spending.md) · [Billing](../future/billing.md) · [Useful Price](./feature_useful_price.md) · [Current Development](./current_development.md)

---

## Goal (one sentence)

Give CloudPilot one monthly **hard cap** on combined AWS + OpenAI spend, with honest estimates per source, and enforce it at every place CloudPilot can spend money.

---

## What already works (reuse, do not rebuild)

| Source | Measure spend | Status |
|--------|---------------|--------|
| **OpenAI** | `cloud_pilot_ai_usage` → `GET /ai/usage/summary` | ✅ Live |
| **AWS actual** | Atlas `POST /billing/summary` → Cost Explorer by service | ✅ Live (read-only) |
| **AWS estimate (EC2)** | `cloud_service_pricing` + `estimatePricing.js` | ✅ Live (t3.nano/micro) |
| **OpenAI gate (planned)** | `cloud_pilot_safety` + `checkSpendingLimit()` | 📋 [Safety doc](./feature_cloud_pilot_safety.md) — not coded yet |
| **Dashboard cards** | `AiUsageCard`; billing via chat `show_billing` | ✅ Partial — no unified total |

**Design rule (locked):**

```text
Usage tables / Cost Explorer  →  “How much have we spent?”
cloud_pilot_safety            →  “Are we allowed to spend more?”
Enforcement points            →  “Stop before the call that costs money”
```

Do **not** store `current_spend` in the safety table. Always compute from sources at check time.

---

## Spend model — two buckets, one total

### Bucket A — OpenAI (real-time, app-scoped)

- **Source:** Sum `estimated_cost` from `cloud_pilot_ai_usage` for current calendar month.
- **Accuracy:** Estimated from your rate table; label UI **Estimated OpenAI spend**.
- **Scope:** Only calls CloudPilot made (correct for this product).

### Bucket B — AWS (Cost Explorer + optional projection)

- **Primary source:** Atlas `get_spend_by_service()` — unblended cost by service, MTD or rolling 30 days aligned to **calendar month** for limit checks.
- **Services:** All services Cost Explorer returns (EC2, S3, RDS, Lambda, …). No manual service list to maintain.
- **Lag:** Cost Explorer is typically **~24 hours** behind. Plan must say so in UI and chat copy.
- **Optional projection (Phase 3):** For running EC2 instances with known hourly rates, add **projected remainder-of-month** so the total is less stale:

```text
aws_total = cost_explorer_mtd + projected_ec2_until_month_end
```

Projection uses existing `enrichEC2InstancesWithPricing` data from the latest EC2 scan. If no scan or no rate row → use Cost Explorer MTD only (honest, no fake precision).

### Combined total

```text
total_spend_usd = openai_mtd + aws_mtd   (+ optional aws_projection)
remaining_usd   = hard_limit - total_spend_usd
```

---

## Limits — one global cap + per-service rows (optional)

### V1 (recommended): Global monthly hard cap

One row in `cloud_pilot_safety`:

```text
user_id:          1
service:          total          ← special rollup key
spending_enabled: true
warning_limit:    80.00
hard_limit:       100.00
limit_period:     monthly
action:           block
```

`checkSpendingLimit(userId, 'total')` aggregates OpenAI + AWS before deciding.

### V1b: Per-service rows (same table, already designed)

Keep generic `service` column for future fine control:

| service | Example hard limit | Enforcement |
|---------|-------------------|-------------|
| `openai` | $5/mo | Block OpenAI in `openAIClient.js` |
| `aws` | $95/mo | Block AWS write actions |
| `total` | $100/mo | Block **both** when combined exceeds cap |

**Locked for MVP:** Implement `openai` + `total` first. Add `aws`-only row in Phase 3 if you want separate AWS ceiling.

---

## Enforcement map

Hard limit = **block before money moves**.

| Spend type | Enforcement point | On block |
|------------|-------------------|----------|
| OpenAI chat / classify | `providers/openAI/client/openAIClient.js` → `createOpenAiChatCompletion` | Return blocked outcome; caller uses Internal fallback (existing Safety design) |
| Create EC2 | `executionFunctions.js` before `runAction('create_ec2')` | Fail execution; friendly message: at spending limit |
| Toggle / pause / resume EC2 | Same gate (optional Phase 3b — pause **saves** money; default **allow**) | — |
| Delete EC2 | Allow (reduces future spend) | — |
| Scans (S3, EC2) | Allow (read-only; Cost Explorer API is free tier / negligible) | — |
| `show_billing`, `show_ai_usage` | Allow | — |
| S3 remediations (future) | Same gate as create when they incur cost | Block with reason |

**Single decision function:**

```text
cloudPilot/spending/checkSpendingLimit.js
  checkSpendingLimit({ userId, service, actionType? })
    → { allowed, warning, reason, spendSnapshot }
```

Callers never duplicate limit math.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    cloud_pilot_safety                    │
│         warning_limit / hard_limit / spending_enabled    │
└──────────────────────────┬──────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────────┐
│ OpenAI spend    │                 │ AWS spend           │
│ cloud_pilot_    │                 │ Atlas billing/summary│
│ ai_usage (MTD)  │                 │ + optional EC2 proj │
└────────┬────────┘                 └──────────┬──────────┘
         │                                     │
         └──────────────┬──────────────────────┘
                        ▼
           checkSpendingLimit(userId, 'total')
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
    openAIClient.js           executionFunctions.js
    (before OpenAI)           (before create_ec2, …)
```

### New / extended code homes

```text
cloudPilot/spending/
  checkSpendingLimit.js          ← decision owner
  getSpendSnapshot.js            ← OpenAI + AWS totals for UI/chat
  functions/spendingFunctions.js ← DB read for cloud_pilot_safety

providers/openAI/client/openAIClient.js   ← OpenAI enforce
cloudPilot/execution/functions/executionFunctions.js  ← AWS write enforce

capabilities/spending/getSpendSnapshot.js ← optional Atlas+billing glue
routes/spendingRoutes.js                  ← GET /spending/summary
```

---

## API + UI

### `GET /spending/summary`

Returns unified snapshot for Dashboard + chat:

```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "limits": {
      "warning_usd": 80,
      "hard_usd": 100,
      "enabled": true
    },
    "openai": { "mtd_usd": 11.72, "label": "estimated" },
    "aws": {
      "mtd_usd": 42.30,
      "by_service": [
        { "service": "EC2", "amount_usd": 28.50 },
        { "service": "S3", "amount_usd": 3.20 }
      ],
      "label": "cost_explorer",
      "lag_hours": 24
    },
    "total_mtd_usd": 54.02,
    "remaining_usd": 45.98,
    "status": "ok"
  }
}
```

`status`: `ok` | `warning` | `blocked` (at or over hard limit).

### Dashboard — `SpendingLimitCard` (new)

Place near top of Dashboard (alongside or replacing hidden `AiUsageCard`):

```text
Spending (this month)     $54.02 / $100.00
  AWS (estimated)         $42.30
  OpenAI (estimated)      $11.72
Status: OK · ~$46 remaining
```

No graphs in V1. Link “View breakdown” → chat `show spending` or expand inline service list.

### Chat

| Phrase | Action |
|--------|--------|
| `show my spending` / `spending limit` / `am I over budget` | New question `spending_summary` → handler loads `getSpendSnapshot` |
| At hard limit on create | Execution failure message includes current total + limit |

Reuse [Questions](../finished/feature_questions.md) pattern; do not mix with `show_billing` (AWS-only) or `show_ai_usage` (OpenAI-only).

---

## Phased delivery

Build in order. Each phase is shippable alone.

### Phase 1 — OpenAI hard limit (≈ CloudPilot Safety V1)

**Doc:** [feature_cloud_pilot_safety.md](./feature_cloud_pilot_safety.md)

- [ ] Step 1: `cloud_pilot_safety` table + seed `openai` row
- [ ] Step 2: `checkSpendingLimit(userId, 'openai')`
- [ ] Step 3: Gate `createOpenAiChatCompletion`
- [ ] Step 4: Warning log + hard block → Internal fallback
- [ ] Step 5: Offline verification

**Acceptance:** Spend over hard limit → no new OpenAI calls; chat still works via Internal.

---

### Phase 2 — Unified spend snapshot (read-only)

- [ ] `getSpendSnapshot.js` — OpenAI MTD + AWS MTD from existing APIs
- [ ] `GET /spending/summary`
- [ ] `SpendingLimitCard` on Dashboard
- [ ] Chat question `spending_summary` + handler
- [ ] Seed `total` row in `cloud_pilot_safety` (limits only; enforcement in Phase 3)

**Acceptance:** Dashboard and chat show combined total with AWS service breakdown; no blocking yet except Phase 1 OpenAI.

---

### Phase 3 — AWS write-action hard limit

- [ ] Extend `checkSpendingLimit` for `service: 'total'` and `'aws'`
- [ ] Gate `create_ec2` (and future paid remediations) in `executionFunctions.js`
- [ ] Friendly blocked message with `$X of $Y used`
- [ ] Optional: EC2 projection in AWS bucket (document in UI as estimate)

**Acceptance:** With MTD total ≥ hard limit, `create ec2` fails before Atlas call; scans and billing still work.

---

### Phase 4 — Polish (later)

- [ ] Email / notification on warning (out of scope for MVP)
- [ ] Per-action **pre-flight estimate** (“This instance ≈ $7.59/mo — you have $46 left”)
- [ ] Reconcile OpenAI against OpenAI Costs API (finance-grade)
- [ ] AWS Budgets **alert** (read-only webhook — does not replace CloudPilot gate)
- [ ] Admin UI to edit limits (V1: SQL seed / env defaults)

---

## Table shape (same as Safety — one table)

```sql
CREATE TABLE cloud_pilot_safety (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    service VARCHAR(50) NOT NULL,       -- openai | aws | total
    spending_enabled TINYINT(1) NOT NULL DEFAULT 1,
    warning_limit DECIMAL(10, 2) NOT NULL,
    hard_limit DECIMAL(10, 2) NOT NULL,
    limit_period VARCHAR(20) NOT NULL DEFAULT 'monthly',
    action VARCHAR(20) NOT NULL DEFAULT 'block',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_safety_user_service (user_id, service)
);
```

Example seed (one user, $100 total, $5 OpenAI sub-cap):

```sql
INSERT INTO cloud_pilot_safety (user_id, service, spending_enabled, warning_limit, hard_limit, limit_period, action)
VALUES
  (1, 'openai', 1, 3.00,  5.00,  'monthly', 'block'),
  (1, 'total',  1, 80.00, 100.00, 'monthly', 'block');
```

---

## Open decisions (lock before Phase 3)

| Question | Recommendation |
|----------|----------------|
| No safety row for user? | **Default ALLOW** + log warning (same as Safety doc) |
| Calendar month vs rolling 30 days? | **Calendar month** for limits; billing card can still show 30-day view |
| Block pause/resume at limit? | **No** — pause saves money; resume allowed unless you want stricter policy |
| AWS lag at limit boundary? | Block on **known** totals only; show disclaimer: “AWS portion may lag ~24h” |
| Mock / Atlas Test mode? | Test billing route returns fixed totals; spending gate uses same mock path |

---

## Acceptance (full feature)

| Scenario | Expect |
|----------|--------|
| Under warning | All spend paths allowed |
| Above warning, below hard | Allowed + warning in logs / card status |
| Above hard, OpenAI request | Blocked; Internal fallback |
| Above hard, `create ec2` | Blocked before Atlas; clear message |
| Above hard, `scan ec2` / `show billing` | Allowed |
| Dashboard | Shows AWS + OpenAI + total vs limit |
| Chat “what’s my spending?” | Unified summary, not two separate answers |

---

## What this explicitly does not do

- Shut down running EC2 or S3 in AWS automatically
- Enforce limits on AWS Console or other apps
- Guarantee real-time AWS totals (Cost Explorer lag)
- Replace AWS Budgets / Cost Anomaly Detection (optional complement later)
- Cap token usage per request (only monthly dollar cap)

---

## Relationship to CloudPilot Safety

[feature_cloud_pilot_safety.md](./feature_cloud_pilot_safety.md) is **Phase 1** of this plan. Implement Safety first unchanged; then Phase 2–3 extend the same `cloud_pilot_safety` table and `checkSpendingLimit()` to AWS + `total`.

When Phase 1 ships, mark Safety finished and keep this doc as the umbrella through Phase 3.
