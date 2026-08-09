# CloudPilot Images — Instruction Image Catalog

## What this does

Move the metadata for the existing Create EC2 walkthrough images out of
`cloudpilot_instructions.image` and into a small CloudPilot-owned catalog:

```text
cloudpilot_instructions.image_id
        ↓
cloud_pilot_images.image_id
        ↓
image_key + image_path + display metadata
```

The first use case is the eight existing Create EC2 instruction images. This
is a contained normalization of an existing working instruction feature, not
a generic media system.

## Status

**Finished** — 2026-08-08  

Steps 1–4 done. Legacy `cloudpilot_instructions.image` dropped; paths come only
from `cloud_pilot_images` via `image_id`. Local URLs use
`/kite-us-west-two/instructions/...` (bucket mirror).

**Codename:** `feature_images`  
**Related:** [Current Development](../current/current_development.md) · [Friendly Create EC2](../current/feature_friendly_create_instance.md) · [Images SQL](../../sql/cloud_pilot_images.sql) · [Instructions SQL](../../sql/cloudpilot_instructions.sql) · [Drop alter](../../sql/alter/cloudpilot_instructions_drop_image.sql) · [Coding Style](../how_to/coding_style.md)

---

# Review findings — aligned to the current code

## What already exists

The instruction system is already one row per walkthrough step:

```text
cloudpilot_instructions
  instruction_for
  step_number
  title
  instruction
  image                ← existing relative image path
```

The eight Create EC2 rows use paths such as:

```text
instructions/create_ec2/create_ec2_image_1.png
```

`Instruction.getInstructionsByAction()` currently selects instruction rows,
then `instructionFunctions.normalizeInstructionStep()` emits:

```json
{
  "image": "instructions/create_ec2/create_ec2_image_1.png",
  "imageUrl": "/kite-us-west-two/instructions/create_ec2/create_ec2_image_1.png"
}
```

Kite consumes `imageUrl`. The migration must preserve both `image` and
`imageUrl` exactly, so no Kite/UI change is needed.

## Important corrections to the proposed plan

| Proposed name | Current reality | Locked approach |
|---|---|---|
| `cloudpilot_instructions.image_path` | The real column is `image` | Add `image_id`; join `img.image_path AS image` |
| `action_key` | The real column is `instruction_for` | Migrate Create EC2 rows with `instruction_for = 'create_ec2'` |
| `getImage()` helper immediately | Instruction loading only needs a SQL join | Do **not** add a repository in the first migration |
| Drop old path column after verification | Correct, but the column is `image` | Keep `image` through the first shipped migration; drop only in a separately approved cleanup |

The physical image files are not present in this workspace. The eight
database paths are already established and should be treated as the working
asset locations; this feature does not rename, move, upload, or generate
them.

---

# Architecture lock

## In scope

- A CloudPilot-owned image metadata catalog named `cloud_pilot_images`
- Stable human-readable `image_key` values
- One optional image per instruction row
- One image reusable by multiple instruction rows
- Migration of the eight existing `create_ec2` image references
- Instruction query join that preserves the API response contract

## Explicitly out of scope

```text
generic media / attachment system
uploads
image processing
image versioning
S3 management layer
image binaries in MySQL
polymorphic attachment tables
many-to-many instruction_images
Kite UI redesign
new Create EC2 walkthrough images
```

## Relationship

```text
cloud_pilot_images 1 ───< cloudpilot_instructions

Each instruction: zero or one image.
Each image: may be reused by many instructions.
```

This is sufficient for the present one-image-per-step instruction contract.
Do not introduce `instruction_steps`: the existing `cloudpilot_instructions`
table already represents instruction steps.

---

# Target schema

## 1. Image catalog

```sql
CREATE TABLE cloud_pilot_images (
    image_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    image_key VARCHAR(100) NOT NULL UNIQUE,
    image_name VARCHAR(255) NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);
```

`image_key` is the application-facing semantic identifier. Filenames and
numeric IDs remain implementation details:

```text
create_ec2_step_5
    → instructions/create_ec2/create_ec2_image_5.png
```

The table stores metadata and a relative path only (object key — no bucket).
`buildImageUrl()` prefixes `AWS_BUCKET_NAME` for local static URLs
(`/kite-us-west-two/instructions/...` → `public/kite-us-west-two/...`) and
uses the same object key inside the real S3 bucket when `FILE_LOCATION=aws`.

## 2. Optional image relationship

```sql
ALTER TABLE cloudpilot_instructions
    ADD COLUMN image_id BIGINT NULL AFTER image;

ALTER TABLE cloudpilot_instructions
    ADD INDEX idx_instruction_image_id (image_id);

ALTER TABLE cloudpilot_instructions
    ADD CONSTRAINT fk_cloudpilot_instruction_image
    FOREIGN KEY (image_id)
    REFERENCES cloud_pilot_images(image_id);
```

`image_id` remains nullable because some instruction sets (for example the
current pause/resume steps) intentionally have no image.

---

# Existing Create EC2 migration

## Catalog seed

Seed only the existing eight images. Do not move or rename the files.

