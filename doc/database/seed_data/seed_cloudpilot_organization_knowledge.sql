-- =============================================================================
-- Seed cloudpilot_organization_knowledge + tags (demo S3 rows)
-- =============================================================================
--
-- Doc: doc/development/finished/feature_organizational_knowledge.md
-- Requires: doc/sql/cloudpilot_organization_knowledge.sql already applied
-- Atlas mock: atlas/app/api/routes/test/s3_scan_routes_test.py (same 5 buckets)
--
-- Usage:
--   mysql -u USER -p DATABASE_NAME < doc/sql/seed/seed_cloudpilot_organization_knowledge.sql
--
-- Safe to re-run: upserts knowledge by unique key; INSERT IGNORE on tags.
-- Demo master_site: kite
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Knowledge rows (aligned with Atlas S3 test mock — 5 buckets)
-- -----------------------------------------------------------------------------

INSERT INTO cloudpilot_organization_knowledge (
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
),
(
    'kite',
    's3_bucket',
    'customer-uploads-demo',
    'Customer Uploads Demo',
    'Demo bucket for customer upload experiments and tutorials.',
    'Intentionally misconfigured for scan demos.',
    'low',
    'Safe to delete after demos. Fix public access before any real data.'
),
(
    'kite',
    's3_bucket',
    'kite-app-assets',
    'Kite App Assets',
    'Stores static assets for the Kite app (images, front-end bundles).',
    'Production-shaped demo bucket with strong defaults.',
    'medium',
    'Do not delete unless migrated.'
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

INSERT IGNORE INTO cloudpilot_organization_knowledge_tags (organization_knowledge_id, tag)
SELECT ok.id, tag_list.tag
FROM cloudpilot_organization_knowledge ok
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

INSERT IGNORE INTO cloudpilot_organization_knowledge_tags (organization_knowledge_id, tag)
SELECT ok.id, tag_list.tag
FROM cloudpilot_organization_knowledge ok
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

INSERT IGNORE INTO cloudpilot_organization_knowledge_tags (organization_knowledge_id, tag)
SELECT ok.id, tag_list.tag
FROM cloudpilot_organization_knowledge ok
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


-- -----------------------------------------------------------------------------
-- Tags — customer-uploads-demo
-- -----------------------------------------------------------------------------

INSERT IGNORE INTO cloudpilot_organization_knowledge_tags (organization_knowledge_id, tag)
SELECT ok.id, tag_list.tag
FROM cloudpilot_organization_knowledge ok
INNER JOIN (
    SELECT 'demo' AS tag
    UNION ALL SELECT 'customer uploads'
    UNION ALL SELECT 'uploads demo'
    UNION ALL SELECT 'misconfigured'
) AS tag_list
WHERE ok.master_site = 'kite'
  AND ok.resource_type = 's3_bucket'
  AND ok.resource_name = 'customer-uploads-demo';


-- -----------------------------------------------------------------------------
-- Tags — kite-app-assets
-- -----------------------------------------------------------------------------

INSERT IGNORE INTO cloudpilot_organization_knowledge_tags (organization_knowledge_id, tag)
SELECT ok.id, tag_list.tag
FROM cloudpilot_organization_knowledge ok
INNER JOIN (
    SELECT 'kite' AS tag
    UNION ALL SELECT 'app assets'
    UNION ALL SELECT 'static assets'
    UNION ALL SELECT 'kite images'
) AS tag_list
WHERE ok.master_site = 'kite'
  AND ok.resource_type = 's3_bucket'
  AND ok.resource_name = 'kite-app-assets';
