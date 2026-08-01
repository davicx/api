const CurrentQuestionContext = require('../classes/CurrentQuestionContext');

/*
TYPE — CURRENT QUESTION
Role: What did the user say?

Application owns this. Temporary for this turn.
Build from processMessageContext — do not invent AWS facts.

MVP: userMessage + selectedFinding (from request body).
Later: open request, execution mode, conversation excerpts.

Used by: buildAIContext → buildAISystemMessage → AI
(Situation / what to look for is cloudPilotSituationContext — not this file.)
*/

//Function A1: Return structured Current Question context (data only)
function buildCurrentQuestionContext(processMessageContext) {
    const questionBuilder = new CurrentQuestionContext(processMessageContext);
    const data = questionBuilder.toData();

    const currentQuestion = {
        loaded: true,
        type: 'current_question',
        data: data
    };

    console.log('Building Current Question Context');
    console.log(JSON.stringify(currentQuestion, null, 2));

    return currentQuestion;
}

module.exports = {
    buildCurrentQuestionContext
};
