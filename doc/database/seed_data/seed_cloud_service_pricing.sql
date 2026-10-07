-- =============================================================================
-- Seed cloud_service_pricing (MVP: t3.nano + t3.micro, us-west-2)
-- =============================================================================
--
-- Doc: doc/development/finished/feature_useful_price.md
-- Requires: doc/sql/cloud_service_pricing.sql already applied
--
-- Usage:
--   mysql -u USER -p DATABASE_NAME < doc/sql/seed/seed_cloud_service_pricing.sql
--
-- Rates: AWS EC2 On-Demand Linux hourly, us-west-2 (Oregon), recorded 2026-08-11.
--   t3.nano  = 0.005200 USD/hour  → ≈ $0.12/day, ≈ $3.80/month (×24 / ×730)
--   t3.micro = 0.010400 USD/hour  → ≈ $0.25/day, ≈ $7.59/month (×24 / ×730)
--
-- Safe to re-run: upserts by unique_price key.
-- =============================================================================

INSERT INTO cloud_service_pricing (
    provider,
    service,
    region,
    resource_type,
    resource_name,
    price,
    unit,
    pricing_model,
    operating_system,
    currency
)
VALUES
(
    'aws',
    'ec2',
    'us-west-2',
    'instance',
    't3.nano',
    0.005200,
    'hour',
    'on_demand',
    'linux',
    'USD'
),
(
    'aws',
    'ec2',
    'us-west-2',
    'instance',
    't3.micro',
    0.010400,
    'hour',
    'on_demand',
    'linux',
    'USD'
)
AS new_row
ON DUPLICATE KEY UPDATE
    price = new_row.price,
    unit = new_row.unit,
    currency = new_row.currency,
    updated_at = CURRENT_TIMESTAMP;
