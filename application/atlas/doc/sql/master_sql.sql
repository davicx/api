-- =============================================================================
-- CloudPilot — Master SQL (SOURCE OF TRUTH)
-- =============================================================================
--
-- Run on a new MySQL database when CloudPilot tables are missing.
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS and idempotent seed.
--
-- Tables (in dependency order):
--   1. cloudpilot_actions   — static action catalog
--   2. cloudpilot_requests  — user workflow / open request state
--   3. cloudpilot_history   — audit trail + undo (planned)
--   4. cloud_pilot_ai_usage — OpenAI token/cost per CloudPilot call
--   5. organization_knowledge (+ tags) — why a resource exists (org facts)
--   6. cloud_pilot_images   — instruction image catalog (relative paths)
--
-- Docs: doc/database/database.md
--       doc/development/architecture/development_undo_feature.md (history)
--       doc/development/finished/feature_ai_spending.md (cloud_pilot_ai_usage)
--       doc/development/current/feature_organizational_knowledge.md
--       doc/development/finished/feature_images.md
--
-- Usage:
--   mysql -u USER -p DATABASE_NAME < doc/sql/master_sql.sql
--
-- Or only org knowledge on an existing DB:
--   mysql -u USER -p DATABASE_NAME < doc/sql/organization_knowledge.sql
--   mysql -u USER -p DATABASE_NAME < doc/sql/seed/seed_organization_knowledge.sql
--
-- Existing DB — images catalog + link create_ec2 instructions:
--   mysql -u USER -p DATABASE_NAME < doc/sql/cloud_pilot_images.sql
--
-- Verify:
--   SELECT * FROM cloudpilot_actions;
--   SELECT * FROM cloudpilot_requests;
--   SELECT * FROM cloudpilot_history;
--   SELECT * FROM cloud_pilot_ai_usage;
--   SELECT * FROM organization_knowledge;
--   SELECT * FROM organization_knowledge_tags;
--   SELECT * FROM cloud_pilot_images;
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. cloudpilot_actions
-- -----------------------------------------------------------------------------
-- Columns: id, action_type, display_name, description, requires_execution,
--          created_at, updated_at

CREATE TABLE IF NOT EXISTS cloudpilot_actions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    action_type VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NULL,

    requires_execution TINYINT(1) NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_action_type (action_type)
);


-- -----------------------------------------------------------------------------
-- 2. cloudpilot_requests
-- -----------------------------------------------------------------------------
-- Columns: id, organization, conversation_id, conversation_title,
--          requested_by_user, action_id, action_name, display_name_internal, display_name,
--          action_notes, status, outcome_code, priority, execution_mode,
--          is_open, collected, missing, asked, completed_at,
--          created_at, updated_at

CREATE TABLE IF NOT EXISTS cloudpilot_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    organization VARCHAR(255) NOT NULL DEFAULT 'Cloud Pilot',

    conversation_id BIGINT NOT NULL,

    conversation_title VARCHAR(255) NULL,

    requested_by_user VARCHAR(255) NOT NULL,

    action_id BIGINT UNSIGNED NOT NULL,

    action_name VARCHAR(255) NULL,

    display_name_internal VARCHAR(255) NULL,

    display_name VARCHAR(255) NULL,

    action_notes TEXT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'waiting_on_fields',

    outcome_code VARCHAR(100) NULL,

    priority VARCHAR(20) NOT NULL DEFAULT 'normal',

    execution_mode VARCHAR(50) NULL,

    is_open TINYINT(1) NOT NULL DEFAULT 1,

    collected JSON NULL,
    missing JSON NULL,
    asked JSON NULL,

    completed_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_requests_action
        FOREIGN KEY (action_id)
        REFERENCES cloudpilot_actions(id),

    INDEX idx_requests_conversation (conversation_id),
    INDEX idx_requests_status (status),
    INDEX idx_requests_open (is_open),
    INDEX idx_requests_action (action_id),
    INDEX idx_requests_outcome (outcome_code),
    UNIQUE INDEX idx_cloudpilot_requests_display_name_internal (display_name_internal)
);


