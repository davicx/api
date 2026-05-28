const atlasEC2Functions = require('../atlasEC2Functions');

async function deleteEC2Handler(context) {

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

    try {

        const collected = context.state.collected;

        const region = collected.region;
        const instance_id = collected.instance_id;

        if (!region || !instance_id) {
            return {
                success: false,
                cloudPilotMessage: "I am missing region or instance ID to delete the instance.",
                error: "missing_collected_fields",
                atlasResponse: null
            };
        }

        const requestBody = {
            region: String(region).trim(),
            instance_id: String(instance_id).trim()
        };

        console.log("_____________________________________");
        console.log("Delete EC2 request body:");
        console.log(JSON.stringify(requestBody, null, 2));
        console.log("_____________________________________");

        const atlasResponseRaw = await atlasEC2Functions.deleteEC2(requestBody);

        console.log("_____________________________________");
        console.log("RAW Atlas Delete Response:");
        console.log(JSON.stringify(atlasResponseRaw, null, 2));
        console.log("_____________________________________");

        if (atlasResponseRaw && atlasResponseRaw.success === true && atlasResponseRaw.data && atlasResponseRaw.data.instance_id) {
            const instanceId = atlasResponseRaw.data.instance_id;
            const regionOut = atlasResponseRaw.data.region || String(region).trim();
            const stateOut = atlasResponseRaw.data.state || "terminating";
            return {
                success: true,
                cloudPilotMessage: "Termination requested for EC2 instance " + instanceId + " in " + regionOut + " (" + stateOut + ").",
                error: null,
                atlasResponse: atlasResponseRaw.data
            };
        }

        const errMsg = atlasResponseRaw && atlasResponseRaw.message ? String(atlasResponseRaw.message) : "Atlas did not delete the instance.";
        const errCode = atlasResponseRaw && atlasResponseRaw.errors && atlasResponseRaw.errors[0] ? String(atlasResponseRaw.errors[0]) : "";

        return {
            success: false,
            cloudPilotMessage: "I could not delete the EC2 instance.",
            error: errCode || errMsg,
            atlasResponse: null
        };

    } catch (error) {

        console.log("Atlas Delete Error:");
        console.log(error);

        return {
            success: false,
            cloudPilotMessage: "I could not delete the EC2 instance.",
            error: error.message,
            atlasResponse: null
        };
    }
}

module.exports = deleteEC2Handler;
