# First useful AWS costs — the account bill on the Costs page

## What this is

Chat can already ask AWS what the account spent. The Costs page still shows a design mock (`$42.18`, a projected month, potential savings, and named resources such as `cloudpilot-demo`).

This feature puts the same Cost Explorer report in both places:

1. Chat, through the existing `show_billing` capability.
2. The Costs page, through an authenticated read of that same report.

**Status:** Plan. Do not implement from this file until a step is chosen.  
**Codename:** `feature_first_useful_aws_costs`  
**Related:** [Useful Costs](feature_useful_costs.md) (estimates next to a named bucket or instance; leave that plan alone) · [billing.md](../future/billing.md)

The number is historical **UnblendedCost** from AWS Cost Explorer. It is account-level actual spending for the billing view the current Atlas credentials can see. It is not a price-list estimate, and AWS may still revise recent days.

---

## Feeling we want

> A person opens Costs, or asks in chat, and sees what AWS charged over the last 30 complete days: one total, each day, and each service. The page says these are account charges, not the cost of one environment or one database.

---

## What already exists

| Piece | Today | What this feature changes |
|-------|--------|---------------------------|
| `atlas/app/core/cloud/billing/get_spend_by_service.py` | `GetCostAndUsage`, daily, `UnblendedCost`, grouped by `SERVICE` | Keep that query. Add paging, daily rows, UTC dates, and unrounded totals |
| `atlas/app/api/services/billing_service.py` | `run_billing_summary`; accepts `period_days` from 1 to 365 | This report always uses 30 complete UTC days |
| `atlas/app/api/routes/billing_route.py` | `POST /billing/summary` | Same route. Richer `data` |
| `api/.../providers/atlas/billing/getBillingSummary.js` | Node calls Atlas `POST /billing/summary` | Dashboard and chat both use this call |
| `show_billing` | `billingAWSHandler.js` → message + navigator | Message uses the shared result. No second billing path |
| Costs page | `kite/atlas/src/pages/design/CostsPage.js`, route `/costs` | Replace the mock with the report |
| AWS access | One named profile, `PROFILE = "atlas"` in `atlas/app/config/config.py` | Keep it. There is no per-user AWS connection yet |
| IAM note | `billing.md` already requires `ce:GetCostAndUsage` | No new permission |
| Chart library | None in `kite/atlas/package.json` | A small inline SVG on the page |

Current query behavior worth keeping in mind:

- `End` is already exclusive and set to “today,” so a local-date run on 15 October already covers 15 September through 14 October. The change is to compute that window in **UTC**, and to return every day.
- Amounts `<= 0` are dropped, then each service is rounded to cents before the total. This feature sums the raw amounts and keeps negatives.
- Service names are shortened in Python (`EC2`, `RDS`, `S3`). This feature returns AWS’s name from the aggregator. Chat and the page apply the short labels.
- Only the first Cost Explorer page is read. `NextPageToken` is ignored.
- `ResultsByTime[].Estimated` is ignored.
- The test double is `atlas/app/api/routes/test/billing_route_test.py`. It returns four service rows and no days.

---

## How a number is made

One AWS call family per request. The browser never supplies credentials, a period, or a second set of totals.

```text
UTC today
  → startDate = today minus 30 days
  → endDateExclusive = today
  → GetCostAndUsage (daily, UnblendedCost, group by SERVICE, every page)
  → one result: total, 30 days, nonzero services
```

If UTC today is 15 October 2026, the window is `2026-09-15` inclusive through `2026-10-15` exclusive. The last included day is 14 October. The Costs page says **Last 30 complete days** and prints those dates from the response. The page does not compute the window itself.

### Calculation rules

Use `decimal.Decimal` in the Python aggregator. Sum first. Round only when a screen or chat sentence displays cents.

