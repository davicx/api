const { getCloudPilotContext } = require('./contextTypes/cloudPilotContext');
const { buildCurrentQuestionContext } = require('./contextTypes/currentQuestionContext');
const { getOrganizationKnowledgeContext } = require('./contextTypes/organizationKnowledgeContext');

/*
Collect everything CloudPilot currently knows about this conversation.

Roles:
  Identity  (cloudPilotContext)
  Situation (currentQuestionContext)
  Knowledge (organizationKnowledgeContext + product knowledge from services/knowledge/ later)

Build only — no AI calls, no env toggles, no logging.
All intelligence belongs here; buildCloudPilotInstructions should stay dumb formatting.
*/

function buildConversationContext({ userMessage }) {
    const cloudPilot = getCloudPilotContext();
    const currentQuestion = buildCurrentQuestionContext({ userMessage: userMessage });
    const organizationKnowledgeContext = getOrganizationKnowledgeContext();

    return {
        cloudPilot: cloudPilot,
        currentQuestion: currentQuestion,
        organizationKnowledgeContext: organizationKnowledgeContext,
        log: {
            identity: {
                loaded: cloudPilot.loaded
            },
            situation: currentQuestion,
            knowledge: {
                organization: organizationKnowledgeContext,
                product: []
            }
        }
    };
}

module.exports = {
    buildConversationContext
};
