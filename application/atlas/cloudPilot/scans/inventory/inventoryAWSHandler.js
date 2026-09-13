const atlasAWSFunctions = require('./atlasAWSFunctions');
const atlasAWSInventoryFormatter = require('./atlasAWSInventoryFormatter');
const atlasAWSInventoryMessageBuilder = require('./atlasAWSInventoryMessageBuilder');
const atlasAWSInventoryNavigatorAdapter = require('./atlasAWSInventoryNavigatorAdapter');
const MasterLogging = require('../../logging/masterLogging');

async function inventoryAWSHandler() {

    try {

        let atlasResponseFormatted = null;

        const atlasResponseRaw =
            await atlasAWSFunctions.inventoryAWS();

        MasterLogging.logAtlasRaw('_____________________________________');
        MasterLogging.logAtlasRaw('RAW Atlas AWS Inventory Response:');
        MasterLogging.logAtlasRaw(JSON.stringify(atlasResponseRaw, null, 2));
        MasterLogging.logAtlasRaw('_____________________________________');

        if (
            atlasResponseRaw?.success === true &&
            atlasResponseRaw?.data
        ) {

            atlasResponseFormatted =
                atlasAWSInventoryFormatter.formatAtlasAWSInventoryOutput(
                    atlasResponseRaw
                );
        }

        MasterLogging.logAtlasFormatted('_____________________________________');
        MasterLogging.logAtlasFormatted('Atlas AWS Inventory Response:');
        MasterLogging.logAtlasFormatted(atlasResponseFormatted);
        MasterLogging.logAtlasFormatted('_____________________________________');

        const cloudPilotMessage =
            atlasAWSInventoryMessageBuilder.buildAWSInventoryMessage(
                atlasResponseFormatted
            );

        const navigatorResponse =
            atlasAWSInventoryNavigatorAdapter.buildAWSInventoryNavigatorResponse(
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

        console.log("Atlas AWS Inventory Error:");
        console.log(error);

        return {
            success: false,
            cloudPilotMessage:
                "I could not complete the AWS inventory.",
            error: error.message,
            atlasResponse: null
        };
    }
}

module.exports = inventoryAWSHandler;
