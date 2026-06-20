const openAIFunctions = require('../chat/openAI/openAIFunctions');
const { CHAT_TYPE } = require('../decision/decisionTypes');

/*
FUNCTIONS A: STEP 7 — general chat response (OpenAI)
    1) Function A1: buildGeneralChatResponse
*/

//Function A1: Return general chat text when decision routes to OpenAI
async function buildGeneralChatResponse(context) {
    const currentUserMessage = context.currentUserMessage || '';
    // const openAIResult = await openAIFunctions.sendGeneralChat(currentUserMessage);
    const openAIResult = {
        success: true,
        data: 'Open AI will respond when Live'
    };

    if (!openAIResult.success) {
        return {
            success: false,
            cloudPilotMessage: '',
            chatType: CHAT_TYPE.GENERAL_CHAT_RESPONDING,
            atlasResponse: null,
            error: openAIResult.message || 'general_chat_failed'
        };
    }

    const cloudPilotMessage = openAIResult.data ? String(openAIResult.data).trim() : '';

    return {
        success: Boolean(cloudPilotMessage),
        cloudPilotMessage: cloudPilotMessage,
        chatType: CHAT_TYPE.GENERAL_CHAT_RESPONDING,
        atlasResponse: null,
        error: null
    };
}

module.exports = {
    buildGeneralChatResponse
};
