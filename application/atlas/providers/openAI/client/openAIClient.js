const OpenAI = require('openai');
const { CHAT_CONFIG, OPENAI_SAFE_DEFAULTS } = require('../../../config/chatGPTconfig');
const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');
const SaveAiUsageFunctions = require('../usage/saveAiUsage');
const { calculateOpenAICost } = require('../usage/calculateOpenAICost');

/*
FUNCTIONS A: ChatGPT / OpenAI only (no intent logic — use ../logic + ./cloudPilotMessageFunctions for that)

    1) Function A1: Get OpenAI Client
    2) Function A2: Normalize User Message For Model
    3) Function A3: Create OpenAI Chat Completion
    4) Function A4: Send Chat With Action
    5) Function A5: Send General Chat
    6) Function A6: Send general chat during active workflow

FUNCTIONS B: OpenAI logging
    1) Function B1: logOpenAI
    2) Function B2: logOpenAIMessageContext (legacy wrapper — keep)
    3) Function B3: logOpenAIResponse (legacy wrapper — keep)
    4) Function B4: logOpenAICost (legacy wrapper — keep)
*/

let openaiClient = null;

/** Per user-message OpenAI capability invocation counter (reset in processMessage). */
let openAIRequestCounterForMessage = 0;

/** Per user-message estimated OpenAI spend in dollars (reset in processMessage). */
let openAICostTotalForMessage = 0;

/** Buffered OPENAI: Capability blocks — flushed after CloudPilot pipeline STEPs. */
let openAILogBuffer = [];

const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS) || 10000;

//FUNCTIONS A: ChatGPT / OpenAI
//Function A1: Get OpenAI Client
/** Lazy singleton OpenAI client; returns null if OPENAI_API_KEY is unset. */
function getOpenAIClient() {
    if (!process.env.OPENAI_API_KEY) {
        return null;
    }
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: OPENAI_TIMEOUT_MS
        });
    }
    return openaiClient;
}

/** Reset OpenAI request numbering, cost total, and log buffer at processMessage start. */
function resetOpenAIRequestCounter() {
    openAIRequestCounterForMessage = 0;
    openAICostTotalForMessage = 0;
    openAILogBuffer = [];
}

function nextOpenAIRequestNumber() {
    openAIRequestCounterForMessage += 1;
    return openAIRequestCounterForMessage;
}

//Function A2: Normalize User Message For Model
/** @returns {{ ok: true, text: string, message: '' } | { ok: false, text: '', message: string }}} */
function normalizeUserMessageForModel(raw) {
    const text = typeof raw === 'string' ? raw.trim() : '';
    if (!text) {
        return { ok: false, text: '', message: 'message is required' };
    }
    return { ok: true, text, message: '' };
}

