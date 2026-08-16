/*
AI Spend Search — operation context

Assembles ONE AiSpendSearchContext for the AI Spend Search operation.
Internal and OpenAI both receive this same object.

Do not put Identity / Knowledge / Chat history here.
Provider adapters (e.g. buildAiSpendOpenAIMessages) format this for OpenAI only.
*/

//Function A1: Build AI Spend Search context for this operation
function getAiSpendSearchContext(message) {
    return {
        userMessage: String(message || ''),
        task: {
            purpose: [
                'Determine whether the user is asking about CloudPilot AI / OpenAI',
                'usage or spend.',
                '',
                'Return a hit only when the user is clearly asking about AI or OpenAI',
                'spend, cost, or usage.',
                'Do not treat AWS billing or cloud infrastructure cost questions as AI spend.',
                'Classify only — do not invent dollar amounts or usage totals.'
            ].join('\n'),
            examples: [
                { input: 'how much have I spent on openai', output: '{"ai_spend":true}' },
                { input: 'show my ai spend', output: '{"ai_spend":true}' },
                { input: 'how much is my EC2 costing', output: '{}' },
                { input: 'scan ec2', output: '{}' }
            ],
            outputFormat: [
                'Return JSON only:',
                '{"ai_spend":true}',
                'or',
                '{}'
            ].join('\n')
        }
    };
}

module.exports = {
    getAiSpendSearchContext
};
