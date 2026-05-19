/**
 * Aggregated copy of all JavaScript under api/application/atlas/.
 * For reference only — not a runnable module (multiple module.exports).
 * Updated: 2026-05-10
 */



// ================================================================================
// FILE: application/atlas/functions/actions/actionRegistry.js
// ================================================================================

const scanEC2Handler = require('./ec2/scanEC2/scanEC2Handler');
const toggleEC2Handler = require('./ec2/toggleEC2/toggleEC2Handler');

const actionRegistry = {

    //SERVICE: General Chat
    general_chat: {
        type: 'general_chat',
        allowed: true,
        requiresExecution: false,
        message: ''
    },

    //SERVICE: EC2
    //Action: Scan EC2
    scan_ec2: {
        type: 'scan_ec2',
        allowed: true,
        requiresExecution: false,
        workflowEnabled: true,

        //Detect user intent
        match: (text) =>
            text.includes('scan') &&
            text.includes('ec2'),

        //Fields required before execution
        requiredFields: [
            'region'
        ],
        handler: scanEC2Handler,

        //User-facing message
        message:
            'Preparing EC2 scan.'
    },

    //SERVICE: EC2
    //Action: Toggle EC2
    toggle_ec2: {
        type: 'toggle_ec2',
        allowed: true,
        requiresExecution: false,
        workflowEnabled: true,

        //Detect user intent
        match: (text) =>
            text.includes('toggle') ||
            text.includes('switch'),

        //Fields required before execution
        requiredFields: [
            'region'
        ],

        handler: toggleEC2Handler,

        //User-facing message
        message:
            'Confirm before changing EC2 instances.'
    }
};

module.exports = actionRegistry;


// ================================================================================
// FILE: application/atlas/functions/actions/ec2/scanEC2/atlasEC2Formatter.js
// ================================================================================


/*
//GOAL: Take raw data from atlas and format it so it is easier to display
FUNCTIONS A: Atlas Data Formatting Functions
    1) Function A1: Format Atlas EC2 Output
*/

//FUNCTIONS A: Atlas Data Formatting
//Function A1: Format Atlas EC2 Output
function formatAtlasEC2Output(atlasResponse) {

    //STEP 1: Safety checks
    const atlasData = atlasResponse?.data || {};

    const instances = atlasData.instances || [];
    const findings = atlasData.findings || [];

    //STEP 2: Build summary
    const summary = {
        resourcesScanned: atlasData.resourcesScanned || 0,
        findingCount: atlasData.findingCount || 0,
        scanType: atlasData.scanType || null,
        region: atlasData.region || null
    };

    //STEP 3: Simplify instances
    const formattedInstances = instances.map((instance) => {

        return {
            instanceID: instance.instance_id || null,
            name: instance.name || null,
            state: instance.state || null,
            instanceType: instance.instance_type || null,
            avgCPU: instance.avg_cpu || null,
            region: instance.region || null,

            role: instance.tags?.["cloudpilot-role"] || null,

            environmentName:
                instance.tags?.["elasticbeanstalk:environment-name"] || null
        };
    });

    //STEP 4: Simplify findings
    const formattedFindings = findings.map((finding) => {

        return {
            findingID: finding.id || null,

            service: finding.service || null,
            provider: finding.provider || null,
            region: finding.region || null,

            resourceID: finding.resource?.id || null,
            resourceName: finding.resource?.name || null,
            resourceType: finding.resource?.instance_type || null,

            issueCode: finding.issue?.code || null,
            title: finding.issue?.title || null,
            description: finding.issue?.description || null,

            severity: finding.issue?.severity || null,
            confidence: finding.issue?.confidence || null,
            category: finding.issue?.category || null,

            status: finding.status || null,
            priority: finding.priority || null,

            avgCPU: finding.metrics?.avg_cpu || null,

            recommendationAction:
                finding.recommendation?.action || null,

            recommendation:
                finding.recommendation?.description || null,

            risk:
                finding.recommendation?.risk || null,

            remediationAvailable:
                finding.remediation?.available || false,

            estimatedMonthlySavings:
                finding.cost?.estimated_monthly_savings || 0,

            currency:
                finding.cost?.currency || "USD",

            summary:
                finding.summary || null,

            ruleID:
                finding.metadata?.rule_id || null
        };
    });

    //STEP 5: Final formatted output
    return {
        summary,
        instances: formattedInstances,
        findings: formattedFindings
    };
}

module.exports = {
    formatAtlasEC2Output
};


// ================================================================================
// FILE: application/atlas/functions/actions/ec2/scanEC2/atlasEC2Functions.js
// ================================================================================

/*
//GOAL: This is where we call atlas. Atlas interacts and performs AWS Actions
FUNCTIONS A: Atlas Scanner Functions
    1) Function A1: Scan EC2
*/

//FUNCTIONS A: Atlas Scanner
//Function A1: Scan EC2
async function scanEC2(region) {

    const response = await fetch("http://127.0.0.1:8000/scan/ec2", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            scan_type: "full",
            team: "cloud-pilot",
            region: region,
            rules: []
        })
    });

    if (!response.ok) {
        throw new Error("Atlas EC2 scan failed with status " + response.status);
    }

    return await response.json();
}

module.exports = { scanEC2 };


// ================================================================================
// FILE: application/atlas/functions/actions/ec2/scanEC2/atlasEC2MessageBuilder.js
// ================================================================================

/*
//GOAL: This is where we create messages for the user. We could ask Open AI to do this but we just do them ourselves here. 

FUNCTIONS A: Atlas Message Builder Functions
    1) Function A1: Build EC2 Scan Message
*/

