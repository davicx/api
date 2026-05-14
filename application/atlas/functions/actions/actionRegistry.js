const scanEC2Handler = require('./ec2/scanEC2/scanEC2Handler');
const toggleEC2Handler = require('./ec2/toggleEC2/toggleEC2Handler');
const createEC2Handler = require('./ec2/createEC2/createEC2Handler');

/*
===============================================================================
CANONICAL STATIC ACTION DEFINITIONS
===============================================================================

This file is the central registry for CloudPilot action definitions.

Each action definition describes static orchestration metadata:
- identity
- policy
- intent detection
- workflow requirements
- execution handler
- defaults
- user-facing system messages

This is NOT runtime workflow state.
This is NOT Atlas execution output.

All actions should follow the same stable structure so orchestration, prompts,
and frontend-safe action payloads can rely on consistent naming.
*/

const actionRegistry = {

    //SERVICE: General Chat
    general_chat: {
        //IDENTITY
        type: 'general_chat',
        actionLabel: 'General Chat',

        //POLICY
        allowed: true,

        //ORCHESTRATION
        requiresWorkflow: false,
        requiresExecution: false,

        //INTENT DETECTION
        match: () => false,

        //FIELDS REQUIRED BEFORE READY
        requiredFields: [],

        //OPTIONAL DEFAULTS
        defaults: {},

        //EXECUTION
        handler: null,

        //USER-FACING SYSTEM MESSAGES
        messages: {
            started: '',
            missingFields: {},
            ready: '',
            executing: '',
            success: '',
            failed: ''
        }
    },

    //SERVICE: EC2
    //Action: Scan EC2
    scan_ec2: {
        //IDENTITY
        type: 'scan_ec2',
        actionLabel: 'Scan EC2',

        //POLICY
        allowed: true,

        //ORCHESTRATION
        requiresWorkflow: true,
        requiresExecution: false,

        //INTENT DETECTION
        match: (text) =>
            text.includes('scan') &&
            text.includes('ec2'),

        //FIELDS REQUIRED BEFORE READY
        requiredFields: [
            'region'
        ],

        //OPTIONAL DEFAULTS
        defaults: {},

        //EXECUTION
        handler: scanEC2Handler,

        //USER-FACING SYSTEM MESSAGES
        messages: {
            started: 'Preparing EC2 scan.',
            missingFields: {
                region: 'Which AWS region should I use?'
            },
            ready: 'Everything is ready for the EC2 scan.',
            executing: 'Running EC2 scan.',
            success: 'EC2 scan completed.',
            failed: 'EC2 scan failed.'
        }
    },

    //SERVICE: EC2
    //Action: Toggle EC2
    toggle_ec2: {
        //IDENTITY
        type: 'toggle_ec2',
        actionLabel: 'Toggle EC2',

        //POLICY
        allowed: true,

        //ORCHESTRATION
        requiresWorkflow: true,
        requiresExecution: false,

        //INTENT DETECTION
        match: (text) =>
            text.includes('toggle') ||
            text.includes('switch'),

        //FIELDS REQUIRED BEFORE READY
        requiredFields: [
            'region'
        ],

        //OPTIONAL DEFAULTS
        defaults: {},

        //EXECUTION
        handler: toggleEC2Handler,

        //USER-FACING SYSTEM MESSAGES
        messages: {
            started: 'Confirm before changing EC2 instances.',
            missingFields: {
                region: 'Which AWS region should I use?'
            },
            ready: 'Everything is ready for the EC2 update.',
            executing: 'Updating EC2 instance state.',
            success: 'EC2 instance state updated.',
            failed: 'EC2 instance state update failed.'
        }
    },

    //SERVICE: EC2
    //Action: Create EC2
    create_ec2: {
        //IDENTITY
        type: 'create_ec2',
        actionLabel: 'Create EC2',

        //POLICY
        allowed: true,

        //ORCHESTRATION
        requiresWorkflow: true,
        requiresExecution: false,

        //INTENT DETECTION
        match: (text) =>
            text.includes('create') &&
            (text.includes('ec2') || text.includes('instance')),

        //FIELDS REQUIRED BEFORE READY
        requiredFields: [
            'name',
            'region',
            'instance_type'
        ],

        //OPTIONAL DEFAULTS
        defaults: {
            tags: {
                'managed-by': 'cloudpilot',
                'environment': 'demo',
                'cloudpilot-role': 'secondary'
            }
        },

        //EXECUTION
        handler: createEC2Handler,

        //USER-FACING SYSTEM MESSAGES
        messages: {
            started: 'Preparing EC2 create.',
            missingFields: {
                name: 'What should I name this EC2 instance?',
                region: 'Which AWS region should I use?',
                instance_type: 'What EC2 instance type would you like?'
            },
            ready: 'Everything is ready for the EC2 create.',
            executing: 'Creating EC2 instance.',
            success: 'EC2 instance created.',
            failed: 'EC2 create failed.'
        }
    }
};

module.exports = actionRegistry;
