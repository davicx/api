# CloudPilot — Dashboard leftovers

## What this is

What is still open on the shipped `/dashboard` page. The page itself is in [feature_dashboard (finished)](../finished/feature_dashboard.md).

**Status:** Current — leftovers only.  
**Codename:** `feature_dashboard`  
**Page:** `kite/atlas/src/pages/DashboardPage.js`

---

## 1. Individual finding

Review on a finding opens the side chat. A versioning finding can send “Enable versioning…”. Other findings become a note in the panel.

Still missing: a finding view on the same page.

```text
path []                          → resource list
path [bucket or instance]        → that resource’s findings
path [resource, finding]         → one finding
```

* Same `DashboardPage`. Do not add `/cloud/s3/…` routes for this.
* Look the finding up by `findingID`.
* Show title, priority, meaning, and resource. Cost fields only when the scan has them.
* Breadcrumb: `S3 Buckets / {bucket} / {finding title}` (or the EC2 equivalent). Current crumb is not clickable.
* Design reference: `kite/kite/src/design/cloudPilot/dashboard/individualFinding/`.
* Fix stays a handoff into the existing chat flow. Do not build a new remediation backend here.

---

## 2. Small corrections on the page that exists

* Bucket table still has a Tags column and the “Your AWS Environment” summary under the list. The list’s job is buckets: name, region, health, finding count, View.
* “Scan S3” / “Scan EC2” opens the chat panel. It does not run the scan.
* The open resource is only in React state. A refresh returns to the list. Sync `path` into the URL when Back and refresh should keep the open bucket or instance.
* Breadcrumb is `S3 Buckets / {name}`. It does not include Cloud / S3.
* `/dashboard-chat` is still a mock page with hardcoded buckets (`DashboardChatPage.js`). The live panel is on `/dashboard`.
