/*
TYPE 3 — KNOWLEDGE (organization slice)
Role: What company-specific background should CloudPilot know before answering?

Examples: Team tag required, Terraform-only, no prod auto-delete, change windows.
Source: database per org/group (groupID) — NOT in repo.

MVP: returns empty object. Product knowledge (AWS rules, rule meanings) lives separately
in services/knowledge/ and is merged into the KNOWLEDGE prompt section at build time.

Do not confuse with Situation (live state) or Identity (product voice).

Used by: buildConversationContext → buildCloudPilotInstructions → AI (KNOWLEDGE section)
*/

function getOrganizationKnowledgeContext() {
    return {};
}

module.exports = {
    getOrganizationKnowledgeContext
};
