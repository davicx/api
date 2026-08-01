const githubClient = require('../../../providers/github/githubClient');
const prTemplates = require('./prTemplates');

/*
Create a real GitHub PR for toggle_ec2 Terraform change.
Steps 3–4: read/validate base file → branch → update → open PR.
Step 6: reuse an existing open toggle PR when present.
*/

const TOGGLE_PR_MARKER = 'CloudPilot-Action: toggle_ec2';

async function createToggleEc2PullRequest(collected) {
    const change = prTemplates.buildToggleEc2Change(collected || {});
    const config = githubClient.readGitHubConfig();

    const existing = await findOpenTogglePullRequest(config, change);
    if (existing) {
        return {
            success: true,
            stage: 'existing',
            message: prTemplates.buildCreatedPrMessage(change, existing, { reused: true }),
            change: change,
            pullRequest: {
                title: existing.title,
                number: existing.number,
                url: existing.html_url,
                repository: config.owner + '/' + config.repo,
                baseBranch: config.defaultBranch,
                headBranch:
                    (existing.head && existing.head.ref) || change.branchName,
                filePath: change.filePath
            }
        };
    }

    let file;
    try {
        file = await githubClient.getFile({
            path: change.filePath,
            branch: config.defaultBranch
        });
    } catch (error) {
        return {
            success: false,
            stage: 'read_base_file',
            message:
                'Could not read ' +
                change.filePath +
                ' from ' +
                config.defaultBranch +
                '. ' +
                (error.message || 'GitHub error'),
            change: change,
            pullRequest: null
        };
    }

    const currentContent = prTemplates.normalizeText(file.content);
    if (currentContent !== change.before) {
        return {
            success: false,
            stage: 'validate_base_file',
            message:
                'A Pull Request cannot be created because the base branch does not currently select the primary instance.\n\n' +
                'Expected in `' +
                change.filePath +
                '`:\n' +
                change.before.trim() +
                '\n\nFound:\n' +
                currentContent.trim() +
                '\n\nReset that file to primary on `' +
                config.defaultBranch +
                '` and try again.',
            change: change,
            pullRequest: null
        };
    }

    try {
        await githubClient.createBranch(change.branchName);
    } catch (error) {
        return {
            success: false,
            stage: 'create_branch',
            message:
                'Could not create branch ' +
                change.branchName +
                '. ' +
                (error.message || 'GitHub error'),
            change: change,
            pullRequest: null
        };
    }

    try {
        await githubClient.createFile({
            branch: change.branchName,
            path: change.filePath,
            content: change.after,
            message: change.commitMessage,
            sha: file.sha
        });
    } catch (error) {
        return {
            success: false,
            stage: 'update_terraform_file',
            message:
                'Created branch ' +
                change.branchName +
                ', but could not update Terraform. ' +
                (error.message || 'GitHub error'),
            change: change,
            pullRequest: null
        };
    }

    let pullRequest;
    try {
        pullRequest = await githubClient.openPullRequest({
            title: change.pullRequestTitle,
            head: change.branchName,
            base: config.defaultBranch,
            body: change.pullRequestBody
        });
    } catch (error) {
        return {
            success: false,
            stage: 'create_pull_request',
            message:
                'The Terraform commit was created on branch ' +
                change.branchName +
                ', but GitHub could not open the Pull Request. ' +
                (error.message || 'GitHub error'),
            change: change,
            pullRequest: null
        };
    }

    return {
        success: true,
        stage: 'created',
        message: prTemplates.buildCreatedPrMessage(change, pullRequest, { reused: false }),
        change: change,
        pullRequest: {
            title: pullRequest.title,
            number: pullRequest.number,
            url: pullRequest.html_url,
            repository: config.owner + '/' + config.repo,
            baseBranch: config.defaultBranch,
            headBranch: change.branchName,
            filePath: change.filePath
        }
    };
}

async function findOpenTogglePullRequest(config, change) {
    let openPullRequests;

    try {
        openPullRequests = await githubClient.listOpenPullRequests({
            base: config.defaultBranch
        });
    } catch (error) {
        console.log(
            'Could not list open pull requests (continuing to create):',
            error.message || error
        );
        return null;
    }

    if (!Array.isArray(openPullRequests)) {
        return null;
    }

    for (let i = 0; i < openPullRequests.length; i++) {
        const pullRequest = openPullRequests[i];
        const body = pullRequest && pullRequest.body ? String(pullRequest.body) : '';
        if (body.indexOf(TOGGLE_PR_MARKER) !== -1) {
            return pullRequest;
        }
        if (pullRequest && pullRequest.title === change.pullRequestTitle) {
            return pullRequest;
        }
    }

    return null;
}

module.exports = {
    createToggleEc2PullRequest
};
