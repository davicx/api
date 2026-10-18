# CloudPilot — Resource History

## What this is

Recents tells you what you have been doing. History tells you what happened to one AWS resource.

A bucket or instance has its own timeline: Version A, then B, then C. If C broke something, you can look back at B. Restoring B is a later feature. The first version of history is read-only.

**Status:** Architecture locked. Do not implement from this file until a step is chosen.  
**Codename:** `feature_history`  
**Decision:** C — one timeline per resource, combining CloudPilot actions and configuration changes discovered during scans.

---

## Feeling we want

> One AWS resource → one timeline → many recorded states.

Open S3 bucket `hello` and see how its configuration changed, when it changed, and whether CloudPilot did it or only found it.

```text
S3 Bucket: hello
Resource history · us-west-2
Active

1. Version C — Today          Latest
   Versioning disabled
   Change detected during S3 scan

2. Version B — Yesterday
   Versioning enabled
   CloudPilot enabled bucket versioning

3. Version A — Tuesday
   Initial configuration captured
   First S3 scan
```

A version is the configuration recorded at that moment. It is not a backup of the bucket’s objects, and it is not a promise that CloudPilot can put every setting back.

---

## Three ideas, built separately

| Idea | Job | When |
|------|-----|------|
| History | Read-only timeline for one resource | First |
| Snapshots | Saved configuration for each version, plus compare | Second |
| Restore | Preview a supported change, confirm, apply, record it as a new version | Third |

Restore is **restore configuration**, not a universal Undo.

| AWS change | Can CloudPilot reverse it? |
|------------|----------------------------|
| EC2 instance type | Usually, with stop / change / start |
| EC2 tags | Yes, if the previous values were saved |
| EC2 stop / start | Usually, subject to instance state |
| S3 versioning | Not fully. Enabled versioning can be suspended. It cannot return to never-enabled |
| S3 deleted objects | Only if recoverable versions or backups exist |
| EC2 terminated instance | Cannot restore the original instance |

A restore compares current AWS state with the chosen version, shows the proposed changes, requires confirmation, and runs only supported operations. It records a new history entry. It does not erase the later version.

---

## Recents stays Recents

Recents stays the activity list across CloudPilot: scans, requests, and dashboards.

Resource History is a different page. It belongs to one resource, opened from a scan result, the dashboard, or later from an inventory.

```text
RECENTS
What have I been doing?

S3 scan completed
3 buckets · 18 findings

EC2 instance created
my-app-server

RESOURCE HISTORY
What happened to this resource?

S3: hello
Version C · Versioning disabled

EC2: my-app-server
3 recorded configuration changes
```

One scan of 20 resources is one Recents entry. It can create or update history for each of those 20 resources.

---

## Identity

Display names are not the primary key. Names change. The AWS identifier does not.

| Resource | Identity | Display name |
|----------|----------|----------------|
| S3 | Bucket name within the AWS partition | `hello` |
| EC2 | Account + region + instance ID | `my-app-server` |
| Future RDS | Account + region + DB identifier | `production-db` |

```json
{
  "resourceType": "ec2",
  "resourceId": "i-0123456789abcdef0",
  "resourceName": "my-app-server",
  "region": "us-west-2"
}
```

Store the AWS account ID in the internal resource key even while CloudPilot uses one profile. That avoids collisions when more than one account exists.

A resource is unique by account, type, and AWS identifier. EC2 identity also includes region. S3 identity includes the AWS partition where it matters.

---

## Use what already exists

Do not build a second history system. Connect the pieces that already exist.

| Existing piece | Job today | Change |
|----------------|-----------|--------|
| `cloudpilot_scan_snapshots` | Complete EC2 and S3 scan results | Keep |
| `ScanSnapshotService` | Saves formatted scans | Extend the integration. Do not duplicate it |
| `cloudpilot_requests` | Requests, field collection, confirmation | Keep |
| `cloudpilot_history` | CloudPilot changes and undo data | Keep. Point records at a resource |
| `historyBuilders` | Action-specific history records | Reuse |
| Recents | Recent scans, requests, dashboard activity | Keep its job |

A scan snapshot is a whole scan. A resource snapshot is one bucket or one instance at one moment.

```text
S3 Scan #104
  hello
  images
  backups

Resource history
  each bucket has its own versions and events
```

