# Feature: Understand AWS Costs

**Status:** Future — deferred from current (2026-09-23). Not started.  
**Priority:** High-value roadmap candidate; safe to defer  
**Primary capability:** Extend existing `show_billing`  
**MVP data source:** AWS Cost Explorer `GetCostAndUsage`  
**Later data sources:** CloudPilot inventory/scans and AWS Cost Optimization Hub

---

## Goal

Let CloudPilot understand and answer grounded AWS cost questions such as:

- How much have I spent this month?
- What are my five most expensive AWS services?
- Why is my bill higher?
- How much did EC2 cost last month?
- Did S3 get more expensive this month?
- Show daily AWS spending for the last 30 days.

The useful long-term loop is:

```text
Cost
  ↓
Explain the increase
  ↓
Investigate the related AWS resources
  ↓
Create a finding
  ↓
Propose a safe remediation
  ↓
Explain expected cost impact
  ↓
Execute only with the existing permission model
```

The MVP is not a full FinOps platform. It should answer a small set of cost questions accurately, clearly identify estimates and data lag, and offer grounded next steps.

---

## Important discovery: the basic capability already exists

This feature should extend the current billing path rather than build a parallel cost system.

Today:

```text
show_billing
  ↓
billingAWSHandler.js
  ↓
Atlas POST /billing/summary
  ↓
billing_service.py
  ↓
Cost Explorer GetCostAndUsage
  ↓
30 daily periods grouped by SERVICE
  ↓
UnblendedCost summary + Navigator table
```

Current behavior already provides:

- A `show_billing` capability in `masterCloudPilotCapabilities.js`
- Immediate informational execution with no open-request row
- A fixed 30-day query
- `UnblendedCost`
- Daily Cost Explorer retrieval grouped by AWS service
- Friendly service labels
- Total spend and service rows
- Deterministic chat text
- Navigator stats and a billing table
- Atlas mock route data for development
- Basic AccessDenied guidance

Therefore:

- Do not add a second overlapping `get_aws_costs` capability in MVP.
- Keep `show_billing` as the stable internal capability key.
- Improve its visible label and description to “AWS Costs” if desired.
- Add an `aws_costs` Question signal in Understand and map it to `show_billing` in Decide.
- Keep the old action phrases working during migration.

A future rename from `show_billing` to `get_aws_costs` is optional cleanup, not required functionality.

Related existing work:

- `doc/development/future/billing.md` documents the original Billing Phase B1 and live IAM/mock setup. Some Node paths in that older document predate the current folder organization.
- `doc/development/finished/finished.md` records the underlying billing pipeline as completed work.
- This document supersedes the older Phase B2 outline for future cost-understanding work; it does not replace the live setup instructions.

---

## Architecture fit

Use the current master turn:

```text
OPEN REQUEST
  ↓
UNDERSTAND
  ↓
DECIDE
  ↓
FULFILL
  ↓
RESPOND
```

AWS cost questions are informational:

- `requestType: "information"`
- `permission: "none"`
- `requiresWorkflow: false`
- `requiresExecution: true`
- No database request row
- Immediate grounded fulfillment

The user is asking CloudPilot to retrieve known AWS state, so the request belongs on the Question path—not General Chat and not a change workflow.

### Layer responsibilities

Node API / CloudPilot:

- Understand the user’s cost question.
- Normalize a small semantic query.
- Decide which capability fulfills it.
- Call Atlas.
- Format grounded product language and Navigator data.
- Never invent cost values.

Atlas route:

- HTTP body in and standard response envelope out.
- No business or AWS-query logic.

Atlas service:

- Validate normalized cost-query options.
- Convert semantic periods into exact date intervals.
- Orchestrate one or more scanner calls.
- Build comparisons and service deltas.

Atlas scanner:

- Create the Cost Explorer client.
- Call AWS.
- Handle pagination.
- Normalize AWS result pages without conversational wording.

Atlas models:

- Define normalized cost summary, service rows, daily rows, comparison values, currency, and estimate status if typed models are introduced.

CloudPilot inventory/rules:

- Later correlate billed service changes with observed resources.
- Keep measured cost facts separate from inferred causes.

---

## MVP product contract

### Supported questions

#### 1. Period total

Examples:

- How much have I spent this month?
- What was my AWS bill last month?
- Show my AWS costs for the last 30 days.

Response:

- Exact covered date range
- Total
- Currency
- Whether the newest data is estimated
- Data-freshness note when appropriate

#### 2. Top services

Examples:

- What is costing me the most?
- Show my top five AWS services.
- Where is my AWS money going?

Response:

- Period total
- Top services, descending by cost
- Dollar amount
- Percentage of positive gross service spend when useful
- Remaining services grouped as “Other” only in presentation, not in raw data

