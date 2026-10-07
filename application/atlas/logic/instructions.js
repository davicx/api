const instructionFunctions = require('../functions/instructionFunctions');
const Functions = require('../../functions/functions');

/*
FUNCTIONS A: All Functions Related to Getting Instructions
    1) Function A1: Get Instructions by Action Key

*/

//FUNCTIONS A: All Functions Related to Getting Instructions
//Function A1: Get Instructions by Action Key
async function getInstructionsByAction(req, res) {
    const currentUser = req.currentUser || req.body?.currentUser;
    const instructionFor = req.params.instruction_for;

    var headerMessage = "HEADER: Get Instructions: " + instructionFor;
    Functions.addHeader(headerMessage);

    var instructionsResponse = instructionFunctions.buildInstructionResponse(currentUser);

    //STEP 1: Load Instructions Payload
    console.log("STEP 1: Load Instructions Payload");
    var payloadOutcome = await instructionFunctions.loadInstructionsPayload(instructionFor);

    //STEP 2: Instructions Outcome
    console.log("STEP 2: Instructions Outcome");
    if (payloadOutcome.success == true && payloadOutcome.data && payloadOutcome.data.stepCount > 0) {
        instructionsResponse.data = payloadOutcome.data;
        instructionsResponse.message = payloadOutcome.message;
        instructionsResponse.success = true;
        instructionsResponse.statusCode = 200;
    } else if (payloadOutcome.success == true) {
        instructionsResponse.data = payloadOutcome.data;
        instructionsResponse.message = "No instructions found for " + instructionFor;
        instructionsResponse.success = false;
        instructionsResponse.statusCode = 404;
    } else {
        instructionsResponse.message = payloadOutcome.message || "Could not load instructions";
        instructionsResponse.statusCode = payloadOutcome.message === "instruction_for is required" ? 400 : 500;
        instructionsResponse.errors = payloadOutcome.errors;
    }

    Functions.addFooter();
    res.json(instructionsResponse);
}

module.exports = { getInstructionsByAction };
