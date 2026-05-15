const atlasEC2Functions = require('../atlasEC2Functions');

function buildTagsFromDefaults(defaults) {
    const raw = defaults && defaults.tags;
    if (!raw || typeof raw !== "object") {
        return {};
    }
    return { ...raw };
}

async function createEC2Handler(context) {

    try {

        const collected = context.state.collected;
        const action = context.action;

        const name = collected.name;
        const region = collected.region;
        const instance_type = collected.instance_type;

        if (!name || !region || !instance_type) {
            return {
                success: false,
                cloudPilotMessage: "I am missing name, region, or instance type to create the instance.",
                error: "missing_collected_fields",
                atlasResponse: null
            };
        }

        const defaults = (action && action.defaults) ? action.defaults : {};
        const tags = buildTagsFromDefaults(defaults);

        const requestBody = {
            name: String(name).trim(),
            region: String(region).trim(),
            instance_type: String(instance_type).trim(),
            tags: tags
        };

        console.log("_____________________________________");
        console.log("Create EC2 request body:");
        console.log(JSON.stringify(requestBody, null, 2));
        console.log("_____________________________________");

        const atlasResponseRaw = await atlasEC2Functions.createEC2(requestBody);

        console.log("_____________________________________");
        console.log("RAW Atlas Create Response:");
        console.log(JSON.stringify(atlasResponseRaw, null, 2));
        console.log("_____________________________________");

        if (atlasResponseRaw && atlasResponseRaw.success === true && atlasResponseRaw.data && atlasResponseRaw.data.instance_id) {
            const instanceId = atlasResponseRaw.data.instance_id;
            const regionOut = atlasResponseRaw.data.region || String(region).trim();
            return {
                success: true,
                cloudPilotMessage: "Created EC2 instance " + instanceId + " in " + regionOut + ".",
                error: null,
                atlasResponse: atlasResponseRaw.data
            };
        }

        const errMsg = atlasResponseRaw && atlasResponseRaw.message ? String(atlasResponseRaw.message) : "Atlas did not create the instance.";
        const errCode = atlasResponseRaw && atlasResponseRaw.errors && atlasResponseRaw.errors[0] ? String(atlasResponseRaw.errors[0]) : "";

        return {
            success: false,
            cloudPilotMessage: "I could not create the EC2 instance.",
            error: errCode || errMsg,
            atlasResponse: null
        };

    } catch (error) {

        console.log("Atlas Create Error:");
        console.log(error);

        return {
            success: false,
            cloudPilotMessage: "I could not create the EC2 instance.",
            error: error.message,
            atlasResponse: null
        };
    }
}

module.exports = createEC2Handler;
