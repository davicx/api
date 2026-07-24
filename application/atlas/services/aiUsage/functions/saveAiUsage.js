const AiUsage = require('../classes/AiUsage');
const { calculateOpenAICost } = require('../../engines/llm/openai/calculateOpenAICost');

/*
FUNCTIONS A: Persist OpenAI usage after a successful call
    1) Function A1: saveAiUsageFromOpenAIResponse

Never throws to the chat path — missing usage or DB errors are skipped/logged.
Doc: doc/development/ai_usage.md
*/

//Function A1: Map OpenAI usage → cost → insert ai_usage row
async function saveAiUsageFromOpenAIResponse(options) {
    const opts = options || {};
    const usage = opts.usage;

    if (!usage || typeof usage !== 'object') {
        return { success: false, skipped: true, reason: 'no_usage' };
    }

    const inputTokens = Number(usage.prompt_tokens) || 0;
    const outputTokens = Number(usage.completion_tokens) || 0;
    const totalTokens = Number(usage.total_tokens) || (inputTokens + outputTokens);
    const model = String(opts.model || '').trim();

    if (!model) {
        return { success: false, skipped: true, reason: 'no_model' };
    }

    const estimatedCost = calculateOpenAICost(model, inputTokens, outputTokens);

    try {
        const insertOutcome = await AiUsage.createUsage({
            organizationId: opts.organizationId,
            conversationId: opts.conversationId,
            requestId: opts.requestId,
            feature: opts.feature || 'general_chat',
            model: model,
            inputTokens: inputTokens,
            outputTokens: outputTokens,
            totalTokens: totalTokens,
            estimatedCost: estimatedCost
        });

        if (!insertOutcome.success) {
            console.warn('[saveAiUsageFromOpenAIResponse] insert failed', insertOutcome.errors);
            return { success: false, skipped: false, reason: 'insert_failed' };
        }

        return {
            success: true,
            skipped: false,
            usageId: insertOutcome.usageId,
            estimatedCost: estimatedCost
        };
    } catch (err) {
        console.warn('[saveAiUsageFromOpenAIResponse] unexpected error', err.message || err);
        return { success: false, skipped: false, reason: 'exception' };
    }
}

module.exports = {
    saveAiUsageFromOpenAIResponse
};