//FUNCTIONS A: Atlas Message Builder
//Function A1: Build EC2 Scan Message
function buildEC2ScanMessage(formattedAtlas) {
    var summary = {};
    var findings = [];

    if (formattedAtlas && formattedAtlas.summary) {
        summary = formattedAtlas.summary;
    }

    if (formattedAtlas && Array.isArray(formattedAtlas.findings)) {
        findings = formattedAtlas.findings;
    }

    var region = summary.region || "the selected region";
    var findingCount = findings.length;

    if (findingCount === 0) {
        return "EC2 scan completed for " + region + ". No findings detected.";
    }

    if (findingCount === 1) {
        var finding = findings[0] || {};
        var resourceName = finding.resourceName || finding.resourceID || "one resource";
        var title = finding.title || "an infrastructure finding";

        return "I found 1 EC2 finding in " + region + ". " + resourceName + " has " + String(title).toLowerCase() + ".";
    }

    var firstFinding = findings[0] || {};
    var firstFindingTitle = firstFinding.title || "infrastructure findings";

    return "I found " + findingCount + " EC2 findings in " + region + ", including " + String(firstFindingTitle).toLowerCase() + ".";
}

module.exports = {
    buildEC2ScanMessage
};


// ================================================================================
// FILE: application/atlas/functions/actions/ec2/scanEC2/scanEC2Handler.js
// ================================================================================

const atlasEC2Functions = require('./atlasEC2Functions');
const atlasEC2Formatter = require('./atlasEC2Formatter');
const atlasEC2MessageBuilder = require('./atlasEC2MessageBuilder');

async function scanEC2Handler(context) {

    try {

        const region =
            context.state.collected.region;

        let atlasResponseFormatted = null;

        const atlasResponseRaw =
            await atlasEC2Functions.scanEC2(region);

        console.log("_____________________________________");
        console.log("RAW Atlas Response:");
        console.log(JSON.stringify(atlasResponseRaw, null, 2));
        console.log("_____________________________________");

        if (
            atlasResponseRaw?.success === true &&
            atlasResponseRaw?.data
        ) {

            atlasResponseFormatted =
                atlasEC2Formatter.formatAtlasEC2Output(
                    atlasResponseRaw
                );
        }

        console.log("_____________________________________");
        console.log("Atlas Response:");
        console.log(atlasResponseFormatted);
        console.log("_____________________________________");

        return {
            success: true,
            cloudPilotMessage:
                atlasEC2MessageBuilder.buildEC2ScanMessage(
                    atlasResponseFormatted
                ),
            error: null,
            atlas: atlasResponseFormatted
        };

    } catch (error) {

        console.log("Atlas Error:");
        console.log(error);

        return {
            success: false,
            cloudPilotMessage:
                "I could not complete the EC2 scan.",
            error: error.message,
            atlas: null
        };
    }
}

module.exports = scanEC2Handler;


// ================================================================================
// FILE: application/atlas/functions/actions/ec2/toggleEC2/toggleEC2Handler.js
// ================================================================================

const openAIFunctions = require('../../../openAIFunctions');

async function toggleEC2Handler(context) {
    const chatResult = await openAIFunctions.sendChatWithAction(context.userMessage, context.action);

    if (!chatResult.success) {
        return {
            success: false,
            cloudPilotMessage: chatResult.message || 'ChatGPT request failed',
            error: chatResult.error || null,
            atlas: null
        };
    }

    const cloudPilotMessage =
        (chatResult.data != null && chatResult.data !== '')
            ? chatResult.data
            : (chatResult.message || '');

    return {
        success: true,
        cloudPilotMessage: cloudPilotMessage,
        error: null,
        atlas: null
    };
}

module.exports = toggleEC2Handler;


// ================================================================================
// FILE: application/atlas/functions/cloudPilotMessageFunctions.js
// ================================================================================

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


// ================================================================================
// FILE: application/atlas/functions/config/actionPrompts.js
// ================================================================================

const actionPrompts = {
    create_ec2: {
        requiredFields: [
            "region",
            "instance_type",
            "os"
        ],

        defaults: {
            instance_type: "t2.micro",
            os: "amazon-linux"
        },

        questions: {
            region: "Which AWS region?",
            instance_type: "What instance type would you like?",
            os: "Which OS would you like? (Amazon Linux or Ubuntu)"
        },

        confirmation: {
            title: "CloudPilot is ready to create:"
        },

        tags: {
            "managed-by": "cloudpilot",
            "environment": "demo",
            "delete-me-soon": "true"
        }
    }
};

module.exports = actionPrompts;


// ================================================================================
// FILE: application/atlas/functions/config/chatGPTconfig.js
// ================================================================================

/**
 * Model presets — confirm ids + pricing at https://openai.com/api/pricing/
 * Org-level: set usage limits / budgets in the OpenAI dashboard (not in this repo).
 */
const CHAT_CONFIG = {
    LOW: {
        model: 'gpt-4o-mini',
        max_tokens: 30,
        temperature: 0.2
    },
    MEDIUM: {
        model: 'gpt-4o-mini',
        max_tokens: 150,
        temperature: 0.4
    },
    HIGH: {
        model: 'gpt-4o',
        max_tokens: 500,
        temperature: 0.7
    }
};

/**
 * Bill-safety defaults (prompt cost grows with input length; completion with max_tokens).
 * Override via env if you need more headroom for a specific deployment.
 */
