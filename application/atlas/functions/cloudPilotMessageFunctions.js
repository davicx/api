const openAIFunctions = require('./openAI/openAIFunctions');
const actionState = require('../state/ActionState');
const actionRegistry = require('./actions/actionRegistry');
const Functions = require('./functions');

/*
FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
    1) Function A1: Process Message (pipeline)

//FUNCTIONS B: Process User Messages
    2) Function B1: Detect Intent
    3) Function B2: Decide Action
    4) Function B5: Workflow prompt for missing field
    5) Function B6: General chat during active workflow (ChatGPT + continuation)
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
    let newActionStarted = false;
    let fieldsUpdated = false;
    let cloudPilotShouldRespond = false; //Other is we send to Open AI
    let actionJustBecameReady = false;

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
                askedForFields: {}
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

    //Handle Error
    if (!currentUserMessageOutcome.success) {
        processMessageOutcome.success = false;
        processMessageOutcome.error = currentUserMessageOutcome.error;

        return processMessageOutcome;         
    }

    const currentUserMessage = currentUserMessageOutcome.currentUserMessage;

    // STEP 2: Detect user request
    const userRequest = detectUserRequest(currentUserMessage); //available: general_chat, scan_ec2, toggle_ec2, create_ec2
    processMessageOutcome.cloudPilot.userRequest = userRequest;
    processMessageOutcome.cloudPilot.actionStatus.type = userRequest === "general_chat" ? null : userRequest;

    console.log("STEP 2: USER REQUEST:", userRequest);
    console.log(" ");
    
    

    // STEP 3: Check if user is requesting an action not just general chat
    const actionDefinition = getActionDefinition(userRequest);
    console.log("STEP 3: ACTION- Full from Action Registry ");
    console.log(actionDefinition)
    console.log(" ");
    
    
    // STEP 4: Start or replace active request
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
    } else {
        console.log("STEP 4: NOT Starting active request just chattin dude");
    }

    const hadMissingFieldsBefore = activeAction && currentActionState.missing.length > 0;


    // STEP 5: Extract structured workflow fields from the user message.
    // Deterministic MVP format: region: "us-west-2"
    if (activeAction && currentActionState.missing.length > 0) {
        const extractedFields = Functions.extractStructuredFields(currentUserMessage);
        const missingFields = currentActionState.missing.slice();

        for (const missingFieldName of missingFields) {

            const structuredFieldValue = extractedFields[missingFieldName];

            if (!structuredFieldValue) {
                continue;
            }

            console.log("STEP 5: Found field:", missingFieldName, structuredFieldValue);

            actionState.setField(conversationID, missingFieldName, structuredFieldValue);
            fieldsUpdated = true;

            // Refresh state after updating workflow fields
            currentActionState = actionState.getActionStatus(conversationID);
            activeAction = currentActionState.pendingAction;
        }

    } else {
        console.log("STEP 5: Nothing pending so we did not look for any updated information");
    }

    //STEP 6: After updated missing fields check if request just became ready or is ready and waiting
    const actionReady = Functions.determineRequestReadiness(activeAction, currentActionState);

    // STEP 6A: Update request status to READY
    if (actionReady && currentActionState.status !== "ready") {
        console.log("STEP 6A: Updating request status to READY");

        actionState.setStatus(conversationID, "ready");

        // Refresh state after updating request status
        currentActionState = actionState.getActionStatus(conversationID);

        activeAction = currentActionState.pendingAction;
    }

    // STEP 6B: Check if all fields were just gathered and the request is ready
    if (hadMissingFieldsBefore && actionReady) {
        console.log("STEP 6B: Requested Action JUST became READY");

        actionJustBecameReady = true;
    }
    
    // STEP 6C: CloudPilot should respond when request just became ready
    if (actionJustBecameReady) {
        cloudPilotShouldRespond = true;
    }

    actionEvent = Functions.determineActionEvent({
        actionDefinition: actionDefinition,
        activeAction: activeAction,
        actionState: currentActionState,
        hadMissingFieldsBefore: hadMissingFieldsBefore,
        actionJustBecameReady: actionJustBecameReady,
        newActionStarted: newActionStarted,
        fieldsUpdated: fieldsUpdated
    });

    if (actionEvent) {
        cloudPilotShouldRespond = true;
    }

    const activeActionDefinition = getActionDefinition(activeAction || userRequest);

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
            missingFields: [...(currentActionState.missing || [])],
            collectedFields: { ...(currentActionState.collected || {}) },
            askedForFields: { ...(currentActionState.asked || {}) }
        }
    };

    /*

    const chatPayload = {
        conversationID,
        currentUserMessage,
        intent,
        action,

        requestReady: requestReadyNow,

        requestedAction: {
            pendingAction: activeRequestedAction,
            status: currentStateData.status,
            missing: [...(currentStateData.missing || [])],
            collected: { ...(currentStateData.collected || {}) }
        }
    };

    //STEP 7: Chat Response
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

    //STEP 7: Chat Response
    if (cloudPilotShouldRespond) {
        const result = await handleCloudPilotChat(chatPayload);

        processMessageOutcome.success = result.success;
        processMessageOutcome.cloudPilotMessage = result.message;
        processMessageOutcome.atlasResponse = result.atlasResponse || null;
        processMessageOutcome.error = result.error || null;

        console.log("STEP 7: CLOUD_PILOT selected");
    } else {

        console.log("STEP 7: OPEN_AI selected");
        console.log("OPEN_AI PAYLOAD:");
        console.log(JSON.stringify(chatPayload, null, 2));

        processMessageOutcome.success = true;
        processMessageOutcome.cloudPilotMessage = "OPEN_AI is responding";
    }

    //TO DO: Move requestStatus syncing to the end of processMessage after all state changes run.
    //Also maybe set all manually one by one this is confusing
    processMessageOutcome.cloudPilot.actionStatus = cloneActionStatus(currentActionState, activeAction, actionReady);
    

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

//Function B3: Handle General Chat
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

//NEW 
//Function B3: Handle Cloud Pilot Chat
async function handleCloudPilotChat(payload) {

    console.log(" ");
    console.log("CLOUD_PILOT FUNCTION CALLED");
    console.log(JSON.stringify(payload, null, 2));
    console.log(" ");

    // STEP 1: New workflow started
    if (payload.actionEvent === "new_action") {

        return await cloudPilotRespondNewRequest(payload);
    }

    // STEP 2: User supplied new workflow fields
    if (payload.actionEvent === "missing_fields_given") {

        return await cloudPilotRespondMissingFieldsGiven(payload);
    }

    // STEP 3: Workflow is now ready and waiting for confirmation
    if (payload.actionEvent === "awaiting_confirmation") {

        return await cloudPilotRespondAwaitingConfirmation(payload);
    }

    // STEP 4: Fallback
    return {
        success: false,
        message: "Unknown CloudPilot workflow event.",
        atlasResponse: null,
        error: "unknown_workflow_event"
    };
}

async function cloudPilotRespondNewRequest(payload) {
    const actionDefinition = payload.actionDefinition;

    const missingFields = payload.actionState.missingFields || [];

    const missingFieldsMessage = buildMissingFieldsMessage(actionDefinition, missingFields );

    return {
        success: true,
        message: actionDefinition.messages.started + " " + missingFieldsMessage,
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondMissingFieldsGiven(payload) {
    const actionDefinition = payload.actionDefinition;
    const missingFields = payload.actionState.missingFields || [];
    const collectedFields = payload.actionState.collectedFields || {};
    const collectedFieldNames = Object.keys(collectedFields);
    const latestField = collectedFieldNames[collectedFieldNames.length - 1];

    let acknowledgement = "Great, I updated the workflow.";

    if (latestField) {
        acknowledgement = "Great, I now have the " + latestField.replaceAll("_", " ") + ".";
    }

    // Still missing fields
    if (missingFields.length > 0) {

        const missingFieldsMessage = buildMissingFieldsMessage(actionDefinition, missingFields);

        acknowledgement += " " + missingFieldsMessage;
    }

    return {
        success: true,
        message: acknowledgement,
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondAwaitingConfirmation(payload) {

    const actionDefinition = payload.actionDefinition;
    const readyMessage =
        actionDefinition.messages.ready ||
        "Everything is ready.";

    return {
        success: true,
        message: readyMessage + "\n\nWould you like me to execute this action?",
        atlasResponse: null,
        error: null
    };
}

function buildMissingFieldsMessage(actionDefinition, missingFields) {
    const questions = [];

    const registryMessages = actionDefinition.messages && actionDefinition.messages.missingFields ? actionDefinition.messages.missingFields : {};

    for (const fieldName of missingFields) {
        const question = registryMessages[fieldName];

        if (question) {
            questions.push(question);
        }
    }

    if (questions.length === 0) {
        return "";
    }

    return (
        questions.join(" ") +
        '\n\nPlease use this format:\nfield: "value"'
    );
}
//NEW 

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

//TEMP: Debug current action state
function printState(conversationID, messageVar) {
    console.log(" ")
    console.log("_____________________________________")
    console.log(messageVar);
    actionState.print(conversationID);        
    console.log("_____________________________________")
    console.log(" ");
}

function cloneOperationState(state) {
    return {
        pendingAction: state.pendingAction,
        missing: [...(state.missing || [])],
        collected: { ...(state.collected || {}) },
        asked: { ...(state.asked || {}) }
    };
}

function cloneActionStatus(state, activeAction, ready) {
    return {
        type: activeAction,
        ready: Boolean(ready),
        missingFields: [...(state.missing || [])],
        collectedFields: { ...(state.collected || {}) },
        askedForFields: { ...(state.asked || {}) }
    };
}

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

function logCloudPilotMessage(message) {
    console.log("CLOUD PILOT MESSAGE: " + (message || ""));
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

//WILL ADD THESE SOON
/*
    var processMessageOutcome = {
        success: false, //NOT DONE
        cloudPilotMessage: "", //NOT DONE
        cloudPilot: {
            intent: null, // e.g. "scan_ec2", "toggle_ec2" //NOT DONE
            
            policy: {
                allowed: false, //NOT DONE
                message: null, //NOT DONE
                reasonNotAllowed: null // e.g. "OUT_OF_SCOPE", "DESTRUCTIVE_ACTION" //NOT DONE
            },
            
            action: {
                type: null, // e.g. "scan_ec2", "toggle_ec2" //NOT DONE
                ready: false, //NOT DONE
                parameters: {} //NOT DONE
            },
            state: {
                pendingAction: null, //DONE
                missing: [], //DONE
                collected: {}, //DONE
                
                execution: {
                    inProgress: false, //NOT DONE
                    actionId: null,    //NOT DONE
                    startedAt: null,    //NOT DONE
                    status: "idle"    //NOT DONE ("idle" | "running" | "completed" | "failed")
                }
                
            }
        },
        error: null, //NOT DONE
        atlasResponse: null //NOT DONE
    };
*/

