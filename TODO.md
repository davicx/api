# Navigator UI Response Contract Plan

Add these changes carefully and incrementally. Do not redesign the system. The current architecture direction is good and should remain simple and understandable.

## Goal

Keep this mental model:

```text
Atlas = raw truth
Navigator/API = UI shaping layer
Kite = generic renderer
```

This plan only adds lightweight extensibility so the UI can evolve later without breaking the current design.

Do this in stages, not all at once.

This is a medium architecture change, but it can be a small implementation change if Atlas raw outputs stay intact and the API adds a thin Navigator/UI-shaping layer.

## Current Implementation Status

Stage 1 has started only as a safe contract/helper step.

Current helper:

```text
application/atlas/functions/navigatorResponseFunctions.js
```

Important: this helper is not wired into existing Atlas action handlers yet. Current API behavior should remain unchanged until the adapter stages.

## Is It Only API?

Mostly yes, but not entirely.

```text
Atlas: ideally no major change
API/Navigator: main change
Kite React: small renderer change
```

Atlas should keep returning raw domain truth, for example:

```json
{
  "data": {
    "instances": [],
    "findings": []
  }
}
```

Or:

```json
{
  "data": {
    "items": []
  }
}
```

The API/Navigator layer should transform that into generic UI primitives:

```json
{
  "success": true,
  "message": "",
  "statusCode": 200,
  "errors": [],
  "currentUser": "davey",
  "data": {
    "meta": {},
    "cards": [],
    "stats": [],
    "tables": [],
    "alerts": [],
    "actions": [],
    "raw": null
  }
}
```

Kite then renders those generic arrays.

## Recommended Staged Plan

### Stage 1: Define The Contract

Decide the final target UI response shape and freeze it early:

```json
{
  "success": true,
  "message": "",
  "statusCode": 200,
  "errors": [],
  "currentUser": "davey",
  "data": {
    "meta": {},
    "cards": [],
    "stats": [],
    "tables": [],
    "alerts": [],
    "actions": [],
    "raw": null
  }
}
```

Define table rules:

```json
{
  "id": "aws_inventory",
  "view_type": "table",
  "title": "AWS Inventory",
  "columns": [],
  "rows": []
}
```

Every row gets a stable row identifier:

```json
"row_id": "stable-id-here"
```

Response-level context goes in `meta`, not directly in tables or stats:

```json
{
  "meta": {
    "region": "us-west-2",
    "generatedAt": "2026-05-22T07:00:00Z",
    "resourceCount": 5,
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "total": 120
    }
  }
}
```

This stage is mostly agreement, so behavior risk is low.

Stage 1 should not force every action to return this shape immediately. It should only establish the shared helper/contract that later stages will use.

### Stage 2: Add Lightweight Column Metadata

This stage means using the optional `type` metadata in real Navigator tables. The contract can support it before every adapter uses it.

Columns should keep working in the existing simple form:

```json
{
  "columns": [
    {
      "key": "service",
      "label": "Service"
    }
  ]
}
```

Columns may also optionally contain lightweight metadata:

```json
{
  "columns": [
    {
      "key": "service",
      "label": "Service",
      "type": "text"
    },
    {
      "key": "cost_estimate_monthly_usd",
      "label": "Monthly Cost",
      "type": "currency"
    },
    {
      "key": "state",
      "label": "State",
      "type": "status"
    }
  ]
}
```

Initial supported column types:

```text
text
currency
status
number
```

Important rules:

- Keep metadata optional.
- Existing tables must continue working.
- Do not require every column to have `type` immediately.
- Default behavior should still work for plain text.
- Do not add a formatting engine yet.
- Do not add a plugin system.
- Do not add dynamic registries.

This is only simple metadata for future rendering improvements.

### Stage 3: Add Simple `view_type`

This stage means consistently using `view_type` in real table responses. The contract can support it before every adapter uses it.

Current table structure:

```json
{
  "id": "aws_inventory",
  "title": "AWS Inventory",
  "columns": [],
  "rows": []
}
```

Updated table structure:

```json
{
  "id": "aws_inventory",
  "view_type": "table",
  "title": "AWS Inventory",
  "columns": [],
  "rows": []
}
```

Purpose:

- Future-proof rendering.
- Support additional UI block types later.
- Keep the generic rendering architecture clean.

Important rules:

- Only add `view_type`.
- Do not redesign the API into a giant `views` array yet.
- Keep the current arrays: `tables[]`, `stats[]`, `cards[]`, `alerts[]`, `actions[]`.

### Stage 4: Add API/Navigator Adapter For Inventory First

Start with inventory because it is simpler.

Atlas currently returns:

```json
{
  "items": [
    {
      "service": "ec2",
      "id": "i-065f09252b2ea0471",
      "name": "Kite-env"
    }
  ]
}
```

Navigator should return one generic table:

