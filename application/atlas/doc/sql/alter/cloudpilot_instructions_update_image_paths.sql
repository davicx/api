-- =============================================================================
-- Migrate create_ec2 image paths to relative paths + normalize step 6 warnings
-- HISTORICAL — legacy column `image` was dropped (feature_images Step 4).
-- Keep only if you still have an old DB with `image` and bare filenames.
-- =============================================================================

UPDATE cloudpilot_instructions
SET image = CONCAT('instructions/create_ec2/', image)
WHERE instruction_for = 'create_ec2'
  AND image IS NOT NULL
  AND image NOT LIKE 'instructions/%';

UPDATE cloudpilot_instructions
SET warnings = JSON_ARRAY(
    JSON_OBJECT(
        'type', 'warning',
        'message', 'Do not allow SSH (0.0.0.0/0) unless absolutely necessary.'
    )
)
WHERE instruction_for = 'create_ec2'
  AND step_number = 6;
