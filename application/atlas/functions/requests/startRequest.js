const actionRegistry = require('../actions/actionRegistry');
const Actions = require('../classes/Actions');
const ActionStateFunctions = require('../actions/actionStateFunctions');
const RequestHelpers = require('./requestHelpers');

/*
FUNCTIONS A: Create a new request row (STEP 5 — startRequest)
    1) Function A1: startRequest

FUNCTIONS B: Helpers
    1) Function B1: buildFailedOutcome
*/

//Function A1: Insert row and sync target state from decision.request
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

    const createOutcome = await Actions.createAction({
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
    const updates = RequestHelpers.buildDbUpdatesFromTargetRequest(targetRequest);

    if (Object.keys(updates).length > 0) {
        const updateOutcome = await Actions.updateAction(workflowId, updates);

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

//Function B1: Standard failure outcome
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

module.exports = {
    startRequest
};
