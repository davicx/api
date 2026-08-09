const openAIFunctions = require('../../providers/openAI/client/openAIClient');
const RequestStateFunctions = require('../requests/functions/requestLoadFunctions');
const ResourceVerificationFunctions = require('../requests/functions/resourceVerificationFunctions');
const CloudPilotIntelligence = require('../../cloudPilotIntelligence/CloudPilotIntelligence');
const DecisionFunctions = require('../requests/decideNextStep');
const RequestWorkflow = require('../requests/workflow');
const GeneralConversation = require('./general/GeneralConversation');
const RequestConversation = require('./request/RequestConversation');
const HistoryFunctions = require('../history/functions/historyFunctions');

/*
CloudPilot Message Pipeline (processMessage)

Design principle: Every user message is exactly one conversation.

Glossary
  Request              — user wants CloudPilot to do something (cloudpilot_requests)
  Action               — thing CloudPilot knows how to do (actionMap)
  General Conversation — user is just talking
  Request Conversation — help user accomplish work (orchestrates STEPS 5–7)

First gate (after STEP 4)
  General Conversation  → conversation/general/GeneralConversation.js → return (skip 5–6)
  Request Conversation  → STEPS 5–7 (maintain state → perform work → speak)

STEP 1  Normalize message (HTTP: Build Message is STEP 1 in messages.js)
STEP 2  Initial State
STEP 3  Region Search (compact log inside understand)
STEP 4  Message Understanding
STEP 5  Decision
STEP 6  Execute (or Skipped — General Conversation)
STEP 7  Save CloudPilot Message (messages.js)
STEP 8  Final Response (messages.js)

OpenAI capability blocks are buffered and flushed after STEP 8 (Story 2).

HOW  = capabilities/
WHERE = capabilities/atlas/atlasPost.js

*/

/*
FUNCTIONS A: CloudPilot (Atlas) — STEPS 1–7 pipeline
    1) Function A1: Process Message

FUNCTIONS B: Helpers
    1) Function B1: Apply conversation outcome to processMessage shape
    2) Function B2: Clone Action Status
    3) Function B3: Get Current User Message
    4) Function B4: Normalize processMessage context
    5) Function B5: Build short response outcome (STEP 7 debug log)
    6) Function B6: Attach undoAvailable hint after history is recorded
*/

