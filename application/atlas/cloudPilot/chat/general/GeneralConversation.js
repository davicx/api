const CloudPilotMessage = require('../CloudPilotMessage');
const { CHAT_TYPE } = require('../../requests/decisionTypes');

/*
General Conversation — speak (entire non-request turn after STEP 4)

Receives processMessageContext (currentUserMessage, selectedFinding, …).
*/

//Function A1: General Conversation entry
async function conversation(processMessageContext) {
    return CloudPilotMessage.speakGeneral(processMessageContext);
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
