# Useful Costs — a dollar amount next to a named resource

## What this is

CloudPilot can already describe configuration. It cannot yet say:

```text
S3 bucket Davey is about $3/month.
EC2 is about $11/month.
```

**Status:** Plan. Do not implement from this file until a step is chosen.  
**Codename:** `feature_useful_costs`  
**Related:** [Useful Price](../finished/feature_useful_price.md) (shipped EC2 hourly estimates) · [billing.md](../future/billing.md) (`show_billing`, real AWS bill, out of this plan)

This plan does **not** read the AWS bill. No Cost Explorer, no Price List API, no `GetCostAndUsage`. The dollar amount is our estimate: a rate we store, times a quantity we already know or can put on the scan.

---

## Feeling we want

> A person looking at the dashboard, or asking in chat, sees what a named bucket or the EC2 fleet is roughly costing — labeled as an estimate, omitted when we do not have the inputs.

---

## What already exists

| Piece | Today | Gap |
|-------|--------|-----|
| `cloud_service_pricing` | Hourly On-Demand rows for `t3.nano` and `t3.micro` in `us-west-2` | No S3 rows. No other instance types |
| `estimatePricing.js` | `hourly × 730` → monthly. Missing row → null. Speak says “about” | Only the hour unit |
| EC2 scan | `enrichEC2InstancesWithPricing` sets `estimatedMonthlyCost` | — |
| EC2 navigator table | Column `estimated_monthly_cost`, label Cost | Chat scan table only |
| Dashboard EC2 | `buildFriendlyEC2Instances` builds `costLabel` | The EC2 table does not render it. Columns are Instance, Type, State, Health, Findings |
| Dashboard S3 | Bucket, Region, Health, Findings | No cost field anywhere on a bucket |
| S3 rules | Configuration (versioning, public access, lifecycle, encryption, tags) | `estimated_monthly_savings` is null. Rules do not know size or price |
| `show_billing` | Cost Explorer, last 30 days, **by service** | “S3 $3.20” for the whole account. Not “bucket Davey”. Leave it alone |

So “EC2 is about $X/month” is mostly a display and a sum of numbers we already calculate. “Bucket Davey is about $3/month” is new, because a bucket has no size and no stored price.

---

## How a number is made

Two inputs. If either is missing, do not invent a dollar amount.

```text
estimate = quantity × stored rate
```

| Resource | Quantity | Rate | Unit in the table |
|----------|----------|------|-------------------|
| One EC2 instance | `1` if state is running | hourly On-Demand for that instance type and region | `hour` (already stored). Monthly = hourly × 730 |
| EC2 as a group | count of running instances that have a rate | same rows | sum of those monthly estimates |
| One S3 bucket | gigabytes stored | price per GB-month for that region and storage class | `gb-month` (new rows, same table) |

Language stays the same as Useful Price: **about**, **estimate**, and what the number leaves out.

```text
S3 bucket Davey is about $2.99/month
in Standard storage for us-west-2 (about 130 GB).
Requests, transfer, and other storage classes are not included.

EC2 is about $11.39/month
in compute On-Demand for 2 running instances with a stored rate.
1 instance has no stored rate and is not included.
```

Stopped instances contribute **$0 compute**. EBS, public IPv4, data transfer, and tax stay out of the sentence.

---

## EC2 — use the estimate we already have

A running `t3.micro` in `us-west-2` is already about **$7.59/month** (`0.010400 × 730`). A running `t3.nano` is about **$3.80/month**. Two of those running is about **$11.39/month**. That is the “EC2 is costing $X a month” line. It is not the AWS bill.

### Where the quantity comes from

The scan already has `instanceType`, `region`, and `state`. No new AWS call.

### Where the rate comes from

`cloud_service_pricing`, lookup already in `CloudServicePricing.findHourlyRate` / `findHourlyRatesForNames`. Unknown type or region → that instance is left out of the sum, and the sentence says how many were left out.

### Where it should show

1. Dashboard EC2 table: a Cost column from `costLabel` (already computed, not rendered).
2. Above that table: one line, the sum, for running instances only.
3. Chat can reuse `estimatedCostSpeak` on a single instance. A fleet sentence is the new bit.

Do not add instance types in this step unless a scan we care about is not nano/micro. Missing rate stays blank.

---

## S3 — size times a stored GB price

