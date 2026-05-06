


    /*
    if (action.type === 'scan_ec2') {
        const result = await respondToScanEC2(userMessageNormalized, action);

        processMessageOutcome.success = result.success;
        processMessageOutcome.cloudPilotMessage = result.data || result.message;

    } else if (action.type === 'toggle_ec2') {
        const result = await respondToToggleEC2(userMessageNormalized, action);

        processMessageOutcome.success = result.success;
        processMessageOutcome.cloudPilotMessage = result.data || result.message;

    } else {
        const result = await handleGeneralChat(userMessageNormalized, action);

        processMessageOutcome.success = result.success;
        processMessageOutcome.cloudPilotMessage = result.data || result.message;
    }
    

    if(masterUserRequestReady == true) {
        //Process full
    }
    */



/*
    if (processMessageOutcome.cloudPilot.action.ready) {
        processMessageOutcome.cloudPilotMessage = "Got everything I need. Ready to run " + actionPending;
            
        processMessageOutcome.success = true;

    } else if (actionPending && currentStateData.missing.includes("region")) {
        processMessageOutcome.cloudPilotMessage = "Which AWS region should I use?";
            
        processMessageOutcome.success = true;

    } else {
        processMessageOutcome.cloudPilotMessage = "How can I help with your AWS setup?";
            
        processMessageOutcome.success = true;
    }
    */

    /*

    //STEP 2: Check if user has a pending action and if they do look for missing fields
    if (actionPending) {

        //Step 2A: Try to extract region (later will look for other missing data)
        const region = conversationStateFunctions.extractAwsRegion(userMessage);

        if (region) {
            console.log("STEP 2: Region found " + region);

            actionState.setRegion(conversationID, region);
            currentStateData = actionState.getActionStatus(conversationID);
            actionPending = currentStateData.action;

            //Step 2B: Re-sync updated state
            processMessageOutcome.cloudPilot.state.pendingAction = currentStateData.action;
            processMessageOutcome.cloudPilot.state.missing = currentStateData.missing;
            processMessageOutcome.cloudPilot.state.collected = currentStateData.collected;

        } else {
            console.log("STEP 2: No region in message");
        }

        //Step 2B: Can be added for other fields we need later
    }

    */
    //STEP 3: Check if the user has provided all the info now. If they have the request is ready and done. 
    //For a Pending Action if there are no missing fields the request is ready 
    //Set action: { ready: true } Skip Steps 4 and 5 and return 
    /*
    if (currentStateData.missing.length === 0 && actionPending) {
        masterUserRequestReady = true;
    }

    if (masterUserRequestReady) {
        processMessageOutcome.cloudPilotMessage = "Request is READY";
        processMessageOutcome.success = true;
        processMessageOutcome.cloudPilot.action.ready = true;
    
        console.log("STEP 3: Request is READY");
    } else {
        console.log("STEP 3: Request is NOT ready");
    }
    */

    /*


    //STEP 5: Detect intent
    const intent = detectIntent(userMessageNormalized);
    processMessageOutcome.cloudPilot.intent = intent;

    console.log("STEP 5: INTENT:", intent);

    //STEP 6: Decide action
    const action = decideAction(intent);

    //Set Data: Action
    processMessageOutcome.cloudPilot.action.type = action.type;

    //Step 6A: Start or replace an existing action
    if (action.type === "scan_ec2" || action.type === "toggle_ec2") {
        console.log("STEP 6A: Starting or replacing action:", action.type);

        if (actionPending) {
            console.log("STEP 6A: Dropping previous action:", actionPending);
        }

        const requiredFieldsByAction = {
            scan_ec2: ["region"],
            toggle_ec2: ["region"]
        };

        const requiredFields = requiredFieldsByAction[action.type] || [];

        actionState.setPendingAction(conversationID, action.type, requiredFields);

        //refresh state
        currentStateData = actionState.getActionStatus(conversationID);
        actionPending = currentStateData.action;

        //sync to response
        processMessageOutcome.cloudPilot.state.pendingAction = currentStateData.action;
        processMessageOutcome.cloudPilot.state.missing = currentStateData.missing;
        processMessageOutcome.cloudPilot.state.collected = currentStateData.collected;
    }

    //Step 6B: Update ready status
    masterUserRequestReady = currentStateData.missing.length === 0 && currentStateData.action;

    //STEP 7: Handle the user message
    if (masterUserRequestReady) {

        const actionToRun = actionPending;

        if (actionToRun === 'scan_ec2') {
            const result = await respondToScanEC2(userMessageNormalized, { type: actionToRun });

            processMessageOutcome.success = result.success;
            processMessageOutcome.cloudPilotMessage = result.data || result.message;

        } else if (actionToRun === 'toggle_ec2') {
            const result = await respondToToggleEC2(userMessageNormalized, { type: actionToRun });

            processMessageOutcome.success = result.success;
            processMessageOutcome.cloudPilotMessage = result.data || result.message;
        }

    } else {

        if (action.type === 'scan_ec2') {
            const result = await respondToScanEC2(userMessageNormalized, action);

            processMessageOutcome.success = result.success;
            processMessageOutcome.cloudPilotMessage = result.data || result.message;

        } else if (action.type === 'toggle_ec2') {
            const result = await respondToToggleEC2(userMessageNormalized, action);

            processMessageOutcome.success = result.success;
            processMessageOutcome.cloudPilotMessage = result.data || result.message;

        } else {
            const result = await handleGeneralChat(userMessageNormalized, action);

            processMessageOutcome.success = result.success;
            processMessageOutcome.cloudPilotMessage = result.data || result.message;
        }
    }
    */


