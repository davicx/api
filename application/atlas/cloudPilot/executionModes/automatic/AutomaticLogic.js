/*
AUTOMATIC EXECUTION — user picked option 4

STEP 6 entry: run action handler → capability → Atlas.
STEP 7 confirmation ("Would you like me to execute?") stays in CloudPilotMessage request templates.

FUNCTIONS A: Automatic Execution
    1) Function A1: runAutomaticStrategy
*/

const actionMap = require('../../masterCloudPilotCapabilities');
const RunActionFunctions = require('../../execution/functions/runAction');

const NON_AUTOMATIC_STRATEGIES = ['instructions', 'cli', 'pr'];

async function runAutomaticStrategy(actionType, executionContext) {
    //STEP 1: Load Action and Execution Mode
    const actionDefinition = actionMap[actionType];
    const needsExecutionMode = actionMap.actionRequiresExecutionModeSelection(actionDefinition);
    const executionMode =
        executionContext.state && executionContext.state.executionMode
            ? executionContext.state.executionMode
            : null;

    //STEP 2: Validate Automatic Execution Mode
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

    //STEP 3: Execute Action
    return RunActionFunctions.runAction(actionType, executionContext);
}

module.exports = { runAutomaticStrategy };
