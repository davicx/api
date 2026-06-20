# CloudPilot - Standard New Action Checklist

This document defines the standard workflow for adding a new CloudPilot action.

Examples:
- `scan_ec2`
- `toggle_ec2`
- `create_ec2`
- `resize_ec2`
- `delete_ec2`

The goal is:

```text
consistent architecture
predictable workflow behavior
stable frontend responses
easy scaling
```

## Quick Checklist

- [ ] Add action to `actionRegistry.js`
- [ ] Add/import execution handler
- [ ] Decide if action needs workflow fields
- [ ] Add required fields and missing-field messages
- [ ] Add field extractors if needed
- [ ] Add Atlas API function
- [ ] Add formatter
- [ ] Add message builder
- [ ] Return standard handler response
- [ ] Test intent detection
- [ ] Test missing fields
- [ ] Test confirmation or no-confirmation execution
- [ ] Test frontend response shape

## Overall Action Flow

Every CloudPilot action should follow this lifecycle:

```text
Registry
-> Workflow
-> Handler
-> Atlas
-> Formatter
-> Message Builder
-> Standard Response
```

## Phase 1 - Define The Action

### Step 1: Add Action To Action Registry

File:

```text
application/atlas/services/actions/actionRegistry.js
```

Add:
- `type`
- `actionLabel`
- `allowed`
- `requiresWorkflow`
- `requiresExecution`
- `match()`
- `requiredFields`
- `defaults`
- `executionFunction`
- `messages`

Example:

```js
resize_ec2: {

    //Identity
    type: 'resize_ec2',
    actionLabel: 'Resize EC2',

    //Policy
    allowed: true,

    //Orchestration
    requiresWorkflow: true,
    requiresExecution: true,

    //Intent Detection
    match: (text) =>
        text.includes('resize') &&
        text.includes('ec2'),

    //Fields Required Before Ready
    requiredFields: [
        'region',
        'instance_id',
        'instance_type'
    ],

    //Optional Defaults
    defaults: {},

    //Execution
    executionFunction: resizeEC2Handler,

    //User-Facing System Messages
    messages: {
        started: 'Preparing EC2 resize.',
        missingFields: {
            region: 'Which AWS region should I use?',
            instance_id: 'Which EC2 instance should I resize?',
            instance_type: 'What EC2 instance type would you like?'
        },
        ready: 'Everything is ready for the EC2 resize.',
        executing: 'Resizing EC2 instance.',
        success: 'EC2 resize completed.',
        failed: 'EC2 resize failed.'
    }
}
```

### Action Types

#### Workflow + Confirmation Action

Use when the action needs fields and should wait before execution.

Example:

```js
requiresWorkflow: true,
requiresExecution: true
```

Example actions:
- `create_ec2`
- `resize_ec2`
- `delete_ec2`

#### Immediate Execution Action

Use when the action has no required fields and should run immediately when matched.

Example:

```js
requiresWorkflow: false,
requiresExecution: true
```

Example actions:
- `inventory_aws`
- `scan_all_resources`

## Phase 2 - Create The Action Folder

### Step 2: Create Action Folder

Example:

```text
functions/actions/ec2/resizeEC2/
```

Typical files:

```text
resizeEC2Handler.js
atlasResizeEC2Formatter.js
atlasResizeEC2MessageBuilder.js
```

## Phase 3 - Build The Handler

### Step 3: Create Handler

Example:

```text
resizeEC2Handler.js
```

Responsibilities:
- validate collected fields
- call Atlas
- format Atlas response
- build user-facing message
- return standardized response

Required handler return shape:

```js
{
    success: true,
    cloudPilotMessage: "",
    atlasResponse: {},
    error: null
}
```

IMPORTANT:
Every handler should return the exact same structure.

## Phase 4 - Atlas Integration

### Step 4: Add Atlas Function

File:

```text
atlasEC2Functions.js
```

Example:

```js
async function resizeEC2(requestBody)
```

Responsibilities:
- call Atlas API
- validate HTTP response
- return raw Atlas response

