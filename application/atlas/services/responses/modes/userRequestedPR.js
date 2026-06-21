/*
Mode 3 — User picked Pull Request (option 3).
STEP 7 response only. Not a capability or handler.
Future: diff + PR description + GitHub PR link.
*/

function userRequestedPR(chatType) {
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

module.exports = { userRequestedPR };
