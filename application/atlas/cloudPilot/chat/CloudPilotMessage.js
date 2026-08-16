const { CHAT_TYPE } = require('../requests/decisionTypes');
const RequestTemplates = require('./templates/requestTemplates');
const GetRequestMessageReplyContextFunctions = require('./presentation/getRequestMessageReplyContext');
const CloudPilotIntelligence = require('../../cloudPilotIntelligence/CloudPilotIntelligence');

/*
CloudPilotMessage — prepare outgoing Message Reply (does NOT send).

prepare* packages the Message Reply for the user.
GenAI wording goes through CloudPilotIntelligence.generateGeneralMessageReply()
and generateRequestMessageReply().
*/

//Function A1: Prepare General Message Reply — package Intelligence general wording
// Questions (open_requests, ai_spend, …) must never call this.
// CLOUDPILOT_MESSAGE_RESPONSE=openai applies to general chat and request presentation — not Question facts.
async function prepareGeneralMessageReply(processMessageContext) {
    const chatResult = await CloudPilotIntelligence.generateGeneralMessageReply(processMessageContext);

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

//Function A2: Prepare Request Message Reply — deterministic first; optional Intelligence wording
async function prepareRequestMessageReply(payload, chatType) {
    const templateResult = await RequestTemplates.getRequestMessageReply(payload);
    const templateMessage = templateResult.cloudPilotMessage || templateResult.message || '';
    let cloudPilotMessage = templateMessage;

    const requestMessageReplyContext =
        GetRequestMessageReplyContextFunctions.getRequestMessageReplyContext(
            payload,
            templateMessage
        );

    if (requestMessageReplyContext) {
        const presented = await CloudPilotIntelligence.generateRequestMessageReply(
            requestMessageReplyContext
        );

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

//Function A3: Prepare Known Message Reply — words already known; package only
function prepareKnownMessageReply(outcome) {
    return formatOutgoing(outcome);
}

//Function B1: Normalize outgoing Message Reply shape
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
    prepareGeneralMessageReply,
    prepareRequestMessageReply,
    prepareKnownMessageReply,
    formatOutgoing
};
