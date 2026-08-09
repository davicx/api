-- =============================================================================
-- RENAME ai_usage → cloud_pilot_ai_usage
-- =============================================================================
-- Run once on DBs that already have the legacy table name.
-- Skip if cloud_pilot_ai_usage already exists / ai_usage is gone.
-- =============================================================================

RENAME TABLE ai_usage TO cloud_pilot_ai_usage;
