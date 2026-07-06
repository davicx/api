const navigatorResponseFunctions = require('../../../navigator/functions/navigatorFunctions');
const BillingMessageFunctions = require('./atlasAWSBillingMessage');

/*
FUNCTIONS A: Billing Navigator data
    1) Function A1: buildBillingNavigatorResponse
    2) Function A2: buildBillingNavigatorData

FUNCTIONS B: Helpers
    1) Function B1: buildBillingTable
    2) Function B2: buildBillingTableRow
    3) Function B3: buildBillingStats
*/

//Function A1: Full navigator envelope for billing
function buildBillingNavigatorResponse(billingData, options) {
    const opts = options || {};

    return navigatorResponseFunctions.createNavigatorResponse({
        success: opts.success !== false,
        message: opts.message || '',
        statusCode: opts.statusCode || 200,
        errors: Array.isArray(opts.errors) ? opts.errors : [],
        currentUser: opts.currentUser || null,
        data: buildBillingNavigatorData(billingData, opts)
    });
}

//Function A2: Stats + Billing table for dashboard
function buildBillingNavigatorData(billingData, options) {
    const opts = options || {};
    const normalized = BillingMessageFunctions.normalizeBillingData(billingData);
    const navigatorData = navigatorResponseFunctions.createEmptyNavigatorData();

    navigatorData.meta = {
        periodDays: normalized.periodDays,
        periodStart: normalized.periodStart,
        periodEnd: normalized.periodEnd,
        totalUsd: normalized.totalUsd,
        serviceCount: normalized.services.length
    };

    navigatorData.stats = buildBillingStats(normalized);
    navigatorData.tables = [buildBillingTable(normalized)];

    navigatorData.raw =
        opts.includeRaw === true
            ? (opts.raw || null)
            : null;

    return navigatorData;
}

function buildBillingStats(normalized) {
    const stats = [];
    const services = normalized.services || [];

    services.slice(0, 3).forEach(function appendTopService(row, index) {
        stats.push({
            id: 'billing_service_' + index,
            label: row.service,
            value: row.amountUsd,
            type: 'currency'
        });
    });

    stats.push({
        id: 'billing_total',
        label: 'Total',
        value: normalized.totalUsd,
        type: 'currency'
    });

    return stats;
}

function buildBillingTable(normalized) {
    const periodLabel =
        'Last ' + (normalized.periodDays != null ? normalized.periodDays : 30) + ' days';

    return navigatorResponseFunctions.createEmptyNavigatorTable({
        id: 'aws_billing',
        title: 'Billing',
        columns: [
            navigatorResponseFunctions.createNavigatorTableColumn({
                key: 'service',
                label: 'Service',
                type: 'text'
            }),
            navigatorResponseFunctions.createNavigatorTableColumn({
                key: 'amount_usd',
                label: periodLabel,
                type: 'currency'
            })
        ],
        rows: (normalized.services || []).map(buildBillingTableRow)
    });
}

function buildBillingTableRow(row, index) {
    return {
        row_id: 'billing_' + (row.service || index),
        service: row.service,
        amount_usd: row.amountUsd
    };
}

module.exports = {
    buildBillingNavigatorResponse,
    buildBillingNavigatorData
};
