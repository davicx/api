const atlasS3Functions = require('./atlasS3Functions');
const atlasS3Formatter = require('./atlasS3Formatter');
const atlasS3MessageBuilder = require('./atlasS3MessageBuilder');
const atlasS3ScanNavigatorAdapter = require('./atlasS3ScanNavigatorAdapter');
const MasterLogging = require('../../logging/masterLogging');

async function scanS3Handler(context) {

    try {

        const region =
            context.state.collected.region;

        let atlasResponseFormatted = null;

        const atlasResponseRaw =
            await atlasS3Functions.scanS3(region);

        MasterLogging.logAtlasRaw('_____________________________________');
        MasterLogging.logAtlasRaw('RAW Atlas S3 Response:');
        MasterLogging.logAtlasRaw(JSON.stringify(atlasResponseRaw, null, 2));
        MasterLogging.logAtlasRaw('_____________________________________');

        if (
            atlasResponseRaw?.success === true &&
            atlasResponseRaw?.data
        ) {

            atlasResponseFormatted =
                atlasS3Formatter.formatAtlasS3Output(
                    atlasResponseRaw
                );
        }

        MasterLogging.logAtlasFormatted('_____________________________________');
        MasterLogging.logAtlasFormatted('Atlas S3 Response:');
        MasterLogging.logAtlasFormatted(atlasResponseFormatted);
        MasterLogging.logAtlasFormatted('_____________________________________');

        const capabilityType =
            context.action && context.action.type ? String(context.action.type) : 'scan_s3';

        const cloudPilotMessage =
            capabilityType === 'get_s3_inventory'
                ? atlasS3MessageBuilder.buildS3InventoryMessage(atlasResponseFormatted)
                : atlasS3MessageBuilder.buildS3ScanMessage(atlasResponseFormatted);

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
