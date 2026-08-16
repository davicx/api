/*
Organizational Knowledge Search — operation context

Assembles ONE OrganizationalKnowledgeSearchContext for this operation.
Internal and OpenAI both receive this same object.

Do not put Identity / Knowledge / Chat history here.
Provider adapters format this for OpenAI only.
Detect / extract only — CloudPilot DB resolves the reference later.
*/

function resolveSelectedResourceName(options) {
    if (!options || typeof options !== 'object') {
        return '';
    }

    if (options.selectedResourceName != null) {
        return String(options.selectedResourceName).trim();
    }

    if (options.selectedFinding != null) {
        const finding = options.selectedFinding;
        if (typeof finding === 'string') {
            return String(finding).trim();
        }
        if (finding && finding.resourceName != null) {
            return String(finding.resourceName).trim();
        }
        if (finding && finding.resource_name != null) {
            return String(finding.resource_name).trim();
        }
    }

    return '';
}

//Function A1: Build Organizational Knowledge Search context for this operation
function getOrganizationalKnowledgeSearchContext(message, options) {
    const selectedResourceName = resolveSelectedResourceName(options);

    return {
        userMessage: String(message || ''),
        selectedResourceName: selectedResourceName,
        task: {
            purpose: [
                'Determine whether the user is asking why an S3 bucket / storage resource',
                'exists in their organization (purpose, importance, whether to delete, what',
                'it is for) — not live AWS cost or a new scan action.',
                '',
                'If yes, extract how they referred to the resource as resourceReference.',
                'resourceReference may be an AWS name, a friendly display phrase, or a tag',
                'like "tutorial" or "website images".',
                '',
                'Classify / extract only. Do not invent purpose, importance, or recommended actions.',
                'Do not map aliases to AWS names. Do not answer the question.',
                '',
                'Never return importance, purpose, notes, recommendedAction, or resourceName',
                'as separate fields.'
            ].join('\n'),
            examples: [
                {
                    input: 'What is this bucket for?',
                    output: '{"knowledgeType":"s3","resourceReference":"this"}'
                },
                {
                    input: 'Tell me about my tutorial bucket.',
                    output: '{"knowledgeType":"s3","resourceReference":"tutorial"}'
                },
                {
                    input: 'What is the website images bucket?',
                    output: '{"knowledgeType":"s3","resourceReference":"website images"}'
                },
                {
                    input: 'Tell me about sam-youtube-demo',
                    output: '{"knowledgeType":"s3","resourceReference":"sam-youtube-demo"}'
                },
                { input: 'how much does this bucket cost', output: '{}' },
                { input: 'scan s3', output: '{}' },
                { input: 'hello', output: '{}' }
            ],
            outputFormat: [
                'Return JSON only in this exact shape:',
                '{"knowledgeType":"s3","resourceReference":"<text>"}',
                'or',
                '{}'
            ].join('\n')
        }
    };
}

module.exports = {
    getOrganizationalKnowledgeSearchContext,
    resolveSelectedResourceName
};
