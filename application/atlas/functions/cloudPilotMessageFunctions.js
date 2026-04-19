const chatFunctions = require('./chatFunctions');
const conversationStateFunctions = require('./conversationStateFunctions');
const state = require('./state/state');

/*
FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
    1) Function A1: Process Message (pipeline)
    2) Function B1: Detect Intent
    3) Function B2: Decide Action

FUNCTIONS C: Conversation State (MVP)
    1) Function C1: Get / Save / Clear per-conversation pending action state
*/

//FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
//Function A1: Process Message (pipeline)
async function processMessage(userMessage) {
    
    //STEP 0: Pending action — pause normal pipeline (no normalize / intent / decide)
    if (state.pendingAction) {
        console.log('STEP 0: Pending action exists — skipping normalize, detectIntent, decideAction');
        return {
            success: true,
            data: 'Pending action in progress',
        };
    }

    console.log('--- CloudPilot: process pipeline ---');
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
            console.log('STEP 4: scan_ec2 — set pendingAction (no ChatGPT yet)');
            state.pendingAction = { type: 'scan_ec2' };
            return {
                success: true,
                data: 'Started scan flow',
                action,
                intent,
            };
        /*
        case 'scan_ec2':
            return await handleScanEC2(text, action);
        */
        case 'toggle_ec2':
            return await handleToggleEC2(text, action);

        case 'none':
        default:
            return await handleGeneralChat(text, action);
    }
}

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
            return await handleToggleEC2(text, action);

        default:
            return await handleGeneralChat(text, action);
    }
}
    */

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

async function handleScanEC2(text, action) {
    const chatResult = await chatFunctions.sendChatWithAction(text, action);

    if (!chatResult.success) {
        console.log('handleScanEC2: ChatGPT request failed');
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

    console.log('handleScanEC2: outcome ok');
    return {
        success: true,
        data: chatResult.data,
        action,
        intent: 'scan_ec2',
        policy: { allowed: true },
    };
}

async function handleToggleEC2(text, action) {
    const chatResult = await chatFunctions.sendChatWithAction(text, action);

    if (!chatResult.success) {
        console.log('handleToggleEC2: ChatGPT request failed');
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

    console.log('handleToggleEC2: outcome ok');
    return {
        success: true,
        data: chatResult.data,
        action,
        intent: 'toggle_ec2',
        policy: { allowed: true },
    };
}



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
            return await handleScanEC2(text, action);

        case 'toggle_ec2':
            return await handleToggleEC2(text, action);

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

async function handleScanEC2(text, action) {
    const chatResult = await chatFunctions.sendChatWithAction(text, action);

    if (!chatResult.success) {
        console.log('handleScanEC2: ChatGPT request failed');
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

    console.log('handleScanEC2: outcome ok');
    return {
        success: true,
        data: chatResult.data,
        action,
        intent: 'scan_ec2',
        policy: { allowed: true },
    };
}

async function handleToggleEC2(text, action) {
    const chatResult = await chatFunctions.sendChatWithAction(text, action);

    if (!chatResult.success) {
        console.log('handleToggleEC2: ChatGPT request failed');
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

    console.log('handleToggleEC2: outcome ok');
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
async function handleToggleEC2(text, action) {

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
                return await handleScanEC2(text, action);

            case 'toggle_ec2':
                return await handleToggleEC2(text, action);

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
                ...(await handleScanEC2(text, action)),
                conversationID: conversationID,
                conversationState: conversationStateFunctions.getConversationState(conversationID)
            };

        case 'toggle_ec2':
            return {
                ...(await handleToggleEC2(text, action)),
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
async function handleToggleEC2(text, action) {

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

module.exports = {
    processMessage,
    detectIntent,
    decideAction,
};