| Store | Question it answers |
|-------|---------------------|
| `cloudpilot_resources` | What is this thing? |
| `cloudpilot_resource_snapshots` | What did it look like? |
| `cloudpilot_history` | What did CloudPilot do to it? |
| `cloudpilot_scan_snapshots` | What did the overall scan produce? |

---

## New tables

### `cloudpilot_resources`

One row for each AWS resource CloudPilot has seen.

| Field | Purpose |
|-------|---------|
| `id` | CloudPilot internal resource ID |
| `aws_account_id` | Account that owns the resource |
| `resource_type` | `ec2` or `s3` |
| `resource_id` | AWS identifier |
| `resource_name` | Display name |
| `region` | EC2 region, or bucket location for S3 |
| `first_seen_at` | First discovered |
| `last_seen_at` | Last observed |

### `cloudpilot_resource_snapshots`

Immutable configuration states for one resource. A new row is a new version. Rows are not edited in place.

| Field | Purpose |
|-------|---------|
| `id` | Snapshot ID |
| `resource_id` | `cloudpilot_resources.id` |
| `version` | Integer version (shown as A, B, C) |
| `configuration` | JSON of supported settings |
| `configuration_hash` | Detects an unchanged configuration |
| `source` | `scan` or `change` |
| `scan_snapshot_id` | Optional originating scan |
| `history_id` | Optional originating change |
| `created_at` | When this configuration was captured |

`configuration` is normalized JSON, not one column per setting.

```json
{
  "versioning": "Enabled",
  "encryption": "AES256",
  "publicAccessBlock": {
    "blockPublicAcls": true,
    "ignorePublicAcls": true,
    "blockPublicPolicy": true,
    "restrictPublicBuckets": true
  }
}
```

That shape is an example. It is not a claim that the current scanner already returns every field.

Leave findings, recommendations, and utilization metrics out of `configuration`. Those can change when rules or time windows change, while the resource’s settings stay the same.

If a scan did not collect a setting, store unknown / not collected. Do not store it as disabled. An incomplete scan must not look like a configuration change.

### How `cloudpilot_history` connects

Keep `cloudpilot_history`. Review its real schema before writing the migration.

For a change that touches one resource, an internal `resource_id` on `cloudpilot_history` may be enough.

`toggle_ec2` can affect two instances. If the current schema cannot represent that, add `cloudpilot_history_resources` so one action can point at more than one resource. Do not record a two-instance action as if it happened to only one.

---

## How a scan updates history

Keep the current scan path. After the scan snapshot is saved, add one step.

```text
CloudPilot Chat
    → scanS3Handler
    → Atlas POST /scan/s3
    → formatted scan results
    → ScanSnapshotService
    → cloudpilot_scan_snapshots
    → Recents / Dashboard

Saved scan snapshot
    → ResourceSnapshotService
    → for each resource:
         identify the resource
         read the normalized configuration
         compare it with the latest recorded configuration
         save a new version only if it changed
```

| Scan | Bucket configuration | Result |
|------|----------------------|--------|
| Monday | Versioning off | Create Version A |
| Tuesday | Versioning off | No new version |
| Wednesday | Versioning on | Create Version B |
| Thursday | Versioning on | No new version |
| Friday | Versioning off | Create Version C |

The full scan is still saved every time in `cloudpilot_scan_snapshots`. The resource timeline only gains a version when the tracked configuration changes.

Normalize before compare: sort tags, canonicalize unordered values, drop metadata that is not configuration. A missing field is unknown, not deleted.

Recording is idempotent. Retrying the same scan or the same action does not create a duplicate version.

`ScanSnapshotService` owns the complete scan. `ResourceSnapshotService` owns per-resource versions. Neither takes the other’s job. Call the resource snapshot step only after a scan has been saved, or after a change has been verified.

---

## How a CloudPilot change updates the same timeline

Example: enable versioning on `hello`.

```text
User requests the change
    → existing confirmation / request flow
    → Atlas executes and verifies
    → history records the operation
    → snapshot captures the verified state
```

The action record can store only what that action changed, plus what an undo would need:

```json
{
  "action": "enable_s3_versioning",
  "status": "completed",
  "before": { "versioning": "Suspended" },
  "after": { "versioning": "Enabled" }
}
```

The resource snapshot stores the full supported configuration after the action, read back from AWS. Do not declare the new version verified from the request alone.

Capture the pre-change state when it is available. Execute. Read the actual AWS state. Then save the version.

A partial failure still gets an action-history record, even when CloudPilot cannot save a complete new snapshot. A failed EC2 action appears on the timeline without a new verified version.

