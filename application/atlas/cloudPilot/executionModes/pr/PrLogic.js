const createToggleEc2PullRequest = require('./createToggleEc2PullRequest');

/*
PULL REQUEST EXECUTION — user picked option 3

STEP 7 response only.
MVP: toggle_ec2 opens a real GitHub PR (Terraform primary → secondary).

FUNCTIONS A: Pull Request Execution
    1) Function A1: buildPrStrategy
*/

async function buildPrStrategy(chatType, actionKey, collected) {
    //STEP 1: Load and Validate Action
    const key = actionKey ? String(actionKey).trim() : '';

    if (!key) {
        return {
            success: false,
            cloudPilotMessage:
                'You chose Pull Request, but I could not tell which action to prepare.',
            chatType: chatType,
            atlasResponse: null,
            error: 'missing_action'
        };
    }

    //STEP 2: Create Pull Request
    if (key === 'toggle_ec2') {
        const result = await createToggleEc2PullRequest.createToggleEc2PullRequest(
            collected || {}
        );

        if (!result.success) {
            return {
                success: false,
                cloudPilotMessage: result.message,
                chatType: chatType,
                atlasResponse: {
                    type: 'pr',
                    action: key,
                    status: 'failed',
                    stage: result.stage || null,
                    deploymentApplied: false
                },
                error: result.stage || 'pr_failed'
            };
        }

        const change = result.change;
        const pullRequest = result.pullRequest;

        //STEP 3: Build Pull Request Response
        return {
            success: true,
            cloudPilotMessage: result.message,
            chatType: chatType,
            atlasResponse: {
                type: 'pr',
                action: key,
                status: result.stage === 'existing' ? 'existing' : 'created',
                title: pullRequest.title,
                filePath: pullRequest.filePath,
                before: change.before.trim(),
                after: change.after.trim(),
                diff: change.diff,
                pullRequestUrl: pullRequest.url,
                pullRequestNumber: pullRequest.number,
                repository: pullRequest.repository,
                baseBranch: pullRequest.baseBranch,
                headBranch: pullRequest.headBranch,
                deploymentApplied: false
            },
            error: null
        };
    }

    //STEP 3: Build Missing Pull Request Response
    return {
        success: false,
        cloudPilotMessage:
            'You chose Pull Request, but I do not have a PR template for ' +
            key +
            ' yet. The MVP demo uses toggle_ec2.',
        chatType: chatType,
        atlasResponse: null,
        error: 'pr_template_not_found'
    };
}

module.exports = { buildPrStrategy };