| Figure | Rule |
|--------|------|
| Day | Sum every service amount on that date |
| Service | Sum that service across the window |
| Total | Sum of the daily amounts. It must also equal the sum of the service amounts |
| Missing day | Amount `0`. Still return the day |
| Day order | Ascending date. Always 30 entries |
| Service order | Amount descending, then service name ascending |
| Zero service | Omit when the exact period total is zero |
| Negative amount | Keep it |
| Tiny amount | Keep it in the result, even if two-decimal display would show `0.00` |
| Currency | Read `UnblendedCost.Unit`. If any group is not `USD`, fail the report. Do not add mixed units |
| Estimated | `hasEstimatedData` is true when any returned day has `Estimated: true` |

Display amounts are decimal strings in the API (`"42.18"`). The chart may convert a string to a number to draw a bar. It does not add those numbers into a new total.

### Service names

The result keeps AWS’s string, for example `Amazon Relational Database Service`.

Chat and the Costs page may show a short label when the name contains a known phrase:

| AWS name contains | Label |
|-------------------|--------|
| Amazon Elastic Compute Cloud | EC2 |
| Amazon Relational Database Service | RDS |
| Elastic Load Balancing | Elastic Load Balancing |
| Amazon Simple Storage Service | S3 |
| Elastic Beanstalk | Elastic Beanstalk |

Any other name is shown as AWS sent it. A service does not need to be in this list to appear. RDS shows up on its own when AWS returns a nonzero RDS total. An Elastic Beanstalk line is whatever AWS billed to that service name. It is not the sum of the EC2 and load-balancing lines underneath an environment.

---

## Shared result

Extend the payload of `POST /billing/summary`. Chat and the Costs page both read it. They format text. They do not re-sum AWS.

```json
{
  "period": {
    "startDate": "2026-09-15",
    "endDateExclusive": "2026-10-15",
    "label": "Last 30 complete days"
  },
  "currency": "USD",
  "metric": "UnblendedCost",
  "scope": "atlas-profile",
  "fetchedAt": "2026-10-15T23:40:00Z",
  "hasEstimatedData": true,
  "total": "42.18",
  "daily": [
    { "date": "2026-09-15", "amount": "1.24" }
  ],
  "services": [
    {
      "service": "Amazon Elastic Compute Cloud - Compute",
      "amount": "24.82"
    }
  ]
}
```

`daily` always has 30 objects. `scope` is `atlas-profile` because the query has no `LINKED_ACCOUNT` filter. Cost Explorer then returns the billing view those credentials have: a member account sees that account; a payer account sees the consolidated bill. The page must say that, and must not say the person picked an account.

`period_days` on the request body is ignored for this report. The window is fixed so chat and the page cannot drift.

---

## What stays out

This feature does not add:

- A dollar amount for one instance, bucket, database, or Beanstalk environment.
- `cloud_service_pricing`, hourly × 730, or any other estimate mixed into this total.
- A forecast, a savings number, or a comparison with the previous month.
- A date picker or any period other than these 30 days.
- An RDS scan, a Beanstalk scan, or a new table of billing snapshots.
- Polling, a new confirmation step, or a new chat card framework.
- A chart package. The page can draw bars with inline SVG.
- A per-user AWS connection. That belongs to [adding services](feature_adding_services.md). Until then, “no connection” means the Atlas profile cannot call Cost Explorer.

`show_billing` stays an immediate information capability. It does not create a request row.

EC2 scan estimates may keep using `estimatedMonthlyCost`. Those figures stay off this page.

---

## Dashboard

The browser calls the Node API, the same way scans do (`verifyUser`, then the server talks to Atlas). Suggested route, matching `scanRoutes.js`:

```text
GET /cloudpilot/billing/summary
```

The handler calls the existing `getBillingSummary` function and returns Atlas’s `data`. It does not accept AWS keys. A failed AWS call is an error, never a successful `$0.00` and never the old mock.

| Situation | What the person sees |
|-----------|----------------------|
| Loading | The page’s normal waiting state. No `$0.00` and no mock numbers first |
| Success | Total, 30 daily bars, every nonzero service |
| Successful zero | `$0.00` and “No AWS spending reported for this period.” |
| Profile cannot call Cost Explorer | “Cloud Pilot could not access AWS billing data. Your AWS connection needs Cost Explorer access.” |
| Other failure | A short error and Retry |
| Refresh | Same GET. The button does nothing while a refresh is in flight. The last good report stays on screen if the refresh fails. `fetchedAt` changes only after success |

