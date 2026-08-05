const { CHAT_TYPE } = require('../requests/decisionTypes');
const RequestTemplates = require('./templates/requestTemplates');
const CloudPilotIntelligence = require('../../cloudPilotIntelligence/CloudPilotIntelligence');

/*
CloudPilotMessage — the product's voice.

Select speaking strategy and package the outgoing chat message.
GenAI thinking goes through CloudPilotIntelligence.chat().
*/

//Function A1: General Conversation speak — voice wrapper around Intelligence chat()
async function speakGeneral(processMessageContext) {
    const chatResult = await CloudPilotIntelligence.chat(processMessageContext);

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

//Function A2: Request Conversation speak — deterministic templates
async function speakRequest(payload, chatType) {
    const templateResult = await RequestTemplates.buildRequestTemplateMessage(payload);
    const cloudPilotMessage = templateResult.cloudPilotMessage || templateResult.message || '';

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
