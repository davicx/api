const ChangeEC2Functions = require('../../../providers/atlas/ec2/changeEC2');
const { buildOutcomeMessage, getFirstOutcomeCode, buildActionOutcomeContext } = require('../../execution/outcomes/outcomeRegistry');

/*
FUNCTIONS A: Pause EC2 handler (pause_ec2 → Atlas /ec2/pause)
    1) Function A1: pauseEC2Handler
*/

//Function A1: Pause one EC2 instance via Atlas (AWS stop under the hood)
async function pauseEC2Handler(context) {

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
        console.log("Pause EC2 request body:");
        console.log(JSON.stringify(requestBody, null, 2));
        console.log("_____________________________________");

        const atlasResponseRaw = await ChangeEC2Functions.pauseEC2(requestBody);

        console.log("_____________________________________");
        console.log("RAW Atlas Pause Response:");
        console.log(JSON.stringify(atlasResponseRaw, null, 2));
        console.log("_____________________________________");

        if (
            atlasResponseRaw &&
            atlasResponseRaw.success === true &&
            atlasResponseRaw.data &&
            atlasResponseRaw.data.instance_id
        ) {
            const atlasData = atlasResponseRaw.data;
            const instanceId = atlasData.instance_id;
            const regionOut = atlasData.region || String(region).trim();
            const stateBefore = atlasData.state_before || 'unknown';
            const stateAfter = atlasData.state_after || 'stopped';
            const isNoop = atlasData.noop === true;

            let cloudPilotMessage;
            if (isNoop) {
                cloudPilotMessage =
                    "EC2 instance " +
                    instanceId +
                    " in " +
                    regionOut +
                    " is already paused (stopped).";
            } else {
                cloudPilotMessage =
                    "Paused EC2 instance " +
                    instanceId +
                    " in " +
                    regionOut +
                    " (was " +
                    stateBefore +
                    ", now " +
                    stateAfter +
                    ").";
            }

            return {
                success: true,
                cloudPilotMessage: cloudPilotMessage,
                error: null,
                atlasResponse: atlasData
            };
        }

        const errCode = getFirstOutcomeCode(atlasResponseRaw);
        const outcomeContext = buildActionOutcomeContext(collected, atlasResponseRaw);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage(errCode, outcomeContext, 'pause_ec2'),
            error: errCode || 'execution_failed',
            atlasResponse: null
        };

    } catch (error) {

        console.log("Atlas Pause Error:");
        console.log(error);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage('atlas_unreachable', {}, 'pause_ec2'),
            error: 'atlas_unreachable',
            atlasResponse: null
        };
    }
}

module.exports = pauseEC2Handler;
