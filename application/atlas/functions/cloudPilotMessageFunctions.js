const openAIFunctions = require('./chat/openAI/openAIFunctions');
const actionRegistry = require('./actions/actionRegistry');
const Functions = require('./functions');
const ActionStateFunctions = require('./actions/actionStateFunctions');
const UnderstandingFunctions = require('./understanding/understandMessage');
const DecisionFunctions = require('./decision/decideNextStep');
const AtlasExecution = require('./classes/AtlasExecution');
const CloudPilotChat = require('./chat/cloudPilotChat');
const ActionStatusFunctions = require('./actionStatusFunctions');

/*
FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
    1) Function A1: Process Message (pipeline)

FUNCTIONS B: Request Detection / Action Lookup
    1) Function B1: Detect User Request
    2) Function B2: Get Action Definition

FUNCTIONS C: Chat Handlers
    1) Function C1: Handle General Chat
    2) Function C2: Handle CloudPilot Chat (imported from ./chat/cloudPilotChat)

FUNCTIONS D: Helpers
    1) Function D1: Clone Action Status
    2) Function D2: Should Start New Action
    3) Function D3: Get Current User Message
    4) Function D4: Print State
*/

/*
System Layer: activeAction
Registry Layer: actionDefinition
Execution Layer: execution (done by atlas)

//Sync Data
//processMessageOutcome.cloudPilot.actionStatus = cloneActionStatus(currentActionState, null, false);


*/
//FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
//Function A1: Process Message (pipeline)
async function processMessage(rawUserMessage, conversationID, context) {
    const processMessageContext = normalizeProcessMessageContext(context);
    var currentUserMessage = null;
    var currentActionState = null;
    var activeAction = null;
    //let actionEvent = null;
    //let cloudPilotShouldRespond = false;
    //let actionTransitionedToReady = false;
    //let actionPendingConfirmation = false;
    //let executionModeSelected = false;
    //let newActionStarted = false;
    //let fieldsUpdated = false;

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

    console.log(currentUserMessage);

    //STEP 2: Load active requests
    currentActionState = await ActionStateFunctions.getUsersActionState(conversationID);
    activeAction = currentActionState.pendingAction;

    await ActionStateFunctions.printUsersActionState(conversationID, "INITIAL STATE:");


    //STEP 3: Understand the user message
    const messageUnderstanding = await UnderstandingFunctions.understandMessage(currentUserMessage);

    console.log("STEP 3: MESSAGE UNDERSTANDING:");
    console.log(JSON.stringify(messageUnderstanding, null, 2));
    console.log(" ");


    //STEP 4: Decision
    const decision = DecisionFunctions.decideNextStep({
        understanding: messageUnderstanding,
        requestState: currentActionState
    });

    console.log("STEP 4: DECISION:");
    console.log(JSON.stringify(decision, null, 2));
    console.log(" ");

    /*
    //STEP 3: Check if user is requesting an action not just general chat
    const actionDefinition = getActionDefinition(userRequest);
    console.log("STEP 3: ACTION- Full from Action Registry ");
    console.log(actionDefinition)
    console.log(" ");
    
    const shouldExecuteImmediately = actionDefinition.requiresWorkflow === false && actionDefinition.requiresExecution === true;
    
    //STEP 4: Start or replace active request
    if (actionDefinition.requiresWorkflow) {
        cloudPilotShouldRespond = true;

        // Start a new requested action when there is no matching active request.
        const shouldStartNewActionNow = shouldStartNewAction(activeAction, actionDefinition, currentActionState);
        
        if (shouldStartNewActionNow) {
            console.log("STEP 4: Starting active request");
            console.log(" ");

            const startOutcome = await ActionStateFunctions.startNewUsersAction(
                conversationID,
                processMessageContext,
                actionDefinition
            );

            if (!startOutcome.success) {
                console.log("STEP 4: Failed to persist action to database");
                console.log(startOutcome.errors);
            }

            currentActionState = startOutcome.state;
            newActionStarted = true;
        }

        // Refresh active request state
        currentActionState = await ActionStateFunctions.getUsersActionState(conversationID);
        activeAction = currentActionState.pendingAction;
        //processMessageOutcome.cloudPilot.state = cloneOperationState(currentStateData);
    } else if (shouldExecuteImmediately) {
        console.log("STEP 4: Immediate execution action");
        console.log(" ");

        actionEvent = "execution_requested";
        cloudPilotShouldRespond = true;
    } else {
        console.log("STEP 4: NOT Starting active request just chattin dude");
    }

    const hadMissingFieldsBefore = activeAction && currentActionState.missing.length > 0;


    // TO DO: remove me — message field parsing moves to understanding/getValues.js (P2+)
    //STEP 5: Extract structured workflow fields from the user message.
    if (activeAction && currentActionState.missing.length > 0) {
        const extractedFields = Functions.extractStructuredFields(currentUserMessage);
        const messageUsesStructuredFormat = Object.keys(extractedFields).length > 0;
        const missingFields = currentActionState.missing.slice();
        let heuristicInstanceIdUsed = false;

        for (const missingFieldName of missingFields) {

            let fieldValue = extractedFields[missingFieldName];

            if (!fieldValue && !messageUsesStructuredFormat && typeof Functions[missingFieldName] === "function") {
                const isInstanceIdField =
                    missingFieldName === "instance_id" ||
                    missingFieldName === "primary_instance_id" ||
                    missingFieldName === "secondary_instance_id";

                if (isInstanceIdField && heuristicInstanceIdUsed) {
                    continue;
                }

                fieldValue = Functions[missingFieldName](currentUserMessage);

                if (fieldValue && isInstanceIdField) {
                    heuristicInstanceIdUsed = true;
                }
            }

            if (!fieldValue) {
                continue;
            }

            console.log("STEP 5: Found field:", missingFieldName, fieldValue);

            currentActionState = await ActionStateFunctions.setUsersActionField(
                conversationID,
                missingFieldName,
                fieldValue
            );
            fieldsUpdated = true;

            activeAction = currentActionState.pendingAction;
        }

    } else {
        console.log("STEP 5: Nothing pending so we did not look for any updated information");
    }

    const activeActionDefinition = getActionDefinition(activeAction || userRequest);

    const actionSupportsExecutionModes =
        actionRegistry.actionRequiresExecutionModeSelection(activeActionDefinition);

    //STEP 6: Gather information for request and see if it is just became ready or was ready
    const actionReady = Functions.determineRequestReadiness(activeAction, currentActionState);

    //Step 6A: Update status — waiting on mode or confirmation (not generic "ready")
    if (
        actionReady &&
        shouldUpdateStatusWhenFieldsComplete(
            currentActionState.status,
            actionSupportsExecutionModes,
            currentActionState.executionMode
        )
    ) {
        const newStatus = ActionStatusFunctions.statusWhenFieldsComplete(
            actionSupportsExecutionModes,
            currentActionState.executionMode
        );

        console.log("Step 6A: Updating action status to", newStatus);

        currentActionState = await ActionStateFunctions.setUsersActionStatus(conversationID, newStatus);

        activeAction = currentActionState.pendingAction;
    }

    //Step 6B: Check if the ready JUST happened 
    if (hadMissingFieldsBefore && actionReady) {
        console.log("Step 6B: Requested Action transitioned to READY");

        actionTransitionedToReady = true;
    }

    // TO DO: remove me — execution mode / confirm parsing moves to understanding/getReply.js (P3+)
    //Step 6F: Capture execution mode selection (destructive tier only)
    if ( actionReady && actionSupportsExecutionModes && !currentActionState.executionMode) {
        const executionMode = Functions.extractExecutionMode(currentUserMessage);

        if (executionMode) {
            console.log("STEP 6F: Execution mode selected:", executionMode);

            currentActionState = await ActionStateFunctions.setUsersActionExecutionMode(conversationID, executionMode);

            activeAction = currentActionState.pendingAction;
            executionModeSelected = true;

            currentActionState = await ActionStateFunctions.setUsersActionStatus(
                conversationID,
                ActionStatusFunctions.STATUS.WAITING_ON_CONFIRMATION
            );
            activeAction = currentActionState.pendingAction;
        }
    }
    
    //Step 6C: CloudPilot should respond when request just became ready
    if (actionTransitionedToReady) {
        console.log("Step 6C: CloudPilot should respond");

        cloudPilotShouldRespond = true;
    }

    //Step 6E: Determine workflow event
    const workflowActionEvent = Functions.determineActionEvent({
        actionDefinition: actionDefinition,
        activeAction: activeAction,
        actionState: currentActionState,
        hadMissingFieldsBefore: hadMissingFieldsBefore,
        actionTransitionedToReady: actionTransitionedToReady,
        newActionStarted: newActionStarted,
        fieldsUpdated: fieldsUpdated
    });

    if (workflowActionEvent) {
        actionEvent = workflowActionEvent;

        console.log("Step 6E: Workflow event detected:", actionEvent);

        cloudPilotShouldRespond = true;
    }

    const executionModeEvent = Functions.determineExecutionModeEvent({
        actionReady: actionReady,
        executionMode: currentActionState.executionMode,
        actionSupportsExecutionModes: actionSupportsExecutionModes
    });

    if (executionModeEvent) {
        actionEvent = executionModeEvent;

        console.log("Step 6E (mode): Workflow event detected:", actionEvent);

        cloudPilotShouldRespond = true;
    }

    if (executionModeSelected) {
        actionEvent = "awaiting_confirmation";

        console.log("Step 6E (confirm): Workflow event after mode selection");

        cloudPilotShouldRespond = true;
    }

    //Step 6D: Check if action is pending confirmation
    actionPendingConfirmation =
        activeAction &&
        ActionStatusFunctions.isWaitingOnConfirmation(currentActionState.status) &&
        !actionTransitionedToReady &&
        (
            !actionSupportsExecutionModes ||
            currentActionState.executionMode
        );

    if (actionPendingConfirmation) {
        console.log("Step 6D: Action pending confirmation");
    }

    //STEP 7: Execution lifecycle
    if (actionPendingConfirmation) {
        console.log("Step 7A: Action awaiting execution confirmation");

        // TO DO: remove me — confirmation parsing moves to understanding/getReply.js (P3+)
        const userConfirmedExecution = Functions.shouldStartExecution({
            activeAction: activeAction,
            actionState: currentActionState,
            currentUserMessage: currentUserMessage,
            actionSupportsExecutionModes: actionSupportsExecutionModes
        });

        if (userConfirmedExecution) {
            console.log("Step 7B: User confirmed execution");
            actionEvent = "execution_requested";

            cloudPilotShouldRespond = true;

            if (activeAction) {
                processMessageOutcome.cloudPilot.userRequest = activeAction;
                processMessageOutcome.cloudPilot.actionStatus.type = activeAction;
            }
        }
    }

    // TO DO: remove me — confirmation parsing moves to understanding/getReply.js (P3+)
    //Step 7C: Failed workflow — user said yes but execution already failed
    if (
        !actionEvent &&
        activeAction &&
        currentActionState.status === "failed" &&
        Functions.userConfirmedAction(currentUserMessage)
    ) {
        console.log("Step 7C: Confirmation after failed workflow");

        actionEvent = "workflow_failed";
        cloudPilotShouldRespond = true;
    }

    //Step 7D: Resolve null actionEvent when workflow is still open
    actionEvent = resolveNullActionEvent({
        actionEvent: actionEvent,
        cloudPilotShouldRespond: cloudPilotShouldRespond,
        activeAction: activeAction,
        currentActionState: currentActionState,
        userRequest: userRequest,
        actionReady: actionReady,
        actionSupportsExecutionModes: actionSupportsExecutionModes
    });

    if (actionEvent && !cloudPilotShouldRespond && activeAction && userRequest === activeAction) {
        cloudPilotShouldRespond = true;
    }

    if (actionEvent) {
        console.log("Step 7D: Resolved workflow event:", actionEvent);
    }

    const chatPayload = {
        conversationID,
        currentUserMessage,
        userRequest,

        actionEvent,
    
        // Static action registry definition
        actionDefinition: activeActionDefinition,
    
        // Whether the workflow is currently executable
        actionReady,
    
        // Persisted workflow state
        actionState: {
            pendingAction: activeAction,
            status: currentActionState.status,
            executionMode: currentActionState.executionMode,
            missingFields: [...(currentActionState.missing || [])],
            collectedFields: { ...(currentActionState.collected || {}) },
            askedForFields: { ...(currentActionState.asked || {}) }
        }
    };

    let refreshedActionReady = actionReady;

    //STEP 8: Chat response routing
    if (cloudPilotShouldRespond) {
        const result = await CloudPilotChat.handleCloudPilotChat(chatPayload);

        const chatMessage = result.cloudPilotMessage || result.message || "";

        processMessageOutcome.cloudPilotMessage = chatMessage;
        processMessageOutcome.atlasResponse = result.atlasResponse || null;
        processMessageOutcome.error = result.error || null;

        if (chatMessage) {
            processMessageOutcome.success = true;
        } else {
            processMessageOutcome.success = result.success;
        }

        currentActionState = await ActionStateFunctions.getUsersActionState(conversationID);
        activeAction = currentActionState.pendingAction;
        refreshedActionReady = Functions.determineRequestReadiness(activeAction, currentActionState);

        console.log("Step 8: CLOUD_PILOT selected");
    } else {

        console.log("Step 8: OPEN_AI selected");
        console.log("OPEN_AI PAYLOAD:");
        console.log(JSON.stringify(chatPayload, null, 2));

        processMessageOutcome.success = true;
        processMessageOutcome.cloudPilotMessage = "OPEN_AI is responding";
    }

    //TO DO: Move requestStatus syncing to the end of processMessage after all state changes run.
    //Also maybe set all manually one by one this is confusing
    processMessageOutcome.cloudPilot.actionStatus = cloneActionStatus(currentActionState, activeAction, refreshedActionReady);
    
    await ActionStateFunctions.printUsersActionState(conversationID, "FINAL STATE:");
    //STATE TEMP
    //console.log("_______________processMessage______________________")    
    console.log("FINAL END OF FUNCTION: processMessageOutcome ")
    console.log(processMessageOutcome)
    console.log(" processMessageOutcome ")

    console.log(" ");
    */

    return processMessageOutcome;

}


    // TO DO: remove me — replaced by understanding/understandMessage (Slice 1)
    // const userRequest = detectUserRequest(currentUserMessage);
    // processMessageOutcome.cloudPilot.userRequest = userRequest;
    // processMessageOutcome.cloudPilot.actionStatus.type = userRequest === "general_chat" ? null : userRequest;
    

