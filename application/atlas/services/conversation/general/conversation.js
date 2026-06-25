const BuildGeneralChatResponseFunctions = require('../../responses/buildGeneralChatResponse');
const { CHAT_TYPE } = require('../../decision/decisionTypes');

/*
General Conversation — speak (entire non-request turn after STEP 4)

Today: wraps buildGeneralChatResponse (OpenAI when wired).
*/

//Function A1: General Conversation entry
async function conversation(context) {
    return BuildGeneralChatResponseFunctions.buildGeneralChatResponse(context);
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