const OPENAI_SAFE_DEFAULTS = {
    /** Max characters sent as the user message (after trim) — blocks huge pasted payloads. */
    MAX_USER_INPUT_CHARS: Number(process.env.OPENAI_MAX_USER_INPUT_CHARS) || 2000,
    /** Hard ceiling on max_tokens passed to the API from createOpenAiChatCompletion (defense in depth). */
    MAX_COMPLETION_TOKENS_CEILING: Number(process.env.OPENAI_MAX_COMPLETION_TOKENS_CEILING) || 512
};

module.exports = { CHAT_CONFIG, OPENAI_SAFE_DEFAULTS };


// ================================================================================
// FILE: application/atlas/functions/functions.js
// ================================================================================

/*
FUNCTIONS A: AWS Helper Functions 
	1) Function A1: Extract AWS region from user text
	2) Function A2: Extract EC2 instance type from user text
	3) Function A3: fieldExtractors map (field name → extractor)

*/

//FUNCTIONS A: AWS Helper Functions
//Function A1: Extract AWS region from user text
function extractAwsRegion(userText) {
    const s = String(userText || '');
    const match = s.match(/\b((?:us|eu|ap|sa|ca|me|af)-(?:gov-)?[a-z]+-\d)\b/i);
    if (!match) {
        return null;
    }
    return String(match[1]).toLowerCase();
}

//Function A2: Extract EC2 instance type from user text
function extractInstanceType(text) {
    const match = text.match(/\b(t2|t3|m5|c5)\.(micro|small|medium|large)\b/i);
    if (!match) {
        return null;
    }
    return String(match[0]).toLowerCase();
}

//Function A3: fieldExtractors map (field name → extractor)
const fieldExtractors = {
    region: extractAwsRegion,
    instance_type: extractInstanceType
};

module.exports = fieldExtractors;


// ================================================================================
// FILE: application/atlas/functions/openAIFunctions.js
// ================================================================================

const OpenAI = require('openai');
const { CHAT_CONFIG, OPENAI_SAFE_DEFAULTS } = require('./config/chatGPTconfig');

/*
FUNCTIONS A: ChatGPT / OpenAI only (no intent logic — use ../logic + ./cloudPilotMessageFunctions for that)

    1) Function A1: Get OpenAI Client
    2) Function A2: Normalize User Message For Model
    3) Function A3: Create OpenAI Chat Completion
    4) Function A4: Send Chat With Action
    5) Function A5: Send General Chat
*/

let openaiClient = null;

const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS) || 10000;

//FUNCTIONS A: ChatGPT / OpenAI
//Function A1: Get OpenAI Client
/** Lazy singleton OpenAI client; returns null if OPENAI_API_KEY is unset. */
function getOpenAIClient() {
    if (!process.env.OPENAI_API_KEY) {
        return null;
    }
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: OPENAI_TIMEOUT_MS
        });
    }
    return openaiClient;
}

//Function A2: Normalize User Message For Model
/** @returns {{ ok: true, text: string, message: '' } | { ok: false, text: '', message: string }}} */
function normalizeUserMessageForModel(raw) {
    const text = typeof raw === 'string' ? raw.trim() : '';
    if (!text) {
        return { ok: false, text: '', message: 'message is required' };
    }
    return { ok: true, text, message: '' };
}

/**
 * @param {import('openai').OpenAI} client
 * @param {{ model: string, messages: Array<{ role: string, content: string }>, max_tokens: number, temperature: number }} params
 * @returns {Promise<{ success: true, data: string|null, usage: object|null } | { success: false, message: string, data: null, error?: string }>}
 */
//Function A3: Create OpenAI Chat Completion
async function createOpenAiChatCompletion(client, params) {
    if (!client) {
        return { success: false, message: 'OpenAI client is missing', data: null };
    }

    const { model, messages, temperature } = params;
    const ceiling = OPENAI_SAFE_DEFAULTS.MAX_COMPLETION_TOKENS_CEILING;
    const requested = Number(params.max_tokens);
    const max_tokens = Number.isFinite(requested) && requested > 0
        ? Math.min(requested, ceiling)
        : Math.min(64, ceiling);

    try {
        const response = await client.chat.completions.create({
            model,
            messages,
            max_tokens,
            temperature
        });

        const choice = response.choices && response.choices[0] && response.choices[0].message;
        const data = choice && choice.content != null ? choice.content : null;

        return {
            success: true,
            data,
            usage: response.usage || null
        };
    } catch (error) {
        console.error('[createOpenAiChatCompletion] ChatGPT error:', error.message || error);
        return {
            success: false,
            message: 'ChatGPT request failed',
            data: null,
            error: error.message || String(error)
        };
    }
}

/**
 * One completion: system rules + serialized action + user text.
 * @returns {Promise<{ success: boolean, data?: string|null, message?: string, error?: string, usage?: object|null }>}
 */
