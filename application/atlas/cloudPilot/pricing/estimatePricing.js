/*
FUNCTIONS A: Pricing estimate helpers (hourly truth → daily / monthly)
    1) Function A1: estimateFromHourly
    2) Function A2: formatEstimateSpeakLine
    3) Function A3: formatEstimateShortLabel
    4) Function A4: estimateEc2OnDemand
    5) Function A5: estimatePauseSavings
    6) Function A6: formatPauseSavingsSpeakLine

Doc: doc/development/finished/feature_useful_price.md
*/

const CloudServicePricing = require('./CloudServicePricing');

const HOURS_PER_DAY = 24;
const HOURS_PER_MONTH = 730;
const DEFAULT_PAUSE_SAVINGS_HOURS = HOURS_PER_DAY;

//Function A1: Daily / monthly from a stored hourly rate row
function estimateFromHourly(hourlyRow) {
    if (!hourlyRow || hourlyRow.unit !== 'hour') {
        return null;
    }

    const hourly = Number(hourlyRow.price);

    if (!Number.isFinite(hourly) || hourly < 0) {
        return null;
    }

    return {
        hourly: roundMoney(hourly),
        daily: roundMoney(hourly * HOURS_PER_DAY),
        monthly: roundMoney(hourly * HOURS_PER_MONTH),
        currency: hourlyRow.currency || 'USD',
        resourceName: hourlyRow.resourceName || null,
        region: hourlyRow.region || null,
        pricingModel: hourlyRow.pricingModel || 'on_demand',
        isEstimate: true
    };
}

//Function A2: Speak line — always labeled as estimate
function formatEstimateSpeakLine(estimate) {
    if (!estimate) {
        return null;
    }

    return (
        'about $' +
        formatMoney(estimate.daily) +
        '/day ($' +
        formatMoney(estimate.monthly) +
        '/month)'
    );
}

//Function A3: Short table label (monthly estimate)
function formatEstimateShortLabel(estimate) {
    if (!estimate) {
        return null;
    }

    return estimate.monthly;
}

//Function A4: Lookup + estimate for one EC2 instance type in a region
async function estimateEc2OnDemand(region, instanceType) {
    const hourlyRow = await CloudServicePricing.findHourlyRate({
        provider: 'aws',
        service: 'ec2',
        region: region,
        resourceType: 'instance',
        resourceName: instanceType,
        pricingModel: 'on_demand',
        operatingSystem: 'linux'
    });

    return estimateFromHourly(hourlyRow);
}

//Function A5: Pause savings for N hours (default ~24h) from an estimate
function estimatePauseSavings(estimate, hours) {
    if (!estimate || estimate.hourly == null) {
        return null;
    }

    const hoursCount =
        hours == null || hours === ''
            ? DEFAULT_PAUSE_SAVINGS_HOURS
            : Number(hours);

    if (!Number.isFinite(hoursCount) || hoursCount <= 0) {
        return null;
    }

    const hourly = Number(estimate.hourly);

    if (!Number.isFinite(hourly) || hourly < 0) {
        return null;
    }

    return {
        hours: hoursCount,
        amount: roundMoney(hourly * hoursCount),
        currency: estimate.currency || 'USD',
        resourceName: estimate.resourceName || null,
        region: estimate.region || null,
        isEstimate: true
    };
}

//Function A6: Pause savings speak — estimate / compute On-Demand only
function formatPauseSavingsSpeakLine(savings) {
    if (!savings || savings.amount == null) {
        return null;
    }

    const hoursLabel =
        Number(savings.hours) === HOURS_PER_DAY
            ? 'about 24 hours'
            : 'about ' + String(savings.hours) + ' hours';

    return (
        'Pausing for ' +
        hoursLabel +
        ' could save about $' +
        formatMoney(savings.amount) +
        ' in compute On-Demand cost.'
    );
}

function roundMoney(value) {
    const n = Number(value);

    if (!Number.isFinite(n)) {
        return 0;
    }

    return Math.round(n * 1e6) / 1e6;
}

function formatMoney(value) {
    const n = Number(value);

    if (!Number.isFinite(n)) {
        return '0.00';
    }

    if (n >= 1) {
        return n.toFixed(2);
    }

    return n.toFixed(2);
}

module.exports = {
    HOURS_PER_DAY,
    HOURS_PER_MONTH,
    DEFAULT_PAUSE_SAVINGS_HOURS,
    estimateFromHourly,
    formatEstimateSpeakLine,
    formatEstimateShortLabel,
    estimateEc2OnDemand,
    estimatePauseSavings,
    formatPauseSavingsSpeakLine
};
