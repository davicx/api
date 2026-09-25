# CloudPilot — Dashboard Real Data + Path Drill-Down

## What this does

Wire the **Atlas live `DashboardPage`** to real S3 scan data, and drill down
**inside one page** using a selected path (breadcrumb levels), not separate
page apps.

```text
Scan (chat or Scan S3)
     ↓
atlasResponse { buckets, findings, … }
     ↓
Shared findings state (session)
     ↓
DashboardPage path
  []              → Bucket list
  [bucket]        → That bucket’s findings
  [bucket, finding] → One finding   (later)
```

**Status:** Current — plan only; implement after companion chat panel is stable.  
**Codename:** `feature_dashboard_real_data`  
**Aligned with:** User path-in-state sketch (2026-09-22); companion panel on
`/dashboard`; old kite dashboard data pattern.

**Related:**
* [S3 Dashboard Migration](./feature_dashboard.md) — design hierarchy + mockups
  (Buckets → Bucket → Finding). This doc **updates the routing choice**.
* [Dashboard companion chat](./feature_dashboard_chat.md) — right-panel Ask CloudPilot
* [Friendly Dashboard (finished)](../finished/feature_friendly_dashboard.md) —
  presentation helpers
* Design: `kite/kite/src/design/cloudPilot/dashboard/findings/`
* Design: `kite/kite/src/design/cloudPilot/dashboard/individualFinding/`

---

## Feeling we want

> Scan in chat → open Dashboard → see buckets → click one → see its issues.
> One place. Clear breadcrumbs. No dump of every finding on the first screen.

---

## Decision: more pages vs one `DashboardPage`?

### Locked answer

**One `DashboardPage` handles all breadcrumb levels.**

Do **not** create separate route-apps for Buckets / Bucket / Finding for this
feature. Use **components inside `DashboardPage`**:

| Level | Path state | Component (conceptual) |
|-------|------------|------------------------|
| Buckets | `path = []` | `BucketList` |
| One bucket | `path = [{ type: 'bucket', id }]` | `BucketDetails` |
| One finding (later) | `path = [bucket, { type: 'finding', id }]` | `FindingDetails` |

* Every bucket uses the **same** `BucketDetails`; only the selected id changes.
* Breadcrumb clicks **shorten** `path` and re-render that level.
* Companion chat panel stays mounted on the page across levels (same project
  conversation).

### Why

* Matches the product mental model: one Cloud dashboard surface.
* Avoids remounting chat / losing local panel state on every drill-down.
* Matches the path-in-state sketch already approved for v1.

### Relationship to `feature_dashboard.md` routes

`feature_dashboard.md` locked URL paths:

```text
/cloud/s3/buckets
/cloud/s3/buckets/:bucketName
/cloud/s3/buckets/:bucketName/findings/:findingId
```

**Update for this feature:**

| Concern | This feature (`feature_dashboard_real_data`) |
|---------|-----------------------------------------------|
| React tree | **One** `DashboardPage` + level components |
| Location v1 | **`path` in React state** on `/dashboard` |
| Location later | Optional: sync same path into the URL (still one page) |

When browser Back / refresh / shareable deep links matter, put the path in the
URL (query, hash, or nested routes that still render `DashboardPage`). That is
**not** the same as building three independent pages.

**Route for now:** keep `/dashboard` (left menu Dashboard). Do not block Level 1
on `/cloud/s3/…` migration.

---

## Path model (locked)

```js
// []  → show all buckets
// [{ type: 'bucket', id: 'codepipeline-...' }]  → that bucket’s findings
// later:
// [
//   { type: 'bucket', id: '…' },
//   { type: 'finding', id: 's3-encryption-off-…' },
// ]
```

```text
Click bucket     → push { type: 'bucket', id }
Click finding    → push { type: 'finding', id }   (later)
Click breadcrumb → setPath(path.slice(0, index))
```

Breadcrumb UI (quiet, muted — same rules as `feature_dashboard.md`):

```text
Buckets                         ← path []
Buckets / {bucketName}          ← path [bucket]
Buckets / {bucket} / {title}    ← path [bucket, finding] (later)
```

Parents are links (or buttons that shorten path); current crumb is not clickable.

---

## Data architecture (locked)

```text
POST /message  (scan_s3 confirm → execute)
     ↓
atlasResponse { findings, summary, buckets, navigatorResponse? }
     ↓
Shared session store (AtlasFindingsContext or equivalent in kite/atlas)
     ↓
Helpers: collectS3FindingsFromScan / groupFriendlyS3FindingsByBucket /
         buildFriendlyS3Buckets  (reuse kite/atlas findings helpers)
     ↓
DashboardPage
  BucketList(buckets with finding counts)
  BucketDetails(findings where resourceName === bucket.id)
```

