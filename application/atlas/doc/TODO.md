# Navigator UI Response Contract Plan

Add these changes carefully and incrementally. Do not redesign the system. The current architecture direction is good and should remain simple and understandable.

## Goal

Keep this mental model:

```text
Atlas = raw truth
Navigator/API = UI shaping layer
Kite = generic renderer
```

This plan adds lightweight extensibility so the UI can evolve later without breaking the current design.

## Current Status

The API/Navigator contract and the first adapters are now in place.

Current helper:

```text
application/atlas/functions/navigatorResponseFunctions.js
```

Current adapters:

```text
application/atlas/functions/actions/aws/inventoryAWS/atlasAWSInventoryNavigatorAdapter.js
application/atlas/functions/actions/ec2/scanEC2/atlasEC2ScanNavigatorAdapter.js
```

Current API behavior is additive:

```text
existing formatted Atlas response remains
navigatorResponse is added for generic UI rendering
```

## Current Work

No active API/Navigator contract stage is currently queued in this document.

## Future Work

### Future Stage 1: Persist Navigator Data With React Query Cache

Kite currently stores the latest Navigator data in React context.

That works for route navigation while the app is mounted, but a better next persistence step is to use React Query cache for Navigator data.

Goal:

```text
user runs inventory or scan
-> Navigator data is cached
-> user clicks away
-> user returns
-> table data is still available without refetching
```

Use React Query for server/API response state, not Redux.

Recommended cache key:

```js
[
    "navigator-data",
    groupID,
    conversationID
]
```

Possible implementation:

```js
queryClient.setQueryData(
    ["navigator-data", groupID, conversationID],
    navigatorData
);
```

Then Dashboard or any future Navigator screen can read:

```js
queryClient.getQueryData([
    "navigator-data",
    groupID,
    conversationID
]);
```

Rules:

- Keep React Query for API/cache data.
- Keep local/context state only for small UI state.
- Do not add Redux yet.
- Do not add persistence to localStorage yet unless refresh persistence becomes necessary.
- Do not refetch just because the user navigated away and back.

Helpful options later:

```js
staleTime: 5 * 60 * 1000
cacheTime: 30 * 60 * 1000
refetchOnWindowFocus: false
```

### Future Stage 2: Add More Navigator Adapters

When Atlas adds a new response type, add a small Navigator adapter.

Examples:

```text
cost response -> stats + cost table
security response -> alerts + findings table
compliance response -> stats + compliance table
```

Do not change Kite for every new Atlas response if the existing primitives are enough.

### Future Stage 3: Add Other Atlas Actions

Add adapters for future actions only when the action is real.

Examples:

```text
resize_ec2
delete_ec2
security_scan
cost_report
```

Follow:

```text
doc/instructions/adding_new_action.md
doc/instructions/converting_atlas_data.md
```

### Future Stage 4: Optional Raw / Developer Mode

The contract supports:

```js
raw: null
```

Adapters also support opt-in raw data:

```js
{
    includeRaw: true,
    raw: {
        atlasAction: "scan",
        response: {}
    }
}
```

Do not send raw by default forever. It can get large and may leak internal structure.

### Future Stage 5: Better UI Formatting

Later, Kite can improve rendering:

```text
type = "currency" -> format numbers as currency
type = "status" -> render badge/color
type = "number" -> right align
```

Keep this out of the API.

### Future Stage 6: Naming Cleanup

Consider a focused naming pass later.

Example:

```text
atlasAWSInventoryFormatter.js -> inventoryAWSFormatter.js
atlasAWSInventoryMessageBuilder.js -> inventoryAWSMessageBuilder.js
atlasAWSInventoryNavigatorAdapter.js -> inventoryAWSNavigatorAdapter.js
```

And possibly:

```text
atlasEC2Formatter.js -> scanEC2Formatter.js
atlasEC2MessageBuilder.js -> scanEC2MessageBuilder.js
atlasEC2ScanNavigatorAdapter.js -> scanEC2NavigatorAdapter.js
```

Do this only as a separate cleanup pass.

### Future Stage 7: Avoid Premature Abstraction

Do not add:

- registries
- schema engines
- dynamic plugins
- universal rendering frameworks
- giant inheritance systems

Keep this understandable.

## Finished

### Done: Stage 1 - Update Kite To Render Generic UI Data

This stage belongs in the Kite/client module, not this API module.

Kite should stop caring about inventory-specific fields and render generic Navigator UI primitives:

```text
for each stat -> render stat
for each alert -> render alert
for each table -> render GenericTable
for each card -> render card
```

The API already sends data in the generic shape. Kite now needs to render it.

Expected data path:

```text
messageOutcome.data.atlasResponse.navigatorResponse.data
```

Example:

```js
const navigatorData =
    atlasResponse &&
    atlasResponse.navigatorResponse &&
    atlasResponse.navigatorResponse.data;
```

### Step 1A: Find The Current Atlas Response Renderer

Locate where Kite currently renders:

