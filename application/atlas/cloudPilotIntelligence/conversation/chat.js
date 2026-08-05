const openAIFunctions = require('../../providers/openAI/client/openAIClient');
const { CLOUDPILOT_AI_CONFIG } = require('../../config/cloudPilotAIConfig');
const { buildAIContext } = require('../context/buildContext');
const { buildAISystemMessage } = require('../context/buildSystemMessage');
const ConversationHistoryContext = require('../context/classes/ConversationHistoryContext');

/*
CloudPilot Intelligence — Conversation chat()

GenAI conversation front door. Builds context, history, and Internal stub vs OpenAI.
CloudPilotMessage.speakGeneral calls this, then formats the outgoing product message.
*/

const CHAT_STUB_MESSAGE = 'Open AI will respond when Live';

//Function A1: Run GenAI conversation for a processMessage context
async function chat(processMessageContext) {
    const context = processMessageContext || {};
    const currentUserMessage = context.currentUserMessage || '';
    const conversationID = context.conversationID;
    const aiContext = buildAIContext(context);
    const systemMessage = buildAISystemMessage(aiContext);
    const useOpenAIMessageResponse =
        CLOUDPILOT_AI_CONFIG.aiEnabled &&
        CLOUDPILOT_AI_CONFIG.messageResponse === 'openai';

    //STEP 1: Verbose AI context (CLOUDPILOT_MESSAGE_LOGS)
    if (CLOUDPILOT_AI_CONFIG.messageLogs) {
        console.log('______________________________________________________________');
        console.log('STEP 7a: AI Context');
        console.log(JSON.stringify(aiContext, null, 2));
        console.log('organization knowledge: not used (empty)');
        console.log('cloudPilotAIConfig:', CLOUDPILOT_AI_CONFIG);
        console.log('______________________________________________________________');
        console.log(' ');
    }

    //STEP 2: Verbose system message
    if (CLOUDPILOT_AI_CONFIG.messageLogs) {
        console.log('______________________________________________________________');
        console.log('STEP 7b: OpenAI System Message');
        console.log(systemMessage || '(empty system message)');
        console.log('______________________________________________________________');
        console.log(' ');
    }

    //STEP 3: Conversation history
    const historyLimit = CLOUDPILOT_AI_CONFIG.conversationHistoryLimit;
    let conversationHistory = [];
    const historyEnabled =
        CLOUDPILOT_AI_CONFIG.sendConversationHistory && Boolean(conversationID);

    if (historyEnabled) {
        const historyContext = new ConversationHistoryContext(conversationID, {
            currentUserMessage: currentUserMessage
        });
        conversationHistory = await historyContext.getMessages(historyLimit);

        if (CLOUDPILOT_AI_CONFIG.messageLogs) {
            logConversationHistory(conversationHistory, historyLimit);
        }
    }

    const openAiMessages = buildOpenAiMessagesPayload(
        systemMessage,
        conversationHistory,
        currentUserMessage
    );
    const contextSummary = openAIFunctions.summarizeAIContext(aiContext);

    //STEP 4: Preview OpenAI block when AI disabled
    if (!useOpenAIMessageResponse) {
        openAIFunctions.logOpenAI({
            capability: 'General Chat',
            conversationHistoryEnabled: historyEnabled,
            conversationHistoryCount: conversationHistory.length,
            context: contextSummary,
            messages: openAiMessages,
            previewOnly: true
        });
    }

    //STEP 5: Live OpenAI or Internal stub
    let openAIResult;

    if (useOpenAIMessageResponse) {
        if (CLOUDPILOT_AI_CONFIG.messageLogs) {
            console.log('STEP 7d: Send OpenAI Request');
            console.log(JSON.stringify({ messages: openAiMessages }, null, 2));
        }

        openAIResult = await openAIFunctions.sendGeneralChat({
            systemMessage: systemMessage,
            conversationHistory: conversationHistory,
            userMessage: currentUserMessage,
            capability: 'General Chat',
            conversationHistoryEnabled: historyEnabled,
            context: contextSummary
        });
    } else {
        openAIResult = {
            success: true,
            data: CHAT_STUB_MESSAGE
        };
    }

    if (!openAIResult.success) {
        return {
            success: false,
            message: '',
            error: openAIResult.message || 'general_chat_failed'
        };
    }

    const message = openAIResult.data ? String(openAIResult.data).trim() : '';

    return {
        success: Boolean(message),
        message: message,
        error: null
    };
}

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

module.exports = {
    chat
};
