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

**Steps 1–3 done** — SQL applied, lookup/estimates live, create speak + scan
**Cost** column (after Name) wired. Pause savings / “what am I paying?” still optional.

## Next

Say **do Step 4** for pause savings / “what am I paying?”, or **do Step 5** acceptance
and move to finished.

**Status:** Active (Steps 1–3 done)  
**Codename:** `feature_useful_price`  
**Related:** [Current Development](./current_development.md) · [CloudPilot MVP](./feature_mvp.md) · [Friendly Create EC2](../finished/feature_friendly_create_instance.md) · [Pause / Resume](../finished/feature_pause_instance.md) · [Important Fixes](../finished/feature_important_fixes.md) (`pricing/` is a helper, not a pillar) · [Coding Style](../how_to/coding_style.md)

**SQL:**
* [cloud_service_pricing.sql](../../sql/cloud_service_pricing.sql) — table
* [seed/seed_cloud_service_pricing.sql](../../sql/seed/seed_cloud_service_pricing.sql) — two rows
* Also included in [master_sql.sql](../../sql/master_sql.sql)

**Code:**
* `cloudPilot/pricing/CloudServicePricing.js` — DB lookup
* `cloudPilot/pricing/estimatePricing.js` — ×24 / ×730 + speak formatting
* `cloudPilot/scans/ec2/enrichEC2InstancesWithPricing.js` — attach estimates to scan instances
* Scan table Cost column in `atlasEC2ScanNavigatorAdapter.js` (after Name)
* Create READY / CONFIRM / SUCCESS cost lines when rate known

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
| Pause savings | **Later** (Step 4 optional) — `hours × hourly`; not required for Step 1–3 |
| Atlas | **Unchanged** — pricing lives in CloudPilot DB, not Atlas mocks |

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
```

Friendly speak examples (estimates only):

```text
This EC2 instance costs about $0.25/day ($7.59/month)
at the stored On-Demand Linux rate for us-west-2.

(Later) Pausing it for ~3 days could save about $0.75
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
estimate helpers           →  { hourly, daily, monthly, currency, … }
        │
        ▼
speak hooks (create / pause / inventory)  — only when rate known
```

No pricing framework. No Atlas Price List client. One table, one lookup helper,
thin speak wiring.

---

## Where it shows up (product answer)

All three surfaces are valid — different timing:

| Surface | When | MVP? |
|---------|------|------|
| **End of create EC2** (READY / CONFIRM / SUCCESS) | As soon as Step 2–3 land — type + region known → estimate line | **Yes — first** |
| **Scan / findings table** | Column or cell like Est. $/mo when `instance_type` + region have a row | **Yes — strong demo** (Step 3) |
| **“What am I paying?”** chat | Question path: need a target instance (selected finding / open context / scan result) → lookup rate → speak estimate | **Later** (after create + scan; like AI spend Question pattern) |

**Recommended MVP order:** create speak first (instant money after approve), then Scan table column, then a dedicated “what am I paying” Question.

Still always: **estimate / compute On-Demand only** — never invent when no row.

---

## Where it shows up (MVP speak order)

| Priority | Surface | What to say |
|----------|---------|-------------|
| 1 | Create READY / CONFIRM / SUCCESS | Estimated compute cost when type + region have a row |
| 2 | Scan / findings table | Est. daily or monthly for known types |
| 3 | Pause SUCCESS / confirm | Optional savings line |
| Later | “What am I paying?” Question | Estimate for selected / named instance |

Friendly Create already forbids inventing cost — this feature is the **honest
data source** that unlocks those lines.

---

## Implementation steps (after approval)

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
- [ ] Optionally pause one-liners
- [ ] Smoke OpenAI off + Atlas Test create/pause using `t3.micro` (manual chat pass)

### Step 4 — Optional: pause savings + “what am I paying?”

- [ ] `hours × hourly` savings estimate on pause confirm/success
- [ ] Label as estimate / compute only
- [ ] Optional Question: “what am I paying?” for selected instance

### Step 5 — Acceptance

| Check | Expected |
|-------|----------|
| Only hourly stored | Daily/monthly calculated in app |
| Unknown type/region | No cost claim |
| Language | “about / approximately / estimate” |
| Two rows work | `t3.nano` + `t3.micro` in `us-west-2` |
| Generic table | Same schema usable later for S3 (`gb_month`, etc.) |
| No Price List API | Seeded DB only |
| Friendly Create | Cost line appears only when estimate known |

---

## Out of scope

- Full AWS Price List sync
- Every instance family / region
- Spot, Reserved, Savings Plans
- “Total AWS bill” claims
- Kite pricing admin UI
- Replacing AWS Cost Explorer / billing summary

---

## Success criteria

```text
stored hourly truth → CloudPilot estimates → money in the demo
```

Two rows. One table. Honest language. Big demo upgrade.
