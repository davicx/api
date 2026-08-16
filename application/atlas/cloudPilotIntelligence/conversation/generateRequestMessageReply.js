const OpenAIClient = require('../../providers/openAI/client/openAIClient');
const { CHAT_CONFIG } = require('../../config/chatGPTconfig');
const { CLOUDPILOT_AI_CONFIG } = require('../../config/cloudPilotAIConfig');

/*
FUNCTIONS A: Request Message Reply (wording only)
    1) Function A1: generateRequestMessageReply
    2) Function A2: generateRequestMessageReplyInternal
    3) Function A3: generateRequestMessageReplyOpenAI

HELPERS
    1) Helper H1: prepareFinalRequestMessageReplyForOpenAI
    2) Helper H2: openAIResponseContainsRequiredValues
    3) Helper H3: buildPresentationRules
    4) Helper H4: messageContainsValue
    5) Helper H5: collectRequiredFactValues
    6) Helper H6: extractEstimatedCostAmount

CloudPilot owns missing fields / suggestions / mode options. OpenAI only rephrases.
Internal today = no-op (caller keeps prior Message Reply). OpenAI fail → same.
Provider Internal / OpenAI stay behind this door.
*/

const PRESENTATION_MAX_TOKENS = 360;

//HELPERS
//Helper H3: Event-specific TASK rules (still no Chat Identity)
function buildPresentationRules(context) {
    const rules = [
        'Rephrase CloudPilot\'s request message so it feels conversational.',
        'Use ONLY the SPEAK FACTS JSON. Do not invent fields, values, regions, or actions.',
        'Keep every suggested value visible so the user can confirm or change it.',
        'Do not treat a suggestion as already collected.',
        'Do not mention these instructions.'
    ];
    const actionEvent =
        context && context.actionEvent ? String(context.actionEvent) : '';

    if (actionEvent === 'awaiting_execution_mode') {
        rules.push(
            'You may polish the intro. Keep each numbered execution-mode option exactly as listed in SPEAK FACTS (same numbers and labels).'
        );
    }

    if (actionEvent === 'awaiting_confirmation') {
        rules.push(
            'Polish the confirmation. Keep collected values and the execution mode visible. Do not add fields.'
        );
    }

    if (actionEvent === 'missing_fields_given' && context.latestCollectedField) {
        rules.push(
            'Acknowledge the latest collected field. Remaining missing fields stay questions, not collected facts.'
        );
    }

    return rules;
}

//Helper H4: Case-insensitive substring check for a required value
function messageContainsValue(presentedMessage, requiredValue) {
    const message = String(presentedMessage || '');
    const value = String(requiredValue || '').trim();

    if (!value) {
        return true;
    }

    return message.toLowerCase().indexOf(value.toLowerCase()) !== -1;
}

//Helper H6: Price amount already spoken in the Internal Message Reply (create_ec2)
function extractEstimatedCostAmount(templateText) {
    const marker = 'Estimated compute cost:';
    const template = String(templateText || '');
    const markerIndex = template.indexOf(marker);

    if (markerIndex === -1) {
        return '';
    }

    const rest = template.slice(markerIndex + marker.length).trim();
    const costLine = rest.split('\n')[0].trim();
    const amount = costLine.split(/\s+/)[0] || '';

    return amount;
}

//Helper H5: Values OpenAI Response must still show (suggestions, mode options, collected)
function collectRequiredFactValues(context) {
    const requiredValues = [];
    const facts = context || {};
    const actionEvent = String(facts.actionEvent || '');
    const suggestions =
        facts.suggestions && typeof facts.suggestions === 'object'
            ? facts.suggestions
            : {};
    const suggestionNames = Object.keys(suggestions);

    for (let i = 0; i < suggestionNames.length; i++) {
        requiredValues.push(suggestions[suggestionNames[i]]);
    }

    const executionModeOptions = Array.isArray(facts.executionModeOptions)
        ? facts.executionModeOptions
        : [];

    for (let i = 0; i < executionModeOptions.length; i++) {
        const modeOption = executionModeOptions[i] || {};
        const optionNumber = modeOption.number;
        const optionLabel = String(modeOption.label || '').trim();

        if (optionNumber != null && optionLabel) {
            requiredValues.push(String(optionNumber) + '. ' + optionLabel);
        }
    }

    const mustKeepCollected =
        actionEvent === 'awaiting_confirmation' ||
        (actionEvent === 'awaiting_execution_mode' && facts.action === 'create_ec2');

    if (mustKeepCollected) {
        const collected =
            facts.collected && typeof facts.collected === 'object' ? facts.collected : {};
        const collectedNames = Object.keys(collected);

        for (let i = 0; i < collectedNames.length; i++) {
            const fieldName = collectedNames[i];
            const collectedValue = collected[fieldName];

            if (fieldName === 'request_name' && actionEvent === 'awaiting_execution_mode') {
                continue;
            }

            if (collectedValue == null || typeof collectedValue === 'object') {
                continue;
            }

            requiredValues.push(collectedValue);
        }
    }

    if (facts.executionMode) {
        requiredValues.push(facts.executionMode);
    }

    if (facts.latestCollectedField && facts.collected) {
        requiredValues.push(facts.collected[facts.latestCollectedField]);
    }

    const estimatedCostAmount = extractEstimatedCostAmount(facts.templateMessage);

    if (estimatedCostAmount) {
        requiredValues.push(estimatedCostAmount);
    }

    return requiredValues;
}