#### 3. One service

Examples:

- How much did EC2 cost last month?
- What am I spending on S3?
- Show Lambda cost this month.

Response:

- Service total
- Exact period
- Optional daily rows when explicitly requested
- No resource-level claim unless separately supported

#### 4. Period comparison

Examples:

- Why is my bill higher this month?
- Compare this month to last month.
- Did S3 get more expensive?

Response:

- Current-period total
- Comparable previous-period total
- Dollar delta
- Percent delta when the previous value is nonzero
- Largest positive service deltas
- Largest decreases when useful
- Clear wording that these are billed-service changes, not proven root causes

#### 5. Daily trend

Examples:

- Show daily spending for the last 30 days.
- Which day cost the most?

Response:

- Daily total rows
- Highest-cost day
- Total for the range
- Navigator table initially
- Chart support later only if the Navigator contract gains a real time-series view

---

## Explicitly out of MVP

- Forecasting the end-of-month bill
- Budgets and budget alerts
- Cost Anomaly Detection ingestion
- Savings Plans or Reserved Instance purchasing
- Cost Optimization Hub recommendations
- Exact cost per S3 bucket without trustworthy attribution
- Cost and Usage Report ingestion
- Multi-cloud costs
- Multi-account role assumption redesign
- A new persistent cost database
- Automatic remediation based only on cost
- An LLM calculating totals or deltas
- Replacing the AWS Billing console

---

## Understand design

### New Question identifier

Add:

```text
question: "aws_costs"
```

This means:

> The user wants grounded AWS billed cost or usage-cost information from Cost Explorer.

It does not mean:

- OpenAI usage spend
- Generic AWS pricing knowledge
- Estimated EC2 hourly price
- A request to change an AWS resource

### Detection precedence

Cost language currently overlaps two existing questions:

- `ai_spend`
- `ec2_compute_cost`

Use this precedence:

```text
1. open_requests
2. ai_spend
3. aws_costs
4. ec2_compute_cost
5. ec2_inventory
6. s3_inventory
```

Why:

- “How much have I spent on OpenAI?” must remain CloudPilot AI usage.
- “How much did EC2 cost last month?” is billed AWS spend.
- “How much does a t3.micro cost per hour?” is a pricing estimate.

### AWS billed-cost signals

Positive signals:

- AWS bill / billing
- AWS spend / spent
- charged / charges
- this month / last month / last 30 days
- cost increase / bill increase
- compare spend
- top expensive services
- daily AWS spend
- “where is my money going?”

Strong service-specific billed-cost signals:

- “S3 cost this month”
- “EC2 spend last month”
- “did Lambda get more expensive?”

### Exclusions

Do not classify as `aws_costs` when:

- The message explicitly says OpenAI, Open AI, AI usage, token spend, or model cost.
- The user asks “what does this instance type cost?” with per-hour/per-month estimate language but no billing period.
- The user asks a general definition such as “what is AWS billing?”
- The user asks to create, stop, resize, delete, or otherwise change a resource.

### Internal-first classification

MVP should use deterministic internal rules.

Reasons:

- Cost intent phrases are concrete.
- This avoids paying OpenAI to decide whether to query AWS billing.
- It is easier to test overlap with AI spend and EC2 pricing.
- The LLM must never be the source of cost facts.

An optional OpenAI classifier can be added later through the existing Intelligence configuration pattern, but it should return classification only.

### Proposed files

Add:

- `cloudPilotIntelligence/understand/search/questions/searchForAwsCosts.js`
- `cloudPilotIntelligence/context/searches/awsCostsSearchContext.js` only if an OpenAI classifier is later enabled

Update:

- `cloudPilotIntelligence/understand/search/searchMessageForQuestion.js`
- `cloudPilotIntelligence/understand/masterUnderstanding.js` comments/documentation
- `cloudPilotIntelligence/CloudPilotIntelligence.js` façade only if direct access is useful
- `config/cloudPilotAIConfig.js` only if optional OpenAI cost classification is added

---

## Structured cost query

Classification alone is not enough. Fulfillment needs a small normalized query.

Keep it separate from conversational prose:

```text
cost_query_type
cost_period
cost_service
cost_granularity
cost_top_n
cost_metric
```

Recommended values:

```text
cost_query_type:
  summary
  service_breakdown
  service_summary
  comparison
  daily_trend

cost_period:
  this_month
  last_month
  last_30_days

cost_granularity:
  monthly
  daily

cost_metric:
  UnblendedCost
```

Defaults:

```text
cost_query_type: service_breakdown
cost_period: this_month
cost_granularity: daily
cost_top_n: 5
cost_metric: UnblendedCost
```

### Extraction approach

Add a deterministic value extractor:

- `cloudPilotIntelligence/understand/search/values/searchMessageForCostQuery.js`

