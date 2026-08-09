-- =============================================================================
-- DROP legacy cloudpilot_instructions.image
-- =============================================================================
-- Doc: application/atlas/doc/development/finished/feature_images.md (Step 4)
--
-- Prerequisites:
--   - cloud_pilot_images exists
--   - cloudpilot_instructions.image_id exists and Create EC2 rows are linked
--   - Instruction loader uses image_path AS image from the catalog join
--
-- Usage:
--   mysql -u USER -p DATABASE_NAME < doc/sql/alter/cloudpilot_instructions_drop_image.sql
--
-- Run once. Error 1091 = column already gone — safe to ignore.
-- =============================================================================

ALTER TABLE cloudpilot_instructions
    DROP COLUMN image;