```json
{
  "data": {
    "meta": {
      "region": "us-west-2",
      "resourceCount": 1
    },
    "tables": [
      {
        "id": "aws_inventory",
        "view_type": "table",
        "title": "AWS Inventory",
        "columns": [
          { "key": "service", "label": "Service", "type": "text" },
          { "key": "name", "label": "Name", "type": "text" },
          { "key": "region", "label": "Region", "type": "text" },
          { "key": "type", "label": "Type", "type": "text" },
          { "key": "state", "label": "State", "type": "status" },
          { "key": "cost_estimate_monthly_usd", "label": "Monthly Cost", "type": "currency" }
        ],
        "rows": [
          {
            "row_id": "i-065f09252b2ea0471",
            "service": "ec2",
            "name": "Kite-env",
            "region": "us-west-2",
            "type": "t3.micro",
            "state": "running",
            "cost_estimate_monthly_usd": 7.49
          }
        ]
      }
    ],
    "raw": null
  }
}
```

This proves the design with the least complexity.

### Stage 5: Update Kite To Render Generic UI Data

Kite should stop caring about inventory-specific fields and just do:

```text
for each stat -> render stat
for each alert -> render alert
for each table -> render GenericTable
for each card -> render card
```

This is the main frontend change, but it should be small if there is already a place where the action response is displayed.

Important rules for Kite:

- Use `row.row_id` as the table row key.
- Safely use optional column metadata when present.
- Keep rendering generic.
- Do not add hardcoded AWS logic.
- Do not add service-specific rendering.
- Tables must still work perfectly if metadata is missing.

Possible later behavior:

```text
type = "currency" -> format numbers as currency
type = "status" -> render badge/color
type = "number" -> right align
```

Keep implementation minimal for now. No complex styling system yet.

### Stage 6: Add Scan Adapter

Scan is richer, so do it after inventory.

Scan data should become:

```text
stats:
- Resources Scanned
- Findings
- Scan Type
- Region

tables:
- Instances
- Findings
```

The instances table gets rows with:

```json
"row_id": "i-065f09252b2ea0471"
```

The findings table gets rows with:

```json
"row_id": "ec2-lowcpu-i-065f09252b2ea0471"
```

This is where the architecture starts paying off, because Kite still renders generic tables.

### Stage 7: Add `raw` As Opt-In

Add `raw` to the contract now, but usually leave it as:

```json
"raw": null
```

Later, for debugging or developer mode:

```json
"raw": {
  "atlasAction": "scan",
  "response": {
    "...": "original Atlas response"
  }
}
```

Do not send raw by default forever. It can get large and may leak internal structure.

### Stage 8: Keep Atlas Completely Unchanged

Do not modify Atlas response structure as part of this UI contract work.

Atlas should continue returning raw domain truth like:

```json
{
  "items": []
}
```

Or:

```json
{
  "instances": [],
  "findings": []
}
```

Navigator/API remains responsible for transforming Atlas data into generic UI primitives.

## Example Final Table

```json
{
  "id": "aws_inventory",
  "view_type": "table",
  "title": "AWS Inventory",
  "columns": [
    {
      "key": "service",
      "label": "Service",
      "type": "text"
    },
    {
      "key": "state",
      "label": "State",
      "type": "status"
    },
    {
      "key": "cost_estimate_monthly_usd",
      "label": "Monthly Cost",
      "type": "currency"
    }
  ],
  "rows": [
    {
      "row_id": "i-065f09252b2ea0471",
      "service": "ec2",
      "state": "running",
      "cost_estimate_monthly_usd": 7.49
    }
  ]
}
```

This should remain lightweight, understandable, and easy to expand later.

## Important Architecture Rules

### Avoid Premature Abstraction

Do not add:

- Registries
- Schema engines
- Dynamic plugins
- Universal rendering frameworks
- Giant inheritance systems

Keep this understandable.

### Additive Changes Only

All changes should be backward compatible.

### Keep Rendering Generic

Kite should never care about:

- EC2
- S3
- Findings
- AWS-specific field names

Kite should only understand:

- Tables
- Rows
- Columns
- Metadata

### Keep The Mental Model Simple

```text
Atlas -> raw truth
Navigator/API -> UI shaping
Kite -> generic rendering
```

### Optimize For Clarity Over Cleverness

Prefer:

- Explicit structures
- Simple objects
- Readable transformations

Avoid:

- Magical behavior
- Hidden conventions
- Deeply nested abstractions

## How Major Is This?

```text
Architecture impact: high
Code change size: medium-small if staged
Risk: low if additive
```

The important thing is to avoid changing Atlas first. Let Atlas keep producing raw truth. Add the standard UI shape above it.

Best order:

1. Contract/helper only
2. Lightweight column metadata
3. Simple `view_type`
4. Inventory adapter
5. Generic Kite renderer
6. Scan adapter
7. Other Atlas actions
8. Optional raw/debug behavior

So: not all at once. Do inventory end-to-end first, then scan, then migrate the rest.