Call it from:

- `cloudPilotIntelligence/understand/search/searchMessageForValues.js`

The extractor should run only when the message has credible AWS cost language. It should not add cost values to unrelated open requests.

### Service normalization

Start with a small explicit alias catalog:

```text
ec2 → Amazon Elastic Compute Cloud - Compute and related EC2 service labels
s3 → Amazon Simple Storage Service
rds → Amazon Relational Database Service
lambda → AWS Lambda
data transfer → AWS Data Transfer
vpc → Amazon Virtual Private Cloud
nat gateway → VPC/NAT usage categories only when the query supports it
```

Do not guess arbitrary AWS service names. If a service cannot be mapped safely:

- Run the general service breakdown.
- State that the requested service filter was not recognized.
- Offer the actual returned service labels.

Keep the canonical AWS names in the Atlas query layer and friendly names in response formatting.

### Passing values through immediate execution

Today `buildImmediateCapabilityDecision` carries only the action name, and execution context receives capability defaults plus open-request fields.

Extend the immediate-execution envelope narrowly so it can carry validated informational inputs:

```text
decision.execute.action
decision.execute.values
```

Then merge:

```text
capability defaults
  ← decision.execute.values
  ← request-state collected values, when applicable
```

Do not create a request row for these values.

Likely updates:

- `cloudPilot/decide/masterDecision.js`
- `cloudPilot/execution/functions/executionFunctions.js`

Keep this generic enough for immediate informational capabilities, but do not redesign all request state.

---

## Decide behavior

Map:

```text
aws_costs → show_billing
```

Expected decision:

```text
chatType: cloudPilotResponding
response.type: immediate_execution
execute.action: show_billing
requestType: information
permission: none
request: null
```

Include the normalized cost values in `execute.values`.

Do not:

- Create an open request
- Ask for confirmation
- Route cost facts through General Chat
- Add a special response type if `IMMEDIATE_EXECUTION` already represents the flow correctly

Update:

- `cloudPilot/decide/masterDecision.js`

No new `decisionTypes.js` value should be necessary for MVP.

---

## Master capability changes

Evolve `show_billing` in:

- `cloudPilot/masterCloudPilotCapabilities.js`

Recommended capability meaning:

```text
type: show_billing
actionLabel: AWS Costs
requestType: information
permission: none
requiresWorkflow: false
requiresExecution: true
```

Defaults should become semantic query defaults instead of only `period_days: 30`.

Capability discovery:

```text
section: Explore AWS
description: Understand AWS costs and service-level changes
scope: Account-level Cost Explorer data; typically refreshed at least daily
```

`cloudPilotCanAnswer` should include only facts that survive the real data path:

- Total billed AWS cost for a supported period
- Cost grouped by AWS service
- Daily cost for a supported period
- Current-versus-previous comparable-period change
- Largest service-level increases and decreases
- Whether returned Cost Explorer periods are estimated

It must not claim:

- Exact cost for every resource
- Exact cost for every S3 bucket
- Root cause from cost data alone
- Guaranteed savings
- Real-time billing

Keep the existing direct action `match` phrases temporarily for backward compatibility. After the `aws_costs` Question path is proven, change `match` to `() => false` so Question search owns informational billing language, matching the existing inventory pattern.

---

## Atlas API contract

Keep the current route initially:

```text
POST /billing/summary
```

The body should accept normalized, bounded values—not raw Cost Explorer expressions:

```json
{
  "query_type": "comparison",
  "period": "this_month",
  "service": "S3",
  "granularity": "DAILY",
  "top_n": 5,
  "metric": "UnblendedCost"
}
```

Do not accept arbitrary client-supplied:

- IAM account scope
- Billing view ARN
- Raw Cost Explorer filter expressions
- Unbounded dates
- More than two group definitions

This keeps CloudPilot’s public contract small and prevents it from becoming a generic billing-query proxy.

### Response shape

Extend the existing response without breaking current consumers:

```json
{
  "query_type": "comparison",
  "period": {
    "key": "this_month",
    "label": "This month to date",
    "start": "2026-09-01",
    "end_exclusive": "2026-09-16"
  },
  "metric": "UnblendedCost",
  "currency": "USD",
  "estimated": true,
  "total_usd": 186.42,
  "services": [
    {
      "service": "EC2",
      "aws_service": "Amazon Elastic Compute Cloud - Compute",
      "amount_usd": 82.14
    }
  ],
  "daily": [
    {
      "date": "2026-09-01",
      "amount_usd": 5.21,
      "estimated": false
    }
  ],
  "comparison": {
    "basis": "month_to_date_vs_previous_month_same_number_of_days",
    "previous_start": "2026-08-01",
    "previous_end_exclusive": "2026-08-16",
    "current_total_usd": 186.42,
    "previous_total_usd": 115.12,
    "delta_usd": 71.30,
    "delta_percent": 61.94,
    "service_deltas": []
  }
}
```

