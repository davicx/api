const SearchLogs = require('../helpers/searchLogs');

/*
FUNCTIONS A: EC2 compute-cost Question search (Internal MVP)
    1) Function A1: shouldRunEc2ComputeCostSearch
    2) Function A2: searchForEc2ComputeCost
    3) Function A3: searchForEc2ComputeCostInternal

Classify only — CloudPilot owns the estimate speak.
OpenAI spend / usage stays on ai_spend. This is EC2 compute cost.
Returns { question: 'ec2_compute_cost' } or {}.
Doc: doc/development/finished/feature_useful_price.md
*/

//Function A1: Cheap gate — skip OpenAI spend and unrelated messages
function shouldRunEc2ComputeCostSearch(message) {
    const text = String(message || '').toLowerCase();

    if (!text.trim()) {
        return false;
    }

    if (
        text.indexOf('openai') !== -1 ||
        text.indexOf('open ai') !== -1 ||
        text.indexOf('ai spend') !== -1 ||
        text.indexOf('ai usage') !== -1 ||
        text.indexOf('ai cost') !== -1
    ) {
        return false;
    }

    return (
        text.indexOf('what am i paying') !== -1 ||
        text.indexOf("what i'm paying") !== -1 ||
        text.indexOf('what is this costing') !== -1 ||
        text.indexOf("what's this costing") !== -1 ||
        text.indexOf('compute cost') !== -1 ||
        text.indexOf('instance cost') !== -1 ||
        text.indexOf('ec2 cost') !== -1 ||
        text.indexOf('how much does this instance cost') !== -1 ||
        text.indexOf('how much does this ec2 cost') !== -1 ||
        text.indexOf('how much is this instance') !== -1 ||
        text.indexOf('estimate the cost') !== -1 ||
        text.indexOf('estimate cost') !== -1
    );
}

//Function A2: Select how CloudPilot searches for EC2 compute-cost questions
async function searchForEc2ComputeCost(message) {
    const userMessage = String(message || '');

    //STEP 1: Should I run?
    if (!shouldRunEc2ComputeCostSearch(userMessage)) {
        SearchLogs.recordSearch({
            name: 'EC2 Compute Cost',
            method: 'Skipped',
            result: null
        });
        return {};
    }

    //STEP 2: Internal only for MVP (no OpenAI classify)
    const result = searchForEc2ComputeCostInternal(userMessage);

    SearchLogs.recordSearch({
        name: 'EC2 Compute Cost',
        method: 'Internal',
        result: result.question || null
    });

    return result;
}

//Function A3: Internal phrase match
function searchForEc2ComputeCostInternal(message) {
    if (!shouldRunEc2ComputeCostSearch(message)) {
        return {};
    }

    return { question: 'ec2_compute_cost' };
}

module.exports = {
    shouldRunEc2ComputeCostSearch,
    searchForEc2ComputeCost,
    searchForEc2ComputeCostInternal
};
