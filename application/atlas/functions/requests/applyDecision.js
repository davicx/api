const ActionStateFunctions = require('../actions/actionStateFunctions');
const { RESPONSE_TYPE } = require('../decision/decisionTypes');
const StartRequestFunctions = require('./startRequest');
const UpdateRequestFunctions = require('./updateRequest');

/*
FUNCTIONS A: Apply STEP 4 decision to the database (STEP 5)
    1) Function A1: applyDecision

FUNCTIONS B: Helpers
    1) Function B1: buildSkipOutcome
    2) Function B2: resolveSkipReasonForNoRequest
    3) Function B3: requestTargetMatchesState
    4) Function B4: arraysMatchInOrder
*/

//Function A1: Route decision to start, update, or skip (D1 — finish/cancel in D2)
async function applyDecision(decision, context) {
    const requestState = context.requestState || ActionStateFunctions.emptyActionState();
    const conversationID = context.conversationID;
    const targetRequest = decision.request || null;

    // D2: finishRequest / cancelRequest — not wired yet
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
        return StartRequestFunctions.startRequest(decision, context);
    }

    if (decision.replaceOpenRequest === true) {
        await ActionStateFunctions.closeOpenActionBeforeStartingNew(conversationID);
        return StartRequestFunctions.startRequest(decision, context);
    }

    if (targetRequest.action !== requestState.pendingAction) {
        await ActionStateFunctions.closeOpenActionBeforeStartingNew(conversationID);
        return StartRequestFunctions.startRequest(decision, context);
    }

    if (requestTargetMatchesState(targetRequest, requestState)) {
        return buildSkipOutcome(requestState, 'no_request_change');
    }

    return UpdateRequestFunctions.updateRequest(decision, context);
}

//Function B1: No DB write — return standard outcome with reason
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

//Function B2: Pick a skip reason when decision.request is empty
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

//Function B3: Does decision.request match what is already loaded?
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

//Function B4: Same strings in the same order
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
    applyDecision
};
