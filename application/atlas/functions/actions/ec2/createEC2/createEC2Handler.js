const atlasEC2Functions = require('../atlasEC2Functions');
const { buildOutcomeMessage, getFirstOutcomeCode, buildActionOutcomeContext } = require('../../../outcome/outcomeRegistry');

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

async function createEC2Handler(context) {

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
