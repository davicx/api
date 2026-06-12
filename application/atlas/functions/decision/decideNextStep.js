const actionRegistry = require('../actions/actionRegistry');
const ActionStatusFunctions = require('../actionStatusFunctions');
const { ROUTE, RESPONSE_TYPE, EXECUTION_MODE_REPLIES } = require('./decisionTypes');

/*
FUNCTIONS A: Decision layer — target request state + response type (no DB, no chat, no Atlas)
    1) Function A1: decideNextStep

FUNCTIONS B: Helpers
    1) Function B1: normalizeRequestState
    2) Function B2: buildRequestFromState
    3) Function B3: shouldStartNewRequest
    4) Function B4: hasApplicableValues
    5) Function B5: mergeValuesIntoRequest
    6) Function B6: isReadyForExecutionMode
    7) Function B7: buildNewRequestDecision
    8) Function B8: buildFieldsMergedDecision
    9) Function B9: handleExecutionModeSelection
    10) Function B10: resolveRequestChat
    11) Function B11: shouldStartImmediateExecution
*/

//Function A1: Given understanding + loaded request state, return route, target request, and response type
function decideNextStep({ understanding, requestState }) {
    const state = normalizeRequestState(requestState);
    const u = understanding || {};

    if (u.ambiguous) {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.AMBIGUOUS_ACTION);
    }

    if (u.conversation === 'list_open') {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.LIST_OPEN_REQUESTS);
    }

    if (u.conversation === 'focus_switch') {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.FOCUS_REQUEST);
    }

    if (u.conversation === 'status') {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.REQUEST_STATUS);
    }

    if (state.pendingAction && state.status === ActionStatusFunctions.STATUS.RUNNING) {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.WORKFLOW_RUNNING);
    }

    if (u.reply === 'cancel' && state.pendingAction) {
        return {
            route: ROUTE.CLOUDPILOT,
            request: null,
            response: { type: RESPONSE_TYPE.REQUEST_CANCELLED },
            closeRequest: true
        };
    }

    if (
        state.pendingAction &&
        state.status === ActionStatusFunctions.STATUS.FAILED &&
        u.reply === 'confirm'
    ) {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.REQUEST_FAILED);
    }

    if (state.pendingAction && EXECUTION_MODE_REPLIES.includes(u.reply) && isReadyForExecutionMode(state)) {
        return handleExecutionModeSelection(state, u.reply);
    }

    if (
        state.pendingAction &&
        u.reply === 'confirm' &&
        ActionStatusFunctions.isWaitingOnConfirmation(state.status) &&
        state.executionMode === 'automatic'
    ) {
        const request = buildRequestFromState(state);
        request.status = ActionStatusFunctions.STATUS.RUNNING;

        return cloudpilotDecision(request, RESPONSE_TYPE.EXECUTION_STARTED);
    }

    if (shouldStartImmediateExecution(state, u)) {
        return {
            route: ROUTE.CLOUDPILOT,
            request: null,
            response: { type: RESPONSE_TYPE.IMMEDIATE_EXECUTION },
            execute: { action: 'inventory_aws' }
        };
    }

    if (u.action && u.action !== 'general_chat' && shouldStartNewRequest(state, u.action)) {
        return buildNewRequestDecision(u);
    }

    if (state.pendingAction && u.action && u.action === state.pendingAction) {
        return resolveRequestChat(state);
    }

    if (state.pendingAction && hasApplicableValues(state, u.values)) {
        return buildFieldsMergedDecision(state, u.values);
    }

    if (state.pendingAction) {
        return resolveRequestChat(state);
    }

    return {
        route: ROUTE.OPENAI,
        request: null,
        response: { type: RESPONSE_TYPE.GENERAL_CHAT }
    };
}

//Function B1: Normalize loaded request state into a consistent shape
function normalizeRequestState(requestState) {
    const state = requestState || {};

    return {
        pendingAction: state.pendingAction || null,
        status: state.status || null,
        executionMode: state.executionMode || null,
        workflowId: state.workflowId || null,
        missing: Array.isArray(state.missing) ? state.missing.slice() : [],
        collected: { ...(state.collected || {}) },
        asked: { ...(state.asked || {}) }
    };
}

