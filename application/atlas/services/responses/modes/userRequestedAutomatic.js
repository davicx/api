/*
Mode 4 — User picked Automatic (option 4).
Entry: confirmation (CloudPilotChat) → yes → STEP 6 handler → capability → Atlas.
Returns null so buildCloudPilotResponse continues the existing execution flow.
*/

function userRequestedAutomatic() {
    return null;
}

module.exports = { userRequestedAutomatic };
