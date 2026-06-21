const openAIFunctions = require('./chat/openAI/openAIFunctions');
const ActionStateFunctions = require('./requests/functions/requestLoadFunctions');
const UnderstandingFunctions = require('./understanding/understandMessage');
const DecisionFunctions = require('./decision/decideNextStep');
const RequestFunctions = require('./requests/functions/requestFunctions');
const ExecutionFunctions = require('./executions/functions/executionFunctions');
const ResponseFunctions = require('./responses/buildResponse');

/*
CloudPilot Pipeline (processMessage)

STEP 1  Normalize message
STEP 2  Load active requests
STEP 3  Understand            WHAT  (understand what the user is asking for)
STEP 4  Decide                WHEN  (Decide what to do next) 
STEP 5  Request update        STORE (in database)
STEP 6  Execute               RUN   (executions/runAction → handler → capability → atlasPost)
STEP 6B History               WHAT CHANGED (inside executionFunctions — changes only)
STEP 7  Build response        Respond (responses/)

HOW  = capabilities/
WHERE = capabilities/atlas/atlasPost.js

*/

/*
FUNCTIONS A: CloudPilot (Atlas) — STEPS 1–7 pipeline
    1) Function A1: Process Message

FUNCTIONS B: Helpers
    1) Function B1: Clone Action Status
    2) Function B2: Get Current User Message
    3) Function B3: Normalize processMessage context
    4) Function B4: Build short response outcome (STEP 7 debug log)
*/

//FUNCTIONS A: CloudPilot (Atlas) — STEPS 1–7 pipeline
//Function A1: Process Message (pipeline)
async function processMessage(rawUserMessage, conversationID, context) {
    const processMessageContext = normalizeProcessMessageContext(context);
    var currentUserMessage = null;
    var currentActionState = null;
    var activeAction = null;

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

    //STEP 2: Load active requests
    currentActionState = await ActionStateFunctions.getUsersActionState(conversationID);
    activeAction = currentActionState.pendingAction;

    console.log("STEP 2: Initial State from User Request");
    await ActionStateFunctions.printUsersActionState(conversationID, "INITIAL STATE:");


    //STEP 3: Understand the user message uses the understanding layer (WHAT)
    const messageUnderstanding = await UnderstandingFunctions.understandMessage(currentUserMessage);

    console.log("STEP 3: Message Understanding");
    console.log(JSON.stringify(messageUnderstanding, null, 2));
    console.log(" ");


    //STEP 4: Decision (WHEN)
    const decision = DecisionFunctions.decideNextStep({
        understanding: messageUnderstanding,
        requestState: currentActionState
    });

    console.log("STEP 4: Decision");
    console.log(JSON.stringify(decision, null, 2));
    console.log(" ");


    //STEP 5: Request update in the database
    const requestOutcome = await RequestFunctions.applyDecision(decision, {
        conversationID: conversationID,
        context: processMessageContext,
        requestState: currentActionState
    });

    console.log("STEP 5: Request Update");
    console.log(JSON.stringify(requestOutcome, null, 2));
    console.log(" ");

    if (requestOutcome.request) {
        currentActionState = requestOutcome.request;
        activeAction = currentActionState.pendingAction;
    }

    if (requestOutcome.success) {
        processMessageOutcome.success = true;
    }

    //STEP 6: Execute request via Atlas (finish row here when workflowId exists)
    //RUN: executeRequest → runAction() → handler → capability → atlasPost → Atlas
    const executionOutcome = await ExecutionFunctions.executeRequest(decision, {
        conversationID: conversationID,
        context: processMessageContext,
        currentUserMessage: currentUserMessage,
        requestState: currentActionState
    });

    if (executionOutcome && executionOutcome.ran) {
        currentActionState = await ActionStateFunctions.getUsersActionState(conversationID);
        activeAction = currentActionState.pendingAction;

        if (executionOutcome.success) {
            processMessageOutcome.cloudPilot.atlasExecution.status = 'completed';
        } else {
            processMessageOutcome.cloudPilot.atlasExecution.status = 'failed';
            processMessageOutcome.error = executionOutcome.error;
        }
    }

    await ActionStateFunctions.printUsersActionState(conversationID, "FINAL STATE:");

    //STEP 7: Build response (words only — no DB, no Atlas)
    const responseOutcome = await ResponseFunctions.buildResponse(decision, {
        conversationID: conversationID,
        currentUserMessage: currentUserMessage,
        requestOutcome: requestOutcome,
        requestState: currentActionState,
        executionOutcome: executionOutcome,
        context: processMessageContext
    });

    //Summary
    const shortResponseOutcome = buildShortResponseOutcome(responseOutcome);
    console.log("STEP 7: Response");
    console.log(JSON.stringify(shortResponseOutcome, null, 2));
    //Full
    //console.log(JSON.stringify(responseOutcome, null, 2));
    console.log(" ");

    if (responseOutcome.cloudPilotMessage) {
        processMessageOutcome.cloudPilotMessage = responseOutcome.cloudPilotMessage;
        processMessageOutcome.success = true;
    }

    if (responseOutcome.atlasResponse) {
        processMessageOutcome.atlasResponse = responseOutcome.atlasResponse;
    }

    if (responseOutcome.error) {
        processMessageOutcome.error = responseOutcome.error;
    }

    if (activeAction) {
        processMessageOutcome.cloudPilot.userRequest = activeAction;
    }

    const actionReady = !currentActionState.missing || currentActionState.missing.length === 0;
    processMessageOutcome.cloudPilot.actionStatus = cloneActionStatus(
        currentActionState,
        activeAction,
        actionReady
    );

  

    return processMessageOutcome;

}


//FUNCTIONS B: Helpers
//Function B1: Clone Action Status
function cloneActionStatus(state, activeAction, ready) {
    return {
        type: activeAction,
        ready: Boolean(ready),
        executionMode: state.executionMode || null,
        missingFields: [...(state.missing || [])],
        collectedFields: { ...(state.collected || {}) },
        askedForFields: { ...(state.asked || {}) }
    };
}

//Function B2: Get Current User Message
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

//Function B3: Normalize processMessage context (masterSite, user)
function normalizeProcessMessageContext(context) {
    const raw = context || {};

    return {
        masterSite: raw.masterSite || 'Cloud Pilot',
        requestedByUserName: String(raw.requestedByUserName || raw.messageFrom || '').trim()
    };
}

//Function B4: Short STEP 7 log — top-level fields + atlasResponse.summary only
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
