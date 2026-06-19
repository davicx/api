# CloudPilot - Converting Atlas Data To Navigator UI Responses

This document defines the standard workflow for converting raw Atlas responses into Navigator/API UI response data.

Examples:
- AWS inventory
- EC2 scan findings
- cost reports
- security findings
- future Azure/GCP inventory

The goal is:

```text
Atlas returns raw truth
Navigator/API shapes data for UI
Kite renders generic primitives
```

## Quick Checklist

- [ ] Identify raw Atlas response type
- [ ] Preserve Atlas raw response shape
- [ ] Decide target Navigator primitives
- [ ] Add adapter in the API/Navigator layer
- [ ] Use `navigatorResponseFunctions.js`
- [ ] Add table `view_type`
- [ ] Add optional column metadata
- [ ] Add stable `row_id` to every table row
- [ ] Put response-level context in `meta`
- [ ] Keep `raw` as `null` by default
- [ ] Test with real Atlas sample data
- [ ] Verify Kite can render generic data without AWS-specific logic

## Overall Data Flow

Every converted Atlas response should follow this lifecycle:

```text
Atlas Raw Response
-> Navigator Adapter
-> Navigator UI Data
-> Standard Navigator Response
-> Kite Generic Renderer
```

## Core Mental Model

```text
Atlas = raw domain truth
Navigator/API = UI shaping layer
Kite = generic renderer
```

Atlas should not know about:
- tables
- cards
- frontend components
- UI metadata

Kite should not know about:
- EC2-specific fields
- S3-specific fields
- Atlas-specific nesting
- finding-specific domain rules

Navigator/API owns the conversion.

## Standard Navigator Response Shape

Every converted response should fit this outer shape:

```js
{
    success: true,
    message: "",
    statusCode: 200,
    errors: [],
    currentUser: "davey",
    data: {
        meta: {},
        cards: [],
        stats: [],
        tables: [],
        alerts: [],
        actions: [],
        raw: null
    }
}
```

Use:

```text
application/atlas/services/navigator/functions/navigatorFunctions.js
```

Helpers:

```js
createNavigatorResponse()
createEmptyNavigatorData()
createEmptyNavigatorTable()
createNavigatorTableColumn()
```

## Phase 1 - Identify The Atlas Response Type

### Step 1: Look At Raw Atlas Data

Do not start by designing UI.

Start by reading the raw Atlas response.

Common response shapes:

```js
{
    data: {
        items: []
    }
}
```

```js
{
    data: {
        resourcesScanned: 1,
        findingCount: 1,
        scanType: "full",
        region: "us-west-2",
        instances: [],
        findings: []
    }
}
```

### Step 2: Name The Response Category

Examples:

```text
inventory
scan
cost_report
security_report
compliance_report
```

This name should guide the adapter name.

Example:

```text
inventory response -> inventory adapter
scan response -> scan adapter
```

## Phase 2 - Choose Navigator UI Primitives

### Step 3: Decide Which Generic Blocks Are Needed

Use existing Navigator primitives first:

```text
meta
stats
cards
tables
alerts
actions
raw
```

Common mapping:

```text
single summary values -> stats
list of objects -> tables
important warning -> alerts
next possible operation -> actions
response-level context -> meta
debug/original data -> raw
```

Do not add a new primitive unless the current primitives truly cannot represent the data.

## Phase 3 - Put Response Context In Meta

### Step 4: Build `meta`

Use `meta` for response-level context.

Good examples:

```js
meta: {
    region: "us-west-2",
    resourceCount: 5,
    services: ["ec2", "s3"]
}
```

```js
meta: {
    region: "us-west-2",
    resourcesScanned: 1,
    findingCount: 1,
    scanType: "full"
}
```

Do not duplicate these values into every table row unless each row truly needs the value.

## Phase 4 - Convert Lists Into Tables

### Step 5: Create A Table

Every Navigator table should have:

```js
{
    id: "aws_inventory",
    view_type: "table",
    title: "AWS Inventory",
    columns: [],
    rows: []
}
```

Use:

```js
createEmptyNavigatorTable()
```

IMPORTANT:

Every table should include:

```js
view_type: "table"
```

This is already handled by the helper.

### Step 6: Add Stable Row IDs

Every table row must have:

```js
row_id: "stable-id-here"
```

Good row IDs:

```js
row_id: item.id
row_id: instance.instance_id
row_id: finding.id
```

Avoid generated array-index IDs like:

```js
row_id: "row-0"
```

Indexes are unstable if sorting/filtering changes.

## Phase 5 - Add Column Metadata

### Step 7: Define Columns

Columns may be simple:

```js
{
    key: "service",
    label: "Service"
}
```

Columns may include lightweight metadata:

```js
{
    key: "state",
    label: "State",
    type: "status"
}
```

Supported column types:

```text
text
number
currency
status
```

Use:

```js
createNavigatorTableColumn()
```

Rules:
- `type` is optional.
- Plain `{ key, label }` columns are valid.
- Do not add a formatting engine here.
- Do not add a schema registry here.
- Do not add frontend display rules here.

## Phase 6 - Inventory Adapter Pattern

### Step 8: Convert Inventory Items

Atlas inventory response:

```js
{
    data: {
        items: [
            {
                service: "ec2",
                id: "i-065f09252b2ea0471",
                name: "Kite-env",
                region: "us-west-2",
                type: "t3.micro",
                state: "running",
                cost_estimate_monthly_usd: 7.49
            }
        ],
        region: "us-west-2",
        services: ["ec2", "s3"]
    }
}
```

Navigator target:

