const ChangeEC2Functions = require('../../../providers/atlas/ec2/changeEC2');
const { buildOutcomeMessage, getFirstOutcomeCode, buildActionOutcomeContext } = require('../../execution/outcomes/outcomeRegistry');

/*
FUNCTIONS A: Resume EC2 handler (resume_ec2 → Atlas /ec2/resume)
    1) Function A1: resumeEC2Handler
*/

//Function A1: Resume one EC2 instance via Atlas (AWS start under the hood)
async function resumeEC2Handler(context) {

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
        console.log("Resume EC2 request body:");
        console.log(JSON.stringify(requestBody, null, 2));
        console.log("_____________________________________");

        const atlasResponseRaw = await ChangeEC2Functions.resumeEC2(requestBody);

        console.log("_____________________________________");
        console.log("RAW Atlas Resume Response:");
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
            const stateAfter = atlasData.state_after || 'running';
            const isNoop = atlasData.noop === true;

            let cloudPilotMessage;
            if (isNoop) {
                cloudPilotMessage =
                    "EC2 instance " +
                    instanceId +
                    " in " +
                    regionOut +
                    " is already running.";
            } else {
                cloudPilotMessage =
                    "Resumed EC2 instance " +
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
            cloudPilotMessage: buildOutcomeMessage(errCode, outcomeContext, 'resume_ec2'),
            error: errCode || 'execution_failed',
            atlasResponse: null
        };

    } catch (error) {

        console.log("Atlas Resume Error:");
        console.log(error);

        return {
            success: false,
            cloudPilotMessage: buildOutcomeMessage('atlas_unreachable', {}, 'resume_ec2'),
            error: 'atlas_unreachable',
            atlasResponse: null
        };
    }
}

module.exports = resumeEC2Handler;
