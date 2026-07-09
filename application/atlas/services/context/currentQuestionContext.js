/*
Current question context — the user's message for this General Conversation turn.
C1: userMessage only. No history, request state, or AWS facts yet.
*/

function buildCurrentQuestionContext({ userMessage }) {
    return {
        userMessage: typeof userMessage === 'string' ? userMessage.trim() : ''
    };
}

module.exports = {
    buildCurrentQuestionContext
};
