/*
Turn CloudPilot context into the English system message for the AI.

Keep this file dumb: no AWS logic, no business rules.
Intelligence lives in contextTypes/ builders and services/knowledge/.

FUNCTIONS A: Build AI system message
    1) Function A1: buildAISystemMessage

FUNCTIONS B: Write each part of the message
    1) Function B1: writeIdentity
    2) Function B2: writeSituation
    3) Function B3: writeKnowledge

FUNCTIONS C: Small helpers
    1) Function C1: writeBulletList
    2) Function C2: hasContent
*/

//FUNCTIONS C: Small helpers
//Function C1: Write a bullet list from string items
function writeBulletList(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return '';
    }

    return items.map(function (item) {
        return '- ' + item;
    }).join('\n');
}

//Function C2: True when this block should appear in the system message
function hasContent(data) {
    return (
        data &&
        typeof data === 'object' &&
        !Array.isArray(data) &&
        Object.keys(data).length > 0
    );
}

//FUNCTIONS B: Write each part of the message
//Function B1: Write Identity (CloudPilot personality)
function writeIdentity(cloudPilotContext) {
    const identity = cloudPilotContext && cloudPilotContext.data;

    if (!identity) {
        return '';
    }

    const sections = [`You are ${identity.name || 'CloudPilot'}.`];

    if (identity.role) {
        sections.push('Role: ' + identity.role + '.');
    }

    if (identity.communication && identity.communication.tone) {
        sections.push('Communication tone: ' + identity.communication.tone + '.');
    }

    const goals = writeBulletList(identity.goals);
    if (goals) {
        sections.push('Goals:\n' + goals);
    }

    const principles = writeBulletList(identity.principles);
    if (principles) {
        sections.push('Communication principles:\n' + principles);
    }

    const constraints = writeBulletList(identity.constraints);
    if (constraints) {
        sections.push('Constraints:\n' + constraints);
    }

    return sections.join('\n\n');
}

//Function B2: Write Situation (what CloudPilot knows about this turn)
function writeSituation(currentQuestionContext) {
    const data = currentQuestionContext && currentQuestionContext.data;

    if (!hasContent(data)) {
        return '';
    }

    const lines = Object.keys(data).map(function (key) {
        return key + ': ' + JSON.stringify(data[key]);
    });

    return 'Current CloudPilot situation:\n' + lines.join('\n');
}

//Function B3: Write Knowledge (organization + product background)
function writeKnowledge(knowledgeContext) {
    const data = knowledgeContext && knowledgeContext.data;

    if (!data) {
        return '';
    }

    const sections = [];
    const organization = data.organization;
    const product = data.product;

    if (hasContent(organization)) {
        sections.push(
            'Organization knowledge:\n' + JSON.stringify(organization, null, 2)
        );
    }

    if (Array.isArray(product) && product.length > 0) {
        sections.push('Product knowledge:\n' + JSON.stringify(product, null, 2));
    }

    return sections.join('\n\n');
}

//FUNCTIONS A: Build AI system message
//Function A1: Build AI system message from collected context
function buildAISystemMessage(aiContext) {
    const sections = [];

    const identityText = writeIdentity(aiContext && aiContext.cloudPilot);
    if (identityText) {
        sections.push(identityText);
    }

    const situationText = writeSituation(aiContext && aiContext.currentQuestion);
    if (situationText) {
        sections.push(situationText);
    }

    const knowledgeText = writeKnowledge(aiContext && aiContext.knowledge);
    if (knowledgeText) {
        sections.push(knowledgeText);
    }

    return sections.join('\n\n');
}

module.exports = {
    buildAISystemMessage
};