//FUNCTIONS B: OpenAI logging
//Function B1: Buffer one OpenAI transaction (Executed or Preview) — flush after pipeline
function logOpenAI(options) {
    if (!CLOUDPILOT_AI_CONFIG.openAILogs) {
        return;
    }

    const details = options || {};
    const model = details.model || CHAT_CONFIG.LOW.model;
    const capability = details.capability || 'Unknown';
    const requestNumber = nextOpenAIRequestNumber();
    const status = details.previewOnly
        ? 'Preview (AI Disabled)'
        : (details.status || 'Executed');
    const historyEnabled = Boolean(details.conversationHistoryEnabled);
    const historyCount = Number(details.conversationHistoryCount) || 0;
    const messages = Array.isArray(details.messages) ? details.messages : [];
    const context = details.context || {};
    const lines = [];

    function push(line) {
        lines.push(line === undefined || line === null ? '' : String(line));
    }

    push('--------------------------------------------------');
    push('OPENAI: ' + capability + ' (Request ' + requestNumber + ')');
    push('--------------------------------------------------');
    push(' ');
    push('Model:');
    push(model);
    push(' ');
    push('Status:');
    push(status);
    push(' ');
    push('Conversation History:');

    if (historyEnabled) {
        push('Enabled');
        push('Messages Included: ' + historyCount);
    } else {
        push('Disabled');
    }

    push(' ');
    push('Context Loaded');
    if (context.mode === 'search_task') {
        // Search / Question OpenAI — tiny TASK (not Chat Identity stack)
        push(formatContextLine('Identity', context.identity));
        push(formatContextLine('Task', context.task));
        push(formatContextLine('Current Message', context.currentMessage));
        push(formatContextLine('Examples', context.examples));
        push(formatContextLine('Knowledge', context.knowledge));
    } else {
        push(formatContextLine('Identity', context.identity));
        push(formatContextLine('Situation', context.situation));
        push(formatContextLine('Current State', context.currentState));
        push(formatContextLine('Current Question', context.currentQuestion));
        push(formatContextLine('Knowledge', context.knowledge));
    }
    push(' ');
    push('Messages');
    push('----------------------------------');
    push(JSON.stringify(messages, null, 2));
    push(' ');
    push('Response');
    push('----------------------------------');

    if (details.previewOnly) {
        push('(none — AI disabled)');
    } else if (details.responseText !== undefined && details.responseText !== null) {
        const responseText = String(details.responseText).trim();
        push(responseText || '(empty response)');
    } else {
        push('(none)');
    }

    push(' ');
    push('Usage');
    push('----------------------------------');

    if (details.previewOnly) {
        push('(none)');
    } else if (details.usage) {
        const usage = details.usage || {};
        const promptTokens = Number(usage.prompt_tokens) || 0;
        const completionTokens = Number(usage.completion_tokens) || 0;
        const rawCost = calculateOpenAICost(model, promptTokens, completionTokens);

        openAICostTotalForMessage += rawCost;

        push('Prompt Tokens: ' + promptTokens);
        push('Completion Tokens: ' + completionTokens);
        push('Estimated Cost: $' + rawCost.toFixed(6));
    } else {
        push('(none)');
    }

    push(' ');
    openAILogBuffer.push(lines.join('\n'));
}

/** Print all buffered OPENAI blocks (Story 2 — after CloudPilot pipeline). */
function flushOpenAILogs() {
    if (!CLOUDPILOT_AI_CONFIG.openAILogs) {
        return;
    }

    for (let i = 0; i < openAILogBuffer.length; i++) {
        console.log(openAILogBuffer[i]);
    }

    openAILogBuffer = [];
}

/** End-of-message OpenAI cost total (1¢ display increments). After flush, before HTTP FOOTER. */
function logOpenAIMessageFooter() {
    if (!CLOUDPILOT_AI_CONFIG.openAILogs) {
        return;
    }

    console.log('Total: ' + formatTotalOpenAICost(openAICostTotalForMessage));
    console.log(' ');
}

function formatTotalOpenAICost(totalDollars) {
    const total = Number(totalDollars) || 0;

    if (total < 0.01) {
        return 'less than $.01';
    }

    const cents = Math.round(total * 100);
    const dollars = Math.floor(cents / 100);
    const remainder = cents % 100;
    const centsText = remainder < 10 ? '0' + remainder : String(remainder);

    if (dollars === 0) {
        return '$.' + centsText;
    }

    return '$' + dollars + '.' + centsText;
}

function formatContextLine(label, value) {
    if (value === true || value === 'loaded' || value === 'Loaded') {
        return '✓ ' + label;
    }

    if (value === false || value === null || value === undefined || value === 'not_used') {
        return label + ': Not Used';
    }

    return label + ': ' + String(value);
}

function summarizeAIContext(aiContext) {
    const context = aiContext || {};

    return {
        identity: Boolean(context.cloudPilot && context.cloudPilot.loaded),
        situation: Boolean(context.situation && context.situation.loaded),
        currentState: Boolean(context.currentState && context.currentState.loaded),
        currentQuestion: Boolean(context.currentQuestion && context.currentQuestion.loaded),
        knowledge: Boolean(context.knowledge && context.knowledge.loaded)
    };
}

/** Context Loaded lines for Search / Question OpenAI TASK prompts */
function summarizeSearchTaskContext() {
    return {
        mode: 'search_task',
        identity: false,
        task: true,
        currentMessage: true,
        examples: true,
        knowledge: false
    };
}

//Function B2: Legacy wrapper — keep for older call sites
function logOpenAIMessageContext(options) {
    logOpenAI(options);
}

