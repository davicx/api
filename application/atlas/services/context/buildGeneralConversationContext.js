const { getCloudPilotContext } = require('./cloudPilotContext');
const { buildCurrentQuestionContext } = require('./currentQuestionContext');
const { getOrganizationKnowledgeContext } = require('./organizationKnowledgeContext');

/*
Assembles General Conversation context from all three sources.
Build only — no OpenAI, no env toggles, no logging.
*/

function buildGeneralConversationContext({ userMessage }) {
    const cloudPilot = getCloudPilotContext();
    const currentQuestion = buildCurrentQuestionContext({ userMessage: userMessage });
    const organizationKnowledgeContext = getOrganizationKnowledgeContext();

    return {
        cloudPilot: cloudPilot,
        currentQuestion: currentQuestion,
        organizationKnowledgeContext: organizationKnowledgeContext,
        log: {
            generalCloudPilotContext: {
                loaded: cloudPilot.loaded
            },
            currentQuestionContext: currentQuestion,
            organizationKnowledgeContext: organizationKnowledgeContext
        }
    };
}

module.exports = {
    buildGeneralConversationContext
};
