const OpenAIClient = require('../../../../providers/openAI/client/openAIClient');
const { buildAIContext } = require('../../../context/buildContext');
const { buildAISystemMessage } = require('../../../context/buildSystemMessage');
const { CHAT_CONFIG } = require('../../../../config/chatGPTconfig');
const { CLOUDPILOT_AI_CONFIG } = require('../../../../config/cloudPilotAIConfig');

/*
FUNCTIONS A: Open requests Question search
    1) Function A1: shouldRunOpenRequestsSearch
    2) Function A2: searchForOpenRequests
    3) Function A3: searchForOpenRequestsInternal
    4) Function A4: searchForOpenRequestsOpenAI

HELPERS
    1) Helper H1: parseOpenAIOpenRequestsResponse
    2) Helper H2: buildOpenRequestsOpenAIMessages

Public entry — shouldRun + Internal | OpenAI.
Returns { question: 'open_requests' } or {}.
CloudPilot owns loading request rows and answering.
*/

//HELPERS
//Helper H1: Parse OpenAI classify response
function parseOpenAIOpenRequestsResponse(raw) {
    if (raw === undefined || raw === null) {
        return false;
    }

    let text = String(raw).trim();
    if (!text) {
        return false;
    }

    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) {
        text = fenced[1].trim();
    }

    try {
        const parsed = JSON.parse(text);
        if (
            parsed &&
            (parsed.open_requests === true || parsed.question === 'open_requests')
        ) {
            return true;
        }
        return false;
    } catch (err) {
        return false;
    }
}

//Helper H2: Build messages for open-requests classify
function buildOpenRequestsOpenAIMessages(message) {
    const processMessageContext = {
        currentUserMessage: String(message || '')
    };

    const aiContext = buildAIContext(processMessageContext, {
        situationTypes: ['open_requests'],
        includeKnowledge: false
    });

    const systemMessage = buildAISystemMessage(aiContext);
    const messages = [
        { role: 'system', content: systemMessage },
        {
            role: 'user',
            content:
                'Follow the SITUATION instructions.\n\n' +
                'Return JSON only:\n\n' +
                '{"open_requests":true}\n\n' +
                'or:\n\n' +
                '{}'
        }
    ];

    return {
        systemMessage: systemMessage,
        messages: messages,
        aiContext: aiContext
    };
}

//FUNCTIONS A: Open requests Question search
//Function A1: Cheap gate — skip unrelated messages
function shouldRunOpenRequestsSearch(message) {
    const text = String(message || '').toLowerCase();

    if (!text.trim()) {
        return false;
    }

    return /open request|open action|waiting on|what am i waiting|list (my )?open|show (my )?open/.test(
        text
    );
}

//Function A2: Select how CloudPilot searches the message for open-requests Question
async function searchForOpenRequests(message) {
    const userMessage = String(message || '');

    //STEP 1: Should I run?
    if (!shouldRunOpenRequestsSearch(userMessage)) {
        return {};
    }

    //STEP 2: How should I run? (Internal or OpenAI via config)
    const openaiRequested = CLOUDPILOT_AI_CONFIG.openRequestsSearch === 'openai';
    const masterDisabled = !CLOUDPILOT_AI_CONFIG.aiEnabled;
    const useOpenAI = openaiRequested && !masterDisabled;

    if (useOpenAI) {
        const openAIOutcome = await searchForOpenRequestsOpenAI(userMessage);
        return openAIOutcome.result || {};
    }

    // Preview when openai requested but master off
    if (openaiRequested && masterDisabled) {
        const openAIRequest = buildOpenRequestsOpenAIMessages(userMessage);
        OpenAIClient.logOpenAI({
            capability: 'Open Requests Search',
            conversationHistoryEnabled: false,
            conversationHistoryCount: 0,
            context: OpenAIClient.summarizeAIContext(openAIRequest.aiContext),
            messages: openAIRequest.messages,
            previewOnly: true
        });
    }

    return searchForOpenRequestsInternal(userMessage);
}

//Function A3: Find open-requests Question using internal phrases
function searchForOpenRequestsInternal(message) {
    const text = String(message || '').toLowerCase().trim();

    if (!text) {
        return {};
    }

    const phrases = [
        'do i have any open requests',
        'do i have open requests',
        'what open requests do i have',
        'what open requests do i have?',
        'show open requests',
        'show my open requests',
        'list open requests',
        'list my open requests',
        'open requests',
        'my open requests',
        'show open actions',
        'show my open actions',
        'list open actions',
        'list my actions',
        'what am i waiting on',
        'what are my open actions',
        'open actions',
        'my open actions'
    ];

    for (let i = 0; i < phrases.length; i++) {
        if (text.includes(phrases[i])) {
            return { question: 'open_requests' };
        }
    }

    return {};
}

//Function A4: Find open-requests Question using OpenAI
// Returns { result, billing, openAIResponse, fallback } for the gateway log.
async function searchForOpenRequestsOpenAI(message) {
    try {
        const client = OpenAIClient.getOpenAIClient();

        if (!client) {
            return {
                result: searchForOpenRequestsInternal(message),
                billing: false,
                openAIResponse: null,
                fallback: 'no API key / client'
            };
        }

        const config = CHAT_CONFIG.LOW;
        const maxTokens = CLOUDPILOT_AI_CONFIG.openRequestsTokenLimit;
        const openAIRequest = buildOpenRequestsOpenAIMessages(message);

        const apiResult = await OpenAIClient.createOpenAiChatCompletion(client, {
            model: config.model,
            messages: openAIRequest.messages,
            max_tokens: maxTokens,
            temperature: 0,
            feature: 'open_requests_search'
        });

        const openAIResponse =
            apiResult.data !== undefined && apiResult.data !== null
                ? String(apiResult.data)
                : '';

        OpenAIClient.logOpenAI({
            capability: 'Open Requests Search',
            model: config.model,
            conversationHistoryEnabled: false,
            conversationHistoryCount: 0,
            context: OpenAIClient.summarizeAIContext(openAIRequest.aiContext),
            messages: openAIRequest.messages,
            previewOnly: false,
            responseText: apiResult.success
                ? openAIResponse
                : apiResult.message || apiResult.error || 'OpenAI request failed',
            usage: apiResult.success ? apiResult.usage : null
        });

        if (!apiResult.success) {
            return {
                result: searchForOpenRequestsInternal(message),
                billing: true,
                openAIResponse: openAIResponse,
                fallback: apiResult.message || apiResult.error || 'request failed'
            };
        }

        const hit = parseOpenAIOpenRequestsResponse(apiResult.data);

        return {
            result: hit ? { question: 'open_requests' } : {},
            billing: true,
            openAIResponse: openAIResponse,
            fallback: null
        };
    } catch (error) {
        return {
            result: searchForOpenRequestsInternal(message),
            billing: false,
            openAIResponse: null,
            fallback: error && error.message ? error.message : String(error)
        };
    }
}

module.exports = {
    shouldRunOpenRequestsSearch,
    searchForOpenRequests,
    searchForOpenRequestsInternal,
    searchForOpenRequestsOpenAI
};
