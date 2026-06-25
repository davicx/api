const { CHAT_TYPE } = require('../decision/decisionTypes');
const RequestTemplates = require('./templates/requestTemplates');
// const openAIFunctions = require('../engines/llm/openai/openAIFunctions');

/*
CloudPilotMessage — how CloudPilot communicates with the user.

Single voice for General and Request Conversation.
Today: general stub + request templates. Tomorrow: engine, hybrid, formatting.
*/

//Function A1: General Conversation speak
async function speakGeneral(context) {
    const currentUserMessage = context.currentUserMessage || '';
    // const openAIResult = await openAIFunctions.sendGeneralChat(currentUserMessage);
    const openAIResult = {
        success: true,
        data: 'Open AI will respond when Live'
    };

    if (!openAIResult.success) {
        return formatOutgoing({
            success: false,
            cloudPilotMessage: '',
            chatType: CHAT_TYPE.GENERAL_CHAT_RESPONDING,
            atlasResponse: null,
            error: openAIResult.message || 'general_chat_failed'
        });
    }

    const cloudPilotMessage = openAIResult.data ? String(openAIResult.data).trim() : '';

    return formatOutgoing({
        success: Boolean(cloudPilotMessage),
        cloudPilotMessage: cloudPilotMessage,
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