// TO DO: remove me — moved to understanding/search/searchMessageForAction.js (Slice 1)
//FUNCTIONS B: Process User Messages
//Function B1: Detect User Request
// function detectUserRequest(userMessage) {
//     const normalizedMessage = String(userMessage || '').toLowerCase().trim();
//
//     const availableActionTypes = Object.keys(actionRegistry);
//     console.log(" ")
//     console.log("Step 2A: Available Actions from ActionRegistry");
//     console.log("[" + availableActionTypes.join(", ") + "]");
//     console.log(" ")
//
//     for (const action of Object.values(actionRegistry)) {
//
//         if ( typeof action.match === 'function' && action.match(normalizedMessage)) {
//             return action.type;
//         }
//     }
//
//     return 'general_chat';
// }

//Function B2: Get Action Definition
function getActionDefinition(intent) {
    const action = actionRegistry[intent];

    if (action) {
        const copy = { ...action };
        delete copy.match;
        delete copy.executionFunction;
        delete copy.defaults;
        return copy; 
    }

    return {
        type: 'none',
        allowed: false,
        requiresExecution: false,
        messages: {
            started: 'I can only help with EC2 right now.',
            missingFields: {},
            ready: '',
            executing: '',
            success: '',
            failed: ''
        },
    };
}

//FUNCTIONS C: Chat Handlers
//Function C1: Handle General Chat
async function handleGeneralChat(payload) {

    console.log(" ");
    console.log("OPEN_AI FUNCTION CALLED");
    console.log(JSON.stringify(payload, null, 2));
    console.log(" ");

    return {
        success: true,
        message: "OPEN_AI_RESPONSE"
    };
}

