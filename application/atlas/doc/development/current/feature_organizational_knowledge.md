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

CloudPilot owns the organizational facts.  
OpenAI only helps understand the question and speak naturally about those facts.  
It does **not** invent why a bucket exists.

## Current step

**Step 1 — Add the database table and three demo S3 rows.**

## Next

Step 2 — Add `searchForOrganizationalKnowledge()` behind the Intelligence facade.

**Status:** Active  
**Related:** [Current Development](./current_development.md) · [Intelligence Front Door](./feature_intelligence_front_door.md) · [OpenAI Logs](./feature_openai_logs.md) · [Use OpenAI Chat](../how_to/use_openai_chat.md) · [Environment example](../../sample_env.md)

---

## MVP scope

**In:**

* S3 buckets only (`resource_type = s3_bucket`)
* Read only
* Demo data only
* One matching knowledge row loaded per question

**Out:**

* Learning / editing / CRUD screens
* Automatic discovery
* Other AWS services
* Embeddings / vector databases
* Storing cost in the knowledge table (cost comes from the AWS scan)

---

## Locked decisions

| Topic | Decision |
|-------|----------|
| Which bucket? | **Both:** selected finding in the UI, **or** bucket named in the message |
| How much knowledge to load? | **Only the matching row** — never every S3 bucket |
| Who detects the question? | **OpenAI** via `searchForOrganizationalKnowledge()` (same family as region search) — no regex MVP |
| Where does it live? | Intelligence search + `cloudPilot/knowledge/` loader — **no new response system** |
| Organization scope? | **Yes** — `master_site` + `resource_type` + `resource_name` |
| Cost? | From **AWS scan / live data**, not from the knowledge table |

---

## High-level flow

```text
User Message
      │
      ▼
CloudPilot Intelligence
      │
searchForOrganizationalKnowledge()
      │
OpenAI decides: is this about org knowledge for an S3 bucket?
      │
      ├── {}  → do nothing special
      │
      └── { knowledgeType: "s3", resourceName?: "..." }
                │
                ▼
        Load matching row
        (master_site + s3_bucket + name)
                │
                ▼
        Append Organization S3 Knowledge
        to OpenAI context
                │
                ▼
        Existing response pipeline
        (may also include live AWS facts such as cost)
```

Facade addition (same pattern as region / action / resource):

```text
CloudPilotIntelligence.understandOrganizationalKnowledge(...)
  → searchForOrganizationalKnowledge.js
```

---

## Database

One general table from day one:

```text
organization_knowledge
```

| Column | Purpose |
|--------|---------|
| `id` | Primary key |
| `master_site` | Organization scope |
| `resource_type` | MVP: `s3_bucket` |
| `resource_name` | Actual AWS name, e.g. `cloudpilot-user-uploads` |
| `display_name` | Friendly label |
| `purpose` | Why it exists |
| `notes` | Extra org context |
| `importance` | e.g. `low` / `medium` / `critical` |
| `recommended_action` | What CloudPilot should advise |
| `created_at` | |
| `updated_at` | |

Lookup key:

```text
master_site + resource_type + resource_name
```

### Demo rows (S3 only)

**sam-youtube-demo**

* Purpose: Created while following Sam's YouTube tutorial.
* Notes: Not used in over a month. Costs are live from AWS — do not store cost here.
* Importance: low
* Recommended action: Likely safe to delete.

**cloudpilot-assets**

* Purpose: Stores website images used by CloudPilot.
* Notes: Production bucket.
* Importance: medium
* Recommended action: Do not delete unless migrated.

**cloudpilot-user-uploads**

* Purpose: Stores user profile photos, group images, post images, uploaded content.
* Notes: Production user data.
* Importance: critical
* Recommended action: Do not delete. Recommend versioning. Recommend backups.

---

## Code layout

```text
cloudPilotIntelligence/
  CloudPilotIntelligence.js
    → understandOrganizationalKnowledge()   # NEW facade method
  understand/
    search/
      searchForOrganizationalKnowledge.js   # detect only; return {} or structured hit

cloudPilot/
  knowledge/
    organizationKnowledgeFunctions.js       # loadS3Knowledge / format for context
```

### Intelligence — detect only

`searchForOrganizationalKnowledge()` returns something like:

```json
{
  "knowledgeType": "s3",
  "resourceName": "cloudpilot-user-uploads"
}
```

or `{}` if not applicable.

It does **not** write the user-facing answer.

When the UI has a selected S3 finding, pass that bucket name into the search / loader so “What is this bucket for?” can resolve without naming it.

### CloudPilot — own the facts

`organizationKnowledgeFunctions.js`:

* Load the **one** matching row for `master_site` + `s3_bucket` + `resource_name`
* Format a short “Organization S3 Knowledge” block for context
* Return empty / skip if no row

### Context + respond

When a hit exists, append the knowledge block to the existing chat context, then speak through:

```text
CloudPilotIntelligence.chat()
```

(See [Intelligence Front Door](./feature_intelligence_front_door.md).)

Combine with live AWS facts when available (cost from scan, not from the knowledge table):

```text
AWS:        Bucket costs about $0.05/month.
Organization: Stores profile photos and user uploads. Critical.
AI:         Explains both together in natural language.
```

No separate `respondS3Knowledge.js`. Org knowledge is context for Conversation.

---

## Design principles

1. CloudPilot owns organizational knowledge.
2. OpenAI does not invent org facts.
3. OpenAI may classify the question and speak naturally about provided facts.
4. Cost and other live AWS state come from scans / Atlas — not from this table.
5. Same pattern must later support EC2, RDS, applications, runbooks, etc. by adding loaders and rows — not a new schema.

---

## Steps

### Step 1 — Database + demo data

1. Create `organization_knowledge` with the columns above.
2. Insert the three demo S3 rows for the demo `master_site`.
3. Confirm lookup by `master_site` + `s3_bucket` + `resource_name`.

### Step 2 — Intelligence search + facade

1. Add `searchForOrganizationalKnowledge.js` under `understand/search/`.
2. Wire `CloudPilotIntelligence.understandOrganizationalKnowledge(...)`.
3. OpenAI classifies: org-knowledge question about S3 or not.
4. Return structured hit or `{}`. Support selected finding + named bucket.

### Step 3 — Loader

1. Add `cloudPilot/knowledge/organizationKnowledgeFunctions.js`.
2. Implement load-one-row + format context block.
3. No cost fields in the formatted knowledge.

### Step 4 — Append context in existing chat path

1. When Step 2 returns a hit, load knowledge and append to context.
2. Existing general / explain response path speaks using that context.
3. If live AWS cost exists for the bucket, include it as AWS fact, not org knowledge.

### Step 5 — Demo smoke

1. Selected bucket `cloudpilot-user-uploads` + “What is this bucket for?”
2. Named bucket in message without selection.
3. Unrelated chat does not load knowledge.
4. OpenAI does not invent purpose when no row exists.

---

## Future (not this MVP)

New `resource_type` values and loaders only, for example:

```text
loadEC2Knowledge()
loadApplicationKnowledge()
loadRunbookKnowledge()
```

Same table. Same Intelligence search pattern. Same context append.

---

## Acceptance (MVP)

| Check | Expected |
|-------|----------|
| Selected production uploads bucket | Accurate purpose + do-not-delete guidance |
| Named demo tutorial bucket | Accurate low-importance / likely-safe guidance |
| No matching row | No invented org story |
| Unrelated “hello” | No knowledge block loaded |
| Cost mentioned | Comes from AWS/live data when available, not from the table |

---

## Next

Say **go Step 1** to create the table and demo rows only.
