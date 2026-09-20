const SearchMessageForActionFunctions = require('./search/searchMessageForAction');
const SearchMessageForValuesFunctions = require('./search/searchMessageForValues');
const SearchMessageForReplyFunctions = require('./search/searchMessageForReply');
const SearchMessageForUserConfirmationFunctions = require('./search/searchMessageForUserConfirmation');
const SearchMessageForConversationFunctions = require('./search/searchMessageForConversation');
const SearchMessageForQuestionFunctions = require('./search/searchMessageForQuestion');
const SearchLogs = require('./search/helpers/searchLogs');

/*
What this file answers:

* What does the user want?
* What action, values, reply, conversation, or question signals were found?

Outputs: action, values, reply, replyType, replySource, conversation, question, ambiguous, candidates

This is the WHAT layer (STEP 3).

UNDERSTANDING — LOCKED

    Action
    → I want CloudPilot to DO something.

    Value
    → I'm TELLING CloudPilot something.

    Question
    → I want CloudPilot to TELL ME something it knows or can retrieve.

    Conversation
    → I want to TALK.

Understanding Conversation ≠ Turn Conversation (message history).

Question subtypes (Organizational Knowledge is a type of Question — not a rename of Question):

    Organizational Knowledge Question  — "Which S3 bucket stores user uploads?"
    CloudPilot State Question          — "What open requests do I have?"
    AWS State Question                 — "What EC2 instances do I have?"
    Usage Question                     — "How much have I spent on AI?"

Actions: actionMap via searchMessageForAction (scan_ec2, toggle_ec2, …).
Values: searchMessageForValues (region, ids, name, …).
Questions: searchMessageForQuestion (open_requests, ai_spend, ec2_inventory, s3_inventory, …).
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

        let reply = null;
        let replyType = null;
        let replySource = null;

        const waitingOnConfirmation =
            SearchMessageForUserConfirmationFunctions.shouldRunUserConfirmationSearch(
                requestState
            );

        if (waitingOnConfirmation) {
            const confirmation =
                await SearchMessageForUserConfirmationFunctions.searchMessageForUserConfirmation(
                    message,
                    requestState
                );

            if (confirmation) {
                reply = confirmation.reply;
                replyType = confirmation.replyType;
                replySource = confirmation.replySource;
            } else {
                replyType = 'unclear';
                replySource = 'internal';
            }
        } else {
            reply = SearchMessageForReplyFunctions.searchMessageForReply(message);

            if (reply === 'confirm') {
                replyType = 'confirm';
                replySource = 'internal';
            } else if (reply === 'cancel') {
                replyType = 'cancel';
                replySource = 'internal';
            }
        }

        const conversation =
            SearchMessageForConversationFunctions.searchMessageForConversation(message);
        const question = await SearchMessageForQuestionFunctions.searchMessageForQuestion(
            message
        );
        const actionResult = await SearchMessageForActionFunctions.searchMessageForAction(
            message
        );

        return {
            action: actionResult.action,
            values,
            reply,
            replyType,
            replySource,
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
