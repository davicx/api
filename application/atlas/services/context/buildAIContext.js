const { getCloudPilotContext } = require('./contextTypes/cloudPilotContext');
const { buildCurrentQuestionContext } = require('./contextTypes/currentQuestionContext');
const { getKnowledgeContext } = require('./contextTypes/organizationKnowledgeContext');

/*
Collect everything CloudPilot currently knows for the AI.

Roles:
  cloudPilotContext              — Identity
  currentQuestionContext         — Situation
  organizationKnowledgeContext   — Knowledge (organization + product)

Collect only — no OpenAI calls, no env toggles, no log formatting.
Builders may log their own data objects.
Rendering: buildAISystemMessage.js
*/

function buildAIContext() {
    return {
        cloudPilot: getCloudPilotContext(),
        currentQuestion: buildCurrentQuestionContext(),
        knowledge: getKnowledgeContext()
    };
}

module.exports = {
    buildAIContext
};
