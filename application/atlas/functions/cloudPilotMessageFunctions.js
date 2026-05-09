const openAIFunctions = require('./openAIFunctions');
const conversationStateFunctions = require('../state/conversationStateFunctions');
const actionState = require('../state/ActionState');
const actionRegistry = require('./actions/actionRegistry');

/*
FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
    1) Function A1: Process Message (pipeline)

//FUNCTIONS B: Process User Messages
    2) Function B1: Detect Intent
    3) Function B2: Decide Action
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
async function processMessage(userMessage, conversationID) {
    var currentStateData = actionState.getActionStatus(conversationID);
    var actionPending = currentStateData.pendingAction;

    console.log(" ")
    console.log("_______________processMessage______________________")

    //Create outcome
    var processMessageOutcome = {
        success: false, //NOT DONE
        cloudPilotMessage: "",
        cloudPilot: {
            intent: null, // e.g. "scan_ec2", "toggle_ec2" //NOT DONE
            action: {
                type: null, // e.g. "scan_ec2", "toggle_ec2" //NOT DONE
                ready: false, //NOT DONE
                parameters: {} //NOT DONE
            },
            state: {
                pendingAction: null, //NOT DONE
                missing: [], //NOT DONE
                collected: {}, //NOT DONE
                asked: {}, //NOT DONE

            }
        },
        atlas: null, //NOT DONE
        error: null //NOT DONE
    };

    //Sync Data
    processMessageOutcome.cloudPilot.state = currentStateData;

    //STEP 1: Normalize User Intent from message
    const normalizedText = openAIFunctions.normalizeUserMessageForModel(userMessage);

    //Handle Error
    if (!normalizedText.ok) {
        console.log("STEP 1: Normalize text failed");

        processMessageOutcome.success = false;
        processMessageOutcome.error = normalizedText.message;

        return processMessageOutcome;         
    }

    const userMessageNormalized = normalizedText.text;

    console.log("STEP 1: Normalize text Worked");
    console.log("Current User Message: " + userMessageNormalized)


    // STEP 2: Detect intent
    const intent = detectIntent(userMessageNormalized);
    processMessageOutcome.cloudPilot.intent = intent;

    console.log("STEP 2: INTENT:", intent);

    // STEP 3: Decide action
    const action = decideAction(intent);
    processMessageOutcome.cloudPilot.action.type = action.type;
 
    console.log("STEP 3: ACTION:", action.type);

    // STEP 4: Start / replace action (simple version)
    if (action.workflowEnabled) {

        if (!actionPending) {
            console.log("STEP 4: Starting new action:", action.type);

            actionState.setPendingAction(conversationID, action.type, action.requiredFields || []);

        } else if (actionPending !== action.type) {
            console.log("STEP 4: Replacing action:", actionPending, "→", action.type);

            actionState.setPendingAction(conversationID, action.type, action.requiredFields || []);
        }

        // refresh state
        currentStateData = actionState.getActionStatus(conversationID);
        actionPending = currentStateData.pendingAction;

        // sync
        processMessageOutcome.cloudPilot.state = currentStateData;
    } else {
        console.log("STEP 4: Not starting or replacing an action");
    }

    // STEP 5: Extract region if action is pending
    if (actionPending) {
        const region = conversationStateFunctions.extractAwsRegion(userMessageNormalized);

        if (region) {
            console.log("STEP 5: Region found:", region);

            actionState.setRegion(conversationID, region);

            // refresh state
            currentStateData = actionState.getActionStatus(conversationID);
            actionPending = currentStateData.pendingAction;

            // sync
            processMessageOutcome.cloudPilot.state = currentStateData;
        } else {
            console.log("STEP 5: No region found");
        }
    } else {
        console.log("STEP 5: Nothing pending so we did not look for any updated information");
    }

    // STEP 6: Check if Request is ready
    if (actionPending && currentStateData.missing.length === 0) {
        console.log("STEP 6: Request is READY");

        //processMessageOutcome.cloudPilot.action.ready = true;
        processMessageOutcome.cloudPilot.action.ready = actionPending && currentStateData.missing.length === 0;
    } else {
        console.log("STEP 6: Request is NOT ready");
    }

    // STEP 7: Route response (THIS IS THE KEY LAYER)
    // Step 6 turned this on when nothing was missing anymore — we are allowed to run the real action now
    if (processMessageOutcome.cloudPilot.action.ready) {

        // Load this action's settings from the registry (same string as pendingAction, e.g. scan_ec2)
        const actionDefinition = actionRegistry[actionPending];

        // Make sure the registry actually gave us a runnable handler before we call it
        if (actionDefinition && typeof actionDefinition.handler === 'function') {

            // Tell the logs we are about to run that handler
            console.log("STEP 7: READY → action handler");

            // Run the action's code (Atlas scan, OpenAI toggle, etc.) and wait for its result object
            const result = await actionDefinition.handler({ userMessage: userMessageNormalized, state: currentStateData, conversationID, action: actionDefinition });

            // Handler finished without throwing — if it says success, this turn is done so we wipe the in-memory workflow
            if (result.success) {
                actionState.clear(conversationID);

                // refresh state
                // Read the now-empty (or reset) workflow state back into this function's variables
                currentStateData = actionState.getActionStatus(conversationID);

                // Keep the local "what are we waiting on" variable in sync with storage
                actionPending = currentStateData.pendingAction;

                // sync
                // Put that same fresh state into the JSON we will send back to the client
                processMessageOutcome.cloudPilot.state = currentStateData;
            }

            // Copy the handler's answer into the API response (works for both success and failure)
            processMessageOutcome.success = result.success;
            processMessageOutcome.cloudPilotMessage = result.cloudPilotMessage;
            // Atlas data only exists for scans — use null when the handler did not return any
            processMessageOutcome.atlas = result.atlas || null;
            // Short error string from the handler, or null when there was no error
            processMessageOutcome.error = result.error || null;
        }

    //No API Call    
    // User still owes us a region but they asked what is missing — give a short reminder instead of repeating the big question
    } else if (actionPending && currentStateData.missing.includes("region") && userAskedForMissingInfo(userMessageNormalized)) {

        console.log("STEP 7: Missing region → reminder message");

        // Plain text reply for the chat UI
        processMessageOutcome.cloudPilotMessage = "I still need the AWS region.";
        processMessageOutcome.success = true;

    //No API Call    
    // First time we realize region is missing — ask the question once and mark region as "already asked"
    } else if (actionPending && currentStateData.missing.includes("region") && (!currentStateData.asked || !currentStateData.asked.region)) {

        console.log("STEP 7: Missing region → system message");

        // Remember we already prompted for region so we do not spam the same question every message
        actionState.markAsked(conversationID, "region");

        // refresh state
        // Pull state back after markAsked changed the asked flags
        currentStateData = actionState.getActionStatus(conversationID);

        // sync
        // Expose that updated asked/missing state to the client payload
        processMessageOutcome.cloudPilot.state = currentStateData;

        // The actual question text shown to the user
        processMessageOutcome.cloudPilotMessage = "Which AWS region should I use?";
        processMessageOutcome.success = true;

    //OPEN AI: Calls Open AI 
    // Normal chit-chat — not EC2 workflow — send straight to the small OpenAI helper
    } else if (intent === "general_chat") {

        console.log("STEP 7: General chat → ChatGPT");

        // Ask OpenAI for a short reply using the general system prompt
        const result = await handleGeneralChat(userMessageNormalized, action);

        // Map the helper's old shape (data/message) into the same outcome fields the API already used
        processMessageOutcome.success = result.success;
        processMessageOutcome.cloudPilotMessage = result.data || result.message;

    //No API Call
    // Nothing matched above — safe default line so the user still gets a friendly sentence
    } else {

        console.log("STEP 7: Fallback message");

        processMessageOutcome.cloudPilotMessage = "How can I help with your AWS setup?";
        processMessageOutcome.success = true;
    }

    // Sync action.type with actual state
    if (actionPending) {
        processMessageOutcome.cloudPilot.action.type = actionPending;
    }

    console.log("_______________processMessage______________________")    
    console.log(" ")
    console.log(" ");

    return processMessageOutcome;

}

//FUNCTIONS B: Process User Messages
//Function B1: Detect Intent
function detectIntent(userMessage) {
    const normalizedMessage =
        String(userMessage || '')
            .toLowerCase()
            .trim();

    for (const action of Object.values(actionRegistry)) {

        if (
            typeof action.match === 'function' &&
            action.match(normalizedMessage)
        ) {
            return action.type;
        }
    }

    return 'general_chat';
}

//Function B2: Decide Action
function decideAction(intent) {
    const action = actionRegistry[intent];

    if (action) {
        const copy = { ...action };
        delete copy.match;
        delete copy.handler;
        return copy; // ← copy here
    }

    return {
        type: 'none',
        allowed: false,
        requiresExecution: false,
        message: 'I can only help with EC2 right now.',
    };
}

//Function B3: Handle General Chat
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

//Function B4: Handle Request for Missing Info
function userAskedForMissingInfo(userMessage) {
    const normalizedMessage = String(userMessage || '').toLowerCase().trim();

    return (
        normalizedMessage.includes("what am i missing") ||
        normalizedMessage.includes("what is missing") ||
        normalizedMessage.includes("what's missing") ||
        normalizedMessage.includes("what else do you need") ||
        normalizedMessage.includes("forgot what was missing") ||
        normalizedMessage.includes("what do you still need")
    );
}


module.exports = {
    processMessage,
    detectIntent,
    decideAction,
};