//DATA EXPLANATION
/*
var processMessageOutcome = {
    success: false,
    cloudPilotMessage: "",

    cloudPilot: {
        intent: null, // e.g. "scan_ec2", "toggle_ec2"

        policy: {
            allowed: false,
            message: null,
            reasonNotAllowed: null // e.g. "OUT_OF_SCOPE", "DESTRUCTIVE_ACTION"
        },

        action: {
            type: null, // e.g. "scan_ec2"
            ready: false,
            parameters: {} // e.g. { region: "us-west-2" }
        },

        state: {
            pendingAction: null, // e.g. "scan_ec2"
            missing: [],         // e.g. ["region"]
            collected: {},       // e.g. { region: "us-west-2" }

            execution: {
                inProgress: false,
                actionId: null,
                startedAt: null,
                status: "idle" // "idle" | "running" | "completed" | "failed"
            }
        }
    },

    error: null // e.g. { message: "Something went wrong" }
};
*/

//APPENDIX

    /*
    //STEP 2: Normalize and validate the user message
    //console.log("STEP 2: " + userMessage + " normalize and validate");


    //STEP 3: Detect user intent from message
    //console.log("STEP 3: " + text + " detect user intent");
    const intent = detectIntent(text);
    *

    //STEP 5: Decide action if the user is asking to do something 
    //STEP 6: Route to handler
    //STEP 7: Put together response (including API response) and return 


    /*
    //STEP 1: If a scan is pending, check if this message contains the region.
    //If yes → finish the flow. If no → just keep chatting normally.
    if (state.pendingAction && state.pendingAction.type === 'scan_ec2') {
        //console.log("STEP 1: " + state.pendingAction.type + " pending — looking for a region in the message");

        const region = conversationStateFunctions.extractAwsRegion(userMessage);

        if (region) {
            //console.log("STEP 1: " + region + " region detected — ready to scan");
            state.pendingAction = null;
            return {
                success: true,
                data: 'Got it — region ' + region + '. In the future, I\'ll run the EC2 scan here.',
            };
        }

        //console.log("STEP 1: " + userMessage + " had no region — continuing normal pipeline");
    }
*/
/*
    //console.log('--- CloudPilot: process pipeline ---');
    //console.log('User:', userMessage);
//STEP 1: If a scan is pending, check if this message contains the region.
    //STEP 2: Normalize and validate the user message
    //console.log("STEP 2: " + userMessage + " normalize and validate");
    const norm = chatFunctions.normalizeUserMessageForModel(userMessage);
    if (!norm.ok) {
        return { success: false, message: norm.message, data: null };
    }

    const text = norm.text;

    //STEP 3: Detect user intent from message
    //console.log("STEP 3: " + text + " detect user intent");
    const intent = detectIntent(text);

    //STEP 4: Decide action (guardrails + action shape)
    //console.log("STEP 4: " + intent + " decide action (guardrails + action shape)");
    const action = decideAction(intent);
    //console.log('Intent:', intent, 'Action:', action.type);

    if (!action.allowed) {
        //console.log("STEP 5: " + action.type + " blocked — no ChatGPT call");
        return {
            success: true,
            data: action.message,
            action,
            intent,
            policy: { allowed: false, message: action.message },
        };
    }

    //STEP 5: Route to handler
    //console.log("STEP 5: " + action.type + " route to handler");
    switch (action.type) {
        case 'scan_ec2':
            return await respondToScanEC2(userMessage, action);

        case 'toggle_ec2':
            return await respondToToggleEC2(userMessage, action);

        case 'general_chat':
        default:
            return await handleGeneralChat(userMessage, action);
    }
    switch (action.type) {
        case 'scan_ec2':
            //console.log("STEP 5: " + action.type + " set pendingAction and ask for region");
            state.pendingAction = { type: 'scan_ec2', missing: ['region'] };
            return {
                success: true,
                data: 'What region should I scan? (example: us-east-1)',
                action,
                intent,
            };
        case 'toggle_ec2':
            return await respondToToggleEC2(text, action);

        case 'none':
        default:
            return await handleGeneralChat(text, action);
    }
            */




