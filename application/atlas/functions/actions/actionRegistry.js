const scanEC2Handler = require('./ec2/scanEC2/scanEC2Handler');
const toggleEC2Handler = require('./ec2/toggleEC2/toggleEC2Handler');

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
        allowed: true,
        requiresExecution: false,
        workflowEnabled: true,

        //Detect user intent
        match: (text) =>
            text.includes('scan') &&
            text.includes('ec2'),

        //Fields required before execution
        requiredFields: [
            'region'
        ],
        handler: scanEC2Handler,

        //User-facing message
        message:
            'Preparing EC2 scan.'
    },

    //SERVICE: EC2
    //Action: Toggle EC2
    toggle_ec2: {
        type: 'toggle_ec2',
        allowed: true,
        requiresExecution: false,
        workflowEnabled: true,

        //Detect user intent
        match: (text) =>
            text.includes('toggle') ||
            text.includes('switch'),

        //Fields required before execution
        requiredFields: [
            'region'
        ],

        handler: toggleEC2Handler,

        //User-facing message
        message:
            'Confirm before changing EC2 instances.'
    }
};

module.exports = actionRegistry;
