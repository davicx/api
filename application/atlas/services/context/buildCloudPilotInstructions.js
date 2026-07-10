/*
Builds the instructions sent to the AI.

Keep this file dumb: no AWS logic, no business rules.
Only format Identity + Situation + Knowledge sections.
Intelligence lives in context files and services/knowledge/.
*/

function hasOrganizationKnowledge(organizationKnowledge) {
    return (
        organizationKnowledge &&
        typeof organizationKnowledge === 'object' &&
        Object.keys(organizationKnowledge).length > 0
    );
}

function formatSituationSection(currentQuestion) {
    if (!currentQuestion || typeof currentQuestion !== 'object') {
        return '';
    }

    return JSON.stringify(currentQuestion, null, 2);
}

function buildCloudPilotInstructions(context) {
    const sections = [];

    if (context.cloudPilot && context.cloudPilot.text) {
        sections.push('CLOUD PILOT: Context\n----------------\n' + context.cloudPilot.text);
    }

    if (context.currentQuestion) {
        sections.push(
            'CURRENT SITUATION: Context\n----------------\n' + formatSituationSection(context.currentQuestion)
        );
    }

    if (hasOrganizationKnowledge(context.organizationKnowledgeContext)) {
        sections.push(
            'ORGANIZATIONAL KNOWLEDGE: Context\n----------------\n' +
                JSON.stringify(
                    {
                        organization: context.organizationKnowledgeContext
                    },
                    null,
                    2
                )
        );
    }

    return sections.join('\n\n');
}

module.exports = {
    buildCloudPilotInstructions
};
