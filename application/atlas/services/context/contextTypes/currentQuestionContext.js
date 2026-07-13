/*
TYPE 2 — SITUATION
Role: What is happening right now? (Full CloudPilot state this turn — not just the user's words.)

Built from the pipeline: request row, handler output, decision, last action.
Not prompt engineering — this IS the current state object.

Target shape in data (fields added incrementally):
{
    previousAction,
    openRequest,
    selectedResource,
    findings,
    dashboardData,
    executionMode,
    capabilities
}

MVP general chat: data is {} — the user's sentence lives in conversation history, not here.
See: doc/development/cloud_pilot_chat.md

Used by: buildAIContext → buildAISystemMessage → AI (CURRENT SITUATION section)
*/

//Function A1: Return structured Situation context (data only)
function buildCurrentQuestionContext() {
    const situation = {
        loaded: true,
        type: 'situation',
        data: {}
    };

    console.log('Building Situation Context');
    console.log(JSON.stringify(situation, null, 2));

    return situation;
}

module.exports = {
    buildCurrentQuestionContext
};
