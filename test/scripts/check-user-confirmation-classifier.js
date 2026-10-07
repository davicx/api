require('dotenv').config();

const {
    searchMessageForUserConfirmation
} = require('../../application/atlas/cloudPilotIntelligence/understand/search/searchMessageForUserConfirmation');
const {
    CLOUDPILOT_AI_CONFIG
} = require('../../application/atlas/config/cloudPilotAIConfig');

const waitingScanS3State = {
    pendingAction: 'scan_s3',
    status: 'waiting_on_confirmation',
    executionMode: null,
    workflowId: 'manual-classifier-check',
    missing: [],
    collected: {
        region: 'us-west-2',
        request_name: 'Manual S3 Scan'
    },
    asked: {}
};

const messages = [
    'hello',
    'help',
    'maybe',
    'is this safe?',
    'what will the scan do?',
    'yes',
    'cancel'
];

async function run() {
    console.log(
        'Mode: ' +
            (CLOUDPILOT_AI_CONFIG.aiEnabled
                ? CLOUDPILOT_AI_CONFIG.userConfirmationSearch
                : 'internal (master AI disabled)')
    );

    for (const message of messages) {
        const result = await searchMessageForUserConfirmation(
            message,
            waitingScanS3State
        );

        console.log(
            JSON.stringify({
                message: message,
                replyType: result.replyType,
                replySource: result.replySource,
                fallbackReason: result.fallbackReason || null
            })
        );
    }
}

run()
    .then(function () {
        process.exit(0);
    })
    .catch(function (error) {
        console.error(
            'Classifier check failed:',
            error && error.message ? error.message : String(error)
        );
        process.exit(1);
    });
