const ScanEC2Functions = require('../../../../capabilities/scans/scanEC2');
const atlasEC2Formatter = require('./atlasEC2Formatter');
const atlasEC2MessageBuilder = require('./atlasEC2MessageBuilder');
const atlasEC2ScanNavigatorAdapter = require('./atlasEC2ScanNavigatorAdapter');
const { buildOutcomeMessage, getFirstOutcomeCode, buildActionOutcomeContext } = require('../../../executions/outcomes/outcomeRegistry');

async function scanEC2Handler(context) {

    try {

        const region =
            context.state.collected.region;

        let atlasResponseFormatted = null;

        const atlasResponseRaw =
            await ScanEC2Functions.scanEC2(region);

        // console.log("_____________________________________");
        // console.log("RAW Atlas Response:");
        // console.log(JSON.stringify(atlasResponseRaw, null, 2));
        // console.log("_____________________________________");

        if (
            !(atlasResponseRaw &&
            atlasResponseRaw.success === true &&
            atlasResponseRaw.data)
        ) {
            const errCode = getFirstOutcomeCode(atlasResponseRaw);
            const outcomeContext = buildActionOutcomeContext(
                context.state.collected || {},
                atlasResponseRaw
            );

            return {
                success: false,
                cloudPilotMessage: buildOutcomeMessage(errCode, outcomeContext, 'scan_ec2'),
                error: errCode || 'execution_failed',
                atlasResponse: null
            };
        }

        atlasResponseFormatted =
            atlasEC2Formatter.formatAtlasEC2Output(
                atlasResponseRaw
            );

        // console.log("_____________________________________");
        // console.log("Atlas Response:");
        // console.log(atlasResponseFormatted);
        // console.log("_____________________________________");

        const cloudPilotMessage =
            atlasEC2MessageBuilder.buildEC2ScanMessage(
                atlasResponseFormatted
            );

        const navigatorResponse =
            atlasEC2ScanNavigatorAdapter.buildEC2ScanNavigatorResponse(
                atlasResponseFormatted,
                {
                    success: true,
                    message: cloudPilotMessage,
                    statusCode: 200,
                    errors: []
                }
            );

        return {
            success: true,
            cloudPilotMessage: cloudPilotMessage,
            error: null,
            atlasResponse: {
                ...(atlasResponseFormatted || {}),
                navigatorResponse: navigatorResponse
            }
        };

    } catch (error) {

        console.log("Atlas Error:");
        console.log(error);

        return {
            success: false,
            cloudPilotMessage:
                "I could not complete the EC2 scan.",
            error: error.message,
            atlasResponse: null
        };
    }
}

module.exports = scanEC2Handler;
