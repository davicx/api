const openAIFunctions = require('./openAI/openAIFunctions');
const actionState = require('../state/ActionState');
const actionRegistry = require('./actions/actionRegistry');
const fieldExtractors = require('./functions');

/*
FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
    1) Function A1: Process Message (pipeline)

//FUNCTIONS B: Process User Messages
    2) Function B1: Detect Intent
    3) Function B2: Decide Action
    4) Function B5: Workflow prompt for missing field
    5) Function B6: General chat during active workflow (ChatGPT + continuation)
*/

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
        atlas: null //NOT DONE
    };
*/

//FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
//Function A1: Process Message (pipeline)
async function processMessage(rawUserMessage, conversationID) {
    var currentStateData = actionState.getActionStatus(conversationID);
    var actionPending = currentStateData.pendingAction;
    let cloudPilotShouldRespond = false;
    let requestJustBecameReady = false;

    console.log("_______________processMessage______________________")

    //Create outcome
    var processMessageOutcome = {
        success: false, 
        cloudPilotMessage: "",
        cloudPilot: {
            intent: null, // e.g. "scan_ec2", "toggle_ec2"
            action: {
                type: null, // e.g. "scan_ec2", "toggle_ec2"
                ready: false, 
                parameters: {}
            },
            state: {
                pendingAction: null, 
                status: null,
                missing: [], 
                collected: {}, 
                asked: {}, 

            }
        },
        atlas: null, 
        error: null 
    };

    //Sync Data
    processMessageOutcome.cloudPilot.state = cloneOperationState(currentStateData);

    //STATE TEMP
    printState(conversationID);
    //STATE TEMP

    //STEP 1: Normalize user message → normalizedMessageOutcome (ok, text, message)
    const normalizedMessageOutcome = openAIFunctions.normalizeUserMessageForModel(rawUserMessage);

    //Handle Error
    if (!normalizedMessageOutcome.ok) {
        console.log("STEP 1: Normalize message outcome failed");

        processMessageOutcome.success = false;
        processMessageOutcome.error = normalizedMessageOutcome.message;

        return processMessageOutcome;         
    }

    const currentUserMessage = normalizedMessageOutcome.text;

    console.log("STEP 1: Normalize message outcome OK");
    console.log("Current user message (text): " + currentUserMessage);
    console.log(" ");

    // STEP 2: Detect intent
    const intent = detectIntent(currentUserMessage);
    processMessageOutcome.cloudPilot.intent = intent;

    console.log("STEP 2: INTENT:", intent);
    console.log(" ");

    // STEP 3: Check if user is requesting an action
    const action = getActionDefinition(intent);
    console.log("STEP 3: ACTION ");
    console.log(action)
    console.log(" ");
    

    // STEP 4: Start or replace workflow action
    if (action.requiresWorkflow) {
        cloudPilotShouldRespond = true;

        // User requested a new workflow if(no action pending OR its a different action)
        if (!actionPending || actionPending !== action.type || currentStateData.status === "completed" || currentStateData.status === "failed") {

            console.log("STEP 4: Starting workflow");
            console.log(" ");

            actionState.setPendingAction(
                conversationID,
                action.type,
                action.requiredFields || []
            );
        }

        // Refresh workflow state
        currentStateData = actionState.getActionStatus(conversationID);
        actionPending = currentStateData.pendingAction;
        processMessageOutcome.cloudPilot.state = cloneOperationState(currentStateData);
    }

    const hadMissingFieldsBefore = actionPending && currentStateData.missing.length > 0;

    // STEP 5: Extract missing fields like region, tags, instance types, etc (registry-driven missing[] + fieldExtractors)
    if (actionPending) {
        for (const field of currentStateData.missing) {

            const extractor = fieldExtractors[field];

            if (!extractor) {
                continue;
            }
            const value = extractor(currentUserMessage);

            if (!value) {
                continue;
            }
            console.log("STEP 5: Found field:", field, value);
            actionState.setField(conversationID, field, value);
            
            // refresh state
            currentStateData = actionState.getActionStatus(conversationID);
            actionPending = currentStateData.pendingAction;
            
            // sync
            processMessageOutcome.cloudPilot.state = cloneOperationState(currentStateData);
        }
    } else {
        console.log("STEP 5: Nothing pending so we did not look for any updated information");
    }

    const requestReadyNow = Boolean(
        actionPending &&
        currentStateData.missing.length === 0 &&
        currentStateData.status !== "completed" &&
        currentStateData.status !== "failed"
    );

    if (requestReadyNow && currentStateData.status !== "ready") {
        actionState.setStatus(conversationID, "ready");

        currentStateData = actionState.getActionStatus(conversationID);
        actionPending = currentStateData.pendingAction;
        processMessageOutcome.cloudPilot.state = cloneOperationState(currentStateData);
    }

    if (hadMissingFieldsBefore && requestReadyNow) {
        console.log("STEP 6: Request JUST became READY");

        requestJustBecameReady = true;
    }

    // STEP 6: Check if Request just became ready
    if (requestJustBecameReady) {
        console.log("STEP 6: Request JUST became READY");
        cloudPilotShouldRespond = true;
    } else if (requestReadyNow) {
        console.log("STEP 6B: There is a Request and it was READY before and is still READY");
    } else {
        console.log("STEP 6C: Request NOT ready");
    }

    processMessageOutcome.cloudPilot.action.type = actionPending;
    processMessageOutcome.cloudPilot.action.ready = Boolean(requestReadyNow);
    processMessageOutcome.cloudPilot.action.parameters = { ...(currentStateData.collected || {}) };

    const chatPayload = {
        conversationID,
        currentUserMessage,
        intent,
        action,

        requestReady: requestReadyNow,

        requestedAction: {
            pendingAction: actionPending,
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
        processMessageOutcome.atlas = result.atlas || null;
        processMessageOutcome.error = result.error || null;
        processMessageOutcome.cloudPilot.state = cloneOperationState(actionState.getActionStatus(conversationID));

        console.log("STEP 7: CLOUD_PILOT selected");

    } else {

        const result = await handleGeneralChat(chatPayload);

        processMessageOutcome.success = result.success;
        processMessageOutcome.cloudPilotMessage = result.message;
        processMessageOutcome.atlas = result.atlas || null;
        processMessageOutcome.error = result.error || null;

        console.log("STEP 7: OPEN_AI selected");
    }

    //STATE TEMP
    printState(conversationID);
    //STATE TEMP

    console.log("_______________processMessage______________________")    
    console.log(" ")
    console.log(" ");

    return processMessageOutcome;

}

//FUNCTIONS B: Process User Messages
//Function B1: Detect Intent
function detectIntent(userMessage) {
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
        delete copy.handler;
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


//Function B3: Handle Cloud Pilot Chat
async function handleCloudPilotChat(payload) {

    console.log(" ");
    console.log("CLOUD_PILOT FUNCTION CALLED");
    console.log(JSON.stringify(payload, null, 2));
    console.log(" ");

    //STEP 1: Get the full action definition
    //NOTE: We use actionRegistry directly here because getActionDefinition()
    //removes internal fields like handler/defaults.
    const pendingAction = payload.requestedAction && payload.requestedAction.pendingAction;
    const actionDefinition = actionRegistry[pendingAction];

    //STEP 2: Make sure the requested action exists
    if (!actionDefinition) {
        const response = {
            success: false,
            message: "I could not find that CloudPilot action.",
            atlas: null,
            error: "missing_action_definition"
        };

        logCloudPilotMessage(response.message);
        return response;
    }

    //STEP 3: If the request has all required fields, execute the handler
    if (payload.requestReady === true) {

        //STEP 3A: Make sure this action has an executable handler
        if (typeof actionDefinition.handler !== 'function') {
            actionState.setStatus(payload.conversationID, "failed");

            const response = {
                success: false,
                message: "That CloudPilot action is not executable yet.",
                atlas: null,
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
            result = await actionDefinition.handler({
                userMessage: payload.currentUserMessage,
                action: actionDefinition,
                state: {
                    pendingAction,
                    status: "running",
                    missing: payload.requestedAction.missing || [],
                    collected: payload.requestedAction.collected || {}
                },
                conversationID: payload.conversationID
            });
        } catch (error) {
            //STEP 3D: Handler threw before returning a normal result
            actionState.setStatus(payload.conversationID, "failed");

            const response = {
                success: false,
                message: actionDefinition.messages.failed || "That CloudPilot action failed.",
                atlas: null,
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
            atlas: result.atlas || null,
            error: result.error || null
        };

        logCloudPilotMessage(response.message);
        return response;
    }

    //STEP 4: Request is not ready, so ask for the next missing field
    const missing = payload.requestedAction && payload.requestedAction.missing ? payload.requestedAction.missing : [];
    const nextMissingField = missing[0];

    //STEP 4A: Fallback if CloudPilot has no specific missing field
    if (!nextMissingField) {
        const response = {
            success: true,
            message: actionDefinition.messages.started || "I need more information to continue.",
            atlas: null,
            error: null
        };

        logCloudPilotMessage(response.message);
        return response;
    }

    //STEP 4B: Get the missing-field question from the registry
    const missingFieldMessages =
        actionDefinition.messages &&
        actionDefinition.messages.missingFields
            ? actionDefinition.messages.missingFields
            : {};

    const fromRegistry = missingFieldMessages[nextMissingField];

    const question =
        fromRegistry
            ? String(fromRegistry).trim()
            : ("I still need: " + nextMissingField);

    //STEP 4C: Only mark asked{} when we are actually sending the question
    if (question) {
        actionState.markAsked(payload.conversationID, nextMissingField);
    }

    //STEP 4D: Return the missing-field question
    const response = {
        success: true,
        message: question,
        atlas: null,
        error: null
    };

    logCloudPilotMessage(response.message);
    return response;
}


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
//TEMP: Debug current action state
function printState(conversationID) {
    console.log(" ");
    console.log("currentStateData");
    actionState.print(conversationID);
    console.log("currentStateData");
    console.log(" ");
}

function cloneOperationState(state) {
    return {
        pendingAction: state.pendingAction,
        status: state.status,
        missing: [...(state.missing || [])],
        collected: { ...(state.collected || {}) },
        asked: { ...(state.asked || {}) }
    };
}

function logCloudPilotMessage(message) {
    console.log("CLOUD PILOT MESSAGE: " + (message || ""));
}


module.exports = { processMessage, detectIntent, getActionDefinition };




