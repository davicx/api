/*
CLI change strategy — user picked option 2.
STEP 7 response only.
*/

function buildCliStrategy(chatType) {
    return {
        success: true,
        cloudPilotMessage:
            'You chose CLI Commands.\n' +
            'This feature is coming soon.',
        chatType: chatType,
        atlasResponse: null,
        error: null
    };
}

module.exports = { buildCliStrategy };
