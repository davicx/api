const openAIFunctions = require('./openAI/openAIFunctions');
const actionState = require('../state/ActionState');
const actionRegistry = require('./actions/actionRegistry');
const Functions = require('./functions');
const AtlasExecution = require('./classes/AtlasExecution');
const { handleCloudPilotChat } = require('./chat/CloudPilotChat');

/*
FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
    1) Function A1: Process Message (pipeline)

FUNCTIONS B: Request Detection / Action Lookup
    1) Function B1: Detect User Request
    2) Function B2: Get Action Definition

FUNCTIONS C: Chat Handlers
    1) Function C1: Handle General Chat
    2) Function C2: Handle CloudPilot Chat (imported from ./chat/CloudPilotChat)

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
*/
//FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
//Function A1: Process Message (pipeline)
async function processMessage(rawUserMessage, conversationID) {
    var currentActionState = actionState.getActionStatus(conversationID);
    var activeAction = currentActionState.pendingAction;
    let actionEvent = null;
    let cloudPilotShouldRespond = false; //Other is we send to Open AI
    let actionTransitionedToReady = false;
    let actionPendingConfirmation = false;
    let executionModeSelected = false;
    let newActionStarted = false;
    let fieldsUpdated = false;

    //console.log("_______________processMessage______________________")

    //Create outcome
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

    //Sync Data
    processMessageOutcome.cloudPilot.actionStatus = cloneActionStatus(currentActionState, null, false);

    printState(conversationID, "INITIAL STATE:");
 
    //STEP 1: Normalize user message
    const currentUserMessageOutcome = getCurrentUserMessage(rawUserMessage);

    //Handle Error from normalizing user message
    if (!currentUserMessageOutcome.success) {
        processMessageOutcome.success = false;
        processMessageOutcome.error = currentUserMessageOutcome.error;

        return processMessageOutcome;         
    }

    const currentUserMessage = currentUserMessageOutcome.currentUserMessage;

    //STEP 2: Detect user request
    const userRequest = detectUserRequest(currentUserMessage); //available: general_chat, scan_ec2, toggle_ec2, create_ec2, delete_ec2, ...
    processMessageOutcome.cloudPilot.userRequest = userRequest;
    processMessageOutcome.cloudPilot.actionStatus.type = userRequest === "general_chat" ? null : userRequest;

    console.log("STEP 2: USER REQUEST:", userRequest);
    console.log(" ");
    

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

            actionState.setPendingAction(conversationID, actionDefinition.type, actionDefinition.requiredFields || []);
            newActionStarted = true;
        }

        // Refresh active request state
        currentActionState = actionState.getActionStatus(conversationID);
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


    //STEP 5: Extract structured workflow fields from the user message.
    if (activeAction && currentActionState.missing.length > 0) {
        const extractedFields = Functions.extractStructuredFields(currentUserMessage);
        const missingFields = currentActionState.missing.slice();

        for (const missingFieldName of missingFields) {

            let fieldValue = extractedFields[missingFieldName];

            if (!fieldValue && typeof Functions[missingFieldName] === "function") {
                fieldValue = Functions[missingFieldName](currentUserMessage);
            }

            if (!fieldValue) {
                continue;
            }

            console.log("STEP 5: Found field:", missingFieldName, fieldValue);

            actionState.setField(conversationID, missingFieldName, fieldValue);
            fieldsUpdated = true;

            // Refresh state after updating workflow fields
            currentActionState = actionState.getActionStatus(conversationID);
            activeAction = currentActionState.pendingAction;
        }

    } else {
        console.log("STEP 5: Nothing pending so we did not look for any updated information");
    }

    //STEP 6: Gather information for request and see if it is just became ready or was ready
    const actionReady = Functions.determineRequestReadiness(activeAction, currentActionState);

    //Step 6A: Update request status to READY now user just has to confirm
    if (actionReady && currentActionState.status !== "ready") {
        console.log("Step 6A: Updating request status to READY");

        actionState.setStatus(conversationID, "ready");

        // Refresh state after updating request status
        currentActionState = actionState.getActionStatus(conversationID);

        activeAction = currentActionState.pendingAction;
    }

    //Step 6B: Check if the ready JUST happened 
    if (hadMissingFieldsBefore && actionReady) {
        console.log("Step 6B: Requested Action transitioned to READY");

        actionTransitionedToReady = true;
    }

    const activeActionDefinition = getActionDefinition(activeAction || userRequest);

    const actionSupportsExecutionModes =
        actionRegistry.actionRequiresExecutionModeSelection(activeActionDefinition);

    //Step 6F: Capture execution mode selection (destructive tier only)
    if ( actionReady && actionSupportsExecutionModes && !currentActionState.executionMode) {
        const executionMode = Functions.extractExecutionMode(currentUserMessage);

        if (executionMode) {
            console.log("STEP 6F: Execution mode selected:", executionMode);

            actionState.setExecutionMode(conversationID, executionMode);

            currentActionState = actionState.getActionStatus(conversationID);
            activeAction = currentActionState.pendingAction;
            executionModeSelected = true;
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
        currentActionState.status === "ready" &&
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
        }
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
        const result = await handleCloudPilotChat(chatPayload);

        processMessageOutcome.success = result.success;
        processMessageOutcome.cloudPilotMessage = result.cloudPilotMessage || result.message || "";
        processMessageOutcome.atlasResponse = result.atlasResponse || null;
        processMessageOutcome.error = result.error || null;

        currentActionState = actionState.getActionStatus(conversationID);
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
    
    //STATE TEMP
    printState(conversationID, "FINAL STATE:");
    //STATE TEMP
    //console.log("_______________processMessage______________________")    
    console.log("FINAL END OF FUNCTION: processMessageOutcome ")
    console.log(processMessageOutcome)
    console.log(" processMessageOutcome ")

    console.log(" ");
  

    return processMessageOutcome;

}

//FUNCTIONS B: Process User Messages
//Function B1: Detect User Request
function detectUserRequest(userMessage) {
    const normalizedMessage = String(userMessage || '').toLowerCase().trim();

    // TEMP: remove when done debugging intent / registry
    const availableActionTypes = Object.keys(actionRegistry);
    console.log(" ")
    console.log("Step 2A: Available Actions from ActionRegistry");
    console.log("[" + availableActionTypes.join(", ") + "]");
    console.log(" ")

    
    for (const action of Object.values(actionRegistry)) {

        if ( typeof action.match === 'function' && action.match(normalizedMessage)) {
            return action.type;
        }
    }

    return 'general_chat';
}

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
    const previousActionCompleted = actionState.status === "completed";

    // Previous active request already failed
    const previousActionFailed = actionState.status === "failed";

    return noActionActive || actionChanged || previousActionCompleted || previousActionFailed;
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

//Function D4: Print State
function printState(conversationID, messageVar) {
    console.log(" ")
    console.log("_____________________________________")
    console.log(messageVar);
    actionState.print(conversationID);        
    console.log("_____________________________________")
    console.log(" ");
}


module.exports = { processMessage, detectUserRequest, getActionDefinition };

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