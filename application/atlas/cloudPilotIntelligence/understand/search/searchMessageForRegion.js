const OpenAIClient = require('../../../providers/openAI/client/openAIClient');
const { buildAIContext } = require('../../context/buildContext');
const { buildAISystemMessage } = require('../../context/buildSystemMessage');
const { CHAT_CONFIG } = require('../../../config/chatGPTconfig');
const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');

/*
FUNCTIONS A: Region search
    1) Function A1: shouldRunRegionSearch
    2) Function A2: searchMessageForRegion
    3) Function A3: searchMessageForRegionInternal
    4) Function A4: searchMessageForRegionOpenAI

HELPERS
    1) Helper H1: parseOpenAIRegionResponse
    2) Helper H2: formatRegionFound
    3) Helper H3: logRegionSearch
*/

//HELPERS
//Helper H2: Format final region for logs
function formatRegionFound(result) {
    if (result && result.region) {
        return String(result.region);
    }

    return 'none';
}

//Helper H3: Compact REGION SEARCH story (gated by CLOUDPILOT_REGION_LOGS)
function logRegionSearch(details) {
    if (!CLOUDPILOT_AI_CONFIG.regionLogs) {
        return;
    }

    console.log('==================================================');
    console.log('REGION SEARCH');
    console.log('==================================================');
    console.log('Region Search: ' + details.mode);

    if (details.mode === 'SKIPPED') {
        console.log('Reason: request is not actively collecting a region');
    }

    if (details.openaiRequested && details.masterDisabled) {
        console.log('OpenAI Requested: YES');
        console.log('OpenAI Disabled By Master: YES');
    }

    if (details.billing) {
        console.log('OpenAI Billing: YES');
    }

    if (details.fallback) {
        console.log('OpenAI Failed — using INTERNAL: ' + details.fallback);
    }

    console.log('User Message: ' + details.userMessage);

    if (details.openAIResponse !== null && details.openAIResponse !== undefined) {
        console.log('OpenAI Response: ' + details.openAIResponse);
    }

    console.log('Region Found: ' + formatRegionFound(details.result));
    console.log('==================================================');
}

//Helper H1: Parse OpenAI text into a region string or null
function parseOpenAIRegionResponse(raw) {
    if (raw === undefined || raw === null) {
        return null;
    }

    let text = String(raw).trim();

    if (!text) {
        return null;
    }

    // Strip common markdown fences
    if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    try {
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return null;
        }

        if (parsed.region === undefined || parsed.region === null || parsed.region === '') {
            return null;
        }

        return String(parsed.region).trim();
    } catch (error) {
        return null;
    }
}

//FUNCTIONS A: Region search
//Function A1: Should Region Search run? (Stage 1: open request + region missing)
function shouldRunRegionSearch(requestState) {
    //STEP 1: No open request → skip
    if (!requestState || !requestState.pendingAction) {
        return false;
    }

    //STEP 2: Region already known / not being collected → skip
    if (!Array.isArray(requestState.missing) || requestState.missing.indexOf('region') === -1) {
        return false;
    }

    //STEP 3: Request is actively collecting a region → run
    return true;
}

//Function A2: Select how CloudPilot searches the message for a region
async function searchMessageForRegion(message, requestState) {
    const userMessage = String(message || '');

    //STEP 1: Should I run?
    if (!shouldRunRegionSearch(requestState)) {
        logRegionSearch({
            mode: 'SKIPPED',
            openaiRequested: CLOUDPILOT_AI_CONFIG.regionSearch === 'openai',
            masterDisabled: !CLOUDPILOT_AI_CONFIG.aiEnabled,
            billing: false,
            fallback: null,
            userMessage: userMessage,
            openAIResponse: null,
            result: {}
        });
        return {};
    }

    //STEP 2: How should I run? (Internal or OpenAI via config)
    const openaiRequested = CLOUDPILOT_AI_CONFIG.regionSearch === 'openai';
    const masterDisabled = !CLOUDPILOT_AI_CONFIG.aiEnabled;
    const useOpenAI = openaiRequested && !masterDisabled;

    let result;
    let mode = 'INTERNAL';
    let billing = false;
    let openAIResponse = null;
    let fallback = null;

    if (useOpenAI) {
        mode = 'OPENAI';
        const openAIOutcome = await searchMessageForRegionOpenAI(message);
        result = openAIOutcome.result;
        billing = openAIOutcome.billing;
        openAIResponse = openAIOutcome.openAIResponse;
        fallback = openAIOutcome.fallback;
    } else {
        result = searchMessageForRegionInternal(message);
    }

    logRegionSearch({
        mode: mode,
        openaiRequested: openaiRequested,
        masterDisabled: masterDisabled,
        billing: billing,
        fallback: fallback,
        userMessage: userMessage,
        openAIResponse: openAIResponse,
        result: result
    });

    return result;
}

//Function A3: Find an AWS region using internal regex logic
function searchMessageForRegionInternal(message) {
    const text = String(message || '');
    const match = text.match(/\b((?:us|eu|ap|sa|ca|me|af)-(?:gov-)?[a-z]+-\d)\b/i);

    if (!match) {
        return {};
    }

    return { region: String(match[1]).toLowerCase() };
}

//Function A4: Find an AWS region using OpenAI (+ shared context system)
// Returns { result, billing, openAIResponse, fallback } for the gateway log.
async function searchMessageForRegionOpenAI(message) {
    try {
        const client = OpenAIClient.getOpenAIClient();

        if (!client) {
            return {
                result: searchMessageForRegionInternal(message),
                billing: false,
                openAIResponse: null,
                fallback: 'no API key / client'
            };
        }

        const processMessageContext = {
            currentUserMessage: String(message || '')
        };

        const aiContext = buildAIContext(processMessageContext, {
            situationTypes: ['region'],
            includeKnowledge: false
        });

        const systemMessage = buildAISystemMessage(aiContext);
        const config = CHAT_CONFIG.LOW;
        const regionMaxTokens = CLOUDPILOT_AI_CONFIG.regionTokenLimit;

        const apiResult = await OpenAIClient.createOpenAiChatCompletion(client, {
            model: config.model,
            messages: [
                { role: 'system', content: systemMessage },
                {
                    role: 'user',
                    content:
                        'Follow the SITUATION instructions.\n\n' +
                        'Return JSON only:\n\n' +
                        '{"region":"us-west-2"}\n\n' +
                        'or:\n\n' +
                        '{}'
                }
            ],
            max_tokens: regionMaxTokens,
            temperature: 0,
            feature: 'region_search'
        });

        // API call returned — billable attempt completed
        const openAIResponse =
            apiResult.data !== undefined && apiResult.data !== null
                ? String(apiResult.data)
                : '';

        if (!apiResult.success) {
            return {
                result: searchMessageForRegionInternal(message),
                billing: true,
                openAIResponse: openAIResponse,
                fallback: apiResult.message || apiResult.error || 'request failed'
            };
        }

        const region = parseOpenAIRegionResponse(apiResult.data);

        if (!region) {
            return {
                result: {},
                billing: true,
                openAIResponse: openAIResponse,
                fallback: null
            };
        }

        return {
            result: {
                region: region.toLowerCase()
            },
            billing: true,
            openAIResponse: openAIResponse,
            fallback: null
        };
    } catch (error) {
        return {
            result: searchMessageForRegionInternal(message),
            billing: false,
            openAIResponse: null,
            fallback: error && error.message ? error.message : String(error)
        };
    }
}

module.exports = {
    shouldRunRegionSearch,
    searchMessageForRegion
};
