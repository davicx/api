const openAIFunctions = require('../../providers/openAI/client/openAIClient');
const { CLOUDPILOT_AI_CONFIG } = require('../../config/cloudPilotAIConfig');
const { buildAIContext } = require('../context/buildContext');
const { buildAISystemMessage } = require('../context/buildSystemMessage');
const ConversationHistoryContext = require('../context/classes/ConversationHistoryContext');
const SearchForOrganizationalKnowledgeFunctions = require('../understand/search/searchForOrganizationalKnowledge');
const OrganizationKnowledgeFunctions = require('../../cloudPilot/knowledge/organizationKnowledgeFunctions');

/*
CloudPilot Intelligence — generateGeneralMessageReply()

GenAI conversation front door. Builds context, history, and Internal stub vs OpenAI.
CloudPilotMessage.prepareGeneralMessageReply calls this, then formats the outgoing product message.

Org knowledge: search → DB resolve → Knowledge context (and Internal speak when OpenAI chat off).
*/

const CHAT_STUB_MESSAGE = 'Open AI will respond when Live';

//Function A1: Generate General Message Reply for a processMessage context
async function generateGeneralMessageReply(processMessageContext) {
    let context = processMessageContext || {};
    const currentUserMessage = context.currentUserMessage || '';
    const conversationID = context.conversationID;

    //STEP 0: Resolve organization knowledge for this turn (detect → DB → context block)
    context = await attachOrganizationKnowledgeToContext(context);

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
        console.log(
            'organization knowledge:',
            context.organizationKnowledge && context.organizationKnowledge.status
                ? context.organizationKnowledge.status
                : 'not used (empty)'
        );
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

    //STEP 2b: Internal grounded answer from org knowledge when MESSAGE_RESPONSE is Internal
    if (!useOpenAIMessageResponse) {
        const internalKnowledgeMessage = buildInternalOrganizationKnowledgeMessage(
            context.organizationKnowledge
        );

        if (internalKnowledgeMessage) {
            openAIFunctions.logOpenAI({
                capability: 'General Chat',
                conversationHistoryEnabled: false,
                conversationHistoryCount: 0,
                context: openAIFunctions.summarizeAIContext(aiContext),
                messages: buildOpenAiMessagesPayload(
                    systemMessage,
                    [],
                    currentUserMessage
                ),
                previewOnly: true
            });

            return {
                success: true,
                message: internalKnowledgeMessage,
                error: null
            };
        }
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

    //STEP 4: Preview OpenAI block when AI disabled / Internal message response
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

//Function A2: Search + load org knowledge onto process context (facts only)
async function attachOrganizationKnowledgeToContext(processMessageContext) {
    const context = processMessageContext || {};
    const currentUserMessage = context.currentUserMessage || '';

    try {
        const searchHit =
            await SearchForOrganizationalKnowledgeFunctions.searchForOrganizationalKnowledge(
                currentUserMessage,
                {
                    selectedFinding: context.selectedFinding || null
                }
            );

        if (!searchHit || !searchHit.resourceReference) {
            return context;
        }

        const loaded = await OrganizationKnowledgeFunctions.loadOrganizationKnowledgeForReference(
            context.masterSite || 'kite',
            searchHit.knowledgeType || 's3',
            searchHit.resourceReference
        );

        return Object.assign({}, context, {
            organizationKnowledge: loaded
        });
    } catch (err) {
        console.log('attachOrganizationKnowledgeToContext failed', err);
        return context;
    }
}

//Function A3: Deterministic speak from loaded org facts (Internal MESSAGE_RESPONSE)
function buildInternalOrganizationKnowledgeMessage(organizationKnowledge) {
    const loaded = organizationKnowledge || null;

    if (!loaded || typeof loaded !== 'object') {
        return '';
    }

    if (loaded.status === 'ambiguous') {
        const names = [];
        const records = Array.isArray(loaded.records) ? loaded.records : [];

        for (let i = 0; i < records.length; i++) {
            if (records[i] && records[i].resourceName) {
                names.push(records[i].resourceName);
            }
        }

        return (
            'I found more than one match for "' +
            String(loaded.resourceReference || '') +
            '". Which resource did you mean' +
            (names.length ? ': ' + names.join(', ') : '') +
            '?'
        );
    }

    if (loaded.status !== 'found' || !loaded.record) {
        return '';
    }

    const record = loaded.record;
    const lines = [];
    const title = record.displayName || record.resourceName;

    if (title) {
        lines.push(title);
        lines.push('');
    }

    if (record.purpose) {
        lines.push(record.purpose);
    }

    if (record.notes) {
        lines.push(record.notes);
    }

    if (record.importance) {
        lines.push('');
        lines.push('Importance: ' + record.importance + '.');
    }

    if (record.recommendedAction) {
        lines.push(record.recommendedAction);
    }

    return lines.join('\n').trim();
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
    generateGeneralMessageReply,
    attachOrganizationKnowledgeToContext,
    buildInternalOrganizationKnowledgeMessage
};