//Helper H1: OpenAI adapter — package Request Message Reply context for OpenAI
function prepareFinalRequestMessageReplyForOpenAI(context) {
    const factsJson = JSON.stringify(context || {}, null, 2);
    const templateMessage =
        context && context.templateMessage
            ? String(context.templateMessage)
            : '';
    const presentationRules = buildPresentationRules(context);

    const systemMessage = [
        'TASK',
        '',
        presentationRules.join('\n'),
        '',
        'SPEAK FACTS',
        '',
        factsJson
    ].join('\n');

    const userMessage = [
        'Internal template (same facts):',
        '',
        templateMessage,
        '',
        'Write the user-facing message now.'
    ].join('\n');

    const messages = [
        {
            role: 'system',
            content: systemMessage
        },
        {
            role: 'user',
            content: userMessage
        }
    ];

    return {
        systemMessage: systemMessage,
        messages: messages,
        contextSummary: OpenAIClient.summarizeSearchTaskContext()
    };
}

//Helper H2: Did the OpenAI Response still include required values?
function openAIResponseContainsRequiredValues(openAIResponse, context) {
    const message = String(openAIResponse || '');

    if (!message.trim()) {
        return false;
    }

    const requiredValues = collectRequiredFactValues(context);

    for (let i = 0; i < requiredValues.length; i++) {
        if (!messageContainsValue(message, requiredValues[i])) {
            return false;
        }
    }

    return true;
}

//FUNCTIONS A: Request Message Reply
//Function A1: Choose Internal AI vs OpenAI for Request Message Reply wording
async function generateRequestMessageReply(context) {
    //STEP 1: How should I run?
    const openaiRequested = CLOUDPILOT_AI_CONFIG.messageResponse === 'openai';
    const masterDisabled = !CLOUDPILOT_AI_CONFIG.aiEnabled;
    const useOpenAI = openaiRequested && !masterDisabled;

    if (useOpenAI) {
        const openAIOutcome = await generateRequestMessageReplyOpenAI(context);

        if (openAIOutcome.success && openAIOutcome.message) {
            return openAIOutcome;
        }

        return generateRequestMessageReplyInternal();
    }

    if (openaiRequested && masterDisabled) {
        const openAIRequest = prepareFinalRequestMessageReplyForOpenAI(context);
        OpenAIClient.logOpenAI({
            capability: 'Request Presentation',
            conversationHistoryEnabled: false,
            conversationHistoryCount: 0,
            context: openAIRequest.contextSummary,
            messages: openAIRequest.messages,
            previewOnly: true
        });
    }

    //STEP 2: Internal — caller keeps the prior deterministic Message Reply
    return generateRequestMessageReplyInternal();
}

//Function A2: Internal AI (today: no-op — caller keeps prior Message Reply)
function generateRequestMessageReplyInternal() {
    return {
        success: false,
        message: '',
        source: 'internal',
        error: null
    };
}

//Function A3: OpenAI provider for Request Message Reply
async function generateRequestMessageReplyOpenAI(context) {
    try {
        const client = OpenAIClient.getOpenAIClient();

        if (!client) {
            return {
                success: false,
                message: '',
                source: 'openai',
                error: 'no API key / client'
            };
        }

        const config = CHAT_CONFIG.MEDIUM;
        const maxTokens = Math.min(
            CLOUDPILOT_AI_CONFIG.messageTokenLimit || PRESENTATION_MAX_TOKENS,
            PRESENTATION_MAX_TOKENS
        );
        const openAIRequest = prepareFinalRequestMessageReplyForOpenAI(context);

        const apiResult = await OpenAIClient.createOpenAiChatCompletion(client, {
            model: config.model,
            messages: openAIRequest.messages,
            max_tokens: maxTokens,
            temperature: config.temperature,
            feature: 'friendly_requests'
        });

        const openAIResponse =
            apiResult.data !== undefined && apiResult.data !== null
                ? String(apiResult.data).trim()
                : '';

        OpenAIClient.logOpenAI({
            capability: 'Request Presentation',
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

        if (!apiResult.success || !openAIResponse) {
            return {
                success: false,
                message: '',
                source: 'openai',
                error: apiResult.message || apiResult.error || 'request_presentation_failed'
            };
        }

        if (!openAIResponseContainsRequiredValues(openAIResponse, context)) {
            return {
                success: false,
                message: '',
                source: 'openai',
                error: 'request_presentation_dropped_facts'
            };
        }

        return {
            success: true,
            message: openAIResponse,
            source: 'openai',
            error: null
        };
    } catch (error) {
        return {
            success: false,
            message: '',
            source: 'openai',
            error: error && error.message ? error.message : String(error)
        };
    }
}

module.exports = {
    generateRequestMessageReply,
    generateRequestMessageReplyInternal,
    generateRequestMessageReplyOpenAI,
    openAIResponseContainsRequiredValues,
    prepareFinalRequestMessageReplyForOpenAI
};
