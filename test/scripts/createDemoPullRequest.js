/**
 * Integration test: open one real CloudPilot demo PR on GitHub.
 *
 * Keeps working as "can CloudPilot still open a GitHub PR?"
 *
 * Usage (from api/):
 *   node test/scripts/createDemoPullRequest.js
 *
 * Required env:
 *   GITHUB_TOKEN
 *   GITHUB_OWNER=davicx
 *   GITHUB_REPO=cloudpilot_infrastructure
 *   GITHUB_DEFAULT_BRANCH=cloud_pilot_mvp
 *
 * Does not touch chat, Atlas, history, or undo.
 */

require('dotenv').config();

const {
    readGitHubConfig,
    createBranch,
    createFile,
    openPullRequest
} = require('../../application/atlas/services/config/github/githubClient');

const CHANGE_FILE_PATH = 'changes/create_demo_server.json';

const CHANGE_DOCUMENT = {
    cloudpilotVersion: 1,
    kind: 'InfrastructureChange',
    displayName: 'Create EC2 demo-server',
    action: 'create_ec2',
    resource: {
        type: 'ec2',
        region: 'us-west-2',
        instanceType: 't3.micro',
        name: 'demo-server'
    }
};

async function main() {
    const config = readGitHubConfig();
    const branchName = 'cloudpilot/create-ec2-demo-server-' + Date.now();
    const fileContent = JSON.stringify(CHANGE_DOCUMENT, null, 2) + '\n';

    console.log('GitHub target:', config.owner + '/' + config.repo);
    console.log('Base branch:', config.defaultBranch);
    console.log('New branch:', branchName);

    console.log('Creating branch…');
    await createBranch(branchName);

    console.log('Committing change file…');
    await createFile({
        branch: branchName,
        path: CHANGE_FILE_PATH,
        content: fileContent,
        message: 'Add CloudPilot change: create_ec2 demo-server'
    });

    console.log('Opening pull request…');
    const pullRequest = await openPullRequest({
        title: 'Create EC2: demo-server',
        head: branchName,
        base: config.defaultBranch,
        body:
            'CloudPilot InfrastructureChange.\n\n' +
            'Adds `' +
            CHANGE_FILE_PATH +
            '` — merge authorizes CloudPilot to apply this change (apply workflow comes in Phase 3).'
    });

    console.log('');
    console.log('Success.');
    console.log('PR #' + pullRequest.number + ': ' + pullRequest.html_url);
}

main().catch(function (error) {
    console.error('createDemoPullRequest failed:', error.message);
    process.exit(1);
});