### Important facts

* **No new dashboard REST API** for v1. Data comes from the same scan path as
  chat.
* Findings are **not** in the messages table — only `atlasResponse` on the
  scan response. Without a shared store, navigating away or refreshing loses
  data.
* Join rule: `finding.resourceName === bucketName` (helpers also accept
  `resource_name`).
* Prefer **`findingID`** for finding path ids when Level 3 lands.
* **Do not** invent fake inventory. Mock `BUCKETS` in `DashboardPage` is
  temporary until context is wired.
* **Do not** rewrite `scan_s3`, confirmation, or Python scanners for this
  feature.

### Shared state

Successful S3 scans must write at least:

```text
findings
navigatorData   (if present — helps bucket rows)
summary         (optional — region, counts, last scanned)
```

Populate from:

1. ChatPage / dashboard panel send path (when `atlasResponse` has findings)
2. Dashboard “Scan S3” (same `sendMessageAPI` flow as old kite dashboard)

Empty dashboard: clear CTA — “Scan S3 in chat (or here) to load buckets.”

**Persistence:** session-only for v1. Server-side scan snapshots are out of
scope (future).

---

## Levels

### Level 1 — Bucket list (first implement)

**Path:** `[]`  
**Job:** Show scanned buckets + finding counts. One action: open a bucket.

* Replace hardcoded `BUCKETS` with context-backed list.
* “View →” / row click → `setPath([{ type: 'bucket', id: name }])`.
* Keep companion chat closed-by-default behavior from current `/dashboard`.
* Summary strip can use `summary.findingCount` / resources scanned when present.

### Level 2 — Bucket findings

**Path:** `[{ type: 'bucket', id }]`  
**Job:** Show findings for **that bucket only** (~6 issues), not the full
account dump.

* Filter findings by bucket id.
* Breadcrumb: Buckets (clears path) / {bucketName}.
* Reuse friendly titles/priority from `s3FindingDisplay`.
* Finding row click → Level 3 later; for now can open chat or no-op.

### Level 3 — Individual finding (later)

**Path:** `[bucket, { type: 'finding', id }]`  
**Job:** One finding detail (design: individualFinding mockup).

* Still the same `DashboardPage`.
* Optional: open companion chat with finding context (future companion doc).

### Level 4 — Remedy (later / out of scope)

Path may grow with `{ type: 'remedy', id }`. Do not implement in this feature.

---

## What already exists (reuse)

| Piece | Where |
|-------|--------|
| Live dashboard shell + chat panel | `kite/atlas/src/pages/DashboardPage.js` |
| Friendly grouping helpers | `kite/atlas/src/functions/findings/s3FindingDisplay.js` |
| Scan normalize / scan card | `normalizeScanResult.js`, ChatPage / panel |
| Working reference (old app) | `kite/kite` `DashboardPage` + `AtlasFindingsContext` |
| Scan payload | `atlasResponse` from `POST /message` |

Port the **context + scan → setFindings** pattern from `kite/kite` into
`kite/atlas`. Do not bring old Bootstrap layout.

---

## Out of scope

* Separate React pages / apps per breadcrumb level
* New inventory-only HTTP API
* Persisting findings to MySQL
* EC2 (or other services) on this dashboard path
* Remediation / Fix mutating AWS
* Redesigning the companion chat API
* Changing Projects menu or header Cloud → chat behavior

---

## Implementation order

1. **Shared findings context** in `kite/atlas` (findings + navigatorData).
2. **Write on scan** from ChatPage and DashboardPage panel / Scan S3.
3. **Level 1** — `BucketList` from real data; empty state.
4. **`path` state + breadcrumbs** — navigate Buckets ↔ one bucket.
5. **Level 2** — `BucketDetails` filtered findings.
6. **(Optional)** Sync `path` to URL for Back / refresh.
7. **(Later)** Level 3 finding detail component.

---

## Done when

* After a real `scan s3`, `/dashboard` shows real buckets (not the three mock
  rows), with correct finding counts.
* Clicking a bucket shows **only that bucket’s** findings.
* Breadcrumb returns to the bucket list without leaving `/dashboard`.
* Companion chat still uses the selected project conversation.
* Refresh without re-scan may empty the dashboard (accepted for v1) with a
  clear re-scan CTA.

---

## Open questions (non-blocking)

1. Should “Scan S3” on the dashboard run the full confirm flow in the panel, or
   only deep-link the user into chat? (Prefer: same confirm flow in panel.)
2. When to sync path → URL — after Level 2 feels good, or with Level 1?
3. Keep `/dashboard-chat` demo forever, or delete once real data ships?
