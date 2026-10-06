# CloudPilot — Dashboard leftovers

## What this is

Finish navigation on the shipped `/dashboard` page. One React page. No new chat, no new remediation backend, no `/cloud/s3/…` routes.

The shipped page is in [feature_dashboard (finished)](../finished/feature_dashboard.md).

**Status:** Current — do these steps in order.  
**Codename:** `feature_dashboard`  
**App:** `kite/atlas` (port 3001). API is `api` (port 3003).  
**Page:** `kite/atlas/src/pages/DashboardPage.js`  
**Route:** `/dashboard` in `kite/atlas/src/App.js`

Scan data still comes from `POST /message` into `AtlasFindingsContext`, restored with `GET /cloudpilot/scans/conversation/:id/latest`. There is no dashboard inventory API.

```text
path []                              → resource list
path [resource]                      → that bucket or instance
path [resource, finding]             → one finding
```

`path[0]` is `{ type: 'resource', service: 's3' | 'ec2', id }`.  
S3 `id` is `bucketName`. EC2 `id` is `instanceId` or `instanceName`.  
`path[1]` is `{ type: 'finding', id }` from `findingIdentity` (`findingID`, else `id`, else `` `${friendlyTitle}-${ruleID}` ``).

Do not turn every finding into a real remediation. Do not change **Review all findings** (`reviewAllFindings` still writes “Review all findings is coming soon.”).

---

## 1. Individual finding — done in this working tree

Same `DashboardPage`. **Review** opens the finding. **Fix with CloudPilot** opens the existing panel.

Shows title, priority, resource, and what it means (`FindingDetail`).

* Versioning uses `buildS3VersioningFixContext` (`kite/atlas/src/functions/findings/s3VersioningFixContext.js`) and sends `Enable versioning for "{bucket}".` with `selectedFinding`.
* Every other finding stays a note via `addChatNote` (title, meaning, resource, priority). It does not send a message.
* S3 and EC2 both use `onReview={openFinding}`.

Functions: `openFinding`, `showResource`, `showAllResources`, `fixWithCloudPilot`.

Checked on `sam-youtube-demo`: Review opened “Encryption is off” and Fix wrote a note. “Versioning is off” opened the finding and did not send chat until Fix.

---

## 2. Clickable breadcrumb

Shape:

```text
S3 Buckets / {bucket} / {finding title}
EC2 Instances / {instance} / {finding title}
```

Do not prefix Cloud / S3.

Already wired with step 1:

* List name calls `showAllResources` (`setPath([])`).
* Resource name calls `showResource` (`setPath([path[0]])`).
* Finding title is the current page, not a link.

Left for this step: confirm that on both S3 and EC2. A refresh still drops the crumb because `path` is only React state (step 3).

---

## 3. Path in the URL

`path` is `useState` only. Refresh returns to the list.

Keep one page. Put the open resource and finding in the query, for example:

```text
/dashboard?path=s3/{bucket}
/dashboard?path=s3/{bucket}/{findingId}
/dashboard?path=ec2/{instanceId}
/dashboard?path=ec2/{instanceId}/{findingId}
```

On load, read that query back into `path` after the scan is restored. Otherwise the finding id will not match `selectedBucketFindings` / `selectedInstanceFindings`.

Back and the breadcrumb must update the URL as well as `path`.

---

## 4. Table cleanup

S3 bucket list only (`DashboardPage.js`, the `service === 's3' && !selectedBucket` block).

Drop the **Tags** column.  
Drop the **Your AWS Environment** summary under the list (`buildS3EnvironmentSummary` / `s3Summary` is only used there).

Keep columns: name, region, health, finding count, View.

EC2 list does not have Tags or that summary. Leave it.

`kite/atlas/src/pages/design/FindingsPage.js` is a design mock with the same labels. Do not treat it as the live page.

---

## 5. Scan S3 / Scan EC2

`renderPageActions` labels are “Scan S3” and “Scan EC2”. Today `onClick={openChat}` only opens the panel. It does not run a scan.

Open the existing chat and send that request through `sendMessage` (the same path as a typed message):

```text
Scan S3
Scan EC2
```

Do not add a second scan endpoint. CloudPilot’s request flow owns the rest (`waiting_on_fields` → `waiting_on_confirmation` → run).

---

## 6. Remove `/dashboard-chat`

Mock page with hardcoded buckets.

* Route: `kite/atlas/src/App.js` (`/dashboard-chat` → `DashboardChatPage`)
* File: `kite/atlas/src/pages/DashboardChatPage.js`

Nothing else links to `/dashboard-chat`. Live chat is the panel on `/dashboard`. Menu, recents, and scan “Show all” already go to `/dashboard`.

Delete the route and the page. Do not improve the mock.
