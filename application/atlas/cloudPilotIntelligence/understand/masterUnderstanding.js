const { CLOUDPILOT_AI_CONFIG } = require('../../config/cloudPilotAIConfig');
const OpenRequestEffectFunctions = require('../../cloudPilot/requests/interpretOpenRequestEffect');
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
        const contextualOpenRequest = shouldUseContextualOpenRequestUnderstanding(
            requestState
        );
        let values = {};
        let ambiguousFields = [];
        let rejectedFields = [];
        let reply = null;
        let replyType = null;
        let replySource = null;
        let openRequestInterpretation = {
            authoritative: false,
            succeeded: true
        };

        if (contextualOpenRequest) {
            const confirmation =
                await SearchMessageForUserConfirmationFunctions.searchMessageForUserConfirmation(
                    message,
                    requestState
                );

            openRequestInterpretation = {
                authoritative: true,
                succeeded: Boolean(confirmation && confirmation.succeeded !== false)
            };

            if (confirmation && openRequestInterpretation.succeeded) {
                reply = confirmation.reply;
                replyType = confirmation.replyType;
                replySource = confirmation.replySource;
                const partitioned = OpenRequestEffectFunctions.partitionRequestFieldUpdates(
                    requestState,
                    confirmation.values || {}
                );
                values = partitioned.accepted;
                rejectedFields = partitioned.rejected;
                ambiguousFields = Array.isArray(confirmation.ambiguousFields)
                    ? confirmation.ambiguousFields.slice()
                    : [];
            } else {
                reply = null;
                replyType = 'unrelated';
                replySource = 'openai';
                values = {};
                ambiguousFields = [];
                rejectedFields = [];
            }
        } else {
            const valuesOutcome =
                await SearchMessageForValuesFunctions.searchMessageForValues(
                    message,
                    requestState
                );
            values =
                valuesOutcome && valuesOutcome.values
                    ? valuesOutcome.values
                    : valuesOutcome || {};
            ambiguousFields =
                valuesOutcome && Array.isArray(valuesOutcome.ambiguousFields)
                    ? valuesOutcome.ambiguousFields.slice()
                    : [];

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
                    replyType = 'unrelated';
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
            ambiguousFields: ambiguousFields,
            rejectedFields: rejectedFields,
            openRequestInterpretation: openRequestInterpretation,
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

function shouldUseContextualOpenRequestUnderstanding(requestState) {
    if (!CLOUDPILOT_AI_CONFIG.aiEnabled) {
        return false;
    }

    if (CLOUDPILOT_AI_CONFIG.userConfirmationSearch !== 'openai') {
        return false;
    }

    return SearchMessageForUserConfirmationFunctions.shouldRunUserConfirmationSearch(
        requestState
    );
}

module.exports = { understandMessage, shouldUseContextualOpenRequestUnderstanding };