The existing keys should remain available for the original summary path:

- `period_days`
- `period_start`
- `period_end`
- `services`
- `total_usd`

Deprecate old fields later only after all Node and frontend consumers are updated.

---

## Date and comparison semantics

Cost Explorer start dates are inclusive and end dates are exclusive.

Use UTC calendar dates and expose the exact range in every response.

### This month

```text
Start: first day of the current month
End: current UTC date (exclusive)
```

This normally means completed cost data through the prior date. Do not imply today is complete.

### Last month

```text
Start: first day of the previous month
End: first day of the current month
```

### Last 30 days

```text
Start: current UTC date minus 30 days
End: current UTC date (exclusive)
```

### Compare this month to last month

Do not compare an incomplete current month to the entire previous month by default.

Use:

```text
Current: current month-to-date
Previous: same number of elapsed calendar days in the previous month
```

Label the basis explicitly.

Optionally support full-month comparison only when the user asks for two completed months.

### Percent change

- If previous total is greater than zero, calculate percent delta.
- If previous total is zero and current is positive, return `delta_percent: null` and describe it as new spend.
- Do not emit Infinity.

---

## Atlas implementation

### Current files to evolve

- `atlas/app/api/routes/billing_route.py`
- `atlas/app/api/services/billing_service.py`
- `atlas/app/core/cloud/billing/get_spend_by_service.py`
- `atlas/app/api/routes/test/billing_route_test.py`

### Layer-aligned target

New AWS retrieval belongs under the scanner layer:

- `atlas/app/core/scanners/billing/cost_explorer_scanner.py`

Optional normalized models:

- `atlas/app/core/models/aws_costs.py`

The current `core/cloud/billing/get_spend_by_service.py` can remain as a temporary compatibility wrapper while callers migrate. Do not perform a broad folder cleanup in the same change.

### Scanner responsibilities

The scanner should:

1. Use the configured Atlas AWS profile.
2. Create the Cost Explorer client in `us-east-1`.
3. Call `GetCostAndUsage`.
4. Continue through every `NextPageToken`.
5. Preserve AWS service names and units.
6. Preserve negative values such as credits/refunds.
7. Preserve `Estimated` from each result period.
8. Return normalized rows without user-facing prose.
9. Catch AWS client errors in the existing safe-wrapper pattern.

### Important correction to current aggregation

The current scanner drops rows where `amount <= 0`.

That can produce an incorrect bill total because credits, refunds, and adjustments may be negative.

The improved implementation should:

- Preserve negative amounts in normalized data.
- Calculate net total including negative amounts.
- Keep “largest cost services” focused on positive spend.
- Optionally show credits/adjustments separately.
- Never round each daily row before calculating the final total.

Use decimal-safe arithmetic where practical. Round only at the presentation boundary.

### Pagination

The current implementation makes one request and ignores `NextPageToken`.

Add a bounded pagination loop:

- Repeat the same request with the returned token.
- Stop when no token remains.
- Guard against repeated tokens.
- Keep a conservative maximum-page safety limit.
- Return a clear partial/failure state rather than silently truncating.

### Service filtering

Use an exact Cost Explorer `SERVICE` dimension filter after alias normalization.

Some user concepts span multiple AWS billing service labels. EC2 is the main example:

- EC2 compute
- EBS
- Elastic Load Balancing
- Data Transfer
- VPC/NAT-related charges

For MVP:

- “EC2 cost” should mean EC2 compute unless the user asks for the broader EC2 stack.
- State the chosen scope in the response.
- Do not quietly add unrelated services to make a larger number.

### Usage type breakdown

“Why is S3 expensive?” often needs more than service totals.

A later Cost Explorer query may group by:

- `USAGE_TYPE`
- `REGION`
- Activated cost allocation tag

Do not sum `UsageQuantity` across mixed units. AWS explicitly warns that aggregated usage quantities are meaningless when hours, requests, and GB are mixed.

For MVP, service cost deltas are enough.

---

## Node provider and handler changes

### Atlas provider

Update:

- `providers/atlas/billing/getBillingSummary.js`

Pass the normalized query options instead of only `period_days`.

Keep it a thin Atlas transport adapter.

### Billing handler

Update:

- `cloudPilot/scans/billing/billingAWSHandler.js`

The handler currently ignores execution context and hardcodes 30 days.

Change it to:

1. Accept `executionContext`.
2. Read validated values from `executionContext.state.collected`.
3. Call the Atlas provider.
4. Validate the Atlas success envelope.
5. Build deterministic grounded text.
6. Build Navigator data.
7. Return the existing execution-result shape.

