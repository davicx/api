const CurrentQuestionContext = require('../classes/CurrentQuestionContext');

/*
TYPE 2 — SITUATION
Role: What is happening right now?

Application owns this. Temporary for this turn.
Build from processMessageContext — do not invent AWS facts.

MVP: userMessage + selectedFinding (from request body).
Later: open request, execution mode, conversation excerpts.

Used by: buildAIContext → buildAISystemMessage → AI
*/

//Function A1: Return structured Situation context (data only)
function buildCurrentQuestionContext(processMessageContext) {
    const situationBuilder = new CurrentQuestionContext(processMessageContext);
    const data = situationBuilder.toData();

    const situation = {
        loaded: true,
        type: 'situation',
        data: data
    };

    console.log('Building Situation Context');
    console.log(JSON.stringify(situation, null, 2));

    return situation;
}

module.exports = {
    buildCurrentQuestionContext
};
