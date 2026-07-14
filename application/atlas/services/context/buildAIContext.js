const { getCloudPilotContext } = require('./contextTypes/cloudPilotContext');
const { buildCurrentQuestionContext } = require('./contextTypes/currentQuestionContext');
const { getKnowledgeContext } = require('./contextTypes/organizationKnowledgeContext');

/*
Collect everything CloudPilot currently knows for the AI.

Roles:
  cloudPilotContext              — Identity
  currentQuestionContext         — Situation
  organizationKnowledgeContext   — Knowledge (organization + product)

Pass processMessageContext through — do not unpack fields at each layer.
Collect only — no OpenAI calls, no env toggles, no log formatting.
Rendering: buildAISystemMessage.js
*/

function buildAIContext(processMessageContext) {
    
    //STEP 1: Identity
    const cloudPilot = getCloudPilotContext();

    //STEP 2: Situation
    const currentQuestion = buildCurrentQuestionContext(processMessageContext);

    //STEP 3: Knowledge
    const knowledge = getKnowledgeContext();

    //STEP 4: Combine
    const aiContext = {
        cloudPilot: cloudPilot,
        currentQuestion: currentQuestion,
        knowledge: knowledge
    };

    return aiContext;
}

module.exports = {
    buildAIContext
};
