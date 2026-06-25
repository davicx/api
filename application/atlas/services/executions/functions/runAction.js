const actionMap = require('../../actions/actionMap');

/*
What this file answers:

* What runs when an approved action executes?

This is the RUN layer. It looks up the handler from actionMap
and calls it. Guards (missing action, missing handler, workflow rules)
stay in executionFunctions.js — this file only performs the handler call.

Examples:

scan_ec2    -> scanEC2Handler
toggle_ec2  -> toggleEC2Handler
create_ec2  -> createEC2Handler

STEP 4 (decideNextStep) = permission to run — e.g. execution_started after confirm.
STEP 6 (this file) = actual run — only when STEP 4 already approved.

Example call chain (scan_ec2):

runAction('scan_ec2', context)
    ↓
actionMap.scan_ec2.executionFunction  →  scanEC2Handler
    ↓
capabilities/scans/scanEC2.js
    ↓
capabilities/atlas/atlasPost.js  →  Atlas

capabilities/changes/changeEC2.js (toggleEC2, createEC2, deleteEC2)

See doc/development/architecture/action_map.md for the full action table.
*/

//Function A1: Call the action map handler for an approved action
async function runAction(actionType, executionContext) {
    const actionDefinition = actionMap[actionType];

    return actionDefinition.executionFunction(executionContext);
}

module.exports = { runAction };