//FUNCTIONS A: CloudPilot (Atlas) — STEPS 1–7 pipeline
//Function A1: Process Message (pipeline)
async function processMessage(rawUserMessage, conversationID, context) {
    openAIFunctions.resetOpenAIRequestCounter();

    const processMessageContext = normalizeProcessMessageContext(context);
    var currentUserMessage = null;
    var currentRequestState = null;
    var activeRequestAction = null;

    var processMessageOutcome = {
        success: false, 
        cloudPilotMessage: "",
        cloudPilot: { 
            userRequest: null, // e.g. "scan_ec2", "toggle_ec2", "general_chat"
            //Later Add Policy

            actionStatus: {
                type: null, // What action the user asked for ("scan_ec2", "toggle_ec2") null if it is just general_chat
                ready: false,

                missingFields: [],
                collectedFields: {},
                askedForFields: {},
                executionMode: null
            },
            atlasExecution: {
                status: "idle", // "idle" | "running" | "completed" | "failed"
                actionId: null, // Atlas execution ID
                startedAt: null,
                completedAt: null,
                error: null
            },
            undoAvailable: false
        },
        atlasResponse: null, //This is the response we get from Atlas after an AWS interaction
        error: null 
    };

    //STEP 1: Normalize user message
    const currentUserMessageOutcome = getCurrentUserMessage(rawUserMessage);

    if (!currentUserMessageOutcome.success) {
        processMessageOutcome.success = false;
        processMessageOutcome.error = currentUserMessageOutcome.error;
        return processMessageOutcome;         
    }

    currentUserMessage = currentUserMessageOutcome.currentUserMessage;

    //STEP 2: Load active request / initial state
    currentRequestState = await RequestStateFunctions.getUsersActionState(conversationID);
    activeRequestAction = currentRequestState.pendingAction;

    console.log("STEP 2: Initial State");
    await RequestStateFunctions.printUsersActionState(conversationID, "INITIAL STATE:");


    // Understand (region search logs as STEP 3 inside searchMessageForRegion)
    const messageUnderstanding = await CloudPilotIntelligence.understandMessage(
        currentUserMessage,
        currentRequestState
    );

    console.log("STEP 4: Message Understanding");
    console.log(JSON.stringify(messageUnderstanding, null, 2));
    console.log(" ");


    //STEP 5: Decide — which conversation is this?
    let decision = DecisionFunctions.decideNextStep({
        understanding: messageUnderstanding,
        requestState: currentRequestState
    });

    console.log("STEP 5: Decision");
    console.log(JSON.stringify(decision, null, 2));
    console.log(" ");

    // General Conversation — skip execute
    // Guardrail: Questions never answer via MESSAGE_RESPONSE / OpenAI general chat
    if (GeneralConversation.isGeneralConversation(decision)) {
        if (messageUnderstanding.question) {
            console.warn(
                '[CLOUDPILOT_QUESTION_GUARDRAIL] question=' +
                    messageUnderstanding.question +
                    ' was routed to general chat; correcting to CloudPilot Question path'
            );
            decision = DecisionFunctions.resolveQuestionDecision(
                currentRequestState,
                messageUnderstanding.question,
                messageUnderstanding
            );
        }
    }

    if (GeneralConversation.isGeneralConversation(decision)) {
        console.log("STEP 6: Execute");
        console.log("Skipped (General Conversation)");
        console.log(" ");

        const conversationOutcome = await GeneralConversation.conversation({
            ...processMessageContext,
            currentUserMessage: currentUserMessage,
            conversationID: conversationID,
            requestState: currentRequestState
        });

        const shortResponseOutcome = buildShortResponseOutcome(conversationOutcome);
        processMessageOutcome.logFinalResponse = shortResponseOutcome;

        return await attachUndoAvailable(
            applyConversationToProcessMessageOutcome(
                processMessageOutcome,
                conversationOutcome,
                currentRequestState,
                activeRequestAction
            ),
            conversationID
        );
    }

    //STEP 6: Request Conversation — maintain state + perform work
    console.log("STEP 6: Execute");

    const requestOutcome = await RequestWorkflow.store(decision, {
        conversationID: conversationID,
        context: processMessageContext,
        requestState: currentRequestState
    });

    console.log(JSON.stringify(requestOutcome, null, 2));
    console.log(" ");

    if (requestOutcome.request) {
        currentRequestState = requestOutcome.request;
        activeRequestAction = currentRequestState.pendingAction;
    }

    if (requestOutcome.success) {
        processMessageOutcome.success = true;
    }

    // Existing-resource preflight (pause/resume): Atlas verify after persist, before mode speech
    // Doc: feature_verify_request.md Step 2 — decideNextStep stays sync; no Intelligence verify
    const preflightOutcome = await ResourceVerificationFunctions.runVerifyResourcePreflight(
        decision,
        currentRequestState
    );

    if (preflightOutcome.requestState) {
        currentRequestState = preflightOutcome.requestState;
        activeRequestAction = currentRequestState.pendingAction;
    }

    if (preflightOutcome.blocked) {
        console.log('STEP 6b: verifyResource preflight blocked progression');
        console.log(JSON.stringify(preflightOutcome.verification, null, 2));
        console.log(' ');
    }

    //RUN: executeRequest → runAction() → handler → capability → atlasPost → Atlas
    const executionOutcome = await RequestWorkflow.execute(decision, {
        conversationID: conversationID,
        context: processMessageContext,
        currentUserMessage: currentUserMessage,
        requestState: currentRequestState
    });

    if (executionOutcome && executionOutcome.ran) {
        currentRequestState = await RequestStateFunctions.getUsersActionState(conversationID);
        activeRequestAction = currentRequestState.pendingAction;

        if (executionOutcome.success) {
            processMessageOutcome.cloudPilot.atlasExecution.status = 'completed';
        } else {
            processMessageOutcome.cloudPilot.atlasExecution.status = 'failed';
            processMessageOutcome.error = executionOutcome.error;
        }
    }

    await RequestStateFunctions.printUsersActionState(conversationID, "FINAL STATE:");


    // Speak (reply text) — logged as STEP 8 Final Response after save in messages.js
    const conversationOutcome = await RequestConversation.conversation(decision, {
        conversationID: conversationID,
        currentUserMessage: currentUserMessage,
        requestOutcome: requestOutcome,
        requestState: currentRequestState,
        executionOutcome: executionOutcome,
        context: processMessageContext
    });

    const shortResponseOutcome = buildShortResponseOutcome(conversationOutcome);
    processMessageOutcome.logFinalResponse = shortResponseOutcome;

    return await attachUndoAvailable(
        applyConversationToProcessMessageOutcome(
            processMessageOutcome,
            conversationOutcome,
            currentRequestState,
            activeRequestAction
        ),
        conversationID
    );

}