Do not parse natural language in the handler.

### Message builder

Evolve:

- `cloudPilot/scans/billing/atlasAWSBillingMessage.js`

Add deterministic message modes:

- Summary
- Service breakdown
- Service summary
- Comparison
- Daily trend
- No spend
- Cost Explorer unavailable

Required wording rules:

- State exact period.
- Say “estimated” when AWS marks data estimated.
- Say “increase is concentrated in…” rather than claiming a proven cause.
- Distinguish AWS billed cost from CloudPilot’s stored EC2 pricing estimate.
- Do not describe inventory size as a dollar attribution.
- Do not claim savings unless supplied by a recommendation source.

### Navigator adapter

Evolve:

- `cloudPilot/scans/billing/atlasAWSBillingNavigator.js`

MVP views:

- Stats: total, previous total, delta, top service
- Service table: service, current cost, previous cost, delta
- Daily table: date, cost, estimate status

The current Navigator supports stats, cards, tables, alerts, and actions but no explicit chart/time-series type.

Therefore:

- Use a daily table first.
- Do not add a fake unsupported chart shape.
- Add a Navigator time-series contract later with coordinated frontend support.

---

## Respond behavior

The billing handler’s grounded message remains the final known response for successful immediate execution.

Examples:

### Total

```text
Your estimated AWS cost for September 1–15 is $186.42.

Cost Explorer marks the latest period as estimated, and billing data can lag behind current usage.
```

### Top services

```text
Your estimated AWS cost for September 1–15 is $186.42.

Top services:
• EC2 — $82.14
• S3 — $51.08
• Data Transfer — $31.20
```

### Comparison

```text
Your month-to-date AWS cost is $186.42, up $71.30 (61.9%) from the same number of days last month.

The largest service-level increases are:
• EC2 — +$38.20
• S3 — +$24.10
• Data Transfer — +$11.40

That shows where billed cost changed; it does not yet prove which individual resources caused it.
```

### Previous period zero

```text
S3 has $8.42 of spend in this period and no spend in the comparable prior period, so a percentage change would be misleading.
```

### No spend

```text
I did not find AWS cost in the requested period.

This can also happen when Cost Explorer was enabled recently or the Atlas AWS identity cannot see the relevant billing scope.
```

---

## Conversation follow-ups

### MVP approach

Each message should be independently understandable where possible.

Examples:

- “What did S3 cost last month?”
- “Compare S3 this month to last month.”

Do not introduce a general agent loop or hidden billing session state.

Moving billing detection from Action matching to the Question path also matters when another request is open. The current Question flow can answer informational questions without replacing the unrelated request, while the legacy immediate Action matcher may be suppressed during an open workflow. Add an integration test for this behavior before removing the legacy billing phrases.

### Later contextual follow-ups

The desired conversation includes:

```text
User: What is costing me the most?
CloudPilot: EC2...
User: Why did it increase?
```

Reliable pronoun/follow-up resolution requires the previous structured cost query/result, not only generated prose.

Later, store a small read-only conversation result reference:

```text
lastCostQuery
lastCostSummary
selectedService
```

Then resolve “it,” “that service,” and “last month” against those facts.

Do not block the first Cost Explorer MVP on this.

---

## Cost-to-inventory correlation

This is the most valuable second phase.

Example:

```text
Cost Explorer:
S3 increased by $24

CloudPilot inventory:
14 buckets

CloudPilot scan:
1.8 TB total
620 GB older than 90 days
versioning/lifecycle/incomplete-upload findings
```

The system must preserve provenance:

```text
Measured:
S3 billed cost increased by $24.

Observed:
Bucket X contains 428 GB and 310 GB is older than 90 days.

Inference:
Old retained objects may be contributing to storage cost.

Not established:
Bucket X costs exactly $31.72.
```

### Suggested next-step actions

After a service-level cost response:

- EC2 increase → offer EC2 inventory or scan
- S3 increase → offer S3 inventory or scan
- RDS increase → offer RDS inventory only after that capability exists
- Unknown service → offer AWS inventory, not a fabricated specialized scan

These are suggestions, not automatic actions.

Accepting a scan offer must follow the current scan capability and permission behavior.

---

## S3 attribution guardrail

Cost Explorer can answer:

- Total S3 cost
- S3 cost over time
- S3 cost by supported usage type, region, tag, or cost category

It does not guarantee a perfect real-time dollar amount for every bucket.

Exact bucket attribution may require:

- Activated user-defined cost allocation tags
- Consistent bucket tagging
- Cost and Usage Reports
- A supported resource-level feature
- A clearly labeled internal estimate based on usage metrics

AWS `GetCostAndUsageWithResources` is opt-in and has strict support, granularity, service-filter, and time-range constraints. It must not be treated as a universal per-resource cost API.

