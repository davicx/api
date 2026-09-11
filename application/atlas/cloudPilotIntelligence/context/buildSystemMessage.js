/*
Turn CloudPilot context into the English system message for the AI.

Keep this file dumb: no AWS logic, no business rules.
Intelligence lives in contextTypes/ builders and services/knowledge/.

Conceptual sections (render order locked):
  IDENTITY         — Who is CloudPilot?              (cloudPilotContext)
  CAPABILITIES     — What can I do / retrieve?       (cloudPilotCapabilitiesContext)
  SITUATION        — What should AI look for / do?   (cloudPilotSituationContext)
  CURRENT STATE    — Factual open request (Chat)     (cloudPilotCurrentStateContext)
  CURRENT QUESTION — What did the user say?          (currentQuestionContext)
  Knowledge        — Optional organization/product   (organizationKnowledgeContext)

FUNCTIONS A: Build AI system message
    1) Function A1: buildAISystemMessage

FUNCTIONS B: Write each part of the message
    1) Function B1: writeIdentity
    2) Function B1a: writeCapabilities
    3) Function B1b: writeCurrentState
    4) Function B2: writeSituation
    5) Function B3: writeCurrentQuestion
    6) Function B4: writeKnowledge

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
//Function B1: Write Identity (Who is CloudPilot?) — General Chat voice
// Doc: feature_cloud_pilot_context.md Step A — not used by Search
function writeIdentity(cloudPilotContext) {
    const identity = cloudPilotContext && cloudPilotContext.data;

    if (!identity) {
        return '';
    }

    const name = identity.name || 'CloudPilot';
    const intro = identity.intro
        ? String(identity.intro).trim()
        : 'an AI assistant for understanding and managing AWS infrastructure';

    const sections = [
        'You are ' + name + ', ' + intro + '.'
    ];

    const voice = writeBulletList(identity.voice);
    if (voice) {
        sections.push('VOICE\n\n' + voice);
    }

    const productParts = [];
    if (identity.productDescription) {
        productParts.push(String(identity.productDescription).trim());
    }
    const modes = writeBulletList(identity.executionModes);
    if (modes) {
        productParts.push('CloudPilot may carry out work through:\n' + modes);
    }
    if (productParts.length > 0) {
        sections.push('CLOUDPILOT\n\n' + productParts.join('\n\n'));
    }

    const grounding = writeBulletList(identity.grounding);
    if (grounding) {
        sections.push('GROUNDING\n\n' + grounding);
    }

    const conversation = writeBulletList(identity.conversation);
    if (conversation) {
        sections.push('CONVERSATION\n\n' + conversation);
    }

    return sections.join('\n\n');
}

//Function B1a: Write Capabilities (what CloudPilot can do / retrieve)
function writeCapabilities(capabilitiesContext) {
    const data = capabilitiesContext && capabilitiesContext.data;

    if (!data || !Array.isArray(data.capabilities) || data.capabilities.length === 0) {
        return '';
    }

    const lines = ['AVAILABLE CLOUDPILOT CAPABILITIES', ''];
    const capabilities = data.capabilities;

    for (let i = 0; i < capabilities.length; i++) {
        const entry = capabilities[i] || {};
        const label = entry.label ? String(entry.label).trim() : '';
        const action = entry.action ? String(entry.action).trim() : '';
        const description = entry.description ? String(entry.description).trim() : '';

        if (label && description && description !== label) {
            lines.push(label + ' — ' + description);
        } else if (label) {
            lines.push(label);
        } else if (action) {
            lines.push(action);
        } else {
            continue;
        }

        if (Array.isArray(entry.canAnswer) && entry.canAnswer.length > 0) {
            lines.push('Can answer:');
            for (let j = 0; j < entry.canAnswer.length; j++) {
                lines.push('- ' + String(entry.canAnswer[j]));
            }
        }

        if (entry.scope) {
            lines.push('Scope:');
            lines.push(String(entry.scope).trim());
        }

        lines.push('');
    }

    if (data.groundingRule) {
        lines.push(String(data.groundingRule).trim());
    }

    return lines.join('\n').trim();
}

//Function B1b: Write Current State (factual open request — Chat Situation MVP)
// Doc: feature_cloud_pilot_context.md Step D — facts only, not prose instructions
// Friendly Create Step 4: optional create_ec2 knowledge facts when that request is open
function writeCurrentState(currentStateContext) {
    const data = currentStateContext && currentStateContext.data;
    const hasOpenRequestFlag = data && data.hasOpenRequest === true;
    const openRequest = data && data.openRequest;
    const createEc2 = data && data.createEc2;

    const hasOpenRequest =
        hasOpenRequestFlag || (openRequest && typeof openRequest === 'object');
    const hasCreateEc2 = createEc2 && typeof createEc2 === 'object';

    if (!hasOpenRequest && !hasCreateEc2 && data && data.hasOpenRequest !== false) {
        return '';
    }

    const lines = ['CURRENT CLOUDPILOT STATE', ''];

    if (data && Object.prototype.hasOwnProperty.call(data, 'hasOpenRequest')) {
        lines.push('HAS OPEN REQUEST: ' + (hasOpenRequest ? 'YES' : 'NO'));
        lines.push('');
    }

    if (hasOpenRequest && openRequest && typeof openRequest === 'object') {
        const label = openRequest.label ? String(openRequest.label).trim() : '';
        const action = openRequest.action ? String(openRequest.action).trim() : '';
        const status = openRequest.status ? String(openRequest.status).trim() : '';

        lines.push('Open request:');

        if (label) {
            lines.push('Action: ' + label + (action && action !== label ? ' (' + action + ')' : ''));
        } else if (action) {
            lines.push('Action: ' + action);
        }

        if (status) {
            lines.push('Status: ' + status);
        }

        if (openRequest.executionMode) {
            lines.push('Execution mode: ' + String(openRequest.executionMode));
        }

        const collected =
            openRequest.collected && typeof openRequest.collected === 'object'
                ? openRequest.collected
                : {};
        const collectedNames = Object.keys(collected);

        if (collectedNames.length > 0) {
            lines.push('Collected:');
            for (let i = 0; i < collectedNames.length; i++) {
                const fieldName = collectedNames[i];
                const value = collected[fieldName];

                if (value == null || typeof value === 'object') {
                    continue;
                }

                lines.push('- ' + fieldName + ': ' + String(value));
            }
        }

        const missing = Array.isArray(openRequest.missing)
            ? openRequest.missing
            : Array.isArray(openRequest.waitingFor)
              ? openRequest.waitingFor
              : [];

        if (missing.length > 0) {
            lines.push('Missing: ' + missing.join(', '));
        } else if (hasOpenRequest) {
            lines.push('Missing: none');
        }

        lines.push('');
    }

    if (hasCreateEc2) {
        lines.push('Create EC2 knowledge (facts only):');

        if (createEc2.meaning) {
            lines.push('- Meaning: ' + String(createEc2.meaning).trim());
        }

        if (Array.isArray(createEc2.choiceFields) && createEc2.choiceFields.length > 0) {
            for (let i = 0; i < createEc2.choiceFields.length; i++) {
                const choice = createEc2.choiceFields[i];
                const choiceLabel = choice.label || choice.field || 'Field';
                const choiceSummary = choice.summary ? String(choice.summary).trim() : '';
                lines.push(
                    '- Choice — ' +
                        choiceLabel +
                        (choiceSummary ? ': ' + choiceSummary : '')
                );
            }
        }

        if (createEc2.demoDefaultInstanceType) {
            lines.push(
                '- Demo default instance type: ' +
                    String(createEc2.demoDefaultInstanceType).trim() +
                    (createEc2.instanceTypeIsDemoDefault
                        ? ' (demo default, not a workload recommendation)'
                        : '')
            );
        }

        if (createEc2.neverInventPrices) {
            lines.push('- Do not invent prices or cost estimates.');
        }

        if (createEc2.showEstimateOnlyWhenKnown) {
            lines.push('- Show an estimated compute cost only when known.');
        }

        if (createEc2.neverClaimSecureUnlessKnown) {
            lines.push('- Do not claim the instance is secure unless protections are known.');
        }

        lines.push('');
    }

    lines.push(
        'Use this information only when relevant to the user\'s current question.'
    );

    return lines.join('\n');
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
        if (organization.contextBlock) {
            sections.push(String(organization.contextBlock).trim());
        } else {
            sections.push(
                'Organization knowledge:\n' + JSON.stringify(organization, null, 2)
            );
        }
    }

    if (Array.isArray(product) && product.length > 0) {
        sections.push('Product knowledge:\n' + JSON.stringify(product, null, 2));
    }

    if (sections.length === 0) {
        return '';
    }

    return 'KNOWLEDGE\n\n' + sections.join('\n\n');
}

//FUNCTIONS A: Build AI system message
//Function A1: Build AI system message from collected context
// Order: Identity → Capabilities → Situation → Current State → Current Question → Knowledge
function buildAISystemMessage(aiContext) {
    const sections = [];

    const identityText = writeIdentity(aiContext && aiContext.cloudPilot);
    if (identityText) {
        sections.push(identityText);
    }

    const capabilitiesText = writeCapabilities(aiContext && aiContext.capabilities);
    if (capabilitiesText) {
        sections.push(capabilitiesText);
    }

    const situationText = writeSituation(aiContext && aiContext.situation);
    if (situationText) {
        sections.push(situationText);
    }

    const currentStateText = writeCurrentState(aiContext && aiContext.currentState);
    if (currentStateText) {
        sections.push(currentStateText);
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
