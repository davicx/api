const actionMap = require('../../actionMap');
const CloudPilotMessage = require('../CloudPilotMessage');
const HistoryFunctions = require('../../history/functions/historyFunctions');
const OpenRequestsFunctions = require('../../questions/openRequests');
const { RESPONSE_TYPE } = require('../../requests/decisionTypes');
const InstructionsStrategy = require('../../executionModes/instructions/InstructionsLogic');
const CliStrategy = require('../../executionModes/cli/CliLogic');
const PrStrategy = require('../../executionModes/pr/PrLogic');

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

    const requestSeedErrorMessage = buildRequestSeedErrorMessage(requestOutcome);

    if (requestSeedErrorMessage) {
        return CloudPilotMessage.speakKnown({
            success: false,
            cloudPilotMessage: requestSeedErrorMessage,
            chatType: decision.chatType,
            atlasResponse: null,
            error: 'action_type_not_found'
        });
    }

    if (responseType === RESPONSE_TYPE.LIST_HISTORY) {
        const historyResponse = await HistoryFunctions.buildHistoryResponse(context.conversationID);

        return CloudPilotMessage.speakKnown({
            success: historyResponse.success,
            cloudPilotMessage: historyResponse.cloudPilotMessage,
            chatType: decision.chatType,
            atlasResponse: historyResponse.atlasResponse || null,
            error: historyResponse.error || null
        });
    }

    if (responseType === RESPONSE_TYPE.LIST_OPEN_REQUESTS) {
        const openRequestsResponse = OpenRequestsFunctions.buildOpenRequestsResponse(
            requestState
        );

        return CloudPilotMessage.speakKnown({
            success: openRequestsResponse.success,
            cloudPilotMessage: openRequestsResponse.cloudPilotMessage,
            chatType: decision.chatType,
            atlasResponse: openRequestsResponse.atlasResponse || null,
            error: openRequestsResponse.error || null
        });
    }

    const changeStrategyResponse = await buildChangeStrategyResponse(
        responseType,
        decision.chatType,
        requestState
    );

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

async function buildChangeStrategyResponse(responseType, chatType, requestState) {
    if (responseType === RESPONSE_TYPE.EXECUTION_INSTRUCTIONS) {
        const instructionFor =
            requestState && requestState.pendingAction
                ? requestState.pendingAction
                : null;

        return InstructionsStrategy.buildInstructionsStrategy(chatType, instructionFor);
    }

    if (responseType === RESPONSE_TYPE.EXECUTION_CLI) {
        const cliAction =
            requestState && requestState.pendingAction
                ? requestState.pendingAction
                : null;
        const cliCollected =
            requestState && requestState.collected
                ? requestState.collected
                : {};

        return CliStrategy.buildCliStrategy(chatType, cliAction, cliCollected);
    }

    if (responseType === RESPONSE_TYPE.EXECUTION_PR) {
        const prAction =
            requestState && requestState.pendingAction
                ? requestState.pendingAction
                : null;
        const prCollected =
            requestState && requestState.collected
                ? requestState.collected
                : {};

        return PrStrategy.buildPrStrategy(chatType, prAction, prCollected);
    }

    return null;
}

//Function B3: Friendly copy when cloudpilot_actions is missing a seeded action type
function buildRequestSeedErrorMessage(requestOutcome) {
    if (!requestOutcome || requestOutcome.success !== false || !requestOutcome.error) {
        return '';
    }

    const errors = Array.isArray(requestOutcome.error)
        ? requestOutcome.error
        : [requestOutcome.error];

    for (let i = 0; i < errors.length; i++) {
        const err = errors[i];
        const code = err && err.code ? String(err.code) : '';

        if (code === 'action_type_not_found') {
            const actionType =
                err.actionType != null && String(err.actionType).trim() !== ''
                    ? String(err.actionType).trim()
                    : 'that action';

            return (
                'I recognize ' +
                actionType +
                ', but it is not registered in the action catalog yet. ' +
                'Seed cloudpilot_actions for "' +
                actionType +
                '" and try again.'
            );
        }
    }

    return '';
}

module.exports = {
    conversation
};
