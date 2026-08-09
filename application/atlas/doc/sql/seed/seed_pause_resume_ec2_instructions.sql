-- =============================================================================
-- Seed: pause_ec2 / resume_ec2 Instructions (+ action catalog rows)
-- =============================================================================
--
-- Doc: doc/development/finished/feature_pause_instance.md (Step 4)
-- Requires: cloudpilot_instructions table (doc/sql/cloudpilot_instructions.sql)
--
-- Usage:
--   mysql -u USER -p DATABASE_NAME < doc/sql/seed/seed_pause_resume_ec2_instructions.sql
--
-- Safe to re-run: actions upsert; instruction steps use INSERT IGNORE on unique key.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Action catalog (matches actionMap.js)
-- -----------------------------------------------------------------------------

INSERT INTO cloudpilot_actions (action_type, display_name, requires_execution) VALUES
    ('pause_ec2', 'Pause EC2', 0),
    ('resume_ec2', 'Resume EC2', 0)
AS new_action
ON DUPLICATE KEY UPDATE
    display_name = new_action.display_name,
    requires_execution = new_action.requires_execution;


-- -----------------------------------------------------------------------------
-- Instructions: pause_ec2 (AWS Console Stop instance)
-- -----------------------------------------------------------------------------

INSERT IGNORE INTO cloudpilot_instructions
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

INSERT IGNORE INTO cloudpilot_instructions
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

INSERT IGNORE INTO cloudpilot_instructions
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

INSERT IGNORE INTO cloudpilot_instructions
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

INSERT IGNORE INTO cloudpilot_instructions
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


-- -----------------------------------------------------------------------------
-- Instructions: resume_ec2 (AWS Console Start instance)
-- -----------------------------------------------------------------------------

INSERT IGNORE INTO cloudpilot_instructions
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

INSERT IGNORE INTO cloudpilot_instructions
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

INSERT IGNORE INTO cloudpilot_instructions
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

INSERT IGNORE INTO cloudpilot_instructions
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

INSERT IGNORE INTO cloudpilot_instructions
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
