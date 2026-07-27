const { getCloudPilotContext } = require('./contextTypes/cloudPilotContext');
const { getCloudPilotSituationContext } = require('./contextTypes/cloudPilotSituationContext');
const { buildCurrentQuestionContext } = require('./contextTypes/currentQuestionContext');
const { getKnowledgeContext } = require('./contextTypes/organizationKnowledgeContext');

/*
Collect selected CloudPilot context for the AI.

Roles:
  cloudPilotContext              — Identity (who is CloudPilot?)
  cloudPilotSituationContext     — Situation (what should AI look for / do?)
  currentQuestionContext         — Current question (what did the user say?)
  organizationKnowledgeContext   — Knowledge (organization + product)

Pass processMessageContext through — do not unpack fields at each layer.
Collect only — no OpenAI calls, no env toggles, no log formatting.
Rendering: buildSystemMessage.js

options:
  situationTypes   — string[] building blocks for Situation (e.g. ['region'])
  includeKnowledge — default true for existing chat path; set false to omit
*/

function buildAIContext(processMessageContext, options) {
    const opts = options && typeof options === 'object' ? options : {};

    //STEP 1: Identity
    const cloudPilot = getCloudPilotContext();

    //STEP 2: Situation (what to look for) — only when types are requested
    let situation = null;

    if (Array.isArray(opts.situationTypes) && opts.situationTypes.length > 0) {
        situation = getCloudPilotSituationContext(opts.situationTypes);
    }

    //STEP 3: Current question (what the user said)
    const currentQuestion = buildCurrentQuestionContext(processMessageContext);

    //STEP 4: Knowledge (optional)
    const includeKnowledge = opts.includeKnowledge !== false;
    const knowledge = includeKnowledge ? getKnowledgeContext() : null;

    //STEP 5: Combine
    const aiContext = {
        cloudPilot: cloudPilot,
        situation: situation,
        currentQuestion: currentQuestion,
        knowledge: knowledge
    };

    return aiContext;
}

module.exports = {
    buildAIContext
};