//FUNCTIONS D: Helpers
//Function D1: Clone Action Status
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

//Function D2: Should Start New Action
function shouldStartNewAction(activeAction, actionDefinition, actionState) {
    // No active request exists yet
    const noActionActive = !activeAction;

    // User asked for a different requested action than the active one
    const actionChanged = activeAction !== actionDefinition.type;

    // Previous active request already completed
    const previousActionCompleted = actionState.status === ActionStatusFunctions.STATUS.COMPLETED;

    // Previous active request already failed
    const previousActionFailed = actionState.status === ActionStatusFunctions.STATUS.FAILED;

    return noActionActive || actionChanged || previousActionCompleted || previousActionFailed;
}

//Function D5: Resolve null actionEvent when workflow is still open
function resolveNullActionEvent(options) {
    if (options.actionEvent || !options.activeAction) {
        return options.actionEvent;
    }

    const shouldRespondForOpenWorkflow =
        options.cloudPilotShouldRespond || options.userRequest === options.activeAction;

    if (!shouldRespondForOpenWorkflow) {
        return null;
    }

    const status = options.currentActionState.status;

    if (status === ActionStatusFunctions.STATUS.RUNNING) {
        return "workflow_running";
    }

    if (status === ActionStatusFunctions.STATUS.FAILED) {
        return "workflow_failed";
    }

    if (options.actionReady) {
        if (
            options.actionSupportsExecutionModes &&
            !options.currentActionState.executionMode
        ) {
            return "awaiting_execution_mode";
        }

        return "awaiting_confirmation";
    }

    if (ActionStatusFunctions.isWaitingOnExecutionMode(status)) {
        return "awaiting_execution_mode";
    }

    if (ActionStatusFunctions.isWaitingOnConfirmation(status)) {
        return "awaiting_confirmation";
    }

    if (options.currentActionState.missing.length > 0) {
        return "workflow_in_progress";
    }

    return null;
}

