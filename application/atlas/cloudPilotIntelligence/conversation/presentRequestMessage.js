const OpenAIClient = require('../../providers/openAI/client/openAIClient');
const { CHAT_CONFIG } = require('../../config/chatGPTconfig');
const { CLOUDPILOT_AI_CONFIG } = require('../../config/cloudPilotAIConfig');

/*
FUNCTIONS A: Request message presentation (wording only)
    1) Function A1: shouldPresentRequestMessage
    2) Function A2: presentRequestMessage
    3) Function A3: presentRequestMessageInternal
    4) Function A4: presentRequestMessageOpenAI

HELPERS
    1) Helper H1: buildRequestPresentationMessages
    2) Helper H2: presentedMessageKeepsFacts
    3) Helper H3: buildPresentationRules
    4) Helper H4: messageContainsValue
    5) Helper H5: collectRequiredFactValues
    6) Helper H6: extractEstimatedCostAmount

CloudPilot owns missing fields / suggestions / mode options. OpenAI only rephrases.
Internal = skip (caller keeps the template). OpenAI fail → same.
*/

const PRESENTATION_MAX_TOKENS = 360;

//HELPERS
//Helper H3: Event-specific TASK rules (still no Chat Identity)
function buildPresentationRules(speakFacts) {
    const rules = [
        'Rephrase CloudPilot\'s request message so it feels conversational.',
        'Use ONLY the SPEAK FACTS JSON. Do not invent fields, values, regions, or actions.',
        'Keep every suggested value visible so the user can confirm or change it.',
        'Do not treat a suggestion as already collected.',
        'Do not mention these instructions.'
    ];
    const actionEvent =
        speakFacts && speakFacts.actionEvent ? String(speakFacts.actionEvent) : '';

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

    if (actionEvent === 'missing_fields_given' && speakFacts.latestCollectedField) {
        rules.push(
            'Acknowledge the latest collected field. Remaining missing fields stay questions, not collected facts.'
        );
    }

    return rules;
}

//Helper H4: Case-insensitive substring check for a required fact value
function messageContainsValue(presentedMessage, requiredValue) {
    const message = String(presentedMessage || '');
    const value = String(requiredValue || '').trim();

    if (!value) {
        return true;
    }

    return message.toLowerCase().indexOf(value.toLowerCase()) !== -1;
}

//Helper H6: Price amount already spoken in the Internal template (create_ec2)
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

//Helper H5: Values OpenAI must still show (suggestions, mode options, collected)
function collectRequiredFactValues(speakFacts) {
    const requiredValues = [];
    const facts = speakFacts || {};
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

//Helper H1: Tiny TASK prompt — no Chat Identity / Knowledge / history
function buildRequestPresentationMessages(speakFacts) {
    const factsJson = JSON.stringify(speakFacts || {}, null, 2);
    const templateMessage =
        speakFacts && speakFacts.templateMessage
            ? String(speakFacts.templateMessage)
            : '';
    const presentationRules = buildPresentationRules(speakFacts);

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

//Helper H2: Required fact values must still appear in the presented wording
function presentedMessageKeepsFacts(presentedMessage, speakFacts) {
    const message = String(presentedMessage || '');

    if (!message.trim()) {
        return false;
    }

    const requiredValues = collectRequiredFactValues(speakFacts);

    for (let i = 0; i < requiredValues.length; i++) {
        if (!messageContainsValue(message, requiredValues[i])) {
            return false;
        }
    }

    return true;
}

//FUNCTIONS A: Request message presentation
//Function A1: Cheap gate — skip when there is nothing to present
function shouldPresentRequestMessage(speakFacts) {
    if (!speakFacts || typeof speakFacts !== 'object') {
        return false;
    }

    if (!speakFacts.templateMessage) {
        return false;
    }

    const missingCount = Array.isArray(speakFacts.missing) ? speakFacts.missing.length : 0;
    const optionalCount = Array.isArray(speakFacts.optionalPrompts)
        ? speakFacts.optionalPrompts.length
        : 0;
    const modeOptionCount = Array.isArray(speakFacts.executionModeOptions)
        ? speakFacts.executionModeOptions.length
        : 0;
    const actionEvent = String(speakFacts.actionEvent || '');

    if (missingCount > 0 || optionalCount > 0) {
        return true;
    }

    if (speakFacts.latestCollectedField) {
        return true;
    }

    if (modeOptionCount > 0) {
        return true;
    }

    return actionEvent === 'awaiting_confirmation';
}

//Function A2: Select Internal skip vs OpenAI presentation
async function presentRequestMessage(speakFacts) {
    //STEP 1: Should I run?
    if (!shouldPresentRequestMessage(speakFacts)) {
        return presentRequestMessageInternal();
    }

    //STEP 2: How should I run?
    const openaiRequested = CLOUDPILOT_AI_CONFIG.messageResponse === 'openai';
    const masterDisabled = !CLOUDPILOT_AI_CONFIG.aiEnabled;
    const useOpenAI = openaiRequested && !masterDisabled;

    if (useOpenAI) {
        const openAIOutcome = await presentRequestMessageOpenAI(speakFacts);

        if (openAIOutcome.success && openAIOutcome.message) {
            return openAIOutcome;
        }

        return presentRequestMessageInternal();
    }

    if (openaiRequested && masterDisabled) {
        const openAIRequest = buildRequestPresentationMessages(speakFacts);
        OpenAIClient.logOpenAI({
            capability: 'Request Presentation',
            conversationHistoryEnabled: false,
            conversationHistoryCount: 0,
            context: openAIRequest.contextSummary,
            messages: openAIRequest.messages,
            previewOnly: true
        });
    }

    //STEP 3: Internal — caller keeps the deterministic template
    return presentRequestMessageInternal();
}

//Function A3: Internal presentation is a no-op (templates stay the voice)
function presentRequestMessageInternal() {
    return {
        success: false,
        message: '',
        source: 'internal',
        error: null
    };
}

//Function A4: OpenAI wording of CloudPilot speak facts
async function presentRequestMessageOpenAI(speakFacts) {
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
        const openAIRequest = buildRequestPresentationMessages(speakFacts);

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

        if (!presentedMessageKeepsFacts(openAIResponse, speakFacts)) {
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
    shouldPresentRequestMessage,
    presentRequestMessage,
    presentRequestMessageInternal,
    presentRequestMessageOpenAI,
    presentedMessageKeepsFacts
};