S3 is not “one bucket, one price.” The bill is storage class × gigabytes, plus requests, plus data transfer, plus extra copies from versioning. This feature only estimates **one storage class in one region**.

### Worked example

Public S3 Standard price in `us-west-2` has long been **$0.023 per GB-month** for the first 50 TB. Re-check that figure before seeding. Do not treat it as live.

```text
Davey holds about 130 GB
rate = 0.023 USD per GB-month
monthly = 130 × 0.023 = 2.99
```

That is the “about $3/month” sentence. It is storage only.

### Where the rate comes from

Same table. New kind of row. Do not store the monthly total.

```text
aws | s3 | us-west-2 | storage | standard | 0.023000 | gb-month | on_demand | n/a
```

`operating_system` is `NOT NULL` today (default `linux`) because of the EC2 unique key. An S3 row can use a non-Linux placeholder such as `n/a` so it does not pretend to be Linux compute. Lookup for S3 must pass that value. Do not change the EC2 unique key in this feature.

`estimatePricing.js` needs a second helper. Do not run `× 730` on a GB-month price.

```text
monthly = gigabytes × price     (unit = gb-month)
```

Missing region or missing `standard` row → omit the cost. Same rule as an unknown instance type.

### Where the gigabytes come from

The S3 scan does not collect size today. Buckets are name, region, and configuration findings. Until `sizeGb` is on the bucket, the dashboard shows no S3 dollar amount.

Size is usage, not a cost API. Two ways to get it, in order:

1. **Mock / sandbox first.** Put `size_gb` on the fake bucket (Davey = 130). Proves the sentence and the column with no AWS.
2. **Later, a scan field from CloudWatch.** `BucketSizeBytes` for that bucket, `StorageType = StandardStorage`, latest daily point, bytes ÷ `1024³` → `sizeGb`. That metric is published by AWS once a day and is not the bill. It is the right quantity if we want a real bucket. List-every-object is the wrong way (slow, request-priced, easy to miss versions).

Versioning makes this honest only if the byte metric includes the bytes we mean. `StandardStorage` is current Standard objects, not Glacier and not a full request bill. The sentence says “Standard storage,” not “this bucket’s AWS bill.”

### Where it should show

1. Dashboard S3 table: Cost column. Blank when `sizeGb` or the rate is missing.
2. Bucket detail: “about 130 GB · about $2.99/month Standard storage.”
3. Chat, when someone asks what a named bucket costs: same sentence, or a short refusal if size or rate is missing.

---

## What we will not say

| Tempting sentence | Why not |
|-------------------|---------|
| “Davey accounts for $3 of the S3 bill” | We are not reading the bill, and one bucket is not a share of Cost Explorer’s S3 total |
| “EC2 costs $5 this month” with no “about” | The number is a list price × hours, not UnblendedCost |
| A dollar amount when the rate or size is missing | Useful Price already forbids inventing prices |
| Savings from lifecycle / versioning rules | Those rules still have null `estimated_monthly_savings`. A cost column does not make them savings findings |

`show_billing` can still say “S3 was $3.20 over the last 30 days” for the account. That number and these estimates are allowed to disagree. Do not merge them into one “total.”

---

## Locked decisions

| Topic | Decision |
|-------|----------|
| Source of dollars | Stored `cloud_service_pricing` only |
| AWS bill | Out. Do not call Cost Explorer for this feature |
| Price List API | Out. Curated rows, same as Useful Price |
| EC2 quantity | Running instance = 1. Stopped = $0 compute. Sum the ones with a rate |
| EC2 display | Show the cost we already attach. Add a fleet sum |
| S3 quantity | `sizeGb` on the bucket. No size → no price |
| S3 rate | `unit = gb-month`, resource `standard`, one region to start (`us-west-2`) |
| S3 math | `gigabytes × price`. Not × 730 |
| First S3 proof | Mock `size_gb`, not a new live CloudWatch call |
| Honesty | “about” / estimate. Name what is excluded |
| Unknown input | Omit that resource. Say how many were omitted when summing |

---

## Steps

### Step 1 — Show EC2 estimates that already exist

- Dashboard EC2 table renders `costLabel`.
- Header line sums `estimatedMonthlyCost` for `running` instances.
- Instances with no rate are counted in the “not included” clause, not given $0 as if we priced them.
- No new seed rows required for nano/micro in `us-west-2`.

### Step 2 — S3 rate + GB math

