/**
 * TEMP OpenAI lab — model tiers for /openai chat only.
 * Edit this file to change models, prices, or defaults.
 *
 * Prices: USD per 1M tokens (for estimated cost on the test page).
 */

const OPENAI_TEST_MODELS = {
    CHEAP: {
        tier: 'CHEAP',
        model: 'gpt-5.6-luna',
        displayName: 'GPT-5.6 Luna',
        inputPer1M: 0.2,
        outputPer1M: 1.2,
        max_completion_tokens: 512
    },
    MEDIUM: {
        tier: 'MEDIUM',
        model: 'gpt-5.6-terra',
        displayName: 'GPT-5.6 Terra',
        inputPer1M: 2.0,
        outputPer1M: 12.0,
        max_completion_tokens: 512
    },
    EXPENSIVE: {
        tier: 'EXPENSIVE',
        model: 'gpt-5.6-sol',
        displayName: 'GPT-5.6 Sol',
        inputPer1M: 4.0,
        outputPer1M: 20.0,
        max_completion_tokens: 512
    }
};

const DEFAULT_TIER = 'CHEAP';

function getModelConfig(tier) {
    const key = String(tier || DEFAULT_TIER).trim().toUpperCase();
    return OPENAI_TEST_MODELS[key] || OPENAI_TEST_MODELS[DEFAULT_TIER];
}

/** Estimated USD from OpenAI usage + this file's rates (not Atlas chatGPTconfig). */
function estimateCostUsd(modelConfig, usage) {
    const inputTokens = Number(usage && usage.prompt_tokens) || 0;
    const outputTokens = Number(usage && usage.completion_tokens) || 0;
    const inputRate = Number(modelConfig.inputPer1M) || 0;
    const outputRate = Number(modelConfig.outputPer1M) || 0;
    const cost = (inputTokens / 1e6) * inputRate + (outputTokens / 1e6) * outputRate;
    return Math.round(cost * 1e8) / 1e8;
}

module.exports = {
    OPENAI_TEST_MODELS,
    DEFAULT_TIER,
    getModelConfig,
    estimateCostUsd
};
