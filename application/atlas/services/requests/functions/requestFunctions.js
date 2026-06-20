const actionRegistry = require('../../actions/actionRegistry');
const Request = require('../classes/Request');
const ActionStateFunctions = require('./requestLoadFunctions');
const { RESPONSE_TYPE } = require('../../decision/decisionTypes');

/*
FUNCTIONS A: Apply STEP 4 decision to the database (STEP 5)
    1) Function A1: applyDecision

FUNCTIONS B: Create / update / close request rows (STEP 5–6)
    1) Function B1: startRequest
    2) Function B2: updateRequest
    3) Function B3: finishRequest

FUNCTIONS C: Helpers
    1) Function C1: copyObject
    2) Function C2: copyStringArray
    3) Function C3: buildDbUpdatesFromTargetRequest
    4) Function C4: buildFailedOutcome
    5) Function C5: buildSkipOutcome
    6) Function C6: resolveSkipReasonForNoRequest
    7) Function C7: requestTargetMatchesState
    8) Function C8: arraysMatchInOrder
*/

//Function A1: Route decision to start, update, or skip (D1 — finish/cancel in D2)
async function applyDecision(decision, context) {
    const requestState = context.requestState || ActionStateFunctions.emptyActionState();
    const conversationID = context.conversationID;
    const targetRequest = decision.request || null;

    if (decision.closeRequest === true) {
        return buildSkipOutcome(requestState, 'finish_cancel_deferred_d2');
    }

    if (decision.response && decision.response.type === RESPONSE_TYPE.REQUEST_CANCELLED) {
        return buildSkipOutcome(requestState, 'finish_cancel_deferred_d2');
    }

    if (decision.response && decision.response.type === RESPONSE_TYPE.IMMEDIATE_EXECUTION) {
        return buildSkipOutcome(requestState, 'immediate_execution_no_row');
    }

    if (!targetRequest || !targetRequest.action) {
        const reason = resolveSkipReasonForNoRequest(decision);
        return buildSkipOutcome(requestState, reason);
    }

    const hasOpenRequest = !ActionStateFunctions.actionStateIsEmpty(requestState);

    if (!hasOpenRequest) {
        return startRequest(decision, context);
    }

    if (decision.replaceOpenRequest === true) {
        await ActionStateFunctions.closeOpenActionBeforeStartingNew(conversationID);
        return startRequest(decision, context);
    }

    if (targetRequest.action !== requestState.pendingAction) {
        await ActionStateFunctions.closeOpenActionBeforeStartingNew(conversationID);
        return startRequest(decision, context);
    }

    if (requestTargetMatchesState(targetRequest, requestState)) {
        return buildSkipOutcome(requestState, 'no_request_change');
    }

    return updateRequest(decision, context);
}

//Function B1: Insert row and sync target state from decision.request
async function startRequest(decision, context) {
    const conversationID = context.conversationID;
    const processMessageContext = context.context || {};
    const targetRequest = decision.request;
    const actionType = targetRequest.action;
    const actionDefinition = actionRegistry[actionType];

    if (!actionDefinition) {
        return buildFailedOutcome('created', 'action_not_in_registry', null);
    }

    const requiredFields = [];
    const registryFields = actionDefinition.requiredFields || [];

    for (let i = 0; i < registryFields.length; i++) {
        requiredFields.push(registryFields[i]);
    }

    let displayName = null;

    if (actionDefinition.actionLabel) {
        displayName = actionDefinition.actionLabel;
    }

    const createOutcome = await Request.createAction({
        organization: processMessageContext.masterSite,
        conversationId: conversationID,
        requestedByUserName: processMessageContext.requestedByUserName,
        actionType: actionType,
        requiredFields: requiredFields,
        actionName: displayName,
        displayName: displayName
    });

    if (!createOutcome.success) {
        console.log('startRequest: failed to create row');
        console.log(createOutcome.errors);

        return {
            success: false,
            action: 'created',
            reason: null,
            requestID: null,
            request: null,
            error: createOutcome.errors
        };
    }

    const workflowId = createOutcome.workflowId;
    let dbAction = createOutcome.action;
    const updates = buildDbUpdatesFromTargetRequest(targetRequest);

    if (Object.keys(updates).length > 0) {
        const updateOutcome = await Request.updateAction(workflowId, updates);

        if (!updateOutcome.success) {
            console.log('startRequest: create OK but prefill update failed');
            console.log(updateOutcome.errors);

            return {
                success: false,
                action: 'created',
                reason: null,
                requestID: workflowId,
                request: ActionStateFunctions.mapActionToState(dbAction),
                error: updateOutcome.errors
            };
        }

        if (updateOutcome.action) {
            dbAction = updateOutcome.action;
        }
    }

    console.log('startRequest: new row — requestID:', workflowId, 'actionType:', actionType);

    return {
        success: true,
        action: 'created',
        reason: null,
        requestID: workflowId,
        request: ActionStateFunctions.mapActionToState(dbAction),
        error: null
    };
}

