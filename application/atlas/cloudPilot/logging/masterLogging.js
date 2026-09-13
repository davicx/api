const timeFunctions = require('../../../functions/timeFunctions');

/*
CloudPilot master logging — ONE control panel (no ENV for these toggles).
Pull console.log sites here one at a time. Visibility only — no behavior changes.

Do NOT require masterCloudPilotCapabilities here — handlers import this file, and
capabilities import handlers (circular dependency). Pass Decide log metadata in.

===============================================================================
MASTER PIPELINE LOGS (clean turn trace — normally ON)
===============================================================================
A: Header / Footer          logHeaderFooterOn
B: Open Request (STEP 1)    logOpenRequestOn
C: Understand (STEP 2/2B)   logUnderstandingOn
D: Decide (STEP 3)          logDecisionOn
E: Fulfill (STEP 4)         logFulfillOn
F: Respond (STEP 5)         logRespondOn

===============================================================================
DETAIL LOGS (verbose — normally OFF except 2A while rebuilding chat)
===============================================================================
G: Understanding Search (MASTER STEP 2A)   logUnderstandingSearchDetailsOn
H: Decision Details                        logDecisionDetailsOn
   — STEP 4/5 JSON blobs, OPEN REQUEST EFFECT, STEP 5b merge dumps
I: Execution Details                       logExecutionDetailsOn
   — STEP 2 Initial State, STEP 6 Execute JSON, Execute — starting, STEP 6b
J: Atlas RAW payloads                      logAtlasRawOn
K: Atlas formatted/normalized payloads     logAtlasFormattedOn
L: Message build / request templates       logMessageBuildOn
M: OpenAI detail / cost                    logOpenAIDetailOn, logOpenAICostTotalOn
N: Save / final response misc              logSaveCloudPilotMessageOn, logFinalResponseOn

===============================================================================
*/

// --- MASTER PIPELINE ---
const logHeaderFooterOn = true;
const logOpenRequestOn = true;
const logUnderstandingOn = true;
const logDecisionOn = true;
const logFulfillOn = true;
const logRespondOn = true;

// --- DETAIL ---
const logUnderstandingSearchDetailsOn = true;
const logDecisionDetailsOn = false;
const logExecutionDetailsOn = false;
const logAtlasRawOn = false;
const logAtlasFormattedOn = false;
const logMessageBuildOn = false;
const logSaveCloudPilotMessageOn = false;
const logFinalResponseOn = false;
const logOpenAICostTotalOn = false;
const logOpenAIDetailOn = false;

