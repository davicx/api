const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');

/*
TYPE 3 — KNOWLEDGE (organization slice + product slice)
Role: What background should CloudPilot know before answering?

Organization: Team tag required, Terraform-only, etc. — database per org/group later.
Product: AWS rule meanings from services/knowledge/ later.

MVP: organization empty; product [].

Do not confuse with Situation (live state) or Identity (product voice).

Used by: buildAIContext → buildAISystemMessage → AI (KNOWLEDGE section)
*/

//Function A1: Organization knowledge slice (DB later)
function getOrganizationKnowledgeData() {
    return {};
}

//Function A2: Return structured Knowledge context (data only)
function getKnowledgeContext() {
    const organization = getOrganizationKnowledgeData();
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
