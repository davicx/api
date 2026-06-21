const actionMap = require('../actions/actionMap');
const CloudPilotChat = require('../chat/CloudPilotChat');
const { RESPONSE_TYPE } = require('../decision/decisionTypes');
const UserRequestedInstructionsFunctions = require('./modes/userRequestedInstructions');
const UserRequestedCLIFunctions = require('./modes/userRequestedCLI');
const UserRequestedPRFunctions = require('./modes/userRequestedPR');

/*
FUNCTIONS A: STEP 7 — CloudPilot chat text (assembly only)
    1) Function A1: buildCloudPilotResponse

FUNCTIONS B: Helpers
    1) Function B1: mapResponseTypeToActionEvent
    2) Function B2: buildChatHandlerPayload
    3) Function B3: copyObject
    4) Function B4: copyStringArray
    5) Function B5: isRequestReady
    6) Function B6: buildUserRequestedModeResponse — modes 1–3 at STEP 7 (mode 4: userRequestedAutomatic at STEP 6)
*/

//Function A1: Assemble CloudPilotChat input and return chat text
async function buildCloudPilotResponse(decision, context) {
    const executionOutcome = context.executionOutcome || null;

    if (executionOutcome && executionOutcome.ran && executionOutcome.cloudPilotMessage) {
        return {
            success: Boolean(executionOutcome.success),
            cloudPilotMessage: executionOutcome.cloudPilotMessage,
            chatType: decision.chatType,
            atlasResponse: executionOutcome.atlasResponse || null,
            error: executionOutcome.error || null
        };
    }

    const requestState = getRequestStateFromContext(context);
    const requestOutcome = context.requestOutcome || {};
    const responseType = decision.response && decision.response.type ? decision.response.type : '';

    // Modes 1–3 at STEP 7. Mode 4 (automatic): CloudPilotChat confirmation here; STEP 6 → userRequestedAutomatic.js
    // Undo (H4): STEP 6 executeUndo → executionOutcome picked up above
    const userRequestedModeResponse = buildUserRequestedModeResponse(responseType, decision.chatType);

    if (userRequestedModeResponse) {
        return userRequestedModeResponse;
    }

    const actionEvent = mapResponseTypeToActionEvent(responseType, requestOutcome);
    const activeAction = requestState.pendingAction;
    const actionDefinition = actionMap[activeAction] || null;

    if (!actionDefinition) {
        return {
            success: false,
            cloudPilotMessage: '',
            chatType: decision.chatType,
            atlasResponse: null,
            error: 'no_action_definition_for_response'
        };
    }

    const chatPayload = buildChatHandlerPayload({
        conversationID: context.conversationID,
        currentUserMessage: context.currentUserMessage,
        actionEvent: actionEvent,
        actionDefinition: actionDefinition,
        requestState: requestState
    });

    const chatResult = await CloudPilotChat.handleCloudPilotChat(chatPayload);
    const cloudPilotMessage = chatResult.cloudPilotMessage || chatResult.message || '';

    return {
        success: Boolean(chatResult.success && cloudPilotMessage),
        cloudPilotMessage: cloudPilotMessage,
        chatType: decision.chatType,
        atlasResponse: chatResult.atlasResponse || null,
        error: chatResult.error || null
    };
}

//Function B1: TEMPORARY — map decision.response.type to CloudPilotChat actionEvent
function mapResponseTypeToActionEvent(responseType, requestOutcome) {
    /*
    TEMPORARY COMPATIBILITY LAYER
    DELETE AFTER CloudPilotChat USES decision.response.type DIRECTLY
    */
    const requestAction = requestOutcome && requestOutcome.action ? requestOutcome.action : '';

    if (responseType === RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS) {
        if (requestAction === 'created') {
            return 'new_action';
        }

        if (requestAction === 'updated') {
            return 'missing_fields_given';
        }

        return 'workflow_in_progress';
    }

    if (responseType === RESPONSE_TYPE.AWAITING_CONFIRMATION) {
        return 'awaiting_confirmation';
    }

    if (responseType === RESPONSE_TYPE.AWAITING_EXECUTION_MODE) {
        return 'awaiting_execution_mode';
    }

    if (responseType === RESPONSE_TYPE.EXECUTION_STARTED) {
        return 'execution_started';
    }

    if (responseType === RESPONSE_TYPE.WORKFLOW_RUNNING) {
        return 'workflow_running';
    }

    if (responseType === RESPONSE_TYPE.REQUEST_FAILED) {
        return 'workflow_failed';
    }

    if (responseType === RESPONSE_TYPE.REQUEST_STATUS) {
        return 'request_status';
    }

    if (responseType === RESPONSE_TYPE.EXECUTION_INSTRUCTIONS) {
        return 'execution_instructions';
    }

    if (responseType === RESPONSE_TYPE.EXECUTION_CLI) {
        return 'execution_cli';
    }

    if (responseType === RESPONSE_TYPE.EXECUTION_PR) {
        return 'execution_pr';
    }

    return 'workflow_in_progress';
}

//Function B2: Shape passed into CloudPilotChat (presentation only)
function buildChatHandlerPayload(options) {
    const requestState = options.requestState || {};
    const missingFields = copyStringArray(requestState.missing || []);
    const collectedFields = copyObject(requestState.collected || {});
    const askedForFields = copyObject(requestState.asked || {});

    return {
        conversationID: options.conversationID,
        currentUserMessage: options.currentUserMessage,
        actionEvent: options.actionEvent,
        actionDefinition: options.actionDefinition,
        actionReady: isRequestReady(missingFields),
        actionState: {
            pendingAction: requestState.pendingAction,
            status: requestState.status,
            executionMode: requestState.executionMode || null,
            missingFields: missingFields,
            collectedFields: collectedFields,
            askedForFields: askedForFields
        }
    };
}

//Function B3: Shallow copy of a plain object
function copyObject(source) {
    const copy = {};
    const keys = Object.keys(source || {});

    for (let i = 0; i < keys.length; i++) {
        const fieldName = keys[i];
        copy[fieldName] = source[fieldName];
    }

    return copy;
}

//Function B4: Copy an array of strings
function copyStringArray(source) {
    const copy = [];

    if (!Array.isArray(source)) {
        return copy;
    }

    for (let i = 0; i < source.length; i++) {
        copy.push(source[i]);
    }

    return copy;
}

//Function B5: Are all required fields collected?
function isRequestReady(missingFields) {
    if (!Array.isArray(missingFields)) {
        return true;
    }

    return missingFields.length === 0;
}

function getRequestStateFromContext(context) {
    if (context.requestOutcome && context.requestOutcome.request) {
        return context.requestOutcome.request;
    }

    if (context.requestState) {
        return context.requestState;
    }

    return {};
}

//Function B6: Route to responses/modes/ — options 1–3 (STEP 7 reply)
function buildUserRequestedModeResponse(responseType, chatType) {
    if (responseType === RESPONSE_TYPE.EXECUTION_INSTRUCTIONS) {
        return UserRequestedInstructionsFunctions.userRequestedInstructions(chatType);
    }

    if (responseType === RESPONSE_TYPE.EXECUTION_CLI) {
        return UserRequestedCLIFunctions.userRequestedCLI(chatType);
    }

    if (responseType === RESPONSE_TYPE.EXECUTION_PR) {
        return UserRequestedPRFunctions.userRequestedPR(chatType);
    }

    return null;
}

module.exports = {
    buildCloudPilotResponse
};
