import { Octokit } from "octokit";

const octokit = new Octokit({
    auth: process.env.TOKEN
    // auth: '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'
});

const [owner, repo] = process.env.REPO.split('/');

const releases = await octokit.rest.repos.listReleases({
    owner,
    repo
});

let whatChanged = {
    project1: true,
    project2: true
};

if (releases.data.length) {
    const startTag = releases.data[0]?.tag_name;

    const tags = await octokit.rest.repos.listTags({
        owner,
        repo
    });

    const lastCommitResponse = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: process.env.BRANCH,
        mediaType: {
            format: 'sha'
        }
    });

    const lastCommitHash = lastCommitResponse.data;

    const startHash = tags.data.find(t => t.name === startTag).commit.sha;

    const compare = await octokit.rest.repos.compareCommits({
        owner,
        repo,
        base: startHash,
        head: lastCommitHash
    });

    whatChanged.project1 = compare.data.files.some(f => f.filename.startsWith('project1') || f.filename.startsWith('base'));
    whatChanged.project2 = compare.data.files.some(f => f.filename.startsWith('project2') || f.filename.startsWith('base'));
}

const date = new Date();

let releaseTag = `${process.env.MAJOR}.0-${date.getUTCFullYear()}${date.getUTCMonth().toString().padStart(2, '0')}${date.getUTCDate().toString().padStart(2, '0')}-${date.getUTCHours().toString().padStart(2, '0'), 2}${date.getUTCMinutes().toString().padStart(2, '0')}`;

await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: releaseTag,
    name: releaseTag,
    body: `Changed: ${Object.keys(whatChanged).filter(k => whatChanged[k]).join(', ')}`,
    prerelease: true
});