/*
Mode 4 — User picked Automatic (option 4).
STEP 6 entry: run action handler → capability → Atlas.
STEP 7 confirmation ("Would you like me to execute?") stays in CloudPilotChat.
Actions without a mode menu (e.g. scan_ec2) skip mode checks.
*/

const actionMap = require('../../actions/actionMap');
const RunActionFunctions = require('../../executions/functions/runAction');

const NON_AUTOMATIC_MODES = ['instructions', 'cli', 'pr'];

async function userRequestedAutomatic(actionType, executionContext) {
    const actionDefinition = actionMap[actionType];
    const needsExecutionMode = actionMap.actionRequiresExecutionModeSelection(actionDefinition);
    const executionMode =
        executionContext.state && executionContext.state.executionMode
            ? executionContext.state.executionMode
            : null;

    if (needsExecutionMode) {
        if (NON_AUTOMATIC_MODES.includes(executionMode)) {
            return {
                success: false,
                cloudPilotMessage:
                    'That delivery mode does not run through automatic execution.',
                error: 'mode_not_automatic',
                atlasResponse: null
            };
        }

        if (executionMode !== 'automatic') {
            return {
                success: false,
                cloudPilotMessage:
                    'Please choose automatic execution mode before confirming.',
                error: 'execution_mode_not_automatic',
                atlasResponse: null
            };
        }
    }

    return RunActionFunctions.runAction(actionType, executionContext);
}

module.exports = { userRequestedAutomatic };
