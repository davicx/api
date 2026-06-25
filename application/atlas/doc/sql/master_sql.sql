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
--
-- Docs: doc/database/database.md
--       doc/development/architecture/development_undo_feature.md (history)
--
-- Usage:
--   mysql -u USER -p DATABASE_NAME < doc/sql/master_sql.sql
--
-- Verify:
--   SELECT * FROM cloudpilot_actions;
--   SELECT * FROM cloudpilot_requests;
--   SELECT * FROM cloudpilot_history;
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
--          requested_by_user, action_id, action_name, display_name,
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
    INDEX idx_requests_outcome (outcome_code)
);


-- -----------------------------------------------------------------------------
-- 3. cloudpilot_history
-- -----------------------------------------------------------------------------
-- CloudPilot Change History — audit, undo, version timeline (planned).
-- See doc/development/architecture/development_undo_feature.md
--
-- Columns: id (history id), organization, conversation_id, request_id,
--          executed_by_user, action_name, history_status,
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
-- Seed: cloudpilot_actions (required before app can create requests)
-- -----------------------------------------------------------------------------
-- Matches actionMap.js. Re-run safe via ON DUPLICATE KEY UPDATE.

INSERT INTO cloudpilot_actions (action_type, display_name, requires_execution) VALUES
    ('general_chat', 'General Chat', 0),
    ('inventory_aws', 'Inventory AWS Resources', 1),
    ('scan_ec2', 'Scan EC2', 0),
    ('scan_s3', 'Scan S3', 0),
    ('toggle_ec2', 'Toggle EC2', 0),
    ('create_ec2', 'Create EC2', 0),
    ('delete_ec2', 'Delete EC2', 0)
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    requires_execution = VALUES(requires_execution);