For MVP:

- Do not call `GetCostAndUsageWithResources`.
- Do not say a bucket “accounts for” a dollar amount without attribution data.
- Combine S3 cost and inventory only as separate measured facts.

---

## Cost Optimization Hub — later phase

Cost Optimization Hub fits CloudPilot’s finding/remediation model well, but it should be a separate phase and likely a separate informational capability.

Potential future capability:

```text
get_cost_recommendations
```

Useful fields from AWS include:

- Resource ID and ARN
- Resource type
- Region and account
- Current resource configuration
- Recommended configuration
- Estimated monthly cost
- Estimated monthly savings
- Estimated savings percentage
- Implementation effort
- Restart needed
- Rollback possible
- Recommendation source
- Refresh timestamp

Important constraints:

- Cost Optimization Hub must be enabled.
- Recommendations refresh and recommendation IDs can expire after 24 hours.
- A recommendation is not permission to execute a change.
- CloudPilot must verify the current resource state before remediation.
- Every mutation continues through the existing confirmation/execution-mode safety model.
- Savings are AWS estimates, not guarantees.

Future flow:

```text
ListRecommendations
  ↓
GetRecommendation
  ↓
Normalize to CloudPilot finding
  ↓
Show current cost and estimated savings
  ↓
Offer remediation
  ↓
Verify resource
  ↓
Confirm + execute
```

Do not mix Cost Optimization Hub into the first Cost Explorer implementation.

---

## IAM, enablement, and account scope

### Cost Explorer enablement

Cost Explorer cannot be enabled through its API.

The AWS account must enable it in the Billing and Cost Management console.

AWS notes:

- Current-month data is generally available about 24 hours after enablement.
- Historical preparation can take longer.
- Cost Explorer updates data at least daily.

CloudPilot should report this accurately when data is unavailable.

### IAM

Atlas needs explicit least-privilege access:

```text
ce:GetCostAndUsage
```

Later operations require separate permissions.

Do not grant broad Billing administrator access solely for this feature.

### Organization behavior

- A standalone account sees its own cost.
- A member account generally sees its own accessible cost.
- A management account can see organization/member-account cost according to Cost Explorer and organization settings.
- Billing Conductor may change whether returned values are chargeable or pro forma.

MVP Atlas currently uses one configured AWS profile. Responses should describe the scope as the connected AWS billing identity, not “all your AWS accounts” unless account context proves that.

### Sensitive data

Cost and account data is sensitive.

- Keep raw Atlas billing logs behind existing debug logging controls.
- Do not log credentials, authorization headers, full Cost Explorer request signatures, or unnecessary account identifiers.
- Avoid persisting raw billing pages in conversation history.
- Return only normalized fields needed by chat and Navigator.

---

## Caching and API usage

Cost Explorer data updates at least daily; repeated identical calls do not need to hit AWS for every chat turn.

Add a small Atlas cache after correctness is proven:

- Key: connected account/profile identity + normalized query
- TTL: 15–60 minutes
- Never share cache entries across different account identities
- Cache successful normalized results
- Do not cache AccessDenied indefinitely
- Expose `retrieved_at` and optional `cache_hit` in internal metadata

Caching is useful for:

- Faster follow-ups
- Fewer Cost Explorer API requests
- More consistent values within one conversation

Do not add a database for the first cache; an in-process bounded cache is sufficient for MVP.

---

## Error behavior

Normalize errors into stable internal codes.

Required cases:

- `cost_explorer_not_enabled`
- `cost_explorer_access_denied`
- `cost_data_unavailable`
- `cost_query_invalid`
- `cost_query_throttled`
- `cost_pagination_failed`
- `atlas_unreachable`
- `billing_failed`

User-facing messages should be actionable but not expose raw AWS internals.

Examples:

Access denied:

```text
I can’t read AWS cost data with the connected Atlas profile. Grant `ce:GetCostAndUsage` and try again.
```

Not enabled:

```text
Cost Explorer must be enabled in the AWS Billing console first. AWS may take about 24 hours to prepare current-month data.
```

Data unavailable:

```text
AWS cost data is temporarily unavailable for that period. Try again later or request a shorter supported range.
```

Throttle:

```text
AWS is limiting Cost Explorer requests right now. Please try again shortly.
```

Do not turn AWS errors into a zero-dollar answer.

---

## Testing strategy

### Understand tests

Positive AWS cost cases:

- How much have I spent this month?
- Show my AWS bill.
- What are my top five AWS services?
- Why is my AWS bill higher?
- How much did EC2 cost last month?
- Did S3 get more expensive?
- Show daily AWS spend for the last 30 days.

Must not collide:

