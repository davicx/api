const { CHAT_TYPE } = require('../decision/decisionTypes');
const RequestTemplates = require('./templates/requestTemplates');
const openAIFunctions = require('../engines/llm/openai/openAIFunctions');
const { buildGeneralConversationContext } = require('../context/buildGeneralConversationContext');
const { buildSystemPrompt } = require('../context/buildSystemPrompt');

/*
CloudPilotMessage — how CloudPilot communicates with the user.

Single voice for General and Request Conversation.
General: context build → log → optional OpenAI. Request: templates.
*/

const GENERAL_CHAT_STUB_MESSAGE = 'Open AI will respond when Live';

function isOpenAiEnhancedRepliesEnabled() {
    return process.env.OPENAI_ENHANCED_REPLIES === 'true';
}

function logGeneralConversationContext(contextLog) {
    console.log('______________________________________________________________');
    console.log('STEP 7a: Build General Conversation Context');
    console.log(JSON.stringify(contextLog, null, 2));
    console.log('______________________________________________________________');
    console.log(' ');
}

//Function A1: General Conversation speak
async function speakGeneral(context) {
    const currentUserMessage = context.currentUserMessage || '';
    const builtContext = buildGeneralConversationContext({
        userMessage: currentUserMessage
    });

    const aiEnabled = isOpenAiEnhancedRepliesEnabled();

    logGeneralConversationContext({
        ...builtContext.log,
        aiEnabled: aiEnabled
    });

    let openAIResult;

    if (aiEnabled) {
        const systemPrompt = buildSystemPrompt(builtContext);
        openAIResult = await openAIFunctions.sendGeneralChat(currentUserMessage, systemPrompt);
    } else {
        openAIResult = {
            success: true,
            data: GENERAL_CHAT_STUB_MESSAGE
        };
    }

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