/*
cloudPilot: {

    intent: null, // e.g. "scan_ec2", "toggle_ec2", "general_chat"

    action: {
        type: null, // current workflow/action type
        ready: false, // true when all required fields are collected
        parameters: {} // normalized execution-ready values
    },

    state: {
        pendingAction: null, // active workflow being collected
        missing: [], // fields still needed
        collected: {}, // collected workflow values
        asked: {} // tracks which questions were already asked
    },

    atlasExecution: {
        status: "idle", // "idle" | "running" | "completed" | "failed"
        actionId: null, // Atlas execution ID
        startedAt: null,
        completedAt: null,
        error: null
    }
}
*/

/*
cloudPilot: {

    userRequest: null, // e.g. "scan_ec2", "toggle_ec2", "general_chat"

    requestStatus: {
        requestedAction: null, // What action the user asked for ("scan_ec2", "toggle_ec2", ) null if it is just general_chat
        ready: false, 

        missingFields: [],
        collectedFields: {},
        askedForFields: {}
    }
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
*/

//OLD
/*
    var processMessageOutcome = {
        success: false, 
        cloudPilotMessage: "",
        cloudPilot: {
            intent: null, // e.g. "scan_ec2", "toggle_ec2", "general_chat"
            action: {
                type: null, // current workflow/action type
                ready: false, // true when all required fields are collected
                parameters: {} // normalized execution-ready values
            },
            state: {
                pendingAction: null, // active workflow being collected
                missing: [], // fields still needed
                collected: {}, // collected workflow values
                asked: {} // tracks which questions were already asked
            },
            atlasExecution: { //This is when we ask Atlas to interact with AWS it may take some time to finish
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
    */




