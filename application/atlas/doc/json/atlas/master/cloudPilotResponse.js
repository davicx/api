/*
===============================================================================
FILE: application/atlas/contracts/cloudPilotResponse.js
===============================================================================

GOAL:
Main orchestration response returned from processMessage().

This is the CENTRAL payload of CloudPilot.

This defines:
- what CloudPilot understood
- current workflow/operation state
- readiness
- execution state
- final user-facing message
- Atlas results (optional)

NOTES:
- This should remain VERY stable.
- Frontend/iOS/API responses should all rely on this shape.
- Avoid changing naming once clients depend on it.

CANONICAL SHAPE:

const CloudPilotResponse = {

    success: false,

    cloudPilotMessage: '',

    cloudPilot: {

        //INTENT DETECTION
        intent: null,

        //POLICY / GUARDRAILS
        policy: {

            allowed: false,

            message: null,

            reason: null

            // examples:
            // OUT_OF_SCOPE
            // DESTRUCTIVE_ACTION
            // NOT_ALLOWED
        },

        //ACTION STATUS
        action: {

            type: null,

            ready: false,

            parameters: {}
        },

        //LIVE OPERATION STATE
        state: {

            pendingAction: null,

            missing: [],

            collected: {},

            asked: {},

            execution: {

                inProgress: false,

                actionId: null,

                startedAt: null,

                status: 'idle'
            }
        }
    },

    //OPTIONAL EXECUTION DATA
    atlas: null,

    //ERROR DETAILS
    error: null
};

*/