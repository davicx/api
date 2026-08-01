const { CHAT_TYPE } = require('../requests/decisionTypes');
const RequestTemplates = require('./templates/requestTemplates');
const openAIFunctions = require('../../providers/openAI/client/openAIClient');
const { CLOUDPILOT_AI_CONFIG } = require('../../config/cloudPilotAIConfig');
const { buildAIContext } = require('../../cloudPilotIntelligence/context/buildContext');
const { buildAISystemMessage } = require('../../cloudPilotIntelligence/context/buildSystemMessage');
const ConversationHistoryContext = require('../../cloudPilotIntelligence/context/classes/ConversationHistoryContext');

/*
CloudPilotMessage — how CloudPilot communicates with the user.

Single voice for General and Request Conversation.
General: AI context → system message → history log → OpenAI payload log → optional OpenAI.
Request: templates.
*/

const GENERAL_CHAT_STUB_MESSAGE = 'Open AI will respond when Live';

//Function A1: General Conversation speak
async function speakGeneral(processMessageContext) {
    const context = processMessageContext || {};
    const currentUserMessage = context.currentUserMessage || '';
    const conversationID = context.conversationID;
    const aiContext = buildAIContext(context);
    const systemMessage = buildAISystemMessage(aiContext);
    const useOpenAIMessageResponse =
        CLOUDPILOT_AI_CONFIG.aiEnabled &&
        CLOUDPILOT_AI_CONFIG.messageResponse === 'openai';

    //STEP 7a: AI Context
    console.log('______________________________________________________________');
    console.log('STEP 7a: AI Context');
    console.log(JSON.stringify(aiContext, null, 2));
    console.log('organization knowledge: not used (empty)');
    console.log('cloudPilotAIConfig:', CLOUDPILOT_AI_CONFIG);
    console.log('______________________________________________________________');
    console.log(' ');

    //STEP 7b: OpenAI System Message (optional)
    if (CLOUDPILOT_AI_CONFIG.messageLogs) {
        console.log('______________________________________________________________');
        console.log('STEP 7b: OpenAI System Message');
        console.log(systemMessage || '(empty system message)');
        console.log('______________________________________________________________');
        console.log(' ');
    }

    //STEP 7c: Conversation History — human-readable names (not sent as this text)
    const historyLimit = CLOUDPILOT_AI_CONFIG.conversationHistoryLimit;
    let conversationHistory = [];

    if (CLOUDPILOT_AI_CONFIG.sendConversationHistory && conversationID) {
        const historyContext = new ConversationHistoryContext(conversationID, {
            currentUserMessage: currentUserMessage
        });
        conversationHistory = await historyContext.getMessages(historyLimit);
        logConversationHistory(conversationHistory, historyLimit);
    }

    const openAiMessages = buildOpenAiMessagesPayload(
        systemMessage,
        conversationHistory,
        currentUserMessage
    );

    // Always show structured payload (roles) — separate from STEP 7c human log
    logOpenAiMessagePayload(openAiMessages);

    let openAIResult;

    if (useOpenAIMessageResponse) {
        //STEP 7d: Send OpenAI Request
        console.log('STEP 7d: Send OpenAI Request');

        if (CLOUDPILOT_AI_CONFIG.messageLogs) {
            console.log(JSON.stringify({ messages: openAiMessages }, null, 2));
        }

        openAIResult = await openAIFunctions.sendGeneralChat({
            systemMessage: systemMessage,
            conversationHistory: conversationHistory,
            userMessage: currentUserMessage
        });
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

// Structured API messages: system + prior turns (roles only) + current user
function buildOpenAiMessagesPayload(systemMessage, conversationHistory, currentUserMessage) {
    const messages = [];

    if (systemMessage) {
        messages.push({
            role: 'system',
            content: systemMessage
        });
    }

    for (let i = 0; i < conversationHistory.length; i++) {
        const item = conversationHistory[i];
        messages.push({
            role: item.role,
            content: item.content
        });
    }

    if (currentUserMessage) {
        messages.push({
            role: 'user',
            content: currentUserMessage
        });
    }

    return messages;
}

function logConversationHistory(conversationHistory, historyLimit) {
    console.log('______________________________________________________________');
    console.log(
        'STEP 7c: Conversation History (last ' + historyLimit + ' messages)'
    );

    if (!conversationHistory.length) {
        console.log('(none)');
    } else {
        for (let i = 0; i < conversationHistory.length; i++) {
            const item = conversationHistory[i];
            const label = item.speakerName || (item.role === 'assistant' ? 'CloudPilot' : 'Current User');
            console.log(label + ':');
            console.log('"' + item.content + '"');
            console.log(' ');
        }
    }

    console.log('______________________________________________________________');
    console.log(' ');
}

function logOpenAiMessagePayload(openAiMessages) {
    console.log('______________________________________________________________');
    console.log('OPEN AI MESSAGE: (structured payload for the API)');
    console.log(JSON.stringify(openAiMessages, null, 2));
    console.log('______________________________________________________________');
    console.log(' ');
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
