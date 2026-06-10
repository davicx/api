const SearchMessageForActionFunctions = require('./search/searchMessageForAction');
const SearchMessageForValuesFunctions = require('./search/searchMessageForValues');
const SearchMessageForReplyFunctions = require('./search/searchMessageForReply');
const SearchMessageForConversationFunctions = require('./search/searchMessageForConversation');

/*
FUNCTIONS F: Message understanding — extract signals from a message (no DB, no chat text)
    1) Function F1: understandMessage

FUNCTIONS A: Helpers
    1) Function A1: buildUnderstandingContext
*/

//Function F1: Orchestrator entry — run all searches, merge into messageUnderstanding
async function understandMessage(message, actionState) {
    const context = buildUnderstandingContext(actionState);
    const activeRequest = context.activeRequest || null;

    const values = SearchMessageForValuesFunctions.searchMessageForValues(message);
    const reply = SearchMessageForReplyFunctions.searchMessageForReply(message);
    const conversation = SearchMessageForConversationFunctions.searchMessageForConversation(message);

    const emptySignals = {
        action: null,
        values,
        reply,
        conversation,
        ambiguous: false,
        candidates: [],
        source: 'rules',
        confidence: 1.0
    };

    // Slice 1: skip action detection when a request is already open (moves to processRequest in Slice 2)
    if (activeRequest) {
        return emptySignals;
    }

    const actionResult = SearchMessageForActionFunctions.searchMessageForAction(message);

    return {
        action: actionResult.action,
        values,
        reply,
        conversation,
        ambiguous: actionResult.ambiguous,
        candidates: actionResult.candidates.slice(),
        source: actionResult.source,
        confidence: actionResult.confidence
    };
}

//Function A1: Build context from loaded request state (temporary — removed in Slice 2)
function buildUnderstandingContext(actionState) {
    const state = actionState || {};

    return {
        activeRequest: state.pendingAction || null,
        status: state.status || null,
        missing: Array.isArray(state.missing) ? state.missing.slice() : [],
        executionMode: state.executionMode || null
    };
}

module.exports = { understandMessage, buildUnderstandingContext };
