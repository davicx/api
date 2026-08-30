const AtlasExecution = require('../../execution/AtlasExecution');
const CreateEC2Guidance = require('../../actions/createEC2/createEC2Guidance');
const EstimatePricingFunctions = require('../../pricing/estimatePricing');
const {
    buildMissingFieldsMessage,
    buildOptionalRequestNamePrompt
} = require('./fieldPromptExamples');

/*
Request Message Reply — deterministic workflow UX (missing fields, modes, confirmation, status).
Called by CloudPilotMessage for Request Conversation.
*/

async function getRequestMessageReply(payload) {
    console.log(' ');
    console.log('CLOUD_PILOT MESSAGE — request templates');
    console.log(JSON.stringify(payload, null, 2));
    console.log(' ');

    if (payload.actionEvent === 'new_action') {
        return await cloudPilotRespondNewRequest(payload);
    }

    if (payload.actionEvent === 'missing_fields_given') {
        return await cloudPilotRespondMissingFieldsGiven(payload);
    }

    if (payload.actionEvent === 'awaiting_execution_mode') {
        return await cloudPilotRespondAwaitingExecutionMode(payload);
    }

    if (payload.actionEvent === 'awaiting_confirmation') {
        return await cloudPilotRespondAwaitingConfirmation(payload);
    }

    if (payload.actionEvent === 'execution_requested') {
        return await AtlasExecution.startNewAtlasExecution(payload);
    }

    if (payload.actionEvent === 'execution_started') {
        return cloudPilotRespondExecutionStarted(payload);
    }

    if (payload.actionEvent === 'workflow_in_progress') {
        return cloudPilotRespondWorkflowInProgress(payload);
    }

    if (payload.actionEvent === 'workflow_running') {
        return cloudPilotRespondWorkflowRunning(payload);
    }

    if (payload.actionEvent === 'workflow_failed') {
        return cloudPilotRespondWorkflowFailed(payload);
    }

    if (payload.actionEvent === 'request_status') {
        return cloudPilotRespondRequestStatus(payload);
    }

    if (payload.actionState && payload.actionState.pendingAction) {
        return cloudPilotRespondWorkflowInProgress(payload);
    }

    return {
        success: true,
        message:
            "I couldn't match that to the current workflow step. " +
            'Please continue with the open action or start a new one.',
        atlasResponse: null,
        error: 'unknown_workflow_event'
    };
}

