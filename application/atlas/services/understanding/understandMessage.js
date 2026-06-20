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


module.exports = { understandMessage };
