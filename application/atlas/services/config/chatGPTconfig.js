/**
 * Model presets — confirm ids + pricing at https://openai.com/api/pricing/
 * Org-level: set usage limits / budgets in the OpenAI dashboard (not in this repo).
 */
const CHAT_CONFIG = {
    LOW: {
        model: 'gpt-4o-mini',
        max_tokens: 30,
        temperature: 0.2
    },
    MEDIUM: {
        model: 'gpt-4o-mini',
        max_tokens: 150,
        temperature: 0.4
    },
    HIGH: {
        model: 'gpt-4o',
        max_tokens: 500,
        temperature: 0.7
    }
};

/**
 * Bill-safety defaults (prompt cost grows with input length; completion with max_tokens).
 * Override via env if you need more headroom for a specific deployment.
 */
const OPENAI_SAFE_DEFAULTS = {
    /** Max characters sent as the user message (after trim) — blocks huge pasted payloads. */
    MAX_USER_INPUT_CHARS: Number(process.env.OPENAI_MAX_USER_INPUT_CHARS) || 2000,
    /** Hard ceiling on max_tokens passed to the API from createOpenAiChatCompletion (defense in depth). */
    MAX_COMPLETION_TOKENS_CEILING: Number(process.env.OPENAI_MAX_COMPLETION_TOKENS_CEILING) || 512
};

module.exports = { CHAT_CONFIG, OPENAI_SAFE_DEFAULTS };
