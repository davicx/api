/*
Formats assembled General Conversation context into one system prompt string.
*/

function hasOrganizationKnowledge(organizationKnowledge) {
    return (
        organizationKnowledge &&
        typeof organizationKnowledge === 'object' &&
        Object.keys(organizationKnowledge).length > 0
    );
}

function buildSystemPrompt(context) {
    const sections = [];

    if (context.cloudPilot && context.cloudPilot.text) {
        sections.push('GENERAL CLOUDPILOT CONTEXT:\n' + context.cloudPilot.text);
    }

    if (context.currentQuestion && context.currentQuestion.userMessage) {
        sections.push(
            'CURRENT QUESTION CONTEXT:\n' +
                'User message: ' +
                context.currentQuestion.userMessage
        );
    }

    if (hasOrganizationKnowledge(context.organizationKnowledgeContext)) {
        sections.push(
            'ORGANIZATION KNOWLEDGE:\n' + JSON.stringify(context.organizationKnowledgeContext, null, 2)
        );
    }

    return sections.join('\n\n');
}

module.exports = {
    buildSystemPrompt
};
