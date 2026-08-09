# Organizational Knowledge

## What this does

CloudPilot explains **why** an S3 bucket exists in your organization — not just what AWS reports about it.

Example:

```text
User:
What is this bucket for?

CloudPilot:
This bucket stores profile photos, group photos, and user uploaded images
for the CloudPilot application. This is production data. I would not
recommend deleting it. I also recommend enabling versioning and ensuring
it is included in your backup strategy.
```

With tags / aliases, natural demos also work:

```text
Tell me about my tutorial bucket.     → tag "tutorial" → sam-youtube-demo
What is the website images bucket?  → tag "website images" → cloudpilot-assets
Is my user uploads bucket important? → tag / display → cloudpilot-user-uploads
```

CloudPilot owns the organizational facts.  
OpenAI only helps understand the question and speak naturally about those facts.  
It does **not** invent why a bucket exists.

## Current step

**Step 1 — Database + demo data** (`organization_knowledge` + `organization_knowledge_tags` + three S3 rows + tags).

SQL ready:

* [organization_knowledge.sql](../../sql/organization_knowledge.sql) — tables
* [seed/seed_organization_knowledge.sql](../../sql/seed/seed_organization_knowledge.sql) — demo rows + tags  
* Also included in [master_sql.sql](../../sql/master_sql.sql)

## Next

Say **go Step 1** to apply SQL (or apply the files above). Then Step 2 — Intelligence search.

**Status:** Active  
**Related:** [Current Development](./current_development.md) · [CloudPilot Context](../finished/feature_cloud_pilot_context.md) · [Intelligence Front Door](../finished/feature_intelligence_front_door.md) · [Use OpenAI Chat](../how_to/use_openai_chat.md)

---

## MVP scope

**In:**

* S3 buckets only (`resource_type = s3_bucket`)
* Read only
* Demo data only
* One matching knowledge row loaded per question (or ask if ambiguous)
* Tags / aliases for human-friendly lookup

**Out:**

* Learning / editing / CRUD screens
* Automatic discovery
* Other AWS services
* Embeddings / vector databases
* Generic global `tags` + join map (three-table abstraction) — **not needed yet**
* Storing cost in the knowledge table (cost comes from the AWS scan)

---

## Locked decisions

| Topic | Decision |
|-------|----------|
| Which bucket? | **Selected finding**, **exact resource name**, **display_name**, or **tag** |
| Canonical DB key | `master_site` + `resource_type` + `resource_name` (exact) |
| How much knowledge to load? | **Only the matching row** — never every S3 bucket / never all tags into OpenAI |
| Who detects the question? | **OpenAI** via tiny `searchForOrganizationalKnowledge()` — extract reference, do not invent facts |
| OpenAI hit shape | `{ knowledgeType, resourceReference }` — reference may be name, display, or tag text |
| Who resolves the resource? | **CloudPilot DB** (`findOrganizationKnowledge`) |
| Ambiguous tag/name | `LIMIT 2` — if 2+ rows, return ambiguous (ask user); MVP tags stay unique enough |
| Where does it live? | Intelligence search + `cloudPilot/knowledge/` loader — **no new response system** |
| Tags schema | Dedicated `organization_knowledge_tags` (1→many) — not a global tags table |
| Cost? | From **AWS scan / live data**, not from the knowledge table |

---

## High-level flow

```text
User Message
      │
      ▼
CloudPilot Intelligence
      │
searchForOrganizationalKnowledge()     ← tiny Search context (TASK + message)
      │
OpenAI extracts reference (or {})
      │
      ├── {}  → do nothing special
      │
      └── { knowledgeType: "s3", resourceReference: "tutorial" }
                │
                ▼
        CloudPilot DB resolution
        (exact name → display_name → tag)
                │
                ├── 0 rows → no knowledge block
                ├── 1 row  → load that record (+ its tags if useful)
                └── 2+     → ambiguous — ask which resource
                │
                ▼
        Append Organization S3 Knowledge
        to Chat context (facts only)
                │
                ▼
        Existing response pipeline
        (may also include live AWS facts such as cost)
```

