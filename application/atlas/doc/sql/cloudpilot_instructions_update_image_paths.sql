-- =============================================================================
-- Migrate create_ec2 image paths to relative paths + normalize step 6 warnings
-- Run if you already seeded with bare filenames (create_ec2_image_N.png).
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
