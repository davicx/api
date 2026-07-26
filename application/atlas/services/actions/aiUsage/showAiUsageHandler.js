const AiUsage = require('../../../ai/usage/AiUsage');
const AiUsageMessageBuilder = require('./aiUsageMessageBuilder');

/*
FUNCTIONS A: show_ai_usage handler
    1) Function A1: showAiUsageHandler

Immediate informational action — local ai_usage table, not Atlas / AWS.
Doc: doc/development/ai_usage.md
*/

//Function A1: Load OpenAI usage summary → chat message
async function showAiUsageHandler(executionContext) {
    try {
        const organizationId =
            executionContext &&
            (executionContext.organizationId ||
                executionContext.organization_id ||
                executionContext.masterSite)
                ? (executionContext.organizationId ||
                      executionContext.organization_id ||
                      null)
                : null;

        const summaryOutcome = await AiUsage.getUsageSummary({
            organizationId: organizationId
        });

        if (!summaryOutcome.success || !summaryOutcome.data) {
            return {
                success: false,
                cloudPilotMessage:
                    'I could not load your OpenAI usage right now. Try again in a moment.',
                error: 'ai_usage_summary_failed',
                atlasResponse: null
            };
        }

        const cloudPilotMessage = AiUsageMessageBuilder.buildAiUsageMessage(
            summaryOutcome.data
        );

        return {
            success: true,
            cloudPilotMessage: cloudPilotMessage,
            error: null,
            atlasResponse: null,
            navigatorResponse: null
        };
    } catch (err) {
        console.error('[showAiUsageHandler]', err.message || err);
        return {
            success: false,
            cloudPilotMessage:
                'I could not load your OpenAI usage right now. Try again in a moment.',
            error: 'ai_usage_handler_failed',
            atlasResponse: null
        };
    }
}

module.exports = showAiUsageHandler;
