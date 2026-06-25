const ChangeEC2Functions = require('../../../../capabilities/changes/changeEC2');
const { buildOutcomeMessage, getFirstOutcomeCode, buildActionOutcomeContext } = require('../../../chat/chatOutcomeRegistry');

//Action only (toggle_ec2). Change strategy routing: change/strategies/
async function toggleEC2Handler(context) {

    try {

        const collected = context.state.collected;

        const region = collected.region;
        const primary_instance_id = collected.primary_instance_id;
        const secondary_instance_id = collected.secondary_instance_id;

        if (!region || !primary_instance_id || !secondary_instance_id) {
            return {
                success: false,
                cloudPilotMessage:
                    "Missing fields. Send:\nregion: \"us-west-2\"\nprimary_instance_id: \"i-0abc123\"\nsecondary_instance_id: \"i-0xyz987\"",
                error: "missing_collected_fields",
                atlasResponse: null
            };
        }

        const requestBody = {
            region: String(region).trim(),
            targets: {
                primary_instance_id: String(primary_instance_id).trim(),
                secondary_instance_id: String(secondary_instance_id).trim()
            }
        };

        console.log("_____________________________________");
        console.log("Toggle EC2 request body:");
        console.log(JSON.stringify(requestBody, null, 2));
        console.log("_____________________________________");

        const atlasResponseRaw = await ChangeEC2Functions.toggleEC2(requestBody);

        console.log("_____________________________________");
        console.log("RAW Atlas Toggle Response:");
        console.log(JSON.stringify(atlasResponseRaw, null, 2));
        console.log("_____________________________________");

        if (
            atlasResponseRaw &&
            atlasResponseRaw.success === true &&
            atlasResponseRaw.data &&
            atlasResponseRaw.data.status === "SUCCESS"
        ) {
            const primaryId = atlasResponseRaw.data.primary_instance_id || String(primary_instance_id).trim();
            const secondaryId = atlasResponseRaw.data.secondary_instance_id || String(secondary_instance_id).trim();
            const regionOut = atlasResponseRaw.data.region || String(region).trim();

            return {
                success: true,
                cloudPilotMessage:
                    "Toggle completed in " + regionOut + ". Stopped primary " + primaryId + " and started secondary " + secondaryId + ".",
                error: null,
                atlasResponse: atlasResponseRaw.data
            };
        }

        const errCode = getFirstOutcomeCode(atlasResponseRaw);
        const outcomeContext = buildActionOutcomeContext(collected, atlasResponseRaw);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage(errCode, outcomeContext, 'toggle_ec2'),
            error: errCode || 'execution_failed',
            atlasResponse: null
        };

    } catch (error) {

        console.log("Atlas Toggle Error:");
        console.log(error);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage('atlas_unreachable', {}, 'toggle_ec2'),
            error: 'atlas_unreachable',
            atlasResponse: null
        };
    }
}

module.exports = toggleEC2Handler;