//Function B3: Legacy wrapper — keep for older call sites
function logOpenAIResponse(options) {
    if (!CLOUDPILOT_AI_CONFIG.messageLogs) {
        return;
    }

    logOpenAI({
        capability: (options && options.capability) || 'Unknown',
        model: (options && options.model) || CHAT_CONFIG.LOW.model,
        previewOnly: false,
        conversationHistoryEnabled: false,
        conversationHistoryCount: 0,
        context: {},
        messages: [],
        responseText: options && options.responseText,
        usage: null
    });
}

//Function B4: Legacy wrapper — keep for older call sites
function logOpenAICost(options) {
    if (!CLOUDPILOT_AI_CONFIG.messageLogs) {
        return;
    }

    logOpenAI({
        capability: (options && options.capability) || 'Unknown',
        model: (options && options.model) || CHAT_CONFIG.LOW.model,
        previewOnly: false,
        conversationHistoryEnabled: false,
        conversationHistoryCount: 0,
        context: {},
        messages: [],
        responseText: null,
        usage: options && options.usage
    });
}

/**
 * @param {import('openai').OpenAI} client
 * @param {{
 *   model: string,
 *   messages: Array<{ role: string, content: string }>,
 *   max_tokens: number,
 *   temperature: number,
 *   organizationId?: string|null,
 *   conversationId?: string|number|null,
 *   requestId?: string|number|null,
 *   feature?: string|null
 * }} params
 * @returns {Promise<{ success: true, data: string|null, usage: object|null } | { success: false, message: string, data: null, error?: string }>}
 */
//Function A3: Create OpenAI Chat Completion
async function createOpenAiChatCompletion(client, params) {
    if (!client) {
        return { success: false, message: 'OpenAI client is missing', data: null };
    }

    const { model, messages, temperature } = params;
    const ceiling = OPENAI_SAFE_DEFAULTS.MAX_COMPLETION_TOKENS_CEILING;
    const requested = Number(params.max_tokens);
    const max_tokens = Number.isFinite(requested) && requested > 0
        ? Math.min(requested, ceiling)
        : Math.min(64, ceiling);

    try {
        const response = await client.chat.completions.create({
            model,
            messages,
            max_tokens,
            temperature
        });

        const choice = response.choices && response.choices[0] && response.choices[0].message;
        const data = choice && choice.content != null ? choice.content : null;
        const usage = response.usage || null;

        if (usage) {
            void SaveAiUsageFunctions.saveAiUsageFromOpenAIResponse({
                usage: usage,
                model: model,
                organizationId: params.organizationId,
                conversationId: params.conversationId,
                requestId: params.requestId,
                feature: params.feature || 'general_chat'
            });
        }

        return {
            success: true,
            data,
            usage: usage
        };
    } catch (error) {
        console.error('[createOpenAiChatCompletion] ChatGPT error:', error.message || error);
        return {
            success: false,
            message: 'ChatGPT request failed',
            data: null,
            error: error.message || String(error)
        };
    }
}

/**
 * One completion: system rules + serialized action + user text.
 * @returns {Promise<{ success: boolean, data?: string|null, message?: string, error?: string, usage?: object|null }>}
 */
//Function A4: Send Chat With Action
async function sendChatWithAction(userMessage, action) {
    const norm = normalizeUserMessageForModel(userMessage);
    if (!norm.ok) {
        return { success: false, message: norm.message, data: null };
    }

    const text = norm.text;
    const maxIn = OPENAI_SAFE_DEFAULTS.MAX_USER_INPUT_CHARS;
    if (text.length > maxIn) {
        return {
            success: false,
            message: 'message too long (max ' + maxIn + ' characters)',
            data: null
        };
    }

    const client = getOpenAIClient();
    if (!client) {
        console.warn('[sendChatWithAction] OPENAI_API_KEY is not set');
        return { success: false, message: 'OPENAI_API_KEY is not configured', data: null };
    }

    const config = CHAT_CONFIG.LOW;
    const systemPrompt =
        'You are CloudPilot.\n\n' +
        'RULES:\n' +
        '- Help with AWS EC2 when the user is asking about it; otherwise reply briefly and naturally.\n' +
        '- Keep responses under 10 words unless you need one short question (e.g. region or confirmation).\n' +
        '- Do not say you executed anything; nothing runs on AWS yet.\n' +
        '- If a field is missing, ask for it using field: "value" (e.g. region: "us-west-2").\n' +
        '- If action.type is toggle_ec2, ask for confirmation before acting.\n\n' +
        'ACTION:\n' +
        JSON.stringify(action);

    console.log('[sendChatWithAction] model=%s max_tokens=20 temperature=%s', config.model, config.temperature);

    const result = await createOpenAiChatCompletion(client, {
        model: config.model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
        ],
        max_tokens: 20,
        temperature: config.temperature
    });

    if (result.success && result.usage) {
        console.log(
            '[sendChatWithAction] usage prompt=%s completion=%s total=%s',
            result.usage.prompt_tokens,
            result.usage.completion_tokens,
            result.usage.total_tokens
        );
    }

    return result;
}

