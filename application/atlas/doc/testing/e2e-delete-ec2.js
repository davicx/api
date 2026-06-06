/**
 * Manual E2E: delete_ec2 through CloudPilot chat workflow (automatic mode).
 * Usage (from application/atlas): node doc/testing/e2e-delete-ec2.js
 * Requires: Atlas at ATLAS_BASE_URL. Set INSTANCE_ID env to a real instance before running.
 */
const { processMessage } = require('../../functions/cloudPilotMessageFunctions');

const instanceId = process.env.INSTANCE_ID;
if (!instanceId) {
    console.error('Set INSTANCE_ID (e.g. i-0abc123) before running.');
    process.exit(1);
}

const conversationID = 'e2e-delete-' + Date.now();

const turns = [
    'delete ec2 instance',
    'region: "us-west-2" instance_id: "' + instanceId + '"',
    '4',
    'yes'
];

async function run() {
    let lastOutcome = null;

    for (let i = 0; i < turns.length; i++) {
        const message = turns[i];
        console.log('\n========== TURN', i + 1, '==========');
        console.log('USER:', message);

        lastOutcome = await processMessage(message, conversationID);

        console.log('CLOUD PILOT:', lastOutcome.cloudPilotMessage);
        console.log('SUCCESS:', lastOutcome.success);
        if (lastOutcome.atlasResponse) {
            console.log('ATLAS DATA:', JSON.stringify(lastOutcome.atlasResponse, null, 2));
        }
        if (lastOutcome.error) {
            console.log('ERROR:', lastOutcome.error);
        }
    }

    const passed =
        lastOutcome &&
        lastOutcome.success === true &&
        lastOutcome.atlasResponse &&
        lastOutcome.atlasResponse.instance_id;

    console.log('\n========== RESULT ==========');
    console.log(passed ? 'E2E PASS' : 'E2E FAIL');
    process.exit(passed ? 0 : 1);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
