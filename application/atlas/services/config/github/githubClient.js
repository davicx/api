/*
GitHub REST API client — delivery only.

Creates branches, commits files, and opens pull requests.
No CloudPilot business logic. No Atlas. No EC2 knowledge.
*/

const GITHUB_API_BASE = 'https://api.github.com';

function readGitHubConfig() {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const defaultBranch = process.env.GITHUB_DEFAULT_BRANCH;

    const missing = [];
    if (!token) missing.push('GITHUB_TOKEN');
    if (!owner) missing.push('GITHUB_OWNER');
    if (!repo) missing.push('GITHUB_REPO');
    if (!defaultBranch) missing.push('GITHUB_DEFAULT_BRANCH');

    if (missing.length > 0) {
        throw new Error('Missing GitHub env vars: ' + missing.join(', '));
    }

    return {
        token,
        owner,
        repo,
        defaultBranch
    };
}

async function githubRequest(method, path, body) {
    const config = readGitHubConfig();

    const response = await fetch(GITHUB_API_BASE + path, {
        method,
        headers: {
            Authorization: 'Bearer ' + config.token,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    });

    let payload = null;
    const text = await response.text();
    if (text) {
        try {
            payload = JSON.parse(text);
        } catch (parseError) {
            payload = { message: text };
        }
    }

    if (!response.ok) {
        const detail =
            (payload && (payload.message || payload.error)) ||
            response.statusText ||
            'GitHub API error';
        throw new Error('GitHub ' + method + ' ' + path + ' failed (' + response.status + '): ' + detail);
    }

    return payload;
}

async function getDefaultBranchSha() {
    const config = readGitHubConfig();
    const ref = await githubRequest(
        'GET',
        '/repos/' + config.owner + '/' + config.repo + '/git/ref/heads/' + encodeURIComponent(config.defaultBranch)
    );
    return ref.object.sha;
}

async function createBranch(branchName) {
    const config = readGitHubConfig();
    const baseSha = await getDefaultBranchSha();

    return githubRequest('POST', '/repos/' + config.owner + '/' + config.repo + '/git/refs', {
        ref: 'refs/heads/' + branchName,
        sha: baseSha
    });
}

async function createFile({ branch, path, content, message }) {
    const config = readGitHubConfig();

    return githubRequest(
        'PUT',
        '/repos/' + config.owner + '/' + config.repo + '/contents/' + path.split('/').map(encodeURIComponent).join('/'),
        {
            message,
            content: Buffer.from(content, 'utf8').toString('base64'),
            branch
        }
    );
}

async function openPullRequest({ title, head, base, body }) {
    const config = readGitHubConfig();

    return githubRequest('POST', '/repos/' + config.owner + '/' + config.repo + '/pulls', {
        title,
        head,
        base: base || config.defaultBranch,
        body: body || ''
    });
}

module.exports = {
    readGitHubConfig,
    createBranch,
    createFile,
    openPullRequest
};