-- -----------------------------------------------------------------------------
-- 3. cloudpilot_history
-- -----------------------------------------------------------------------------
-- CloudPilot Change History — audit, undo, version timeline (planned).
-- See doc/development/architecture/development_undo_feature.md
--
-- Columns: id (history id), organization, conversation_id, request_id,
--          executed_by_user, action_name, action_display_name, action_record_key,
--          history_status,
--          target_type, target_id, target_region,
--          resource_state_before, resource_state_after, undo_payload,
--          undo_available, restores_history_id, restored_by_history_id,
--          created_at, updated_at
--
-- target_id for toggle MVP: primary_instance_id:secondary_instance_id (e.g. i-123:i-456)
-- Note: no action_id — literal action_name preserves story if catalog changes.
--       history_status is NOT cloudpilot_requests.status

CREATE TABLE IF NOT EXISTS cloudpilot_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    organization VARCHAR(255) NOT NULL DEFAULT 'Cloud Pilot',
    conversation_id BIGINT NOT NULL,
    request_id BIGINT UNSIGNED NULL,

    executed_by_user VARCHAR(255) NOT NULL,

    action_name VARCHAR(100) NOT NULL,
    action_display_name VARCHAR(255) NULL,
    action_record_key VARCHAR(255) NULL,
    history_status VARCHAR(50) NOT NULL,

    target_type VARCHAR(100) NULL,
    target_id VARCHAR(255) NULL,
    target_region VARCHAR(50) NULL,

    resource_state_before JSON NULL,
    resource_state_after JSON NULL,

    undo_payload JSON NULL,
    undo_available TINYINT(1) NOT NULL DEFAULT 0,

    restores_history_id BIGINT UNSIGNED NULL,
    restored_by_history_id BIGINT UNSIGNED NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_history_conversation (conversation_id, created_at),
    INDEX idx_history_target (target_type, target_id, created_at),
    INDEX idx_history_request (request_id),
    INDEX idx_history_undo (undo_available, history_status),

    CONSTRAINT fk_history_request
        FOREIGN KEY (request_id)
        REFERENCES cloudpilot_requests(id)
);


-- -----------------------------------------------------------------------------
-- 4. cloud_pilot_ai_usage (OpenAI spend — feature_ai_spending.md)
--     Standalone: doc/sql/cloud_pilot_ai_usage.sql
--     Rename legacy: doc/sql/alter/ai_usage_rename_cloud_pilot_ai_usage.sql
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cloud_pilot_ai_usage (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    organization_id VARCHAR(100) NULL,
    conversation_id VARCHAR(100) NULL,
    request_id VARCHAR(100) NULL,

    -- Optional: explain_findings | friendly_requests | intent | general_chat
    feature VARCHAR(50) NULL,

    model VARCHAR(100) NOT NULL,

    input_tokens INT NOT NULL,
    output_tokens INT NOT NULL,
    total_tokens INT NOT NULL,

    estimated_cost DECIMAL(10, 6) NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_cloud_pilot_ai_usage_created (created_at),
    INDEX idx_cloud_pilot_ai_usage_org_created (organization_id, created_at)
);


-- -----------------------------------------------------------------------------
-- 5. organization_knowledge (+ tags)
--     See doc/development/current/feature_organizational_knowledge.md
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organization_knowledge (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    master_site VARCHAR(100) NOT NULL,

    resource_type VARCHAR(50) NOT NULL,
    resource_name VARCHAR(255) NOT NULL,

    display_name VARCHAR(255) NULL,

    purpose TEXT NULL,
    notes TEXT NULL,

    importance VARCHAR(20) NULL,
    recommended_action TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_org_resource (
        master_site,
        resource_type,
        resource_name
    ),

    INDEX idx_org_knowledge_site_type (master_site, resource_type),
    INDEX idx_org_knowledge_display (master_site, resource_type, display_name)
);


CREATE TABLE IF NOT EXISTS organization_knowledge_tags (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    organization_knowledge_id BIGINT UNSIGNED NOT NULL,
    tag VARCHAR(100) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_org_knowledge_tag
        FOREIGN KEY (organization_knowledge_id)
        REFERENCES organization_knowledge (id)
        ON DELETE CASCADE,

    UNIQUE KEY uq_org_knowledge_tag (
        organization_knowledge_id,
        tag
    ),

    INDEX idx_org_knowledge_tag (tag)
);


-- -----------------------------------------------------------------------------
-- Seed: cloudpilot_actions (required before app can create requests)
-- -----------------------------------------------------------------------------
-- Matches actionMap.js. Re-run safe via ON DUPLICATE KEY UPDATE.