//Function A4: Send Chat With Action
async function sendChatWithAction(userMessage, action) {
    const norm = normalizeUserMessageForModel(userMessage);
    if (!norm.ok) {
        return { success: false, message: norm.message, data: null };
    }

    const text = norm.text;
    const maxIn = OPENAI_SAFE_DEFAULTS.MAX_USER_INPUT_CHARS;
    if (text.length > maxIn) {
        return {
            success: false,
            message: 'message too long (max ' + maxIn + ' characters)',
            data: null
        };
    }

    const client = getOpenAIClient();
    if (!client) {
        console.warn('[sendChatWithAction] OPENAI_API_KEY is not set');
        return { success: false, message: 'OPENAI_API_KEY is not configured', data: null };
    }

    const config = CHAT_CONFIG.LOW;
    const systemPrompt =
        'You are CloudPilot.\n\n' +
        'RULES:\n' +
        '- Help with AWS EC2 when the user is asking about it; otherwise reply briefly and naturally.\n' +
        '- Keep responses under 10 words unless you need one short question (e.g. region or confirmation).\n' +
        '- Do not say you executed anything; nothing runs on AWS yet.\n' +
        '- If action.type is scan_ec2, ask which region if missing.\n' +
        '- If action.type is toggle_ec2, ask for confirmation before acting.\n\n' +
        'ACTION:\n' +
        JSON.stringify(action);

    console.log('[sendChatWithAction] model=%s max_tokens=20 temperature=%s', config.model, config.temperature);

    const result = await createOpenAiChatCompletion(client, {
        model: config.model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
        ],
        max_tokens: 20,
        temperature: config.temperature
    });

    if (result.success && result.usage) {
        console.log(
            '[sendChatWithAction] usage prompt=%s completion=%s total=%s',
            result.usage.prompt_tokens,
            result.usage.completion_tokens,
            result.usage.total_tokens
        );
    }

    return result;
}

/**
 * General conversation (unknown intent / type none). Same outcome shape as sendChatWithAction.
 * @returns {Promise<{ success: boolean, data?: string|null, message?: string, error?: string, usage?: object|null }>}
 */
//Function A5: Send General Chat
async function sendGeneralChat(userMessage) {
    const norm = normalizeUserMessageForModel(userMessage);
    if (!norm.ok) {
        return { success: false, message: norm.message, data: null };
    }

    const text = norm.text;
    const maxIn = OPENAI_SAFE_DEFAULTS.MAX_USER_INPUT_CHARS;
    if (text.length > maxIn) {
        return {
            success: false,
            message: 'message too long (max ' + maxIn + ' characters)',
            data: null
        };
    }

    const client = getOpenAIClient();
    if (!client) {
        console.warn('[sendGeneralChat] OPENAI_API_KEY is not set');
        return { success: false, message: 'OPENAI_API_KEY is not configured', data: null };
    }

    const config = CHAT_CONFIG.LOW;
    console.log('[sendGeneralChat] model=%s max_tokens=%s temperature=%s', config.model, config.max_tokens, config.temperature);

    const result = await createOpenAiChatCompletion(client, {
        model: config.model,
            messages: [
                {
                    role: 'system',
                    content:
                        'You are CloudPilot, an AWS infrastructure assistant.\n\n' +
                        'Prioritize:\n' +
                        '- AWS terminology\n' +
                        '- operationally useful answers\n' +
                        '- exact AWS resource names\n' +
                        '- exact AWS region identifiers when relevant\n\n' +
                        'Keep responses brief, practical, and natural.\n' +
                        'Keep responses under 15 words unless a short follow-up question is needed.\n' +
                        'Do not claim AWS actions were executed.'
                },
                { role: 'user', content: text }
            ],
        max_tokens: config.max_tokens,
        temperature: config.temperature
    });

    if (result.success && result.usage) {
        console.log(
            '[sendGeneralChat] usage prompt=%s completion=%s total=%s',
            result.usage.prompt_tokens,
            result.usage.completion_tokens,
            result.usage.total_tokens
        );
    }

    return result;
}

module.exports = {
    getOpenAIClient,
    normalizeUserMessageForModel,
    createOpenAiChatCompletion,
    sendChatWithAction,
    sendGeneralChat
};


// ================================================================================
// FILE: application/atlas/logic/messages.js
// ================================================================================

const db = require('../../functions/conn');
const Message = require('../../functions/classes/Message');
const Group = require('../../functions/classes/Group');
const Notification = require('../../functions/classes/Notification');
const messageFunctions = require('../../functions/messageFunctions');
const cloudPilotMessageFunctions = require('../functions/cloudPilotMessageFunctions');
const Functions = require('../../functions/functions');
const openAIFunctions = require('../functions/openAIFunctions');
const actionState = require('../state/ActionState');
const { CHAT_CONFIG, OPENAI_SAFE_DEFAULTS } = require('../functions/config/chatGPTconfig');

/*
FUNCTIONS A: All Functions Related to Messages with an API (ChatGPT API right now)
    1) Function A1: Post Message 
    2) Function A2: Delete Message
    3) Function A3: Edit Message
    4) Function A4: Say Hello

FUNCTIONS B: All Functions Related to getting Messages
    1) Function B1: Get all Group Messages
    2) Function B2: Get all Conversation Messages
*/