//Function B2: Sync decision.request onto the open row
async function updateRequest(decision, context) {
    const requestState = context.requestState || ActionStateFunctions.emptyActionState();
    const workflowId = requestState.workflowId;
    const targetRequest = decision.request;

    if (!workflowId) {
        console.log('updateRequest: no workflowId on open request');

        return {
            success: false,
            action: 'updated',
            reason: null,
            requestID: null,
            request: requestState,
            error: [{ code: 'no_open_request_id', message: 'Open request has no workflowId.' }]
        };
    }

    const updates = buildDbUpdatesFromTargetRequest(targetRequest);
    const updateOutcome = await Request.updateAction(workflowId, updates);

    if (!updateOutcome.success) {
        console.log('updateRequest: update failed');
        console.log(updateOutcome.errors);

        return {
            success: false,
            action: 'updated',
            reason: null,
            requestID: workflowId,
            request: requestState,
            error: updateOutcome.errors
        };
    }

    console.log('updateRequest: requestID:', workflowId, 'actionType:', targetRequest.action);

    return {
        success: true,
        action: 'updated',
        reason: null,
        requestID: workflowId,
        request: ActionStateFunctions.mapActionToState(updateOutcome.action),
        error: null
    };
}

//Function B3: Mark request completed or failed; keep row for history (is_open = 0)
async function finishRequest(workflowId, status, outcomeCode) {
    const finishOutcome = await Request.finishAction(workflowId, status, outcomeCode);

    if (!finishOutcome.success) {
        console.log('finishRequest: failed to close row');
        console.log(finishOutcome.errors);

        return {
            success: false,
            requestID: workflowId,
            request: null,
            error: finishOutcome.errors
        };
    }

    console.log('finishRequest: requestID:', workflowId, 'status:', status, 'outcome:', outcomeCode);

    return {
        success: true,
        requestID: workflowId,
        request: ActionStateFunctions.mapActionToState(finishOutcome.action),
        error: null
    };
}

//Function C1: Shallow copy of a plain object
function copyObject(source) {
    const copy = {};
    const keys = Object.keys(source || {});

    for (let i = 0; i < keys.length; i++) {
        const fieldName = keys[i];
        copy[fieldName] = source[fieldName];
    }

    return copy;
}

//Function C2: Copy an array of strings
function copyStringArray(source) {
    const copy = [];

    if (!Array.isArray(source)) {
        return copy;
    }

    for (let i = 0; i < source.length; i++) {
        copy.push(source[i]);
    }

    return copy;
}

//Function C3: Map decision.request fields to Request.updateAction keys
function buildDbUpdatesFromTargetRequest(targetRequest) {
    const updates = {};

    if (targetRequest.collected) {
        updates.collected = copyObject(targetRequest.collected);
    }

    if (targetRequest.missing) {
        updates.missing = copyStringArray(targetRequest.missing);
    }

    if (targetRequest.status) {
        updates.status = targetRequest.status;
    }

    if (targetRequest.executionMode != null && targetRequest.executionMode !== '') {
        updates.execution_mode = targetRequest.executionMode;
    }

    return updates;
}

//Function C4: Standard failure outcome
function buildFailedOutcome(action, reason, error) {
    return {
        success: false,
        action: action,
        reason: reason,
        requestID: null,
        request: null,
        error: error
    };
}

//Function C5: No DB write — return standard outcome with reason
function buildSkipOutcome(requestState, reason) {
    return {
        success: true,
        action: 'skipped',
        reason: reason,
        requestID: null,
        request: requestState,
        error: null
    };
}

//Function C6: Pick a skip reason when decision.request is empty
function resolveSkipReasonForNoRequest(decision) {
    if (!decision.response || !decision.response.type) {
        return 'general_chat_no_request';
    }

    const responseType = decision.response.type;

    if (responseType === RESPONSE_TYPE.GENERAL_CHAT) {
        return 'general_chat_no_request';
    }

    if (responseType === RESPONSE_TYPE.LIST_OPEN_REQUESTS) {
        return 'conversation_intent_only';
    }

    if (responseType === RESPONSE_TYPE.FOCUS_REQUEST) {
        return 'conversation_intent_only';
    }

    if (responseType === RESPONSE_TYPE.REQUEST_STATUS) {
        return 'conversation_intent_only';
    }

    if (responseType === RESPONSE_TYPE.AMBIGUOUS_ACTION) {
        return 'ambiguous_no_write';
    }

    return 'no_request_change';
}

//Function C7: Does decision.request match what is already loaded?
function requestTargetMatchesState(targetRequest, requestState) {
    if (targetRequest.action !== requestState.pendingAction) {
        return false;
    }

    if (targetRequest.status !== requestState.status) {
        return false;
    }

    const targetMode = targetRequest.executionMode || null;
    const stateMode = requestState.executionMode || null;

    if (targetMode !== stateMode) {
        return false;
    }

    const targetMissing = targetRequest.missing || [];
    const stateMissing = requestState.missing || [];

    if (!arraysMatchInOrder(targetMissing, stateMissing)) {
        return false;
    }

    const targetCollected = targetRequest.collected || {};
    const stateCollected = requestState.collected || {};
    const targetKeys = Object.keys(targetCollected);
    const stateKeys = Object.keys(stateCollected);

    if (targetKeys.length !== stateKeys.length) {
        return false;
    }

    for (let i = 0; i < targetKeys.length; i++) {
        const fieldName = targetKeys[i];

        if (targetCollected[fieldName] !== stateCollected[fieldName]) {
            return false;
        }
    }

    return true;
}

//Function C8: Same strings in the same order
function arraysMatchInOrder(left, right) {
    if (left.length !== right.length) {
        return false;
    }

    for (let i = 0; i < left.length; i++) {
        if (left[i] !== right[i]) {
            return false;
        }
    }

    return true;
}

module.exports = {
    applyDecision,
    startRequest,
    updateRequest,
    finishRequest
};
