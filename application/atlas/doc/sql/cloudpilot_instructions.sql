-- =============================================================================
-- CloudPilot Instructions — one row = one step
-- =============================================================================
-- Doc: application/atlas/doc/development/mvp.md (M10)
--
-- Load by action key, ordered by step_number:
--   SELECT * FROM cloudpilot_instructions
--   WHERE instruction_for = 'create_ec2'
--   ORDER BY step_number;
--
-- Image stores a relative path only (no bucket / host):
--   instructions/create_ec2/create_ec2_image_1.png
-- API builds imageUrl from PUBLIC_FILE_BASE_URL + image.
--
-- Do NOT store total_steps or current_step — UI computes / owns those.
-- warnings: JSON array, e.g.
--   [{"type":"cost","message":"Choose t3.micro to stay in Free Tier."}]
-- =============================================================================

CREATE TABLE cloudpilot_instructions (
    instruction_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    instruction_for VARCHAR(100) NOT NULL,
    step_number INT NOT NULL,

    title VARCHAR(255) NOT NULL,
    instruction TEXT NOT NULL,

    image VARCHAR(500) NULL,
    warnings JSON NULL,

    estimated_time VARCHAR(50) NULL,
    optional TINYINT(1) NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_instruction_for_step (instruction_for, step_number),
    INDEX idx_instructions_for (instruction_for)
);


-- -----------------------------------------------------------------------------
-- Seed: create_ec2 (8 steps)
-- -----------------------------------------------------------------------------

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'create_ec2',
    1,
    'Open EC2',
    'Open the AWS Console and navigate to the EC2 service.',
    'instructions/create_ec2/create_ec2_image_1.png',
    NULL,
    '15 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'create_ec2',
    2,
    'Launch Instance',
    'Click the Launch Instance button.',
    'instructions/create_ec2/create_ec2_image_2.png',
    NULL,
    '10 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'create_ec2',
    3,
    'Choose a Name',
    'Enter a name for your EC2 instance.',
    'instructions/create_ec2/create_ec2_image_3.png',
    NULL,
    '20 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'create_ec2',
    4,
    'Select an AMI',
    'Choose the Amazon Machine Image (AMI) you want to use.',
    'instructions/create_ec2/create_ec2_image_4.png',
    NULL,
    '20 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'create_ec2',
    5,
    'Choose an Instance Type',
    'Select the EC2 instance type for your workload.',
    'instructions/create_ec2/create_ec2_image_5.png',
    NULL,
    '15 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'create_ec2',
    6,
    'Configure Security',
    'Review the security group settings before launching the instance.',
    'instructions/create_ec2/create_ec2_image_6.png',
    JSON_ARRAY(
        JSON_OBJECT(
            'type', 'warning',
            'message', 'Do not allow SSH (0.0.0.0/0) unless absolutely necessary.'
        )
    ),
    '45 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'create_ec2',
    7,
    'Review Settings',
    'Verify the instance configuration before launching.',
    'instructions/create_ec2/create_ec2_image_7.png',
    NULL,
    '30 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'create_ec2',
    8,
    'Launch Instance',
    'Click Launch Instance and wait for the instance to become available.',
    'instructions/create_ec2/create_ec2_image_8.png',
    NULL,
    '1-2 min'
);

-- -----------------------------------------------------------------------------
-- Seed: pause_ec2 / resume_ec2
-- Full copy also in doc/sql/seed/seed_pause_resume_ec2_instructions.sql
-- -----------------------------------------------------------------------------

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'pause_ec2',
    1,
    'Open EC2',
    'Open the AWS Console and navigate to the EC2 service.',
    NULL,
    NULL,
    '15 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'pause_ec2',
    2,
    'Select the Instance',
    'In Instances, select the EC2 instance you want to pause (for example i-0abc123).',
    NULL,
    NULL,
    '20 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'pause_ec2',
    3,
    'Choose Stop Instance',
    'Choose Instance state, then Stop instance.',
    NULL,
    JSON_ARRAY(
        JSON_OBJECT(
            'type', 'warning',
            'message', 'Stop pauses the instance. Terminate permanently deletes it — do not choose Terminate.'
        )
    ),
    '15 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'pause_ec2',
    4,
    'Confirm Stop',
    'Confirm Stop when AWS asks you to verify the action.',
    NULL,
    NULL,
    '10 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'pause_ec2',
    5,
    'Wait for Stopped',
    'Wait until the instance state becomes Stopped. The instance is now paused.',
    NULL,
    NULL,
    '1-2 min'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'resume_ec2',
    1,
    'Open EC2',
    'Open the AWS Console and navigate to the EC2 service.',
    NULL,
    NULL,
    '15 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'resume_ec2',
    2,
    'Select the Instance',
    'In Instances, select the stopped EC2 instance you want to resume (for example i-0abc123).',
    NULL,
    NULL,
    '20 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'resume_ec2',
    3,
    'Choose Start Instance',
    'Choose Instance state, then Start instance.',
    NULL,
    NULL,
    '15 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'resume_ec2',
    4,
    'Confirm Start',
    'Confirm Start when AWS asks you to verify the action.',
    NULL,
    JSON_ARRAY(
        JSON_OBJECT(
            'type', 'cost',
            'message', 'Starting an instance resumes compute charges while it is running.'
        )
    ),
    '10 sec'
);

INSERT INTO cloudpilot_instructions
(instruction_for, step_number, title, instruction, image, warnings, estimated_time)
VALUES
(
    'resume_ec2',
    5,
    'Wait for Running',
    'Wait until the instance state becomes Running. The instance is now resumed.',
    NULL,
    NULL,
    '1-2 min'
);