//FUNCTIONS A: Messages + external API (ChatGPT)
//Function B1: Post Message
async function postMessage(req, res) {
    const masterSite = req.body.masterSite || 'kite';
    const messageType = req.body.messageType || 'text';
    const messageFrom = req.body.messageFrom || req.body.postFrom || req.body.username;
    const messageTo = req.body.messageTo || req.body.postTo || 'chat';
    const groupID = Number(req.body.groupID || 0);
    const conversationID = Number(req.body.conversationID || 0);
    const messageCaption = req.body.messageCaption || req.body.message || req.body.postCaption;
    const cloudKey = req.body.cloudKey || 'no_cloud_key';
    const cloudBucket = req.body.cloudBucket || 'no_cloud_bucket';
    const storageType = req.body.storageType || 'local';
    
    var headerMessage = "Post Message";
    Functions.addHeader(headerMessage);

    var messageOutcome = {
        data: {},
        message: "",
        success: false,
        statusCode: 500,
        errors: [],
        currentUser: messageFrom
    };


    //STEP 1: Get current state (Does the user have an open request)
    var currentState = actionState.getActionStatus(conversationID);
    console.log("STEP 1: Get current state (Does the user have an open request)")
    actionState.print(conversationID);

    //STEP 2: Build Message this is basically the JSON for a message
    var currentUserMessage = messageFunctions.buildNewMessage(req);
    console.log("STEP 2: Build Message ")

    //STEP 3: Send user message to be stored in the database
    console.log("STEP 3: Send user message to be stored in the database");
    var currentUserMessageOutcome = await Message.createMessageText(currentUserMessage);

    //Step 3A: Add current user message to JSON output
    messageOutcome.data.currentUserMessage = currentUserMessageOutcome.newMessage;
    
    if (currentUserMessageOutcome.outcome != 200) {
        messageOutcome.message = "Failed to save user message";
        messageOutcome.statusCode = 500;
        messageOutcome.success = false;
    }

    //STEP 4: CloudPilot processing
    let cloudPilotResult = null;
    console.log(" ");
    console.log("STEP 4: CloudPilot checking user message and sending to OPENAI API");

    try {
        cloudPilotResult = await cloudPilotMessageFunctions.processMessage(messageCaption, conversationID);
        console.log("CloudPilot Result:");
        console.log("___________________");
        console.log(cloudPilotResult);
        console.log("___________________");
    } catch (err) {
        console.error("CloudPilot error:", err);
    }

    //STEP 5: Save CloudPilot message to database
    console.log("STEP 5: Save CloudPilot message to database");

    if (cloudPilotResult && cloudPilotResult.success == true) {

        //STEP 5: Build CloudPilot message
        var cloudPilotMessage = messageFunctions.buildCloudPilotMessage(req, cloudPilotResult.cloudPilotMessage);
        var cloudPilotMessageOutcome = await Message.createMessageText(cloudPilotMessage);

        if (cloudPilotMessageOutcome.outcome == 200) {
            console.log("STEP 5 SUCCESS: CloudPilot message saved");
        } else {
            console.log("STEP 5 FAILED: Could not save CloudPilot message");
        }
    }
    
    //Step 5A: Add current user message to JSON output
    messageOutcome.data.CloudPilotResponseMessage = cloudPilotMessageOutcome.newMessage;

    //Step 5B: Add Cloud Pilot action status to response
    messageOutcome.data.CloudPilotActionStatus = cloudPilotResult.cloudPilot;

    //Step 5C: Add formatted Atlas data to response
    messageOutcome.data.atlas = null;
    if (cloudPilotResult && cloudPilotResult.atlas) {
        messageOutcome.data.atlas = cloudPilotResult.atlas;
    }

    //Step 5D: Set final API success metadata from CloudPilot processing outcome
    if (cloudPilotResult && cloudPilotResult.success == true) {
        messageOutcome.success = true;
        messageOutcome.statusCode = 200;
        messageOutcome.errors = [];
    } else {
        messageOutcome.errors = [];
        
        if (cloudPilotResult && cloudPilotResult.error) {
            messageOutcome.errors = [cloudPilotResult.error];
        }
    }
    
    //STEP 6: Return Response
    Functions.addFooter();
    res.json(messageOutcome);
}

//Function B2: Delete Message
async function deleteMessage(req, res) {
    //STEP 1: Read delete request fields
    console.log('STEP 1: Read delete request fields');
    const messageID = req.body.messageID;
    const currentUser = req.body.currentUser || req.body.messageFrom;

    var deleteMessageOutcome = {
        data: [],
        success: false,
        message: "",
        statusCode: 200,
        errors: [],
        currentUser: currentUser
    };

    //STEP 2: Delete the message
    console.log('STEP 2: Delete the message');
    var deleteOutcome = await Message.deleteMessage(messageID, currentUser);

    //STEP 3: Delete message outcome
    console.log('STEP 3: Delete message outcome');
    if (deleteOutcome.success) {
        deleteMessageOutcome.data.push({ messageID: messageID, currentUser: currentUser });
        deleteMessageOutcome.success = true;
        deleteMessageOutcome.message = "Successfully deleted message " + messageID;
    } else {
        deleteMessageOutcome.message = deleteOutcome.message || "Could not delete message " + messageID;
        deleteMessageOutcome.statusCode = 400;
    }

    res.json(deleteMessageOutcome);
}

//Function B3: Edit Message
async function editMessage(req, res) {
    //STEP 1: Read edit request fields
    console.log('STEP 1: Read edit request fields');
    const currentUser = req.body.currentUser || req.body.messageFrom;
    const messageID = req.body.messageID;
    const newMessageCaption = req.body.newMessageCaption || req.body.messageCaption;

    var editMessageOutcome = {
        data: [],
        success: false,
        message: "",
        statusCode: 200,
        errors: [],
        currentUser: currentUser
    };

    //STEP 2: Check if message exists
    console.log('STEP 2: Check if message exists');
    const messageExistsOutcome = await messageFunctions.checkMessageExists(messageID);

    //STEP 3: Update caption
    console.log('STEP 3: Update caption');
    if (messageExistsOutcome.messageExists) {
        const updateOutcome = await Message.updateMessageCaption(messageID, newMessageCaption, currentUser);
        if (updateOutcome.success) {
            editMessageOutcome.data.push({ messageID: messageID, newMessageCaption: newMessageCaption });
            editMessageOutcome.success = true;
            editMessageOutcome.message = "Message updated!";
        } else {
            editMessageOutcome.message = updateOutcome.message;
            editMessageOutcome.statusCode = 400;
        }
    } else {
        editMessageOutcome.message = "Message not found";
        editMessageOutcome.statusCode = 404;
    }

    //STEP 4: Edit message outcome
    console.log('STEP 4: Edit message outcome');
    res.json(editMessageOutcome);
}