- How much have I spent on OpenAI? → `ai_spend`
- Show AI usage. → `ai_spend`
- How much does a t3.micro cost per hour? → `ec2_compute_cost`
- Estimate an EC2 instance price. → `ec2_compute_cost`
- What EC2 instances do I have? → `ec2_inventory`
- Scan my S3 buckets. → `scan_s3`
- What is Cost Explorer? → General Chat

### Decide tests

Verify `aws_costs`:

- Maps to `show_billing`
- Produces `IMMEDIATE_EXECUTION`
- Uses `permission: none`
- Creates no request row
- Carries normalized query values
- Leaves an unrelated open request unchanged
- Can merge unrelated open-request values only under existing mixed-message rules

### Atlas unit tests

Mock Cost Explorer for:

- One page
- Multiple pages
- Empty data
- Estimated latest period
- Positive service cost
- Negative credit/refund
- Multiple currency/unit values
- Previous-period zero
- Missing metric
- Repeated pagination token
- AccessDenied
- DataUnavailable
- Throttling/limit errors

Verify:

- End date is exclusive
- Current MTD comparison is fair
- Net total includes negative adjustments
- Top service ranking excludes credits as “expensive services”
- Rounding occurs only at presentation
- Service filtering uses canonical names

### Node handler tests

Verify:

- Execution values reach Atlas
- Existing no-value 30-day path remains compatible
- Atlas failure is not reported as success
- Deterministic summary text
- Deterministic comparison text
- Estimated/freshness wording
- Navigator service rows and daily rows
- No raw AWS payload in the public response unless explicitly enabled

### Integration matrix

Run through the full message pipeline:

```text
OPEN REQUEST → UNDERSTAND → DECIDE → FULFILL → RESPOND
```

Required checks:

1. This-month total
2. Top five services
3. Last-month EC2
4. Month-to-date comparison
5. S3 comparison
6. Daily 30-day trend
7. Cost Explorer disabled
8. IAM denied
9. Atlas unavailable
10. AWS cost question while an unrelated change request is open

Confirm:

- Master logs show `question: aws_costs`
- Decision shows immediate `show_billing`
- No request row is created
- Atlas runs once per uncached query
- Final response uses only Atlas values

---

## Implementation sequence

### Phase 0 — Prove the existing baseline

Before changing behavior:

- Run Atlas `POST /billing/summary` with `{"period_days": 30}`.
- Run “show my AWS bill” through the full chat pipeline.
- Capture OPEN REQUEST → UNDERSTAND → DECIDE → FULFILL → RESPOND logs.
- Verify immediate execution creates no request row.
- Verify the Atlas mock route still works without AWS access.
- Record the current response and Navigator shape as backward-compatibility fixtures.

**Checkpoint:** The existing Billing Phase B1 path is known to work before extension.

### Phase 1 — Lock semantics

Before coding:

- Keep `show_billing` as the existing capability key.
- Choose `UnblendedCost` as the MVP metric.
- Lock UTC/exclusive date behavior.
- Lock fair MTD comparison.
- Lock service alias scope.
- Lock no per-resource S3 claims.

### Phase 2 — Make the existing billing retrieval correct

Atlas:

- Add pagination.
- Preserve negative adjustments.
- Preserve currency/unit.
- Preserve estimate status.
- Use UTC dates.
- Improve normalized response.
- Add scanner/service tests.

Keep the existing 30-day request working.

**Checkpoint:** Existing “show my AWS bill” is more accurate without changing conversation behavior.

### Phase 3 — Understand AWS cost questions

Node:

- Add `searchForAwsCosts`.
- Add deterministic cost-query value extraction.
- Resolve overlap with `ai_spend` and `ec2_compute_cost`.
- Add question-search tests.

**Checkpoint:** Classification is correct before any new query behavior is enabled.

### Phase 4 — Carry query values through Decide/Fulfill

- Map `aws_costs` to `show_billing`.
- Add immediate-execution values.
- Merge values into execution context.
- Pass normalized options through the Atlas provider.
- Keep no-request-row behavior.

**Checkpoint:** Logs show the exact normalized query reaching the handler.

### Phase 5 — Add summary, service, comparison, and daily modes

Atlas:

- Resolve semantic periods.
- Query current and previous ranges.
- Compute service deltas.
- Support one-service filters.
- Return daily rows.

Node:

- Add deterministic message modes.
- Add Navigator stats and tables.

**Checkpoint:** All six MVP question examples return grounded results.

### Phase 6 — Failure and freshness UX

- Distinguish not enabled, denied, unavailable, throttled, and unreachable.
- Add estimated-data wording.
- Add exact period wording.
- Ensure failures never become `$0`.

### Phase 7 — Cache

- Add bounded in-process cache.
- Key by account/profile identity and normalized query.
- Expose retrieval timestamp internally.
- Test cache isolation.

