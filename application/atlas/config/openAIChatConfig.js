/**
 * OpenAI chat request policy + AI enhancement feature flags.
 *
 * Not CloudPilot identity or Situation context. For model presets and input/token
 * ceilings see chatGPTconfig.js.
 *
 * Env — request policy:
 *   OPEN_AI_LIVE_SEND_ALL_MESSAGES_WILL_CAUSE_BILLING=true|false
 *     → true actually calls OpenAI (costs money). Default false.
 *   OPENAI_SEND_CONVERSATION_HISTORY=true|false
 *   OPENAI_CONVERSATION_HISTORY_LIMIT=12
 *     → max message ROWS (not user/assistant pairs) for ConversationHistoryContext.getMessages(n)
 *   OPENAI_LOG_PROMPTS=true|false
 *   OPENAI_LOG_REQUEST=true|false
 *
 * Env — AI enhancements (all default false; no behavior until wired):
 *   OPENAI_EXPLAIN_FINDINGS=true|false
 *   OPENAI_FRIENDLY_REQUESTS=true|false
 *   OPENAI_INTENT_UNDERSTANDING=true|false
 *
 * See doc/development/cloud_pilot_chat.md
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

const OPENAI_CHAT_CONFIG = {
    /**
     * Master switch: actually send general chat to OpenAI (billing).
     * Env: OPEN_AI_LIVE_SEND_ALL_MESSAGES_WILL_CAUSE_BILLING
     * Default false — logs/context still work without this.
     */
    liveSendAllMessagesWillCauseBilling: readEnvBoolean(
        'OPEN_AI_LIVE_SEND_ALL_MESSAGES_WILL_CAUSE_BILLING',
        false
    ),

    /** Include recent conversation messages in the OpenAI request (when wired). */
    sendConversationHistory: readEnvBoolean('OPENAI_SEND_CONVERSATION_HISTORY', true),

    /** Max message ROWS to load when sendConversationHistory is true (not exchange pairs). */
    conversationHistoryLimit: readEnvPositiveInt('OPENAI_CONVERSATION_HISTORY_LIMIT', 12, 50),

    /** Dev: log rendered system prompt before OpenAI. */
    logPrompt: readEnvBoolean('OPENAI_LOG_PROMPTS', false),

    /** Dev: log conversation messages array sent to OpenAI. */
    logRequest: readEnvBoolean('OPENAI_LOG_REQUEST', false),

    /**
     * Feature 1 — Explain curated findings in plain English (prioritized).
     * Default false. Not wired yet.
     */
    explainFindings: readEnvBoolean('OPENAI_EXPLAIN_FINDINGS', false),

    /**
     * Feature 2 — Friendly one-field-at-a-time request questions.
     * Default false. Not wired yet.
     */
    friendlyRequests: readEnvBoolean('OPENAI_FRIENDLY_REQUESTS', false),

    /**
     * Feature 3 — STEP 3 intent understanding via OpenAI (same messageUnderstanding contract).
     * Default false. Not wired yet — rules path (searchMessageFor*) stays default.
     */
    intentUnderstanding: readEnvBoolean('OPENAI_INTENT_UNDERSTANDING', false)
};

module.exports = {
    OPENAI_CHAT_CONFIG
};
