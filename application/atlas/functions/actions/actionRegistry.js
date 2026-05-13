const scanEC2Handler = require('./ec2/scanEC2/scanEC2Handler');
const toggleEC2Handler = require('./ec2/toggleEC2/toggleEC2Handler');
const createEC2Handler = require('./ec2/createEC2/createEC2Handler');

const actionRegistry = {

    //SERVICE: General Chat
    general_chat: {
        type: 'general_chat',
        allowed: true,
        requiresExecution: false,
        message: ''
    },

    //SERVICE: EC2
    //Action: Scan EC2
    scan_ec2: {
        type: 'scan_ec2',
        actionLabel: 'Scan EC2',
        allowed: true,
        requiresExecution: false,
        requiresWorkflow: true,

        //Detect user intent
        match: (text) =>
            text.includes('scan') &&
            text.includes('ec2'),

        //Fields required before execution
        requiredFields: [
            'region'
        ],

        questions: {
            region: 'Which AWS region should I use?'
        },

        handler: scanEC2Handler,

        //User-facing message
        message:
            'Preparing EC2 scan.'
    },

    //SERVICE: EC2
    //Action: Toggle EC2
    toggle_ec2: {
        type: 'toggle_ec2',
        actionLabel: 'Toggle EC2',
        allowed: true,
        requiresExecution: false,
        requiresWorkflow: true,

        //Detect user intent
        match: (text) =>
            text.includes('toggle') ||
            text.includes('switch'),

        //Fields required before execution
        requiredFields: [
            'region'
        ],

        questions: {
            region: 'Which AWS region should I use?'
        },

        handler: toggleEC2Handler,

        //User-facing message
        message:
            'Confirm before changing EC2 instances.'
    },

    //SERVICE: EC2
    //Action: Create EC2
    create_ec2: {
        type: 'create_ec2',
        actionLabel: 'Create EC2',
        allowed: true,
        requiresExecution: false,
        requiresWorkflow: true,

        match: (text) =>
            text.includes('create') &&
            (text.includes('ec2') || text.includes('instance')),

        requiredFields: [
            'name',
            'region',
            'instance_type'
        ],

        questions: {
            name: 'What should I name this EC2 instance?',
            region: 'Which AWS region should I use?',
            instance_type: 'What EC2 instance type would you like?'
        },

        defaults: {
            tags: {
                'managed-by': 'cloudpilot',
                'environment': 'demo',
                'cloudpilot-role': 'secondary'
            }
        },

        handler: createEC2Handler,

        message: 'Preparing EC2 create.'
    }
};

module.exports = actionRegistry;
