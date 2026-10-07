/*
finalResponseContext — which high-level context is included for the final
user-facing conversational response (General Chat).

contextTypes/ = WHAT each ingredient contains
This file      = WHICH ingredients the final reply receives

Configuration only. No handlers, OpenAI calls, or prompt prose.
*/

const finalResponseContext = {
    includeIdentity: true,
    includeCapabilities: true,
    includeCurrentState: true,
    includeKnowledge: false,

    conversationHistory: {
        include: true,
        limit: 6
    }
};

module.exports = finalResponseContext;
