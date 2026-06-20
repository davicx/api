const { CHAT_TYPE } = require('../decision/decisionTypes');
const BuildCloudPilotResponseFunctions = require('./buildCloudPilotResponse');
const BuildGeneralChatResponseFunctions = require('./buildGeneralChatResponse');

/*
FUNCTIONS A: STEP 7 — build one chat response (words only; no DB, no Atlas)
    1) Function A1: buildResponse

STEP 7 words only. Do not decide or mutate request state here — STEP 4, STEP 5, and STEP 6 already did.
*/

//Function A1: Route decision to CloudPilot or general chat response
async function buildResponse(decision, context) {
    const emptyOutcome = {
        success: false,
        cloudPilotMessage: '',
        chatType: null,
        atlasResponse: null,
        error: null
    };

    if (!decision) {
        return emptyOutcome;
    }

    if (decision.chatType === CHAT_TYPE.GENERAL_CHAT_RESPONDING) {
        return BuildGeneralChatResponseFunctions.buildGeneralChatResponse(context);
    }

    if (decision.chatType === CHAT_TYPE.CLOUD_PILOT_RESPONDING) {
        return BuildCloudPilotResponseFunctions.buildCloudPilotResponse(decision, context);
    }

    return emptyOutcome;
}

module.exports = {
    buildResponse
};
