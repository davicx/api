const instructionFunctions = require('../../../functions/instructionFunctions');

/*
INSTRUCTIONS EXECUTION — user picked option 1

STEP 7 response only.
Loads curated steps via the same shared loader as GET /instructions/:instruction_for.

FUNCTIONS A: Instructions Execution
    1) Function A1: buildInstructionsStrategy
*/

async function buildInstructionsStrategy(chatType, instructionFor) {
    //STEP 1: Load and Validate Action
    const actionKey = instructionFor ? String(instructionFor).trim() : '';

    if (!actionKey) {
        return {
            success: false,
            cloudPilotMessage:
                'You chose Instructions, but I could not tell which action to walk through.',
            chatType: chatType,
            atlasResponse: null,
            error: 'missing_instruction_for'
        };
    }

    //STEP 2: Load Instructions
    const payloadOutcome = await instructionFunctions.loadInstructionsPayload(actionKey);

    if (!payloadOutcome.success || !payloadOutcome.data || payloadOutcome.data.stepCount < 1) {
        return {
            success: false,
            cloudPilotMessage:
                'You chose Instructions, but I do not have a walkthrough for ' +
                actionKey +
                ' yet.',
            chatType: chatType,
            atlasResponse: null,
            error: 'instructions_not_found'
        };
    }

    const title = payloadOutcome.data.title || actionKey;

    //STEP 3: Build Instructions Response
    return {
        success: true,
        cloudPilotMessage: 'Here is a guided walkthrough for ' + title + '.',
        chatType: chatType,
        atlasResponse: payloadOutcome.data,
        error: null
    };
}

module.exports = { buildInstructionsStrategy };