An EC2 tag update follows the same rule: a history record for the action, and a new snapshot only if the tracked configuration changed.

---

## Changes made outside CloudPilot

1. Monday: a scan records Version A.
2. Tuesday: CloudPilot enables versioning and records Version B.
3. Wednesday: someone suspends versioning in the AWS Console.
4. Thursday: a scan sees the difference and records Version C.

| Version | Source | What the UI may say |
|---------|--------|---------------------|
| C | Scan | Change detected during scan |
| B | CloudPilot | Enabled bucket versioning |
| A | Scan | Initial configuration captured |

CloudPilot knows C differs from B. It does not know who changed AWS, or the exact time, unless something like CloudTrail is added later. The UI says “Change detected during scan.” It does not say “User changed versioning on Thursday.”

---

## Combined timeline

The page is one chronological view of two stored ideas:

- Configuration versions: what the resource looked like when observed.
- Action events: what CloudPilot attempted, completed, or failed.

A successful operation can produce both an action and a snapshot. The page shows them as one entry, not two.

```text
hello
S3 bucket · Resource history
Latest: C

Version C · Thursday
Versioning change detected
S3 scan · Suspended
View configuration →

Version B · Tuesday
Enabled bucket versioning
CloudPilot action · Completed
View configuration →

Version A · Monday
Initial configuration
S3 scan · Suspended
View configuration →
```

Compare is read-only in the first versions of this feature.

```text
Compare B → C
1 change

Setting               Version B    Version C
Versioning            Enabled      Disabled
Encryption            Enabled      Enabled
Public access block   On           On
```

Version B is yesterday’s recorded configuration, not a copy of the objects in the bucket.

“Explore restoring Version B” can be shown as a future action. It does not run in the MVP.

---

## Where it lives

| Layer | Responsibility |
|-------|----------------|
| React / CloudPilot UI | Recents, resource detail, versions, timeline |
| Node.js API | Resource identity, history links, snapshots, read API |
| Python Atlas | Read AWS configuration, scan, execute changes |
| Database | Existing scan results and change history, plus resource versions |

Node owns persistence and retrieval. Python does not get a second history database. React does not merge the records itself.

Possible read API, after the current routes are inspected. These are not implementation requirements yet.

| Endpoint | Job |
|----------|-----|
| `GET /resources` | List known resources |
| `GET /resources/:id` | Resource details |
| `GET /resources/:id/history` | Combined timeline |
| `GET /resources/:id/versions` | Configuration versions |
| `GET /resources/:id/versions/:version` | One recorded configuration |

---

## MVP

Prove the flow with one S3 bucket and two scans that show a real configuration difference. Then attach a successful CloudPilot action to that same timeline.

1. Inspect `cloudpilot_history`, `cloudpilot_scan_snapshots`, `ScanSnapshotService`, and the S3 and EC2 formatters.
2. Add stable resource identity for EC2 and S3.
3. Store normalized per-resource configuration snapshots.
4. Create a new version only when the tracked configuration changes.
5. Associate existing CloudPilot change records with resources.
6. Expose a read-only combined timeline.
7. Link to that timeline from scan results and the dashboard.

### Leave out

- Automatic restoration
- CloudTrail
- Scheduled background scans
- Storing every AWS property
- Resources other than EC2 and S3
- Backfill of old versions unless the old record actually contains a reliable configuration

An old scan or action without a captured state is not a recoverable version.

---

## Decisions already made

1. Resource history is not another Recents page. Recents is activity across CloudPilot. History belongs to one resource.
2. A version is an observed configuration. It is not a promise that every setting in it can be restored.
3. The timeline is option C: CloudPilot actions and scan-discovered changes on the same resource history.
4. History, snapshots, and restore ship separately. History is read-only first.

```text
                 CloudPilot
                     |
           +---------+---------+
           |                   |
        AWS Scan           AWS Change
           |                   |
     Save Scan Result     Save Action History
           |                   |
           +---------+---------+
                     |
             Identify Resource
                     |
          Capture / Compare State
                     |
        Save Version if Different
                     |
             Resource History
                     |
           View / Compare Versions
```

## Next step

Inspect the real `cloudpilot_history` schema, `cloudpilot_scan_snapshots` schema, `ScanSnapshotService`, and the S3 and EC2 formatters. That inspection decides which fields and builders to reuse, which database additions are actually required, and whether current scan output is enough to compare versions.