### Phase 8 — Cost-to-inventory next steps

- Offer supported scans based on returned service.
- Preserve measured-versus-inferred provenance.
- Do not automatically scan or remediate.

### Phase 9 — Cost Optimization Hub

Only after the Cost Explorer flow is stable:

- Add a separate recommendations capability.
- Normalize AWS recommendations into findings.
- Connect supported recommendations to existing verification and remediation flows.

---

## Expected files

### Node API — likely additions

- `api/application/atlas/cloudPilotIntelligence/understand/search/questions/searchForAwsCosts.js`
- `api/application/atlas/cloudPilotIntelligence/understand/search/values/searchMessageForCostQuery.js`
- Tests beside the existing API test convention or under `api/test/application/atlas/`

### Node API — likely updates

- `api/application/atlas/cloudPilotIntelligence/understand/search/searchMessageForQuestion.js`
- `api/application/atlas/cloudPilotIntelligence/understand/search/searchMessageForValues.js`
- `api/application/atlas/cloudPilotIntelligence/understand/masterUnderstanding.js`
- `api/application/atlas/cloudPilot/decide/masterDecision.js`
- `api/application/atlas/cloudPilot/execution/functions/executionFunctions.js`
- `api/application/atlas/cloudPilot/masterCloudPilotCapabilities.js`
- `api/application/atlas/cloudPilot/scans/billing/billingAWSHandler.js`
- `api/application/atlas/cloudPilot/scans/billing/atlasBillingFunctions.js`
- `api/application/atlas/cloudPilot/scans/billing/atlasAWSBillingMessage.js`
- `api/application/atlas/cloudPilot/scans/billing/atlasAWSBillingNavigator.js`
- `api/application/atlas/providers/atlas/billing/getBillingSummary.js`
- `api/application/atlas/cloudPilotIntelligence/context/contextTypes/cloudPilotCapabilitiesContext.js` indirectly reflects the catalog; likely no logic change
- `api/test/scripts/ensure-cloudpilot-actions-seed.js` only if the stored display label changes from “AWS Billing” to “AWS Costs”

### Atlas — likely additions

- `atlas/app/core/scanners/billing/cost_explorer_scanner.py`
- `atlas/app/core/models/aws_costs.py` if typed models add value
- Billing scanner/service tests

### Atlas — likely updates

- `atlas/app/api/routes/billing_route.py`
- `atlas/app/api/services/billing_service.py`
- `atlas/app/core/cloud/billing/get_spend_by_service.py` compatibility wrapper or migration
- `atlas/app/api/routes/test/billing_route_test.py`

---

## Definition of done for Cost Explorer MVP

- AWS billed-cost questions are classified as `aws_costs`.
- OpenAI spend and EC2 estimated pricing still route correctly.
- `aws_costs` maps to the existing `show_billing` capability.
- Cost queries execute immediately with no request row.
- The user can request current month, last month, or last 30 days.
- The user can request total, top services, one service, comparison, or daily trend.
- Atlas handles every Cost Explorer page.
- Negative credits/refunds are not silently discarded.
- Date ranges are exact and end-exclusive.
- Current-month comparison uses an honest comparable prior range.
- Responses include currency, exact period, and estimated status.
- Failures never masquerade as zero spend.
- Navigator displays useful stats and tables without an unsupported chart contract.
- No exact S3 bucket cost is claimed without attribution.
- No LLM calculates or invents cost values.
- Existing `show_billing` behavior remains backward compatible.
- Tests cover classification collisions, date math, pagination, errors, and the full master pipeline.

---

## Later definition of done for cost-aware CloudPilot

- Cost increases can offer a relevant inventory/scan.
- Findings preserve cost-data provenance.
- Cost Optimization Hub recommendations can become read-only CloudPilot findings.
- Recommended changes show AWS-estimated monthly cost and savings.
- Restart and rollback details are shown before execution.
- Every cost-aware mutation still uses resource verification, confirmation, and the existing execution model.

---

## AWS references

- [Using the AWS Cost Explorer API](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-api.html)
- [GetCostAndUsage API](https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/API_GetCostAndUsage.html)
- [GetCostAndUsageWithResources API](https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/API_GetCostAndUsageWithResources.html)
- [Enabling Cost Explorer](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-enable.html)
- [Controlling access to Cost Explorer](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-access.html)
- [Cost allocation tags](https://docs.aws.amazon.com/cost-management/latest/userguide/cost-allocation-tags.html)
- [Cost Optimization Hub](https://docs.aws.amazon.com/cost-management/latest/userguide/cost-optimization-hub.html)
- [Cost Optimization Hub GetRecommendation](https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/API_CostOptimizationHub_GetRecommendation.html)
