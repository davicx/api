const RequestFunctions = require('../../requests/functions/requestFunctions');
const ExecutionFunctions = require('../../executions/functions/executionFunctions');

/*
Request Conversation — workflow (STEP 5–6)

Thin front door: maintain state (store) and perform work (execute).
Orchestrator keeps STEP labels and outcome shaping in processMessage.
*/

//Function A1: STEP 5 — apply decision to request row
async function store(decision, context) {
    return RequestFunctions.applyDecision(decision, context);
}

//Function A2: STEP 6 — run execution when decision allows
async function execute(decision, context) {
    return ExecutionFunctions.executeRequest(decision, context);
}

module.exports = {
    store,
    execute
};
