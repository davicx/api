const SearchMessageForActionFunctions = require('./search/searchMessageForAction');
const SearchMessageForValuesFunctions = require('./search/searchMessageForValues');
const SearchMessageForReplyFunctions = require('./search/searchMessageForReply');
const SearchMessageForConversationFunctions = require('./search/searchMessageForConversation');

/*
FUNCTIONS F: Message understanding — extract signals from a message (no DB, no chat text)
    1) Function F1: understandMessage
*/

//Function F1: Orchestrator entry — run all searches, merge into messageUnderstanding
async function understandMessage(message) {
    const values = SearchMessageForValuesFunctions.searchMessageForValues(message);
    const reply = SearchMessageForReplyFunctions.searchMessageForReply(message);
    const conversation = SearchMessageForConversationFunctions.searchMessageForConversation(message);
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

// DECISION: Moved to decision/ — open-request guard skipped action detection (Slice 2)
// async function understandMessage(message, actionState) {
//     const context = buildUnderstandingContext(actionState);
//     const activeRequest = context.activeRequest || null;
//
//     const values = SearchMessageForValuesFunctions.searchMessageForValues(message);
//     const reply = SearchMessageForReplyFunctions.searchMessageForReply(message);
//     const conversation = SearchMessageForConversationFunctions.searchMessageForConversation(message);
//
//     const emptySignals = {
//         action: null,
//         values,
//         reply,
//         conversation,
//         ambiguous: false,
//         candidates: [],
//         source: 'rules',
//         confidence: 1.0
//     };
//
//     if (activeRequest) {
//         return emptySignals;
//     }
//
//     const actionResult = SearchMessageForActionFunctions.searchMessageForAction(message);
//
//     return {
//         action: actionResult.action,
//         values,
//         reply,
//         conversation,
//         ambiguous: actionResult.ambiguous,
//         candidates: actionResult.candidates.slice(),
//         source: actionResult.source,
//         confidence: actionResult.confidence
//     };
// }

// DECISION: Moved to decision/
// function buildUnderstandingContext(actionState) {
//     const state = actionState || {};
//
//     return {
//         activeRequest: state.pendingAction || null,
//         status: state.status || null,
//         missing: Array.isArray(state.missing) ? state.missing.slice() : [],
//         executionMode: state.executionMode || null
//     };
// }

module.exports = { understandMessage };
