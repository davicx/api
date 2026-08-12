/*
FUNCTIONS A: Create EC2 request context — what CloudPilot knows
    1) Function A1: getCreateEc2Context
    2) Function A2: getCreateEc2ChoiceFields
*/

/*
Create-only knowledge block. Not a registry or framework.
Guidance and (later) Chat may read this; the handler does not speak from it.
*/

const CREATE_EC2_CHOICE_FIELDS = [
    {
        field: 'name',
        label: 'Name',
        summary: 'how you will recognize the server'
    },
    {
        field: 'region',
        label: 'Region',
        summary: 'where AWS will run it'
    },
    {
        field: 'instance_type',
        label: 'Instance type',
        summary: 'determines computing power and cost'
    }
];

//Function A1: Facts and rules CloudPilot may use for create_ec2
function getCreateEc2Context() {
    return {
        action: 'create_ec2',
        meaning: 'Create a new EC2 instance in the chosen AWS region.',
        choiceFields: CREATE_EC2_CHOICE_FIELDS.slice(),
        fieldNotes: {
            name: 'A human-readable label so the instance is easy to find later.',
            region: 'AWS region affects where the instance runs and can affect pricing.',
            instance_type: 'Instance type affects compute capacity and ongoing compute cost.'
        },
        pricingRules: {
            showEstimateOnlyWhenKnown: true,
            estimateIsComputeOnly: true,
            neverInventPrices: true,
            continuousRunningCostsMoreThanStopping: true
        },
        securityRules: {
            neverClaimSecureUnlessKnown: true
        },
        afterCreate: {
            followUps: [
                'Pause this instance',
                'How much is this costing me?',
                'Show me this instance'
            ],
            comingSoonLabels: [
                'Alert if spend is high',
                'Pause when unused'
            ]
        },
        demoDefaults: {
            instance_type: 't3.micro',
            instanceTypeIsDemoDefault: true
        }
    };
}

//Function A2: Ordered choices shown at start and again when values are known
function getCreateEc2ChoiceFields() {
    return CREATE_EC2_CHOICE_FIELDS.slice();
}

module.exports = {
    getCreateEc2Context,
    getCreateEc2ChoiceFields
};
