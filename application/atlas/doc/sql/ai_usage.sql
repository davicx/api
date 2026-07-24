-- =============================================================================
-- ai_usage — one row per successful CloudPilot OpenAI call
-- =============================================================================
--
-- Doc: doc/development/ai_usage.md
--
-- Usage (existing DB on another machine):
--   mysql -u USER -p DATABASE_NAME < doc/sql/ai_usage.sql
--
-- Safe to re-run: CREATE TABLE IF NOT EXISTS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_usage (
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

    INDEX idx_ai_usage_created (created_at),
    INDEX idx_ai_usage_org_created (organization_id, created_at)
);
