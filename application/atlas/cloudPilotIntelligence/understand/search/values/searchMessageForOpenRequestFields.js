const OpenAIClient = require('../../../../providers/openAI/client/openAIClient');
const { CHAT_CONFIG } = require('../../../../config/chatGPTconfig');
const { CLOUDPILOT_AI_CONFIG } = require('../../../../config/cloudPilotAIConfig');
const SearchLogs = require('../helpers/searchLogs');
const actionMap = require('../../../../cloudPilot/masterCloudPilotCapabilities');
const ActionStatusFunctions = require('../../../../cloudPilot/requests/functions/requestStatusFunctions');

/*
FUNCTIONS A: Open-request missing-field extraction (waiting_on_fields)
    1) Function A1: shouldRunOpenRequestFieldsSearch
    2) Function A2: searchMessageForOpenRequestFields
    3) Function A3: searchMessageForOpenRequestFieldsInternal
    4) Function A4: searchMessageForOpenRequestFieldsOpenAI

OpenAI returns structured values for missing required fields.
CloudPilot validates and persists elsewhere — this search never writes DB.
*/

const REGION_PATTERN = /^(?:us|eu|ap|sa|ca|me|af)-(?:gov-)?[a-z]+-\d$/i;

function shouldRunOpenRequestFieldsSearch(requestState) {
    const state = requestState || {};

    if (!state.pendingAction) {
        return false;
    }

    if (!ActionStatusFunctions.isCollectingFields(state.status)) {
        return false;
    }

    const missing = Array.isArray(state.missing) ? state.missing : [];

    return missing.length > 0;
}

function buildOpenRequestFieldsContext(message, requestState) {
    const state = requestState || {};
    const action = state.pendingAction ? String(state.pendingAction) : '';
    const definition = action && actionMap[action] ? actionMap[action] : null;
    const missing = Array.isArray(state.missing) ? state.missing.slice() : [];
    const collected =
        state.collected && typeof state.collected === 'object' ? state.collected : {};
    const collectedParts = [];

    Object.keys(collected).forEach(function (fieldName) {
        const value = collected[fieldName];

        if (value == null || value === '' || typeof value === 'object') {
            return;
        }

        collectedParts.push(fieldName + '=' + String(value));
    });

    return {
        userMessage: String(message || ''),
        action: action,
        actionLabel:
            (definition && definition.actionLabel) || action || 'request',
        description:
            definition &&
            definition.capability &&
            definition.capability.description
                ? String(definition.capability.description)
                : '',
        missing: missing,
        collectedSummary: collectedParts.join(', ')
    };
}

function buildOpenRequestFieldsOpenAIMessages(context) {
    const searchContext = context && typeof context === 'object' ? context : {};
    const missing = Array.isArray(searchContext.missing)
        ? searchContext.missing
        : [];
    const missingList = missing.length > 0 ? missing.join(', ') : 'none';

    const systemMessage = [
        'TASK',
        '',
        'CloudPilot has an open request collecting required fields.',
        'Extract values for the MISSING fields from the CURRENT MESSAGE.',
        'You may fill multiple missing fields from one message.',
        '',
        'Return JSON only in this shape:',
        '{"values":{"region":"us-west-2","request_name":"finding a new fix"},"ambiguousFields":[]}',
        '',
        'Rules:',
        '- Only include keys that are listed in MISSING.',
        '- Use null/omit a field when the message does not provide it.',
        '- Put a field name in ambiguousFields only when the message appears to',
        '  address that field but the intended value is unclear.',
        '- Do not invent values. Do not execute. Classification/extraction only.',
        '- request_name may be a multi-word phrase (for example "finding a new fix").',
        '- region must be an AWS region id like us-west-2 when present.',
        '',
        'OPEN REQUEST',
        'action: ' + String(searchContext.action || ''),
        'label: ' + String(searchContext.actionLabel || ''),
        searchContext.description
            ? 'description: ' + String(searchContext.description)
            : '',
        'missing: ' + missingList,
        searchContext.collectedSummary
            ? 'already_collected: ' + String(searchContext.collectedSummary)
            : ''
    ]
        .filter(Boolean)
        .join('\n');

    const messages = [
        { role: 'system', content: systemMessage },
        {
            role: 'user',
            content:
                'CURRENT MESSAGE\n\n"' +
                String(searchContext.userMessage || '') +
                '"\n\nReturn JSON only.'
        }
    ];

    return {
        systemMessage: systemMessage,
        messages: messages,
        contextSummary: OpenAIClient.summarizeSearchTaskContext()
    };
}

function parseOpenAIOpenRequestFieldsResponse(raw, allowedFields) {
    if (raw === undefined || raw === null) {
        return { values: {}, ambiguousFields: [] };
    }

    let text = String(raw).trim();

    if (!text) {
        return { values: {}, ambiguousFields: [] };
    }

    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);

    if (fenced && fenced[1]) {
        text = fenced[1].trim();
    }

    try {
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return { values: {}, ambiguousFields: [] };
        }

        const rawValues =
            parsed.values && typeof parsed.values === 'object' && !Array.isArray(parsed.values)
                ? parsed.values
                : parsed;
        const allowed = Array.isArray(allowedFields) ? allowedFields : [];
        const values = {};

        for (let i = 0; i < allowed.length; i++) {
            const fieldName = allowed[i];

            if (!Object.prototype.hasOwnProperty.call(rawValues, fieldName)) {
                continue;
            }

            const fieldValue = rawValues[fieldName];

            if (fieldValue == null || fieldValue === '') {
                continue;
            }

            if (typeof fieldValue === 'object') {
                continue;
            }

            const normalized = String(fieldValue).trim();

            if (!normalized) {
                continue;
            }

            if (fieldName === 'region' && !REGION_PATTERN.test(normalized)) {
                continue;
            }

            values[fieldName] = fieldName === 'region' ? normalized.toLowerCase() : normalized;
        }

        const ambiguousRaw = Array.isArray(parsed.ambiguousFields)
            ? parsed.ambiguousFields
            : [];
        const ambiguousFields = [];

        for (let i = 0; i < ambiguousRaw.length; i++) {
            const fieldName = String(ambiguousRaw[i] || '').trim();

            if (!fieldName || allowed.indexOf(fieldName) === -1) {
                continue;
            }

            if (values[fieldName]) {
                continue;
            }

            if (ambiguousFields.indexOf(fieldName) === -1) {
                ambiguousFields.push(fieldName);
            }
        }

        return { values: values, ambiguousFields: ambiguousFields };
    } catch (error) {
        return { values: {}, ambiguousFields: [] };
    }
}