/**
 * General conversation (unknown intent / type none). Same outcome shape as sendChatWithAction.
 * @param {{ systemMessage?: string, conversationHistory?: Array<{ role: string, content: string }>, userMessage: string }|string} payload
 * @param {string} [legacySystemPrompt] — old call style: sendGeneralChat(userMessage, systemPrompt)
 * @returns {Promise<{ success: boolean, data?: string|null, message?: string, error?: string, usage?: object|null }>}
 */
//Function A5: Send General Chat
async function sendGeneralChat(payload, legacySystemPrompt) {
    let userMessage;
    let systemPrompt;
    let conversationHistory = [];
    let capability = 'General Chat';
    let conversationHistoryEnabled = false;
    let contextSummary = null;

    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        userMessage = payload.userMessage;
        systemPrompt = payload.systemMessage;
        conversationHistory = Array.isArray(payload.conversationHistory)
            ? payload.conversationHistory
            : [];
        capability = payload.capability ? String(payload.capability) : capability;
        conversationHistoryEnabled = Boolean(payload.conversationHistoryEnabled);
        contextSummary = payload.context || null;
    } else {
        userMessage = payload;
        systemPrompt = legacySystemPrompt;
    }

    const norm = normalizeUserMessageForModel(userMessage);
    if (!norm.ok) {
        return { success: false, message: norm.message, data: null };
    }

    const text = norm.text;
    const maxIn = OPENAI_SAFE_DEFAULTS.MAX_USER_INPUT_CHARS;
    if (text.length > maxIn) {
        return {
            success: false,
            message: 'message too long (max ' + maxIn + ' characters)',
            data: null
        };
    }

    const client = getOpenAIClient();
    if (!client) {
        console.warn('[sendGeneralChat] OPENAI_API_KEY is not set');
        return { success: false, message: 'OPENAI_API_KEY is not configured', data: null };
    }

    const config = CHAT_CONFIG.LOW;
    const messageMaxTokens = CLOUDPILOT_AI_CONFIG.messageTokenLimit;

    if (CLOUDPILOT_AI_CONFIG.messageLogs) {
        console.log(
            '[sendGeneralChat] model=%s max_tokens=%s temperature=%s',
            config.model,
            messageMaxTokens,
            config.temperature
        );
    }

    const defaultSystemContent =
        'You are CloudPilot, an AWS infrastructure assistant.\n\n' +
        'Prioritize:\n' +
        '- AWS terminology\n' +
        '- operationally useful answers\n' +
        '- exact AWS resource names\n' +
        '- exact AWS region identifiers when relevant\n\n' +
        'Keep responses brief, practical, and natural.\n' +
        'Keep responses under 15 words unless a short follow-up question is needed.\n' +
        'Do not claim AWS actions were executed.';

    const messages = [
        {
            role: 'system',
            content: systemPrompt || defaultSystemContent
        }
    ];

    for (let i = 0; i < conversationHistory.length; i++) {
        const item = conversationHistory[i];
        if (!item || !item.content) {
            continue;
        }
        messages.push({
            role: item.role === 'assistant' ? 'assistant' : 'user',
            content: String(item.content)
        });
    }

    messages.push({ role: 'user', content: text });

    const result = await createOpenAiChatCompletion(client, {
        model: config.model,
        messages: messages,
        max_tokens: messageMaxTokens,
        temperature: config.temperature
    });

    logOpenAI({
        capability: capability,
        model: config.model,
        previewOnly: false,
        conversationHistoryEnabled: conversationHistoryEnabled,
        conversationHistoryCount: conversationHistory.length,
        context: contextSummary || {},
        messages: messages,
        responseText: result.success
            ? result.data
            : result.message || result.error || 'OpenAI request failed',
        usage: result.success ? result.usage : null
    });

    if (CLOUDPILOT_AI_CONFIG.messageLogs && result.success && result.usage) {
        console.log(
            '[sendGeneralChat] usage prompt=%s completion=%s total=%s',
            result.usage.prompt_tokens,
            result.usage.completion_tokens,
            result.usage.total_tokens
        );
    }

    return result;
}

