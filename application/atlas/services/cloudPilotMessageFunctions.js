const openAIFunctions = require('./chat/openAI/openAIFunctions');
const RequestStateFunctions = require('./requests/functions/requestLoadFunctions');
const UnderstandingFunctions = require('./understanding/understandMessage');
const DecisionFunctions = require('./decision/decideNextStep');
const RequestFunctions = require('./requests/functions/requestFunctions');
const ExecutionFunctions = require('./executions/functions/executionFunctions');
const GeneralConversation = require('./conversation/general/conversation');
const RequestConversation = require('./conversation/request/conversation');

/*
CloudPilot Message Pipeline (processMessage)

Design principle: Every user message is exactly one conversation.

Glossary
  Request              — user wants CloudPilot to do something (cloudpilot_requests)
  Action               — thing CloudPilot knows how to do (actionMap)
  General Conversation — user is just talking
  Request Conversation — help user accomplish work (orchestrates STEPS 5–7)

First gate (after STEP 4)
  General Conversation  → conversation/general/conversation.js → return (skip 5–6)
  Request Conversation  → STEPS 5–7 (maintain state → perform work → speak)

STEP 1  Normalize message
STEP 2  Load active request
STEP 3  Understand            What is the user trying to do?
STEP 4  Decide                Which conversation is this?
STEP 5  Request Conversation  Maintain state (STORE)
STEP 6  Request Conversation  Perform work (RUN — runAction → handler → capability → atlasPost)
STEP 6B History               WHAT CHANGED (inside executionFunctions — changes only)
STEP 7  Request Conversation  Speak (conversation/request/conversation.js)

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
*/

//FUNCTIONS A: CloudPilot (Atlas) — STEPS 1–7 pipeline
//Function A1: Process Message (pipeline)
async function processMessage(rawUserMessage, conversationID, context) {
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
            }
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

    //STEP 2: Load active request
    currentRequestState = await RequestStateFunctions.getUsersActionState(conversationID);
    activeRequestAction = currentRequestState.pendingAction;

    console.log("STEP 2: Initial State from User Request");
    await RequestStateFunctions.printUsersActionState(conversationID, "INITIAL STATE:");


    //STEP 3: Understand — what is the user trying to do?
    const messageUnderstanding = await UnderstandingFunctions.understandMessage(currentUserMessage);

    console.log("STEP 3: Message Understanding");
    console.log(JSON.stringify(messageUnderstanding, null, 2));
    console.log(" ");


    //STEP 4: Decide — which conversation is this?
    const decision = DecisionFunctions.decideNextStep({
        understanding: messageUnderstanding,
        requestState: currentRequestState
    });

    console.log("STEP 4: Decision");
    console.log(JSON.stringify(decision, null, 2));
    console.log(" ");

    // General Conversation — skip STEPS 5–6
    if (GeneralConversation.isGeneralConversation(decision)) {
        console.log("STEP 4: General Conversation — skip STEPS 5–6");

        const conversationOutcome = await GeneralConversation.conversation({
            currentUserMessage: currentUserMessage,
            context: processMessageContext
        });

        const shortResponseOutcome = buildShortResponseOutcome(conversationOutcome);
        console.log("STEP 7: General Conversation — speak");
        console.log(JSON.stringify(shortResponseOutcome, null, 2));
        console.log(" ");

        return applyConversationToProcessMessageOutcome(
            processMessageOutcome,
            conversationOutcome,
            currentRequestState,
            activeRequestAction
        );
    }

    //STEP 5: Request Conversation — maintain state
    const requestOutcome = await RequestFunctions.applyDecision(decision, {
        conversationID: conversationID,
        context: processMessageContext,
        requestState: currentRequestState
    });

    console.log("STEP 5: Request Conversation — maintain state");
    console.log(JSON.stringify(requestOutcome, null, 2));
    console.log(" ");

    if (requestOutcome.request) {
        currentRequestState = requestOutcome.request;
        activeRequestAction = currentRequestState.pendingAction;
    }

    if (requestOutcome.success) {
        processMessageOutcome.success = true;
    }

    //STEP 6: Request Conversation — perform work
    //RUN: executeRequest → runAction() → handler → capability → atlasPost → Atlas
    const executionOutcome = await ExecutionFunctions.executeRequest(decision, {
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


    //STEP 7: Request Conversation — speak (no DB, no Atlas)
    const conversationOutcome = await RequestConversation.conversation(decision, {
        conversationID: conversationID,
        currentUserMessage: currentUserMessage,
        requestOutcome: requestOutcome,
        requestState: currentRequestState,
        executionOutcome: executionOutcome,
        context: processMessageContext
    });

    //Short Response Outcome 
    const shortResponseOutcome = buildShortResponseOutcome(conversationOutcome);
    console.log("STEP 7: Request Conversation — speak");
    console.log(JSON.stringify(shortResponseOutcome, null, 2));
    
    //Full Response Outcome for Testing
    //console.log(JSON.stringify(conversationOutcome, null, 2));
    console.log(" ");

    return applyConversationToProcessMessageOutcome(
        processMessageOutcome,
        conversationOutcome,
        currentRequestState,
        activeRequestAction
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

//Function B4: Normalize processMessage context (masterSite, user)
function normalizeProcessMessageContext(context) {
    const raw = context || {};

    return {
        masterSite: raw.masterSite || 'Cloud Pilot',
        requestedByUserName: String(raw.requestedByUserName || raw.messageFrom || '').trim()
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
