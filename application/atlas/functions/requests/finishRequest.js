const Actions = require('../classes/Actions');
const ActionStateFunctions = require('../actions/actionStateFunctions');

/*
FUNCTIONS A: Close a request row after execution (STEP 6 only — not STEP 5)
    1) Function A1: finishRequest
*/

//Function A1: Mark request completed or failed; keep row for history (is_open = 0)
async function finishRequest(workflowId, status, outcomeCode) {
    const finishOutcome = await Actions.finishAction(workflowId, status, outcomeCode);

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

module.exports = {
    finishRequest
};
