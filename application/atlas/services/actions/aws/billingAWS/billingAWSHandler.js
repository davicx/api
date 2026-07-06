const AtlasBillingFunctions = require('./atlasBillingFunctions');
const AtlasAWSBillingMessage = require('./atlasAWSBillingMessage');
const AtlasAWSBillingNavigator = require('./atlasAWSBillingNavigator');

/*
FUNCTIONS A: show_billing handler
    1) Function A1: billingAWSHandler
*/

//Function A1: Fetch billing from Atlas → chat message + navigator
async function billingAWSHandler() {
    try {
        const atlasResponseRaw = await AtlasBillingFunctions.fetchBillingSummary({
            period_days: 30
        });

        console.log('_____________________________________');
        console.log('RAW Atlas Billing Response:');
        console.log(JSON.stringify(atlasResponseRaw, null, 2));
        console.log('_____________________________________');

        if (!(atlasResponseRaw && atlasResponseRaw.success === true && atlasResponseRaw.data)) {
            const errorCode =
                atlasResponseRaw &&
                Array.isArray(atlasResponseRaw.errors) &&
                atlasResponseRaw.errors[0]
                    ? String(atlasResponseRaw.errors[0])
                    : 'billing_failed';
            const atlasMessage =
                atlasResponseRaw && atlasResponseRaw.message
                    ? String(atlasResponseRaw.message).trim()
                    : '';

            return {
                success: false,
                cloudPilotMessage:
                    atlasMessage ||
                    'I could not load your AWS billing. Enable Cost Explorer in AWS and check that Atlas can read billing data.',
                error: errorCode,
                atlasResponse: null
            };
        }

        const billingData = atlasResponseRaw.data;
        const cloudPilotMessage = AtlasAWSBillingMessage.buildBillingMessage(billingData);

        const navigatorResponse = AtlasAWSBillingNavigator.buildBillingNavigatorResponse(
            billingData,
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
                summary: {
                    periodDays: billingData.period_days,
                    totalUsd: billingData.total_usd,
                    serviceCount: Array.isArray(billingData.services)
                        ? billingData.services.length
                        : 0
                },
                navigatorResponse: navigatorResponse
            }
        };
    } catch (error) {
        console.log('Atlas Billing Error:');
        console.log(error);

        return {
            success: false,
            cloudPilotMessage: 'I could not complete the AWS billing summary.',
            error: error.message,
            atlasResponse: null
        };
    }
}

module.exports = billingAWSHandler;
