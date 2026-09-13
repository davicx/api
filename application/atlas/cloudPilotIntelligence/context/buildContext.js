const { getCloudPilotContext } = require('./contextTypes/cloudPilotContext');
const { getCloudPilotCapabilitiesContext } = require('./contextTypes/cloudPilotCapabilitiesContext');
const { buildCurrentStateContext } = require('./contextTypes/cloudPilotCurrentStateContext');
const { buildCurrentQuestionContext } = require('./contextTypes/currentQuestionContext');
const { getKnowledgeContext } = require('./contextTypes/organizationKnowledgeContext');

/*
Collect selected CloudPilot context for the AI.

Roles:
  cloudPilotContext              — Identity (who is CloudPilot?)
  cloudPilotCapabilitiesContext  — Capabilities (what can I do / retrieve?)
  cloudPilotCurrentStateContext  — Current State (factual open request — Chat)
  currentQuestionContext         — Current question (what did the user say?)
  organizationKnowledgeContext   — Knowledge (organization + product)

Pass processMessageContext through — do not unpack fields at each layer.
Collect only — no OpenAI calls, no env toggles, no log formatting.
Rendering: buildSystemMessage.js

options:
  includeKnowledge    — default true for legacy callers; Final Response recipe sets false
  includeIdentity     — default true for General Chat; Search must set false
  includeCapabilities — default false (only Final Response / explicit recipes turn on)
  includeCurrentState — default true for General Chat; Search must set false
*/

function buildAIContext(processMessageContext, options) {
    const opts = options && typeof options === 'object' ? options : {};

    //STEP 1: Identity (Chat only — Search passes includeIdentity: false)
    const includeIdentity = opts.includeIdentity !== false;
    const cloudPilot = includeIdentity ? getCloudPilotContext() : null;

    //STEP 2: Capabilities (Final Response recipe — Search leaves default false)
    const includeCapabilities = opts.includeCapabilities === true;
    const capabilities = includeCapabilities ? getCloudPilotCapabilitiesContext() : null;

    //STEP 3: Current State (Chat only — factual open request when present)
    const includeCurrentState = opts.includeCurrentState !== false;
    const currentState = includeCurrentState
        ? buildCurrentStateContext(processMessageContext)
        : null;

    //STEP 4: Current question (what the user said)
    const currentQuestion = buildCurrentQuestionContext(processMessageContext);

    //STEP 5: Knowledge (optional — organization facts for this turn when loaded)
    const includeKnowledge = opts.includeKnowledge !== false;
    const knowledge = includeKnowledge
        ? getKnowledgeContext(processMessageContext)
        : null;

    //STEP 6: Combine
    const aiContext = {
        cloudPilot: cloudPilot,
        capabilities: capabilities,
        currentState: currentState,
        currentQuestion: currentQuestion,
        knowledge: knowledge
    };

    return aiContext;
}

module.exports = {
    buildAIContext
};
