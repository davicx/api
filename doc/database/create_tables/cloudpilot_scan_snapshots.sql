-- CloudPilot scan snapshots — one immutable row per successful explicit scan.
CREATE TABLE IF NOT EXISTS cloudpilot_scan_snapshots (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    organization VARCHAR(255) NOT NULL DEFAULT 'Cloud Pilot',
    group_id BIGINT NOT NULL,
    conversation_id BIGINT NOT NULL,
    request_id BIGINT UNSIGNED NULL,
    cloudpilot_message_id BIGINT NULL,
    executed_by_user VARCHAR(255) NOT NULL,
    scan_name VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    service VARCHAR(20) NOT NULL,
    region VARCHAR(50) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    resources_scanned INT UNSIGNED NOT NULL DEFAULT 0,
    finding_count INT UNSIGNED NOT NULL DEFAULT 0,
    schema_version TINYINT UNSIGNED NOT NULL DEFAULT 1,
    payload JSON NOT NULL,
    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_scan_request (request_id),
    INDEX idx_scans_conversation_completed (conversation_id, completed_at),
    INDEX idx_scans_group_completed (group_id, completed_at),
    INDEX idx_scans_user_completed (executed_by_user, completed_at),
    INDEX idx_scans_message (cloudpilot_message_id)
);
