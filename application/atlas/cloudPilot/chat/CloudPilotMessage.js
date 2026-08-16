const { CHAT_TYPE } = require('../requests/decisionTypes');
const RequestTemplates = require('./templates/requestTemplates');
const GetRequestReplyFactsFunctions = require('./presentation/getRequestReplyFacts');
const CloudPilotIntelligence = require('../../cloudPilotIntelligence/CloudPilotIntelligence');

/*
CloudPilotMessage — the product's voice.

Select speaking strategy and package the outgoing chat message.
GenAI thinking goes through CloudPilotIntelligence.generateGeneralReply().
Friendly Request Reply wording goes through
CloudPilotIntelligence.generateFriendlyReply() — templates always build first.
*/

//Function A1: General Conversation speak — voice wrapper around Intelligence generateGeneralReply()
// Questions (open_requests, ai_spend, …) must never call this.
// CLOUDPILOT_MESSAGE_RESPONSE=openai applies to general chat and request presentation — not Question facts.
async function speakGeneral(processMessageContext) {
    const chatResult = await CloudPilotIntelligence.generateGeneralReply(processMessageContext);

    if (!chatResult.success) {
        return formatOutgoing({
            success: false,
            cloudPilotMessage: '',
            chatType: CHAT_TYPE.GENERAL_CHAT_RESPONDING,
            atlasResponse: null,
            error: chatResult.error || 'general_chat_failed'
        });
    }

    return formatOutgoing({
        success: Boolean(chatResult.message),
        cloudPilotMessage: chatResult.message || '',
        chatType: CHAT_TYPE.GENERAL_CHAT_RESPONDING,
        atlasResponse: null,
        error: null
    });
}

//Function A2: Request Conversation speak — templates first; optional friendly rewrite
async function speakRequest(payload, chatType) {
    const templateResult = await RequestTemplates.buildRequestTemplateMessage(payload);
    const templateMessage = templateResult.cloudPilotMessage || templateResult.message || '';
    let cloudPilotMessage = templateMessage;

    const requestReplyFacts = GetRequestReplyFactsFunctions.getRequestReplyFacts(
        payload,
        templateMessage
    );

    if (requestReplyFacts) {
        const presented = await CloudPilotIntelligence.generateFriendlyReply(requestReplyFacts);

        if (presented && presented.success && presented.message) {
            cloudPilotMessage = presented.message;
        }
    }

    return formatOutgoing({
        success: Boolean(templateResult.success && cloudPilotMessage),
        cloudPilotMessage: cloudPilotMessage,
        chatType: chatType,
        atlasResponse: templateResult.atlasResponse || null,
        error: templateResult.error || null
    });
}

//Function A3: Known message — passthrough, execution outcome, change strategy
function speakKnown(outcome) {
    return formatOutgoing(outcome);
}

//Function B1: Normalize outgoing speak shape
function formatOutgoing(outcome) {
    return {
        success: Boolean(outcome.success),
        cloudPilotMessage: outcome.cloudPilotMessage ? String(outcome.cloudPilotMessage) : '',
        chatType: outcome.chatType || null,
        atlasResponse: outcome.atlasResponse || null,
        error: outcome.error || null
    };
}

module.exports = {
    speakGeneral,
    speakRequest,
    speakKnown,
    formatOutgoing
};
