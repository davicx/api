const EstimatePricingFunctions = require('../pricing/estimatePricing');

/*
FUNCTIONS A: EC2 compute-cost Question fulfillment
    1) Function A1: buildEc2ComputeCostResponse

Grounded estimate from stored hourly rates — never invents a price.
Uses message values first, then open-request collected (e.g. pause after verify).
Always Internal — never uses CLOUDPILOT_MESSAGE_RESPONSE / general OpenAI chat.
Doc: doc/development/finished/feature_useful_price.md
*/

//Function A1: Build chat reply for EC2_COMPUTE_COST
async function buildEc2ComputeCostResponse(options) {
    const settings = options || {};
    const values =
        settings.values && typeof settings.values === 'object' ? settings.values : {};
    const collected =
        settings.collected && typeof settings.collected === 'object'
            ? settings.collected
            : {};

    const region =
        String(values.region || collected.region || '').trim() || '';
    const instanceType =
        String(values.instance_type || collected.instance_type || '').trim() || '';

    if (!region || !instanceType) {
        return {
            success: true,
            cloudPilotMessage:
                'I can estimate compute On-Demand cost when I know the region and instance type.\n\n' +
                'For example: t3.micro in us-west-2.',
            atlasResponse: null,
            error: null
        };
    }

    const estimate = await EstimatePricingFunctions.estimateEc2OnDemand(
        region,
        instanceType
    );
    const costLine = EstimatePricingFunctions.formatEstimateSpeakLine(estimate);

    if (!costLine) {
        return {
            success: true,
            cloudPilotMessage:
                'I do not have a stored On-Demand rate for ' +
                instanceType +
                ' in ' +
                region +
                ', so I will not invent a cost.',
            atlasResponse: null,
            error: null
        };
    }

    return {
        success: true,
        cloudPilotMessage:
            'Estimated compute On-Demand cost for ' +
            instanceType +
            ' in ' +
            region +
            ' is ' +
            costLine +
            '.\n\n' +
            'This is an estimate from CloudPilot’s stored rate — not your AWS bill.',
        atlasResponse: null,
        error: null
    };
}

module.exports = {
    buildEc2ComputeCostResponse
};