//Function D3: Get Current User Message
function getCurrentUserMessage(rawUserMessage) {
    const normalizedMessageOutcome = openAIFunctions.normalizeUserMessageForModel(rawUserMessage);

    if (!normalizedMessageOutcome.ok) {
        console.log("STEP 1: Normalize message outcome failed");

        return {
            success: false,
            currentUserMessage: null,
            error: normalizedMessageOutcome.message
        };
    }

    const currentUserMessage = normalizedMessageOutcome.text;

    console.log("STEP 1: Normalize message outcome OK");
    console.log("Current user message (text): " + currentUserMessage);

    return {
        success: true,
        currentUserMessage: currentUserMessage,
        error: null
    };
}

//Function D4: Normalize processMessage context (masterSite, user)
function normalizeProcessMessageContext(context) {
    const raw = context || {};

    return {
        masterSite: raw.masterSite || 'Cloud Pilot',
        requestedByUserName: String(raw.requestedByUserName || raw.messageFrom || '').trim()
    };
}

module.exports = { processMessage, getActionDefinition };





//GOAL
/*
async function processMessage(rawUserMessage, conversationID) {

    const currentUserMessage =
        normalizeMessage(rawUserMessage);

    const userRequest =
        detectUserRequest(currentUserMessage);

    const workflowResult =
        workflowEngine({
            conversationID,
            currentUserMessage,
            userRequest
        });

    const response =
        await responseLayer(workflowResult);

    return response;
}

function workflowEngine(payload) {

    // load state

    // determine workflow changes

    // extract fields

    // determine readiness

    // determine transition

    return {
        workflowTransition,
        requestReady,
        requestState,
        workflowDefinition
    };
}
    */


