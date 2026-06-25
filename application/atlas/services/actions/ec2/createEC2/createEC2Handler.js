const atlasEC2Functions = require('../atlasEC2Functions');
const { buildOutcomeMessage, getFirstOutcomeCode, buildActionOutcomeContext } = require('../../../executions/outcomes/outcomeRegistry');

function buildTagsFromDefaults(defaults) {
    const raw = defaults && defaults.tags;
    if (!raw || typeof raw !== "object") {
        return {};
    }
    return { ...raw };
}

function buildUserProvidedTags(collected) {
    const raw = collected && collected.tags;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return {};
    }
    return { ...raw };
}

function mergeCreateEc2Tags(defaults, collected) {
    const workflowDefaultTags = buildTagsFromDefaults(defaults);
    const userProvidedTags = buildUserProvidedTags(collected);

    return {
        ...workflowDefaultTags,
        ...userProvidedTags
    };
}

//Action only (create_ec2). Speak routing: conversation/CloudPilotMessage.js
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
                cloudPilotMessage:
                    "Missing fields. Send:\nname: \"my-app-server\"\nregion: \"us-west-2\"\ninstance_type: \"t3.micro\"",
                error: "missing_collected_fields",
                atlasResponse: null
            };
        }

        const defaults = (action && action.defaults) ? action.defaults : {};
        const tags = mergeCreateEc2Tags(defaults, collected);

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
        console.log("RAW Atlas Response:");
        console.log(JSON.stringify(atlasResponseRaw, null, 2));
        console.log("_____________________________________");

        if (atlasResponseRaw && atlasResponseRaw.data) {
            console.log("_____________________________________");
            console.log("Atlas Response:");
            console.log(JSON.stringify(atlasResponseRaw.data, null, 2));
            console.log("_____________________________________");
        }

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

        const errCode = getFirstOutcomeCode(atlasResponseRaw);
        const outcomeContext = buildActionOutcomeContext(collected, atlasResponseRaw);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage(errCode, outcomeContext, 'create_ec2'),
            error: errCode || 'execution_failed',
            atlasResponse: null
        };

    } catch (error) {

        console.log("Atlas Create Error:");
        console.log(error);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage('atlas_unreachable', {}, 'create_ec2'),
            error: 'atlas_unreachable',
            atlasResponse: null
        };
    }
}

module.exports = createEC2Handler;
