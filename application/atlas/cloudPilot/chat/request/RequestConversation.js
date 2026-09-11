const actionMap = require('../../masterCloudPilotCapabilities');
const CloudPilotMessage = require('../CloudPilotMessage');
const HistoryFunctions = require('../../history/functions/historyFunctions');
const OpenRequestsFunctions = require('../../questions/openRequests');
const Ec2ComputeCostFunctions = require('../../questions/ec2ComputeCost');
const { RESPONSE_TYPE } = require('../../requests/decisionTypes');
const InstructionsStrategy = require('../../executionModes/instructions/InstructionsLogic');
const CliStrategy = require('../../executionModes/cli/CliLogic');
const PrStrategy = require('../../executionModes/pr/PrLogic');
const CreateEC2Guidance = require('../../actions/createEC2/createEC2Guidance');
const EstimatePricingFunctions = require('../../pricing/estimatePricing');

/*
Request Conversation — speak (STEP 7 only)

Orchestrates speak routing. CloudPilotMessage produces outgoing words.
*/

//Function A1: Request Conversation speak entry
async function conversation(decision, context) {
    const executionOutcome = context.executionOutcome || null;
    const responseTypeEarly =
        decision.response && decision.response.type ? decision.response.type : '';
    const executionMessage =
        executionOutcome && executionOutcome.cloudPilotMessage
            ? String(executionOutcome.cloudPilotMessage).trim()
            : '';

    if (executionOutcome && executionOutcome.ran && executionMessage) {
        const requestState = getRequestStateFromContext(context);
        let cloudPilotMessage = executionMessage;

        if (
            executionOutcome.success === true &&
            requestState.pendingAction === 'create_ec2'
        ) {
            const collectedFields = requestState.collected || {};
            const estimatedComputeCost = await buildCreateEc2EstimatedCostSpeak(collectedFields);

            cloudPilotMessage = CreateEC2Guidance.buildSuccessMessage({
                atlasResponse: executionOutcome.atlasResponse || {},
                collectedFields: collectedFields,
                estimatedComputeCost: estimatedComputeCost
            });
        }

        if (
            executionOutcome.success === true &&
            requestState.pendingAction === 'pause_ec2' &&
            !(executionOutcome.atlasResponse && executionOutcome.atlasResponse.noop === true)
        ) {
            const pauseSavingsLine = await buildPauseEc2SavingsSpeak(
                requestState.collected || {}
            );

            if (pauseSavingsLine) {
                cloudPilotMessage =
                    String(cloudPilotMessage || '').trim() + '\n\n' + pauseSavingsLine;
            }
        }

        return CloudPilotMessage.prepareKnownMessageReply({
            success: Boolean(executionOutcome.success),
            cloudPilotMessage: cloudPilotMessage,
            chatType: decision.chatType,
            atlasResponse: executionOutcome.atlasResponse || null,
            error: executionOutcome.error || null
        });
    }

    // EXECUTION_STARTED is internal permission for STEP 6 — never an intermediate chat beat.
    // Sync path: confirm → store running → execute → findings/error in this same HTTP response.
    if (responseTypeEarly === RESPONSE_TYPE.EXECUTION_STARTED) {
        return CloudPilotMessage.prepareKnownMessageReply({
            success: false,
            cloudPilotMessage:
                'I could not complete that action in this turn. Please try again, or say cancel and start over.',
            chatType: decision.chatType,
            atlasResponse:
                executionOutcome && executionOutcome.atlasResponse
                    ? executionOutcome.atlasResponse
                    : null,
            error:
                (executionOutcome && executionOutcome.error) ||
                'execution_started_without_result'
        });
    }

    const requestState = getRequestStateFromContext(context);
    const requestOutcome = context.requestOutcome || {};
    const responseType = responseTypeEarly;

    const requestSeedErrorMessage = buildRequestSeedErrorMessage(requestOutcome);

    if (requestSeedErrorMessage) {
        return CloudPilotMessage.prepareKnownMessageReply({
            success: false,
            cloudPilotMessage: requestSeedErrorMessage,
            chatType: decision.chatType,
            atlasResponse: null,
            error: 'action_type_not_found'
        });
    }

    if (responseType === RESPONSE_TYPE.LIST_HISTORY) {
        const historyResponse = await HistoryFunctions.buildHistoryResponse(context.conversationID);

        return CloudPilotMessage.prepareKnownMessageReply({
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

        return CloudPilotMessage.prepareKnownMessageReply({
            success: openRequestsResponse.success,
            cloudPilotMessage: openRequestsResponse.cloudPilotMessage,
            chatType: decision.chatType,
            atlasResponse: openRequestsResponse.atlasResponse || null,
            error: openRequestsResponse.error || null
        });
    }

    if (responseType === RESPONSE_TYPE.EC2_COMPUTE_COST) {
        const computeCostResponse = await Ec2ComputeCostFunctions.buildEc2ComputeCostResponse({
            values:
                decision.response && decision.response.values
                    ? decision.response.values
                    : {},
            collected: requestState.collected || {}
        });

        return CloudPilotMessage.prepareKnownMessageReply({
            success: computeCostResponse.success,
            cloudPilotMessage: computeCostResponse.cloudPilotMessage,
            chatType: decision.chatType,
            atlasResponse: computeCostResponse.atlasResponse || null,
            error: computeCostResponse.error || null
        });
    }

    if (responseType === RESPONSE_TYPE.RESOURCE_NOT_FOUND) {
        const collected = requestState.collected || {};
        const region = String(collected.region || '').trim() || 'that region';
        const instanceId = String(collected.instance_id || '').trim() || 'that instance';

        return CloudPilotMessage.prepareKnownMessageReply({
            success: true,
            cloudPilotMessage:
                'I couldn\'t find EC2 instance ' + instanceId + ' in ' + region + '.\n\n' +
                'Would you like me to scan EC2 and show you the instances you have?',
            chatType: decision.chatType,
            atlasResponse: decision.response && decision.response.verifyResource
                ? decision.response.verifyResource.atlasResponse
                : null,
            error: null
        });
    }

    if (responseType === RESPONSE_TYPE.RESOURCE_SCAN_DECLINED) {
        return CloudPilotMessage.prepareKnownMessageReply({
            success: true,
            cloudPilotMessage: 'Okay — I will not scan EC2 for that request.',
            chatType: decision.chatType,
            atlasResponse: null,
            error: null
        });
    }

    if (responseType === RESPONSE_TYPE.RESOURCE_VERIFY_FAILED) {
        const verification = decision.response && decision.response.verifyResource
            ? decision.response.verifyResource
            : null;
        const errorMessage =
            (verification && verification.message) ||
            'Could not verify that EC2 instance with Atlas.';

        return CloudPilotMessage.prepareKnownMessageReply({
            success: false,
            cloudPilotMessage: errorMessage,
            chatType: decision.chatType,
            atlasResponse: verification && verification.atlasResponse
                ? verification.atlasResponse
                : null,
            error: 'resource_verify_failed'
        });
    }

    const changeStrategyResponse = await buildChangeStrategyResponse(
        responseType,
        decision.chatType,
        requestState
    );

    if (changeStrategyResponse) {
        return CloudPilotMessage.prepareKnownMessageReply(changeStrategyResponse);
    }

    const actionEvent = mapResponseTypeToActionEvent(responseType, requestOutcome);
    const activeRequestAction = requestState.pendingAction;
    const actionDefinition = actionMap[activeRequestAction] || null;

    if (!actionDefinition) {
        return CloudPilotMessage.prepareKnownMessageReply({
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

    return CloudPilotMessage.prepareRequestMessageReply(chatPayload, decision.chatType);
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

async function buildCreateEc2EstimatedCostSpeak(collectedFields) {
    const collected = collectedFields || {};
    const region = String(collected.region || '').trim();
    const instanceType = String(collected.instance_type || '').trim();

    if (!region || !instanceType) {
        return null;
    }

    const estimate = await EstimatePricingFunctions.estimateEc2OnDemand(region, instanceType);

    return EstimatePricingFunctions.formatEstimateSpeakLine(estimate);
}

async function buildPauseEc2SavingsSpeak(collectedFields) {
    const collected = collectedFields || {};
    const region = String(collected.region || '').trim();
    const instanceType = String(collected.instance_type || '').trim();

    if (!region || !instanceType) {
        return null;
    }

    const estimate = await EstimatePricingFunctions.estimateEc2OnDemand(region, instanceType);
    const savings = EstimatePricingFunctions.estimatePauseSavings(estimate);

    return EstimatePricingFunctions.formatPauseSavingsSpeakLine(savings);
}

module.exports = {
    conversation
};
