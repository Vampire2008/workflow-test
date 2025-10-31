import { Octokit } from "octokit";

const octokit = new Octokit({
    auth: process.env.TOKEN
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

    const startTag = releases.data[1]?.tag_name;
    const endTag = releases.data[0].tag_name;

    const tags = await octokit.rest.repos.listTags({
        owner,
        repo
    });

    const endHash = tags.data.find(t => t.name === endTag).commit.sha;

    const startHash = startTag ? tags.data.find(t => t.name === startTag).commit.sha
        : (await octokit.rest.repos.listCommits({
            owner,
            repo
        })).data.at(-1);

    const compare = await octokit.rest.repos.compareCommits({
        owner,
        repo,
        base: startHash,
        head: endHash
    });

    whatChanged.project1 = compare.data.files.some(f => f.filename.startsWith('project1') || f.filename.startsWith('base'));
    whatChanged.project2 = compare.data.files.some(f => f.filename.startsWith('project2') || f.filename.startsWith('base'));
}

const date = new Date();

let releaseTag = `${process.env.MAJOR}.0-${date.getUTCFullYear()}${date.getUTCMonth}${date.getUTCDate()}-${date.getUTCHours()}${date.getUTCMinutes()}`;

await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: releaseTag,
    name: releaseTag,
    body: `Changed: ${Object.keys(whatChanged).filter(k => whatChanged[k]).join(', ')}`,
    prerelease: true
});