/*
Mode 2 — User picked CLI Commands (option 2).
STEP 7 response only. Not a capability or handler.
Future: OpenAI CLI commands from collected action fields.
*/

function userRequestedCLI(chatType) {
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

module.exports = { userRequestedCLI };
