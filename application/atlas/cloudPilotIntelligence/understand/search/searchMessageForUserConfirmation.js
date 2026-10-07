const OpenAIClient = require('../../../providers/openAI/client/openAIClient');
const { CHAT_CONFIG } = require('../../../config/chatGPTconfig');
const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');
const SearchLogs = require('./helpers/searchLogs');
const SearchMessageForReplyFunctions = require('./searchMessageForReply');
const actionMap = require('../../../cloudPilot/masterCloudPilotCapabilities');
const ActionStatusFunctions = require('../../../cloudPilot/requests/functions/requestStatusFunctions');

/*
FUNCTIONS A: Open-request contextual understanding
    1) Function A1: shouldRunUserConfirmationSearch
    2) Function A2: searchMessageForUserConfirmation
    3) Function A3: searchMessageForUserConfirmationInternal
    4) Function A4: searchMessageForUserConfirmationOpenAI

One reading of a message against an open request in waiting_on_fields
or waiting_on_confirmation. Returns replyType plus explicit values.
Does not execute, speak, or change DB.

replyType:
  confirm | cancel | about_open_request | ambiguous_confirmation | unrelated

unrelated = not a question, confirmation, or cancellation of the open request.
A field-only update stays unrelated and carries values.
*/

const VALID_REPLY_TYPES = {
    confirm: true,
    cancel: true,
    about_open_request: true,
    ambiguous_confirmation: true,
    unrelated: true
};

const EDITABLE_REQUEST_FIELDS = {
    name: true,
    request_name: true,
    region: true,
    instance_type: true,
    instance_id: true,
    primary_instance_id: true,
    secondary_instance_id: true,
    tag_key: true,
    tag_value: true
};

//HELPERS
function buildConfirmationResult(replyType, replySource, fallbackReason, extras) {
    const normalized =
        replyType && VALID_REPLY_TYPES[replyType] ? replyType : 'unrelated';
    const details = extras && typeof extras === 'object' ? extras : {};
    const values =
        details.values && typeof details.values === 'object' && !Array.isArray(details.values)
            ? details.values
            : {};
    const ambiguousFields = Array.isArray(details.ambiguousFields)
        ? details.ambiguousFields
        : [];

    return {
        reply:
            normalized === 'confirm'
                ? 'confirm'
                : normalized === 'cancel'
                  ? 'cancel'
                  : null,
        replyType: normalized,
        replySource: replySource || 'internal',
        fallbackReason: fallbackReason || null,
        values: values,
        ambiguousFields: ambiguousFields,
        succeeded: details.succeeded != null ? details.succeeded === true : !fallbackReason
    };
}

function editableFieldsForAction(action) {
    const definition = action && actionMap[action] ? actionMap[action] : null;
    const required = definition && Array.isArray(definition.requiredFields)
        ? definition.requiredFields
        : [];
    const allowed = Object.assign({}, EDITABLE_REQUEST_FIELDS);

    for (let i = 0; i < required.length; i++) {
        allowed[required[i]] = true;
    }

    return allowed;
}

function parseOpenAIConfirmationResponse(raw, allowedFields) {
    const parsed = parseOpenRequestUnderstanding(raw, allowedFields);

    if (!parsed) {
        return null;
    }

    return parsed.replyType;
}

function parseOpenRequestUnderstanding(raw, allowedFields) {
    if (raw === undefined || raw === null) {
        return null;
    }

    let text = String(raw).trim();
    if (!text) {
        return null;
    }

    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) {
        text = fenced[1].trim();
    }

    try {
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return null;
        }

        let replyType = String(
            parsed.replyType || parsed.reply_type || parsed.reply || ''
        )
            .trim()
            .toLowerCase();

        if (!VALID_REPLY_TYPES[replyType]) {
            return null;
        }

        const allowed = allowedFields && typeof allowedFields === 'object'
            ? allowedFields
            : EDITABLE_REQUEST_FIELDS;
        const rawValues =
            parsed.values && typeof parsed.values === 'object' && !Array.isArray(parsed.values)
                ? parsed.values
                : {};
        const values = {};

        Object.keys(rawValues).forEach(function (fieldName) {
            if (!allowed[fieldName]) {
                return;
            }

            const fieldValue = rawValues[fieldName];

            if (fieldValue == null || fieldValue === '' || typeof fieldValue === 'object') {
                return;
            }

            const normalized = String(fieldValue).trim();

            if (!normalized) {
                return;
            }

            values[fieldName] = normalized;
        });

        const ambiguousRaw = Array.isArray(parsed.ambiguousFields)
            ? parsed.ambiguousFields
            : [];
        const ambiguousFields = [];

        for (let i = 0; i < ambiguousRaw.length; i++) {
            const fieldName = String(ambiguousRaw[i] || '').trim();

            if (!fieldName || !allowed[fieldName] || values[fieldName]) {
                continue;
            }

            if (ambiguousFields.indexOf(fieldName) === -1) {
                ambiguousFields.push(fieldName);
            }
        }

        return {
            replyType: replyType,
            values: values,
            ambiguousFields: ambiguousFields
        };
    } catch (err) {
        return null;
    }
}

