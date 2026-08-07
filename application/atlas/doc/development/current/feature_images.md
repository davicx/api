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

## Current step

**Plan only — awaiting approval before coding.**

## Next

Approve this plan, then say **do Step 1** (SQL catalog + non-destructive
migration).

**Status:** Active (plan)  
**Codename:** `feature_images`  
**Related:** [Current Development](./current_development.md) · [Friendly Create EC2](./feature_friendly_create_instance.md) · [Instructions SQL](../../sql/cloudpilot_instructions.sql) · [Coding Style](../how_to/coding_style.md)

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
  "imageUrl": "/instructions/create_ec2/create_ec2_image_1.png"
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

The table stores metadata and a relative path only. `buildImageUrl()` remains
the single place that turns the relative path into a local URL or an AWS file
URL based on existing environment configuration.

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
    instruction_row.*,
    image_row.image_path AS image,
    image_row.alt_text AS image_alt_text
FROM cloudpilot_instructions AS instruction_row
LEFT JOIN cloud_pilot_images AS image_row
    ON instruction_row.image_id = image_row.image_id
WHERE instruction_row.instruction_for = ?
ORDER BY instruction_row.step_number ASC;
```

`image_path AS image` deliberately preserves the current `Instruction` model
and API field names. `normalizeInstructionStep()` continues to build
`imageUrl` from `step.image`.

`image_alt_text` is available for a future API/UI accessibility extension,
but it is not emitted in the first migration unless the current frontend
needs it. Keeping the initial response unchanged reduces risk.

---

# Implementation steps (after approval)

### Step 1 — SQL catalog and safe migration

- [ ] Create `doc/sql/cloud_pilot_images.sql` with the image table and eight-image seed
- [ ] Create an idempotent migration under `doc/sql/alter/` that adds nullable `image_id`, index, and foreign key
- [ ] Map `create_ec2` steps 1–8 to `create_ec2_step_1` through `create_ec2_step_8`
- [ ] Add the new table to `master_sql.sql` in dependency order

### Step 2 — Preserve instruction loading

- [ ] Update `Instruction.getInstructionsByAction()` to left join `cloud_pilot_images`
- [ ] Alias `image_path AS image` so `Instruction.buildInstruction()` and Kite keep their existing contract
- [ ] Do not change `buildImageUrl()` or the Kite instructions panel

### Step 3 — Apply and verify

- [ ] Apply the migration to the local CloudPilot DB
- [ ] Verify eight catalog rows and eight linked Create EC2 instruction rows
- [ ] Smoke `loadInstructionsPayload('create_ec2')`: eight steps and unchanged `image` / `imageUrl`
- [ ] Smoke an instruction action with no images (`pause_ec2` or `resume_ec2`): image fields remain null

### Step 4 — Later cleanup decision

- [ ] Keep legacy `cloudpilot_instructions.image` during the initial migration
- [ ] Only after a real Create EC2 walkthrough verification, make a separate decision to drop `image`
- [ ] If dropped, change the SQL seed source-of-truth to use `image_id` rather than the legacy path

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
