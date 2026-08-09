const AiUsage = require('../providers/openAI/usage/AiUsage');
const Functions = require('../../functions/functions');

/*
FUNCTIONS A: AI usage HTTP handlers
    1) Function A1: getAiUsageSummary

Doc: doc/development/finished/feature_ai_spending.md
*/

//Function A1: GET summary — today / month cost + request counts
async function getAiUsageSummary(req, res) {
    Functions.addHeader('HEADER: Get AI Usage Summary');

    const organizationId =
        (req.query && (req.query.organization_id || req.query.organizationID)) ||
        (req.body && (req.body.organization_id || req.body.organizationID)) ||
        null;

    const summaryOutcome = await AiUsage.getUsageSummary({
        organizationId: organizationId
    });

    if (!summaryOutcome.success) {
        Functions.addFooter();
        return res.status(500).json({
            success: false,
            message: 'Could not load AI usage summary',
            data: null,
            errors: summaryOutcome.errors
        });
    }

    Functions.addFooter();
    return res.json({
        success: true,
        message: 'AI usage summary',
        data: summaryOutcome.data
    });
}

module.exports = {
    getAiUsageSummary
};
