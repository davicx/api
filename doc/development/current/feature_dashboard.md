# CloudPilot — S3 Dashboard Migration (Atlas Design)

## What this does

Migrate the **old working kite dashboard** (real scan data + logic) into the
**new Atlas CloudPilot design**, with a clean **Buckets → Bucket → Finding**
drill-down.

```text
OLD WORKING DASHBOARD          NEW DESIGN HTML
real data + existing logic     findings + individualFinding mockups
          \                     /
           \                   /
            ↓                 ↓
         Atlas S3 Cloud pages
         (Buckets → Bucket → Finding)
```

**Status:** Current — plan approved; implement incrementally (Level 1 first).  
**Codename:** `feature_dashboard`  
**Aligned with:** Atlas chat scan card + migration notes (2026-09-20)

**Related:**
* [Friendly Dashboard (finished)](../finished/feature_friendly_dashboard.md) — prior S3 findings presentation work
* [S3 remediation modes](../future/feature_s3_remediation_modes.md) — Fix/remediation (later)
* [Dashboard companion chat](./feature_dashboard_chat.md) — right-panel Ask CloudPilot (after Level 1+)
* Design: `kite/kite/src/design/cloudPilot/dashboard/findings/`
* Design: `kite/kite/src/design/cloudPilot/dashboard/individualFinding/`

---

## Feeling we want

> Scan in chat → open Cloud → see buckets → open one bucket → understand one
> finding. Each page has one job. No mixed inventory + findings dump on Level 1.

---

## Hierarchy (locked)

```text
Cloud
  ↓
S3
  ↓
Buckets                 ← Level 1
  ↓
Individual Bucket       ← Level 2
  ↓
Individual Finding      ← Level 3
```

### Routes (locked)

```text
/cloud/s3/buckets
/cloud/s3/buckets/:bucketName
/cloud/s3/buckets/:bucketName/findings/:findingId
```

URL structure mirrors the UI hierarchy. Encode bucket names in the path
(`encodeURIComponent`).

**Update (2026-09-22):** For the first real-data Atlas ship, see
[feature_dashboard_real_data](./feature_dashboard_real_data.md) — **one
`DashboardPage`** on `/dashboard` with path-in-state for Buckets → Bucket
(URL sync optional later). Hierarchy and design below still apply; the React
tree does not need three separate page apps.

### Breadcrumbs (locked)

| Page | Breadcrumb |
|------|------------|
| Buckets | `Cloud / S3 / Buckets` |
| Bucket | `Cloud / S3 / Buckets / {bucketName}` |
| Finding | `Cloud / S3 / Buckets / {bucketName} / {findingTitle}` |

Visual source: `individualFinding` mockup (also used on Atlas `IndividualFindingPage` demo).

**Pattern (markup only — not a full page):**

```html
<div class="breadcrumb">
  <a href="…">Cloud</a>
  <span>/</span>
  <a href="…">S3</a>
  <span>/</span>
  <a href="…">Buckets</a>
  <span>/</span>
  <span>codepipeline-us-west-2-…</span>
</div>
```

Parents are links; current page is a plain `<span>` (not a link).

**CSS to preserve (quiet, no box):**

```css
.breadcrumb {
  display: flex;
  gap: 8px;
  margin-bottom: 25px;
  color: #8a9691;       /* muted */
  font-size: 13px;
}

.breadcrumb a {
  color: #23775b;       /* CloudPilot green-dark */
  font-weight: 600;
  text-decoration: none;
}
```

**Reusable component API** (`components/navigation/Breadcrumbs.js`):

```js
// items: { label, to? }[]  — omit `to` on the last (current) crumb
<Breadcrumbs
  items={[
    { label: 'Cloud', to: '/cloud' },       // or omit until /cloud exists
    { label: 'S3', to: '/cloud/s3/buckets' },
    { label: 'Buckets', to: '/cloud/s3/buckets' },
    { label: bucketName },                 // current — no `to`
  ]}
/>
```

Rules:
* Small, muted typography — do not enlarge or restyle as a nav bar
* Parents clickable; current crumb not clickable
* No boxed background, border, or giant breadcrumb component
* Separators are plain `/` spans (as in the mockup)
* Not S3-specific — pass `items` only

---

## Design source of truth

| Level | HTML mockup |
|-------|-------------|
| Buckets table (visual) | `design/cloudPilot/dashboard/findings/index.html` (+ CSS) |
| Bucket + findings table | `design/cloudPilot/dashboard/individualFinding/index.html` (+ CSS) |

**Do not redesign from scratch.** Adapt mockup look into Atlas React pages
(scoped CSS / same visual language as Connections / scan card).

### CloudPilot visual language (keep)

* Whitespace, restrained green, pale green info areas
* White cards, subtle borders, rounded corners
* Simple tables, small uppercase labels, priority dots
* Green text actions (`View →`)
* Clean typography

