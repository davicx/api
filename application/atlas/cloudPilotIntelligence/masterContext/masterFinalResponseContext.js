/*
masterFinalResponseContext — recipe for General Chat / final user-facing reply

contextTypes/   = WHAT each ingredient contains
masterContext/  = WHICH ingredients this AI call receives
operationContext/ = specialized task payloads (not used here)

Configuration only. No handlers, OpenAI calls, or prompt prose.
*/

const masterFinalResponseContext = {
    includeIdentity: true,
    includeCapabilities: true,
    includeCurrentState: true,
    includeKnowledge: false,

    // Situation ON when appropriate — empty = no Situation block for default final reply
    situationTypes: [],

    conversationHistory: {
        include: true,
        limit: 6
    }
};

module.exports = masterFinalResponseContext;
