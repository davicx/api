const atlasS3Functions = require('../atlasS3Functions');
const atlasS3Formatter = require('./atlasS3Formatter');
const atlasS3MessageBuilder = require('./atlasS3MessageBuilder');
const atlasS3ScanNavigatorAdapter = require('./atlasS3ScanNavigatorAdapter');

async function scanS3Handler(context) {

    try {

        const region =
            context.state.collected.region;

        let atlasResponseFormatted = null;

        const atlasResponseRaw =
            await atlasS3Functions.scanS3(region);

        console.log("_____________________________________");
        console.log("RAW Atlas S3 Response:");
        console.log(JSON.stringify(atlasResponseRaw, null, 2));
        console.log("_____________________________________");

        if (
            atlasResponseRaw?.success === true &&
            atlasResponseRaw?.data
        ) {

            atlasResponseFormatted =
                atlasS3Formatter.formatAtlasS3Output(
                    atlasResponseRaw
                );
        }

        console.log("_____________________________________");
        console.log("Atlas S3 Response:");
        console.log(atlasResponseFormatted);
        console.log("_____________________________________");

        const cloudPilotMessage =
            atlasS3MessageBuilder.buildS3ScanMessage(
                atlasResponseFormatted
            );

        const navigatorResponse =
            atlasS3ScanNavigatorAdapter.buildS3ScanNavigatorResponse(
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

        console.log("Atlas S3 Error:");
        console.log(error);

        return {
            success: false,
            cloudPilotMessage:
                "I could not complete the S3 scan.",
            error: error.message,
            atlasResponse: null
        };
    }
}

module.exports = scanS3Handler;
