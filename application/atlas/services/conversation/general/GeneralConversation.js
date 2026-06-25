const { CHAT_TYPE } = require('../../decision/decisionTypes');

/*
General Conversation — speak (entire non-request turn after STEP 4)
*/

//Function A1: General Conversation entry
async function conversation(context) {
    const currentUserMessage = context.currentUserMessage || '';
    // const openAIFunctions = require('../../chat/openAI/openAIFunctions');
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

//Function B1: True when STEP 4 routed to General Conversation
function isGeneralConversation(decision) {
    return Boolean(
        decision && decision.chatType === CHAT_TYPE.GENERAL_CHAT_RESPONDING
    );
}

module.exports = {
    conversation,
    isGeneralConversation
};