/**
 * General chat while a CloudPilot workflow is waiting on fields (same outcome shape as sendGeneralChat).
 * @param {string} userMessage
 * @param {{ pendingAction: string|null, missing: string[], collected: object }} workflowContext
 */
//Function A6: Send general chat during active workflow
async function sendGeneralChatDuringWorkflow(userMessage, workflowContext) {
    const norm = normalizeUserMessageForModel(userMessage);
    if (!norm.ok) {
        return { success: false, message: norm.message, data: null };
    }

    const text = norm.text;
    const maxIn = OPENAI_SAFE_DEFAULTS.MAX_USER_INPUT_CHARS;
    if (text.length > maxIn) {
        return {
            success: false,
            message: 'message too long (max ' + maxIn + ' characters)',
            data: null
        };
    }

    const client = getOpenAIClient();
    if (!client) {
        console.warn('[sendGeneralChatDuringWorkflow] OPENAI_API_KEY is not set');
        return { success: false, message: 'OPENAI_API_KEY is not configured', data: null };
    }

    const config = CHAT_CONFIG.LOW;
    const pending = String(workflowContext && workflowContext.pendingAction ? workflowContext.pendingAction : '');
    const missingList = workflowContext && Array.isArray(workflowContext.missing) ? workflowContext.missing : [];
    const missingStr = missingList.length ? missingList.join(', ') : 'none';
    const collectedStr = JSON.stringify((workflowContext && workflowContext.collected) ? workflowContext.collected : {});

    const systemPrompt =
        'You are CloudPilot.\n' +
        'The user has an active workflow.\n' +
        'pendingAction: ' + pending + '\n' +
        'Collected: ' + collectedStr + '\n' +
        'Still missing fields: ' + missingStr + '.\n\n' +
        'Answer the user message helpfully and briefly (AWS-aware when relevant).\n' +
        'If they greet you, greet back in one short phrase then continue.\n' +
        'Do not say the workflow was cancelled or that AWS changes were applied.\n' +
        'Do not repeat the same slot question the app already asked; missing fields are listed after your reply.\n' +
        'Do not contradict the checklist after your reply (field ids still listed are still missing).\n' +
        'Stay under about 60 words.';

    const maxTokens = Math.min(120, OPENAI_SAFE_DEFAULTS.MAX_COMPLETION_TOKENS_CEILING);

    const result = await createOpenAiChatCompletion(client, {
        model: config.model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
        ],
        max_tokens: maxTokens,
        temperature: config.temperature
    });

    if (result.success && result.usage) {
        console.log(
            '[sendGeneralChatDuringWorkflow] usage prompt=%s completion=%s total=%s',
            result.usage.prompt_tokens,
            result.usage.completion_tokens,
            result.usage.total_tokens
        );
    }

    return result;
}

module.exports = {
    getOpenAIClient,
    normalizeUserMessageForModel,
    resetOpenAIRequestCounter,
    logOpenAI,
    flushOpenAILogs,
    logOpenAIMessageFooter,
    summarizeAIContext,
    summarizeSearchTaskContext,
    logOpenAIMessageContext,
    logOpenAIResponse,
    logOpenAICost,
    createOpenAiChatCompletion,
    sendChatWithAction,
    sendGeneralChat,
    sendGeneralChatDuringWorkflow
};
