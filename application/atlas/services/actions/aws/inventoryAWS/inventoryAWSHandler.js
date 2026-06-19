const atlasAWSFunctions = require('../atlasAWSFunctions');
const atlasAWSInventoryFormatter = require('./atlasAWSInventoryFormatter');
const atlasAWSInventoryMessageBuilder = require('./atlasAWSInventoryMessageBuilder');
const atlasAWSInventoryNavigatorAdapter = require('./atlasAWSInventoryNavigatorAdapter');

async function inventoryAWSHandler() {

    try {

        let atlasResponseFormatted = null;

        const atlasResponseRaw =
            await atlasAWSFunctions.inventoryAWS();

        console.log("_____________________________________");
        console.log("RAW Atlas AWS Inventory Response:");
        console.log(JSON.stringify(atlasResponseRaw, null, 2));
        console.log("_____________________________________");

        if (
            atlasResponseRaw?.success === true &&
            atlasResponseRaw?.data
        ) {

            atlasResponseFormatted =
                atlasAWSInventoryFormatter.formatAtlasAWSInventoryOutput(
                    atlasResponseRaw
                );
        }

        console.log("_____________________________________");
        console.log("Atlas AWS Inventory Response:");
        console.log(atlasResponseFormatted);
        console.log("_____________________________________");

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
