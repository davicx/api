# Useful Price — EC2 cost estimates from stored rates

## What this does

Make CloudPilot talk in **money**, not only infrastructure:

```text
Before:  t3.micro is running
After:   This EC2 instance costs about $0.25/day ($7.59/month).
Later:   Pausing it until Monday could save about $0.75.
```

Store **hourly On-Demand rates** in a small generic table. CloudPilot calculates
daily / monthly **estimates**. Never invent prices when no row exists.

## Current step

**Finished** — 2026-08-29. Steps 1–5 done.

## Next

_(none — archived)_ Nest `pricing/` under a supporting home later:
[Important Fixes follow-ups](../future/feature_message_reply_followups.md) / folder notes in Important Fixes history.

**Status:** Finished  
**Codename:** `feature_useful_price`  
**Related:** [Current Development](../current/current_development.md) · [CloudPilot MVP](../feature_mvp.md) · [Friendly Create EC2](./feature_friendly_create_instance.md) · [Pause / Resume](./feature_pause_instance.md) · [Important Fixes](./feature_important_fixes.md) (`pricing/` is a helper, not a pillar) · [Coding Style](../how_to/coding_style.md)

**SQL:**
* [cloud_service_pricing.sql](../../sql/cloud_service_pricing.sql) — table
* [seed/seed_cloud_service_pricing.sql](../../sql/seed/seed_cloud_service_pricing.sql) — two rows
* Also included in [master_sql.sql](../../sql/master_sql.sql)

**Code:**
* `cloudPilot/pricing/CloudServicePricing.js` — DB lookup
* `cloudPilot/pricing/estimatePricing.js` — ×24 / ×730 + pause savings + speak formatting
* `cloudPilot/scans/ec2/enrichEC2InstancesWithPricing.js` — attach estimates to scan instances
* Scan table Cost column in `atlasEC2ScanNavigatorAdapter.js` (after Name)
* Create READY / CONFIRM / SUCCESS cost lines when rate known
* Pause confirm / success savings line when verify supplies `instance_type`
* Question `ec2_compute_cost` (“what am I paying?”) → stored-rate estimate speak

---

## Feeling we want

> CloudPilot stops talking only in infrastructure terms and starts talking in money — with honest estimates, not fake precision.

---

## Locked decisions

| Topic | Decision |
|-------|----------|
| Scope (MVP) | **Two rows only** — `t3.nano` + `t3.micro`, `aws` / `ec2` / `us-west-2` / Linux On-Demand |
| What is stored | **Hourly rate** in `price` + `unit = hour` — never store daily/monthly |
| Who calculates | **CloudPilot** — `× 24` daily, `× 730` monthly |
| Language | Always **estimate / approximately** — not the bill |
| Missing rate | **Do not invent** — omit cost line (same honesty as Friendly Create) |
| Table shape | **Generic** `cloud_service_pricing` so S3/RDS can share later without a new table |
| Pricing API | **Out** — no live AWS Price List API yet; curated seed rows |
| Spot / RI / Savings Plans | **Out** for MVP |
| EBS / transfer / tax | **Out** — say compute On-Demand estimate only when speaking |
| Pause savings | **Default ~24h** — `hours × hourly`; omit when type/rate unknown |
| Atlas | Verify returns `instance_type` when known; pricing still lives in CloudPilot DB |

---

## Locked table

```sql
CREATE TABLE cloud_service_pricing (
    id INT AUTO_INCREMENT PRIMARY KEY,

    provider VARCHAR(50) NOT NULL,
    service VARCHAR(50) NOT NULL,
    region VARCHAR(50) NOT NULL,

    resource_type VARCHAR(100) NOT NULL,
    resource_name VARCHAR(100) NOT NULL,

    price DECIMAL(12, 6) NOT NULL,
    unit VARCHAR(50) NOT NULL,

    pricing_model VARCHAR(50) DEFAULT 'on_demand',
    operating_system VARCHAR(50) NOT NULL DEFAULT 'linux',

    currency VARCHAR(10) DEFAULT 'USD',

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_price (
        provider,
        service,
        region,
        resource_type,
        resource_name,
        pricing_model,
        operating_system
    )
);
```

**Note:** `operating_system` is `NOT NULL` with default `linux` so the unique key
behaves predictably in MySQL (NULL uniqueness is awkward).

### MVP seed rates (factual On-Demand Linux, us-west-2)

Source: public AWS EC2 On-Demand listings (Oregon / `us-west-2`), recorded for
plan lock **2026-08-11**. Re-check before applying seed if rates look stale.

