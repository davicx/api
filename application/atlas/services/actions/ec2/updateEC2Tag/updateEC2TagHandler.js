const ChangeEC2Functions = require('../../../../capabilities/changes/changeEC2');
const { buildOutcomeMessage, getFirstOutcomeCode, buildActionOutcomeContext } = require('../../../executions/outcomes/outcomeRegistry');

//Action only (update_ec2_tag). Automatic mode runs via STEP 6.
async function updateEC2TagHandler(context) {

    try {

        const collected = context.state.collected || {};
        const action = context.action;
        const defaults = (action && action.defaults) ? action.defaults : {};

        const region = collected.region;
        const instance_id = collected.instance_id;
        const tag_key = collected.tag_key || defaults.tag_key;
        const tag_value = collected.tag_value;

        if (!region || !instance_id || !tag_key || tag_value == null || String(tag_value).trim() === '') {
            return {
                success: false,
                cloudPilotMessage:
                    "Missing fields. Send:\nregion: \"us-west-2\"\ninstance_id: \"i-0abc123\"\ntag_key: \"CloudPilot-Test\"\ntag_value: \"B\"",
                error: "missing_collected_fields",
                atlasResponse: null
            };
        }

        const requestBody = {
            region: String(region).trim(),
            instance_id: String(instance_id).trim(),
            tag_key: String(tag_key).trim(),
            tag_value: String(tag_value).trim()
        };

        console.log("_____________________________________");
        console.log("Update EC2 tag request body:");
        console.log(JSON.stringify(requestBody, null, 2));
        console.log("_____________________________________");

        const atlasResponseRaw = await ChangeEC2Functions.updateEC2Tag(requestBody);

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

        if (
            atlasResponseRaw &&
            atlasResponseRaw.success === true &&
            atlasResponseRaw.data &&
            atlasResponseRaw.data.instance_id &&
            atlasResponseRaw.data.tag_key
        ) {
            const data = atlasResponseRaw.data;
            const keyOut = data.tag_key;
            const valueOut = data.tag_value;
            const instanceOut = data.instance_id;
            const regionOut = data.region || requestBody.region;
            const existed = data.tag_existed_before === true;
            const previous = data.previous_value;

            let cloudPilotMessage =
                "Updated tag " + keyOut + " to " + valueOut +
                " on " + instanceOut + " in " + regionOut + ".";

            if (existed && previous != null && String(previous) !== String(valueOut)) {
                cloudPilotMessage =
                    "Updated tag " + keyOut + " from " + previous + " to " + valueOut +
                    " on " + instanceOut + " in " + regionOut + ".";
            } else if (!existed) {
                cloudPilotMessage =
                    "Set tag " + keyOut + " to " + valueOut +
                    " on " + instanceOut + " in " + regionOut + " (tag was missing).";
            }

            return {
                success: true,
                cloudPilotMessage: cloudPilotMessage,
                error: null,
                atlasResponse: data
            };
        }

        const errCode = getFirstOutcomeCode(atlasResponseRaw);
        const outcomeContext = buildActionOutcomeContext(collected, atlasResponseRaw);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage(errCode, outcomeContext, 'update_ec2_tag'),
            error: errCode || 'execution_failed',
            atlasResponse: null
        };

    } catch (error) {

        console.log("Atlas Update EC2 Tag Error:");
        console.log(error);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage('atlas_unreachable', {}, 'update_ec2_tag'),
            error: 'atlas_unreachable',
            atlasResponse: null
        };
    }
}

module.exports = updateEC2TagHandler;
