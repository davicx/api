const CapabilitiesFunctions = require('./capabilitiesFunctions');

/*
FUNCTIONS A: show_capabilities handler
    1) Function A1: showCapabilitiesHandler

Immediate informational action — builds a response from the live actionMap.
No request row, no AWS call, no history.
Doc: doc/development/current/cloud_pilot_capabilities.md
*/

//Function A1: Build capabilities response from actionMap catalog
async function showCapabilitiesHandler() {
    try {
        //STEP 1: Load capability catalog from actionMap
        const catalog = CapabilitiesFunctions.buildCapabilitiesCatalog();

        //STEP 2: Format deterministic chat response
        const cloudPilotMessage = CapabilitiesFunctions.buildCapabilitiesMessage(catalog);

        return {
            success: true,
            cloudPilotMessage: cloudPilotMessage,
            error: null,
            atlasResponse: {
                type: 'capabilities',
                catalog: catalog
            },
            navigatorResponse: null
        };
    } catch (err) {
        console.error('[showCapabilitiesHandler]', err.message || err);

        return {
            success: false,
            cloudPilotMessage:
                'I could not load my current capabilities right now. Try again in a moment.',
            error: 'show_capabilities_failed',
            atlasResponse: null
        };
    }
}

module.exports = showCapabilitiesHandler;
