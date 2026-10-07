/*
===============================================================================
FILE: application/atlas/contracts/operationState.js
===============================================================================

GOAL:
Represents the CURRENT live operation/workflow state
for a conversation.

This is the MOST IMPORTANT orchestration structure.

This defines:
- what operation is active
- what fields are still missing
- what fields were collected
- what prompts were already asked
- execution tracking

NOTES:
- This is RUNTIME STATE.
- This changes constantly during a conversation.
- This should remain VERY stable across the system.
- ActionState.js should follow this exact structure.

CANONICAL SHAPE:

const OperationState = {

    //ACTIVE OPERATION
    pendingAction: null,

    //FIELD COLLECTION
    missing: [],

    collected: {},

    //TRACK ALREADY-ASKED QUESTIONS
    asked: {},

    //EXECUTION STATUS
    execution: {

        inProgress: false,

        actionId: null,

        startedAt: null,

        status: 'idle'

        // idle
        // running
        // completed
        // failed
    }
};

EXAMPLE:

const OperationState = {

    pendingAction: 'create_ec2',

    missing: [
        'region'
    ],

    collected: {
        name: 'cloudpilot-web-1',
        instance_type: 't3.micro'
    },

    asked: {
        name: true,
        instance_type: true
    },

    execution: {
        inProgress: false,
        actionId: null,
        startedAt: null,
        status: 'idle'
    }
};

*/