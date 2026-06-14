const actionRegistry = require('../actions/actionRegistry');
const FinishRequestFunctions = require('../requests/finishRequest');
const { RESPONSE_TYPE } = require('../decision/decisionTypes');

/*
FUNCTIONS A: STEP 6 — run execution when STEP 4 decided execution_started
    1) Function A1: executeRequest

FUNCTIONS B: Helpers
    1) Function B1: shouldRunExecution
    2) Function B2: resolveExecutionActionType
    3) Function B3: buildExecutionContext
    4) Function B4: buildExecutionOutcome
    5) Function B5: getDefaultSuccessMessage
    6) Function B6: getDefaultFailureMessage
*/

//Function A1: Registry handler → Atlas HTTP; finish request row when workflowId exists
async function executeRequest(decision, context) {
    if (!shouldRunExecution(decision)) {
        return null;
    }

    console.log('STEP 6: EXECUTION — starting');

    const requestState = context.requestState || {};
    const workflowId = requestState.workflowId;
    const actionType = resolveExecutionActionType(decision, requestState);

    if (!actionType) {
        return buildExecutionOutcome({
            success: false,
            cloudPilotMessage: 'I could not determine which action to execute.',
            atlasResponse: null,
            request: null,
            error: 'no_action_type'
        });
    }

    const actionDefinition = actionRegistry[actionType];

    if (!actionDefinition || typeof actionDefinition.executionFunction !== 'function') {
        if (workflowId) {
            const finishOutcome = await FinishRequestFunctions.finishRequest(
                workflowId,
                'failed',
                'execution_function_missing'
            );

            return buildExecutionOutcome({
                success: false,
                cloudPilotMessage: 'This CloudPilot action is not executable yet.',
                atlasResponse: null,
                request: finishOutcome.request,
                error: 'execution_function_missing'
            });
        }

        return buildExecutionOutcome({
            success: false,
            cloudPilotMessage: 'This CloudPilot action is not executable yet.',
            atlasResponse: null,
            request: null,
            error: 'execution_function_missing'
        });
    }

    if (!workflowId && actionDefinition.requiresWorkflow) {
        return buildExecutionOutcome({
            success: false,
            cloudPilotMessage: 'I could not find an open request to execute.',
            atlasResponse: null,
            request: null,
            error: 'no_open_request_id'
        });
    }

    const executionContext = buildExecutionContext(context, actionDefinition, requestState);
    let executionResult;

    try {
        executionResult = await actionDefinition.executionFunction(executionContext);
    } catch (error) {
        if (workflowId) {
            const finishOutcome = await FinishRequestFunctions.finishRequest(
                workflowId,
                'failed',
                'execution_exception'
            );

            return buildExecutionOutcome({
                success: false,
                cloudPilotMessage:
                    'Something unexpected went wrong while running that action. Please try again in a moment.',
                atlasResponse: null,
                request: finishOutcome.request,
                error: error.message || 'execution_exception'
            });
        }

        return buildExecutionOutcome({
            success: false,
            cloudPilotMessage:
                'Something unexpected went wrong while running that action. Please try again in a moment.',
            atlasResponse: null,
            request: null,
            error: error.message || 'execution_exception'
        });
    }

    if (executionResult.success) {
        let finishOutcome = null;

        if (workflowId) {
            finishOutcome = await FinishRequestFunctions.finishRequest(
                workflowId,
                'completed',
                'success'
            );
        }

        const cloudPilotMessage =
            executionResult.cloudPilotMessage ||
            executionResult.message ||
            getDefaultSuccessMessage(actionDefinition);

        return buildExecutionOutcome({
            success: true,
            cloudPilotMessage: cloudPilotMessage,
            atlasResponse: executionResult.atlasResponse || null,
            request: finishOutcome ? finishOutcome.request : null,
            error: null
        });
    }

    let failOutcomeCode = 'execution_failed';

    if (executionResult.error != null && String(executionResult.error).trim() !== '') {
        failOutcomeCode = String(executionResult.error);
    }

    let finishOutcome = null;

    if (workflowId) {
        finishOutcome = await FinishRequestFunctions.finishRequest(
            workflowId,
            'failed',
            failOutcomeCode
        );
    }

    const failMessage =
        executionResult.cloudPilotMessage ||
        executionResult.message ||
        getDefaultFailureMessage(actionDefinition);

    return buildExecutionOutcome({
        success: false,
        cloudPilotMessage: failMessage,
        atlasResponse: executionResult.atlasResponse || null,
        request: finishOutcome ? finishOutcome.request : null,
        error: failOutcomeCode
    });
}

//Function B1: Run when STEP 4 marked execution_started or immediate_execution
function shouldRunExecution(decision) {
    if (!decision || !decision.response) {
        return false;
    }

    if (decision.response.type === RESPONSE_TYPE.EXECUTION_STARTED) {
        return true;
    }

    if (decision.response.type === RESPONSE_TYPE.IMMEDIATE_EXECUTION) {
        return Boolean(decision.execute && decision.execute.action);
    }

    return false;
}

//Function B2: Open request action, or immediate execute payload from STEP 4
function resolveExecutionActionType(decision, requestState) {
    if (decision && decision.execute && decision.execute.action) {
        return decision.execute.action;
    }

    if (requestState && requestState.pendingAction) {
        return requestState.pendingAction;
    }

    return null;
}

//Function B3: Shape passed into action handlers (matches AtlasExecution context)
function buildExecutionContext(context, actionDefinition, requestState) {
    return {
        userMessage: context.currentUserMessage || '',
        action: actionDefinition,
        state: {
            pendingAction: requestState.pendingAction,
            status: 'running',
            executionMode: requestState.executionMode || null,
            missing: requestState.missing || [],
            collected: requestState.collected || {}
        },
        conversationID: context.conversationID
    };
}

//Function B4: Standard STEP 6 outcome shape for STEP 7
function buildExecutionOutcome(options) {
    return {
        ran: true,
        success: Boolean(options.success),
        cloudPilotMessage: options.cloudPilotMessage || '',
        atlasResponse: options.atlasResponse || null,
        request: options.request || null,
        error: options.error || null
    };
}

//Function B5: Registry fallback when handler omits success copy
function getDefaultSuccessMessage(actionDefinition) {
    if (actionDefinition && actionDefinition.messages && actionDefinition.messages.success) {
        return actionDefinition.messages.success;
    }

    return 'Action completed.';
}

//Function B6: Registry fallback when handler omits failure copy
function getDefaultFailureMessage(actionDefinition) {
    if (actionDefinition && actionDefinition.messages && actionDefinition.messages.failed) {
        return actionDefinition.messages.failed;
    }

    return 'That action did not complete.';
}

module.exports = {
    executeRequest,
    shouldRunExecution
};
