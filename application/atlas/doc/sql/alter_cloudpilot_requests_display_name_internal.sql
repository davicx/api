-- Request naming: display_name_internal
-- Run on any DB that was created before this column existed.
-- Prefer the idempotent script (safe to re-run):
--   node test/scripts/ensure-cloudpilot-requests-display-name-internal.js
--
-- Or run this SQL once (fails if column/index already exist).

ALTER TABLE cloudpilot_requests
    ADD COLUMN display_name_internal VARCHAR(255) NULL
        AFTER action_name;

CREATE UNIQUE INDEX idx_cloudpilot_requests_display_name_internal
    ON cloudpilot_requests (display_name_internal);
