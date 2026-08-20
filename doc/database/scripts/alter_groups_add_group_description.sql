-- =============================================================================
-- ALTER shareshare.groups — add group_description after group_name
-- =============================================================================
-- Usage:
--   mysql -u root -ppassword shareshare < api/doc/database/scripts/alter_groups_add_group_description.sql
--
-- If Error 1060 Duplicate column 'group_description': already applied, skip.
-- Existing rows get the default automatically.
-- =============================================================================

ALTER TABLE shareshare.groups
    ADD COLUMN group_description VARCHAR(255) NOT NULL
    DEFAULT 'this is my new group so cool'
    AFTER group_name;
