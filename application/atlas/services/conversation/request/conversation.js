const BuildCloudPilotResponseFunctions = require('../../responses/buildCloudPilotResponse');

/*
Request Conversation — speak (STEP 7 only)

Today: wraps buildCloudPilotResponse. Does not store or execute — pipeline does that in STEPS 5–6.
*/

//Function A1: Request Conversation speak entry
async function conversation(decision, context) {
    return BuildCloudPilotResponseFunctions.buildCloudPilotResponse(decision, context);
}

module.exports = {
    conversation
};
