/*
Action Search — operation context

Assembles ONE ActionSearchContext for the Action Search operation.
Internal and OpenAI both receive this same object.

Do not put Identity / Knowledge / Chat history here.
Provider adapters (e.g. buildActionOpenAIMessages) format this for OpenAI only.

Doc: feature_intelligence_provider.md / how_to/intelligence_provider.md
*/

const actionMap = require('../../../cloudPilot/masterCloudPilotCapabilities');

function buildActionCatalog() {
    const catalog = [];

    for (const definition of Object.values(actionMap)) {
        if (!definition || typeof definition !== 'object') {
            continue;
        }

        if (!definition.type || definition.type === 'general_chat') {
            continue;
        }

        catalog.push({
            action: definition.type,
            label: definition.actionLabel || definition.type,
            description:
                definition.capability && definition.capability.description
                    ? definition.capability.description
                    : ''
        });
    }

    return catalog;
}

//Function A1: Build Action Search context for this operation
function getActionSearchContext(message) {
    return {
        userMessage: String(message || ''),
        task: {
            purpose: [
                'Classify the current user message using only the approved action catalog.',
                'Return an action when the user wants CloudPilot to run that capability.',
                'A question about the user’s current AWS resources requires a read capability.',
                'General knowledge questions such as "what is an EC2 instance?" are not actions.',
                'Never answer the question and never invent AWS facts.'
            ].join('\n'),
            catalog: buildActionCatalog(),
            outputFormat: 'Return JSON only: {"action":"scan_ec2"} or {}.'
        }
    };
}

module.exports = {
    getActionSearchContext,
    buildActionCatalog
};
