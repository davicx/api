const openAIFunctions = require('../../../openAIFunctions');

async function toggleEC2Handler(context) {
    const chatResult = await openAIFunctions.sendChatWithAction(context.userMessage, context.action);

    if (!chatResult.success) {
        return {
            success: false,
            cloudPilotMessage: chatResult.message || 'ChatGPT request failed',
            error: chatResult.error || null,
            atlas: null
        };
    }

    const cloudPilotMessage =
        (chatResult.data != null && chatResult.data !== '')
            ? chatResult.data
            : (chatResult.message || '');

    return {
        success: true,
        cloudPilotMessage: cloudPilotMessage,
        error: null,
        atlas: null
    };
}

module.exports = toggleEC2Handler;