**Old dashboard = logic/data.**  
**New HTML = design.**  
Do not bring old Bootstrap dashboard styling forward.

---

## Data architecture (locked)

```text
Existing POST /message (scan_s3)
     ↓
atlasResponse { findings, summary, buckets, navigatorResponse.data }
     ↓
AtlasFindingsContext { findings, navigatorData }
     ↓
Presentation helpers (s3FindingDisplay, currentScan, …)
     ↓
New React pages (Buckets / Bucket / Finding)
```

### Important facts

* There is **no separate inventory-only dashboard API**. Buckets + findings come
  from the same scan path as chat (`sendMessageAPI` / confirm → execute).
* **Do not** invent fake S3 inventory.
* **Do not** rewrite `scan_s3`, confirmation, or backend handlers.
* Association: `finding.resourceName === bucketName` (also accept
  `resource_name` via existing helpers).
* Stable finding id: **`findingID`** (from formatted findings). Prefer over
  title slugs. Navigator `row_id` often matches; use `findingID` as primary.

### Shared state — `AtlasFindingsContext`

Successful S3 scans (chat and/or Buckets “Scan S3”) must write:

```text
findings
navigatorData
```

into shared context so pages still have data after leaving chat.

Chat already normalizes a scan card from live `atlasResponse`; extend that path
to also populate context (same pattern as kite `DashboardPage` /
old `ChatPage`).

---

## Level 1 — Buckets page (implement first)

**Route:** `/cloud/s3/buckets`  
**Title:** `Buckets`  
**Subtitle:** Your S3 resources and anything CloudPilot thinks is worth looking at.

### Must include

* Breadcrumb: `Cloud / S3 / Buckets`
* Page title + subtitle
* `[ Scan S3 ]` — reuse `sendMessageAPI({ message: 'scan s3', … })` then set
  context (same as old dashboard `handleScanAws`)
* Buckets table only:

```text
BUCKET | REGION | HEALTH | FINDINGS | ACTION
```

* `View →` → `/cloud/s3/buckets/:bucketName`
* Real data via `buildFriendlyS3Buckets` + `groupFriendlyS3FindingsByBucket` /
  `collectS3FindingsFromScan`

### Must NOT include on this page

* Tags column
* Large “YOUR AWS ENVIRONMENT / N resources need attention” summary card
* Individual findings list under the table
* Mixing one bucket’s findings onto the buckets overview

> **Buckets page = bucket inventory only.** Intentional.

### Suggested look

```text
Cloud / S3 / Buckets

Buckets                                         [ Scan S3 ]

Your S3 resources and anything
CloudPilot thinks is worth looking at.

┌──────────────────────────────────────────────────────────┐
│ 3 buckets                          Last scanned just now │
├──────────────────────────────────────────────────────────┤
│ BUCKET              REGION      HEALTH        FINDINGS   │
│ codepipeline...     us-west-2   ● Attention       6  →   │
│ elasticbeanstalk... us-west-2   ● Attention       6  →   │
│ insta-app...        us-east-1   ● Attention       6  →   │
└──────────────────────────────────────────────────────────┘
```

---

## Level 2 — Individual Bucket (after Level 1 works)

**Route:** `/cloud/s3/buckets/:bucketName`

* Breadcrumb: `Cloud / S3 / Buckets / {bucketName}`
* Follow individualFinding mockup: eyebrow, bucket name, region · N findings
* Pale green summary (“N things are worth looking at…”)
* Findings table for **this bucket only** (`resourceName === bucketName`)
* Columns: Finding | Priority | What this means | Action (Review / Fix visual)
* Row click / action → Level 3 finding route
* Real findings only — use `getS3FindingDisplay` for friendly copy

---

## Level 3 — Individual Finding (after Level 2)

**Route:** `/cloud/s3/buckets/:bucketName/findings/:findingId`

* Lookup by **`findingID`**
* Show only fields supported by real data (title, priority, meaning, resource,
  optional cost fields if present)
* **Fix** lives here as the natural home — do **not** build remediation backend
  in this feature; TODO or reuse existing select-finding chat handoff if safe
* Breadcrumb includes finding title

---

## Chat scan card integration (secondary to Level 1)

In-chat `ScanResultCard` (already in Atlas):

| Control | Target (when wired) |
|---------|---------------------|
| Show all N findings | `/cloud/s3/buckets` |
| Fix (top finding) | `/cloud/s3/buckets/{bucket}/findings/{findingID}` |

* Extend `normalizeScanResult` / `topFinding` to retain **`findingID`** (+ resource)
* Do **not** dump all findings into chat
* Wire navigation after Level 1 exists; full Fix deep-link after Level 3

---

## Companion chat (separate feature)

