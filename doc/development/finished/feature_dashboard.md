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
  path []     → resource list
  path [one]  → that bucket or instance
```

**Status:** Shipped — 2026-10-04. Leftovers stay in [feature_dashboard](../current/feature_dashboard.md).  
**Codename:** `feature_dashboard`

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