//Function A4: Say Hello
async function postMessageHello(req, res) {
    console.log('postMessageHello: incoming body keys', req.body && Object.keys(req.body));
    const raw = req.body && (req.body.message ?? req.body.messageCaption);
    const userText = raw == null ? '' : typeof raw === 'string' ? raw : String(raw);

    //STEP 1: Validate user message
    console.log('STEP 1: Validate user message');
    const text = typeof userText === 'string' ? userText.trim() : '';
    if (!text) {
        return res.status(400).json({
            success: false,
            data: null,
            message: 'message is required'
        });
    }

    const maxIn = OPENAI_SAFE_DEFAULTS.MAX_USER_INPUT_CHARS;
    if (text.length > maxIn) {
        return res.status(502).json({
            success: false,
            data: null,
            message: 'message too long (max ' + maxIn + ' characters)'
        });
    }

    //STEP 2: Get OpenAI client and config
    console.log('STEP 2: Get OpenAI client and config');
    const client = openAIFunctions.getOpenAIClient();
    if (!client) {
        console.warn('[postMessageHello] OPENAI_API_KEY is not set');
        return res.status(502).json({
            success: false,
            data: null,
            message: 'OPENAI_API_KEY is not configured'
        });
    }

    const config = CHAT_CONFIG.LOW;
    console.log('[postMessageHello] model=%s max_tokens=%s temperature=%s', config.model, config.max_tokens, config.temperature);

    //STEP 3: Call ChatGPT
    console.log('STEP 3: Call ChatGPT');
    const completion = await openAIFunctions.createOpenAiChatCompletion(client, {
        model: config.model,
        messages: [
            {
                role: 'system',
                content: 'You are CloudPilot. Respond in under 5 words. Be concise.'
            },
            {
                role: 'user',
                content: text
            }
        ],
        max_tokens: config.max_tokens,
        temperature: config.temperature
    });

    if (completion.success) {
        if (completion.usage) {
            console.log(
                '[postMessageHello] usage prompt=%s completion=%s total=%s',
                completion.usage.prompt_tokens,
                completion.usage.completion_tokens,
                completion.usage.total_tokens
            );
        }
        console.log('STEP 4: New hello outcome');
        console.log('postMessageHello: result success=true');
        return res.json({
            success: true,
            data: completion.data
        });
    }

    console.log('STEP 4: Something went wrong with hello ChatGPT');
    console.log('postMessageHello: result success=false');
    return res.status(502).json({
        success: false,
        data: null,
        message: completion.message || 'ChatGPT request failed',
        error: completion.error
    });
}


//FUNCTIONS B: Get Messages
//Function B1: Get all Group Messages
async function getGroupMessages(req, res) {
    //STEP 1: Read group id and current user
   //console.log('STEP 1: Read group id and current user');
    const groupID = req.params.group_id;
    const currentUser = req.currentUser || req.body?.currentUser;

    var headerMessage = "Get all Group Messages for Group: " + groupID;
    //Functions.addHeader(headerMessage);

    //STEP 2: Get all group messages
    //console.log('STEP 2: Get all group messages');
    var messagesOutcome = await Message.getGroupMessages(groupID);
    var messages = messagesOutcome.messages || [];

    var messagesResponse = {
        data: messages,
        message: "Group messages",
        success: messagesOutcome.success,
        statusCode: 200,
        errors: [],
        currentUser: currentUser
    };

    //STEP 3: Group messages outcome
    //console.log('STEP 3: Group messages outcome');
    //Functions.addFooter();
    res.json(messagesResponse);
}

//Function B2: Get all Conversation Messages
async function getConversationMessages(req, res) {
    //STEP 1: Read conversation id and current user
    //console.log('STEP 1: Read conversation id and current user');
    const conversationID = req.params.conversation_id;
    const currentUser = req.currentUser || req.body?.currentUser;

    var headerMessage = "HEADER: Get all Conversation Messages for: " + conversationID;
    //Functions.addHeader(headerMessage);

    //STEP 2: Get all conversation messages
    //console.log('STEP 2: Get all conversation messages');
    var messagesOutcome = await Message.getConversationMessages(conversationID);
    var messages = messagesOutcome.messages || [];

    var messagesResponse = {
        data: messages,
        message: "Conversation messages",
        success: messagesOutcome.success,
        statusCode: 200,
        errors: [],
        currentUser: currentUser
    };

    //STEP 3: Conversation messages outcome
    //console.log('STEP 3: Conversation messages outcome');
    //Functions.addFooter();
    res.json(messagesResponse);
}

module.exports = {
    postMessageHello,
    postMessage,
    deleteMessage,
    editMessage,
    getGroupMessages,
    getConversationMessages
};



// ================================================================================
// FILE: application/atlas/routes/messageRoutes.js
// ================================================================================

const express = require('express');
const messageRouter = express.Router();
const messages = require('../logic/messages');
const middlewares = require('../../functions/middlewareFunctions');

/*
FUNCTIONS A: All Functions Related to Messages with an API (ChatGPT API right now)
    1) Function B1: Post Message — intent → guardrails → action → ChatGPT (no Atlas execution)
    2) Function B2: Delete Message
    3) Function B3: Edit Message
    4) Function A1: Say Hello — OpenAI smoke test

FUNCTIONS C: All Functions Related to getting Messages
    1) Function C1: Get all Group Messages
    2) Function C2: Get all Conversation Messages
*/

