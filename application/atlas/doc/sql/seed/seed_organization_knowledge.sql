-- =============================================================================
-- Seed organization_knowledge + tags (demo S3 rows)
-- =============================================================================
--
-- Doc: doc/development/current/feature_organizational_knowledge.md
-- Requires: doc/sql/organization_knowledge.sql already applied
--
-- Usage:
--   mysql -u USER -p DATABASE_NAME < doc/sql/seed/seed_organization_knowledge.sql
--
-- Safe to re-run: upserts knowledge by unique key; INSERT IGNORE on tags.
-- Demo master_site: kite
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Knowledge rows
-- -----------------------------------------------------------------------------

INSERT INTO organization_knowledge (
    master_site,
    resource_type,
    resource_name,
    display_name,
    purpose,
    notes,
    importance,
    recommended_action
)
VALUES
(
    'kite',
    's3_bucket',
    'sam-youtube-demo',
    'Sam YouTube Demo',
    'Created while following Sam''s YouTube tutorial.',
    'Not used in over a month.',
    'low',
    'Likely safe to delete.'
),
(
    'kite',
    's3_bucket',
    'cloudpilot-assets',
    'CloudPilot Assets',
    'Stores website images used by CloudPilot.',
    'Production bucket.',
    'medium',
    'Do not delete unless migrated.'
),
(
    'kite',
    's3_bucket',
    'cloudpilot-user-uploads',
    'CloudPilot User Uploads',
    'Stores user profile photos, group images, post images, and uploaded content.',
    'Production user data.',
    'critical',
    'Do not delete. Recommend versioning. Recommend backups.'
)
AS new_row
ON DUPLICATE KEY UPDATE
    display_name = new_row.display_name,
    purpose = new_row.purpose,
    notes = new_row.notes,
    importance = new_row.importance,
    recommended_action = new_row.recommended_action;


-- -----------------------------------------------------------------------------
-- Tags — sam-youtube-demo
-- -----------------------------------------------------------------------------

INSERT IGNORE INTO organization_knowledge_tags (organization_knowledge_id, tag)
SELECT ok.id, tag_list.tag
FROM organization_knowledge ok
INNER JOIN (
    SELECT 'tutorial' AS tag
    UNION ALL SELECT 'youtube'
    UNION ALL SELECT 'hello world'
    UNION ALL SELECT 'sam'
) AS tag_list
WHERE ok.master_site = 'kite'
  AND ok.resource_type = 's3_bucket'
  AND ok.resource_name = 'sam-youtube-demo';


-- -----------------------------------------------------------------------------
-- Tags — cloudpilot-assets
-- -----------------------------------------------------------------------------

INSERT IGNORE INTO organization_knowledge_tags (organization_knowledge_id, tag)
SELECT ok.id, tag_list.tag
FROM organization_knowledge ok
INNER JOIN (
    SELECT 'assets' AS tag
    UNION ALL SELECT 'website images'
    UNION ALL SELECT 'images'
    UNION ALL SELECT 'frontend'
) AS tag_list
WHERE ok.master_site = 'kite'
  AND ok.resource_type = 's3_bucket'
  AND ok.resource_name = 'cloudpilot-assets';


-- -----------------------------------------------------------------------------
-- Tags — cloudpilot-user-uploads
-- -----------------------------------------------------------------------------

INSERT IGNORE INTO organization_knowledge_tags (organization_knowledge_id, tag)
SELECT ok.id, tag_list.tag
FROM organization_knowledge ok
INNER JOIN (
    SELECT 'uploads' AS tag
    UNION ALL SELECT 'user uploads'
    UNION ALL SELECT 'profile photos'
    UNION ALL SELECT 'group photos'
    UNION ALL SELECT 'production data'
) AS tag_list
WHERE ok.master_site = 'kite'
  AND ok.resource_type = 's3_bucket'
  AND ok.resource_name = 'cloudpilot-user-uploads';
