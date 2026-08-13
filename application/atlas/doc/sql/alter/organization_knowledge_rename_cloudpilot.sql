-- =============================================================================
-- Rename organization_knowledge* → cloudpilot_organization_knowledge*
-- =============================================================================
--
-- Run once on DBs that still have the legacy table names.
-- Skip if cloudpilot_organization_knowledge already has data and legacy tables are gone.
--
-- Doc: doc/development/finished/feature_organizational_knowledge.md
-- =============================================================================

-- If an empty cloudpilot_organization_knowledge stub exists from CREATE IF NOT EXISTS, drop it first.
DROP TABLE IF EXISTS cloudpilot_organization_knowledge_tags;
DROP TABLE IF EXISTS cloudpilot_organization_knowledge;

ALTER TABLE organization_knowledge_tags DROP FOREIGN KEY fk_org_knowledge_tag;

RENAME TABLE organization_knowledge TO cloudpilot_organization_knowledge;
RENAME TABLE organization_knowledge_tags TO cloudpilot_organization_knowledge_tags;

ALTER TABLE cloudpilot_organization_knowledge_tags
    ADD CONSTRAINT fk_cloudpilot_org_knowledge_tag
        FOREIGN KEY (organization_knowledge_id)
        REFERENCES cloudpilot_organization_knowledge (id)
        ON DELETE CASCADE;