//Function B2: Map loaded state to decision request target
function buildRequestFromState(state) {
    const missing = state.missing || [];

    return {
        action: state.pendingAction,
        collected: { ...(state.collected || {}) },
        missing: missing.slice(),
        ready: missing.length === 0,
        status: state.status,
        executionMode: state.executionMode || null
    };
}

//Function B3: Should we start or replace the active request with a new action?
function shouldStartNewRequest(state, action) {
    const pendingAction = state.pendingAction;

    if (!pendingAction) {
        return true;
    }

    if (pendingAction !== action) {
        return true;
    }

    if (state.status === ActionStatusFunctions.STATUS.COMPLETED) {
        return true;
    }

    if (state.status === ActionStatusFunctions.STATUS.FAILED) {
        return true;
    }

    return false;
}

//Function B4: Do extracted values apply to the open request?
function hasApplicableValues(state, values) {
    if (!values || typeof values !== 'object') {
        return false;
    }

    const missing = state.missing || [];
    const actionDefinition = actionRegistry[state.pendingAction];
    const requiredFields = actionDefinition && Array.isArray(actionDefinition.requiredFields)
        ? actionDefinition.requiredFields
        : [];

    for (const fieldName of Object.keys(values)) {
        const fieldValue = values[fieldName];

        if (fieldValue == null || fieldValue === '') {
            continue;
        }

        if (missing.includes(fieldName) || requiredFields.includes(fieldName)) {
            return true;
        }
    }

    return false;
}

//Function B5: Merge understanding values into collected / missing
function mergeValuesIntoRequest(collected, requiredFields, values, defaults, currentMissing) {
    const newCollected = { ...(defaults || {}), ...(collected || {}) };
    const missingSet = new Set(
        Array.isArray(currentMissing) && currentMissing.length > 0
            ? currentMissing
            : requiredFields.filter((fieldName) => {
                const fieldValue = newCollected[fieldName];
                return fieldValue == null || fieldValue === '';
            })
    );

    if (values) {
        for (const fieldName of Object.keys(values)) {
            const fieldValue = values[fieldName];

            if (fieldValue == null || fieldValue === '') {
                continue;
            }

            if (requiredFields.includes(fieldName) || missingSet.has(fieldName)) {
                newCollected[fieldName] = fieldValue;
                missingSet.delete(fieldName);
            }
        }
    }

    const missing = requiredFields.filter((fieldName) => {
        const fieldValue = newCollected[fieldName];
        return fieldValue == null || fieldValue === '';
    });

    return { collected: newCollected, missing };
}

//Function B6: Is the user allowed to pick execution mode 1–4 right now?
function isReadyForExecutionMode(state) {
    const actionDefinition = actionRegistry[state.pendingAction];
    const supportsExecutionModes = actionRegistry.actionRequiresExecutionModeSelection(actionDefinition);

    if (!supportsExecutionModes) {
        return false;
    }

    if (ActionStatusFunctions.isWaitingOnExecutionMode(state.status)) {
        return true;
    }

    const ready = (state.missing || []).length === 0;

    return ready && !state.executionMode;
}

//Function B7: Target state for a brand-new workflow request
function buildNewRequestDecision(understanding) {
    const action = understanding.action;
    const actionDefinition = actionRegistry[action];
    const requiredFields = actionDefinition && Array.isArray(actionDefinition.requiredFields)
        ? actionDefinition.requiredFields
        : [];
    const defaults = actionDefinition && actionDefinition.defaults ? actionDefinition.defaults : {};
    const supportsExecutionModes = actionRegistry.actionRequiresExecutionModeSelection(actionDefinition);

    const merged = mergeValuesIntoRequest({}, requiredFields, understanding.values, defaults);
    const ready = merged.missing.length === 0;

    let status = ActionStatusFunctions.STATUS.WAITING_ON_FIELDS;

    if (ready) {
        status = ActionStatusFunctions.statusWhenFieldsComplete(supportsExecutionModes, null);
    }

    const request = {
        action,
        collected: merged.collected,
        missing: merged.missing,
        ready,
        status,
        executionMode: null
    };

    let responseType = RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS;

    if (ready) {
        responseType = supportsExecutionModes
            ? RESPONSE_TYPE.AWAITING_EXECUTION_MODE
            : RESPONSE_TYPE.AWAITING_CONFIRMATION;
    }

    return cloudpilotDecision(request, responseType);
}

