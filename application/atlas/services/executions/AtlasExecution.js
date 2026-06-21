const actionMap = require('../actions/actionMap');
const Request = require('../requests/classes/Request');

class AtlasExecution {
    static async startNewAtlasExecution(payload) {
        console.log("ATLAS EXECUTION STARTED");

        await syncOpenActionStatus(payload.conversationID, "running");

        const activeAction =
            payload.actionState.pendingAction ||
            payload.userRequest;

        const actionDefinition = actionMap[activeAction];

        if (!actionDefinition) {
            await finishOpenActionInDatabase(payload.conversationID, "failed", "action_not_found");

            return {
                success: false,
                cloudPilotMessage: "I could not find the requested Atlas action.",
                atlasResponse: null,
                error: "action_not_found"
            };
        }

        if (typeof actionDefinition.executionFunction !== "function") {
            await finishOpenActionInDatabase(payload.conversationID, "failed", "execution_function_missing");

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
                await finishOpenActionInDatabase(payload.conversationID, "completed", "success");
            } else {
                const failOutcomeCode =
                    executionResult.error != null && String(executionResult.error).trim() !== ""
                        ? String(executionResult.error)
                        : "execution_failed";

                await finishOpenActionInDatabase(payload.conversationID, "failed", failOutcomeCode);
            }

            return executionResult;

        } catch (error) {
            await finishOpenActionInDatabase(payload.conversationID, "failed", "execution_exception");

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

        await finishOpenActionInDatabase(payload.conversationID, "completed", "success");

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

//FUNCTIONS B: Open action row in database
//Function B1: Update open row status while run is in progress
async function syncOpenActionStatus(conversationID, status) {
    const openResult = await Request.getOpenActionForConversation(conversationID);

    if (!openResult.success || !openResult.action) {
        return;
    }

    await Request.updateAction(openResult.action.workflowId, {
        status: status
    });
}

//Function B2: Close open row and log final database state
async function finishOpenActionInDatabase(conversationID, status, outcomeCode) {
    const openResult = await Request.getOpenActionForConversation(conversationID);

    if (!openResult.success || !openResult.action) {
        console.log("DATABASE ACTION: No open row to finish for conversation", conversationID);
        return;
    }

    const finishResult = await Request.finishAction(
        openResult.action.workflowId,
        status,
        outcomeCode
    );

    console.log(" ");
    console.log("DATABASE ACTION ROW (after user confirmed / run finished):");
    console.log(JSON.stringify(finishResult.action, null, 2));
    console.log(" ");
}

module.exports = AtlasExecution;
