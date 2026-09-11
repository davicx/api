const actionMap = require('../../../cloudPilot/masterCloudPilotCapabilities');
const SearchLogs = require('./helpers/searchLogs');
const OpenAIClient = require('../../../providers/openAI/client/openAIClient');
const { buildAIContext } = require('../../context/buildContext');
const { buildAISystemMessage } = require('../../context/buildSystemMessage');
const { CHAT_CONFIG } = require('../../../config/chatGPTconfig');
const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');
const {
    getActionSearchContext
} = require('../../context/operationContext/getActionSearchContext');

/*
FUNCTIONS A: Action detection from user message
    1) Function A1: searchMessageForAction
    2) Function A2: searchMessageForActionInternal
    3) Function A3: searchMessageForActionOpenAI

ONE operation context → same object to Internal and OpenAI.
buildActionOpenAIMessages = OpenAI adapter only (not the context).

Actions = do something (scan_ec2, toggle_ec2, …).
AI spend is a Question (searchForAiSpend via searchMessageForQuestion) — not an action.
Internal rules are the fast path. OpenAI is an optional fallback for natural
phrasing and may return only an action that exists in actionMap.
*/

//Function A1: Select Internal rules or optional OpenAI fallback
async function searchMessageForAction(message) {
    //STEP 1: One operation context for every provider
    const actionSearchContext = getActionSearchContext(message);

    const internalOutcome = searchMessageForActionInternal(actionSearchContext);
    const hasInternalAction =
        internalOutcome.ambiguous ||
        (internalOutcome.action && internalOutcome.action !== 'general_chat');
    const openaiRequested = CLOUDPILOT_AI_CONFIG.actionSearch === 'openai';
    const useOpenAI = openaiRequested && CLOUDPILOT_AI_CONFIG.aiEnabled;

    let outcome = internalOutcome;
    let method = 'Internal';

    // Deterministic matches always win; OpenAI handles only unknown phrasing.
    if (!hasInternalAction && useOpenAI) {
        const openAIOutcome = await searchMessageForActionOpenAI(actionSearchContext);
        outcome = openAIOutcome.result || internalOutcome;
        method = openAIOutcome.fallback ? 'Internal' : 'OpenAI';
    } else if (!hasInternalAction && openaiRequested && !CLOUDPILOT_AI_CONFIG.aiEnabled) {
        const request = buildActionOpenAIMessages(actionSearchContext);
        OpenAIClient.logOpenAI({
            capability: 'Action Search',
            conversationHistoryEnabled: false,
            conversationHistoryCount: 0,
            context: OpenAIClient.summarizeAIContext(request.aiContext),
            messages: request.messages,
            previewOnly: true
        });
    }

    SearchLogs.recordSearch({
        name: 'Action',
        method: method,
        result: formatActionSearchResult(outcome)
    });

    return outcome;
}

//Function A2: Internal — receives same ActionSearchContext as OpenAI
function searchMessageForActionInternal(context) {
    const normalizedMessage = String(
        context && context.userMessage ? context.userMessage : ''
    )
        .toLowerCase()
        .trim();
    const matches = [];

    for (const action of Object.values(actionMap)) {
        if (typeof action.match === 'function' && action.match(normalizedMessage)) {
            matches.push(action.type);
        }
    }

    let outcome;

    if (matches.length > 1) {
        outcome = {
            action: null,
            ambiguous: true,
            candidates: matches.slice(),
            source: 'rules',
            confidence: 1.0
        };
    } else if (matches.length === 1) {
        outcome = {
            action: matches[0],
            ambiguous: false,
            candidates: [],
            source: 'rules',
            confidence: 1.0
        };
    } else {
        outcome = {
            action: 'general_chat',
            ambiguous: false,
            candidates: [],
            source: 'rules',
            confidence: 1.0
        };
    }

    return outcome;
}