function buildUserConfirmationOpenAIMessages(context) {
    const searchContext = context && typeof context === 'object' ? context : {};
    const userMessage = String(searchContext.userMessage || '');
    const action = String(searchContext.action || '');
    const actionLabel = String(searchContext.actionLabel || action || 'request');
    const description = String(searchContext.description || '');
    const collectedSummary = String(searchContext.collectedSummary || '');

    const missingSummary = String(searchContext.missingSummary || '');
    const fieldsSummary = String(searchContext.fieldsSummary || '');
    const status = String(searchContext.status || '');
    const askedSummary = String(searchContext.askedSummary || '');

    const systemMessage = [
        'TASK',
        '',
        'CloudPilot has an open request. Interpret the CURRENT MESSAGE in that context.',
        'The user may be asking about the request rather than supplying the next missing value.',
        'Do not assume that every message answers the latest field question.',
        'Status limits what the application may do later. It does not decide whether this is a question.',
        '',
        'Return JSON only:',
        '{"replyType":"about_open_request","values":{},"ambiguousFields":[]}',
        '',
        'replyType is exactly one of:',
        '',
        'confirm — user wants CloudPilot to run the open request now',
        '  Examples: "yes", "run it", "go ahead", "yes, create it".',
        'cancel — user wants to cancel / stop / not run the open request',
        '  Examples: "cancel", "never mind", "do not run it".',
        'about_open_request — user asks a question about the waiting request without authorizing it',
        '  Examples: "what will this do?", "is this safe?", "will this cost money?",',
        '  "what region will it scan?", "is this the smallest and cheapest?",',
        '  "is t3.nano cheaper?", "what should I name it?".',
        'ambiguous_confirmation — message plausibly refers to the waiting request,',
        '  but the user\'s execution intent is unclear.',
        '  Examples: "maybe", "I am not sure whether to run it".',
        'unrelated — not a question about this request and not a confirmation or cancellation',
        '  Examples: "hello", "hi", "hey", "help", "how are you?",',
        '  "what EC2 instances do I have?", "tell me about S3 encryption".',
        '  A message that only supplies field values is unrelated and puts those values in values.',
        '',
        'values holds explicit selections only. Mentioning a name, region, instance type,',
        'or instance id does not select it.',
        '  "Call it demo-server." → values.name',
        '  "Can you change the name to demo-server?" → values.name',
        '  "Use t3.nano." → values.instance_type',
        '  "Call it demo-server. Is t3.micro cheaper?" → about_open_request and values.name',
        '  "Is t3.nano cheaper?" → about_open_request and values {}',
        '  "Is this the right instance ID?" → about_open_request and values {}',
        'ambiguousFields is only for an actual attempt to supply a field whose value is unclear.',
        'A clear but unsupported value still goes in values. Example: "Use the moon as the region"',
        'puts the attempted region in values. The application validates it.',
        '',
        'IMPORTANT',
        'A message is not ambiguous_confirmation merely because it is vague, short,',
        'or is not a confirmation. Use ambiguous_confirmation only when the message',
        'appears to refer to the open request and execution intent is unclear.',
        'Greetings and general help requests are unrelated.',
        '',
        'Do not invent execution results. Do not choose a different action.',
        'Do not write a user-facing reply. Classification and explicit values only.',
        '',
        'OPEN REQUEST',
        'action: ' + action,
        'label: ' + actionLabel,
        status ? 'status: ' + status : '',
        description ? 'description: ' + description : '',
        fieldsSummary ? 'fields: ' + fieldsSummary : '',
        collectedSummary ? 'collected: ' + collectedSummary : '',
        missingSummary ? 'missing: ' + missingSummary : '',
        askedSummary ? 'last_asked: ' + askedSummary : ''
    ]
        .filter(Boolean)
        .join('\n');

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

function buildConfirmationSearchContext(message, requestState) {
    const state = requestState || {};
    const action = state.pendingAction ? String(state.pendingAction) : '';
    const definition = action && actionMap[action] ? actionMap[action] : null;
    const capability =
        definition && definition.capability && typeof definition.capability === 'object'
            ? definition.capability
            : {};
    const collected =
        state.collected && typeof state.collected === 'object' ? state.collected : {};
    const collectedParts = [];
    const required = definition && Array.isArray(definition.requiredFields)
        ? definition.requiredFields
        : [];
    const missing = Array.isArray(state.missing) ? state.missing : [];
    const asked = state.asked && typeof state.asked === 'object' ? state.asked : {};

    Object.keys(collected).forEach(function (fieldName) {
        const value = collected[fieldName];

        if (value == null || value === '' || typeof value === 'object') {
            return;
        }

        collectedParts.push(fieldName + '=' + String(value));
    });

    let askedSummary = '';

    if (asked.field && asked.value != null && typeof asked.value !== 'object') {
        askedSummary = String(asked.field) + '=' + String(asked.value);
    }

    return {
        userMessage: String(message || ''),
        action: action,
        actionLabel:
            (definition && definition.actionLabel) || action || 'request',
        description: capability.description ? String(capability.description) : '',
        status: state.status ? String(state.status) : '',
        collectedSummary: collectedParts.join(', '),
        missingSummary: missing.join(', '),
        fieldsSummary: required.join(', '),
        askedSummary: askedSummary,
        allowedFields: editableFieldsForAction(action)
    };
}

function logUserConfirmationSearch(details) {
    SearchLogs.recordSearch({
        name: 'userConfirmation',
        method: details.method,
        result: {
            replyType: details.replyType,
            replySource: details.replySource || null,
            action: details.action || null,
            status: details.status || null,
            fallback: details.fallbackReason || null,
            succeeded: details.succeeded !== false,
            valueKeys: details.valueKeys || [],
            ambiguousFields: details.ambiguousFields || []
        }
    });
}

//FUNCTIONS A
function shouldRunUserConfirmationSearch(requestState) {
    const state = requestState || {};

    if (!state.pendingAction) {
        return false;
    }

    return (
        ActionStatusFunctions.isWaitingOnConfirmation(state.status) ||
        ActionStatusFunctions.isCollectingFields(state.status)
    );
}

function searchMessageForUserConfirmationInternal(message) {
    const reply = SearchMessageForReplyFunctions.searchMessageForReply(message, {
        skipLog: true
    });

    if (reply === 'confirm') {
        return buildConfirmationResult('confirm', 'internal', null);
    }

    if (reply === 'cancel') {
        return buildConfirmationResult('cancel', 'internal', null);
    }

    // Phrase list cannot distinguish about / ambiguous / unrelated — continue normally.
    return buildConfirmationResult('unrelated', 'internal', null);
}

async function searchMessageForUserConfirmationOpenAI(context) {
    try {
        const client = OpenAIClient.getOpenAIClient();

        if (!client) {
            return {
            result: buildConfirmationResult(
                'unrelated',
                'openai',
                'no API key / client',
                { succeeded: false }
            ),
                fallbackReason: 'no API key / client'
            };
        }

        const config = CHAT_CONFIG.MEDIUM;
        const maxTokens = CLOUDPILOT_AI_CONFIG.messageTokenLimit || 500;
        const openAIRequest = buildUserConfirmationOpenAIMessages(context);

        const apiResult = await OpenAIClient.createOpenAiChatCompletion(client, {
            model: config.model,
            messages: openAIRequest.messages,
            max_tokens: maxTokens,
            temperature: config.temperature,
            feature: 'user_confirmation_search',
            logMasterOpenAIInput: false
        });

        const openAIResponse =
            apiResult.data !== undefined && apiResult.data !== null
                ? String(apiResult.data).trim()
                : '';

        OpenAIClient.logOpenAI({
            capability: 'User Confirmation',
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
                result: buildConfirmationResult(
                    'unrelated',
                    'openai',
                    apiResult.message || apiResult.error || 'openai_failed',
                    { succeeded: false }
                ),
                fallbackReason: apiResult.message || apiResult.error || 'openai_failed'
            };
        }

        if (apiResult.finishReason === 'length') {
            return {
                result: buildConfirmationResult(
                    'unrelated',
                    'openai',
                    'truncated',
                    { succeeded: false }
                ),
                fallbackReason: 'truncated'
            };
        }

        const parsed = parseOpenRequestUnderstanding(
            openAIResponse,
            context.allowedFields
        );

        if (!parsed) {
            return {
                result: buildConfirmationResult(
                    'unrelated',
                    'openai',
                    'invalid_json',
                    { succeeded: false }
                ),
                fallbackReason: 'invalid_json'
            };
        }

        return {
            result: buildConfirmationResult(parsed.replyType, 'openai', null, {
                values: parsed.values,
                ambiguousFields: parsed.ambiguousFields,
                succeeded: true
            }),
            fallbackReason: null
        };
    } catch (error) {
        return {
            result: buildConfirmationResult(
                'unrelated',
                'openai',
                error && error.message ? error.message : 'openai_exception',
                { succeeded: false }
            ),
            fallbackReason: error && error.message ? error.message : 'openai_exception'
        };
    }
}

async function searchMessageForUserConfirmation(message, requestState) {
    const context = buildConfirmationSearchContext(message, requestState);

    if (!shouldRunUserConfirmationSearch(requestState)) {
        logUserConfirmationSearch({
            method: 'Skipped',
            replyType: null,
            replySource: null,
            action: context.action,
            status: context.status,
            fallbackReason: null
        });
        return null;
    }

    const internalResult = searchMessageForUserConfirmationInternal(message);
    const openaiRequested = CLOUDPILOT_AI_CONFIG.userConfirmationSearch === 'openai';
    const masterDisabled = !CLOUDPILOT_AI_CONFIG.aiEnabled;
    const useOpenAI = openaiRequested && !masterDisabled;

    // Whole-message confirm/cancel only. "Yes, but is this the cheapest?" stays with OpenAI.
    if (useOpenAI) {
        const exactReply = SearchMessageForReplyFunctions.searchMessageForExactReply(message);

        if (exactReply === 'confirm' || exactReply === 'cancel') {
            const exactResult = buildConfirmationResult(exactReply, 'internal', null, {
                succeeded: true
            });

            logUserConfirmationSearch({
                method: 'Internal',
                replyType: exactResult.replyType,
                replySource: exactResult.replySource,
                action: context.action,
                status: context.status,
                fallbackReason: null,
                succeeded: true,
                valueKeys: [],
                ambiguousFields: []
            });

            return exactResult;
        }
    }

    if (useOpenAI) {
        const openAIOutcome = await searchMessageForUserConfirmationOpenAI(context);
        const result = openAIOutcome.result;

        logUserConfirmationSearch({
            method: 'OpenAI',
            replyType: result.replyType,
            replySource: result.replySource,
            action: context.action,
            status: context.status,
            fallbackReason: openAIOutcome.fallbackReason,
            succeeded: result.succeeded === true,
            valueKeys: Object.keys(result.values || {}),
            ambiguousFields: result.ambiguousFields || []
        });

        return result;
    }

    if (openaiRequested && masterDisabled) {
        const openAIRequest = buildUserConfirmationOpenAIMessages(context);
        OpenAIClient.logOpenAI({
            capability: 'User Confirmation',
            conversationHistoryEnabled: false,
            conversationHistoryCount: 0,
            context: openAIRequest.contextSummary,
            previewOnly: true
        });
    }

    logUserConfirmationSearch({
        method: 'Internal',
        replyType: internalResult.replyType,
        replySource: internalResult.replySource,
        action: context.action,
        status: context.status,
        fallbackReason: masterDisabled ? 'ai_disabled' : null
    });

    return internalResult;
}

module.exports = {
    shouldRunUserConfirmationSearch,
    searchMessageForUserConfirmation,
    searchMessageForUserConfirmationInternal,
    searchMessageForUserConfirmationOpenAI,
    parseOpenAIConfirmationResponse,
    parseOpenRequestUnderstanding,
    buildConfirmationResult,
    buildUserConfirmationOpenAIMessages
};
