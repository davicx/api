const actionMap = require('../actionMap');

/*
FUNCTIONS A: Open Requests Question fulfillment
    1) Function A1: buildOpenRequestsResponse

Grounded answer from already-loaded request state (requests/ owns the data).
Does not invent rows. Does not create / update / close requests.
Always Internal — never uses CLOUDPILOT_MESSAGE_RESPONSE / general OpenAI chat.
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
    const status = state.status || 'unknown';
    const missing = Array.isArray(state.missing) ? state.missing : [];
    const workflowId = state.workflowId || null;

    const lines = [
        'You have 1 open request:',
        '',
        '• ' + actionLabel,
        '  Status: ' + formatStatus(status)
    ];

    if (missing.length > 0) {
        lines.push('  Missing: ' + missing.join(', '));
    }

    if (workflowId !== null && workflowId !== undefined && String(workflowId).trim() !== '') {
        lines.push('  Request ID: ' + String(workflowId));
    }

    if (missing.length > 0) {
        lines.push('');
        lines.push(
            'Say the missing field (for example region: "us-west-2"), or ask "what\'s the status?"'
        );
    }

    return {
        success: true,
        cloudPilotMessage: lines.join('\n'),
        atlasResponse: null,
        error: null
    };
}

function formatStatus(status) {
    const raw = String(status || '').trim();

    if (!raw) {
        return 'unknown';
    }

    return raw.replace(/_/g, ' ');
}

module.exports = {
    buildOpenRequestsResponse
};
