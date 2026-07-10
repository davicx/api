/*
TYPE 2 — SITUATION
Role: What is happening right now? (Full CloudPilot state this turn — not just the user's words.)

Built from the pipeline: request row, handler output, decision, last action.
Not prompt engineering — this IS the current state object.

Target shape (fields added incrementally; only populated keys are sent):
{
    userMessage,
    previousAction,
    openRequest,
    selectedResource,
    findings,
    dashboardData,
    executionMode,
    capabilities
}

MVP today: userMessage only.
See: doc/development/cloud_pilot_chat.md

Used by: buildConversationContext → buildCloudPilotInstructions → AI (CURRENT SITUATION section)
*/

function buildCurrentQuestionContext({ userMessage }) {
    return {
        userMessage: typeof userMessage === 'string' ? userMessage.trim() : ''
    };
}

module.exports = {
    buildCurrentQuestionContext
};
