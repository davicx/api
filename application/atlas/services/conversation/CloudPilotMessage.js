const { CHAT_TYPE } = require('../decision/decisionTypes');
const RequestTemplates = require('./templates/requestTemplates');
const openAIFunctions = require('../engines/llm/openai/openAIFunctions');
const { OPENAI_CHAT_CONFIG } = require('../config/openAIChatConfig');
const { buildAIContext } = require('../context/buildAIContext');
const { buildAISystemMessage } = require('../context/buildAISystemMessage');

/*
CloudPilotMessage — how CloudPilot communicates with the user.

Single voice for General and Request Conversation.
General: AI context → system message → optional OpenAI. Request: templates.
*/

const GENERAL_CHAT_STUB_MESSAGE = 'Open AI will respond when Live';

//Function A1: General Conversation speak
async function speakGeneral(context) {
    const currentUserMessage = context.currentUserMessage || '';
    const aiContext = buildAIContext();
    const systemMessage = buildAISystemMessage(aiContext);

    //STEP 7a: AI Context
    console.log('______________________________________________________________');
    console.log('STEP 7a: AI Context');
    console.log(JSON.stringify(aiContext, null, 2));
    console.log('organization knowledge: not used (empty)');
    console.log('openAIChatConfig:', OPENAI_CHAT_CONFIG);
    console.log('______________________________________________________________');
    console.log(' ');

    //STEP 7b: OpenAI System Message (optional)
    if (OPENAI_CHAT_CONFIG.logPrompt) {
        console.log('______________________________________________________________');
        console.log('STEP 7b: OpenAI System Message');
        console.log(systemMessage || '(empty system message)');
        console.log('______________________________________________________________');
        console.log(' ');
    }

    let openAIResult;

    if (OPENAI_CHAT_CONFIG.enhancedReplies) {
        //STEP 7c: Send OpenAI Request
        console.log('STEP 7c: Send OpenAI Request');

        if (OPENAI_CHAT_CONFIG.logRequest) {
            console.log(
                JSON.stringify(
                    {
                        system: systemMessage,
                        conversation: [{ role: 'user', content: currentUserMessage }]
                    },
                    null,
                    2
                )
            );
        }

        openAIResult = await openAIFunctions.sendGeneralChat(currentUserMessage, systemMessage);
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
