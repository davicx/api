const OpenAIClient = require('../../../providers/openAI/client/openAIClient');
const { CHAT_CONFIG } = require('../../../config/chatGPTconfig');
const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');
const SearchLogs = require('./helpers/searchLogs');
const SearchMessageForReplyFunctions = require('./searchMessageForReply');
const actionMap = require('../../../cloudPilot/masterCloudPilotCapabilities');
const ActionStatusFunctions = require('../../../cloudPilot/requests/functions/requestStatusFunctions');

/*
FUNCTIONS A: User confirmation search (waiting_on_confirmation only)
    1) Function A1: shouldRunUserConfirmationSearch
    2) Function A2: searchMessageForUserConfirmation
    3) Function A3: searchMessageForUserConfirmationInternal
    4) Function A4: searchMessageForUserConfirmationOpenAI

Classifies how the message relates to the open confirmation prompt.
Does not execute, speak, or change DB.

replyType:
  confirm | cancel | about_open_request | ambiguous_confirmation | unrelated

unrelated = not a response to the open request → continue normal understanding.
*/

const VALID_REPLY_TYPES = {
    confirm: true,
    cancel: true,
    about_open_request: true,
    ambiguous_confirmation: true,
    unrelated: true
};

//HELPERS
function buildConfirmationResult(replyType, replySource, fallbackReason) {
    const normalized =
        replyType && VALID_REPLY_TYPES[replyType] ? replyType : 'unrelated';

    return {
        reply:
            normalized === 'confirm'
                ? 'confirm'
                : normalized === 'cancel'
                  ? 'cancel'
                  : null,
        replyType: normalized,
        replySource: replySource || 'internal',
        fallbackReason: fallbackReason || null
    };
}

function parseOpenAIConfirmationResponse(raw) {
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
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }

        let replyType = String(
            parsed.replyType || parsed.reply_type || parsed.reply || ''
        )
            .trim()
            .toLowerCase();

        if (VALID_REPLY_TYPES[replyType]) {
            return replyType;
        }

        return null;
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

    const systemMessage = [
        'TASK',
        '',
        'CloudPilot has an open request waiting for the user to confirm or cancel execution.',
        'Classify the CURRENT MESSAGE as exactly one of:',
        '',
        'confirm — user wants CloudPilot to run the open request now',
        '  Examples: "yes", "run it", "go ahead".',
        'cancel — user wants to cancel / stop / not run the open request',
        '  Examples: "cancel", "never mind", "do not run it".',
        'about_open_request — user asks a question about the waiting request without authorizing it',
        '  Examples: "what will this do?", "is this safe?", "will this cost money?",',
        '  "what region will it scan?".',
        'ambiguous_confirmation — message plausibly refers to the waiting request,',
        '  but the user\'s execution intent is unclear.',
        '  Examples: "maybe", "I am not sure whether to run it".',
        'unrelated — message is NOT about confirming/cancelling this request',
        '  Examples: "hello", "hi", "hey", "help", "how are you?",',
        '  "what EC2 instances do I have?", "tell me about S3 encryption".',
        '',
        'IMPORTANT',
        'A message is not ambiguous_confirmation merely because it is vague, short,',
        'or is not a confirmation. Use ambiguous_confirmation only when the message',
        'appears to refer to the open request and execution intent is unclear.',
        'Greetings and general help requests are unrelated.',
        '',
        'Return JSON only in this shape:',
        '{"replyType":"confirm"}',
        '',
        'Do not invent execution results. Do not choose a different action.',
        'Do not write a user-facing reply. Classification only.',
        '',
        'OPEN REQUEST',
        'action: ' + action,
        'label: ' + actionLabel,
        description ? 'description: ' + description : '',
        collectedSummary ? 'collected: ' + collectedSummary : ''
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

    if (collected.request_name) {
        collectedParts.push('scan_name=' + String(collected.request_name));
    }
    if (collected.region) {
        collectedParts.push('region=' + String(collected.region));
    }

    return {
        userMessage: String(message || ''),
        action: action,
        actionLabel:
            (definition && definition.actionLabel) || action || 'request',
        description: capability.description ? String(capability.description) : '',
        status: state.status ? String(state.status) : '',
        collectedSummary: collectedParts.join(', ')
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
            fallback: details.fallbackReason || null
        }
    });
}

//FUNCTIONS A
function shouldRunUserConfirmationSearch(requestState) {
    const state = requestState || {};

    if (!state.pendingAction) {
        return false;
    }

    return ActionStatusFunctions.isWaitingOnConfirmation(state.status);
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
                    'no API key / client'
                ),
                fallbackReason: 'no API key / client'
            };
        }

        const config = CHAT_CONFIG.MEDIUM;
        const maxTokens = Math.min(
            CLOUDPILOT_AI_CONFIG.userConfirmationTokenLimit || 40,
            60
        );
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
                    apiResult.message || apiResult.error || 'openai_failed'
                ),
                fallbackReason: apiResult.message || apiResult.error || 'openai_failed'
            };
        }

        const replyType = parseOpenAIConfirmationResponse(openAIResponse);

        if (!replyType) {
            return {
                result: buildConfirmationResult(
                    'unrelated',
                    'openai',
                    'invalid_json'
                ),
                fallbackReason: 'invalid_json'
            };
        }

        return {
            result: buildConfirmationResult(replyType, 'openai', null),
            fallbackReason: null
        };
    } catch (error) {
        return {
            result: buildConfirmationResult(
                'unrelated',
                'openai',
                error && error.message ? error.message : 'openai_exception'
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

    // Exact confirm/cancel phrases win first — never let OpenAI turn "yes!" into unrelated chat.
    const internalResult = searchMessageForUserConfirmationInternal(message);

    if (
        internalResult.replyType === 'confirm' ||
        internalResult.replyType === 'cancel'
    ) {
        logUserConfirmationSearch({
            method: 'Internal',
            replyType: internalResult.replyType,
            replySource: internalResult.replySource,
            action: context.action,
            status: context.status,
            fallbackReason: null
        });
        return internalResult;
    }

    const openaiRequested = CLOUDPILOT_AI_CONFIG.userConfirmationSearch === 'openai';
    const masterDisabled = !CLOUDPILOT_AI_CONFIG.aiEnabled;
    const useOpenAI = openaiRequested && !masterDisabled;

    if (useOpenAI) {
        const openAIOutcome = await searchMessageForUserConfirmationOpenAI(context);
        const result = openAIOutcome.result;

        logUserConfirmationSearch({
            method: 'OpenAI',
            replyType: result.replyType,
            replySource: result.replySource,
            action: context.action,
            status: context.status,
            fallbackReason: openAIOutcome.fallbackReason
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
    buildConfirmationResult,
    buildUserConfirmationOpenAIMessages
};