//Function A3: OpenAI — receives same ActionSearchContext as Internal
async function searchMessageForActionOpenAI(context) {
    try {
        const client = OpenAIClient.getOpenAIClient();

        if (!client) {
            return {
                result: searchMessageForActionInternal(context),
                billing: false,
                openAIResponse: null,
                fallback: 'no API key / client'
            };
        }

        const config = CHAT_CONFIG.LOW;
        const request = buildActionOpenAIMessages(context);
        const apiResult = await OpenAIClient.createOpenAiChatCompletion(client, {
            model: config.model,
            messages: request.messages,
            max_tokens: CLOUDPILOT_AI_CONFIG.actionTokenLimit,
            temperature: 0,
            feature: 'action_search'
        });
        const responseText =
            apiResult.data !== undefined && apiResult.data !== null
                ? String(apiResult.data)
                : '';

        OpenAIClient.logOpenAI({
            capability: 'Action Search',
            model: config.model,
            conversationHistoryEnabled: false,
            conversationHistoryCount: 0,
            context: OpenAIClient.summarizeAIContext(request.aiContext),
            messages: request.messages,
            previewOnly: false,
            responseText: apiResult.success
                ? responseText
                : apiResult.message || apiResult.error || 'OpenAI request failed',
            usage: apiResult.success ? apiResult.usage : null
        });

        if (!apiResult.success) {
            return {
                result: searchMessageForActionInternal(context),
                billing: true,
                openAIResponse: responseText,
                fallback: apiResult.message || apiResult.error || 'request failed'
            };
        }

        return {
            result: parseOpenAIActionResponse(responseText),
            billing: true,
            openAIResponse: responseText,
            fallback: null
        };
    } catch (error) {
        return {
            result: searchMessageForActionInternal(context),
            billing: false,
            openAIResponse: null,
            fallback: error && error.message ? error.message : String(error)
        };
    }
}

//Helper: OpenAI adapter — format ActionSearchContext into OpenAI messages
// Keeps prior message shape (system via Current Question; user = catalog + rules).
function buildActionOpenAIMessages(context) {
    const searchContext = context && typeof context === 'object' ? context : {};
    const userMessage = String(searchContext.userMessage || '');
    const task = searchContext.task || {};
    const catalog = Array.isArray(task.catalog) ? task.catalog : [];

    const processMessageContext = {
        currentUserMessage: userMessage
    };
    const aiContext = buildAIContext(processMessageContext, {
        includeKnowledge: false,
        includeIdentity: false,
        includeCurrentState: false
    });
    const systemMessage = buildAISystemMessage(aiContext);

    return {
        aiContext: aiContext,
        messages: [
            { role: 'system', content: systemMessage },
            {
                role: 'user',
                content:
                    'Classify the current user message using only this approved action catalog:\n' +
                    JSON.stringify(catalog, null, 2) +
                    '\n\nRules:\n' +
                    '- Return an action when the user wants CloudPilot to run that capability.\n' +
                    '- A question about the user’s current AWS resources requires a read capability.\n' +
                    '- General knowledge questions such as "what is an EC2 instance?" are not actions.\n' +
                    '- Never answer the question and never invent AWS facts.\n' +
                    '- Return JSON only: {"action":"scan_ec2"} or {}.'
            }
        ]
    };
}

function parseOpenAIActionResponse(raw) {
    let text = String(raw || '').trim();
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);

    if (fenced && fenced[1]) {
        text = fenced[1].trim();
    }

    try {
        const parsed = JSON.parse(text);
        const action = parsed && parsed.action ? String(parsed.action).trim() : '';
        const definition = actionMap[action];

        if (!definition || typeof definition !== 'object' || action === 'general_chat') {
            return buildNoActionOutcome('openai');
        }

        return {
            action: action,
            ambiguous: false,
            candidates: [],
            source: 'openai',
            confidence: 0.8
        };
    } catch (error) {
        return buildNoActionOutcome('openai');
    }
}

function buildNoActionOutcome(source) {
    return {
        action: 'general_chat',
        ambiguous: false,
        candidates: [],
        source: source,
        confidence: 1.0
    };
}

function formatActionSearchResult(outcome) {
    if (!outcome) {
        return null;
    }

    if (outcome.ambiguous) {
        return 'ambiguous: ' + (outcome.candidates || []).join(', ');
    }

    const actionType = outcome.action;

    if (!actionType || actionType === 'general_chat') {
        return 'general_chat';
    }

    const definition = actionMap[actionType];

    if (definition && definition.actionLabel) {
        return definition.actionLabel;
    }

    return actionType;
}

module.exports = {
    searchMessageForAction,
    searchMessageForActionInternal,
    searchMessageForActionOpenAI,
    parseOpenAIActionResponse
};
