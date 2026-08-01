const AtlasPostFunctions = require('../client/atlasPost');

/*
FUNCTIONS A: Billing — thin Atlas POST /billing/summary
    1) Function A1: getBillingSummary
*/

//Function A1: Get AWS billing summary (spend by service)
async function getBillingSummary(options) {
    const opts = options || {};

    return AtlasPostFunctions.atlasPost('/billing/summary', {
        period_days: opts.period_days != null ? opts.period_days : 30
    });
}

module.exports = { getBillingSummary };