- Seed one `gb-month` row after re-checking the public Standard price.
- `estimateFromGigabyteMonth` next to `estimateFromHourly`.
- Unit other than `hour` must not go through the × 730 path.

### Step 3 — Size on the bucket, mock first

- Scan bucket object gains optional `sizeGb`.
- Mock AWS bucket can carry it (Davey = 130 → about $2.99).
- Live scan leaves it unset until a later CloudWatch step. Unset → blank cost, not zero.

### Step 4 — S3 column + named sentence

- Dashboard S3 Cost column and bucket detail line.
- Chat sentence for a named bucket when both inputs exist.

### Step 5 — Acceptance

| Check | Expected |
|-------|----------|
| Running `t3.micro` us-west-2 | About $7.59/month on the dashboard |
| Stopped instance | $0 compute, not the full monthly rate |
| Unknown instance type | Blank cost, excluded from the EC2 sum, mentioned as not included |
| Davey 130 GB + Standard row | About $2.99/month |
| Bucket with no size | No dollar amount |
| No Cost Explorer call | This feature does not use `getBillingSummary` |
| Wording | Estimate, and storage-only or compute-only |

---

## Costs page — checklist to make the mock real

The design mock is `kite/atlas/src/pages/design/CostsPage.js` (“Your AWS costs”). Every number on it is hardcoded. Replacing the JSX with an API call is the small part. Each block below is real only when its data exists. Blank is better than a copied mock number.

Steps 1–4 above fill the **resource “this month”** column for EC2 (known rates) and S3 (known size). They do not fill month-to-month history. Service totals and the chart are a later billing read. Do not merge that bill with these estimates into one unlabeled total.

| Done when | Block on the page | What “real” means |
|-----------|-------------------|-------------------|
| [ ] | Page is not the design mock | `/costs` reads an API. No `$42.18` left in the component |
| [ ] | Current month | One account total for a named month, from Cost Explorer. Today’s `show_billing` is the last 30 days by service, not “September 2026” |
| [ ] | ↑ or ↓ from last month | The same total for the previous month. Needs two periods, not one |
| [ ] | Projected month | Labeled as a pace guess (month so far, extended) or left off. Not a fake forecast |
| [ ] | Potential savings | Sum only where a finding already has `estimated_monthly_savings`. EC2 low CPU can. S3 rules are null, so they add nothing. “2 opportunities” only if two such findings exist |
| [ ] | Cost over time | Daily or monthly points kept from Cost Explorer (the billing call already asks for daily groups, then throws the days away). 30 days, 6 months, and 1 year are three ranges of that series |
| [ ] | Cost by service | EC2, S3, and whatever else Cost Explorer returns (Data Transfer, Other). Map AWS service names. This is account spend, not the sum of the resource estimates |
| [ ] | Insight: instance barely used | A real low-CPU finding for that instance, with a link to it. No insight if the scan has none |
| [ ] | Insight: S3 went up because of one bucket | Off until a bucket has two months of its own number. Do not say `wishlist-images` “accounts for” an increase from the service total alone |
| [ ] | Resources table, this month | One row per instance or bucket we can price. EC2: stored rate × 730 when the type is known. S3: `sizeGb` × GB-month rate. Unknown → no row, or a row with no dollar amount |
| [ ] | Resources table, last month and change | A second stored or billed number for that same resource. Estimates have no last month. Leave those cells blank until then |

Order that matches the difficulty:

1. Wire the page and show **cost by service** plus a **current total** from the billing summary that already exists.
2. Keep the daily series so **last month**, the **change**, and the **chart** are the same source.
3. Show **this month** on named EC2 and S3 rows from Steps 1–4. Savings insight only from findings that already carry a savings figure.
4. Last month and percent change **per resource**, and the “this bucket caused the increase” insight, wait until that per-resource history exists.

---

## Out of scope

- Steps 1–4 calling Cost Explorer. The Costs page checklist uses it later for account totals, the chart, and month-to-month service spend. Those totals stay labeled as the bill, separate from the rate × quantity estimates
- CUR, cost allocation tags, and claiming one bucket’s share of the S3 bill
- AWS Price List sync
- Requests, data transfer, Glacier, Intelligent-Tiering, replication
- EBS, Elastic IP, tax
- Turning configuration findings into savings dollars
- A unified AWS + OpenAI spend cap
