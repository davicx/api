/*
Turn CloudPilot context into the English system message for the AI.

Keep this file dumb: no AWS logic, no business rules.
Intelligence lives in contextTypes/ builders and services/knowledge/.

Conceptual sections:
  IDENTITY         — Who is CloudPilot?              (cloudPilotContext)
  SITUATION        — What should AI look for / do?   (cloudPilotSituationContext)
  CURRENT QUESTION — What did the user say?          (currentQuestionContext)
  Knowledge        — Optional organization/product   (organizationKnowledgeContext)

FUNCTIONS A: Build AI system message
    1) Function A1: buildAISystemMessage

FUNCTIONS B: Write each part of the message
    1) Function B1: writeIdentity
    2) Function B2: writeSituation
    3) Function B3: writeCurrentQuestion
    4) Function B4: writeKnowledge

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
//Function B1: Write Identity (Who is CloudPilot?)
function writeIdentity(cloudPilotContext) {
    const identity = cloudPilotContext && cloudPilotContext.data;

    if (!identity) {
        return '';
    }

    const sections = [`You are ${identity.name || 'CloudPilot'}.`];

    if (identity.role) {
        sections.push('Role: ' + identity.role + '.');
    }

    if (identity.productDescription) {
        sections.push('About this product: ' + identity.productDescription);
    }

    const capabilities = writeBulletList(identity.capabilities);
    if (capabilities) {
        sections.push('Actual CloudPilot capabilities:\n' + capabilities);
    }

    if (identity.communication && identity.communication.tone) {
        sections.push('Communication tone: ' + identity.communication.tone + '.');
    }

    if (identity.communication && identity.communication.defaultLength) {
        sections.push(
            'Default response length: ' + identity.communication.defaultLength + '.'
        );
    }

    if (identity.communication && identity.communication.formatting) {
        sections.push(
            'Formatting: ' + identity.communication.formatting + '.'
        );
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

//Function B2: Write Situation (What should AI look for / do?)
function writeSituation(situationContext) {
    const data = situationContext && situationContext.data;

    if (!hasContent(data)) {
        return '';
    }

    const sections = [];
    const keys = Object.keys(data);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const piece = data[key];

        if (!piece || typeof piece !== 'object') {
            continue;
        }

        const pieceSections = [String(key).toUpperCase()];

        if (piece.purpose) {
            pieceSections.push(piece.purpose);
        }

        const rules = writeBulletList(piece.rules);
        if (rules) {
            pieceSections.push('Rules:\n' + rules);
        }

        sections.push(pieceSections.join('\n\n'));
    }

    if (sections.length === 0) {
        return '';
    }

    return 'SITUATION\n\n' + sections.join('\n\n');
}

//Function B3: Write Current Question (What did the user say?)
function writeCurrentQuestion(currentQuestionContext) {
    const data = currentQuestionContext && currentQuestionContext.data;

    if (!hasContent(data)) {
        return '';
    }

    const sections = [];

    if (data.userMessage) {
        sections.push('Current user message:\n"' + data.userMessage + '"');
    }

    if (data.selectedFinding && typeof data.selectedFinding === 'object') {
        const finding = data.selectedFinding;
        const bullets = [];

        if (finding.ruleId) {
            bullets.push('Rule: ' + finding.ruleId);
        }
        if (finding.service) {
            bullets.push('Service: ' + finding.service);
        }
        if (finding.instanceId) {
            bullets.push('Instance: ' + finding.instanceId);
        }
        if (finding.name || finding.resourceName) {
            bullets.push('Name: ' + (finding.name || finding.resourceName));
        }
        if (finding.title) {
            bullets.push('Title: ' + finding.title);
        }
        if (finding.cpuAverage != null || finding.cpu != null) {
            bullets.push('CPU average: ' + (finding.cpuAverage != null ? finding.cpuAverage : finding.cpu));
        }
        if (finding.lookbackDays != null) {
            bullets.push('Lookback days: ' + finding.lookbackDays);
        }
        if (finding.currentType) {
            bullets.push('Current type: ' + finding.currentType);
        }
        if (finding.recommendedType) {
            bullets.push('Recommended type: ' + finding.recommendedType);
        }
        if (finding.estimatedSavings != null) {
            bullets.push('Estimated savings: ' + finding.estimatedSavings);
        }
        if (finding.region) {
            bullets.push('Region: ' + finding.region);
        }

        if (bullets.length > 0) {
            sections.push(
                'The user is currently looking at a finding:\n' + writeBulletList(bullets)
            );
        }
    }

    if (data.openRequest && typeof data.openRequest === 'object') {
        const request = data.openRequest;
        const bullets = [];

        if (request.action) {
            bullets.push('Action: ' + request.action);
        }
        if (request.status) {
            bullets.push('Status: ' + request.status);
        }
        if (Array.isArray(request.missing) && request.missing.length > 0) {
            bullets.push('Missing fields: ' + request.missing.join(', '));
        }
        if (request.region) {
            bullets.push('Region: ' + request.region);
        }

        if (bullets.length > 0) {
            sections.push(
                'Current CloudPilot request:\n' +
                    writeBulletList(bullets) +
                    '\nUse this only when it helps answer the current message.'
            );
        }
    }

    if (sections.length === 0) {
        return '';
    }

    return 'CURRENT QUESTION\n\n' + sections.join('\n\n');
}

//Function B4: Write Knowledge (organization + product background)
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

    const situationText = writeSituation(aiContext && aiContext.situation);
    if (situationText) {
        sections.push(situationText);
    }

    const currentQuestionText = writeCurrentQuestion(aiContext && aiContext.currentQuestion);
    if (currentQuestionText) {
        sections.push(currentQuestionText);
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
