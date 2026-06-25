/*
Instructions change strategy — user picked option 1.
STEP 7 response only.
*/

function buildInstructionsStrategy(chatType) {
    return {
        success: true,
        cloudPilotMessage:
            'You chose Instructions.\n' +
            'This feature is coming soon.',
        chatType: chatType,
        atlasResponse: null,
        error: null
    };
}

module.exports = { buildInstructionsStrategy };
