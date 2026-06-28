-- Add user-friendly and record-key names to cloudpilot_history.
-- Safe to run once on existing databases (after cloudpilot_history exists).
--
-- action_display_name  — frozen UI label, e.g. "Toggle EC2 for Kite"
-- action_record_key    — computer key, e.g. toggle_ec2_may_2_2026_2:00_pm (no seconds)

ALTER TABLE cloudpilot_history
    ADD COLUMN action_display_name VARCHAR(255) NULL AFTER action_name,
    ADD COLUMN action_record_key VARCHAR(255) NULL AFTER action_display_name;
