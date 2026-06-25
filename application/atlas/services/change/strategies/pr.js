/*
PR change strategy — user picked option 3.
STEP 7 response only.
*/

function buildPrStrategy(chatType) {
    return {
        success: true,
        cloudPilotMessage:
            'You chose Pull Request.\n' +
            'This feature is coming soon.',
        chatType: chatType,
        atlasResponse: null,
        error: null
    };
}

module.exports = { buildPrStrategy };
