# CloudPilot Tagging + Execution Metadata

## Goal

Standardize resource metadata during create operations so CloudPilot can:

- trace managed resources
- support future rollback and cleanup
- correlate workflows with infrastructure
- apply safety checks later

Keep this lightweight. Do not build policy engines, tag validation systems, or metadata registries.

## Architecture

```text
Navigator/API = orchestration + workflow metadata
Atlas = execution engine + minimal safety fallback
```

Workflow tags belong to Navigator/API:

- `environment`
- `cloudpilot-role`
- future: `cloudpilot-workflow-id`, `cloudpilot-action`, `cloudpilot-user`

Atlas adds a small safety baseline only when keys are missing:

```json
{
  "managed-by": "cloudpilot",
  "cloudpilot-managed": "true"
}
```

## create_ec2 MVP

### Workflow default tags

Defined in:

```text
application/atlas/services/actions/actionMap.js
```

Under `create_ec2.defaults.tags`:

```js
defaults: {
    tags: {
        'managed-by': 'cloudpilot',
        'cloudpilot-managed': 'true',
        'environment': 'demo',
        'cloudpilot-role': 'secondary'
    }
}
```

### Handler merge

In:

```text
application/atlas/functions/actions/ec2/createEC2/createEC2Handler.js
```

Merge order:

```text
actionMap.create_ec2.defaults.tags
+
user-provided tags from collected.tags
=
tags sent to Atlas
```

User tags are optional. If `collected.tags` is missing or not an object, treat it as `{}`.

For MVP, user tags may override workflow defaults if they use the same key.

### Atlas safety fallback

In:

```text
atlas/app/core/cloud/ec2/operations/manage_instances.py
```

After reading request tags and setting `Name`, Atlas fills in missing safety keys:

- `managed-by`
- `cloudpilot-managed`

Atlas does not overwrite tags Navigator already sent.

## Example payload to Atlas

```json
{
  "name": "remediation-test-1",
  "region": "us-west-2",
  "instance_type": "t3.micro",
  "tags": {
    "managed-by": "cloudpilot",
    "cloudpilot-managed": "true",
    "cloudpilot-role": "secondary",
    "environment": "demo",
    "team": "platform",
    "owner": "david"
  }
}
```

## Out of scope (for now)

- `toggle_ec2` metadata changes
- `delete_ec2` safety validation
- reserved-key override protection
- chat workflow collection for custom tags
- future workflow tags like `cloudpilot-workflow-id`

## Future considerations

Later optional workflow tags:

```json
{
  "cloudpilot-created-by": "atlas",
  "cloudpilot-workflow-id": "wf_123",
  "cloudpilot-action": "create_ec2",
  "cloudpilot-execution-mode": "automatic"
}
```

Later delete safety:

```json
{
  "safety": {
    "require_cloudpilot_managed": true
  }
}
```
