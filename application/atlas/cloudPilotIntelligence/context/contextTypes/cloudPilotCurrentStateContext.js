const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');
const actionMap = require('../../../cloudPilot/actionMap');

/*
TYPE — CURRENT STATE (General Chat only)

Factual CloudPilot truth for this turn — not instructions, not personality.
Step D: tiny open-request block when one request is open.

Doc: feature_cloud_pilot_context.md

Used by: buildAIContext → buildAISystemMessage → General Chat
*/

//Function A1: Return structured Current State (data only)
function buildCurrentStateContext(processMessageContext) {
    const context = processMessageContext || {};
    const requestState = context.requestState;
    const openRequest = slimOpenRequestState(requestState);

    const data = {};

    if (openRequest) {
        data.openRequest = openRequest;
    }

    const currentState = {
        loaded: Boolean(openRequest),
        type: 'current_state',
        data: data
    };

    if (CLOUDPILOT_AI_CONFIG.contextLogs) {
        console.log('Building Current State Context');
        console.log(JSON.stringify(currentState, null, 2));
    }

    return currentState;
}

// Keep only boring facts for Chat Situation MVP
function slimOpenRequestState(requestState) {
    if (!requestState || typeof requestState !== 'object' || Array.isArray(requestState)) {
        return null;
    }

    const action = requestState.pendingAction || requestState.action || null;

    if (!action) {
        return null;
    }

    const actionKey = String(action);
    const actionDefinition = actionMap[actionKey] || null;
    const label =
        actionDefinition && actionDefinition.actionLabel
            ? String(actionDefinition.actionLabel)
            : actionKey;

    const slim = {
        label: label
    };

    if (Array.isArray(requestState.missing) && requestState.missing.length > 0) {
        slim.waitingFor = requestState.missing.map(function (field) {
            return String(field);
        });
    }

    return slim;
}

module.exports = {
    buildCurrentStateContext
};
