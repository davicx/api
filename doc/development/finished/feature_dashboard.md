# CloudPilot — Dashboard (shipped)

## What shipped

One Atlas page, `/dashboard`, in `kite/atlas/src/pages/DashboardPage.js`.

```text
Scan (chat or the dashboard panel)
     ↓
atlasResponse
     ↓
AtlasFindingsContext
     ↓
DashboardPage
  path []                 → resource list
  path [resource]         → that bucket or instance
  path [resource, finding] → one finding
```

**Status:** Shipped — 2026-10-04. Navigation leftovers finished — 2026-10-07.  
**Codename:** `feature_dashboard`  
**App:** `kite/atlas` (port 3001). API is `api` (port 3003).

The earlier split (`feature_dashboard_real_data`, `feature_dashboard_chat`, and the `/cloud/s3/…` route plan) is this same page. Those notes are retired.

---

## On the page

* Real S3 buckets and finding counts from the scan. Helpers: `buildFriendlyS3Buckets`, `groupFriendlyS3FindingsByBucket`, `collectS3FindingsFromScan`.
* Opening a bucket shows only that bucket’s findings. The breadcrumb returns to the list without leaving `/dashboard`.
* EC2 uses the same list → one instance path.
* Right-side CloudPilot panel (~390px). Ask CloudPilot opens it, × closes it, the context strip follows the page, and send uses the selected project conversation.
* Chat “Show all” opens `/dashboard`.
* Latest scan for the conversation is restored from `GET /cloudpilot/scans/conversation/:id/latest`, with a session cache.

There is no separate dashboard inventory API. Data still comes from the scan on `POST /message`.

---

## Navigation leftovers (finished 2026-10-07)

Same page. No new chat, remediation backend, or `/cloud/s3/…` routes.

`path[0]` is `{ type: 'resource', service: 's3' | 'ec2', id }`.  
S3 `id` is `bucketName`. EC2 `id` is `instanceId` or `instanceName`.  
`path[1]` is `{ type: 'finding', id }` from `findingIdentity` (`findingID`, else `id`, else `` `${friendlyTitle}-${ruleID}` ``).

### Individual finding

**Review** opens the finding. **Fix with CloudPilot** opens the existing panel.

Shows title, priority, resource, and what it means (`FindingDetail`).

* Versioning uses `buildS3VersioningFixContext` and sends `Enable versioning for "{bucket}".` with `selectedFinding`.
* Every other finding stays a note via `addChatNote`. It does not send a message.
* S3 and EC2 both use `onReview={openFinding}`.

Functions: `openFinding`, `showResource`, `showAllResources`, `fixWithCloudPilot`.

Do not turn every finding into a real remediation. **Review all findings** still writes “Review all findings is coming soon.”

### Breadcrumb

```text
S3 Buckets / {bucket} / {finding title}
EC2 Instances / {instance} / {finding title}
```

List name → `showAllResources`. Resource name → `showResource`. Finding title is the current page, not a link.

### Path in the URL

```text
/dashboard?path=s3/{bucket}
/dashboard?path=s3/{bucket}/{findingId}
/dashboard?path=ec2/{instanceId}
/dashboard?path=ec2/{instanceId}/{findingId}
```

View, Review, and the breadcrumb update the query. A new scan, Show all, or a project switch clears it. Restoring the latest scan does not. A query that does not match the restored scan is dropped after the scan loads.

### Table cleanup

S3 bucket list columns: name, region, health, finding count, View. Tags and the **Your AWS Environment** summary are gone. EC2 list was left alone. `FindingsPage.js` is still the design mock.

### Scan S3 / Scan EC2

`renderPageActions` opens the existing chat and sends `Scan S3` or `Scan EC2` through `sendMessage`. No second scan endpoint. CloudPilot’s request flow owns the rest.

### `/dashboard-chat`

Mock page kept as `kite/atlas/src/pages/design/DashboardChatPage.js`. Route removed from `App.js`. Live chat is the panel on `/dashboard`.
