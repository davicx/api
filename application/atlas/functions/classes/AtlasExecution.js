const actionState = require('../../state/ActionState');

class AtlasExecution {
    static async startNewAtlasExecution(payload) {
        console.log("ATLAS EXECUTION STARTED");

        actionState.setStatus(payload.conversationID, "running");

        await new Promise(resolve => setTimeout(resolve, 3000));

        return await AtlasExecution.closeAtlasExecution(payload);
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
