const CapabilitiesFunctions = require('./capabilitiesFunctions');

/*
FUNCTIONS A: show_capabilities handler
    1) Function A1: showCapabilitiesHandler

Immediate informational action — builds a response from the live actionMap.
No request row, no AWS call, no history.
Doc: doc/development/current/cloud_pilot_capabilities.md
     doc/development/finished/cloud_pilot_openai_rollout.md (Phase 4)
*/

//Function A1: Build capabilities response from actionMap catalog
async function showCapabilitiesHandler() {
    try {
        //STEP 1: Load grounded capability catalog from actionMap
        const catalog = CapabilitiesFunctions.buildCapabilitiesCatalog();

        //STEP 2: Should I run? / How should I run? (Internal or OpenAI via MESSAGE_RESPONSE)
        const responseOutcome = await CapabilitiesFunctions.respondCapabilities(catalog);

        if (!responseOutcome.success || !responseOutcome.cloudPilotMessage) {
            return {
                success: false,
                cloudPilotMessage:
                    'I could not load my current capabilities right now. Try again in a moment.',
                error: responseOutcome.error || 'show_capabilities_failed',
                atlasResponse: null
            };
        }

        return {
            success: true,
            cloudPilotMessage: responseOutcome.cloudPilotMessage,
            error: null,
            atlasResponse: {
                type: 'capabilities',
                catalog: catalog,
                source: responseOutcome.source
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
