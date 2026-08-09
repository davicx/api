-- =============================================================================
-- ALTER cloudpilot_instructions — add nullable image_id
-- =============================================================================
-- Prefer one-shot for existing DBs:
--   mysql -u USER -p DATABASE_NAME < doc/sql/cloud_pilot_images.sql
--
-- Use this file only when cloud_pilot_images already exists and you still
-- need image_id + Create EC2 linking.
-- Doc: application/atlas/doc/development/finished/feature_images.md
--
-- If Error 1060 Duplicate column 'image_id': skip C1, continue C2–D.
-- If Error 1061 Duplicate key / 1826 Duplicate FK: skip that statement.
-- =============================================================================

-- C1) Column (skip if already present — Error 1060)
ALTER TABLE cloudpilot_instructions
    ADD COLUMN image_id BIGINT NULL;

-- C2) Index (skip if already present — Error 1061)
ALTER TABLE cloudpilot_instructions
    ADD INDEX idx_instruction_image_id (image_id);

-- C3) Foreign key (skip if already present)
ALTER TABLE cloudpilot_instructions
    ADD CONSTRAINT fk_cloudpilot_instruction_image
        FOREIGN KEY (image_id)
        REFERENCES cloud_pilot_images (image_id);

-- D) Link create_ec2 steps (safe to re-run)
UPDATE cloudpilot_instructions AS instruction_row
INNER JOIN cloud_pilot_images AS image_row
    ON image_row.image_key = CONCAT(
        'create_ec2_step_',
        instruction_row.step_number
    )
SET instruction_row.image_id = image_row.image_id
WHERE instruction_row.instruction_for = 'create_ec2';