//FUNCTIONS A: All Functions Related to Messages with an API (ChatGPT API right now)
//Route B1: Post Message
messageRouter.post('/message', function (req, res) {
    messages.postMessage(req, res);
});

//Route B2: Delete Message
messageRouter.post('/message/delete', function (req, res) {
    messages.deleteMessage(req, res);
});

//Route B3: Edit Message
messageRouter.post('/message/edit', function (req, res) {
    messages.editMessage(req, res);
});

//Route A1: Say Hello — POST /message/hello
messageRouter.post('/message/hello', function (req, res) {
    messages.postMessageHello(req, res);
});

//FUNCTIONS C: All Functions Related to getting Messages
//Route C1: Get all Group Messages
messageRouter.get('/messages/group/:group_id', middlewares.verifyUser, (req, res) => {
    messages.getGroupMessages(req, res);
});

//Route C2: Get all Conversation Messages
messageRouter.get('/messages/conversation/:conversation_id', middlewares.verifyUser, (req, res) => {
    messages.getConversationMessages(req, res);
});

module.exports = messageRouter;


// ================================================================================
// FILE: application/atlas/state/ActionState.js
// ================================================================================

/*
EXAMPLE STATE
{
  pendingAction: "scan_ec2",
  missing: [],
  asked: {},
  collected: {
    region: "us-west-2",
    instanceId: "i-123"
  }
}

TEST: manually set state
actionState.setPendingAction(conversationID, "scan_ec2", ["region"]);

TEST
actionState.setRegion(conversationID, "us-east-1");
console.log("TEST: Updated state after region");
actionState.print(conversationID);

*/

class ActionState {
  constructor() {
    this.store = new Map();
  }

  // STEP 1: Ensure state exists
  getState(conversationId) {
    if (!this.store.has(conversationId)) {
      this.store.set(conversationId, {
        pendingAction: null,
        collected: {},
        missing: [],
        asked: {}
      });
    }

    const state = this.store.get(conversationId);

    if (!state.asked) {
      state.asked = {};
    }

    return state;
  }

  // STEP 2: Start a new action
  setPendingAction(conversationId, action, missingFields = []) {
    const state = this.getState(conversationId);

    state.pendingAction = action;
    state.missing = [...missingFields];
    state.collected = {};
    state.asked = {};
  }

  // STEP 3: Get current action status (FIXED: consistent naming)
  getActionStatus(conversationId) {
    const state = this.getState(conversationId);

    return {
      pendingAction: state.pendingAction,
      missing: state.missing,
      collected: state.collected,
      asked: state.asked
    };
  }

  // STEP 3.5: Mark missing field as already asked
  markAsked(conversationId, field) {
    const state = this.getState(conversationId);

    state.asked[field] = true;
  }

  // STEP 4: Set region (specific helper)
  setRegion(conversationId, region) {
    const state = this.getState(conversationId);

    state.collected.region = region;
    state.missing = state.missing.filter(field => field !== "region");
  }

  // STEP 5: Generic field setter
  setField(conversationId, field, value) {
    const state = this.getState(conversationId);

    state.collected[field] = value;
    state.missing = state.missing.filter(f => f !== field);
  }

  // STEP 6: Check if ready to execute
  isReady(conversationId) {
    const state = this.getState(conversationId);
    return state.pendingAction && state.missing.length === 0;
  }

  // STEP 7: Clear state after completion
  clear(conversationId) {
    this.store.delete(conversationId);
  }

  // STEP 8: Debug helper
  print(conversationId) {
    const state = this.getState(conversationId);
    console.log("STATE:", JSON.stringify(state, null, 2));
  }
}

module.exports = new ActionState();

/*
//EXAMPLE
{
  pendingAction: "scan_ec2",
  missing: [],
  collected: {
    region: "us-west-2",
    instanceId: "i-123"
  }
}


*/

/*
class ActionState {
    constructor() {
      this.store = new Map();
    }
  
    // STEP 1: Ensure state exists
    getState(conversationId) {
      if (!this.store.has(conversationId)) {
        this.store.set(conversationId, {
          pendingAction: null,
          collected: {},
          missing: []
        });
      }
  
      return this.store.get(conversationId);
    }
  
    // STEP 2: Start a new action
    setPendingAction(conversationId, action, missingFields = []) {
      const state = this.getState(conversationId);
  
      state.pendingAction = action;
      state.missing = [...missingFields];
      state.collected = {};
    }
  
    // STEP 3: Get current action status
    getActionStatus(conversationId) {
      const state = this.getState(conversationId);
  
      return {
        action: state.pendingAction,
        missing: state.missing,
        collected: state.collected
      };
    }
  
    // STEP 4: Set region (your main use case)
    setRegion(conversationId, region) {
      const state = this.getState(conversationId);
  
      state.collected.region = region;
  
      state.missing = state.missing.filter(field => field !== "region");
    }
  
    // STEP 5: Generic field setter (useful later)
    setField(conversationId, field, value) {
      const state = this.getState(conversationId);
  
      state.collected[field] = value;
  
      state.missing = state.missing.filter(f => f !== field);
    }
  
    // STEP 6: Check if ready to execute
    isReady(conversationId) {
      const state = this.getState(conversationId);
      return state.pendingAction && state.missing.length === 0;
    }
  
    // STEP 7: Clear state after completion
    clear(conversationId) {
      this.store.delete(conversationId);
    }
  
    // STEP 8: Debug helper (you'll use this a LOT)
    print(conversationId) {
      const state = this.getState(conversationId);
      console.log("STATE:", JSON.stringify(state, null, 2));
    }
  }
  
  module.exports = new ActionState();
  */


