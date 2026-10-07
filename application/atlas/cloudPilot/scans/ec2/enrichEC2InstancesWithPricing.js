const CloudServicePricing = require('../../pricing/CloudServicePricing');
const EstimatePricingFunctions = require('../../pricing/estimatePricing');

/*
FUNCTIONS A: Attach compute cost estimates to formatted EC2 instances
    1) Function A1: enrichEC2InstancesWithPricing

Uses stored On-Demand hourly rates only. Missing rates → no cost fields.
*/

//Function A1: Copy instances with estimated cost fields when a rate exists
async function enrichEC2InstancesWithPricing(instances, region) {
    const list = Array.isArray(instances) ? instances : [];
    const scanRegion = String(region || '').trim();

    if (list.length === 0) {
        return list;
    }

    const typeNames = [];

    for (let i = 0; i < list.length; i++) {
        const instanceType = String(list[i].instanceType || '').trim();
        const instanceRegion = String(list[i].region || scanRegion).trim();

        if (instanceType && instanceRegion) {
            typeNames.push(instanceType);
        }
    }

    // MVP seed is per-region; batch by primary scan region, then fill gaps per row region
    const ratesByName = await CloudServicePricing.findHourlyRatesForNames({
        region: scanRegion,
        resourceNames: typeNames
    });

    const enriched = [];

    for (let i = 0; i < list.length; i++) {
        const instance = list[i] || {};
        const instanceType = String(instance.instanceType || '').trim();
        const instanceRegion = String(instance.region || scanRegion).trim();
        let hourlyRow = null;

        if (instanceType && instanceRegion === scanRegion && ratesByName[instanceType]) {
            hourlyRow = ratesByName[instanceType];
        } else if (instanceType && instanceRegion) {
            hourlyRow = await CloudServicePricing.findHourlyRate({
                region: instanceRegion,
                resourceName: instanceType
            });
        }

        const estimate = EstimatePricingFunctions.estimateFromHourly(hourlyRow);
        const copy = Object.assign({}, instance);

        if (estimate) {
            copy.estimatedHourlyCost = estimate.hourly;
            copy.estimatedDailyCost = estimate.daily;
            copy.estimatedMonthlyCost = estimate.monthly;
            copy.estimatedCostCurrency = estimate.currency;
            copy.estimatedCostSpeak = EstimatePricingFunctions.formatEstimateSpeakLine(estimate);
            copy.estimatedCostIsEstimate = true;
        }

        enriched.push(copy);
    }

    return enriched;
}

module.exports = {
    enrichEC2InstancesWithPricing
};
