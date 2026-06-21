const AtlasExecution = require('../executions/AtlasExecution');
const { buildMissingFieldsMessage } = require('./fieldPromptExamples');

//Function B3: Handle Cloud Pilot Chat
async function handleCloudPilotChat(payload) {

    console.log(" ");
    console.log("CLOUD_PILOT FUNCTION CALLED");
    console.log(JSON.stringify(payload, null, 2));
    console.log(" ");

    // STEP 1: New workflow started
    if (payload.actionEvent === "new_action") {

        return await cloudPilotRespondNewRequest(payload);
    }

    // STEP 2: User supplied new workflow fields
    if (payload.actionEvent === "missing_fields_given") {

        return await cloudPilotRespondMissingFieldsGiven(payload);
    }

    // STEP 3: Workflow is ready — ask how to deliver the action (Mode layer; destructive actions only)
    // User answers 1–4 → searchMessageForReply → handleExecutionModeSelection (STEP 4).
    if (payload.actionEvent === "awaiting_execution_mode") {

        return await cloudPilotRespondAwaitingExecutionMode(payload);
    }

    // STEP 4: Workflow is now ready and waiting for confirmation
    if (payload.actionEvent === "awaiting_confirmation") {

        return await cloudPilotRespondAwaitingConfirmation(payload);
    }

    // STEP 5: User confirmed execution — Atlas runs in STEP 6 (executeRequest), not here
    if (payload.actionEvent === "execution_requested") {

        return await AtlasExecution.startNewAtlasExecution(payload);
    }

    // STEP 5D: Execution started — words only until STEP 6 is wired
    if (payload.actionEvent === "execution_started") {

        return cloudPilotRespondExecutionStarted(payload);
    }

// FUTURE (modes 1–3): handled in buildCloudPilotResponse → responses/modes/userRequested*.js

    // STEP 5A: Workflow still collecting fields (repeat intent)
    if (payload.actionEvent === "workflow_in_progress") {

        return cloudPilotRespondWorkflowInProgress(payload);
    }

    // STEP 5B: Execution already running
    if (payload.actionEvent === "workflow_running") {

        return cloudPilotRespondWorkflowRunning(payload);
    }

    // STEP 5C: Previous execution failed
    if (payload.actionEvent === "workflow_failed") {

        return cloudPilotRespondWorkflowFailed(payload);
    }

    // STEP 5E: User asked about open request status / missing fields
    if (payload.actionEvent === "request_status") {

        return cloudPilotRespondRequestStatus(payload);
    }

    // STEP 6: Fallback
    if (payload.actionState && payload.actionState.pendingAction) {

        return cloudPilotRespondWorkflowInProgress(payload);
    }

    return {
        success: true,
        message:
            "I couldn't match that to the current workflow step. " +
            "Please continue with the open action or start a new one.",
        atlasResponse: null,
        error: "unknown_workflow_event"
    };
}

async function cloudPilotRespondNewRequest(payload) {
    const actionDefinition = payload.actionDefinition;

    const missingFields = payload.actionState.missingFields || [];

    const missingFieldsMessage = buildMissingFieldsMessage(actionDefinition, missingFields);

    const message =
        missingFieldsMessage || actionDefinition.messages.started;

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

    let acknowledgement = "Great, I updated the workflow.";

    if (latestField) {
        acknowledgement = "Great, I now have the " + latestField.replaceAll("_", " ") + ".";
    }

    // Still missing fields
    if (missingFields.length > 0) {
        const missingFieldsMessage = buildMissingFieldsMessage(actionDefinition, missingFields);

        acknowledgement += '\n\n' + missingFieldsMessage;
    }

    return {
        success: true,
        message: acknowledgement,
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondAwaitingExecutionMode(payload) {

    return {
        success: true,
        message:
            "Everything is ready.\n\n" +
            "How would you like me to perform this action?\n\n" +
            "1. Instructions\n" +
            "2. CLI Commands\n" +
            "3. Pull Request\n" +
            "4. Cloud Pilot Does It",
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondAwaitingConfirmation(payload) {
    const actionDefinition = payload.actionDefinition;
    const readyMessage =
        actionDefinition.messages.ready ||
        "Everything is ready.";

    const executionMode = payload.actionState && payload.actionState.executionMode;

    let message = readyMessage + "\n\nWould you like me to execute this action?";

    if (executionMode) {
        message =
            readyMessage +
            "\n\nExecution mode: " +
            executionMode +
            "\n\nWould you like me to execute this action?";
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
    const actionLabel = actionDefinition.actionLabel || actionDefinition.type || "workflow";
    const missingFields = payload.actionState.missingFields || [];
    const missingFieldsMessage = buildMissingFieldsMessage(actionDefinition, missingFields);

    let message = "You already have a " + actionLabel + " workflow in progress.";

    if (missingFieldsMessage) {
        message += '\n\n' + missingFieldsMessage;
    } else {
        message += " Please continue where we left off.";
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
    const actionLabel = actionDefinition.actionLabel || actionDefinition.type || "action";

    return {
        success: true,
        message:
            "Your " +
            actionLabel +
            " action is already running. I will let you know when it finishes.",
        atlasResponse: null,
        error: null
    };
}

async function cloudPilotRespondWorkflowFailed(payload) {
    const actionDefinition = payload.actionDefinition;
    const actionLabel = actionDefinition.actionLabel || actionDefinition.type || "action";
    const failedMessage =
        actionDefinition.messages && actionDefinition.messages.failed
            ? actionDefinition.messages.failed
            : "That action did not complete.";

    return {
        success: true,
        message:
            failedMessage +
            " Your " +
            actionLabel +
            " workflow did not finish. Say the action again if you want to start over.",
        atlasResponse: null,
        error: "workflow_failed"
    };
}

async function cloudPilotRespondRequestStatus(payload) {
    const actionDefinition = payload.actionDefinition;
    const actionLabel = actionDefinition.actionLabel || actionDefinition.type || "request";
    const missingFields = payload.actionState.missingFields || [];
    const missingFieldsMessage = buildMissingFieldsMessage(actionDefinition, missingFields);
    const ready = payload.actionReady === true;

    let message = "Your " + actionLabel + " request is open.";

    if (missingFieldsMessage) {
        message += '\n\n' + missingFieldsMessage;
    } else if (ready) {
        const readyMessage =
            actionDefinition.messages && actionDefinition.messages.ready
                ? actionDefinition.messages.ready
                : "Everything is ready.";
        message += " " + readyMessage;
    } else {
        message += " Please continue when you are ready.";
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
    const collectedFields = payload.actionState && payload.actionState.collectedFields
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
    handleCloudPilotChat
};
