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

        //Detect user intent
        match: (text) =>
            text.includes('scan') &&
            text.includes('ec2'),

        //Fields required before execution
        requiredFields: [
            'region'
        ],

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

        //Detect user intent
        match: (text) =>
            text.includes('toggle') ||
            text.includes('switch'),

        //Fields required before execution
        requiredFields: [
            'region'
        ],

        //User-facing message
        message:
            'Confirm before changing EC2 instances.'
    }
};