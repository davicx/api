const timeFunctions = require('../../../functions/timeFunctions');

/*
CloudPilot master logging — toggles on/off without ENV.
Pull console.log sites here one at a time.

FUNCTIONS A: Header and Footer
    1) Function A1: logHeader
    2) Function A2: logFooter

FUNCTIONS B: Request Related Logs
    1) Function B1: logOpenRequest
    2) Function B2: logOpenRequestStatus

FUNCTIONS C: Understanding Logs
    1) Function C1: logUnderstandStart
    2) Function C2: logUnderstandingResult

FUNCTIONS D: Decision Logs
    1) Function D1: logDecision

FUNCTIONS E: Checkpoint Logs
    1) Function E1: logTemporaryCheckpoint
*/

const logHeaderFooterOn = true;
const logOpenRequestOn = true;
const logUnderstandingOn = true;
const logDecisionOn = true;

// Quiet while chat rebuild checkpoint is on (turn back on later)
const logMessageBuildOn = false;
const logSaveCloudPilotMessageOn = false;
const logFinalResponseOn = false;
const logOpenAICostTotalOn = false;
const logOpenAIDetailOn = false;

//FUNCTIONS A: Header and Footer
//Function A1: Message turn header
function logHeader(headerMessage) {
    if (!logHeaderFooterOn) {
        return;
    }

    console.log('______________________________________________________________');
    console.log('HEADER: ' + String(headerMessage || 'New Message'));
    console.log('______________________________________________________________');
    console.log(' ');
}

//Function A2: Message turn footer
function logFooter() {
    if (!logHeaderFooterOn) {
        return;
    }

    console.log('______________________________________________________________');
    console.log(
        'FOOTER: Request made at ' + timeFunctions.getCurrentTime().postTime
    );
    console.log('______________________________________________________________');
    console.log(' ');
}

//FUNCTIONS B: Request Related Logs
//Function B1: Log open-request lookup (MASTER STEP 1)
function logOpenRequest(hasOpenRequest, requestState) {
    if (!logOpenRequestOn) {
        return;
    }

    console.log('--------------------------------------------------');
    console.log('MASTER STEP 1: OPEN REQUEST');
    console.log(' ');

    if (hasOpenRequest) {
        console.log('Has Open Request: YES');
        logOpenRequestStatus(requestState);
    } else {
        console.log('Has Open Request: NO');
    }

    console.log(' ');
}

//Function B2: Log open-request status fields
function logOpenRequestStatus(requestState) {
    if (!logOpenRequestOn) {
        return;
    }

    const state = requestState || {};

    console.log(
        'Request ID: ' +
            String(state.workflowId != null ? state.workflowId : '')
    );
    console.log('Action: ' + String(state.pendingAction || ''));
    console.log('Status: ' + String(state.status || ''));
    console.log(
        'Missing Fields: ' +
            (Array.isArray(state.missing) && state.missing.length > 0
                ? state.missing.join(', ')
                : 'none')
    );
}

//FUNCTIONS C: Understanding Logs
//Function C1: Start MASTER STEP 2 (before understandMessage / Search Results)
function logUnderstandStart() {
    if (!logUnderstandingOn) {
        return;
    }

    console.log('--------------------------------------------------');
    console.log('MASTER STEP 2: UNDERSTAND');
    console.log(' ');
}

//Function C2: Log Understanding result (MASTER STEP 2B)
function logUnderstandingResult(understanding) {
    if (!logUnderstandingOn) {
        return;
    }

    const result = understanding || {};

    console.log('MASTER STEP 2B: UNDERSTANDING RESULT');
    console.log(' ');
    console.log('Action: ' + formatLogValue(result.action));
    console.log('Values: ' + formatLogValues(result.values));
    console.log('Reply: ' + formatLogValue(result.reply));
    console.log('Conversation: ' + formatLogValue(result.conversation));
    console.log('Question: ' + formatLogValue(result.question));
    console.log('Ambiguous: ' + (result.ambiguous === true ? 'YES' : 'NO'));
    console.log(' ');
}

//FUNCTIONS D: Decision Logs
//Function D1: Log Decision summary (MASTER STEP 3)
function logDecision(decision) {
    if (!logDecisionOn) {
        return;
    }

    const result = decision || {};
    const request = result.request;
    const response = result.response || {};

    console.log('--------------------------------------------------');
    console.log('MASTER STEP 3: DECIDE');
    console.log(' ');
    console.log('Chat Type: ' + formatLogValue(result.chatType));

    if (!request || typeof request !== 'object') {
        console.log('Request: none');
    } else {
        console.log(
            'Request Action: ' + formatLogValue(request.action || request.pendingAction)
        );
        console.log('Request Status: ' + formatLogValue(request.status));

        if (request.effect !== undefined && request.effect !== null && request.effect !== '') {
            console.log('Request Effect: ' + formatLogValue(request.effect));
        }
    }

    console.log('Response Type: ' + formatLogValue(response.type));

    if (result.closeRequest === true) {
        console.log('Close Request Intent: YES');
    }

    if (result.replaceOpenRequest === true) {
        console.log('Replace Open Request Intent: YES');
    }

    if (result.execute !== undefined && result.execute !== null && result.execute !== false) {
        console.log('Execute Intent: ' + formatExecuteIntent(result.execute));
    }

    console.log(' ');
}

//FUNCTIONS E: Checkpoint Logs
//Function E1: Temporary rebuild stop line
function logTemporaryCheckpoint(message) {
    console.log(String(message || 'TEMPORARY CHECKPOINT'));
    console.log(' ');
}

//Helper: Scalar / null display for master logs
function formatLogValue(value) {
    if (value === undefined || value === null || value === '') {
        return 'none';
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
}

//Helper: Values object display for Understanding log
function formatLogValues(values) {
    if (!values || typeof values !== 'object' || Array.isArray(values)) {
        return '{}';
    }

    const keys = Object.keys(values);

    if (keys.length === 0) {
        return '{}';
    }

    return JSON.stringify(values);
}

//Helper: Concise execute intent for Decision log
function formatExecuteIntent(execute) {
    if (execute === true) {
        return 'YES';
    }

    if (typeof execute !== 'object' || Array.isArray(execute)) {
        return formatLogValue(execute);
    }

    if (execute.action !== undefined && execute.action !== null && execute.action !== '') {
        return String(execute.action);
    }

    if (execute.type !== undefined && execute.type !== null && execute.type !== '') {
        return String(execute.type);
    }

    return 'YES';
}

module.exports = {
    logHeaderFooterOn,
    logOpenRequestOn,
    logUnderstandingOn,
    logDecisionOn,
    logMessageBuildOn,
    logSaveCloudPilotMessageOn,
    logFinalResponseOn,
    logOpenAICostTotalOn,
    logOpenAIDetailOn,
    logHeader,
    logFooter,
    logOpenRequest,
    logOpenRequestStatus,
    logUnderstandStart,
    logUnderstandingResult,
    logDecision,
    logTemporaryCheckpoint
};
