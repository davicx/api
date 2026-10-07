const SaveAiUsageFunctions = require('../../atlas/providers/openAI/usage/saveAiUsage');

/**
 * TEMP OpenAI lab completion — uses max_completion_tokens (required by gpt-5.6-* models).
 * Does not change Atlas createOpenAiChatCompletion (still max_tokens for gpt-4o*).
 */
async function createLabChatCompletion(client, params) {
    if (!client) {
        return { success: false, message: 'OpenAI client is missing', data: null, usage: null };
    }

    const model = params.model;
    const messages = params.messages;
    const maxCompletionTokens = Number(params.max_completion_tokens) || 512;

    try {
        // Do not send temperature — gpt-5.6-* only support the default (1)
        const response = await client.chat.completions.create({
            model: model,
            messages: messages,
            max_completion_tokens: maxCompletionTokens
        });

        const choice = response.choices && response.choices[0] && response.choices[0].message;
        const data = choice && choice.content != null ? choice.content : null;
        const usage = response.usage || null;

        if (usage) {
            void SaveAiUsageFunctions.saveAiUsageFromOpenAIResponse({
                usage: usage,
                model: model,
                organizationId: params.organizationId,
                conversationId: params.conversationId,
                requestId: params.requestId,
                feature: params.feature || 'openai_test'
            });
        }

        return { success: true, data: data, usage: usage };
    } catch (error) {
        console.error('[createLabChatCompletion] OpenAI error:', error.message || error);
        return {
            success: false,
            message: 'OpenAI request failed',
            data: null,
            usage: null,
            error: error.message || String(error)
        };
    }
}

module.exports = { createLabChatCompletion };
