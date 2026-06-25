const actionMap = require('../../actions/actionMap');
const CloudPilotMessage = require('../CloudPilotMessage');
const { RESPONSE_TYPE } = require('../../decision/decisionTypes');
const InstructionsStrategy = require('../../change/strategies/instructions');
const CliStrategy = require('../../change/strategies/cli');
const PrStrategy = require('../../change/strategies/pr');

/*
Request Conversation — speak (STEP 7 only)

Orchestrates speak routing. CloudPilotMessage produces outgoing words.
*/

//Function A1: Request Conversation speak entry
async function conversation(decision, context) {
    const executionOutcome = context.executionOutcome || null;

    if (executionOutcome && executionOutcome.ran && executionOutcome.cloudPilotMessage) {
        return CloudPilotMessage.speakKnown({
            success: Boolean(executionOutcome.success),
            cloudPilotMessage: executionOutcome.cloudPilotMessage,
            chatType: decision.chatType,
            atlasResponse: executionOutcome.atlasResponse || null,
            error: executionOutcome.error || null
        });
    }

    const requestState = getRequestStateFromContext(context);
    const requestOutcome = context.requestOutcome || {};
    const responseType = decision.response && decision.response.type ? decision.response.type : '';

    const changeStrategyResponse = buildChangeStrategyResponse(responseType, decision.chatType);

    if (changeStrategyResponse) {
        return CloudPilotMessage.speakKnown(changeStrategyResponse);
    }

    const actionEvent = mapResponseTypeToActionEvent(responseType, requestOutcome);
    const activeRequestAction = requestState.pendingAction;
    const actionDefinition = actionMap[activeRequestAction] || null;

    if (!actionDefinition) {
        return CloudPilotMessage.speakKnown({
            success: false,
            cloudPilotMessage: '',
            chatType: decision.chatType,
            atlasResponse: null,
            error: 'no_action_definition_for_response'
        });
    }

    const chatPayload = buildChatHandlerPayload({
        conversationID: context.conversationID,
        currentUserMessage: context.currentUserMessage,
        actionEvent: actionEvent,
        actionDefinition: actionDefinition,
        requestState: requestState
    });

    return CloudPilotMessage.speakRequest(chatPayload, decision.chatType);
}

//Function B1: TEMPORARY — map decision.response.type to template actionEvent
function mapResponseTypeToActionEvent(responseType, requestOutcome) {
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

//Function B2: Shape passed into CloudPilotMessage request templates
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

function copyObject(source) {
    const copy = {};
    const keys = Object.keys(source || {});

    for (let i = 0; i < keys.length; i++) {
        const fieldName = keys[i];
        copy[fieldName] = source[fieldName];
    }

    return copy;
}

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

function buildChangeStrategyResponse(responseType, chatType) {
    if (responseType === RESPONSE_TYPE.EXECUTION_INSTRUCTIONS) {
        return InstructionsStrategy.buildInstructionsStrategy(chatType);
    }

    if (responseType === RESPONSE_TYPE.EXECUTION_CLI) {
        return CliStrategy.buildCliStrategy(chatType);
    }

    if (responseType === RESPONSE_TYPE.EXECUTION_PR) {
        return PrStrategy.buildPrStrategy(chatType);
    }

    return null;
}

module.exports = {
    conversation
};