function searchMessageForOpenRequestFieldsInternal() {
    // Internal mode keeps existing extractors (region regex / name phrases).
    // This helper only adds OpenAI multi-field fill.
    return { values: {}, ambiguousFields: [] };
}

async function searchMessageForOpenRequestFieldsOpenAI(context) {
    try {
        const client = OpenAIClient.getOpenAIClient();

        if (!client) {
            return {
                result: searchMessageForOpenRequestFieldsInternal(),
                fallbackReason: 'no API key / client'
            };
        }

        const config = CHAT_CONFIG.MEDIUM;
        const maxTokens = Math.min(
            CLOUDPILOT_AI_CONFIG.openRequestFieldsTokenLimit || 80,
            120
        );
        const openAIRequest = buildOpenRequestFieldsOpenAIMessages(context);

        const apiResult = await OpenAIClient.createOpenAiChatCompletion(client, {
            model: config.model,
            messages: openAIRequest.messages,
            max_tokens: maxTokens,
            temperature: config.temperature,
            feature: 'open_request_fields_search',
            logMasterOpenAIInput: false
        });

        const openAIResponse =
            apiResult.data !== undefined && apiResult.data !== null
                ? String(apiResult.data).trim()
                : '';

        OpenAIClient.logOpenAI({
            capability: 'Open Request Fields',
            model: config.model,
            conversationHistoryEnabled: false,
            conversationHistoryCount: 0,
            context: openAIRequest.contextSummary,
            previewOnly: false,
            responseText: apiResult.success
                ? openAIResponse
                : apiResult.message || apiResult.error || 'OpenAI request failed',
            usage: apiResult.success ? apiResult.usage : null
        });

        if (!apiResult.success || !openAIResponse) {
            return {
                result: searchMessageForOpenRequestFieldsInternal(),
                fallbackReason:
                    apiResult.message || apiResult.error || 'openai_failed'
            };
        }

        const parsed = parseOpenAIOpenRequestFieldsResponse(
            openAIResponse,
            context.missing || []
        );

        return {
            result: parsed,
            fallbackReason: null
        };
    } catch (error) {
        return {
            result: searchMessageForOpenRequestFieldsInternal(),
            fallbackReason:
                error && error.message ? error.message : 'openai_exception'
        };
    }
}

async function searchMessageForOpenRequestFields(message, requestState, alreadyFound) {
    const context = buildOpenRequestFieldsContext(message, requestState);
    const found =
        alreadyFound && typeof alreadyFound === 'object' ? alreadyFound : {};

    context.missing = (context.missing || []).filter(function (fieldName) {
        return found[fieldName] == null || found[fieldName] === '';
    });

    if (!shouldRunOpenRequestFieldsSearch(requestState) || context.missing.length === 0) {
        SearchLogs.recordSearch({
            name: 'openRequestFields',
            method: 'Skipped',
            result: null
        });
        return { values: {}, ambiguousFields: [] };
    }

    const openaiRequested =
        CLOUDPILOT_AI_CONFIG.openRequestFieldsSearch === 'openai';
    const masterDisabled = !CLOUDPILOT_AI_CONFIG.aiEnabled;
    const useOpenAI = openaiRequested && !masterDisabled;

    if (useOpenAI) {
        const openAIOutcome = await searchMessageForOpenRequestFieldsOpenAI(context);
        const result = openAIOutcome.result || { values: {}, ambiguousFields: [] };

        SearchLogs.recordSearch({
            name: 'openRequestFields',
            method: 'OpenAI',
            result: {
                values: result.values || {},
                ambiguousFields: result.ambiguousFields || [],
                fallback: openAIOutcome.fallbackReason || null
            }
        });

        return result;
    }

    if (openaiRequested && masterDisabled) {
        const openAIRequest = buildOpenRequestFieldsOpenAIMessages(context);
        OpenAIClient.logOpenAI({
            capability: 'Open Request Fields',
            conversationHistoryEnabled: false,
            conversationHistoryCount: 0,
            context: openAIRequest.contextSummary,
            previewOnly: true
        });
    }

    const result = searchMessageForOpenRequestFieldsInternal();

    SearchLogs.recordSearch({
        name: 'openRequestFields',
        method: 'Internal',
        result: null
    });

    return result;
}

module.exports = {
    shouldRunOpenRequestFieldsSearch,
    searchMessageForOpenRequestFields,
    searchMessageForOpenRequestFieldsInternal,
    searchMessageForOpenRequestFieldsOpenAI,
    parseOpenAIOpenRequestFieldsResponse,
    buildOpenRequestFieldsOpenAIMessages
};
