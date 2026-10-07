# Feature: S3 versioning remediation

## Goal

Implement CloudPilot's first real S3 remediation:

```text
Versioning is disabled → Enable bucket versioning
```

The user opens a bucket finding in `DashboardPage`, clicks **Fix**, completes the request in the Dashboard companion chat, confirms the change, and receives a verified result.

## Scope

- Support the existing `s3_versioning_disabled` finding only.
- Add the CloudPilot action `enable_s3_versioning`.
- Support **Automatic / CloudPilot Does It** only.
- Keep the user on `DashboardPage`; do not navigate to `ChatPage`.
- Require explicit confirmation before changing AWS.
- Do not implement encryption, Fix All, instructions, CLI, or pull requests.

## User flow

```text
S3 scan
→ All Buckets
→ One Bucket
→ Versioning is disabled
→ Fix
→ Dashboard companion chat opens
→ Live versioning state is checked
→ Preview and cost warning are shown
→ User confirms or cancels
→ CloudPilot enables versioning
→ Live state is verified
→ Request is completed or failed
```

The Dashboard header controls and companion chat must remain available at every drill-down level.

## Existing finding identifiers

Reuse the current scanner values:

- Rule ID: `s3_versioning_disabled`
- Finding ID: `s3-versioning-off-{bucket_name}`
- Issue code: `VERSIONING_DISABLED`
- Recommendation: `ENABLE_VERSIONING`

Do not create another versioning finding code.

## Architecture

Use the existing CloudPilot operation path:

```text
Atlas React
→ Node API request pipeline
→ Atlas HTTP provider
→ Python Atlas service
→ boto3
→ AWS
```

Do not add direct CloudPilot AWS access to the Node API. Existing AWS operations and credentials are owned by the Python Atlas project.

## Frontend — `kite/atlas`

### New

- `src/functions/findings/s3VersioningFixContext.js`
  - Build the payload for the one versioning finding the user clicked.
  - Include action, bucket name, finding ID, rule ID, and scan snapshot ID.
  - This is not a list of findings and does not handle other S3 findings.

### Modify

- `src/pages/DashboardPage.js`
  - Show a working **Fix** only for versioning.
  - Leave other findings as **Review**.
  - Open the existing companion chat without leaving Dashboard.
  - Send structured context into the normal `/message` flow.
  - Never rely on a vague `"fix this"` message to identify the bucket.
- `src/functions/findings/s3FindingDisplay.js`
  - Map only `ENABLE_VERSIONING` to the available automatic remediation.

Example context:

```js
{
  action: 'enable_s3_versioning',
  bucketName: 'exact-bucket-name',
  findingId: 's3-versioning-off-exact-bucket-name',
  ruleId: 's3_versioning_disabled',
  scanSnapshotId: 123
}
```

## Node API — `api`

### New

- `application/atlas/cloudPilot/actions/enableS3Versioning/enableS3VersioningHandler.js`
- `application/atlas/providers/atlas/s3/enableS3Versioning.js`
  - Atlas HTTP calls for this action only: read versioning, then enable it.
- `application/atlas/cloudPilot/history/historyBuilders/enableS3VersioningHistory.js`
  - History record for this completed versioning change only.
- `test/application/atlas/cloudPilot/enableS3Versioning.test.js`
  - Request, confirmation, and handler tests for this action only.

### Modify

- `application/atlas/cloudPilot/masterCloudPilotCapabilities.js`
  - Register `enable_s3_versioning` as a live change action.
  - Use `bucket_name` in stored request fields.
  - Require confirmation.
  - Support automatic execution only.
  - Add application-controlled cost metadata.
- `application/atlas/cloudPilot/chat/cloudPilotMessageFunctions.js`
  - Convert validated Fix context into a deterministic action and request values.
- `application/atlas/cloudPilot/requests/functions/resourceVerificationFunctions.js`
  - Run the live S3 preflight and store its preview.
- `application/atlas/cloudPilot/chat/templates/requestTemplates.js`
  - Render the versioning confirmation preview.
- `application/atlas/cloudPilot/chat/templates/fieldPromptExamples.js`
  - Add `bucket_name`.
- `application/atlas/cloudPilot/history/functions/historyFunctions.js`
  - Register the history builder.
- `application/atlas/cloudPilot/execution/outcomes/outcomeRegistry.js`
  - Add S3 permission, update, and verification failures.
- `application/atlas/cloudPilotIntelligence/context/contextTypes/currentQuestionContext.js`
  - Preserve approved finding identifiers.
- `doc/database/create_tables/master_sql.sql`
  - Seed `enable_s3_versioning` into `cloudpilot_actions`.

No new database table is required. Store the preview and finding linkage in the existing request `collected` JSON.

## Python Atlas — `startup/atlas`

### New

- `app/core/cloud/s3/operations/enable_versioning.py`
- `app/api/services/s3_operation_service.py`
- `app/api/routes/s3_operation_routes.py`
- Focused operation tests.

### Modify

- `app/main.py`
  - Register the S3 operation routes.

## Live preflight

Before showing confirmation, call `get_bucket_versioning` and handle:

- `Enabled`: finish as a no-op; do not call Put.
- `Suspended`: preview re-enabling versioning.
- No `Status`: preview enabling versioning for the first time.
- AWS error: fail clearly; do not guess or show a confirmation.

Store the bucket, current state, proposed state, finding ID, scan ID, and cost metadata in the open request.

## Confirmation

The preview must include:

- Exact bucket name.
- Current state.
- Proposed state: Enabled.
- Benefit for future overwrites and deletions.
- Existing objects are not copied or recovered.
- A bucket cannot return to its never-versioned state; versioning can only be suspended.
- Lifecycle rules may require review.
- Cost classification: **Possible increase**.
- No activation fee, but retained versions consume storage.
- Confirm or cancel.

## Execution

After confirmation:

1. Read the live state again.
2. If already Enabled, return a successful no-op.
3. Otherwise call `put_bucket_versioning` with `Status: "Enabled"`.
4. Read the state again.
5. Report success only when the returned state is Enabled.
6. Record before state, after state, whether CloudPilot changed it, verification, finding ID, and scan ID.

Cancellation must never call `put_bucket_versioning`.

Required IAM permissions:

- `s3:GetBucketVersioning`
- `s3:PutBucketVersioning`

## Data rules

- The database remains the source of truth for the open request.
- A later `"yes"` acts on the stored request, not transient frontend state.
- Saved scans are historical snapshots and must not be rewritten.
- A fresh scan determines whether the finding is gone.
- Cost facts come from capability metadata, not OpenAI.

## Focused tests

Cover:

1. Fix sends the exact action and bucket.
2. Only versioning advertises an automatic Fix.
3. Request is stored with finding and scan IDs.
4. Preflight distinguishes Enabled, Suspended, and no Status.
5. Preflight failure prevents confirmation.
6. Confirmation includes current/proposed state and cost warning.
7. Cancel never mutates AWS.
8. A later confirmation uses the stored request.
9. Put runs exactly once when needed.
10. Already Enabled returns a no-op.
11. State is read again after Put.
12. Failed verification cannot report success.
13. Existing scans and EC2 actions still work.

## Definition of done

A user can scan S3, open a bucket, select its versioning finding, click Fix, review the bucket-specific automatic change and cost warning in the Dashboard chat, cancel without mutation or confirm, and receive a result that is successful only after AWS reports versioning as Enabled.
