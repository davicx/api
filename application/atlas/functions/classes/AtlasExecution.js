const actionState = require('../../state/ActionState');
const actionRegistry = require('../actions/actionRegistry');

class AtlasExecution {
    static async startNewAtlasExecution(payload) {
        console.log("ATLAS EXECUTION STARTED");

        actionState.setStatus(payload.conversationID, "running");

        const activeAction =
            payload.actionState.pendingAction ||
            payload.userRequest;

        const actionDefinition = actionRegistry[activeAction];

        if (!actionDefinition) {
            actionState.setStatus(payload.conversationID, "failed");

            return {
                success: false,
                cloudPilotMessage: "I could not find the requested Atlas action.",
                atlasResponse: null,
                error: "action_not_found"
            };
        }

        if (typeof actionDefinition.executionFunction !== "function") {
            actionState.setStatus(payload.conversationID, "failed");

            return {
                success: false,
                cloudPilotMessage: "This Atlas action is not executable yet.",
                atlasResponse: null,
                error: "execution_function_missing"
            };
        }

        const executionContext = {
            userMessage: payload.currentUserMessage,
            action: actionDefinition,
            state: {
                pendingAction: activeAction,
                status: "running",
                executionMode: payload.actionState.executionMode || null,
                missing: payload.actionState.missingFields || [],
                collected: payload.actionState.collectedFields || {}
            },
            conversationID: payload.conversationID
        };

        try {
            const executionResult =
                await actionDefinition.executionFunction(executionContext);

            if (executionResult.success) {
                actionState.setStatus(payload.conversationID, "completed");
                actionState.clear(payload.conversationID);
            } else {
                actionState.setStatus(payload.conversationID, "failed");
            }

            return executionResult;

        } catch (error) {
            actionState.setStatus(payload.conversationID, "failed");

            return {
                success: false,
                cloudPilotMessage:
                    "Something unexpected went wrong while running that action. Please try again in a moment.",
                atlasResponse: null,
                error: "execution_exception"
            };
        }
    }

    static async checkAtlasExecutionStatus(executionID) {
        console.log("COMING SOON: checkAtlasExecutionStatus");

        return {
            success: true,
            status: "coming_soon",
            executionID: executionID
        };
    }

    static async closeAtlasExecution(payload) {
        console.log("ATLAS EXECUTION COMPLETED");

        actionState.setStatus(payload.conversationID, "completed");
        actionState.clear(payload.conversationID);

        return {
            success: true,
            message: "Execution completed successfully.",
            atlasResponse: {
                status: "completed"
            },
            error: null
        };
    }
}

module.exports = AtlasExecution;
