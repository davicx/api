const atlasAWSFunctions = require('../atlasAWSFunctions');
const atlasAWSInventoryFormatter = require('./atlasAWSInventoryFormatter');
const atlasAWSInventoryMessageBuilder = require('./atlasAWSInventoryMessageBuilder');

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

        return {
            success: true,
            cloudPilotMessage:
                atlasAWSInventoryMessageBuilder.buildAWSInventoryMessage(
                    atlasResponseFormatted
                ),
            error: null,
            atlasResponse: atlasResponseFormatted
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
