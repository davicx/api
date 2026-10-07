-- Seed / upsert show_ai_usage into cloudpilot_actions (existing DBs).
-- Chat matching uses actionMap.js; this keeps the actions catalog in sync.
--
--   mysql -u USER -p DATABASE_NAME < doc/sql/seed_show_ai_usage.sql

INSERT INTO cloudpilot_actions (action_type, display_name, requires_execution) VALUES
    ('show_ai_usage', 'AI Usage', 1)
AS new_action
ON DUPLICATE KEY UPDATE
    display_name = new_action.display_name,
    requires_execution = new_action.requires_execution;
