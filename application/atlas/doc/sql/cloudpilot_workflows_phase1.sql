-- =============================================================================
-- CloudPilot Phase 1 — cloudpilot_workflows
-- =============================================================================
-- Doc: application/atlas/doc/Master_Database.md
--
-- Phase 1 rules:
--   - At most ONE row with is_open = 1 per conversation_id (enforce in app)
--   - outcome_code: machine-readable; NULL while open
--   - No outcome_message — user text lives in messages table
--
-- Usage:
--   A) New database: run section A only
--   B) Table already exists without outcome_code: run section B only
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) CREATE TABLE (fresh install)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cloudpilot_workflows (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'workflow_id',

    organization VARCHAR(255) NOT NULL DEFAULT 'Cloud Pilot',

    conversation_id BIGINT NOT NULL,

    requested_by_user_name VARCHAR(255) NOT NULL,

    action_type VARCHAR(100) NOT NULL,
    action_name VARCHAR(255) NULL,
    action_notes TEXT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    outcome_code VARCHAR(100) NULL,

    priority VARCHAR(20) NOT NULL DEFAULT 'normal',

    execution_mode VARCHAR(50) NULL,

    is_open TINYINT(1) NOT NULL DEFAULT 1,

    collected JSON NULL,
    missing JSON NULL,
    asked JSON NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    completed_at DATETIME NULL,

    INDEX idx_workflows_conversation (conversation_id),
    INDEX idx_workflows_open (conversation_id, is_open),
    INDEX idx_workflows_status (status),
    INDEX idx_workflows_organization (organization),
    INDEX idx_workflows_outcome (outcome_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- B) ALTER TABLE (existing cloudpilot_workflows)
-- -----------------------------------------------------------------------------
-- Uncomment and run what applies to your database:

-- B1) outcome_code (if missing):
-- ALTER TABLE cloudpilot_workflows
--     ADD COLUMN outcome_code VARCHAR(100) NULL
--         AFTER status;
-- ALTER TABLE cloudpilot_workflows
--     ADD INDEX idx_workflows_outcome (outcome_code);

-- B2) Drop organization_id (BIGINT), add organization (VARCHAR) — matches Actions.js / createAction
-- Do NOT use MODIFY organization_id ... VARCHAR — that keeps the wrong column name.
--
-- ALTER TABLE cloudpilot_workflows
--     DROP INDEX idx_workflows_organization;
--
-- ALTER TABLE cloudpilot_workflows
--     DROP COLUMN organization_id;
--
-- ALTER TABLE cloudpilot_workflows
--     ADD COLUMN organization VARCHAR(255) NOT NULL DEFAULT 'Cloud Pilot' AFTER id;
--
-- ALTER TABLE cloudpilot_workflows
--     ADD INDEX idx_workflows_organization (organization);
--
-- Optional one-step rename (instead of drop + add) if you prefer to keep row data in place:
-- ALTER TABLE cloudpilot_workflows
--     CHANGE COLUMN organization_id organization VARCHAR(255) NOT NULL DEFAULT 'Cloud Pilot';
-- ALTER TABLE cloudpilot_workflows
--     DROP INDEX idx_workflows_organization,
--     ADD INDEX idx_workflows_organization (organization);


-- -----------------------------------------------------------------------------
-- C) Optional sanity checks (read-only)
-- -----------------------------------------------------------------------------

-- SHOW CREATE TABLE cloudpilot_workflows;

-- Open workflows for a conversation (Phase 1: expect 0 or 1 row):
-- SELECT id, conversation_id, action_type, status, outcome_code, is_open
-- FROM cloudpilot_workflows
-- WHERE conversation_id = 123
--   AND is_open = 1;
