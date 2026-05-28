/**
 * Manual E2E: create_ec2 through CloudPilot chat workflow (automatic mode).
 * Usage (from application/atlas): node doc/testing/e2e-create-ec2.js
 * Requires Atlas at ATLAS_BASE_URL — launches real EC2; run only when intended.
 */
const { processMessage } = require('../../functions/cloudPilotMessageFunctions');

const conversationID = 'e2e-create-' + Date.now();

const turns = [
    'Create a t3.micro instance in us-west-2 named test-instance',
    'name: "test-instance" region: "us-west-2" instance_type: "t3.micro"',
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