| resource_name | price (USD/hour) | ≈ day (×24) | ≈ month (×730) |
|---------------|------------------|-------------|----------------|
| `t3.nano`     | `0.005200`       | `$0.12`     | `$3.80`        |
| `t3.micro`    | `0.010400`       | `$0.25`     | `$7.59`        |

Conceptual rows:

```text
aws | ec2 | us-west-2 | instance | t3.nano  | 0.005200 | hour | on_demand | linux
aws | ec2 | us-west-2 | instance | t3.micro | 0.010400 | hour | on_demand | linux
```

---

## CloudPilot calculations (owned by app)

```text
hourly  = stored price          (unit = hour)
daily   = hourly × 24
monthly = hourly × 730
pause   = hourly × hours        (MVP default hours = 24)
```

Friendly speak examples (estimates only):

```text
This EC2 instance costs about $0.25/day ($7.59/month)
at the stored On-Demand Linux rate for us-west-2.

Pausing for about 24 hours could save about $0.25
in compute On-Demand cost.
```

Always clarify scope when helpful: **compute On-Demand estimate** — not storage,
transfer, or total bill.

---

## Architecture (tiny)

```text
cloud_service_pricing (DB)
        │
        ▼
CloudPilot pricing lookup  →  hourly row or null
        │
        ▼
estimate helpers           →  { hourly, daily, monthly, … } / pause savings
        │
        ▼
speak hooks (create / pause / scan / “what am I paying?”)  — only when rate known
```

No pricing framework. No Atlas Price List client. One table, one lookup helper,
thin speak wiring.

---

## Where it shows up (shipped)

| Surface | What |
|---------|------|
| Create READY / CONFIRM / SUCCESS | Estimated compute cost when type + region have a row |
| Scan / findings table | Cost column (Est. monthly) after Name |
| Pause confirm / success | ~24h compute savings when verify stashed `instance_type` |
| “What am I paying?” Question | `ec2_compute_cost` — estimate from message values or open-request collected |

---

## Implementation steps

### Step 1 — SQL + seed

- [x] `doc/sql/cloud_service_pricing.sql`
- [x] `doc/sql/seed/seed_cloud_service_pricing.sql` (two rows; rates above)
- [x] Include in `master_sql.sql`
- [x] Apply locally

### Step 2 — Lookup + estimates

- [x] Tiny DB read by provider/service/region/resource_type/resource_name/…
- [x] `estimateFromHourly(price)` → daily / monthly
- [x] Return null / omit when no row — never invent

### Step 3 — Speak hooks + Scan table

- [x] Wire create guidance cost line when estimate known (READY / CONFIRM / SUCCESS)
- [x] Scan / findings table **Cost** column after Name (Est. monthly USD when type known)

### Step 4 — Pause savings + “what am I paying?”

- [x] Atlas verify returns `instance_type` (live + test mock)
- [x] Stash type onto open request collected after verify `found`
- [x] `hours × hourly` savings estimate on pause confirm/success (default 24h)
- [x] Label as estimate / compute On-Demand only; omit when no rate
- [x] Question `ec2_compute_cost` (Internal classify) → grounded estimate speak

### Step 5 — Acceptance

| Check | Expected | Proven |
|-------|----------|--------|
| Only hourly stored | Daily/monthly calculated in app | Offline helpers |
| Unknown type/region | No cost claim | `m5.xlarge` → null / honest refuse |
| Language | “about / approximately / estimate” | Speak formatters |
| Two rows work | `t3.nano` + `t3.micro` in `us-west-2` | Offline estimate |
| Generic table | Same schema usable later for S3 | Table shape unchanged |
| No Price List API | Seeded DB only | No API client |
| Friendly Create | Cost line appears only when estimate known | Steps 1–3 |
| Pause savings | Only when type + rate known | Helpers + confirm/success wire |
| Paying Question | Estimate or ask for region/type; never invent | Offline Question smoke |

**How Step 5 was proven (2026-08-29):** offline, no live OpenAI. Estimate + pause savings + Question classify/speak checks passed.

---

## Out of scope

- Full AWS Price List sync
- Every instance family / region
- Spot, Reserved, Savings Plans
- “Total AWS bill” claims
- Kite pricing admin UI
- Replacing AWS Cost Explorer / billing summary
- OpenAI classify for `ec2_compute_cost` (Internal phrases for MVP)

---

## Success criteria

```text
stored hourly truth → CloudPilot estimates → money in the demo
```

Two rows. One table. Honest language. Create + scan + pause + paying Question.
