const actionMap = require('../masterCloudPilotCapabilities');

/*
FUNCTIONS A: CloudPilot State Question — open requests
    1) Function A1: buildOpenRequestsResponse

Question subtype: CloudPilot State Question
  ("What open requests do I have?")

Grounded answer from already-loaded request state (requests/ owns the data).
Does not invent rows. Does not create / update / close requests.
Always Internal — never uses CLOUDPILOT_MESSAGE_RESPONSE / general OpenAI chat.

See questions/README.md for locked Understanding vocabulary + Question types.
*/

//Function A1: Build chat reply for LIST_OPEN_REQUESTS
function buildOpenRequestsResponse(requestState) {
    const state = requestState || {};
    const pendingAction = state.pendingAction || null;

    if (!pendingAction) {
        return {
            success: true,
            cloudPilotMessage: 'You have no open requests right now.',
            atlasResponse: null,
            error: null
        };
    }

    const actionDefinition = actionMap[pendingAction] || null;
    const actionLabel =
        actionDefinition && actionDefinition.actionLabel
            ? actionDefinition.actionLabel
            : String(pendingAction);
    const missing = Array.isArray(state.missing) ? state.missing : [];

    // No Request ID unless the user asks for details (feature_cloud_pilot_context Step D)
    const lines = ['You have 1 open request:', ''];

    if (missing.length > 0) {
        lines.push(actionLabel + ' — waiting for ' + formatWaitingFor(missing) + '.');
        lines.push('');
        if (missing.indexOf('region') !== -1) {
            lines.push('You can reply with something like us-west-2 to continue.');
        } else {
            lines.push('Reply with the missing information to continue.');
        }
    } else {
        lines.push(actionLabel + '.');
    }

    return {
        success: true,
        cloudPilotMessage: lines.join('\n'),
        atlasResponse: null,
        error: null
    };
}

function formatWaitingFor(missing) {
    if (!Array.isArray(missing) || missing.length === 0) {
        return 'more information';
    }

    if (missing.length === 1) {
        return 'a ' + String(missing[0]).replace(/_/g, ' ');
    }

    return missing
        .map(function (field) {
            return String(field).replace(/_/g, ' ');
        })
        .join(', ');
}

module.exports = {
    buildOpenRequestsResponse
};