/*
function detectIntent(userMessage) {
    const originalMessage = String(userMessage || '');
    const normalizedMessage = originalMessage.toLowerCase();

    //console.log('detectIntent: Received message -> ' + originalMessage);
    //console.log('detectIntent: Normalized message -> ' + normalizedMessage);

    if (normalizedMessage.includes('scan') && normalizedMessage.includes('ec2')) {
        //console.log('detectIntent: result scan_ec2');
        return 'scan_ec2';
    }

    if (normalizedMessage.includes('toggle') || normalizedMessage.includes('switch')) {
        //console.log('detectIntent: result toggle_ec2');
        return 'toggle_ec2';
    }

    //console.log('detectIntent: result unknown');
    return 'general_chat';
}
*/


//Function B2: Decide Action
/*
function decideAction(intent) {
    //console.log('decideAction: intent=' + intent);
    const allowedIntents = ['scan_ec2', 'toggle_ec2', 'general_chat'];

    if (intent === 'general_chat') {
        return {
            type: 'general_chat',
            allowed: true,
            requiresExecution: false,
            message: '',
        };
    }

    if (intent === 'scan_ec2') {
        //console.log('decideAction: scan_ec2');
        return {
            type: 'scan_ec2',
            allowed: true,
            requiresExecution: false,
            message: 'Preparing EC2 scan.',
        };
    }

    if (intent === 'toggle_ec2') {
        //console.log('decideAction: toggle_ec2');
        return {
            type: 'toggle_ec2',
            allowed: true,
            requiresExecution: false,
            message: 'Confirm before changing EC2 instances.',
        };
    }

    if (!allowedIntents.includes(intent)) {
        //console.log('decideAction: blocked (unsupported intent)');
        return {
            type: 'none',
            allowed: false,
            message: 'I can only help with EC2 right now.',
        };
    }

    //console.log('decideAction: fallback unknown request');
    return {
        type: 'none',
        allowed: false,
        message: 'Unknown request.',
    };
}
*/





//DOC
//NEW 
/*

    */