Fits [CloudPilot Context](../finished/feature_cloud_pilot_context.md): Search is a tiny classifier/extractor; CloudPilot owns truth; Chat speaks grounded facts.

Facade:

```text
CloudPilotIntelligence.understandOrganizationalKnowledge(...)
  → searchForOrganizationalKnowledge.js
```

---

## Database

### Tables

```text
organization_knowledge
        1
        │
        ▼
        many
organization_knowledge_tags
```

**`organization_knowledge`** — identity + org facts

| Column | Purpose |
|--------|---------|
| `id` | Primary key |
| `master_site` | Organization scope |
| `resource_type` | MVP: `s3_bucket` |
| `resource_name` | Actual AWS name, e.g. `sam-youtube-demo` |
| `display_name` | Friendly label, e.g. `Sam YouTube Demo` |
| `purpose` | Why it exists |
| `notes` | Extra org context |
| `importance` | e.g. `low` / `medium` / `critical` |
| `recommended_action` | What CloudPilot should advise |
| `created_at` / `updated_at` | |

Unique: `(master_site, resource_type, resource_name)`.

**`organization_knowledge_tags`** — human aliases / ways people refer to the resource

| Column | Purpose |
|--------|---------|
| `id` | Primary key |
| `organization_knowledge_id` | FK → knowledge row (CASCADE delete) |
| `tag` | e.g. `tutorial`, `youtube`, `hello world` |
| `created_at` | |

Unique: `(organization_knowledge_id, tag)`.

No separate global `tags` + map table for MVP.

### Resolution order (message / selection → one row)

```text
1. Selected finding          → exact resource_name
2. Exact AWS resource name   → resource_name
3. Friendly display name     → display_name
4. Tag / alias               → organization_knowledge_tags.tag
```

Canonical exact lookup remains:

```text
master_site + resource_type + resource_name
```

Conceptual loader:

```text
findOrganizationKnowledge(masterSite, resourceType, resourceReference)
```

```sql
SELECT DISTINCT ok.*
FROM organization_knowledge ok
LEFT JOIN organization_knowledge_tags okt
    ON okt.organization_knowledge_id = ok.id
WHERE ok.master_site = ?
  AND ok.resource_type = ?
  AND (
      ok.resource_name = ?
      OR ok.display_name = ?
      OR okt.tag = ?
  )
LIMIT 2;
```

`LIMIT 2` so CloudPilot can detect ambiguity instead of guessing.

### Demo data (master_site = `kite`)

| resource_name | display_name | Tags |
|---------------|--------------|------|
| `sam-youtube-demo` | Sam YouTube Demo | tutorial, youtube, hello world, sam |
| `cloudpilot-assets` | CloudPilot Assets | assets, website images, images, frontend |
| `cloudpilot-user-uploads` | CloudPilot User Uploads | uploads, user uploads, profile photos, group photos, production data |

**sam-youtube-demo** — Purpose: Created while following Sam's YouTube tutorial. Notes: Not used in over a month. Importance: low. Action: Likely safe to delete.  
**cloudpilot-assets** — Purpose: Stores website images used by CloudPilot. Notes: Production bucket. Importance: medium. Action: Do not delete unless migrated.  
**cloudpilot-user-uploads** — Purpose: Stores user profile photos, group images, post images, uploaded content. Notes: Production user data. Importance: critical. Action: Do not delete. Recommend versioning + backups.

Cost is **not** stored — live from AWS when available.

---

## Code layout

```text
cloudPilotIntelligence/
  CloudPilotIntelligence.js
    → understandOrganizationalKnowledge()   # NEW facade method
  understand/
    search/
      searchForOrganizationalKnowledge.js   # detect only; tiny Search context

cloudPilot/
  knowledge/
    organizationKnowledgeFunctions.js       # resolve + load one row + format context
```

### Intelligence — detect only (tiny Search)

Return:

```json
{
  "knowledgeType": "s3",
  "resourceReference": "tutorial"
}
```

or `{}` if not an org-knowledge question.

**Not** `resourceName` only — the reference may be a tag or display phrase, not the AWS name.

