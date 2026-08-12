/*
Turn CloudPilot context into the English system message for the AI.

Keep this file dumb: no AWS logic, no business rules.
Intelligence lives in contextTypes/ builders and services/knowledge/.

Conceptual sections:
  IDENTITY         — Who is CloudPilot?              (cloudPilotContext)
  SITUATION        — What should AI look for / do?   (cloudPilotSituationContext)
  CURRENT STATE    — Factual open request (Chat)     (cloudPilotCurrentStateContext)
  CURRENT QUESTION — What did the user say?          (currentQuestionContext)
  Knowledge        — Optional organization/product   (organizationKnowledgeContext)

FUNCTIONS A: Build AI system message
    1) Function A1: buildAISystemMessage

FUNCTIONS B: Write each part of the message
    1) Function B1: writeIdentity
    2) Function B1b: writeCurrentState
    3) Function B2: writeSituation
    4) Function B3: writeCurrentQuestion
    5) Function B4: writeKnowledge

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

//Function B1b: Write Current State (factual open request — Chat Situation MVP)
// Doc: feature_cloud_pilot_context.md Step D — facts only, not prose instructions
// Friendly Create Step 4: optional create_ec2 knowledge facts when that request is open
function writeCurrentState(currentStateContext) {
    const data = currentStateContext && currentStateContext.data;
    const openRequest = data && data.openRequest;
    const createEc2 = data && data.createEc2;

    const hasOpenRequest = openRequest && typeof openRequest === 'object';
    const hasCreateEc2 = createEc2 && typeof createEc2 === 'object';

    if (!hasOpenRequest && !hasCreateEc2) {
        return '';
    }

    const lines = ['CURRENT CLOUDPILOT STATE', ''];

    if (hasOpenRequest) {
        const label = openRequest.label ? String(openRequest.label).trim() : '';

        if (label) {
            lines.push('Open request:');
            lines.push(label);

            if (Array.isArray(openRequest.waitingFor) && openRequest.waitingFor.length > 0) {
                lines.push('Waiting for: ' + openRequest.waitingFor.join(', '));
            }

            lines.push('');
        }
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

    const knowledgeText = writeKnowledge(aiContext && aiContext.knowledge);
    if (knowledgeText) {
        sections.push(knowledgeText);
    }

    const currentStateText = writeCurrentState(aiContext && aiContext.currentState);
    if (currentStateText) {
        sections.push(currentStateText);
    }

    const currentQuestionText = writeCurrentQuestion(aiContext && aiContext.currentQuestion);
    if (currentQuestionText) {
        sections.push(currentQuestionText);
    }

    return sections.join('\n\n');
}

module.exports = {
    buildAISystemMessage
};
