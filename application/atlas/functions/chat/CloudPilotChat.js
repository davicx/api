const AtlasExecution = require('../classes/AtlasExecution');

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

    // STEP 3: Workflow is ready — ask how to perform the action (destructive tier)
    if (payload.actionEvent === "awaiting_execution_mode") {

        return await cloudPilotRespondAwaitingExecutionMode(payload);
    }

    // STEP 4: Workflow is now ready and waiting for confirmation
    if (payload.actionEvent === "awaiting_confirmation") {

        return await cloudPilotRespondAwaitingConfirmation(payload);
    }

    // STEP 5: User confirmed execution
    if (payload.actionEvent === "execution_requested") {

        return await AtlasExecution.startNewAtlasExecution(payload);
    }

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

    const missingFieldsMessage = buildMissingFieldsMessage(actionDefinition, missingFields );

    return {
        success: true,
        message: actionDefinition.messages.started + " " + missingFieldsMessage,
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

        acknowledgement += " " + missingFieldsMessage;
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
            "4. Automatic",
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
        message += " " + missingFieldsMessage;
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

function buildMissingFieldsMessage(actionDefinition, missingFields) {
    const questions = [];

    const registryMessages = actionDefinition.messages && actionDefinition.messages.missingFields ? actionDefinition.messages.missingFields : {};

    for (const fieldName of missingFields) {
        const question = registryMessages[fieldName];

        if (question) {
            questions.push(question);
        }
    }

    if (questions.length === 0) {
        return "";
    }

    return (
        questions.join(" ") +
        '\n\nPlease use this format:\nfield: "value"'
    );
}

module.exports = {
    handleCloudPilotChat
};
