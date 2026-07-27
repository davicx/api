/**
 * CloudPilot AI configuration — master switch, feature implementations, logging.
 *
 * OpenAI is one implementation CloudPilot can choose (internal | openai).
 * Model presets / token ceilings: chatGPTconfig.js
 *
 * Env:
 *   CLOUDPILOT_AI_ENABLED=true|false          (master; OFF always wins)
 *   OPENAI_SEND_CONVERSATION_HISTORY=true|false
 *   OPENAI_CONVERSATION_HISTORY_LIMIT=12
 *   CLOUDPILOT_MESSAGE_RESPONSE=internal|openai
 *   CLOUDPILOT_REGION_SEARCH=internal|openai
 *   CLOUDPILOT_ACTION_SEARCH=internal|openai
 *   CLOUDPILOT_MESSAGE_LOGS=true|false
 *   CLOUDPILOT_REGION_LOGS=true|false
 *   CLOUDPILOT_ACTION_LOGS=true|false
 *   CLOUDPILOT_MESSAGE_TOKEN_LIMIT=500
 *   CLOUDPILOT_REGION_TOKEN_LIMIT=40
 *   CLOUDPILOT_ACTION_TOKEN_LIMIT=40
 */

function readEnvBoolean(envName, defaultValue) {
    const raw = process.env[envName];

    if (raw === undefined || raw === null || String(raw).trim() === '') {
        return defaultValue;
    }

    return String(raw).trim().toLowerCase() === 'true';
}

function readEnvPositiveInt(envName, defaultValue, maxValue) {
    const parsed = Number(process.env[envName]);

    if (!Number.isFinite(parsed) || parsed < 1) {
        return defaultValue;
    }

    if (typeof maxValue === 'number' && parsed > maxValue) {
        return maxValue;
    }

    return Math.floor(parsed);
}

function readImplementation(envName, defaultValue) {
    const raw = process.env[envName];

    if (raw === undefined || raw === null || String(raw).trim() === '') {
        return defaultValue;
    }

    const mode = String(raw).trim().toLowerCase();

    if (mode === 'internal' || mode === 'openai') {
        return mode;
    }

    console.warn(
        '[CLOUDPILOT_AI_CONFIG] Unknown ' + envName + '="' + raw + '". Using internal.'
    );

    return 'internal';
}

const CLOUDPILOT_AI_CONFIG = {
    /**
     * MASTER AI SWITCH
     * false = all CloudPilot GenAI features are disabled.
     * Master OFF always wins over individual feature settings.
     */
    aiEnabled: readEnvBoolean('CLOUDPILOT_AI_ENABLED', false),

    /** Include recent conversation messages when sending a request to OpenAI. */
    sendConversationHistory: readEnvBoolean('OPENAI_SEND_CONVERSATION_HISTORY', true),

    /** Max message rows to include in conversation history. */
    conversationHistoryLimit: readEnvPositiveInt(
        'OPENAI_CONVERSATION_HISTORY_LIMIT',
        12,
        50
    ),

    /**
     * Individual AI implementations.
     * Values: internal | openai
     */
    messageResponse: readImplementation('CLOUDPILOT_MESSAGE_RESPONSE', 'internal'),
    regionSearch: readImplementation('CLOUDPILOT_REGION_SEARCH', 'internal'),
    actionSearch: readImplementation('CLOUDPILOT_ACTION_SEARCH', 'internal'),

    /**
     * Individual AI logging.
     */
    messageLogs: readEnvBoolean('CLOUDPILOT_MESSAGE_LOGS', false),
    regionLogs: readEnvBoolean('CLOUDPILOT_REGION_LOGS', false),
    actionLogs: readEnvBoolean('CLOUDPILOT_ACTION_LOGS', false),

    /**
     * Max completion tokens per feature (OpenAI max_tokens).
     */
    messageTokenLimit: readEnvPositiveInt('CLOUDPILOT_MESSAGE_TOKEN_LIMIT', 500, 2000),
    regionTokenLimit: readEnvPositiveInt('CLOUDPILOT_REGION_TOKEN_LIMIT', 40, 100),
    actionTokenLimit: readEnvPositiveInt('CLOUDPILOT_ACTION_TOKEN_LIMIT', 40, 100)
};

module.exports = {
    CLOUDPILOT_AI_CONFIG
};
