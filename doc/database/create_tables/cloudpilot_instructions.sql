-- =============================================================================
-- CloudPilot Instructions — one row = one step
-- =============================================================================
-- Doc: application/atlas/doc/development/finished/feature_images.md
--
-- Images live in cloud_pilot_images. This table stores optional image_id only.
-- Load by action key (loader left-joins catalog; image_path AS image):
--   WHERE instruction_for = 'create_ec2' ORDER BY step_number
--
-- Fresh install order:
--   1) cloud_pilot_images.sql (catalog + seed)
--   2) this file (table + instruction seeds + link create_ec2)
--
-- Existing DB that still has legacy column `image`:
--   doc/sql/alter/cloudpilot_instructions_drop_image.sql
--
-- Do NOT store total_steps or current_step — UI computes / owns those.
-- warnings: JSON array, e.g.
--   [{"type":"cost","message":"Choose t3.micro to stay in Free Tier."}]
-- =============================================================================

CREATE TABLE IF NOT EXISTS cloudpilot_instructions (
    instruction_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    instruction_for VARCHAR(100) NOT NULL,
    step_number INT NOT NULL,

    title VARCHAR(255) NOT NULL,
    instruction TEXT NOT NULL,

    image_id BIGINT NULL,
    warnings JSON NULL,

    estimated_time VARCHAR(50) NULL,
    optional TINYINT(1) NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_instruction_for_step (instruction_for, step_number),
    INDEX idx_instructions_for (instruction_for),
    INDEX idx_instruction_image_id (image_id),

    CONSTRAINT fk_cloudpilot_instruction_image
        FOREIGN KEY (image_id)
        REFERENCES cloud_pilot_images (image_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- Seed: create_ec2 (8 steps) — image via cloud_pilot_images after link UPDATE
-- -----------------------------------------------------------------------------

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'create_ec2',
    1,
    'Open EC2',
    'Open the AWS Console and navigate to the EC2 service.',
    NULL,
    '15 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'create_ec2',
    2,
    'Launch Instance',
    'Click the Launch Instance button.',
    NULL,
    '10 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'create_ec2',
    3,
    'Choose a Name',
    'Enter a name for your EC2 instance.',
    NULL,
    '20 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'create_ec2',
    4,
    'Select an AMI',
    'Choose the Amazon Machine Image (AMI) you want to use.',
    NULL,
    '20 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'create_ec2',
    5,
    'Choose an Instance Type',
    'Select the EC2 instance type for your workload.',
    NULL,
    '15 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'create_ec2',
    6,
    'Configure Security',
    'Review the security group settings before launching the instance.',
    JSON_ARRAY(
        JSON_OBJECT(
            'type', 'warning',
            'message', 'Do not allow SSH (0.0.0.0/0) unless absolutely necessary.'
        )
    ),
    '45 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'create_ec2',
    7,
    'Review Settings',
    'Verify the instance configuration before launching.',
    NULL,
    '30 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'create_ec2',
    8,
    'Launch Instance',
    'Click Launch Instance and wait for the instance to become available.',
    NULL,
    '1-2 min'
);

-- Link create_ec2 steps to catalog keys create_ec2_step_N
UPDATE cloudpilot_instructions AS instruction_row
INNER JOIN cloud_pilot_images AS image_row
    ON image_row.image_key = CONCAT(
        'create_ec2_step_',
        instruction_row.step_number
    )
SET instruction_row.image_id = image_row.image_id
WHERE instruction_row.instruction_for = 'create_ec2';

-- Link pause_ec2 / resume_ec2 steps (temp placeholders until real screenshots)
UPDATE cloudpilot_instructions AS instruction_row
INNER JOIN cloud_pilot_images AS image_row
    ON image_row.image_key COLLATE utf8mb4_unicode_ci = CONCAT(
        instruction_row.instruction_for,
        '_step_',
        instruction_row.step_number
    ) COLLATE utf8mb4_unicode_ci
SET instruction_row.image_id = image_row.image_id
WHERE instruction_row.instruction_for IN ('pause_ec2', 'resume_ec2');

-- -----------------------------------------------------------------------------
-- Seed: pause_ec2 / resume_ec2
-- Full copy also in doc/sql/seed/seed_pause_resume_ec2_instructions.sql
-- -----------------------------------------------------------------------------

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'pause_ec2',
    1,
    'Open EC2',
    'Open the AWS Console and navigate to the EC2 service.',
    NULL,
    '15 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'pause_ec2',
    2,
    'Select the Instance',
    'In Instances, select the EC2 instance you want to pause (for example i-0abc123).',
    NULL,
    '20 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'pause_ec2',
    3,
    'Choose Stop Instance',
    'Choose Instance state, then Stop instance.',
    JSON_ARRAY(
        JSON_OBJECT(
            'type', 'warning',
            'message', 'Stop pauses the instance. Terminate permanently deletes it — do not choose Terminate.'
        )
    ),
    '15 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'pause_ec2',
    4,
    'Confirm Stop',
    'Confirm Stop when AWS asks you to verify the action.',
    NULL,
    '10 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'pause_ec2',
    5,
    'Wait for Stopped',
    'Wait until the instance state becomes Stopped. The instance is now paused.',
    NULL,
    '1-2 min'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'resume_ec2',
    1,
    'Open EC2',
    'Open the AWS Console and navigate to the EC2 service.',
    NULL,
    '15 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'resume_ec2',
    2,
    'Select the Instance',
    'In Instances, select the stopped EC2 instance you want to resume (for example i-0abc123).',
    NULL,
    '20 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'resume_ec2',
    3,
    'Choose Start Instance',
    'Choose Instance state, then Start instance.',
    NULL,
    '15 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'resume_ec2',
    4,
    'Confirm Start',
    'Confirm Start when AWS asks you to verify the action.',
    JSON_ARRAY(
        JSON_OBJECT(
            'type', 'cost',
            'message', 'Starting an instance resumes compute charges while it is running.'
        )
    ),
    '10 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, warnings, estimated_time)
VALUES
(
    'resume_ec2',
    5,
    'Wait for Running',
    'Wait until the instance state becomes Running. The instance is now resumed.',
    NULL,
    '1-2 min'
);
