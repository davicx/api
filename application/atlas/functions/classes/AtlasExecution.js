const actionState = require('../../state/ActionState');
const actionRegistry = require('../actions/actionRegistry');
const Actions = require('./Actions');

class AtlasExecution {
    static async startNewAtlasExecution(payload) {
        console.log("ATLAS EXECUTION STARTED");

        actionState.setStatus(payload.conversationID, "running");

        await syncOpenWorkflowStatus(payload.conversationID, "running");

        const activeAction =
            payload.actionState.pendingAction ||
            payload.userRequest;

        const actionDefinition = actionRegistry[activeAction];

        if (!actionDefinition) {
            actionState.setStatus(payload.conversationID, "failed");

            await finishOpenWorkflowInDatabase(payload.conversationID, "failed", "action_not_found");

            return {
                success: false,
                cloudPilotMessage: "I could not find the requested Atlas action.",
                atlasResponse: null,
                error: "action_not_found"
            };
        }

        if (typeof actionDefinition.executionFunction !== "function") {
            actionState.setStatus(payload.conversationID, "failed");

            await finishOpenWorkflowInDatabase(payload.conversationID, "failed", "execution_function_missing");

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

                await finishOpenWorkflowInDatabase(payload.conversationID, "completed", "success");
            } else {
                actionState.setStatus(payload.conversationID, "failed");

                const failOutcomeCode =
                    executionResult.error != null && String(executionResult.error).trim() !== ""
                        ? String(executionResult.error)
                        : "execution_failed";

                await finishOpenWorkflowInDatabase(payload.conversationID, "failed", failOutcomeCode);
            }

            return executionResult;

        } catch (error) {
            actionState.setStatus(payload.conversationID, "failed");

            await finishOpenWorkflowInDatabase(payload.conversationID, "failed", "execution_exception");

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

//FUNCTIONS B: Workflow DB sync (write-only — orchestration still uses ActionState)
//Function B1: Update open row status while run is in progress
async function syncOpenWorkflowStatus(conversationID, status) {
    const openResult = await Actions.getOpenActionForConversation(conversationID);

    if (!openResult.success || !openResult.action) {
        return;
    }

    await Actions.updateAction(openResult.action.workflowId, {
        status: status
    });
}

//Function B2: Close open row and log final database state
async function finishOpenWorkflowInDatabase(conversationID, status, outcomeCode) {
    const openResult = await Actions.getOpenActionForConversation(conversationID);

    if (!openResult.success || !openResult.action) {
        console.log("DATABASE WORKFLOW: No open row to finish for conversation", conversationID);
        return;
    }

    const finishResult = await Actions.finishAction(
        openResult.action.workflowId,
        status,
        outcomeCode
    );

    console.log(" ");
    console.log("DATABASE WORKFLOW ROW (after user confirmed / run finished):");
    console.log(JSON.stringify(finishResult.action, null, 2));
    console.log(" ");
}

module.exports = AtlasExecution;