//LOGIC FLOW
/*

STEP 1: create outcome
STEP 2: collect missing data (if pending)
STEP 3: check if ready

IF ready:
    → skip to execution later

ELSE:
    STEP 4:
        normalize message
        detect intent
        store intent
*/
/*
var processMessageOutcome = {
    success: false, // true if processing completed successfully
    cloudPilotMessage: "", // message shown to the user (final response)

    cloudPilot: {
        intent: null, // e.g. "scan_ec2", "toggle_ec2"

        policy: {
            allowed: false, // whether the action is allowed to proceed
            message: null, // e.g. "That action is not supported", "Destructive actions are not allowed"
            reasonNotAllowed: null // e.g. "OUT_OF_SCOPE", "DESTRUCTIVE_ACTION"
        },

        action: {
            type: null, // e.g. "scan_ec2", "toggle_ec2"
            ready: false, // true when all required fields are collected and action can run
            parameters: {} // e.g. { region: "us-west-2" }
        },

        state: {
            pendingAction: null, // e.g. "scan_ec2"
            missing: [], // e.g. ["region"]
            collected: {} // e.g. { region: "us-west-2" }
        }
    },

    error: null // e.g. error message or object if something fails
};
*/

//APPENDIX

        // Step 2C: Build response
        /*
        processMessageOutcome.success = true;

        if (ready) {
            processMessageOutcome.cloudPilotMessage = "Ready to execute request";
        } else {
            processMessageOutcome.cloudPilotMessage = "Still need: " + currentStateData.missing.join(", ");
        }

        processMessageOutcome.cloudPilot.intent = currentStateData.action;

        processMessageOutcome.cloudPilot.policy.allowed = true;

        if (ready) {
            processMessageOutcome.cloudPilot.policy.policy_message = "READY";
        } else {
            processMessageOutcome.cloudPilot.policy.policy_message = "COLLECTING_INPUT";
        }

        processMessageOutcome.cloudPilot.action.type = currentStateData.action;
        processMessageOutcome.cloudPilot.action.ready = ready;

        processMessageOutcome.cloudPilot.state.pendingAction = currentStateData.action;
        processMessageOutcome.cloudPilot.state.missing = currentStateData.missing;

        return processMessageOutcome;
        */
    /*
    if (actionPending) {

        //Step 2A: Check current message for the region
        const region = conversationStateFunctions.extractAwsRegion(userMessage);

        if (region) { 
            console.log("Step 1A: Region Found " + region)
        } else {
            console.log("Step 1A: The current message did not include the region")
        }

        //Step 1C: Update State (maybe move to function)
        //state.pendingAction.collected.region = region;
        //state.pendingAction.missing = state.pendingAction.missing.filter(
        //    field => field !== "region"
        //);

        //console.log(state);

        //Step 1B: Set variables for processOutcome (This will most likely move)
        processOutcome.success = true;
        processOutcome.cloudPilotMessage = "Continuing previous request";

        processOutcome.cloudPilot.intent = actionPending.type;
        processOutcome.cloudPilot.policy.allowed = true;
        processOutcome.cloudPilot.policy.policy_message = "ACTION_ALLOWED";
        processOutcome.cloudPilot.action.type = actionPending.type;
        processOutcome.cloudPilot.action.ready = false;

        processOutcome.cloudPilot.state.pendingAction = actionPending.type;
        processOutcome.cloudPilot.state.missing = actionPending.missing || [];

    } else {
        console.log("STEP 1: NO Action Pending → continue normal flow");
        processOutcome.success = true;
        processOutcome.cloudPilotMessage = "No active request";

        processOutcome.cloudPilot.intent = "none";
        processOutcome.cloudPilot.policy.allowed = true;
        processOutcome.cloudPilot.policy.policy_message = "ACTION_ALLOWED";
        processOutcome.cloudPilot.action.type = "none";
        processOutcome.cloudPilot.action.ready = false;

    }
    */
        
