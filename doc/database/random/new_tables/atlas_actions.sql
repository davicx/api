
CREATE TABLE atlas_actions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Who owns this action
    user_id BIGINT UNSIGNED NOT NULL,

    -- What the user is trying to do
    intent VARCHAR(100) NOT NULL,

    -- ready | incomplete | completed | failed
    status VARCHAR(20) NOT NULL DEFAULT 'incomplete',

    -- JSON blob containing scan_type, region, team, instance_id, rules, etc.
    params JSON NULL,

    -- List of missing fields: ["region", "rules"]
    missing JSON NULL,

    -- Optional tracking / audit
    error_message TEXT NULL,

    -- Execution / lifecycle
    executed_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_status (user_id, status),
    INDEX idx_intent (intent)
);