const AtlasExecution = require('../../executions/AtlasExecution');
const {
    buildMissingFieldsMessage,
    buildOptionalRequestNamePrompt
} = require('./fieldPromptExamples');

/*
Request template copy — deterministic workflow UX (missing fields, modes, confirmation, status).
Called by CloudPilotMessage for Request Conversation speak.
*/

async function buildRequestTemplateMessage(payload) {
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
    const message = missingFieldsMessage || actionDefinition.messages.started;

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

    if (requestNamePrompt) {
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

    let message = readyMessage + '\n\nWould you like me to execute this action?';

    if (executionMode) {
        message =
            readyMessage +
            '\n\nExecution mode: ' +
            executionMode +
            '\n\nWould you like me to execute this action?';
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
    const missingFields = payload.actionState.missingFields || [];
    const collectedFields = payload.actionState.collectedFields || {};
    const missingFieldsMessage = buildMissingFieldsMessage(
        actionDefinition,
        missingFields,
        collectedFields
    );

    let message = 'You already have a ' + actionLabel + ' workflow in progress.';

    if (missingFieldsMessage) {
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

module.exports = {
    buildRequestTemplateMessage
};
