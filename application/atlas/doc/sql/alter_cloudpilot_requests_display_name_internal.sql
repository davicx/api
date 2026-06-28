-- Request naming: display_name_internal (user already ran this on live DB)
-- Safe to re-run only the index if column exists.

ALTER TABLE cloudpilot_requests
    ADD COLUMN display_name_internal VARCHAR(255) NULL
        AFTER action_name;

CREATE UNIQUE INDEX idx_cloudpilot_requests_display_name_internal
    ON cloudpilot_requests (display_name_internal);
