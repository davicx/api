const openAIFunctions = require('../../../openAI/openAIFunctions');

async function toggleEC2Handler(context) {

    const executionMode = context.state.executionMode;

    if (executionMode === "instructions") {
        console.log("EXECUTION MODE: Instructions");
        return {
            success: true,
            cloudPilotMessage: "Instructions mode is not implemented yet. I would provide step-by-step guidance here.",
            error: null,
            atlasResponse: null
        };
    }

    if (executionMode === "cli") {
        console.log("EXECUTION MODE: CLI");
        return {
            success: true,
            cloudPilotMessage: "CLI mode is not implemented yet. I would provide CLI commands here.",
            error: null,
            atlasResponse: null
        };
    }

    if (executionMode === "pr") {
        console.log("EXECUTION MODE: Pull Request");
        return {
            success: true,
            cloudPilotMessage: "Pull request mode is not implemented yet. I would open a PR for this change here.",
            error: null,
            atlasResponse: null
        };
    }

    console.log("EXECUTION MODE: Automatic");

    const chatResult = await openAIFunctions.sendChatWithAction(context.userMessage, context.action);

    if (!chatResult.success) {
        return {
            success: false,
            cloudPilotMessage: chatResult.message || 'ChatGPT request failed',
            error: chatResult.error || null,
            atlasResponse: null
        };
    }

    const cloudPilotMessage =
        (chatResult.data != null && chatResult.data !== '')
            ? chatResult.data
            : (chatResult.message || '');

    return {
        success: true,
        cloudPilotMessage: cloudPilotMessage,
        error: null,
        atlasResponse: null
    };
}

module.exports = toggleEC2Handler;
