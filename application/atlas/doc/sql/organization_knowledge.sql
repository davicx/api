-- =============================================================================
-- organization_knowledge + organization_knowledge_tags
-- =============================================================================
--
-- Doc: doc/development/current/feature_organizational_knowledge.md
--
-- CloudPilot-owned facts about why a resource exists (MVP: S3 buckets).
-- Tags are human aliases (tutorial, youtube, …) — 1 knowledge row → many tags.
--
-- Usage (existing DB):
--   mysql -u USER -p DATABASE_NAME < doc/sql/organization_knowledge.sql
--   mysql -u USER -p DATABASE_NAME < doc/sql/seed/seed_organization_knowledge.sql
--
-- Safe to re-run: CREATE TABLE IF NOT EXISTS.
-- =============================================================================

There is only one SQL detail I would have Cursor watch carefully in Step 2. With:

SELECT
    instruction_row.*,
    image_row.image_path AS image

instruction_row.* already contains the legacy image column, and you're then returning another column named image. Depending on the MySQL driver/result-object behavior, duplicate column names can be confusing or implementation-dependent.

So when implementing the join, I would prefer explicitly selecting the instruction columns and having exactly one resulting image field:

SELECT
    instruction_row.instruction_id,
    instruction_row.instruction_for,
    instruction_row.step_number,
    instruction_row.title,
    instruction_row.instruction,
    instruction_row.image_id,
    instruction_row.duration,
    instruction_row.is_optional,
    instruction_row.created_at,
    instruction_row.updated_at,
    image_row.image_path AS image,
    image_row.alt_text AS image_alt_text
FROM cloudpilot_instructions AS instruction_row
LEFT JOIN cloud_pilot_images AS image_row
    ON instruction_row.image_id = image_row.image_id
WHERE instruction_row.instruction_for = ?
ORDER BY instruction_row.step_number ASC;

Cursor should of course use the actual current column list

CREATE TABLE IF NOT EXISTS organization_knowledge (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    master_site VARCHAR(100) NOT NULL,

    resource_type VARCHAR(50) NOT NULL,
    resource_name VARCHAR(255) NOT NULL,

    display_name VARCHAR(255) NULL,

    purpose TEXT NULL,
    notes TEXT NULL,

    importance VARCHAR(20) NULL,
    recommended_action TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_org_resource (
        master_site,
        resource_type,
        resource_name
    ),

    INDEX idx_org_knowledge_site_type (master_site, resource_type),
    INDEX idx_org_knowledge_display (master_site, resource_type, display_name)
);


CREATE TABLE IF NOT EXISTS organization_knowledge_tags (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    organization_knowledge_id BIGINT UNSIGNED NOT NULL,
    tag VARCHAR(100) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_org_knowledge_tag
        FOREIGN KEY (organization_knowledge_id)
        REFERENCES organization_knowledge (id)
        ON DELETE CASCADE,

    UNIQUE KEY uq_org_knowledge_tag (
        organization_knowledge_id,
        tag
    ),

    INDEX idx_org_knowledge_tag (tag)
);
