const atlasEC2Functions = require('../atlasEC2Functions');
const { buildOutcomeMessage, getFirstOutcomeCode, buildActionOutcomeContext } = require('../../../chat/chatOutcomeRegistry');

//Action only (delete_ec2). Mode routing: responses/modes/userRequested*.js
async function deleteEC2Handler(context) {

    try {

        const collected = context.state.collected;

        const region = collected.region;
        const instance_id = collected.instance_id;

        if (!region || !instance_id) {
            return {
                success: false,
                cloudPilotMessage:
                    "Missing fields. Send:\nregion: \"us-west-2\"\ninstance_id: \"i-0abc123\"",
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

        const errCode = getFirstOutcomeCode(atlasResponseRaw);
        const outcomeContext = buildActionOutcomeContext(collected, atlasResponseRaw);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage(errCode, outcomeContext, 'delete_ec2'),
            error: errCode || 'execution_failed',
            atlasResponse: null
        };

    } catch (error) {

        console.log("Atlas Delete Error:");
        console.log(error);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage('atlas_unreachable', {}, 'delete_ec2'),
            error: 'atlas_unreachable',
            atlasResponse: null
        };
    }
}

module.exports = deleteEC2Handler;
