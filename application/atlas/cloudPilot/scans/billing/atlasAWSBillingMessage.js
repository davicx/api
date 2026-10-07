/*
FUNCTIONS A: Billing chat message
    1) Function A1: buildBillingMessage
    2) Function A2: normalizeBillingData

FUNCTIONS B: Helpers
    1) Function B1: formatUsd
    2) Function B2: buildTopServicesLine
    3) Function B3: buildBillingNextSteps
*/

//Function A1: Chat text for AWS billing summary
function buildBillingMessage(billingData) {
    const data = normalizeBillingData(billingData);
    const services = data.services;
    const periodDays = data.periodDays;
    const totalUsd = data.totalUsd;

    if (!services.length) {
        return (
            'AWS Billing (Last ' +
            periodDays +
            ' Days)\n\n' +
            'I did not find any AWS spend for that period.\n\n' +
            buildBillingNextSteps([]).join('\n')
        );
    }

    const lines = [];
    lines.push('AWS Billing (Last ' + periodDays + ' Days)');
    lines.push('');

    services.forEach(function appendServiceRow(row) {
        lines.push(padServiceLabel(row.service) + formatUsd(row.amountUsd));
    });

    lines.push('');
    lines.push('Total: ' + formatUsd(totalUsd));
    lines.push('');
    lines.push(buildTopServicesLine(services));
    lines.push('');
    lines.push('What would you like to do?');
    lines.push('');
    buildBillingNextSteps(services).forEach(function appendStep(step) {
        lines.push('• ' + step);
    });

    return lines.join('\n');
}

//Function A2: Normalize Atlas billing payload
function normalizeBillingData(billingData) {
    const raw = billingData || {};
    const services = Array.isArray(raw.services) ? raw.services : [];

    return {
        periodDays: raw.period_days != null ? Number(raw.period_days) : 30,
        periodStart: raw.period_start || null,
        periodEnd: raw.period_end || null,
        totalUsd: raw.total_usd != null ? Number(raw.total_usd) : 0,
        services: services.map(function mapServiceRow(row) {
            return {
                service: String(row.service || '').trim() || 'Other',
                amountUsd: row.amount_usd != null ? Number(row.amount_usd) : 0
            };
        })
    };
}

function buildTopServicesLine(services) {
    const top = services.slice(0, 2).map(function nameOnly(row) {
        return row.service;
    });

    if (top.length === 0) {
        return 'I checked your AWS billing for this period.';
    }

    if (top.length === 1) {
        return 'Most of your AWS spend comes from ' + top[0] + '.';
    }

    return 'Most of your AWS spend comes from ' + top[0] + ' and ' + top[1] + '.';
}

function buildBillingNextSteps(services) {
    const steps = ['Scan EC2', 'Show AWS inventory'];
    const names = services.map(function serviceName(row) {
        return String(row.service || '').toLowerCase();
    });

    if (names.some(function hasRds(name) { return name.indexOf('rds') !== -1; })) {
        steps.splice(1, 0, 'Show RDS databases');
    }

    return steps;
}

function padServiceLabel(label) {
    const text = String(label || '');
    return text.length >= 16 ? text + '  ' : (text + '                ').slice(0, 16);
}

function formatUsd(amount) {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
        return '$0';
    }

    if (Math.abs(value - Math.round(value)) < 0.005) {
        return '$' + Math.round(value);
    }

    return '$' + value.toFixed(2);
}

module.exports = {
    buildBillingMessage,
    normalizeBillingData
};