async function cloudPilotRespondNewRequest(payload) {
    const actionDefinition = payload.actionDefinition;
    const missingFields = payload.actionState.missingFields || [];
    const collectedFields = payload.actionState.collectedFields || {};
    const missingFieldsMessage = buildMissingFieldsMessage(
        actionDefinition,
        missingFields,
        collectedFields
    );

    let message = missingFieldsMessage || actionDefinition.messages.started;

    if (actionDefinition && actionDefinition.type === 'create_ec2') {
        message = CreateEC2Guidance.buildStartedMessage({
            missingFieldsMessage: missingFieldsMessage,
            collectedFields: collectedFields
        });
    }

    return {
        success: true,
        message: message,
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondMissingFieldsGiven(payload) {
    const actionDefinition = payload.actionDefinition;
    const missingFields = payload.actionState.missingFields || [];
    const collectedFields = payload.actionState.collectedFields || {};
    const collectedFieldNames = Object.keys(collectedFields);
    const latestField = collectedFieldNames[collectedFieldNames.length - 1];

    let acknowledgement = 'Great, I updated the workflow.';

    if (latestField === 'request_name') {
        acknowledgement =
            'Got it — I will call this request "' + String(collectedFields.request_name).trim() + '".';
    } else if (latestField) {
        acknowledgement = 'Great, I now have the ' + latestField.replaceAll('_', ' ') + '.';
    }

    if (missingFields.length > 0) {
        const missingFieldsMessage = buildMissingFieldsMessage(
            actionDefinition,
            missingFields,
            collectedFields
        );
        acknowledgement += '\n\n' + missingFieldsMessage;
    } else {
        const requestNamePrompt = buildOptionalRequestNamePrompt(actionDefinition, collectedFields);

        if (requestNamePrompt) {
            acknowledgement += '\n\n' + requestNamePrompt;
        }
    }

    return {
        success: true,
        message: acknowledgement,
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondAwaitingExecutionMode(payload) {
    const actionDefinition = payload.actionDefinition;
    const collectedFields = payload.actionState.collectedFields || {};
    const requestNamePrompt = buildOptionalRequestNamePrompt(actionDefinition, collectedFields);

    let message =
        'Everything is ready.\n\n' +
        'How would you like me to perform this action?\n\n' +
        '1. Instructions\n' +
        '2. CLI Commands\n' +
        '3. Pull Request\n' +
        '4. Cloud Pilot Does It';

    if (actionDefinition && actionDefinition.type === 'create_ec2') {
        const estimatedComputeCost = await buildCreateEc2EstimatedCostSpeak(collectedFields);

        message = CreateEC2Guidance.buildReadyReviewMessage({
            collectedFields: collectedFields,
            estimatedComputeCost: estimatedComputeCost,
            requestNamePrompt: requestNamePrompt
        });
    } else if (requestNamePrompt) {
        message += '\n\n' + requestNamePrompt;
    }

    return {
        success: true,
        message: message,
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondAwaitingConfirmation(payload) {
    const actionDefinition = payload.actionDefinition;
    const readyMessage = actionDefinition.messages.ready || 'Everything is ready.';
    const executionMode = payload.actionState && payload.actionState.executionMode;
    const collectedFields =
        payload.actionState && payload.actionState.collectedFields
            ? payload.actionState.collectedFields
            : {};
    const actionType =
        actionDefinition && actionDefinition.type ? String(actionDefinition.type) : '';

    let message = readyMessage + '\n\n' + buildConfirmOrCancelLine(actionType);

    if (actionDefinition && actionDefinition.type === 'create_ec2') {
        const estimatedComputeCost = await buildCreateEc2EstimatedCostSpeak(collectedFields);

        message = CreateEC2Guidance.buildConfirmMessage({
            collectedFields: collectedFields,
            executionMode: executionMode,
            estimatedComputeCost: estimatedComputeCost
        });
    } else if (actionDefinition && actionDefinition.type === 'pause_ec2') {
        message = await buildPauseEc2ConfirmMessage({
            readyMessage: readyMessage,
            executionMode: executionMode,
            collectedFields: collectedFields,
            actionType: actionType
        });
    } else if (executionMode) {
        message =
            readyMessage +
            '\n\nExecution mode: ' +
            executionMode +
            '\n\n' +
            buildConfirmOrCancelLine(actionType);
    }

    return {
        success: true,
        message: message,
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondWorkflowInProgress(payload) {
    const actionDefinition = payload.actionDefinition;
    const actionLabel = actionDefinition.actionLabel || actionDefinition.type || 'workflow';
    const actionType =
        actionDefinition && actionDefinition.type ? String(actionDefinition.type) : '';
    const missingFields = payload.actionState.missingFields || [];
    const collectedFields = payload.actionState.collectedFields || {};
    const missingFieldsMessage = buildMissingFieldsMessage(
        actionDefinition,
        missingFields,
        collectedFields
    );
    const actionReady = payload.actionReady === true;

    let message = 'You already have a ' + actionLabel + ' workflow in progress.';

    if (missingFields.length > 0 && missingFieldsMessage) {
        message += '\n\n' + missingFieldsMessage;
    } else if (actionReady) {
        message += '\n\n' + buildConfirmOrCancelLine(actionType);
    } else if (missingFieldsMessage) {
        message += '\n\n' + missingFieldsMessage;
    } else {
        message += ' Please continue where we left off.';
    }

    return {
        success: true,
        message: message,
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondWorkflowRunning(payload) {
    const actionDefinition = payload.actionDefinition;
    const actionLabel = actionDefinition.actionLabel || actionDefinition.type || 'action';

    return {
        success: true,
        message:
            'Your ' +
            actionLabel +
            ' action is already running. I will let you know when it finishes.',
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondWorkflowFailed(payload) {
    const actionDefinition = payload.actionDefinition;
    const actionLabel = actionDefinition.actionLabel || actionDefinition.type || 'action';
    const failedMessage =
        actionDefinition.messages && actionDefinition.messages.failed
            ? actionDefinition.messages.failed
            : 'That action did not complete.';

    return {
        success: true,
        message:
            failedMessage +
            ' Your ' +
            actionLabel +
            ' workflow did not finish. Say the action again if you want to start over.',
        atlasResponse: null,
        error: 'workflow_failed'
    };
}

async function cloudPilotRespondRequestStatus(payload) {
    const actionDefinition = payload.actionDefinition;
    const actionLabel = actionDefinition.actionLabel || actionDefinition.type || 'request';
    const missingFields = payload.actionState.missingFields || [];
    const collectedFields = payload.actionState.collectedFields || {};
    const missingFieldsMessage = buildMissingFieldsMessage(
        actionDefinition,
        missingFields,
        collectedFields
    );
    const ready = payload.actionReady === true;

    let message = 'Your ' + actionLabel + ' request is open.';

    if (missingFieldsMessage) {
        message += '\n\n' + missingFieldsMessage;
    } else if (ready) {
        const readyMessage =
            actionDefinition.messages && actionDefinition.messages.ready
                ? actionDefinition.messages.ready
                : 'Everything is ready.';
        message += ' ' + readyMessage;
    } else {
        message += ' Please continue when you are ready.';
    }

    return {
        success: true,
        message: message,
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondExecutionStarted(payload) {
    const actionDefinition = payload.actionDefinition;
    const actionLabel = actionDefinition.actionLabel || actionDefinition.type || 'action';
    const collectedFields =
        payload.actionState && payload.actionState.collectedFields
            ? payload.actionState.collectedFields
            : {};
    let regionText = '';

    if (collectedFields.region) {
        regionText = ' in ' + String(collectedFields.region);
    }

    return {
        success: true,
        message:
            'Starting your ' +
            actionLabel +
            regionText +
            '. I will update you when it finishes.',
        atlasResponse: null,
        error: null
    };
}

function buildConfirmOrCancelLine(actionType) {
    if (actionType === 'scan_ec2') {
        return 'Confirm to run now, or cancel the scan.';
    }

    if (actionType === 'scan_s3') {
        return 'Confirm to run now, or cancel the scan.';
    }

    return 'Confirm to run now, or cancel.';
}

function buildContinueOrCancelLine(actionType) {
    if (actionType === 'scan_ec2' || actionType === 'scan_s3') {
        return 'Reply with the value above to continue, or cancel the scan.';
    }

    return 'Reply with the value above to continue, or cancel.';
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

async function buildPauseEc2ConfirmMessage(options) {
    const settings = options || {};
    const readyMessage =
        settings.readyMessage || 'Everything is ready to pause the EC2 instance.';
    const executionMode = settings.executionMode
        ? String(settings.executionMode).trim()
        : '';
    const actionType = settings.actionType || 'pause_ec2';
    const savingsLine = await buildPauseEc2SavingsSpeak(settings.collectedFields || {});

    let message = readyMessage;

    if (executionMode) {
        message += '\n\nExecution mode: ' + executionMode;
    }

    if (savingsLine) {
        message += '\n\n' + savingsLine;
    }

    message += '\n\n' + buildConfirmOrCancelLine(actionType);

    return message;
}

module.exports = {
    getRequestMessageReply
};
