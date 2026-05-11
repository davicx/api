const openAIFunctions = require('./openAIFunctions');
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
async function processMessage(userMessage, conversationID) {
    var currentStateData = actionState.getActionStatus(conversationID);
    var actionPending = currentStateData.pendingAction;

    console.log(" ")
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
                missing: [], 
                collected: {}, 
                asked: {}, 

            }
        },
        atlas: null, 
        error: null 
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

    // STEP 4: Start or replace a user requested action like Scan my EC2
    if (action.workflowEnabled) {

        if (!actionPending) {
            console.log("STEP 4: Starting new action:", action.type);

            actionState.setPendingAction(conversationID, action.type, action.requiredFields || []);

        } else if (actionPending !== action.type) {
            console.log("STEP 4: Replacing action:", actionPending, "→", action.type);

            actionState.setPendingAction(conversationID, action.type, action.requiredFields || []);
        }

        //Refresh and sync state
        currentStateData = actionState.getActionStatus(conversationID);
        actionPending = currentStateData.pendingAction;
        processMessageOutcome.cloudPilot.state = currentStateData;

    } else {
        console.log("STEP 4: Not starting or replacing an action");
    }

    // STEP 5: Extract missing fields like region, tags, instance types, etc (registry-driven missing[] + fieldExtractors)
    if (actionPending) {
        for (const field of currentStateData.missing) {

            const extractor = fieldExtractors[field];

            if (!extractor) {
                continue;
            }
            const value = extractor(userMessageNormalized);

            if (!value) {
                continue;
            }
            console.log("STEP 5: Found field:", field, value);
            actionState.setField(conversationID, field, value);
            
            // refresh state
            currentStateData = actionState.getActionStatus(conversationID);
            actionPending = currentStateData.pendingAction;
            
            // sync
            processMessageOutcome.cloudPilot.state = currentStateData;
        }
    } else {
        console.log("STEP 5: Nothing pending so we did not look for any updated information");
    }

    // STEP 6: Check if Request is ready
    if (actionPending && currentStateData.missing.length === 0) {
        console.log("STEP 6: Request is READY");
        processMessageOutcome.cloudPilot.action.ready = actionPending && currentStateData.missing.length === 0;
    } else {
        console.log("STEP 6: Request is NOT ready");
    }

    const nextMissingField = (actionPending && currentStateData.missing.length > 0) ? currentStateData.missing[0] : null;

    // STEP 7: Route response (THIS IS THE KEY LAYER)
    if (processMessageOutcome.cloudPilot.action.ready) {
        const actionDefinition = actionRegistry[actionPending];

        //FINISHED: Now we can do actually do something. We will call a function like Scan or Toggle EC2 
        if (actionDefinition && typeof actionDefinition.handler === 'function') {

            
            const actionLabel = (actionDefinition && actionDefinition.actionLabel) ? actionDefinition.actionLabel : (actionPending || 'unknown');
            console.log("STEP 7: READY → action handler (" + actionLabel + ")");
            
            const result = await actionDefinition.handler({ userMessage: userMessageNormalized, state: currentStateData, conversationID, action: actionDefinition });

            // Handler finished without throwing — if it says success, this turn is done so we wipe the in-memory workflow
            if (result.success) {
                actionState.clear(conversationID);

                // refresh state
                currentStateData = actionState.getActionStatus(conversationID);

                // Keep the local "what are we waiting on" variable in sync with storage
                actionPending = currentStateData.pendingAction;

                processMessageOutcome.cloudPilot.state = currentStateData;
            }

            // Copy the handler's answer into the API response (works for both success and failure)
            processMessageOutcome.success = result.success;
            processMessageOutcome.cloudPilotMessage = result.cloudPilotMessage;
            processMessageOutcome.atlas = result.atlas || null;
            processMessageOutcome.error = result.error || null;
        }

    //No API Call    
    // User still owes us a field but they asked what is missing — give a short reminder instead of repeating the big question
    } else if (nextMissingField && userAskedForMissingInfo(userMessageNormalized)) {

        const actionDefinitionForPrompt = actionRegistry[actionPending];
        const workflowMessage = messageForMissingField(actionDefinitionForPrompt, nextMissingField);

        console.log("STEP 7: Missing field → reminder message");

        processMessageOutcome.cloudPilotMessage = workflowMessage;
        processMessageOutcome.success = true;

    //No API Call: Ask once for missing fields (workflow intent — not general_chat; that path handles chat + continuation)
    } else if (nextMissingField && intent !== 'general_chat' && (!currentStateData.asked || !currentStateData.asked[nextMissingField])) {

        const actionDefinitionForPrompt = actionRegistry[actionPending];
        const workflowMessage = messageForMissingField(actionDefinitionForPrompt, nextMissingField);

        console.log("STEP 7: Missing field → system message");

        // Remember we already prompted for this field so we do not spam the same question every message
        actionState.markAsked(conversationID, nextMissingField);

        // refresh state
        currentStateData = actionState.getActionStatus(conversationID);

        processMessageOutcome.cloudPilot.state = currentStateData;

        // The actual question text shown to the user
        processMessageOutcome.cloudPilotMessage = workflowMessage;
        processMessageOutcome.success = true;

    //OPEN AI: general_chat during an active workflow — answer tangents, then remind what is still missing
    } else if (nextMissingField && intent === 'general_chat') {

        console.log("STEP 7: General chat during workflow → ChatGPT + continuation");

        const workflowChatResult = await handleWorkflowAwareGeneralChat(userMessageNormalized, action, currentStateData, actionPending);

        processMessageOutcome.success = workflowChatResult.success;
        processMessageOutcome.cloudPilotMessage = workflowChatResult.data || workflowChatResult.message;

        if (!currentStateData.asked || !currentStateData.asked[nextMissingField]) {
            actionState.markAsked(conversationID, nextMissingField);
            currentStateData = actionState.getActionStatus(conversationID);
            processMessageOutcome.cloudPilot.state = currentStateData;
        }

    //No API Call: workflow still incomplete but intent was not general_chat — short resume prompt
    } else if (nextMissingField) {

        const actionDefinitionForPrompt = actionRegistry[actionPending];
        const lines = (currentStateData.missing || []).map((field) => '- ' + field).join('\n');
        const askedFlags = currentStateData.asked || {};
        const alreadyAskedForNext = askedFlags[nextMissingField];
        const resumeMessage = alreadyAskedForNext ? ('I still need:\n' + lines) : (messageForMissingField(actionDefinitionForPrompt, nextMissingField) + '\n\nI still need:\n' + lines);

        console.log("STEP 7: Missing field → resume prompt");

        processMessageOutcome.cloudPilotMessage = resumeMessage;
        processMessageOutcome.success = true;

    //OPEN AI: Calls Open AI (no active workflow with missing fields)
    } else if (intent === 'general_chat') {

        console.log("STEP 7: General chat → ChatGPT");

        // Ask OpenAI for a short reply using the general system prompt
        const result = await handleGeneralChat(userMessageNormalized, action);

        // Map the helper's old shape (data/message) into the same outcome fields the API already used
        processMessageOutcome.success = result.success;
        processMessageOutcome.cloudPilotMessage = result.data || result.message;

    //No API Call
    } else {
        console.log("STEP 7: Fallback message");

        processMessageOutcome.cloudPilotMessage = "How can I help with your AWS setup?";
        processMessageOutcome.success = true;
    }

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
        delete copy.defaults;
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
        normalizedMessage.includes("what else am i missing") ||
        normalizedMessage.includes("what else do you need") ||
        normalizedMessage.includes("forgot what was missing") ||
        normalizedMessage.includes("what do you still need")
    );
}

//Function B5: Workflow prompt for missing field
function messageForMissingField(actionDefinition, nextMissingField) {
    const fromRegistry = actionDefinition && actionDefinition.questions && actionDefinition.questions[nextMissingField];
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


module.exports = {
    processMessage,
    detectIntent,
    decideAction,
};