IMPORTANT:
Do not format data here.

Formatting belongs in the formatter layer.

## Phase 5 - Field Extraction

### Step 5: Add Field Extractors If Needed

File:

```text
functions.js
```

Examples:

```js
extractInstanceType()
extractName()
extractVolumeSize()
```

Add extractor to:

```js
fieldExtractors
```

## Phase 6 - Workflow Field Support

### Step 6: Add Workflow Fields

Examples:
- `region`
- `instance_id`
- `ami_id`
- `volume_size`

Verify:
- extractor exists
- field collection works
- missing fields update correctly
- state updates correctly

## Phase 7 - Intent Detection

### Step 7: Add Intent Matching

Usually handled inside the registry:

```js
match: (text) =>
    text.includes('resize') &&
    text.includes('ec2')
```

MVP rule:
Keep matching simple.

## Phase 8 - CloudPilot User Messages

### Step 8: Add Workflow Messages

Inside registry:

```js
messages: {
    started,
    missingFields,
    ready,
    executing,
    success,
    failed
}
```

These messages power:
- workflow onboarding
- missing field prompts
- execution confirmation
- success/failure responses

## Phase 9 - Execution Layer

### Step 9: Verify AtlasExecution Support

Current execution flow:

```text
AtlasExecution.startNewAtlasExecution()
```

Long-term execution flow:

```text
lookup action
run executionFunction
track execution state
store execution result
```

IMPORTANT:

`getActionDefinition()` removes:
- `executionFunction`
- `match`
- `defaults`

So `AtlasExecution` should eventually load the full action directly from:

```js
actionRegistry[payload.actionState.pendingAction]
```

## Phase 10 - Response Validation

### Step 10: Verify Standard Response Shape

Every handler should consistently return:

```js
{
    success,
    cloudPilotMessage,
    atlasResponse,
    error
}
```

The outer API response may include extra CloudPilot state:

```js
{
    success,
    cloudPilotMessage,
    cloudPilot,
    atlasResponse,
    error
}
```

This is critical for:
- frontend stability
- React context updates
- predictable dashboard rendering

## Phase 11 - Testing

### Step 11A: Test Intent Detection

Example:

```text
resize my ec2
```

Expected:

```text
resize_ec2
```

### Step 11B: Test Missing Fields

Example:

```text
region: "us-west-2"
```

Verify:
- field collected
- missing fields updated

### Step 11C: Test Ready Transition

Verify:

```js
status === "ready"
```

### Step 11D: Test Confirmation Or Immediate Execution

For confirmation actions, example:

```text
yes
```

Verify:
- execution requested
- execution lifecycle begins

For immediate execution actions, verify:
- action runs when matched
- no confirmation prompt appears

### Step 11E: Test Execution

Verify:
- `AtlasExecution` runs
- status becomes `running`
- status becomes `completed`

### Step 11F: Test Cleanup

Verify:

```js
actionState.clear(conversationID)
```

runs successfully after completion.

## Important Architecture Rules

### Rule 1 - Registry Is Static

The registry stores:
- metadata
- workflow requirements
- messages
- execution handlers

The registry does not store runtime state.

### Rule 2 - ActionState Is Runtime Only

`ActionState` stores:
- pending action
- missing fields
- collected fields
- workflow status

`ActionState` should never contain static definitions.

### Rule 3 - Atlas Handles AWS

Atlas is responsible for:
- AWS execution
- infrastructure interaction
- cloud operations

CloudPilot orchestrates workflows.

### Rule 4 - Handlers Return Standardized Responses

Every handler should return:

```js
{
    success,
    cloudPilotMessage,
    atlasResponse,
    error
}
```

Consistency matters more than optimization.

## Design Goal

CloudPilot should scale by adding actions that all follow the same lifecycle:

```text
new action
-> same workflow
-> same orchestration
-> same execution model
-> same response structure
```

This keeps the system:
- understandable
- maintainable
- scalable
- frontend-safe
