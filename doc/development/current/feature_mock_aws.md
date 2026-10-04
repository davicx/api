# CloudPilot — Persistent Mock AWS (Sandbox)

## What this is

A note on making the existing mock infrastructure **persistent**, so CloudPilot can scan, pause, resume, and rescan a fake AWS environment without touching real AWS.

**Status:** Idea only. Not ready to build.  
**Codename:** `feature_mock_aws`  
**Do not implement from this file yet.**

Do not build a fake AWS platform. No database of AWS-like behavior, no VPCs, IAM, networking, or billing rules. The useful middle ground is a small persistent store behind the routes that already exist.

---

## Feeling we want

CloudPilot talks to the same FastAPI flow in test mode as in real mode. The difference is what sits under the routes: boto3, or a fake environment that remembers state.

```text
REAL MODE

CloudPilot
   ↓
FastAPI
   ↓
AWS / boto3
```

```text
SANDBOX MODE

CloudPilot
   ↓
FastAPI
   ↓
Fake AWS Environment
```

The Node app does not need to know which one it is.

---

## What already exists

Mock routes are no longer only canned JSON. Pause and resume already model state:

```text
CloudPilot
    ↓
Mock FastAPI routes
    ↓
infrastructure_store
    ↓
Fake EC2 resources
```

Those routes call `get_ec2()`, `stop_ec2()`, and `start_ec2()`. Keep the engine simple: route → operation → infrastructure provider. Evolve `infrastructure_store`. Do not replace it with a new stack.

Today the mock route itself still knows too much:

```python
instance = get_ec2(instance_id, region)

if not is_noop:
    instance = stop_ec2(instance_id, region)
```

That is fine for now. The persistent fake environment should live **behind** `infrastructure_store`, not inside the routes.

```text
TEST ROUTES
      │
      ▼
Fake Infrastructure Store
      │
      ├── EC2
      ├── S3
      └── maybe billing later
```

---

## Starting environment

A known demo environment CloudPilot can actually change.

```text
EC2

i-demo-web-01
name: wishlist-api
region: us-west-2
type: t3.small
state: running

i-demo-worker-01
name: background-worker
region: us-west-2
type: t3.micro
state: stopped

i-demo-old-01
name: old-test-server
region: us-west-2
type: t2.micro
state: running
```

```text
S3

wishlist-images
versioning: disabled
public_access: false

wishlist-backups
versioning: enabled
public_access: false
```

Example conversation:

> Scan my EC2 instances

CloudPilot finds all three.

> Pause wishlist-api

The normal flow runs `POST /ec2/pause` and the fake environment changes `wishlist-api` from `running` to `stopped`.

> Show my EC2 inventory

It reports stopped. That is more useful than a route that always returns `MOCK_PAUSE_DATA`.

---

## Version 1 — JSON files

Start simpler than a database.

```text
core/
    mock/
        infrastructure_store.py
        data/
            ec2.json
            s3.json
```

Example shape:

```json
{
    "instances": [
        {
            "instance_id": "i-demo001",
            "region": "us-west-2",
            "name": "wishlist-api",
            "instance_type": "t3.micro",
            "state": "running",
            "tags": {
                "Environment": "demo"
            }
        }
    ]
}
```

`stop_ec2("i-demo001", "us-west-2")` reads `ec2.json`, finds the instance, sets `state` to `stopped`, and saves the file.

Store API CloudPilot calls. Persistence stays behind these functions:

```python
get_ec2()
list_ec2()
create_ec2()
delete_ec2()
start_ec2()
stop_ec2()
update_ec2_tag()

get_s3()
list_s3()
enable_s3_versioning()
```

Existing routes become clients of that store.

```text
Mock Routes
    ↓
infrastructure_store.py
    ↓
JSON files
```

---

## Version 2 — SQLite, only if JSON gets annoying

Move the store when you need relationships, history, concurrent writes, multiple sandbox environments, or different demo accounts. The routes barely change.

```text
Mock Routes
    ↓
infrastructure_store.py
    ↓
SQLite
```

Do not start at the database.

---

## Reset

Add this with the JSON store:

```text
POST /test/infrastructure/reset
```

```text
ec2.json  →  default_ec2.json
s3.json   →  default_s3.json
```

One canonical CloudPilot Demo Environment, always the same start:

```text
3 EC2 instances
3 S3 buckets
known findings
known tags
known states
```

---

## Why this helps scans

Scans inspect the sandbox instead of returning a canned result.

```text
wishlist-api
type: t3.large
cpu_average: 4%
state: running
```

The fake scan can report:

```text
Finding:
wishlist-api appears oversized.

Current: t3.large
Suggested: t3.small
```

Then the whole loop is testable:

```text
Fake infrastructure
        ↓
CloudPilot scan
        ↓
Finding
        ↓
User chooses remediation
        ↓
Confirmation
        ↓
Fake infrastructure changes
        ↓
Rescan
        ↓
Finding disappears
```

That matches the MVP: scan → remediation → rescan, plus EC2 and S3 operations. You can type create, tag, pause, resume, scan, delete, and inventory and exercise the pipeline without touching AWS.

---

## What not to build

Only model a property if CloudPilot needs to read or change it.

Do not model:

```text
VPCs
subnets
IAM
security groups
availability zones
EBS
CloudWatch
real CPU simulation
networking
AWS billing rules
AWS dependency rules
instance boot times
eventual consistency
```

| Resource | Fake state worth storing |
|---|---|
| EC2 | ID, name, region, state, instance type, tags |
| S3 | bucket name, versioning, maybe public/private |
| Billing | maybe a few fixed fake cost records |
| Scan metadata | only fields required to generate findings |

---

## Recommendation

Pursue **CloudPilot Sandbox**. Do not make “database-backed fake AWS” the project.

```text
             CLOUDPILOT
                 │
        normal application flow
                 │
             FastAPI
            /       \
           /         \
      REAL MODE    TEST MODE
         │             │
       boto3      infrastructure_store
                       │
                    JSON files
```

A day or two making the existing mock store persistent and resettable is enough. JSON → SQLite only when JSON becomes annoying.
