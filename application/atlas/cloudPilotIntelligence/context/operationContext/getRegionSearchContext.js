/*
Region Search — operation context

Assembles ONE RegionSearchContext for the Region Search operation.
Internal and OpenAI both receive this same object.

Do not put Identity / Knowledge / Chat history here.
Provider adapters (e.g. buildRegionOpenAIMessages) format this for OpenAI only.

Doc: feature_intelligence_provider.md
*/

//Function A1: Build Region Search context for this operation
function getRegionSearchContext(message) {
    return {
        userMessage: String(message || ''),
        task: {
            purpose: [
                'Determine whether the user is PROVIDING an AWS region',
                'to be used for the current request.',
                '',
                'Return the normalized AWS region if provided.',
                '',
                'Do not return a region when the user is:',
                '- asking about a region',
                '- mentioning a region as an example',
                '- rejecting a region',
                '- discussing regions generally',
                '',
                'Interpret obvious natural-language names and minor spelling mistakes.'
            ].join('\n'),
            examples: [
                { input: 'I want to use US West 2', output: '{"region":"us-west-2"}' },
                { input: 'use USA West 2', output: '{"region":"us-west-2"}' },
                { input: 'I want to use USA Weste 2', output: '{"region":"us-west-2"}' },
                { input: "Let's do this in Oregon", output: '{"region":"us-west-2"}' },
                { input: 'What is US West 2?', output: '{}' },
                { input: 'Why do you want a region like US West 2?', output: '{}' },
                { input: "I don't want to use US West 2", output: '{}' },
                { input: 'Which region should I use?', output: '{}' }
            ],
            outputFormat: [
                'Return JSON only:',
                '{"region":"us-west-2"}',
                'or',
                '{}'
            ].join('\n')
        }
    };
}

module.exports = {
    getRegionSearchContext
};
