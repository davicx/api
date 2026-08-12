const db = require('../../../functions/conn');

/*
METHODS A: cloud_service_pricing lookup
    1) Method A1: findHourlyRate
    2) Method A2: findHourlyRatesForNames

Doc: doc/development/current/feature_useful_price.md
*/

class CloudServicePricing {

    //Method A1: One hourly rate row (or null)
    static async findHourlyRate(options) {
        const settings = options || {};
        const provider = String(settings.provider || 'aws').trim();
        const service = String(settings.service || 'ec2').trim();
        const region = String(settings.region || '').trim();
        const resourceType = String(settings.resourceType || 'instance').trim();
        const resourceName = String(settings.resourceName || settings.instanceType || '').trim();
        const pricingModel = String(settings.pricingModel || 'on_demand').trim();
        const operatingSystem = String(settings.operatingSystem || 'linux').trim();

        if (!region || !resourceName) {
            return null;
        }

        const connection = db.getConnection();

        try {
            const rows = await runQuery(
                connection,
                `SELECT
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
                 FROM cloud_service_pricing
                 WHERE provider = ?
                   AND service = ?
                   AND region = ?
                   AND resource_type = ?
                   AND resource_name = ?
                   AND pricing_model = ?
                   AND operating_system = ?
                 LIMIT 1`,
                [
                    provider,
                    service,
                    region,
                    resourceType,
                    resourceName,
                    pricingModel,
                    operatingSystem
                ]
            );

            if (!rows || rows.length === 0) {
                return null;
            }

            return mapPriceRow(rows[0]);
        } catch (err) {
            console.log('CloudServicePricing.findHourlyRate failed', err);
            return null;
        }
    }

    //Method A2: Map of resource_name → hourly row for one region (batch)
    static async findHourlyRatesForNames(options) {
        const settings = options || {};
        const provider = String(settings.provider || 'aws').trim();
        const service = String(settings.service || 'ec2').trim();
        const region = String(settings.region || '').trim();
        const resourceType = String(settings.resourceType || 'instance').trim();
        const pricingModel = String(settings.pricingModel || 'on_demand').trim();
        const operatingSystem = String(settings.operatingSystem || 'linux').trim();
        const resourceNames = uniqueNonEmptyStrings(settings.resourceNames || []);

        const byName = {};

        if (!region || resourceNames.length === 0) {
            return byName;
        }

        const connection = db.getConnection();
        const placeholders = resourceNames.map(function () {
            return '?';
        }).join(', ');

        try {
            const rows = await runQuery(
                connection,
                `SELECT
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
                 FROM cloud_service_pricing
                 WHERE provider = ?
                   AND service = ?
                   AND region = ?
                   AND resource_type = ?
                   AND pricing_model = ?
                   AND operating_system = ?
                   AND resource_name IN (` + placeholders + `)`,
                [
                    provider,
                    service,
                    region,
                    resourceType,
                    pricingModel,
                    operatingSystem
                ].concat(resourceNames)
            );

            for (let i = 0; i < (rows || []).length; i++) {
                const mapped = mapPriceRow(rows[i]);

                if (mapped && mapped.resourceName) {
                    byName[mapped.resourceName] = mapped;
                }
            }

            return byName;
        } catch (err) {
            console.log('CloudServicePricing.findHourlyRatesForNames failed', err);
            return byName;
        }
    }
}

function mapPriceRow(row) {
    if (!row) {
        return null;
    }

    const price = Number(row.price);

    if (!Number.isFinite(price)) {
        return null;
    }

    return {
        provider: String(row.provider || '').trim(),
        service: String(row.service || '').trim(),
        region: String(row.region || '').trim(),
        resourceType: String(row.resource_type || '').trim(),
        resourceName: String(row.resource_name || '').trim(),
        price: price,
        unit: String(row.unit || '').trim(),
        pricingModel: String(row.pricing_model || '').trim(),
        operatingSystem: String(row.operating_system || '').trim(),
        currency: String(row.currency || 'USD').trim() || 'USD'
    };
}

function uniqueNonEmptyStrings(values) {
    const seen = {};
    const out = [];

    for (let i = 0; i < values.length; i++) {
        const value = String(values[i] || '').trim();

        if (!value || seen[value]) {
            continue;
        }

        seen[value] = true;
        out.push(value);
    }

    return out;
}

function runQuery(connection, queryString, params) {
    return new Promise(function (resolve, reject) {
        connection.query(queryString, params, function (err, results) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}

module.exports = CloudServicePricing;
