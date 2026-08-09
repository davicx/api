-- =============================================================================
-- cloud_pilot_images + link Create EC2 instruction rows
-- =============================================================================
-- Doc: application/atlas/doc/development/finished/feature_images.md
--
-- What this does:
--   1) Create image metadata catalog (relative paths only — no binaries)
--   2) Seed the eight existing Create EC2 instruction images
--   3) Add nullable cloudpilot_instructions.image_id
--   4) Link create_ec2 steps 1–8 to catalog keys create_ec2_step_N
--
-- Legacy column `image` was dropped in Step 4:
--   doc/sql/alter/cloudpilot_instructions_drop_image.sql
--
-- Usage (existing DB — run this whole file once):
--   mysql -u USER -p DATABASE_NAME < doc/sql/cloud_pilot_images.sql
--
-- Fresh install tip:
--   Prefer master_sql.sql for new databases (includes this table when wired).
--
-- Safe to re-run notes:
--   A + B use IF NOT EXISTS / ON DUPLICATE KEY UPDATE
--   C1 fails with Error 1060 if image_id already exists — skip C1, continue C2–D
--   C2/C3 may fail if index/FK already exist — skip that statement
--   D is idempotent (re-links by image_key)
-- =============================================================================


-- -----------------------------------------------------------------------------
-- A) CREATE TABLE cloud_pilot_images
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cloud_pilot_images (
    image_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    image_key VARCHAR(100) NOT NULL,
    image_name VARCHAR(255) NOT NULL,
    image_path VARCHAR(500) NOT NULL,

    alt_text VARCHAR(255) NULL,
    description TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_cloud_pilot_images_key (image_key),
    INDEX idx_cloud_pilot_images_path (image_path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- B) SEED — eight Create EC2 images (existing relative paths; do not move files)
-- -----------------------------------------------------------------------------

INSERT INTO cloud_pilot_images
    (image_key, image_name, image_path, alt_text, description)
VALUES
    (
        'create_ec2_step_1',
        'Open EC2',
        'instructions/create_ec2/create_ec2_image_1.png',
        'Open EC2',
        'Create EC2 walkthrough step 1 — open the EC2 service'
    ),
    (
        'create_ec2_step_2',
        'Launch Instance',
        'instructions/create_ec2/create_ec2_image_2.png',
        'Launch Instance',
        'Create EC2 walkthrough step 2 — click Launch Instance'
    ),
    (
        'create_ec2_step_3',
        'Choose a Name',
        'instructions/create_ec2/create_ec2_image_3.png',
        'Choose a Name',
        'Create EC2 walkthrough step 3 — name the instance'
    ),
    (
        'create_ec2_step_4',
        'Select an AMI',
        'instructions/create_ec2/create_ec2_image_4.png',
        'Select an AMI',
        'Create EC2 walkthrough step 4 — choose an AMI'
    ),
    (
        'create_ec2_step_5',
        'Choose an Instance Type',
        'instructions/create_ec2/create_ec2_image_5.png',
        'Choose an Instance Type',
        'Create EC2 walkthrough step 5 — choose instance type'
    ),
    (
        'create_ec2_step_6',
        'Configure Security',
        'instructions/create_ec2/create_ec2_image_6.png',
        'Configure Security',
        'Create EC2 walkthrough step 6 — review security group'
    ),
    (
        'create_ec2_step_7',
        'Review Settings',
        'instructions/create_ec2/create_ec2_image_7.png',
        'Review Settings',
        'Create EC2 walkthrough step 7 — review settings'
    ),
    (
        'create_ec2_step_8',
        'Launch Instance',
        'instructions/create_ec2/create_ec2_image_8.png',
        'Launch Instance',
        'Create EC2 walkthrough step 8 — launch the instance'
    )
ON DUPLICATE KEY UPDATE
    image_name = VALUES(image_name),
    image_path = VALUES(image_path),
    alt_text = VALUES(alt_text),
    description = VALUES(description);


-- -----------------------------------------------------------------------------
-- C) ALTER cloudpilot_instructions — add nullable image_id
-- -----------------------------------------------------------------------------
-- If Error 1060 on C1: column already there — continue with C2–D.
-- After linking, existing DBs may drop legacy `image` via:
--   doc/sql/alter/cloudpilot_instructions_drop_image.sql

-- C1) Column (skip if already present)
ALTER TABLE cloudpilot_instructions
    ADD COLUMN image_id BIGINT NULL;

-- C2) Index (skip if already present)
ALTER TABLE cloudpilot_instructions
    ADD INDEX idx_instruction_image_id (image_id);

-- C3) Foreign key (skip if already present)
ALTER TABLE cloudpilot_instructions
    ADD CONSTRAINT fk_cloudpilot_instruction_image
        FOREIGN KEY (image_id)
        REFERENCES cloud_pilot_images (image_id);


-- -----------------------------------------------------------------------------
-- D) LINK create_ec2 instruction rows to catalog by step_number
-- -----------------------------------------------------------------------------

UPDATE cloudpilot_instructions AS instruction_row
INNER JOIN cloud_pilot_images AS image_row
    ON image_row.image_key = CONCAT(
        'create_ec2_step_',
        instruction_row.step_number
    )
SET instruction_row.image_id = image_row.image_id
WHERE instruction_row.instruction_for = 'create_ec2';


-- -----------------------------------------------------------------------------
-- E) VERIFY (read-only)
-- -----------------------------------------------------------------------------

-- Expect 8 catalog rows:
-- SELECT image_id, image_key, image_path FROM cloud_pilot_images ORDER BY image_key;

-- Expect 8 create_ec2 rows with non-null image_id:
-- SELECT instruction_id, step_number, title, image_id
-- FROM cloudpilot_instructions
-- WHERE instruction_for = 'create_ec2'
-- ORDER BY step_number;

-- Expect matching path via join:
-- SELECT
--     instruction_row.step_number,
--     instruction_row.title,
--     image_row.image_path AS catalog_image_path,
--     image_row.image_key
-- FROM cloudpilot_instructions AS instruction_row
-- LEFT JOIN cloud_pilot_images AS image_row
--     ON instruction_row.image_id = image_row.image_id
-- WHERE instruction_row.instruction_for = 'create_ec2'
-- ORDER BY instruction_row.step_number;

-- Pause/resume should still have NULL image_id:
-- SELECT instruction_for, step_number, image_id
-- FROM cloudpilot_instructions
-- WHERE instruction_for IN ('pause_ec2', 'resume_ec2')
-- ORDER BY instruction_for, step_number;