Right-panel open/close chat is specified in
[feature_dashboard_chat](./feature_dashboard_chat.md) (design mock with
`--chat-width: 390px`).

**Out of scope for this dashboard drill-down feature.** Keep Cloud page layout
flexible enough to accept a right column later (see companion-chat doc).

---

## Suggested Atlas file layout

Fit into existing Atlas structure; names can adapt:

```text
kite/atlas/src/
  App.js                              # routes + AtlasFindingsContext provider
  functions/context/
    AtlasFindingsContext.js
  functions/findings/                 # already partially present — reuse
  pages/cloud/
    S3BucketsPage.js                  # Level 1
    S3BucketPage.js                   # Level 2
    S3FindingPage.js                  # Level 3
  components/cloud/
    S3BucketTable.js                  # optional; don’t over-split
  components/navigation/
    Breadcrumbs.js
  components/chat/scan/
    ScanResultCard.js                 # Show all / Fix → routes (later steps)
```

**Do not** create tiny cell components (`BucketName.js`, `PriorityDot.js`, …)
unless clearly needed.

Demo pages (`/findings`, `/individual-finding`) can remain under Projects as
static mocks until real Cloud routes replace them in the product path.

---

## What to reuse from old kite dashboard

| Reuse | Skip / don’t copy |
|-------|-------------------|
| `s3FindingDisplay.js` helpers | Bootstrap `DashboardPage` layout |
| `currentScan.js`, `selectedFinding.js` | Old `Friendly*` Bootstrap chrome |
| `sendMessageAPI` + scan message pattern | Tags expand panels on buckets table |
| `atlasResponse` → findings + navigator | EC2 dashboard pages |
| Friendly finding title/meaning maps | Backend/scan rewrite |

---

## Real data shapes (reference)

### Bucket (from `buildFriendlyS3Buckets`)

```js
{
  bucketName, region,
  health: 'needs_attention' | 'healthy',
  findingCount, findingLabel,
  tags,          // omit from Level 1 table
  details: { … } // available for later; not required on Level 1
}
```

### Finding (formatted `atlasResponse.findings[]`)

```js
{
  findingID, resourceName, resourceID,
  title, description, severity, priority, category,
  recommendationAction, remediationAvailable,
  estimatedMonthlySavings, …
}
```

---

## EC2 (later — same pattern)

```text
/cloud/ec2/instances
/cloud/ec2/instances/:instanceId
/cloud/ec2/instances/:instanceId/findings/:findingId
```

**Do not build EC2 Cloud pages in this feature.** S3 first; reuse the pattern.

---

## Scope guard

### Do NOT

```text
rewrite scan_s3 / backend APIs
change request/confirmation architecture
build EC2 dashboard pages
build companion chat
build cost analysis engine
build new remediation backend
build a giant global findings dump on Level 1
copy old dashboard Bootstrap styling
implement all three levels in one pass
```

### Do

```text
working old data/logic
  + new design
  + S3 drill-down routes
  + AtlasFindingsContext
  + incremental delivery
```

---

## Implementation order (locked)

### Step 1 — Level 1 only (start here)

```text
AtlasFindingsContext (+ wire App.js)
Breadcrumbs
S3BucketsPage + table
Route /cloud/s3/buckets
Chat successful scan → write findings + navigatorData to context
(Optional: Scan S3 button on Buckets page)
```

**Stop.** Verify with real AWS scan data. Report what changed.

### Step 2 — Level 2 Individual Bucket

```text
S3BucketPage
Route /cloud/s3/buckets/:bucketName
View → from buckets table
Findings table for one bucket
```

**Stop.** Click around. Adjust feel before Level 3.

### Step 3 — Level 3 Individual Finding

```text
S3FindingPage
Route …/findings/:findingId
Breadcrumb with finding title
Fix area = TODO / soft handoff only
```

### Step 4 — Chat card navigation

```text
topFinding.findingID
Show all → /cloud/s3/buckets
Fix → bucket/finding route
```

---

## Success criteria

### Level 1 done when

* `/cloud/s3/buckets` shows real buckets after a scan (chat or page button)
* Table columns match locked set (no Tags)
* No findings section on this page
* `View →` ready to navigate (or navigates once Level 2 exists)
* Context retains scan data across navigation from chat

### Feature done when

* Full drill-down works with real data
* Breadcrumbs navigate back up the hierarchy
* Chat “Show all” lands on Buckets
* Chat “Fix” can deep-link to a finding when ids exist
* No backend/scan architecture changes

---

## First coding instruction (when implementing)

> Start ONLY with Step 1 (context + Breadcrumbs + S3BucketsPage +
> `/cloud/s3/buckets`). Get Level 1 working with real scan data. Do **not**
> build all three levels at once. Stop and report before Level 2.
