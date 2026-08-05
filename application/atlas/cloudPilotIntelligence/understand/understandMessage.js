const SearchMessageForActionFunctions = require('./search/searchMessageForAction');
const SearchMessageForValuesFunctions = require('./search/searchMessageForValues');
const SearchMessageForReplyFunctions = require('./search/searchMessageForReply');
const SearchMessageForConversationFunctions = require('./search/searchMessageForConversation');

/*
What this file answers:

* What does the user want?
* What action was detected?
* What values, reply, or conversation signals were found?

Outputs: action, values, reply, conversation, ambiguous, candidates

This is the WHAT layer (STEP 3).
Actions: actionMap via searchMessageForAction (scan_ec2, toggle_ec2, …).
Values: searchMessageForValues (region, ids, ai_spend, …).
*/

/*
FUNCTIONS F: Message understanding — extract signals from a message (no DB, no chat text)
    1) Function F1: understandMessage
*/

//Function F1: Orchestrator entry — run all searches, merge into messageUnderstanding
async function understandMessage(message, requestState) {
    const values = await SearchMessageForValuesFunctions.searchMessageForValues(
        message,
        requestState
    );
    const reply = SearchMessageForReplyFunctions.searchMessageForReply(message);
    const conversation = SearchMessageForConversationFunctions.searchMessageForConversation(message);
    const actionResult = SearchMessageForActionFunctions.searchMessageForAction(message);

    // AI spend is a value. Fulfillment still uses show_ai_usage handler (not an Action like toggle_ec2).
    if (values.ai_spend === true) {
        return {
            action: 'show_ai_usage',
            values,
            reply,
            conversation,
            ambiguous: false,
            candidates: [],
            source: 'ai_spend_search',
            confidence: 1.0
        };
    }

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
