const GetBillingSummaryFunctions = require('../../../../capabilities/billing/getBillingSummary');

/*
FUNCTIONS A: Atlas billing HTTP
    1) Function A1: fetchBillingSummary
*/

//Function A1: Call Atlas POST /billing/summary
async function fetchBillingSummary(options) {
    return GetBillingSummaryFunctions.getBillingSummary(options || {});
}

module.exports = { fetchBillingSummary };
