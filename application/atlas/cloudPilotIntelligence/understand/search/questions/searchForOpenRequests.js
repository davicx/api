const OpenAIClient = require('../../../../providers/openAI/client/openAIClient');
const { CHAT_CONFIG } = require('../../../../config/chatGPTconfig');
const { CLOUDPILOT_AI_CONFIG } = require('../../../../config/cloudPilotAIConfig');
const SearchLogs = require('../helpers/searchLogs');
const {
    getOpenRequestsSearchContext
} = require('../../../context/operationContext/getOpenRequestsSearchContext');

/*
FUNCTIONS A: Open requests Question search
    1) Function A1: shouldRunOpenRequestsSearch
    2) Function A2: searchForOpenRequests
    3) Function A3: searchForOpenRequestsInternal
    4) Function A4: searchForOpenRequestsOpenAI

HELPERS
    1) Helper H1: parseOpenAIOpenRequestsResponse
    2) Helper H2: buildOpenRequestsOpenAIMessages

ONE operation context → same object to Internal and OpenAI.
buildOpenRequestsOpenAIMessages = OpenAI adapter only (not the context).
Returns { question: 'open_requests' } or {}.
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

//Helper H2: OpenAI adapter — format OpenRequestsSearchContext into OpenAI messages
function buildOpenRequestsOpenAIMessages(context) {
    const searchContext = context && typeof context === 'object' ? context : {};
    const userMessage = String(searchContext.userMessage || '');
    const task = searchContext.task || {};
    const purpose = String(task.purpose || '');
    const examples = Array.isArray(task.examples) ? task.examples : [];
    const outputFormat = String(task.outputFormat || '');

    const exampleLines = [];

    for (let i = 0; i < examples.length; i++) {
        const example = examples[i] || {};
        exampleLines.push('"' + String(example.input || '') + '"');
        exampleLines.push(String(example.output || ''));
        exampleLines.push('');
    }

    const systemMessage = [
        'TASK',
        '',
        purpose,
        '',
        'EXAMPLES',
        '',
        exampleLines.join('\n').trim(),
        '',
        outputFormat
    ].join('\n');

    const messages = [
        { role: 'system', content: systemMessage },
        {
            role: 'user',
            content: 'CURRENT MESSAGE\n\n"' + userMessage + '"\n\nReturn JSON only.'
        }
    ];

    return {
        systemMessage: systemMessage,
        messages: messages,
        contextSummary: OpenAIClient.summarizeSearchTaskContext()
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
        SearchLogs.recordSearch({
            name: 'Open Requests',
            method: 'Skipped',
            result: null
        });
        return {};
    }

    //STEP 2: One operation context for every provider
    const openRequestsSearchContext = getOpenRequestsSearchContext(message);

    //STEP 3: How should I run? (Internal or OpenAI via config)
    const openaiRequested = CLOUDPILOT_AI_CONFIG.openRequestsSearch === 'openai';
    const masterDisabled = !CLOUDPILOT_AI_CONFIG.aiEnabled;
    const useOpenAI = openaiRequested && !masterDisabled;

    let result;

    if (useOpenAI) {
        const openAIOutcome = await searchForOpenRequestsOpenAI(openRequestsSearchContext);
        result = openAIOutcome.result || {};
        SearchLogs.recordSearch({
            name: 'Open Requests',
            method: openAIOutcome.fallback ? 'Internal' : 'OpenAI',
            result: result.question || null
        });
        return result;
    }

    // Preview when openai requested but master off
    if (openaiRequested && masterDisabled) {
        const openAIRequest = buildOpenRequestsOpenAIMessages(openRequestsSearchContext);
        OpenAIClient.logOpenAI({
            capability: 'Open Requests Search',
            conversationHistoryEnabled: false,
            conversationHistoryCount: 0,
            context: openAIRequest.contextSummary,
            messages: openAIRequest.messages,
            previewOnly: true
        });
    }

    result = searchForOpenRequestsInternal(openRequestsSearchContext);
    SearchLogs.recordSearch({
        name: 'Open Requests',
        method: 'Internal',
        result: result.question || null
    });
    return result;
}

//Function A3: Internal — receives same OpenRequestsSearchContext as OpenAI
function searchForOpenRequestsInternal(context) {
    const text = String(
        context && context.userMessage ? context.userMessage : ''
    )
        .toLowerCase()
        .trim();

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

//Function A4: OpenAI — receives same OpenRequestsSearchContext as Internal
async function searchForOpenRequestsOpenAI(context) {
    try {
        const client = OpenAIClient.getOpenAIClient();

        if (!client) {
            return {
                result: searchForOpenRequestsInternal(context),
                billing: false,
                openAIResponse: null,
                fallback: 'no API key / client'
            };
        }

        const config = CHAT_CONFIG.LOW;
        const maxTokens = CLOUDPILOT_AI_CONFIG.openRequestsTokenLimit;
        const openAIRequest = buildOpenRequestsOpenAIMessages(context);

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
            context: openAIRequest.contextSummary,
            messages: openAIRequest.messages,
            previewOnly: false,
            responseText: apiResult.success
                ? openAIResponse
                : apiResult.message || apiResult.error || 'OpenAI request failed',
            usage: apiResult.success ? apiResult.usage : null
        });

        if (!apiResult.success) {
            return {
                result: searchForOpenRequestsInternal(context),
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
            result: searchForOpenRequestsInternal(context),
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
    searchForOpenRequestsOpenAI,
    buildOpenRequestsOpenAIMessages
};
