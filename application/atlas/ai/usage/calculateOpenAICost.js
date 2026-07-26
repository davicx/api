/*
OpenAI estimated cost from token counts.

Pricing: https://openai.com/api/pricing/
Update OPENAI_PRICE_PER_1M when rates change — only this file.

FUNCTIONS A: Cost calculation
    1) Function A1: calculateOpenAICost
*/

/** USD per 1M tokens — models CloudPilot uses today (chatGPTconfig.js). */
const OPENAI_PRICE_PER_1M = {
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'gpt-4o': { input: 2.5, output: 10.0 }
};

//Function A1: Estimated USD for one completion
function calculateOpenAICost(model, inputTokens, outputTokens) {
    const normalizedModel = String(model || '').trim().toLowerCase();
    const input = Math.max(0, Number(inputTokens) || 0);
    const output = Math.max(0, Number(outputTokens) || 0);
    const rates = OPENAI_PRICE_PER_1M[normalizedModel];

    if (!rates) {
        console.warn('[calculateOpenAICost] unknown model=%s — estimated_cost=0', model);
        return 0;
    }

    const cost = (input / 1e6) * rates.input + (output / 1e6) * rates.output;
    return roundUsd(cost);
}

function roundUsd(value) {
    return Math.round(value * 1e6) / 1e6;
}

module.exports = {
    calculateOpenAICost,
    OPENAI_PRICE_PER_1M
};