### Page content

Header:

```text
AWS spending
Account-level actual spending
Last 30 complete days · September 15–October 14, 2026
```

Dates and currency come from the response. One summary card: **Total AWS spending**, the total, and “Last 30 complete days.”

Remove the mock projected-month card, the potential-savings card, the savings insights, and the named-resource table.

**Daily spending.** One bar per day, including zeros. Tooltip is the date and the display amount. Negative days remain visible.

**Spending by service.** Backend order. Amounts right-aligned. A positive amount that would display as `$0.00` shows as `< $0.01`. A negative amount keeps its sign.

Note under the table:

> AWS billing data may be delayed, and recent amounts may change. These totals are the billing view of the connected Atlas credentials, not individual resources.

If `hasEstimatedData` is true, the note can say recent days are still marked estimated by AWS. Show “Retrieved …” from `fetchedAt`. That time is when CloudPilot fetched the report.

---

## Chat

`billingAWSHandler.js` keeps calling `POST /billing/summary`. `atlasAWSBillingMessage.js` reads `total`, `period`, and `services` from that result.

A normal answer:

```text
Your AWS spending was $42.18 for September 15–October 14, 2026.

Spending by service:
• EC2: $24.82
• RDS: $9.41
• Elastic Load Balancing: $4.20
• S3: $3.75

These are account-level actual charges reported by AWS.
Recent billing amounts may change.
```

The daily series stays in the result and out of this paragraph. If there are many services, the message shows the largest ones and says the Costs page has the full list. Name the Costs page in the sentence. Do not build a new card type for it.

Drop the current billing follow-up “Show RDS databases.” There is no RDS scan, and a service line is not a list of databases.

An RDS question still gets the service total only: that is RDS spend across this billing view for these 30 days. No RDS line means AWS returned no nonzero RDS amount for the window. It does not mean there is no database. A Beanstalk environment total is out of reach; do not add EC2 and load balancing and call that the environment.

---

## Tests

Use the current Python and Node test style. Mock Cost Explorer. Do not call AWS.

Aggregator:

1. UTC start and exclusive end.
2. Several days and services sum to the same total.
3. A second page via `NextPageToken` is included.
4. Exactly 30 days, zeros filled in, days sorted.
5. A negative amount and a sub-cent amount survive.
6. An all-zero service is omitted.
7. `Estimated: true` sets `hasEstimatedData`.
8. A non-USD unit fails the report.

API and chat:

- `GET /cloudpilot/billing/summary` requires `verifyUser`.
- The handler returns the Atlas payload and does not rebuild totals.
- Access denied stays an error.
- The chat string uses the canonical total and dates, and it does not print 30 daily rows.

Update `billing_route_test.py` so the mock payload includes `period`, `daily`, and `services` in the new shape. Otherwise Test mode will not match what the page expects.

---

## Steps

1. Extend `get_spend_by_service` with the UTC window, paging, `Decimal` sums, daily rows, and the shared result. Stop shortening names and dropping negatives there.
2. Lock `run_billing_summary` to that window.
3. Point `buildBillingMessage` at the shared fields. Remove the RDS-database follow-up.
4. Add `GET /cloudpilot/billing/summary` with `verifyUser`, calling `getBillingSummary`.
5. Replace the Costs mock: total, SVG daily bars, service table, loading, zero, error, refresh.
6. Run the focused tests and open `/costs`.

---

## Done when

- Chat and `/costs` show one Cost Explorer report.
- The window is the last 30 complete UTC days, and the page says so.
- The page shows the total, every day, and every nonzero service.
- RDS and any other newly billed service appear without a code change.
- The mock projected, savings, and per-resource figures are gone.
- A failed AWS call is not shown as `$0.00`.
- Refresh keeps the last good report if the new fetch fails.
- Focused tests pass.