//FUNCTIONS B: Helpers
//Function B1: Merge conversation outcome into processMessage API shape
function applyConversationToProcessMessageOutcome(
    processMessageOutcome,
    conversationOutcome,
    currentRequestState,
    activeRequestAction
) {
    if (conversationOutcome.cloudPilotMessage) {
        processMessageOutcome.cloudPilotMessage = conversationOutcome.cloudPilotMessage;
        processMessageOutcome.success = true;
    }

    if (conversationOutcome.atlasResponse) {
        processMessageOutcome.atlasResponse = conversationOutcome.atlasResponse;
    }

    if (conversationOutcome.error) {
        processMessageOutcome.error = conversationOutcome.error;
    }

    if (activeRequestAction) {
        processMessageOutcome.cloudPilot.userRequest = activeRequestAction;
    }

    const actionReady = !currentRequestState.missing || currentRequestState.missing.length === 0;
    processMessageOutcome.cloudPilot.actionStatus = cloneActionStatus(
        currentRequestState,
        activeRequestAction,
        actionReady
    );

    return processMessageOutcome;
}

//Function B6: After execute + record history, expose whether undo is available (H6)
async function attachUndoAvailable(processMessageOutcome, conversationID) {
    processMessageOutcome.cloudPilot.undoAvailable = await HistoryFunctions.hasUndoAvailable({
        conversationId: conversationID
    });

    return processMessageOutcome;
}

//Function B2: Clone Action Status
function cloneActionStatus(state, activeRequestAction, ready) {
    return {
        type: activeRequestAction,
        ready: Boolean(ready),
        executionMode: state.executionMode || null,
        missingFields: [...(state.missing || [])],
        collectedFields: { ...(state.collected || {}) },
        askedForFields: { ...(state.asked || {}) }
    };
}

//Function B3: Get Current User Message
function getCurrentUserMessage(rawUserMessage) {
    const normalizedMessageOutcome = openAIFunctions.normalizeUserMessageForModel(rawUserMessage);

    if (!normalizedMessageOutcome.ok) {
        // console.log("STEP 1: Normalize message outcome failed");

        return {
            success: false,
            currentUserMessage: null,
            error: normalizedMessageOutcome.message
        };
    }

    const currentUserMessage = normalizedMessageOutcome.text;

    // console.log("STEP 1: Normalize message outcome OK");
    // console.log("Current user message (text): " + currentUserMessage);

    return {
        success: true,
        currentUserMessage: currentUserMessage,
        error: null
    };
}

//Function B4: Normalize processMessage context (masterSite, user, selectedFinding)
function normalizeProcessMessageContext(context) {
    const raw = context || {};

    return {
        masterSite: raw.masterSite || 'Cloud Pilot',
        requestedByUserName: String(raw.requestedByUserName || raw.messageFrom || '').trim(),
        selectedFinding: raw.selectedFinding || null
    };
}

//Function B5: Short STEP 7 log — top-level fields + atlasResponse.summary only
function buildShortResponseOutcome(responseOutcome) {
    const source = responseOutcome || {};

    const shortResponseOutcome = {
        success: source.success,
        cloudPilotMessage: source.cloudPilotMessage,
        chatType: source.chatType,
        error: source.error ?? null
    };

    const atlasResponse = source.atlasResponse;

    if (!atlasResponse) {
        shortResponseOutcome.atlasResponse = null;
        return shortResponseOutcome;
    }

    if (atlasResponse.summary) {
        shortResponseOutcome.atlasResponse = {
            summary: atlasResponse.summary
        };
        return shortResponseOutcome;
    }

    const navigatorMeta =
        atlasResponse.navigatorResponse &&
        atlasResponse.navigatorResponse.data &&
        atlasResponse.navigatorResponse.data.meta;

    if (navigatorMeta) {
        shortResponseOutcome.atlasResponse = {
            summary: navigatorMeta
        };
        return shortResponseOutcome;
    }

    const {
        navigatorResponse,
        instances,
        findings,
        ...atlasResponseWithoutBulk
    } = atlasResponse;

    shortResponseOutcome.atlasResponse =
        Object.keys(atlasResponseWithoutBulk).length > 0
            ? atlasResponseWithoutBulk
            : null;

    return shortResponseOutcome;
}

module.exports = { processMessage };
