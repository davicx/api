# Verify an Existing Resource Before a CloudPilot Action

Use this guide when adding or changing a CloudPilot action that targets a
specific resource that must already exist.

Examples:

```text
pause_ec2
resume_ec2
delete_ec2
update_ec2_tag
delete_ec2_tag
```

Do not use this for actions that create resources or discover inventory:

```text
create_ec2
scan_ec2
scan_s3
inventory_aws
```

Those actions have no named existing target to verify before running.

---

# Goal

Never allow CloudPilot to confidently offer an execution path for a resource
that Atlas cannot find.

```text
Internal | OpenAI understanding
        ↓
normalized action + target values
        ↓
Atlas verification
        ↓
found     → normal action flow
not found → block action and offer its existing scan
error     → report the real infrastructure error
```

Atlas owns infrastructure truth. OpenAI and Internal search understand the
user’s request; neither decides whether a resource exists.

---

# Required action metadata

For every eligible action, add `verifyResource` to its `actionMap`
definition:

```js
verifyResource: {
    resourceType: 'ec2',
    regionField: 'region',
    scanAction: 'scan_ec2',
    targets: [
        { idField: 'instance_id' }
    ]
}
```

The `targets` list fits the existing `actionMap` declarative style while
covering both one-target and multi-target actions. For example,
`toggle_ec2` verifies both known instances before it can offer modes:

```js
verifyResource: {
    resourceType: 'ec2',
    regionField: 'region',
    scanAction: 'scan_ec2',
    targets: [
        { idField: 'primary_instance_id' },
        { idField: 'secondary_instance_id' }
    ]
}
```

For a later S3 action:

```js
verifyResource: {
    resourceType: 's3',
    regionField: null,
    scanAction: 'scan_s3',
    targets: [
        { idField: 'bucket_name' }
    ]
}
```

Only set this metadata when the action requires a real, pre-existing target.
Do not add it by default to every entry simply for uniformity.

---

# Required behavior

## Found

```text
required fields complete
        ↓
Atlas says exists=true
        ↓
CloudPilot continues to execution-mode selection or confirmation
```

## Not found

```text
required fields complete
        ↓
Atlas says exists=false
        ↓
CloudPilot does not show Instructions, CLI, PR, or Automatic
        ↓
CloudPilot offers the action's configured existing scan
```

Use deterministic copy:

```text
I couldn't find EC2 instance <id> in <region>.

Would you like me to scan EC2 and show you the instances you have?
```

`yes` must start the configured existing scan action. It must not confirm the
blocked mutation.

`no` cancels/closes the blocked target request.

## Atlas/AWS failure

```text
Atlas unreachable
AWS permission error
invalid credentials
unexpected lookup error
        ↓
show the real error
        ↓
do not return exists=false
do not offer scan as if the target is absent
```

## Execution-time race

Preflight verification does not replace the action’s final Atlas/AWS
validation. A target can disappear after verification and before Automatic
execution. The action handler must still map the final `not found` response
to failure and must never claim a successful change.

---

# Atlas contract

Start with resource-specific endpoints. Do not create a generic
`verifyResource()` framework before more than one resource type needs it.

Example EC2 endpoint:

```text
POST /ec2/verify
```

Request:

```json
{
  "region": "us-west-2",
  "instance_id": "i-0abc123"
}
```

Found:

```json
{
  "success": true,
  "data": {
    "exists": true,
    "resource_type": "ec2",
    "resource_id": "i-0abc123",
    "region": "us-west-2",
    "state": "running"
  }
}
```

Not found remains a successful verification response:

```json
{
  "success": true,
  "data": {
    "exists": false,
    "resource_type": "ec2",
    "resource_id": "i-0missing",
    "region": "us-west-2"
  }
}
```

Operational failures use the normal Atlas error response with
`success: false`.

---

# Atlas Test mock infrastructure

Atlas Test mode must have one shared fake AWS account:

```text
infrastructure.json
        ↓
resettable in-memory mock store
   ↙        ↓         ↘
scan     verify      actions
```

The JSON fixture is seed data only. The in-memory store is mutable during the
Test process so pause/resume can update state without writing to the checked-in
JSON file.

Never create separate hard-coded resource lists for:

```text
scan mock
verification mock
pause/resume mock
create mock
```

Test verification, scans, and existing-resource actions must observe the same
records.

---

# Request workflow rule

`decideNextStep()` is a pure synchronous decision layer. It must not call
Atlas. Run verification as an asynchronous preflight after CloudPilot persists
completed fields and before it speaks execution modes.

Use a dedicated state such as:

```text
waiting_on_resource_scan
```

for the not-found scan offer. This makes the meaning of `yes` unambiguous and
prevents it from reaching Automatic execution for the invalid resource.

---

# New files and folders for the first EC2 implementation

```text
atlas/app/
├── core/
│   ├── mock/                              # NEW
│   │   ├── infrastructure.json            # canonical Test resource seed
│   │   └── infrastructure_store.py        # shared resettable Test state
│   └── cloud/ec2/
│       └── ... single-instance lookup helper (NEW or extracted)
└── api/
    ├── services/
    │   └── ec2_operation_service.py       # UPDATE: verify EC2
    └── routes/
        ├── ec2_operation_routes.py        # UPDATE: POST /ec2/verify
        └── test/
            ├── ec2_operation_routes_test.py # UPDATE: shared state + verify
            └── ec2_scan_routes_test.py      # UPDATE: shared state

api/application/atlas/
├── providers/atlas/ec2/
│   └── changeEC2.js                       # UPDATE: verifyEC2
├── cloudPilot/
│   ├── requests/
│   │   ├── decideNextStep.js              # UPDATE: yes/no scan bridge
│   │   ├── decisionTypes.js               # UPDATE: response type
│   │   └── functions/requestStatusFunctions.js # UPDATE: status
│   ├── ... resource verification helper   # NEW narrow preflight helper
│   ├── chat/
│   │   ├── cloudPilotMessageFunctions.js  # UPDATE: async preflight hook
│   │   └── request/RequestConversation.js # UPDATE: not-found speech
│   └── actionMap.js                       # UPDATE: targetResource metadata
└── doc/
    ├── development/finished/
    │   └── feature_verify_request.md      # finished implementation record
    └── development/how_to/
        └── verify_existing_resource.md    # this reusable guide
```

The exact EC2 lookup-helper filename should be selected when implementation
starts, after checking whether extracting the existing private describe helper
actually reduces duplication.

---

# Coverage rules

| Action category | Uses shared mock infrastructure | Uses preflight verification |
|---|---:|---:|
| Create a resource (`create_ec2`) | Yes | No |
| Mutate one existing resource (`pause_ec2`, `resume_ec2`, `delete_ec2`, tag actions) | Yes | Yes |
| Mutate multiple existing resources (`toggle_ec2`) | Yes | Yes, every declared target |
| Read inventory (`scan_ec2`, `scan_s3`) | Yes | No |

The same mock account therefore supports the whole demo: create adds an EC2
record, pause/resume changes its state, delete removes or terminates it, and
scan/verify observe that resulting state.

---

# Checklist for each existing-resource action

- [ ] Action declares correct `verifyResource` metadata
- [ ] All target fields are required before verification
- [ ] Atlas has a resource-specific verify endpoint
- [ ] Found target reaches the existing mode/confirmation flow
- [ ] Not found blocks every execution path
- [ ] Not found `yes` starts the configured existing scan
- [ ] Not found `no` closes the blocked request
- [ ] Atlas errors are not mislabeled as absent resources
- [ ] Test scan, verify, and action use shared mock infrastructure
- [ ] Action handler still protects against an execution-time not-found race
