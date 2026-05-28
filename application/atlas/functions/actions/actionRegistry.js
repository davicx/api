const scanEC2Handler = require('./ec2/scanEC2/scanEC2Handler');
const toggleEC2Handler = require('./ec2/toggleEC2/toggleEC2Handler');
const createEC2Handler = require('./ec2/createEC2/createEC2Handler');
const deleteEC2Handler = require('./ec2/deleteEC2/deleteEC2Handler');
const inventoryAWSHandler = require('./aws/inventoryAWS/inventoryAWSHandler');

/*
===============================================================================
CANONICAL STATIC ACTION DEFINITIONS
===============================================================================

This file is the central registry for CloudPilot action definitions.

Each action definition describes static orchestration metadata:
- identity
- policy
- actionTier (general_chat | informational | destructive)
- intent detection
- workflow requirements
- executionModes (destructive actions only)
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
        //Identity
        type: 'general_chat',
        actionLabel: 'General Chat',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'general_chat',
        requiresWorkflow: false,
        requiresExecution: false,

        //Intent Detection
        match: () => false,

        //Fields Required Before Ready
        requiredFields: [],

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: null,

        //User-Facing System Messages
        messages: {
            started: '',
            missingFields: {},
            ready: '',
            executing: '',
            success: '',
            failed: ''
        }
    },

    //SERVICE: AWS
    //Action: Inventory AWS Resources
    //TO DO: Maybe later add regions, resource types
    inventory_aws: {
        //Identity
        type: 'inventory_aws',
        actionLabel: 'Inventory AWS Resources',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'informational',
        requiresWorkflow: false,
        requiresExecution: true,

        //Intent Detection
        match: (text) =>
            text.includes('show me all my aws resources') ||
            text.includes('show my aws resources'),

        //Fields Required Before Ready
        requiredFields: [],

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: inventoryAWSHandler,

        //User-Facing System Messages
        messages: {
            started: 'Preparing AWS inventory.',
            missingFields: {},
            ready: 'Everything is ready for AWS inventory.',
            executing: 'Gathering AWS resources.',
            success: 'Great, I found your AWS resources and added them to your dashboard.',
            failed: 'AWS inventory failed.'
        }
    },

    //SERVICE: EC2
    //Action: Scan EC2
    scan_ec2: {
        //Identity
        type: 'scan_ec2',
        actionLabel: 'Scan EC2',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'informational',
        requiresWorkflow: true,
        requiresExecution: false,

        //Intent Detection
        match: (text) =>
            text.includes('scan') &&
            text.includes('ec2'),

        //Fields Required Before Ready
        requiredFields: [
            'region'
        ],

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: scanEC2Handler,

        //User-Facing System Messages
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
        //Identity
        type: 'toggle_ec2',
        actionLabel: 'Toggle EC2',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'destructive',
        requiresWorkflow: true,
        requiresExecution: false,

        //Execution mode selection (destructive tier only)
        executionModes: [
            'instructions',
            'cli',
            'pr',
            'automatic'
        ],

        //Intent Detection
        match: (text) =>
            text.includes('toggle') ||
            text.includes('switch'),

        //Fields Required Before Ready
        requiredFields: [
            'region',
            'primary_instance_id',
            'secondary_instance_id'
        ],

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: toggleEC2Handler,

        //User-Facing System Messages
        messages: {
            started: 'Confirm before changing EC2 instances.',
            missingFields: {
                region: 'Which AWS region should I use?',
                primary_instance_id: 'What is the primary EC2 instance ID to stop (e.g. i-0abc123)?',
                secondary_instance_id: 'What is the secondary EC2 instance ID to start (e.g. i-0xyz987)?'
            },
            ready: 'Everything is ready for the EC2 toggle.',
            executing: 'Toggling EC2 instances. This may take a few minutes.',
            success: 'EC2 toggle completed.',
            failed: 'EC2 toggle failed.'
        }
    },

    //SERVICE: EC2
    //Action: Create EC2
    create_ec2: {
        //Identity
        type: 'create_ec2',
        actionLabel: 'Create EC2',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'destructive',
        requiresWorkflow: true,
        requiresExecution: false,

        //Execution mode selection (destructive tier only)
        executionModes: [
            'instructions',
            'cli',
            'pr',
            'automatic'
        ],

        //Intent Detection
        match: (text) =>
            text.includes('create') &&
            (text.includes('ec2') || text.includes('instance')),

        //Fields Required Before Ready
        requiredFields: [
            'name',
            'region',
            'instance_type'
        ],

        //Optional Defaults
        defaults: {
            tags: {
                'managed-by': 'cloudpilot',
                'cloudpilot-managed': 'true',
                'environment': 'demo',
                'cloudpilot-role': 'secondary'
            }
        },

        //Execution
        executionFunction: createEC2Handler,

        //User-Facing System Messages
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
    },

    //SERVICE: EC2
    //Action: Delete EC2
    delete_ec2: {
        //Identity
        type: 'delete_ec2',
        actionLabel: 'Delete EC2',

        //Policy
        allowed: true,

        //Orchestration
        actionTier: 'destructive',
        requiresWorkflow: true,
        requiresExecution: false,

        //Execution mode selection (destructive tier only)
        executionModes: [
            'instructions',
            'cli',
            'pr',
            'automatic'
        ],

        //Intent Detection
        match: (text) =>
            text.includes('delete') &&
            (text.includes('ec2') || text.includes('instance')),

        //Fields Required Before Ready
        requiredFields: [
            'region',
            'instance_id'
        ],

        //Optional Defaults
        defaults: {},

        //Execution
        executionFunction: deleteEC2Handler,

        //User-Facing System Messages
        messages: {
            started: 'Preparing EC2 delete.',
            missingFields: {
                region: 'Which AWS region is the instance in?',
                instance_id: 'What is the EC2 instance ID to delete (e.g. i-0abc123)?'
            },
            ready: 'Everything is ready for the EC2 delete.',
            executing: 'Terminating EC2 instance.',
            success: 'EC2 instance termination requested.',
            failed: 'EC2 delete failed.'
        }
    }
};

function actionRequiresExecutionModeSelection(actionDefinition) {
    return Boolean(
        actionDefinition &&
        Array.isArray(actionDefinition.executionModes) &&
        actionDefinition.executionModes.length > 0
    );
}

module.exports = actionRegistry;

Object.defineProperty(module.exports, 'actionRequiresExecutionModeSelection', {
    value: actionRequiresExecutionModeSelection,
    enumerable: false
});
