const chatFunctions = require('./chatFunctions');
const conversationStateFunctions = require('./state/conversationStateFunctions');
const atlasFunctions = require('./atlasFunctions');
const {
    formatAtlasEC2Output
} = require('./atlasDataFunctions');
const actionState = require('./state/ActionState');

/*
FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
    1) Function A1: Process Message (pipeline)

//FUNCTIONS B: Process User Messages
    2) Function B1: Detect Intent
    3) Function B2: Decide Action
*/

//FULL WORKING: WILL ADD THESE SOON
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
    var masterUserRequestReady = false;
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
    const normalizedText = chatFunctions.normalizeUserMessageForModel(userMessage);

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
    if (action.type === "scan_ec2" || action.type === "toggle_ec2") {

        if (!actionPending) {
            console.log("STEP 4: Starting new action:", action.type);

            actionState.setPendingAction(conversationID, action.type, ["region"]);

        } else if (actionPending !== action.type) {
            console.log("STEP 4: Replacing action:", actionPending, "→", action.type);

            actionState.setPendingAction(conversationID, action.type, ["region"]);
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

    // STEP 6: Check if ready
    if (actionPending && currentStateData.missing.length === 0) {
        console.log("STEP 6: Request is READY");

        //processMessageOutcome.cloudPilot.action.ready = true;
        processMessageOutcome.cloudPilot.action.ready = actionPending && currentStateData.missing.length === 0;
    } else {
        console.log("STEP 6: Request is NOT ready");
    }

    // STEP 7: Route response (THIS IS THE KEY LAYER)
    if (processMessageOutcome.cloudPilot.action.ready) {

        console.log("STEP 7: READY → action handler");

        let result;

        if (actionPending === 'scan_ec2') {

            //ATLAS: Calls Atlas
            console.log("STEP 7: Calling Atlas");

            try {
                const region = currentStateData.collected.region;
                let atlasResponseFormatted = null;
                const atlasResponseRaw = await atlasFunctions.scanEC2(region);

                console.log("_____________________________________");
                console.log("RAW Atlas Response:");
                console.log(JSON.stringify(atlasResponseRaw, null, 2));
                console.log("_____________________________________");

                if (atlasResponseRaw?.success === true && atlasResponseRaw?.data) {
                    atlasResponseFormatted = formatAtlasEC2Output(atlasResponseRaw);
                }

                console.log("_____________________________________");
                console.log("Atlas Response:");
                console.log(atlasResponseFormatted);
                console.log("_____________________________________");

                actionState.clear(conversationID);

                // refresh state
                currentStateData = actionState.getActionStatus(conversationID);
                actionPending = currentStateData.pendingAction;

                // sync
                processMessageOutcome.cloudPilot.state = currentStateData;

                processMessageOutcome.success = true;
                processMessageOutcome.cloudPilotMessage = "EC2 scan completed for " + region + ".";
                processMessageOutcome.atlas = atlasResponseFormatted;
                //processMessageOutcome.atlas = atlasResponse;
            } catch (error) {
                console.log("Atlas Error:");
                console.log(error);

                processMessageOutcome.success = false;
                processMessageOutcome.cloudPilotMessage = "I could not complete the EC2 scan.";
                processMessageOutcome.error = error.message;
            }

        } else if (actionPending === 'toggle_ec2') {
            //OPEN AI: Calls Open AI 
            result = await respondToToggleEC2(userMessageNormalized, { type: actionPending });

            processMessageOutcome.success = result.success;
            processMessageOutcome.cloudPilotMessage = result.data || result.message;
        }

    //No API Call    
    } else if (actionPending && currentStateData.missing.includes("region") && userAskedForMissingInfo(userMessageNormalized)) {

        console.log("STEP 7: Missing region → reminder message");

        processMessageOutcome.cloudPilotMessage = "I still need the AWS region.";
        processMessageOutcome.success = true;

    //No API Call    
    } else if (actionPending && currentStateData.missing.includes("region") && (!currentStateData.asked || !currentStateData.asked.region)) {

        console.log("STEP 7: Missing region → system message");

        actionState.markAsked(conversationID, "region");

        // refresh state
        currentStateData = actionState.getActionStatus(conversationID);

        // sync
        processMessageOutcome.cloudPilot.state = currentStateData;

        processMessageOutcome.cloudPilotMessage = "Which AWS region should I use?";
        processMessageOutcome.success = true;

    //OPEN AI: Calls Open AI 
    } else if (intent === "general_chat") {

        console.log("STEP 7: General chat → ChatGPT");

        const result = await handleGeneralChat(userMessageNormalized, action);

        processMessageOutcome.success = result.success;
        processMessageOutcome.cloudPilotMessage = result.data || result.message;

    //No API Call
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
    const normalizedMessage = String(userMessage || '').toLowerCase().trim();

    if (normalizedMessage.includes('scan') && normalizedMessage.includes('ec2')) {
        return 'scan_ec2';
    }

    if (normalizedMessage.includes('toggle') || normalizedMessage.includes('switch')) {
        return 'toggle_ec2';
    }

    return 'general_chat';
}

//Function B2: Decide Action
const actions = {
    general_chat: {
        type: 'general_chat',
        allowed: true,
        requiresExecution: false,
        message: '',
    },
    scan_ec2: {
        type: 'scan_ec2',
        allowed: true,
        requiresExecution: false,
        message: 'Preparing EC2 scan.',
    },
    toggle_ec2: {
        type: 'toggle_ec2',
        allowed: true,
        requiresExecution: false,
        message: 'Confirm before changing EC2 instances.',
    }
};

function decideAction(intent) {
    const action = actions[intent];

    if (action) {
        return { ...action }; // ← copy here
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
    const chatResult = await chatFunctions.sendGeneralChat(text);

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

//Function B4: Handle EC2
async function respondToScanEC2(text, action) {
    const chatResult = await chatFunctions.sendChatWithAction(text, action);

    if (!chatResult.success) {
        //console.log('respondToScanEC2: ChatGPT request failed');
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

    //console.log('respondToScanEC2: outcome ok');
    return {
        success: true,
        data: chatResult.data,
        action,
        intent: 'scan_ec2',
        policy: { allowed: true },
    };
}

//Function B4: Handle Toggle EC2
async function respondToToggleEC2(text, action) {
    const chatResult = await chatFunctions.sendChatWithAction(text, action);

    if (!chatResult.success) {
        //console.log('respondToToggleEC2: ChatGPT request failed');
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

    //console.log('respondToToggleEC2: outcome ok');
    return {
        success: true,
        data: chatResult.data,
        action,
        intent: 'toggle_ec2',
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
