/*
Open Requests Search — operation context

Assembles ONE OpenRequestsSearchContext for the Open Requests Search operation.
Internal and OpenAI both receive this same object.

Do not put Identity / Knowledge / Chat history here.
Provider adapters (e.g. buildOpenRequestsOpenAIMessages) format this for OpenAI only.
*/

//Function A1: Build Open Requests Search context for this operation
function getOpenRequestsSearchContext(message) {
    return {
        userMessage: String(message || ''),
        task: {
            purpose: [
                'Determine whether the user is asking to see CloudPilot requests',
                'that are currently open, pending, or waiting.',
                '',
                'Classify only. Do not answer. Do not invent requests.',
                'Do not treat new action requests (scan, toggle, create) as open-requests questions.'
            ].join('\n'),
            examples: [
                { input: 'do I have any open requests', output: '{"open_requests":true}' },
                { input: 'what am I waiting on', output: '{"open_requests":true}' },
                { input: 'scan ec2', output: '{}' },
                { input: 'what is a request?', output: '{}' }
            ],
            outputFormat: [
                'Return JSON only:',
                '{"open_requests":true}',
                'or',
                '{}'
            ].join('\n')
        }
    };
}

module.exports = {
    getOpenRequestsSearchContext
};