```text
create_ec2_step_1 → instructions/create_ec2/create_ec2_image_1.png
create_ec2_step_2 → instructions/create_ec2/create_ec2_image_2.png
create_ec2_step_3 → instructions/create_ec2/create_ec2_image_3.png
create_ec2_step_4 → instructions/create_ec2/create_ec2_image_4.png
create_ec2_step_5 → instructions/create_ec2/create_ec2_image_5.png
create_ec2_step_6 → instructions/create_ec2/create_ec2_image_6.png
create_ec2_step_7 → instructions/create_ec2/create_ec2_image_7.png
create_ec2_step_8 → instructions/create_ec2/create_ec2_image_8.png
```

Names and accessible alt text should mirror each current instruction title:

```text
Open EC2
Launch Instance
Choose a Name
Select an AMI
Choose an Instance Type
Configure Security
Review Settings
Launch Instance
```

## Relationship migration

Use the actual existing `instruction_for` column:

```sql
UPDATE cloudpilot_instructions AS instruction_row
JOIN cloud_pilot_images AS image_row
    ON image_row.image_key = CONCAT(
        'create_ec2_step_',
        instruction_row.step_number
    )
SET instruction_row.image_id = image_row.image_id
WHERE instruction_row.instruction_for = 'create_ec2';
```

Before the update, verify exactly eight `create_ec2` rows and exactly eight
matching `create_ec2_step_N` image keys. After it, verify every Create EC2
instruction has a non-null `image_id`.

---

# Loader contract — preserve Kite behavior

The query becomes a left join:

```sql
SELECT
    instruction_row.instruction_id,
    instruction_row.instruction_for,
    instruction_row.step_number,
    instruction_row.title,
    instruction_row.instruction,
    instruction_row.image_id,
    instruction_row.warnings,
    instruction_row.estimated_time,
    instruction_row.optional,
    instruction_row.created_at,
    instruction_row.updated_at,
    image_row.image_path AS image,
    image_row.alt_text AS image_alt_text
FROM cloudpilot_instructions AS instruction_row
LEFT JOIN cloud_pilot_images AS image_row
    ON instruction_row.image_id = image_row.image_id
WHERE instruction_row.instruction_for = ?
ORDER BY instruction_row.step_number ASC;
```

Do **not** use `instruction_row.*` plus `image_path AS image` — that yields two
`image` columns and driver-dependent result objects. Select instruction columns
explicitly and leave legacy `instruction_row.image` out of the SELECT so there
is exactly one resulting `image` field (from the catalog).

`image_path AS image` deliberately preserves the current `Instruction` model
and API field names. `normalizeInstructionStep()` continues to build
`imageUrl` from `step.image`.

`image_alt_text` is available for a future API/UI accessibility extension,
but it is not emitted in the first migration unless the current frontend
needs it. Keeping the initial response unchanged reduces risk.

---

# Implementation steps (after approval)

### Step 1 — SQL catalog and safe migration

- [x] Create `doc/sql/cloud_pilot_images.sql` with the image table and eight-image seed
- [x] Create migration under `doc/sql/alter/cloudpilot_instructions_add_image_id.sql` that adds nullable `image_id`, index, and foreign key (also sections C–D in the one-shot file)
- [x] Map `create_ec2` steps 1–8 to `create_ec2_step_1` through `create_ec2_step_8`
- [x] Add the new table to `master_sql.sql` in dependency order

**Run on existing DB (one shot):**

```bash
mysql -u USER -p DATABASE_NAME < application/atlas/doc/sql/cloud_pilot_images.sql
```

### Step 2 — Preserve instruction loading

- [x] Update `Instruction.getInstructionsByAction()` to left join `cloud_pilot_images`
- [x] Alias catalog path as `image` (`image_path AS image` only — no legacy `image` in SELECT) so `Instruction.buildInstruction()` and Kite keep their existing contract
- [x] Do not change the Kite instructions panel; `buildImageUrl()` prefixes bucket mirror for local URLs

### Step 3 — Apply and verify

- [x] Apply the migration to the local CloudPilot DB
- [x] Verify eight catalog rows and eight linked Create EC2 instruction rows
- [x] Smoke `loadInstructionsPayload('create_ec2')`: eight steps; `image` = object key; `imageUrl` = `/kite-us-west-two/instructions/...`
- [x] Smoke no-image actions (`pause_ec2` / `resume_ec2`): `image` / `imageUrl` remain null
- [x] Browser/static: Create EC2 image 1 returns HTTP 200

### Step 4 — Drop legacy path column

- [x] Kept legacy `image` through Steps 1–3; verified loader from catalog
- [x] Dropped `cloudpilot_instructions.image` (`doc/sql/alter/cloudpilot_instructions_drop_image.sql`)
- [x] Updated `cloudpilot_instructions.sql` + pause/resume seed to use `image_id` only

---

# Acceptance criteria

```text
cloud_pilot_images has eight stable Create EC2 catalog records
        ↓
all eight create_ec2 instruction rows reference image_id
        ↓
the loader returns the same image + imageUrl values Kite expects
        ↓
pause/resume instruction rows still load with no image
        ↓
no image files were moved, and no image binary is stored in MySQL
```

---

# Coding style reminders

- Follow [coding_style.md](../how_to/coding_style.md).
- Preserve commented code; avoid drive-by refactors.
- Keep the database migration reversible in stages: add → seed → link → read
  through join → verify → only later remove legacy data.