/*
const state = require('./state'); // adjust path as needed

async function processMessage(userMessage) {
    console.log('--- CloudPilot: process pipeline ---');
    console.log('User:', userMessage);

    //STEP 0: Check pending action FIRST
    if (state.pendingAction) {
        console.log('STEP 0: Found pendingAction → continuing flow');
        return await handlePendingAction(userMessage);
    }

    //STEP 1: Normalize
    const norm = chatFunctions.normalizeUserMessageForModel(userMessage);
    if (!norm.ok) {
        return { success: false, message: norm.message, data: null };
    }

    const text = norm.text;

    //STEP 2: Detect intent
    const intent = detectIntent(text);

    //STEP 3: Decide action
    const action = decideAction(intent);

    if (!action.allowed) {
        return {
            success: true,
            data: action.message,
            action,
            intent
        };
    }

    //STEP 4: HANDLE ACTION TYPES
    switch (action.type) {

        case 'scan_ec2':
            return await startScanEC2Flow(text);

        case 'toggle_ec2':
            return await respondToToggleEC2(text, action);

        default:
            return await handleGeneralChat(text, action);
    }
}
    */


//V2
/*
const chatFunctions = require('./chatFunctions');

/*
FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
    1) Function A1: Process Message (pipeline)
    2) Function B1: Detect Intent
    3) Function B2: Decide Action
*/

/*
//FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
//Function A1: Process Message (pipeline)
async function processMessage(userMessage) {
    console.log('\n--- CloudPilot: process pipeline ---');
    console.log('User:', userMessage);

    //STEP 1: Normalize and validate the user message
    console.log('STEP 1: Normalize and validate the user message');
    const norm = chatFunctions.normalizeUserMessageForModel(userMessage);
    if (!norm.ok) {
        return { success: false, message: norm.message, data: null };
    }

    const text = norm.text;

    //STEP 2: Detect user intent from message
    console.log('STEP 2: Detect user intent from message');
    const intent = detectIntent(text);

    //STEP 3: Decide action (guardrails + action shape)
    console.log('STEP 3: Decide action (guardrails + action shape)');
    const action = decideAction(intent);
    console.log('Intent:', intent, 'Action:', action.type);

    if (!action.allowed) {
        console.log('STEP 4: Blocked — no ChatGPT call');
        return {
            success: true,
            data: action.message,
            action,
            intent,
            policy: { allowed: false, message: action.message },
        };
    }

    //STEP 4: Route to handler
    console.log('STEP 4: Route to handler (action.type=' + action.type + ')');

    switch (action.type) {
        case 'scan_ec2':
            return await respondToScanEC2(text, action);

        case 'toggle_ec2':
            return await respondToToggleEC2(text, action);

        case 'none':
        default:
            return await handleGeneralChat(text, action);
    }
}

//Function B1: Detect Intent
function detectIntent(userMessage) {
    const originalMessage = String(userMessage || '');
    const normalizedMessage = originalMessage.toLowerCase();

    console.log('detectIntent: Received message -> ' + originalMessage);
    console.log('detectIntent: Normalized message -> ' + normalizedMessage);

    if (normalizedMessage.includes('scan') && normalizedMessage.includes('ec2')) {
        console.log('detectIntent: result scan_ec2');
        return 'scan_ec2';
    }

    if (normalizedMessage.includes('toggle') || normalizedMessage.includes('switch')) {
        console.log('detectIntent: result toggle_ec2');
        return 'toggle_ec2';
    }

    console.log('detectIntent: result unknown');
    return 'unknown';
}

//Function B2: Decide Action
function decideAction(intent) {
    console.log('decideAction: intent=' + intent);

    if (intent === 'unknown') {
        console.log('decideAction: general chat (unknown)');
        return {
            type: 'none',
            allowed: true,
            requiresExecution: false,
            message: '',
        };
    }

    const allowedIntents = ['scan_ec2', 'toggle_ec2'];
    if (!allowedIntents.includes(intent)) {
        console.log('decideAction: blocked (unsupported intent)');
        return {
            type: 'none',
            allowed: false,
            message: 'I can only help with EC2 right now.',
        };
    }

    if (intent === 'scan_ec2') {
        console.log('decideAction: scan_ec2');
        return {
            type: 'scan_ec2',
            allowed: true,
            requiresExecution: false,
            message: 'Preparing EC2 scan.',
        };
    }

    if (intent === 'toggle_ec2') {
        console.log('decideAction: toggle_ec2');
        return {
            type: 'toggle_ec2',
            allowed: true,
            requiresExecution: false,
            message: 'Confirm before changing EC2 instances.',
        };
    }

    console.log('decideAction: fallback unknown request');
    return {
        type: 'none',
        allowed: false,
        message: 'Unknown request.',
    };
}

async function handleGeneralChat(text, action) {
    const chatResult = await chatFunctions.sendGeneralChat(text);

    if (!chatResult.success) {
        console.log('handleGeneralChat: ChatGPT request failed');
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

    console.log('handleGeneralChat: outcome ok');
    return {
        success: true,
        data: chatResult.data,
        action,
        intent: 'unknown',
        policy: { allowed: true },
    };
}

async function respondToScanEC2(text, action) {
    const chatResult = await chatFunctions.sendChatWithAction(text, action);

    if (!chatResult.success) {
        console.log('respondToScanEC2: ChatGPT request failed');
        return {
            success: false,
            message: chatResult.message || 'ChatGPT request failed',
            data: null,
            action,
            intent: 'scan_ec2',
            policy: { allowed: true },
            error: chatResult.error,
        };
    }

    console.log('respondToScanEC2: outcome ok');
    return {
        success: true,
        data: chatResult.data,
        action,
        intent: 'scan_ec2',
        policy: { allowed: true },
    };
}

async function respondToToggleEC2(text, action) {
    const chatResult = await chatFunctions.sendChatWithAction(text, action);

    if (!chatResult.success) {
        console.log('respondToToggleEC2: ChatGPT request failed');
        return {
            success: false,
            message: chatResult.message || 'ChatGPT request failed',
            data: null,
            action,
            intent: 'toggle_ec2',
            policy: { allowed: true },
            error: chatResult.error,
        };
    }

    console.log('respondToToggleEC2: outcome ok');
    return {
        success: true,
        data: chatResult.data,
        action,
        intent: 'toggle_ec2',
        policy: { allowed: true },
    };
}


module.exports = {
    processMessage,
    detectIntent,
    decideAction,
};

*/