//FINAL
/*
const cloudPilotFINAL = {

    cloudPilot: {

        userRequest: null, // e.g. "scan_ec2", "toggle_ec2", "general_chat"

        requestStatus: {
            requestedAction: null, // What action the user asked for ("scan_ec2", "toggle_ec2") null if it is just general_chat
            ready: false,

            missingFields: [],
            collectedFields: {},
            askedForFields: {}
        },
        
        policy: {
            allowed: false, //NOT DONE
            message: null, //NOT DONE
            reasonNotAllowed: null // e.g. "OUT_OF_SCOPE", "DESTRUCTIVE_ACTION" //NOT DONE
        },

        atlasExecution: {
            status: "idle", // "idle" | "running" | "completed" | "failed"
            actionId: null, // Atlas execution ID
            startedAt: null,
            completedAt: null,
            error: null
        }
    }
}
    */


//APPENDIX

    /*
    function logCloudPilotMessage(message) {
    console.log("CLOUD PILOT MESSAGE: " + (message || ""));
}


    //STEP 8: Chat response routing
    if (cloudPilotShouldRespond) {
        const result = await handleCloudPilotChat(chatPayload);

        processMessageOutcome.success = result.success;
        processMessageOutcome.cloudPilotMessage = result.message;
        processMessageOutcome.atlasResponse = result.atlasResponse || null;
        processMessageOutcome.error = result.error || null;
        processMessageOutcome.cloudPilot.state = cloneOperationState(actionState.getActionStatus(conversationID));

        console.log("STEP 7: CLOUD_PILOT selected");

    } else {

        const result = await handleGeneralChat(chatPayload);

        processMessageOutcome.success = result.success;
        processMessageOutcome.cloudPilotMessage = result.message;
        processMessageOutcome.atlasResponse = result.atlasResponse || null;
        processMessageOutcome.error = result.error || null;

        console.log("STEP 7: OPEN_AI selected");
    }

  */

    /*
    function cloneOperationState(state) {
    return {
        pendingAction: state.pendingAction,
        missing: [...(state.missing || [])],
        collected: { ...(state.collected || {}) },
        asked: { ...(state.asked || {}) }
    };
}
     */


    /*
    async function handleCloudPilotChatOLD(payload) {

    console.log(" ");
    console.log("CLOUD_PILOT FUNCTION CALLED");
    console.log(JSON.stringify(payload, null, 2));
    console.log(" ");

    //STEP 1: Get the full action definition
    //NOTE: We use actionRegistry directly here because getActionDefinition()
    //removes internal fields like executionFunction/defaults.
    const activeAction = payload.actionState && payload.actionState.pendingAction;
    const actionDefinition = actionRegistry[activeAction];

    //STEP 2: Make sure the requested action exists
    if (!actionDefinition) {
        const response = {
            success: false,
            message: "I could not find that CloudPilot action.",
            atlasResponse: null,
            error: "missing_action_definition"
        };

        logCloudPilotMessage(response.message);
        return response;
    }

    //STEP 3: If the request has all required fields, execute the handler
    if (payload.actionReady === true) {

        //STEP 3A: Make sure this action has an executable handler
        if (typeof actionDefinition.executionFunction !== 'function') {
            actionState.setStatus(payload.conversationID, "failed");

            const response = {
                success: false,
                message: "That CloudPilot action is not executable yet.",
                atlasResponse: null,
                error: "missing_action_handler"
            };

            logCloudPilotMessage(response.message);
            return response;
        }

        //STEP 3B: Mark workflow as running before the handler starts
        actionState.setStatus(payload.conversationID, "running");

        let result;

        try {
            //STEP 3C: Execute the action using the registry-defined handler
            result = await actionDefinition.executionFunction({
                userMessage: payload.currentUserMessage,
                action: actionDefinition,
                state: {
                    pendingAction: activeAction,
                    status: "running",
                    missing: payload.actionState.missingFields || [],
                    collected: payload.actionState.collectedFields || {}
                },
                conversationID: payload.conversationID
            });
        } catch (error) {
            //STEP 3D: Handler threw before returning a normal result
            actionState.setStatus(payload.conversationID, "failed");

            const response = {
                success: false,
                message: actionDefinition.messages.failed || "That CloudPilot action failed.",
                atlasResponse: null,
                error: error.message || String(error)
            };

            logCloudPilotMessage(response.message);
            return response;
        }

        //STEP 3E: Handler finished, so set final workflow status
        if (result.success) {
            actionState.setStatus(payload.conversationID, "completed");
        } else {
            actionState.setStatus(payload.conversationID, "failed");
        }

        //STEP 3F: Convert handler result into CloudPilot's response shape
        const response = {
            success: result.success,
            message: result.cloudPilotMessage || result.message || '',
            atlasResponse: result.atlasResponse || null,
            error: result.error || null
        };

        logCloudPilotMessage(response.message);
        return response;
    }

    //STEP 4: Request is not ready, so ask for the next missing field
    const missing = payload.actionState && payload.actionState.missingFields ? payload.actionState.missingFields : [];
    const nextMissingField = missing[0];

    //STEP 4A: Fallback if CloudPilot has no specific missing field
    if (!nextMissingField) {
        const response = {
            success: true,
            message: actionDefinition.messages.started || "I need more information to continue.",
            atlasResponse: null,
            error: null
        };

        logCloudPilotMessage(response.message);
        return response;
    }

    //STEP 4B: Get the missing-field question from the registry
    const missingFieldMessages = actionDefinition.messages && actionDefinition.messages.missingFields ? actionDefinition.messages.missingFields : {};

    const fromRegistry = missingFieldMessages[nextMissingField];

    const question = fromRegistry ? String(fromRegistry).trim() : ("I still need: " + nextMissingField);

    //STEP 4C: Only mark asked{} when we are actually sending the question
    if (question) {
        actionState.markAsked(payload.conversationID, nextMissingField);
    }

    //STEP 4D: Return the missing-field question
    const response = {
        success: true,
        message: question,
        atlasResponse: null,
        error: null
    };

    logCloudPilotMessage(response.message);
    return response;
}
    */