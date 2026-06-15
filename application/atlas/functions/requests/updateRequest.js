const Actions = require('../classes/Actions');
const ActionStateFunctions = require('../actions/actionStateFunctions');
const RequestHelpers = require('./requestHelpers');

/*
FUNCTIONS A: Update the open request row (STEP 5 — updateRequest)
    1) Function A1: updateRequest
*/

//Function A1: Sync decision.request onto the open row
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

    const updates = RequestHelpers.buildDbUpdatesFromTargetRequest(targetRequest);
    const updateOutcome = await Actions.updateAction(workflowId, updates);

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

module.exports = {
    updateRequest
};