//FUTURE
/*
async function respondToToggleEC2(text, action) {

    // STEP 1: Confirm with user (optional)
    // STEP 2: Call Engine to toggle
    const result = await engineAPI.toggleEC2();

    // STEP 3: Verify result
    // STEP 4: Store remediation history

    // STEP 5: Explain to user
    const chatResult = await chatFunctions.sendChatWithAction(text, {
        ...action,
        executionResult: result
    });

    return {
        success: true,
        data: chatResult.data,
        execution: result,
        action
    };
}
*/

/*
//V3
async function processMessage(userMessage, conversationID) {
    console.log('\n--- CloudPilot: process pipeline ---');
    console.log('User:', userMessage);
    console.log('ConversationID:', conversationID);

    //STEP 1: Normalize and validate the user message
    console.log('STEP 1: Normalize and validate the user message');
    const norm = chatFunctions.normalizeUserMessageForModel(userMessage);
    if (!norm.ok) {
        return { success: false, message: norm.message, data: null };
    }

    const text = norm.text;

    const conversationKey = conversationStateFunctions.normalizeConversationKey(conversationID);

    //STEP 1.5: Load conversation state (MVP)
    if (!conversationKey) {
        console.log('STEP 1.5: Skip conversation state (conversationID missing/invalid)');

        //STEP 2: Detect user intent from message
        console.log('STEP 2: Detect user intent from message');
        const intent = detectIntent(text);

        //STEP 3: Decide action (guardrails + action shape)
        console.log('STEP 3: Decide action (guardrails + action shape)');
        const action = decideAction(intent);
        console.log('Intent:', intent, 'Action:', action.type);

        if (!action.allowed) {
            console.log('STEP 4: Blocked — no ChatGPT call');
            return {
                success: true,
                data: action.message,
                action,
                intent,
                policy: { allowed: false, message: action.message },
                conversationID: conversationID,
                conversationState: null
            };
        }

        //STEP 4: Route to handler
        console.log('STEP 4: Route to handler (action.type=' + action.type + ')');

        switch (action.type) {
            case 'scan_ec2':
                return await respondToScanEC2(text, action);

            case 'toggle_ec2':
                return await respondToToggleEC2(text, action);

            case 'none':
            default:
                return await handleGeneralChat(text, action);
        }
    }

    console.log('STEP 1.5: Load conversation state');
    let state = conversationStateFunctions.getConversationState(conversationID);
    console.log('Current State:', JSON.stringify(state, null, 2));

    //STEP 1.6: Cancel pending flow (MVP)
    if (state.pendingAction && conversationStateFunctions.isCancelMessage(text)) {
        console.log('STEP 1.6: Cancel pending flow');
        conversationStateFunctions.clearConversationState(conversationID);
        state = conversationStateFunctions.getConversationState(conversationID);

        return {
            success: true,
            data: 'Okay — cancelled.',
            action: { type: 'none', allowed: true, requiresExecution: false, message: '' },
            intent: 'unknown',
            policy: { allowed: true },
            conversationID: conversationID,
            conversationState: state
        };
    }

    //STEP 1.7: Slot filling for scan_ec2 (region) (MVP)
    if (state.pendingAction === 'scan_ec2') {
        console.log('STEP 1.7: Slot filling (scan_ec2)');

        if (!state.collected || !state.collected.region) {
            const region = conversationStateFunctions.extractAwsRegion(text);

            if (!region) {
                state.slotAttempts = Number.isFinite(state.slotAttempts) ? state.slotAttempts + 1 : 1;
                conversationStateFunctions.saveConversationState(conversationID, state);

                if (state.slotAttempts > conversationStateFunctions.MAX_SLOT_ATTEMPTS) {
                    console.log('STEP 1.7b: Too many invalid slot attempts — clearing state');
                    conversationStateFunctions.clearConversationState(conversationID);
                    state = conversationStateFunctions.getConversationState(conversationID);

                    return {
                        success: true,
                        data: 'Let’s restart — say “scan EC2” and then your region (like us-west-2).',
                        action: { type: 'scan_ec2', allowed: true, requiresExecution: false, message: 'Preparing EC2 scan.' },
                        intent: 'scan_ec2',
                        policy: { allowed: true },
                        conversationID: conversationID,
                        conversationState: state
                    };
                }

                return {
                    success: true,
                    data: 'Which region should I scan?',
                    action: { type: 'scan_ec2', allowed: true, requiresExecution: false, message: 'Preparing EC2 scan.' },
                    intent: 'scan_ec2',
                    policy: { allowed: true },
                    conversationID: conversationID,
                    conversationState: state
                };
            }

            console.log('STEP 1.7c: Collected region:', region);
            state.collected = state.collected || {};
            state.collected.region = region;
            state.missing = [];
            state.slotAttempts = 0;
            conversationStateFunctions.saveConversationState(conversationID, state);
        }

        if (!state.missing || state.missing.length === 0) {
            const readyRegion = state.collected && state.collected.region ? state.collected.region : '';

            console.log('STEP 1.8: Ready for Atlas request (log only)');
            const atlasRequestPayload = {
                conversationID: conversationID,
                intent: 'scan_ec2',
                action: { type: 'scan_ec2', allowed: true, requiresExecution: true, message: 'Execute EC2 scan.' },
                collected: { region: readyRegion },
                userMessage: text
            };

            console.log('Sending to Atlas FULL JSON REQUEST' + JSON.stringify(atlasRequestPayload));

            conversationStateFunctions.clearConversationState(conversationID);
            state = conversationStateFunctions.getConversationState(conversationID);

            return {
                success: true,
                data: 'Ready to scan EC2 in ' + readyRegion + '.',
                action: { type: 'scan_ec2', allowed: true, requiresExecution: true, message: 'Execute EC2 scan.' },
                intent: 'scan_ec2',
                policy: { allowed: true },
                conversationID: conversationID,
                conversationState: state,
                atlas: { executed: false, request: atlasRequestPayload }
            };
        }
    }

    //STEP 2: Detect user intent from message
    console.log('STEP 2: Detect user intent from message');
    const freshIntent = detectIntent(text);
    let intent = freshIntent;

    if (state.pendingAction === 'scan_ec2') {
        intent = 'scan_ec2';
    }

    //STEP 2.5: Switch flows mid-conversation (small MVP guardrail)
    if (state.pendingAction && state.pendingAction !== freshIntent && freshIntent !== 'unknown') {
        console.log('STEP 2.5: New intent detected while pending — resetting state');
        conversationStateFunctions.clearConversationState(conversationID);
        state = conversationStateFunctions.getConversationState(conversationID);
        intent = freshIntent;
    }

    //STEP 3: Decide action (guardrails + action shape)
    console.log('STEP 3: Decide action (guardrails + action shape)');
    const action = decideAction(intent);
    console.log('Intent:', intent, 'Action:', action.type);

    if (!action.allowed) {
        console.log('STEP 4: Blocked — no ChatGPT call');
        return {
            success: true,
            data: action.message,
            action,
            intent,
            policy: { allowed: false, message: action.message },
            conversationID: conversationID,
            conversationState: state
        };
    }

    //STEP 3.5: Initialize scan_ec2 pending state (MVP)
    if (!state.pendingAction && intent === 'scan_ec2' && action.type === 'scan_ec2') {
        console.log('STEP 3.5: Initialize state for scan_ec2');

        const region = conversationStateFunctions.extractAwsRegion(text);
        state = {
            pendingAction: 'scan_ec2',
            collected: region ? { region: region } : {},
            missing: region ? [] : ['region'],
            slotAttempts: 0,
            updatedAt: 0
        };

        conversationStateFunctions.saveConversationState(conversationID, state);

        if (!region) {
            return {
                success: true,
                data: 'Which region should I scan?',
                action,
                intent,
                policy: { allowed: true },
                conversationID: conversationID,
                conversationState: conversationStateFunctions.getConversationState(conversationID)
            };
        }

        console.log('STEP 3.6: Region included in first message — ready for Atlas request (log only)');
        const atlasRequestPayload = {
            conversationID: conversationID,
            intent: 'scan_ec2',
            action: { type: 'scan_ec2', allowed: true, requiresExecution: true, message: 'Execute EC2 scan.' },
            collected: state.collected,
            userMessage: text
        };

        console.log('Sending to Atlas FULL JSON REQUEST' + JSON.stringify(atlasRequestPayload));

        conversationStateFunctions.clearConversationState(conversationID);

        return {
            success: true,
            data: 'Ready to scan EC2 in ' + region + '.',
            action: { type: 'scan_ec2', allowed: true, requiresExecution: true, message: 'Execute EC2 scan.' },
            intent: 'scan_ec2',
            policy: { allowed: true },
            conversationID: conversationID,
            conversationState: conversationStateFunctions.getConversationState(conversationID),
            atlas: { executed: false, request: atlasRequestPayload }
        };
    }

    //STEP 4: Route to handler
    console.log('STEP 4: Route to handler (action.type=' + action.type + ')');

    switch (action.type) {
        case 'scan_ec2':
            return {
                ...(await respondToScanEC2(text, action)),
                conversationID: conversationID,
                conversationState: conversationStateFunctions.getConversationState(conversationID)
            };

        case 'toggle_ec2':
            return {
                ...(await respondToToggleEC2(text, action)),
                conversationID: conversationID,
                conversationState: conversationStateFunctions.getConversationState(conversationID)
            };

        case 'none':
        default:
            return {
                ...(await handleGeneralChat(text, action)),
                conversationID: conversationID,
                conversationState: conversationStateFunctions.getConversationState(conversationID)
            };
    }
}
*/


//FUTURE
/*
async function respondToToggleEC2(text, action) {

    // STEP 1: Confirm with user (optional)
    // STEP 2: Call Engine to toggle
    const result = await engineAPI.toggleEC2();

    // STEP 3: Verify result
    // STEP 4: Store remediation history

    // STEP 5: Explain to user
    const chatResult = await chatFunctions.sendChatWithAction(text, {
        ...action,
        executionResult: result
    });

    return {
        success: true,
        data: chatResult.data,
        execution: result,
        action
    };
}
*/

