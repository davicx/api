const chatFunctions = require('./chatFunctions');

/*
FUNCTIONS A: CloudPilot (Atlas) — intent → decide → ChatGPT
    1) Function A1: Process Message (pipeline)
    2) Function B1: Detect Intent
    3) Function B2: Decide Action
*/

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
