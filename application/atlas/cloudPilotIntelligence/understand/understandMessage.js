const SearchMessageForActionFunctions = require('./search/searchMessageForAction');
const SearchMessageForValuesFunctions = require('./search/searchMessageForValues');
const SearchMessageForReplyFunctions = require('./search/searchMessageForReply');
const SearchMessageForConversationFunctions = require('./search/searchMessageForConversation');
const SearchMessageForQuestionFunctions = require('./search/searchMessageForQuestion');
const SearchLogs = require('./search/helpers/searchLogs');

/*
What this file answers:

* What does the user want?
* What action was detected?
* What values, reply, conversation, or question signals were found?

Outputs: action, values, reply, conversation, question, ambiguous, candidates

This is the WHAT layer (STEP 3).
Actions: actionMap via searchMessageForAction (scan_ec2, toggle_ec2, …).
Values: searchMessageForValues (region, ids, name, …).
Questions: searchMessageForQuestion (open_requests, ai_spend, …).
*/

/*
FUNCTIONS F: Message understanding — extract signals from a message (no DB, no chat text)
    1) Function F1: understandMessage
*/

//Function F1: Orchestrator entry — run all searches, merge into messageUnderstanding
async function understandMessage(message, requestState) {
    SearchLogs.beginSearchSession();

    try {
        const values = await SearchMessageForValuesFunctions.searchMessageForValues(
            message,
            requestState
        );
        const reply = SearchMessageForReplyFunctions.searchMessageForReply(message);
        const conversation =
            SearchMessageForConversationFunctions.searchMessageForConversation(message);
        const question = await SearchMessageForQuestionFunctions.searchMessageForQuestion(
            message
        );
        const actionResult = SearchMessageForActionFunctions.searchMessageForAction(message);

        return {
            action: actionResult.action,
            values,
            reply,
            conversation,
            question: question,
            ambiguous: actionResult.ambiguous,
            candidates: actionResult.candidates.slice(),
            source: question ? 'question_search' : actionResult.source,
            confidence: actionResult.confidence
        };
    } finally {
        SearchLogs.flushSearchLog();
    }
}

module.exports = { understandMessage };