/*
FUNCTIONS A: Header and Footer
    1) Function A1: logHeader
    2) Function A2: logFooter

FUNCTIONS B: Open Request
    1) Function B1: logOpenRequest
    2) Function B2: logOpenRequestStatus

FUNCTIONS C: Understand
    1) Function C1: logUnderstandStart
    2) Function C2: logUnderstandingResult

FUNCTIONS D: Decide
    1) Function D1: logDecision

FUNCTIONS E: Checkpoint (legacy rebuild)
    1) Function E1: logTemporaryCheckpoint

FUNCTIONS F: Fulfill
    1) Function F1: logFulfill

FUNCTIONS G: Respond
    1) Function G1: logRespond

FUNCTIONS H: Detail writers (gated console.log helpers)
    1) Function H1: logDecisionDetail
    2) Function H2: logExecutionDetail
    3) Function H3: logAtlasRaw
    4) Function H4: logAtlasFormatted
    5) Function H5: logMessageBuildDetail
*/

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
// logMeta (optional): { requestType, userRequest } from caller — do not look up capabilities here.
function logDecision(decision, logMeta) {
    if (!logDecisionOn) {
        return;
    }

    const result = decision || {};
    const request = result.request;
    const response = result.response || {};
    const meta = logMeta && typeof logMeta === 'object' ? logMeta : {};

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

    console.log('Request Type: ' + formatRequestTypeForLog(result, meta));
    console.log('User Request: ' + formatUserRequestForLog(meta));

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

// scan → Scan, change → Change, information → Information; chat / missing → none
// Prefer logMeta.requestType, then decision fields already set by Decide.
function formatRequestTypeForLog(decision, logMeta) {
    let requestType = null;

    if (logMeta && logMeta.requestType != null) {
        requestType = logMeta.requestType;
    } else if (decision.request && decision.request.requestType != null) {
        requestType = decision.request.requestType;
    } else if (decision.requestType != null) {
        requestType = decision.requestType;
    }

    if (requestType === 'scan') {
        return 'Scan';
    }

    if (requestType === 'change') {
        return 'Change';
    }

    if (requestType === 'information') {
        return 'Information';
    }

    return 'none';
}

// Prefer logMeta.userRequest (capability description / label from caller)
function formatUserRequestForLog(logMeta) {
    if (logMeta && logMeta.userRequest) {
        return String(logMeta.userRequest).trim() || 'none';
    }

    return 'none';
}

//FUNCTIONS E: Checkpoint Logs
//Function E1: Temporary rebuild stop line
function logTemporaryCheckpoint(message) {
    console.log(String(message || 'TEMPORARY CHECKPOINT'));
    console.log(' ');
}

//FUNCTIONS H: Detail writers — gate noisy console.log sites (visibility only)
function logDecisionDetail() {
    if (!logDecisionDetailsOn) {
        return;
    }

    console.log.apply(console, arguments);
}

function logExecutionDetail() {
    if (!logExecutionDetailsOn) {
        return;
    }

    console.log.apply(console, arguments);
}

function logAtlasRaw() {
    if (!logAtlasRawOn) {
        return;
    }

    console.log.apply(console, arguments);
}

function logAtlasFormatted() {
    if (!logAtlasFormattedOn) {
        return;
    }

    console.log.apply(console, arguments);
}

function logMessageBuildDetail() {
    if (!logMessageBuildOn) {
        return;
    }

    console.log.apply(console, arguments);
}

//FUNCTIONS F: Fulfill Logs
//Function F1: What actually happened (store + execute) — debug only
function logFulfill(options) {
    if (!logFulfillOn) {
        return;
    }

    const details = options || {};
    const requestOutcome = details.requestOutcome || null;
    const executionOutcome = details.executionOutcome || null;
    const decision = details.decision || {};
    const skippedGeneral = details.skippedGeneral === true;

    console.log('--------------------------------------------------');
    console.log('MASTER STEP 4: FULFILL');
    console.log(' ');

    if (skippedGeneral) {
        console.log('Request Storage: Skipped (General Conversation)');
        console.log('Execution: Skipped');
        console.log(' ');
        return;
    }

    console.log('Request Storage: ' + formatRequestStorageForLog(requestOutcome, details));
    console.log('Execution: ' + formatExecutionForLog(decision, executionOutcome, details.requestStateAfter));

    const actionName = resolveFulfillActionName(decision, executionOutcome);

    if (actionName) {
        console.log('Action: ' + actionName);
    }

    if (executionOutcome && executionOutcome.ran) {
        console.log(
            'Result: ' + (executionOutcome.success === true ? 'Success' : 'Failed')
        );
    }

    console.log(' ');
}

//FUNCTIONS G: Respond Logs
//Function G1: What CloudPilot told the user — debug only
function logRespond(conversationOutcome, decision) {
    if (!logRespondOn) {
        return;
    }

    const outcome = conversationOutcome || {};
    const responseType =
        decision && decision.response && decision.response.type
            ? decision.response.type
            : 'none';
    const message = String(outcome.cloudPilotMessage || '').trim();
    const preview =
        message.length > 220 ? message.slice(0, 217) + '...' : message;

    console.log('--------------------------------------------------');
    console.log('MASTER STEP 5: RESPOND');
    console.log(' ');
    console.log('Response Type: ' + formatLogValue(responseType));
    console.log('CloudPilot Says: "' + preview.replace(/\n/g, ' / ') + '"');
    console.log(' ');
}

function formatRequestStorageForLog(requestOutcome, details) {
    const afterState = details && details.requestStateAfter ? details.requestStateAfter : null;
    const decision = details && details.decision ? details.decision : {};
    const responseType =
        decision.response && decision.response.type ? String(decision.response.type) : '';

    if (responseType === 'immediate_execution') {
        return 'None';
    }

    if (
        details &&
        details.executionOutcome &&
        details.executionOutcome.ran &&
        afterState &&
        !afterState.pendingAction
    ) {
        return 'Closed';
    }

    if (!requestOutcome || typeof requestOutcome !== 'object') {
        return 'None';
    }

    const action = requestOutcome.action ? String(requestOutcome.action) : '';

    if (action === 'skipped' || requestOutcome.reason === 'immediate_execution_no_row') {
        return 'None';
    }

    if (action === 'created') {
        return 'Created';
    }

    if (action === 'updated') {
        return 'Updated';
    }

    if (action === 'cancelled' || action === 'finished' || action === 'closed') {
        return 'Closed';
    }

    if (requestOutcome.request && requestOutcome.request.pendingAction) {
        return 'Updated';
    }

    return action ? action : 'None';
}

function formatExecutionForLog(decision, executionOutcome, requestStateAfter) {
    if (executionOutcome && executionOutcome.ran) {
        if (executionOutcome.success === true) {
            return 'Completed';
        }

        return 'Failed';
    }

    const status =
        requestStateAfter && requestStateAfter.status
            ? String(requestStateAfter.status)
            : '';

    if (status === 'waiting_on_confirmation') {
        return 'Waiting for Confirmation';
    }

    if (status === 'waiting_on_execution_mode') {
        return 'Waiting for Execution Mode';
    }

    if (status === 'waiting_on_fields') {
        return 'Waiting for Fields';
    }

    if (status === 'waiting_on_resource_scan') {
        return 'Waiting for Resource Scan';
    }

    const responseType =
        decision && decision.response && decision.response.type
            ? String(decision.response.type)
            : '';

    if (responseType === 'awaiting_confirmation') {
        return 'Waiting for Confirmation';
    }

    if (responseType === 'awaiting_execution_mode') {
        return 'Waiting for Execution Mode';
    }

    if (responseType === 'ask_for_missing_fields') {
        return 'Waiting for Fields';
    }

    if (responseType === 'immediate_execution' || responseType === 'execution_started') {
        return 'Not Run';
    }

    return 'Not Run';
}

function resolveFulfillActionName(decision, executionOutcome) {
    if (decision && decision.execute && decision.execute.action) {
        return String(decision.execute.action);
    }

    if (decision && decision.request && decision.request.action) {
        return String(decision.request.action);
    }

    if (
        executionOutcome &&
        executionOutcome.request &&
        executionOutcome.request.pendingAction
    ) {
        return String(executionOutcome.request.pendingAction);
    }

    return null;
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
    // MASTER toggles
    logHeaderFooterOn,
    logOpenRequestOn,
    logUnderstandingOn,
    logDecisionOn,
    logFulfillOn,
    logRespondOn,
    // DETAIL toggles
    logUnderstandingSearchDetailsOn,
    logDecisionDetailsOn,
    logExecutionDetailsOn,
    logAtlasRawOn,
    logAtlasFormattedOn,
    logMessageBuildOn,
    logSaveCloudPilotMessageOn,
    logFinalResponseOn,
    logOpenAICostTotalOn,
    logOpenAIDetailOn,
    // Writers
    logHeader,
    logFooter,
    logOpenRequest,
    logOpenRequestStatus,
    logUnderstandStart,
    logUnderstandingResult,
    logDecision,
    logTemporaryCheckpoint,
    logFulfill,
    logRespond,
    logDecisionDetail,
    logExecutionDetail,
    logAtlasRaw,
    logAtlasFormatted,
    logMessageBuildDetail
};
