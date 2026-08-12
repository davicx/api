-- =============================================================================
-- cloud_service_pricing
-- =============================================================================
--
-- Doc: doc/development/current/feature_useful_price.md
--
-- Curated cloud resource unit prices (MVP: EC2 On-Demand hourly rates).
-- Store the unit rate only — CloudPilot calculates daily (×24) / monthly (×730)
-- estimates in the app. Never invent a price when no row exists.
--
-- Usage (existing DB):
--   mysql -u USER -p DATABASE_NAME < doc/sql/cloud_service_pricing.sql
--   mysql -u USER -p DATABASE_NAME < doc/sql/seed/seed_cloud_service_pricing.sql
--
-- Also included in: doc/sql/master_sql.sql
--
-- Safe to re-run: CREATE TABLE IF NOT EXISTS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS cloud_service_pricing (
    id INT AUTO_INCREMENT PRIMARY KEY,

    provider VARCHAR(50) NOT NULL,
    service VARCHAR(50) NOT NULL,
    region VARCHAR(50) NOT NULL,

    resource_type VARCHAR(100) NOT NULL,
    resource_name VARCHAR(100) NOT NULL,

    price DECIMAL(12, 6) NOT NULL,
    unit VARCHAR(50) NOT NULL,

    pricing_model VARCHAR(50) DEFAULT 'on_demand',
    operating_system VARCHAR(50),

    currency VARCHAR(10) DEFAULT 'USD',

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_price (
        provider,
        service,
        region,
        resource_type,
        resource_name,
        pricing_model,
        operating_system
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: For EC2 MVP rows, always set operating_system = 'linux' (do not leave NULL).
-- MySQL UNIQUE allows multiple NULLs in operating_system, which would weaken the key.