INSERT INTO cloudpilot_actions (action_type, display_name, requires_execution) VALUES
    ('general_chat', 'General Chat', 0),
    ('inventory_aws', 'Inventory AWS Resources', 1),
    ('show_billing', 'AWS Billing', 1),
    ('show_ai_usage', 'AI Usage', 1),
    ('scan_ec2', 'Scan EC2', 0),
    ('scan_s3', 'Scan S3', 0),
    ('toggle_ec2', 'Toggle EC2', 0),
    ('create_ec2', 'Create EC2', 0),
    ('delete_ec2', 'Delete EC2', 0),
    ('update_ec2_tag', 'Update EC2 Tag', 0),
    ('pause_ec2', 'Pause EC2', 0),
    ('resume_ec2', 'Resume EC2', 0)
AS new_action
ON DUPLICATE KEY UPDATE
    display_name = new_action.display_name,
    requires_execution = new_action.requires_execution;


-- -----------------------------------------------------------------------------
-- Seed: organization_knowledge demo (kite / S3) + tags
--     Full copy also in doc/sql/seed/seed_organization_knowledge.sql
-- -----------------------------------------------------------------------------

INSERT INTO organization_knowledge (
    master_site,
    resource_type,
    resource_name,
    display_name,
    purpose,
    notes,
    importance,
    recommended_action
)
VALUES
(
    'kite',
    's3_bucket',
    'sam-youtube-demo',
    'Sam YouTube Demo',
    'Created while following Sam''s YouTube tutorial.',
    'Not used in over a month.',
    'low',
    'Likely safe to delete.'
),
(
    'kite',
    's3_bucket',
    'cloudpilot-assets',
    'CloudPilot Assets',
    'Stores website images used by CloudPilot.',
    'Production bucket.',
    'medium',
    'Do not delete unless migrated.'
),
(
    'kite',
    's3_bucket',
    'cloudpilot-user-uploads',
    'CloudPilot User Uploads',
    'Stores user profile photos, group images, post images, and uploaded content.',
    'Production user data.',
    'critical',
    'Do not delete. Recommend versioning. Recommend backups.'
)
AS new_row
ON DUPLICATE KEY UPDATE
    display_name = new_row.display_name,
    purpose = new_row.purpose,
    notes = new_row.notes,
    importance = new_row.importance,
    recommended_action = new_row.recommended_action;

INSERT IGNORE INTO organization_knowledge_tags (organization_knowledge_id, tag)
SELECT ok.id, tag_list.tag
FROM organization_knowledge ok
INNER JOIN (
    SELECT 'tutorial' AS tag
    UNION ALL SELECT 'youtube'
    UNION ALL SELECT 'hello world'
    UNION ALL SELECT 'sam'
) AS tag_list
WHERE ok.master_site = 'kite'
  AND ok.resource_type = 's3_bucket'
  AND ok.resource_name = 'sam-youtube-demo';

INSERT IGNORE INTO organization_knowledge_tags (organization_knowledge_id, tag)
SELECT ok.id, tag_list.tag
FROM organization_knowledge ok
INNER JOIN (
    SELECT 'assets' AS tag
    UNION ALL SELECT 'website images'
    UNION ALL SELECT 'images'
    UNION ALL SELECT 'frontend'
) AS tag_list
WHERE ok.master_site = 'kite'
  AND ok.resource_type = 's3_bucket'
  AND ok.resource_name = 'cloudpilot-assets';

INSERT IGNORE INTO organization_knowledge_tags (organization_knowledge_id, tag)
SELECT ok.id, tag_list.tag
FROM organization_knowledge ok
INNER JOIN (
    SELECT 'uploads' AS tag
    UNION ALL SELECT 'user uploads'
    UNION ALL SELECT 'profile photos'
    UNION ALL SELECT 'group photos'
    UNION ALL SELECT 'production data'
) AS tag_list
WHERE ok.master_site = 'kite'
  AND ok.resource_type = 's3_bucket'
  AND ok.resource_name = 'cloudpilot-user-uploads';


-- -----------------------------------------------------------------------------
-- 6. cloud_pilot_images (instruction image catalog)
--     See doc/development/finished/feature_images.md
--     Full one-shot for existing DBs (incl. instructions.image_id):
--       doc/sql/cloud_pilot_images.sql
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