//Function B8: Target state after merging field values into an open request
function buildFieldsMergedDecision(state, values) {
    const actionDefinition = actionRegistry[state.pendingAction];
    const requiredFields = actionDefinition && Array.isArray(actionDefinition.requiredFields)
        ? actionDefinition.requiredFields
        : [];
    const supportsExecutionModes = actionRegistry.actionRequiresExecutionModeSelection(actionDefinition);

    const merged = mergeValuesIntoRequest(
        state.collected,
        requiredFields,
        values,
        null,
        state.missing
    );
    const ready = merged.missing.length === 0;

    let status = state.status;

    if (ready && ActionStatusFunctions.isCollectingFields(state.status)) {
        status = ActionStatusFunctions.statusWhenFieldsComplete(
            supportsExecutionModes,
            state.executionMode
        );
    }

    const request = {
        action: state.pendingAction,
        collected: merged.collected,
        missing: merged.missing,
        ready,
        status,
        executionMode: state.executionMode || null
    };

    let responseType = RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS;

    if (ready) {
        if (ActionStatusFunctions.isWaitingOnExecutionMode(status)) {
            responseType = RESPONSE_TYPE.AWAITING_EXECUTION_MODE;
        } else if (ActionStatusFunctions.isWaitingOnConfirmation(status)) {
            responseType = RESPONSE_TYPE.AWAITING_CONFIRMATION;
        }
    }

    return cloudpilotDecision(request, responseType);
}

//Function B9: User picked execution mode — modes 1–3 close request; mode 4 awaits confirmation
function handleExecutionModeSelection(state, mode) {
    const request = buildRequestFromState(state);
    request.executionMode = mode;

    if (mode === 'automatic') {
        request.status = ActionStatusFunctions.STATUS.WAITING_ON_CONFIRMATION;

        return cloudpilotDecision(request, RESPONSE_TYPE.AWAITING_CONFIRMATION);
    }

    request.status = ActionStatusFunctions.STATUS.COMPLETED;
    request.ready = true;

    const responseTypeByMode = {
        instructions: RESPONSE_TYPE.EXECUTION_INSTRUCTIONS,
        cli: RESPONSE_TYPE.EXECUTION_CLI,
        pr: RESPONSE_TYPE.EXECUTION_PR
    };

    return {
        route: ROUTE.CLOUDPILOT,
        request,
        response: { type: responseTypeByMode[mode] },
        closeRequest: true
    };
}

//Function B10: Open request with no state change — derive chat response from current state
function resolveRequestChat(state) {
    const request = buildRequestFromState(state);
    const actionDefinition = actionRegistry[state.pendingAction];
    const supportsExecutionModes = actionRegistry.actionRequiresExecutionModeSelection(actionDefinition);
    const ready = (state.missing || []).length === 0;

    let responseType = RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS;

    if (state.status === ActionStatusFunctions.STATUS.RUNNING) {
        responseType = RESPONSE_TYPE.WORKFLOW_RUNNING;
    } else if (state.status === ActionStatusFunctions.STATUS.FAILED) {
        responseType = RESPONSE_TYPE.REQUEST_FAILED;
    } else if (ready && supportsExecutionModes && !state.executionMode) {
        responseType = RESPONSE_TYPE.AWAITING_EXECUTION_MODE;
    } else if (ready && ActionStatusFunctions.isWaitingOnConfirmation(state.status)) {
        responseType = RESPONSE_TYPE.AWAITING_CONFIRMATION;
    } else if ((state.missing || []).length > 0) {
        responseType = RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS;
    } else if (ready) {
        responseType = RESPONSE_TYPE.AWAITING_CONFIRMATION;
    }

    return cloudpilotDecision(request, responseType);
}

//Function B11: inventory_aws — immediate execution, no request row
function shouldStartImmediateExecution(state, understanding) {
    if (understanding.action !== 'inventory_aws') {
        return false;
    }

    const actionDefinition = actionRegistry.inventory_aws;

    if (!actionDefinition || actionDefinition.requiresWorkflow || !actionDefinition.requiresExecution) {
        return false;
    }

    if (!state.pendingAction) {
        return true;
    }

    return ActionStatusFunctions.isTerminalStatus(state.status);
}

function cloudpilotDecision(request, responseType) {
    return {
        route: ROUTE.CLOUDPILOT,
        request,
        response: { type: responseType }
    };
}

module.exports = { decideNextStep };
