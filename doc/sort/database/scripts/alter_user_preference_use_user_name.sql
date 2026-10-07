-- =============================================================================
-- ALTER shareshare.user_preference — replace user_profile_id with user_name
-- =============================================================================
-- Usage:
--   mysql -u root -ppassword shareshare < api/doc/database/scripts/alter_user_preference_use_user_name.sql
--
-- Run this if you already created the table with user_profile_id.
-- Empty table: drops id column and adds user_name.
-- If you have rows, back them up first or truncate before running.
-- =============================================================================

-- Drop FK + index that reference user_profile_id
ALTER TABLE user_preference
    DROP FOREIGN KEY fk_user_preference_user_profile;

ALTER TABLE user_preference
    DROP INDEX idx_user_preference_profile_active;

ALTER TABLE user_preference
    DROP COLUMN user_profile_id;

ALTER TABLE user_preference
    ADD COLUMN user_name VARCHAR(50) NOT NULL AFTER user_preference_id;

ALTER TABLE user_preference
    ADD KEY idx_user_preference_user_active (user_name, active, display_order);

ALTER TABLE user_preference
    ADD CONSTRAINT fk_user_preference_user_name
        FOREIGN KEY (user_name)
        REFERENCES user_profile(user_name)
        ON DELETE CASCADE;