```text
atlasResponse
CloudPilotActionStatus
CloudPilotResponseMessage
```

Do not rewrite the whole screen. Find the smallest display point where the new generic blocks can be rendered.

### Step 1B: Add Generic Table Rendering

Create or reuse a simple `GenericTable`.

It should accept:

```js
{
    id: "aws_inventory",
    view_type: "table",
    title: "AWS Inventory",
    columns: [],
    rows: []
}
```

Rules:

- Use `row.row_id` as the row key.
- Use `column.key` to read the row value.
- Use `column.label` as the header.
- If `column.type` is missing, render as text.
- Do not add AWS-specific rendering.
- Do not branch on EC2, S3, findings, or scan type.

### Step 1C: Add Basic Type-Aware Display

Keep this minimal.

Supported types:

```text
text
number
currency
status
```

Initial behavior:

```text
text -> normal text
number -> normal number
currency -> show currency if value exists, otherwise "-"
status -> normal text or simple badge if already easy
```

Do not add a full formatting engine.

### Step 1D: Render Stats

Stats are simple blocks:

```js
{
    id: "findings",
    label: "Findings",
    value: 1,
    type: "number"
}
```

Kite should render all stats generically.

Do not hardcode:

```text
Resources Scanned
Findings
Region
```

Use whatever `label` and `value` are provided.

### Step 1E: Render Empty States Safely

Kite should handle:

```js
tables: []
rows: []
stats: []
alerts: []
cards: []
actions: []
```

Tables with columns but no rows should still render safely.

### Step 1F: Test With Inventory

Use `inventory_aws` first.

Expected:

```text
one AWS Inventory table
row_id exists on every row
columns render by key
metadata types do not break rendering
```

### Step 1G: Test With EC2 Scan

Use `scan_ec2` after inventory.

Expected:

```text
stats render
EC2 Instances table renders
EC2 Findings table renders
row_id exists on every row
```

### Done: Stage 1 - Define The Contract

The target response contract is defined:

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

Implemented in:

```text
application/atlas/functions/navigatorResponseFunctions.js
```

### Done: Stage 2 - Add Lightweight Column Metadata

Supported column types:

```text
text
currency
status
number
```

Columns may be simple:

```js
{
    key: "service",
    label: "Service"
}
```

Or include metadata:

```js
{
    key: "state",
    label: "State",
    type: "status"
}
```

Implemented helpers:

```text
NAVIGATOR_COLUMN_TYPES
createNavigatorTableColumn()
normalizeNavigatorTableColumns()
isSupportedNavigatorColumnType()
```

### Done: Stage 3 - Add Simple `view_type`

Every table created through the helper includes:

```js
view_type: "table"
```

Implemented in:

```text
createEmptyNavigatorTable()
```

### Done: Stage 4 - Add API/Navigator Adapter For Inventory

Inventory now maps to:

```text
meta
tables[0] = AWS Inventory
raw = null
```

Implemented in:

```text
application/atlas/functions/actions/aws/inventoryAWS/atlasAWSInventoryNavigatorAdapter.js
```

Wired additively in:

```text
application/atlas/functions/actions/aws/inventoryAWS/inventoryAWSHandler.js
```

The existing formatted inventory response remains intact.

### Done: Stage 5 - Add Scan Adapter

EC2 scan now maps to:

```text
stats:
- Resources Scanned
- Findings
- Scan Type
- Region

tables:
- EC2 Instances
- EC2 Findings
```

Implemented in:

```text
application/atlas/functions/actions/ec2/scanEC2/atlasEC2ScanNavigatorAdapter.js
```

Wired additively in:

```text
application/atlas/functions/actions/ec2/scanEC2/scanEC2Handler.js
```

The existing formatted scan response remains intact.

### Done: Stage 6 - Add `raw` As Opt-In

Default behavior:

```js
raw: null
```

Opt-in behavior:

```js
{
    includeRaw: true,
    raw: {}
}
```

Implemented in:

```text
atlasAWSInventoryNavigatorAdapter.js
atlasEC2ScanNavigatorAdapter.js
```

### Done: Stage 7 - Keep Atlas Completely Unchanged

Atlas still returns raw domain truth:

```js
{
    data: {
        items: []
    }
}
```

Or:

```js
{
    data: {
        instances: [],
        findings: []
    }
}
```

Navigator/API remains responsible for transforming Atlas data into generic UI primitives.

## Important Architecture Rules

### Rule 1 - Atlas Returns Raw Truth

Atlas should not know about:

- tables
- cards
- frontend components
- UI metadata

### Rule 2 - Navigator/API Shapes UI Data

Navigator/API owns:

- meta
- stats
- tables
- cards
- alerts
- actions
- raw opt-in behavior

### Rule 3 - Kite Renders Generic Primitives

Kite should never care about:

- EC2
- S3
- findings
- AWS-specific field names

Kite should only understand:

- tables
- rows
- columns
- stats
- metadata

### Rule 4 - Prefer Explicit Mappings

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
