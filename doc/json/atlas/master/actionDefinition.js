/*
===============================================================================
FILE: application/atlas/contracts/actionDefinition.js
===============================================================================

GOAL:
Static registry definition for a CloudPilot action/operation.

This defines:
- what the operation is
- how intent is detected
- what fields are required
- how execution works
- what messages should be shown

NOTES:
- This is NOT runtime state.
- This is NOT execution output.
- This is the static "definition" of an action.
- Every action in actionMap should follow this structure consistently.

CANONICAL SHAPE:

const ActionRegistry = {

    //IDENTITY
    type: 'scan_ec2',
    actionLabel: 'Scan EC2',

    //POLICY
    allowed: true,

    //ORCHESTRATION
    requiresWorkflow: true,
    requiresExecution: false,

    //INTENT DETECTION
    match: (text) => {},

    //FIELDS REQUIRED BEFORE READY
    requiredFields: [
        'region'
    ],

    //OPTIONAL DEFAULTS
    defaults: {},

    //EXECUTION
    executionFunction: Function,

    //USER-FACING SYSTEM MESSAGES
    messages: {

        started:
            'Preparing EC2 scan.',

        missingFields: {
            region:
                'Which AWS region should I use?'
        },

        ready:
            'Everything is ready for the EC2 scan.',

        executing:
            'Running EC2 scan.',

        success:
            'EC2 scan completed.',

        failed:
            'EC2 scan failed.'
    }
};

*/