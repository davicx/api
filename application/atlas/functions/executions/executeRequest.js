const { RESPONSE_TYPE } = require('../decision/decisionTypes');
const MockExecuteRequestFunctions = require('./mockExecuteRequest');
const RealExecuteRequestFunctions = require('./realExecuteRequest');

/*
FUNCTIONS A: STEP 6 — run execution when STEP 4 decided execution_started
    1) Function A1: executeRequest

FUNCTIONS B: Helpers
    1) Function B1: shouldRunExecution
    2) Function B2: useMockExecution
*/

//Function A1: Mock or real execution; finish row here (not in STEP 5)
async function executeRequest(decision, context) {
    if (!shouldRunExecution(decision)) {
        return null;
    }

    console.log('STEP 6: EXECUTION — starting');

    let outcome;

    if (useMockExecution()) {
        outcome = await MockExecuteRequestFunctions.mockExecuteRequest(decision, context);
    } else {
        outcome = await RealExecuteRequestFunctions.realExecuteRequest(decision, context);
    }

    console.log('STEP 6: EXECUTION — outcome:');
    console.log(JSON.stringify(outcome, null, 2));
    console.log(' ');

    return outcome;
}

//Function B1: Only run when STEP 4 marked execution_started
function shouldRunExecution(decision) {
    if (!decision || !decision.response) {
        return false;
    }

    return decision.response.type === RESPONSE_TYPE.EXECUTION_STARTED;
}

//Function B2: Default mock until real Atlas is wired
function useMockExecution() {
    const mode = String(process.env.CLOUDPILOT_EXECUTION_MODE || 'mock')
        .trim()
        .toLowerCase();

    return mode !== 'real';
}

module.exports = {
    executeRequest,
    shouldRunExecution,
    useMockExecution
};
