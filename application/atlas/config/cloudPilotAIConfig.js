/**
 * CloudPilot AI configuration — master switch, feature implementations, logging.
 *
 * Front door: cloudPilotIntelligence/CloudPilotIntelligence.js
 * OpenAI is one implementation (internal | openai). Model presets: chatGPTconfig.js
 *
 * Feature ENV (each independent; master OFF always wins):
 *   CLOUDPILOT_AI_ENABLED            master for all GenAI
 *   CLOUDPILOT_MESSAGE_RESPONSE      chat() (+ Capabilities wording)
 *   CLOUDPILOT_REGION_SEARCH         understandRegion / region search
 *   CLOUDPILOT_ACTION_SEARCH         understandAction — config stub; OpenAI not wired yet
 *
 * History / OpenAI transport:
 *   OPENAI_SEND_CONVERSATION_HISTORY, OPENAI_CONVERSATION_HISTORY_LIMIT
 *
 * Logging (each independent — not one LOGS_ON):
 *   CLOUDPILOT_MESSAGE_LOGS, CLOUDPILOT_REGION_LOGS, CLOUDPILOT_ACTION_LOGS,
 *   CLOUDPILOT_ACTION_STATE_LOGS, CLOUDPILOT_CONTEXT_LOGS,
 *   CLOUDPILOT_OPENAI_LOGS          OPENAI: <Capability> (Request N) blocks
 *
 * Token limits: CLOUDPILOT_MESSAGE_TOKEN_LIMIT, REGION, ACTION
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
     * Individual AI implementations (internal | openai).
     * messageResponse → chat() / Capabilities
     * regionSearch    → region search
     * actionSearch    → action search (stub; keep internal)
     */
    messageResponse: readImplementation('CLOUDPILOT_MESSAGE_RESPONSE', 'internal'),
    regionSearch: readImplementation('CLOUDPILOT_REGION_SEARCH', 'internal'),
    actionSearch: readImplementation('CLOUDPILOT_ACTION_SEARCH', 'internal'),

    /**
     * Individual logging switches (not one master LOGS_ON).
     * openAILogs → per-capability OPENAI: <Capability> (Request N) blocks
     */
    messageLogs: readEnvBoolean('CLOUDPILOT_MESSAGE_LOGS', false),
    regionLogs: readEnvBoolean('CLOUDPILOT_REGION_LOGS', false),
    actionLogs: readEnvBoolean('CLOUDPILOT_ACTION_LOGS', false),
    actionStateLogs: readEnvBoolean('CLOUDPILOT_ACTION_STATE_LOGS', false),
    contextLogs: readEnvBoolean('CLOUDPILOT_CONTEXT_LOGS', false),
    openAILogs: readEnvBoolean('CLOUDPILOT_OPENAI_LOGS', true),

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