/*
async function handleGeneralChat(text, action) {
    const chatResult = await openAIFunctions.sendGeneralChat(text);

    if (!chatResult.success) {
        //console.log('handleGeneralChat: ChatGPT request failed');
        return {
            success: false,
            message: chatResult.message || 'ChatGPT request failed',
            data: null,
            action,
            intent: 'unknown',
            policy: { allowed: true },
            error: chatResult.error,
        };
    }

    //console.log('handleGeneralChat: outcome ok');
    return {
        success: true,
        data: chatResult.data,
        action,
        intent: 'unknown',
        policy: { allowed: true },
    };
}
*/




/*
//Function B4: Handle Request for Missing Info
function userAskedForMissingInfo(userMessage) {
    const normalizedMessage = String(userMessage || '').toLowerCase().trim();

    return (
        normalizedMessage.includes("what am i missing") ||
        normalizedMessage.includes("what is missing") ||
        normalizedMessage.includes("what's missing") ||
        normalizedMessage.includes("what else am i missing") ||
        normalizedMessage.includes("what else do you need") ||
        normalizedMessage.includes("forgot what was missing") ||
        normalizedMessage.includes("what do you still need")
    );
}

//Function B5: Workflow prompt for missing field
function messageForMissingField(actionDefinition, nextMissingField) {
    const fromRegistry = actionDefinition && actionDefinition.messages && actionDefinition.messages.missingFields && actionDefinition.messages.missingFields[nextMissingField];
    const trimmed = fromRegistry != null ? String(fromRegistry).trim() : '';
    if (trimmed) {
        return trimmed;
    }
    return "I still need: " + nextMissingField;
}

function buildWorkflowContinuationAppendix(actionPending, currentStateData) {
    const missing = currentStateData.missing || [];
    const lines = missing.map((field) => '- ' + field).join('\n');
    return '\n\nI still need:\n' + lines;
}

async function handleWorkflowAwareGeneralChat(text, action, currentStateData, actionPending) {
    const workflowContext = {
        pendingAction: actionPending,
        missing: currentStateData.missing || [],
        collected: currentStateData.collected || {}
    };
    const chatResult = await openAIFunctions.sendGeneralChatDuringWorkflow(text, workflowContext);
    const appendix = buildWorkflowContinuationAppendix(actionPending, currentStateData);

    if (!chatResult.success) {
        const fallback = 'I could not reach ChatGPT right now.' + appendix;
        return {
            success: true,
            data: fallback,
            action,
            intent: 'unknown',
            policy: { allowed: true },
            error: chatResult.error,
        };
    }

    const body = (chatResult.data != null && chatResult.data !== '') ? String(chatResult.data).trim() : '';
    const combined = body ? (body + appendix) : appendix.trim();
    return {
        success: true,
        data: combined,
        action,
        intent: 'unknown',
        policy: { allowed: true },
    };
}
*/