```js
{
    meta: {
        region: "us-west-2",
        resourceCount: 1,
        services: ["ec2", "s3"]
    },
    tables: [
        {
            id: "aws_inventory",
            view_type: "table",
            title: "AWS Inventory",
            columns: [
                { key: "service", label: "Service", type: "text" },
                { key: "name", label: "Name", type: "text" },
                { key: "region", label: "Region", type: "text" },
                { key: "type", label: "Type", type: "text" },
                { key: "state", label: "State", type: "status" },
                { key: "cost_estimate_monthly_usd", label: "Monthly Cost", type: "currency" }
            ],
            rows: [
                {
                    row_id: "i-065f09252b2ea0471",
                    service: "ec2",
                    name: "Kite-env",
                    region: "us-west-2",
                    type: "t3.micro",
                    state: "running",
                    cost_estimate_monthly_usd: 7.49
                }
            ]
        }
    ],
    raw: null
}
```

Inventory should be the first adapter because it is one list and one table.

## Phase 7 - Scan Adapter Pattern

### Step 9: Convert Scan Summary Into Stats

Atlas scan response:

```js
{
    data: {
        resourcesScanned: 1,
        findingCount: 1,
        scanType: "full",
        region: "us-west-2",
        instances: [],
        findings: []
    }
}
```

Navigator stats:

```js
stats: [
    {
        id: "resources_scanned",
        label: "Resources Scanned",
        value: 1,
        type: "number"
    },
    {
        id: "findings",
        label: "Findings",
        value: 1,
        type: "number"
    },
    {
        id: "scan_type",
        label: "Scan Type",
        value: "full",
        type: "text"
    },
    {
        id: "region",
        label: "Region",
        value: "us-west-2",
        type: "text"
    }
]
```

### Step 10: Convert Scan Lists Into Tables

Scan should usually create two tables:

```text
Instances
Findings
```

Instance row ID:

```js
row_id: instance.instance_id
```

Finding row ID:

```js
row_id: finding.id
```

Good findings columns:

```js
[
    { key: "title", label: "Finding", type: "text" },
    { key: "severity", label: "Severity", type: "status" },
    { key: "status", label: "Status", type: "status" },
    { key: "resourceName", label: "Resource", type: "text" },
    { key: "avgCPU", label: "Avg CPU", type: "number" },
    { key: "estimatedMonthlySavings", label: "Monthly Savings", type: "currency" },
    { key: "recommendationAction", label: "Recommendation", type: "text" }
]
```

## Phase 8 - Keep Raw Data Opt-In

### Step 11: Default `raw` To Null

Default:

```js
raw: null
```

Only include raw Atlas data when there is a clear debugging/developer-mode reason.

Reasons:
- raw data may be large
- raw data may expose internal structure
- raw data may include fields Kite should not depend on

## Phase 9 - Return The Standard Response

### Step 12: Wrap UI Data In Navigator Response

Adapter output should be wrapped with:

```js
createNavigatorResponse({
    success: atlasResponse.success === true,
    message: atlasResponse.message || "",
    statusCode: atlasResponse.statusCode || 200,
    errors: atlasResponse.errors || [],
    currentUser: atlasResponse.currentUser || null,
    data: navigatorData
});
```

The API route should return this standard shape.

## Phase 10 - Testing

### Step 13A: Test Inventory Conversion

Use sample Atlas inventory data.

Verify:
- `data.meta.region` exists
- `data.meta.resourceCount` matches item count
- `data.tables[0].view_type === "table"`
- every row has `row_id`
- column `type` values are optional but valid when present
- `raw === null`

### Step 13B: Test Scan Conversion

Use sample Atlas scan data.

Verify:
- `data.meta.region` exists
- `data.stats` includes resources scanned and findings
- instances table exists
- findings table exists
- every instance row has `row_id`
- every finding row has `row_id`
- `raw === null`

### Step 13C: Test Empty Data

Test:

```js
items: []
instances: []
findings: []
```

Verify:
- response still succeeds
- tables still have columns
- rows are empty arrays
- Kite can render empty state later

## Important Architecture Rules

### Rule 1 - Do Not Change Atlas For UI Needs

Atlas should keep returning raw domain truth.

Do not add:
- `tables`
- `cards`
- `view_type`
- UI labels

to Atlas responses.

### Rule 2 - Keep Adapters Thin

Adapters should:
- map fields
- create rows
- create columns
- create stats
- preserve response metadata

Adapters should not:
- call AWS
- decide workflow state
- execute actions
- call OpenAI
- render HTML

### Rule 3 - Keep Kite Generic

Kite should render:
- tables
- rows
- columns
- stats
- alerts
- cards

Kite should not branch on:
- `service === "ec2"`
- `scanType === "full"`
- `finding.issue.code`

### Rule 4 - Add New Adapters Per New Data Shape

When Atlas adds a new response type, add a small Navigator adapter.

Example:

```text
new cost response
-> cost adapter
-> stats + cost table
-> same Kite renderer
```

This keeps frontend rendering stable while Atlas grows.

### Rule 5 - Prefer Explicit Mappings

Prefer:

```js
row_id: item.id,
service: item.service,
name: item.name
```

Avoid:

```js
Object.keys(item).map(...)
```

Explicit mappings are easier to review and safer for UI contracts.

## Design Goal

CloudPilot should scale by adding small Navigator adapters:

```text
new Atlas data shape
-> small API adapter
-> same Navigator response contract
-> same Kite generic renderer
```

This keeps the system:
- predictable
- frontend-safe
- easy to debug
- easy to expand
- not over-abstracted

