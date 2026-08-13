const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');

/*
TYPE 3 — KNOWLEDGE (organization slice + product slice)
Role: What background should CloudPilot know before answering?

Organization: Loaded S3 org facts for this turn (search → DB resolve).
Product: AWS rule meanings from services/knowledge/ later.

MVP: organization comes from processMessageContext.organizationKnowledge
when General Chat resolved a hit. product [].

Do not confuse with Situation (live state) or Identity (product voice).

Used by: buildAIContext → buildAISystemMessage → AI (KNOWLEDGE section)
Doc: feature_organizational_knowledge.md Step 4
*/

/*
FUNCTIONS A: Knowledge context
    1) Function A1: getOrganizationKnowledgeData
    2) Function A2: getKnowledgeContext
*/

//Function A1: Organization knowledge slice for this turn (facts already loaded)
function getOrganizationKnowledgeData(processMessageContext) {
    const context = processMessageContext || {};
    const loaded = context.organizationKnowledge;

    if (!loaded || typeof loaded !== 'object') {
        return {};
    }

    const status = String(loaded.status || '').trim();

    if (status !== 'found' && status !== 'ambiguous') {
        return {};
    }

    if (!loaded.contextBlock || !String(loaded.contextBlock).trim()) {
        return {};
    }

    const organization = {
        status: status,
        resourceReference: loaded.resourceReference || '',
        matchedBy: loaded.matchedBy || null,
        contextBlock: String(loaded.contextBlock).trim()
    };

    if (loaded.record && loaded.record.resourceName) {
        organization.resourceName = loaded.record.resourceName;
    }

    return organization;
}

//Function A2: Return structured Knowledge context (data only)
function getKnowledgeContext(processMessageContext) {
    const organization = getOrganizationKnowledgeData(processMessageContext);
    const product = [];

    const knowledge = {
        loaded: true,
        type: 'knowledge',
        data: {
            organization: organization,
            product: product
        }
    };

    if (CLOUDPILOT_AI_CONFIG.contextLogs) {
        console.log('Building Knowledge Context');
        console.log(JSON.stringify(knowledge, null, 2));
    }

    return knowledge;
}

module.exports = {
    getOrganizationKnowledgeData,
    getKnowledgeContext
};
