/*
Automatic change strategy — user picked option 4.
STEP 6 entry: run action handler → capability → Atlas.
STEP 7 confirmation ("Would you like me to execute?") stays in CloudPilotChat.
*/

const actionMap = require('../../actions/actionMap');
const RunActionFunctions = require('../../executions/functions/runAction');

const NON_AUTOMATIC_STRATEGIES = ['instructions', 'cli', 'pr'];

async function runAutomaticStrategy(actionType, executionContext) {
    const actionDefinition = actionMap[actionType];
    const needsExecutionMode = actionMap.actionRequiresExecutionModeSelection(actionDefinition);
    const executionMode =
        executionContext.state && executionContext.state.executionMode
            ? executionContext.state.executionMode
            : null;

    if (needsExecutionMode) {
        if (NON_AUTOMATIC_STRATEGIES.includes(executionMode)) {
            return {
                success: false,
                cloudPilotMessage:
                    'That change strategy does not run through automatic execution.',
                error: 'strategy_not_automatic',
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

module.exports = { runAutomaticStrategy };
