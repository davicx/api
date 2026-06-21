/*
Mode 1 — User picked Instructions (option 1).
STEP 7 response only. Not a capability or handler.
Future: OpenAI step-by-step from collected action fields.
*/

function userRequestedInstructions(chatType) {
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

module.exports = { userRequestedInstructions };