OpenAI does **not** receive all buckets/tags. It extracts how the human referred to something. CloudPilot resolves which row that is.

When the UI has a selected S3 finding, pass that bucket name into the loader (exact `resource_name`) so “What is this bucket for?” works without naming it.

### CloudPilot — own the facts

`organizationKnowledgeFunctions.js`:

* `findOrganizationKnowledge(...)` — name / display / tag (LIMIT 2)
* Format a short “Organization S3 Knowledge” block for **Chat** context
* Return empty / ambiguous / skip as appropriate
* No cost fields in the knowledge block

### Context + respond

When a hit resolves to one row, append the knowledge block to Chat context, then speak through:

```text
CloudPilotIntelligence.chat()
```

Combine with live AWS facts when available:

```text
AWS:        Bucket costs about $0.05/month.
Organization: Stores profile photos and user uploads. Critical.
AI:         Explains both together in natural language.
```

No separate `respondS3Knowledge.js`.

---

## Design principles

1. CloudPilot owns organizational knowledge.
2. OpenAI does not invent org facts.
3. OpenAI may extract a **resourceReference** and speak naturally about **provided** facts.
4. Cost and live AWS state come from scans / Atlas — not from these tables.
5. Tags are per knowledge row — simple 1→many; no global tag registry yet.
6. Same schema later supports EC2, RDS, applications, runbooks by adding rows + loaders — not a new model.

---

## Steps

### Step 1 — Database + demo data

1. Create `organization_knowledge`.
2. Create `organization_knowledge_tags`.
3. Insert three S3 demo resources (`master_site = kite`).
4. Insert human-friendly tags for each.
5. Confirm exact lookup by `resource_name`.
6. Confirm alias lookup by `tag` (e.g. `tutorial` → `sam-youtube-demo`).

SQL files: [organization_knowledge.sql](../../sql/organization_knowledge.sql) · [seed/seed_organization_knowledge.sql](../../sql/seed/seed_organization_knowledge.sql)

### Step 2 — Intelligence search + facade

1. Add `searchForOrganizationalKnowledge.js` (tiny TASK + message; no Identity dump).
2. Wire `CloudPilotIntelligence.understandOrganizationalKnowledge(...)`.
3. Return `{ knowledgeType, resourceReference }` or `{}`.
4. Support selected finding (exact name) + named / tagged references in message.

### Step 3 — Loader

1. Add `cloudPilot/knowledge/organizationKnowledgeFunctions.js`.
2. Implement `findOrganizationKnowledge` (name / display / tag, LIMIT 2).
3. Format one-row context block; handle ambiguous.

### Step 4 — Append context in existing chat path

1. On hit → resolve → append knowledge to Chat context.
2. Existing chat path speaks using that context.
3. Live AWS cost (if any) as AWS fact, not org knowledge.

### Step 5 — Demo smoke

1. Selected `cloudpilot-user-uploads` + “What is this bucket for?”
2. Named `sam-youtube-demo` in message.
3. Tag: “Tell me about my tutorial bucket.”
4. Display-ish: “Tell me about the Sam YouTube Demo bucket.”
5. Unrelated chat does not load knowledge.
6. No row → no invented purpose.

---

## Future (not this MVP)

* New `resource_type` values + loaders (`loadEC2Knowledge`, runbooks, …)
* Optional global tags registry only if many resources share vocab
* Soften open-request / finding UX elsewhere — not required for this table

---

## Acceptance (MVP)

| Check | Expected |
|-------|----------|
| Selected production uploads bucket | Accurate purpose + do-not-delete guidance |
| Named `sam-youtube-demo` | Low importance / likely safe |
| Tag `tutorial` | Resolves to `sam-youtube-demo` |
| Tag `website images` | Resolves to `cloudpilot-assets` |
| No matching row | No invented org story |
| Unrelated “hello” | No knowledge block loaded |
| Cost mentioned | From AWS/live data when available, not from the table |

---

## Next

Say **go Step 1** to apply the SQL (tables + seed) only — or apply the files under `doc/sql/` yourself.
