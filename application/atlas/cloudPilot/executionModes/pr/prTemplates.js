/*
Toggle EC2 Terraform change metadata (path, before/after, PR copy).
*/

function buildToggleEc2Change(collected) {
    const fields = collected || {};
    const currentRole = pickValue(fields.current_role, 'primary');
    const targetRole = pickValue(fields.target_role, 'secondary');
    const currentType = pickValue(fields.current_instance_type, 't3.small');
    const targetType = pickValue(fields.target_instance_type, 't3.micro');

    const filePath = 'environments/kite/terraform.tfvars';
    const before = 'active_instance = "primary"\n';
    const after = 'active_instance = "secondary"\n';
    const diff = [
        '-active_instance = "primary"',
        '+active_instance = "secondary"'
    ].join('\n');

    return {
        filePath: filePath,
        before: before,
        after: after,
        diff: diff,
        currentRole: currentRole,
        targetRole: targetRole,
        currentType: currentType,
        targetType: targetType,
        branchName: 'cloudpilot/toggle-kite-to-secondary-' + Date.now(),
        commitMessage: 'Switch Kite to secondary EC2 instance',
        pullRequestTitle: 'Switch Kite from ' + currentType + ' to ' + targetType,
        pullRequestBody: buildPullRequestBody({
            currentRole: currentRole,
            targetRole: targetRole,
            currentType: currentType,
            targetType: targetType,
            filePath: filePath
        })
    };
}

function buildPullRequestBody(options) {
    return [
        '## Summary',
        '',
        'CloudPilot prepared this change to switch the active Kite environment from',
        'the primary EC2 instance to the smaller secondary instance.',
        '',
        '## Proposed change',
        '',
        '- Current active instance: `' + options.currentRole + '`',
        '- Current instance type: `' + options.currentType + '`',
        '- Proposed active instance: `' + options.targetRole + '`',
        '- Proposed instance type: `' + options.targetType + '`',
        '',
        '## Terraform change',
        '',
        'This Pull Request updates:',
        '',
        '`' + options.filePath + '`',
        '',
        'from:',
        '',
        '```hcl',
        'active_instance = "primary"',
        '```',
        '',
        'to:',
        '',
        '```hcl',
        'active_instance = "secondary"',
        '```',
        '',
        '## Deployment',
        '',
        'No AWS infrastructure has been changed.',
        '',
        'This Pull Request only prepares the infrastructure-as-code change for review.',
        'The CloudPilot MVP does not run `terraform apply` from this repository.',
        '',
        'CloudPilot-Action: toggle_ec2',
        'CloudPilot-Target: secondary'
    ].join('\n');
}

function buildCreatedPrMessage(change, pullRequest, options) {
    const reused = options && options.reused === true;
    const url = pullRequest.html_url || pullRequest.url || '';
    const repository =
        (pullRequest.base && pullRequest.base.repo && pullRequest.base.repo.full_name) ||
        pullRequest.repository ||
        'davicx/cloudpilot_infrastructure';

    const lines = [
        reused
            ? '✓ Pull Request already open (reusing for this demo)'
            : '✓ Pull Request created',
        '',
        change.pullRequestTitle,
        '',
        'Repository: ' + repository,
        'File changed: ' + change.filePath,
        '',
        change.diff,
        '',
        'No AWS changes have been applied.',
        '',
        'View Pull Request: ' + url
    ];

    if (reused) {
        lines.push('');
        lines.push(
            'Close this PR on GitHub when you finish the demo, then run Pull Request again for a fresh one.'
        );
    }

    return lines.join('\n');
}

function normalizeText(value) {
    return String(value || '').replace(/\r\n/g, '\n').trimEnd() + '\n';
}

function pickValue(value, fallback) {
    if (value === null || value === undefined) {
        return fallback;
    }

    const text = String(value).trim();
    if (text === '') {
        return fallback;
    }

    return text;
}

module.exports = {
    buildToggleEc2Change,
    buildCreatedPrMessage,
    normalizeText
};