// ================================================================================
// FILE: application/atlas/state/conversationStateFunctions.js
// ================================================================================

/*
FUNCTIONS C: Conversation State (MVP)

Lightweight per-conversation state for CloudPilot multi-step flows.

NOTES:
- In-memory only (single Node process). Resets on restart.
- TODO: Replace Map with DB/Redis when you need multi-process + durable workflows.

FUNCTIONS A: Internal state helpers
	1) Function A1: nowMs
	2) Function A2: defaultConversationState
	3) Function A3: cloneDefaultState
	4) Function A4: isStaleState

FUNCTIONS B: Conversation key
	1) Function B1: Normalize conversation key

FUNCTIONS C: State storage API
	1) Function C1: Get State
	2) Function C2: Save State
	3) Function C3: Clear State

FUNCTIONS D: User message helpers
	1) Function D1: Detect cancel message

*/

// TODO: Replace in-memory Map with DB/Redis for multi-process + durable workflows.
const stateStore = new Map();

const STATE_TTL_MS = Number(process.env.CLOUDPILOT_STATE_TTL_MS) || 30 * 60 * 1000;
const MAX_SLOT_ATTEMPTS = Number(process.env.CLOUDPILOT_STATE_MAX_SLOT_ATTEMPTS) || 8;

//FUNCTIONS A: Internal state helpers
//Function A1: nowMs
function nowMs() {
    return Date.now();
}

//Function A2: defaultConversationState
function defaultConversationState() {
    return {
        pendingAction: null,
        collected: {},
        missing: [],
        slotAttempts: 0,
        updatedAt: 0
    };
}

//Function A3: cloneDefaultState
function cloneDefaultState() {
    const base = defaultConversationState();
    return {
        pendingAction: base.pendingAction,
        collected: { ...base.collected },
        missing: base.missing.slice(),
        slotAttempts: base.slotAttempts,
        updatedAt: base.updatedAt
    };
}

//Function A4: isStaleState
function isStaleState(state) {
    if (!state || !state.updatedAt) {
        return false;
    }
    return nowMs() - state.updatedAt > STATE_TTL_MS;
}

//FUNCTIONS B: Conversation key
//Function B1: Normalize conversation key
function normalizeConversationKey(conversationID) {
    const id = Number(conversationID || 0);
    if (!Number.isFinite(id) || id <= 0) {
        return null;
    }
    return String(id);
}

//FUNCTIONS C: State storage API
//Function C1: Get State
function getConversationState(conversationID) {
    const key = normalizeConversationKey(conversationID);
    if (!key) {
        return cloneDefaultState();
    }

    const existing = stateStore.get(key);
    if (!existing) {
        return cloneDefaultState();
    }

    if (isStaleState(existing)) {
        console.log('conversationState: stale state cleared (conversationID=' + key + ')');
        stateStore.delete(key);
        return cloneDefaultState();
    }

    return {
        pendingAction: existing.pendingAction,
        collected: { ...(existing.collected || {}) },
        missing: Array.isArray(existing.missing) ? existing.missing.slice() : [],
        slotAttempts: Number.isFinite(existing.slotAttempts) ? existing.slotAttempts : 0,
        updatedAt: existing.updatedAt || 0
    };
}

//Function C2: Save State
function saveConversationState(conversationID, state) {
    const key = normalizeConversationKey(conversationID);
    if (!key) {
        return;
    }

    const next = {
        pendingAction: state && state.pendingAction != null ? state.pendingAction : null,
        collected: { ...(state && state.collected ? state.collected : {}) },
        missing: Array.isArray(state && state.missing) ? state.missing.slice() : [],
        slotAttempts: Number.isFinite(state && state.slotAttempts) ? state.slotAttempts : 0,
        updatedAt: nowMs()
    };

    stateStore.set(key, next);
}

//Function C3: Clear State
function clearConversationState(conversationID) {
    const key = normalizeConversationKey(conversationID);
    if (!key) {
        return;
    }
    stateStore.delete(key);
}

//FUNCTIONS D: User message helpers
//Function D1: Detect cancel message
function isCancelMessage(userText) {
    const t = String(userText || '').trim().toLowerCase();
    if (!t) {
        return false;
    }

    const cancelPhrases = ['cancel', 'stop', 'never mind', 'nevermind', 'forget it', 'abort', 'quit'];
    return cancelPhrases.some((p) => t === p || t.includes(p));
}

module.exports = {
    // STATE_TTL_MS, // Unused externally — only referenced internally by isStaleState()
    MAX_SLOT_ATTEMPTS,
    normalizeConversationKey,
    getConversationState,
    saveConversationState,
    clearConversationState,
    isCancelMessage
};


// ================================================================================
// FILE: application/atlas/state/state.js
// ================================================================================

// state.js
function createDefaultState() {
  return {
    pendingAction: null,
    missing: [],
    collected: {} 
  };
}
/*

state = {
  pendingAction: {
    type: null,
    missing: [],
    collected: {}
  }
}
  */

/*
function createDefaultState() {
  return {
    pendingAction: {
      type: null,
      missing: [],
      collected: {}
    }
  };
}
*/

module.exports = {
  createDefaultState
};


/*
// state.js
const state = {
  pendingAction: null
};

module.exports = state;
*/


