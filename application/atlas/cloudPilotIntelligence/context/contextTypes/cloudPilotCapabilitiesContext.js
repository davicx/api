const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');
const masterCloudPilotCapabilities = require('../../../cloudPilot/masterCloudPilotCapabilities');

/*
TYPE — CAPABILITIES (what CloudPilot can do / retrieve)

Projects ONLY model-relevant fields from masterCloudPilotCapabilities.js.
Does not include match, executionFunction, messages, or handlers.

Used by: buildAIContext → buildAISystemMessage → Final Response (General Chat)
*/

const CAPABILITIES_GROUNDING_RULE =
    'Do not invent AWS services, actions, or facts outside this capabilities list.';

//Function A1: Project master capabilities into model-facing context
function getCloudPilotCapabilitiesContext() {
    const capabilities = [];
    const keys = Object.keys(masterCloudPilotCapabilities);

    for (let i = 0; i < keys.length; i++) {
        const definition = masterCloudPilotCapabilities[keys[i]];

        if (!definition || typeof definition !== 'object') {
            continue;
        }

        if (definition.allowed !== true) {
            continue;
        }

        const actionType = definition.type
            ? String(definition.type)
            : String(keys[i]);

        if (actionType === 'general_chat' || actionType === 'show_capabilities') {
            continue;
        }

        // Skip helper exports on the module (functions)
        if (typeof definition === 'function') {
            continue;
        }

        const capability =
            definition.capability && typeof definition.capability === 'object'
                ? definition.capability
                : {};

        const entry = {
            action: actionType,
            label: definition.actionLabel
                ? String(definition.actionLabel)
                : actionType,
            description: capability.description
                ? String(capability.description).trim()
                : ''
        };

        if (Array.isArray(capability.cloudPilotCanAnswer)) {
            entry.canAnswer = capability.cloudPilotCanAnswer
                .map(function (item) {
                    return String(item);
                })
                .filter(Boolean);
        }

        if (capability.scope) {
            entry.scope = String(capability.scope).trim();
        }

        capabilities.push(entry);
    }

    const context = {
        loaded: true,
        type: 'capabilities',
        data: {
            capabilities: capabilities,
            groundingRule: CAPABILITIES_GROUNDING_RULE
        }
    };

    if (CLOUDPILOT_AI_CONFIG.contextLogs) {
        console.log('Building Capabilities Context');
        console.log(JSON.stringify(context, null, 2));
    }

    return context;
}

module.exports = {
    getCloudPilotCapabilitiesContext,
    CAPABILITIES_GROUNDING_RULE
};
