const OpenAIClient = require('../../../../providers/openAI/client/openAIClient');
const { CHAT_CONFIG } = require('../../../../config/chatGPTconfig');
const { CLOUDPILOT_AI_CONFIG } = require('../../../../config/cloudPilotAIConfig');
const SearchLogs = require('../helpers/searchLogs');
const {
    getAiSpendSearchContext
} = require('../../../context/operationContext/getAiSpendSearchContext');

/*
FUNCTIONS A: AI spend search
    1) Function A1: shouldRunAiSpendSearch
    2) Function A2: searchForAiSpend
    3) Function A3: searchForAiSpendInternal
    4) Function A4: searchForAiSpendOpenAI

HELPERS
    1) Helper H1: parseOpenAIAiSpendResponse
    2) Helper H2: buildAiSpendOpenAIMessages

ONE operation context → same object to Internal and OpenAI.
buildAiSpendOpenAIMessages = OpenAI adapter only (not the context).
Returns { question: 'ai_spend' } or {}.
*/

//HELPERS
//Helper H1: Parse OpenAI classify response
function parseOpenAIAiSpendResponse(raw) {
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
        if (parsed && (parsed.ai_spend === true || parsed.question === 'ai_spend')) {
            return true;
        }
        return false;
    } catch (err) {
        return false;
    }
}

//Helper H2: OpenAI adapter — format AiSpendSearchContext into OpenAI messages
function buildAiSpendOpenAIMessages(context) {
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

//FUNCTIONS A: AI spend search
//Function A1: Cheap gate — skip unrelated messages
function shouldRunAiSpendSearch(message) {
    const text = String(message || '').toLowerCase();

    if (!text.trim()) {
        return false;
    }

    return /spend|cost|usage|openai|open ai|how much/.test(text);
}

//Function A2: Select how CloudPilot searches the message for AI spend
async function searchForAiSpend(message) {
    const userMessage = String(message || '');

    //STEP 1: Should I run?
    if (!shouldRunAiSpendSearch(userMessage)) {
        SearchLogs.recordSearch({
            name: 'AI Spend',
            method: 'Skipped',
            result: null
        });
        return {};
    }

    //STEP 2: One operation context for every provider
    const aiSpendSearchContext = getAiSpendSearchContext(message);

    //STEP 3: How should I run? (Internal or OpenAI via config)
    const openaiRequested = CLOUDPILOT_AI_CONFIG.aiSpendSearch === 'openai';
    const masterDisabled = !CLOUDPILOT_AI_CONFIG.aiEnabled;
    const useOpenAI = openaiRequested && !masterDisabled;

    let result;

    if (useOpenAI) {
        const openAIOutcome = await searchForAiSpendOpenAI(aiSpendSearchContext);
        result = openAIOutcome.result || {};
        SearchLogs.recordSearch({
            name: 'AI Spend',
            method: openAIOutcome.fallback ? 'Internal' : 'OpenAI',
            result: result.question || null
        });
        return result;
    }

    // Preview when openai requested but master off
    if (openaiRequested && masterDisabled) {
        const openAIRequest = buildAiSpendOpenAIMessages(aiSpendSearchContext);
        OpenAIClient.logOpenAI({
            capability: 'AI Spend Search',
            conversationHistoryEnabled: false,
            conversationHistoryCount: 0,
            context: openAIRequest.contextSummary,
            messages: openAIRequest.messages,
            previewOnly: true
        });
    }

    result = searchForAiSpendInternal(aiSpendSearchContext);
    SearchLogs.recordSearch({
        name: 'AI Spend',
        method: 'Internal',
        result: result.question || null
    });
    return result;
}

//Function A3: Internal — receives same AiSpendSearchContext as OpenAI
function searchForAiSpendInternal(context) {
    const text = String(
        context && context.userMessage ? context.userMessage : ''
    )
        .toLowerCase()
        .trim();

    if (!text) {
        return {};
    }

    const phrases = [
        'openai spend',
        'openai cost',
        'openai usage',
        'open ai spend',
        'open ai cost',
        'ai spend',
        'ai usage',
        'ai cost',
        'how much have i spent on openai',
        'how much have i spent on ai',
        'how much did i spend on openai',
        'how much did i spend on ai',
        'show my openai',
        'show openai',
        'what is my openai',
        "what's my openai",
        'whats my openai',
        'what is my ai spend',
        "what's my ai spend",
        'whats my ai spend'
    ];

    for (let i = 0; i < phrases.length; i++) {
        if (text.includes(phrases[i])) {
            return { question: 'ai_spend' };
        }
    }

    return {};
}

//Function A4: OpenAI — receives same AiSpendSearchContext as Internal
async function searchForAiSpendOpenAI(context) {
    try {
        const client = OpenAIClient.getOpenAIClient();

        if (!client) {
            return {
                result: searchForAiSpendInternal(context),
                billing: false,
                openAIResponse: null,
                fallback: 'no API key / client'
            };
        }

        const config = CHAT_CONFIG.LOW;
        const maxTokens = CLOUDPILOT_AI_CONFIG.aiSpendTokenLimit;
        const openAIRequest = buildAiSpendOpenAIMessages(context);

        const apiResult = await OpenAIClient.createOpenAiChatCompletion(client, {
            model: config.model,
            messages: openAIRequest.messages,
            max_tokens: maxTokens,
            temperature: 0,
            feature: 'ai_spend_search'
        });

        const openAIResponse =
            apiResult.data !== undefined && apiResult.data !== null
                ? String(apiResult.data)
                : '';

        OpenAIClient.logOpenAI({
            capability: 'AI Spend Search',
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
                result: searchForAiSpendInternal(context),
                billing: true,
                openAIResponse: openAIResponse,
                fallback: apiResult.message || apiResult.error || 'request failed'
            };
        }

        const hit = parseOpenAIAiSpendResponse(apiResult.data);

        return {
            result: hit ? { question: 'ai_spend' } : {},
            billing: true,
            openAIResponse: openAIResponse,
            fallback: null
        };
    } catch (error) {
        return {
            result: searchForAiSpendInternal(context),
            billing: false,
            openAIResponse: null,
            fallback: error && error.message ? error.message : String(error)
        };
    }
}

module.exports = {
    shouldRunAiSpendSearch,
    searchForAiSpend,
    searchForAiSpendInternal,
    searchForAiSpendOpenAI,
    buildAiSpendOpenAIMessages
};
