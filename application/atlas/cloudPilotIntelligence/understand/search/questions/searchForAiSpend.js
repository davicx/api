const OpenAIClient = require('../../../../providers/openAI/client/openAIClient');
const { CHAT_CONFIG } = require('../../../../config/chatGPTconfig');
const { CLOUDPILOT_AI_CONFIG } = require('../../../../config/cloudPilotAIConfig');
const SearchLogs = require('../helpers/searchLogs');

/*
FUNCTIONS A: AI spend search
    1) Function A1: shouldRunAiSpendSearch
    2) Function A2: searchForAiSpend
    3) Function A3: searchForAiSpendInternal
    4) Function A4: searchForAiSpendOpenAI

HELPERS
    1) Helper H1: parseOpenAIAiSpendResponse
    2) Helper H2: buildAiSpendOpenAIMessages

Public entry — shouldRun + Internal | OpenAI.
Returns { question: 'ai_spend' } or {}.
CloudPilot owns loading cloud_pilot_ai_usage and answering.

Search OpenAI = tiny TASK only (no Chat Identity / Knowledge / history).
Same family as Region / Open Requests Search.
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

//Helper H2: Build tiny AI Spend Search TASK messages
function buildAiSpendOpenAIMessages(message) {
    const userMessage = String(message || '');

    const systemMessage = [
        'TASK',
        '',
        'Determine whether the user is asking about CloudPilot AI / OpenAI',
        'usage or spend.',
        '',
        'Return a hit only when the user is clearly asking about AI or OpenAI',
        'spend, cost, or usage.',
        'Do not treat AWS billing or cloud infrastructure cost questions as AI spend.',
        'Classify only — do not invent dollar amounts or usage totals.',
        '',
        'EXAMPLES',
        '',
        '"how much have I spent on openai"',
        '{"ai_spend":true}',
        '',
        '"show my ai spend"',
        '{"ai_spend":true}',
        '',
        '"how much is my EC2 costing"',
        '{}',
        '',
        '"scan ec2"',
        '{}',
        '',
        'Return JSON only:',
        '{"ai_spend":true}',
        'or',
        '{}'
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

    //STEP 2: How should I run? (Internal or OpenAI via config)
    const openaiRequested = CLOUDPILOT_AI_CONFIG.aiSpendSearch === 'openai';
    const masterDisabled = !CLOUDPILOT_AI_CONFIG.aiEnabled;
    const useOpenAI = openaiRequested && !masterDisabled;

    let result;

    if (useOpenAI) {
        const openAIOutcome = await searchForAiSpendOpenAI(userMessage);
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
        const openAIRequest = buildAiSpendOpenAIMessages(userMessage);
        OpenAIClient.logOpenAI({
            capability: 'AI Spend Search',
            conversationHistoryEnabled: false,
            conversationHistoryCount: 0,
            context: openAIRequest.contextSummary,
            messages: openAIRequest.messages,
            previewOnly: true
        });
    }

    result = searchForAiSpendInternal(userMessage);
    SearchLogs.recordSearch({
        name: 'AI Spend',
        method: 'Internal',
        result: result.question || null
    });
    return result;
}

//Function A3: Find AI spend intent using internal phrases
function searchForAiSpendInternal(message) {
    const text = String(message || '').toLowerCase().trim();

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

//Function A4: Find AI spend intent using OpenAI (+ shared context system)
// Returns { result, billing, openAIResponse, fallback } for the gateway log.
async function searchForAiSpendOpenAI(message) {
    try {
        const client = OpenAIClient.getOpenAIClient();

        if (!client) {
            return {
                result: searchForAiSpendInternal(message),
                billing: false,
                openAIResponse: null,
                fallback: 'no API key / client'
            };
        }

        const config = CHAT_CONFIG.LOW;
        const maxTokens = CLOUDPILOT_AI_CONFIG.aiSpendTokenLimit;
        const openAIRequest = buildAiSpendOpenAIMessages(message);

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
                result: searchForAiSpendInternal(message),
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
            result: searchForAiSpendInternal(message),
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
