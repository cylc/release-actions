const {env} = process;
const {readFileSync} = require('fs');
const {execSync, stringify, curlOpts} = require('action-utils');
// Note: all string properties of the `github` context are available as env vars as `GITHUB_<PROPERTY>`
// WARNING: Don't use ${env.GITHUB_TOKEN} in execSync() as that might print in log. Use `$GITHUB_TOKEN` instead.

if (!env.VERSION) {
    throw "::error:: Environment variable `VERSION` not set";
}

const github_event = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH));
const author = github_event.sender.login;

const milestone = getMilestone();

const milestoneText = () => {
    let checkbox = "[ ]";
    let note = `⚠️ Couldn't find milestone matching \`${env.VERSION}\``;
    if (milestone) {
        if (parseInt(milestone.open_issues) === 0) {
            checkbox = "[x]";
        }
        note = `\`${milestone.open_issues}\` other open issues/PRs on [milestone ${milestone.title}](https://github.com/${env.GITHUB_REPOSITORY}/milestone/${milestone.number}) at time of PR creation`;
    }
    return `${checkbox} Milestone complete?\n  ${note}`;
};

const bodyText = `
### ⚡ Merging this PR will automatically create a GitHub Release & publish the package ⚡

This PR was created by the \`${env.GITHUB_WORKFLOW}\` workflow, triggered by @${author}

#### Tests:
✔️ Passed - see the [workflow run](https://github.com/${env.GITHUB_REPOSITORY}/actions?query=workflow%3A%22${encodeURIComponent(env.GITHUB_WORKFLOW)}%22) (number ${env.GITHUB_RUN_NUMBER}) for more info

#### Checklist:
- ${milestoneText()}

- [ ] Changelog up-to-date?
  Examine pull requests made since the last release
  "Released on" date updated? ${env.CHANGELOG_DATE ? `✔️ \`${env.CHANGELOG_DATE}\`` : `⚠️ couldn't automatically set date`}

- [ ] All contributors listed?

- [ ] \`.mailmap\` file correct?
  In particular, check for duplication

#### Next steps:
- @${author} should request 1 or 2 reviews
- If any further changes are needed, push to this PR branch
- After merging, the bot will comment below with a link to the release (if not, look at the PR checks tab)
`;

const payload = {
    title: `Prepare release: ${env.VERSION}`,
    head: env.HEAD_REF,
    base: env.BASE_REF,
    body: bodyText
};

const request = `curl -X POST \
    https://api.github.com/repos/${env.GITHUB_REPOSITORY}/pulls \
    -H "authorization: Bearer $GITHUB_TOKEN" \
    -H "content-type: application/json" \
    --data '${stringify(payload)}' \
    ${curlOpts}`;

const pr = JSON.parse(execSync(request));
setMilestone_Assignee_Label(pr.number);



function getMilestone() {
    const request = `curl -X GET \
        https://api.github.com/repos/${env.GITHUB_REPOSITORY}/milestones \
        -H "authorization: Bearer $GITHUB_TOKEN" \
        ${curlOpts}`;

    let response;
    try {
        response = JSON.parse(execSync(request));
    } catch (err) {
        console.log(`::warning:: Error getting milestones`);
        console.log(err, '\n');
        return;
    }
    for (const milestone of response) {
        if (milestone.title.includes(env.VERSION)) {
            console.log('Found milestone:', milestone.title, '\n');
            return milestone;
        }
    }
    console.log(`::warning:: Could not find milestone matching "${env.VERSION}"`);
    return;
}

function setMilestone_Assignee_Label(prNumber) {
    // Cannot set them when creating the PR unfortunately
    const payload = {
        milestone: milestone ? milestone.number : undefined,
        assignees: [author],
        labels: env.PR_LABEL ? [env.PR_LABEL] : undefined
    }; // stringify() removes undefined properties

    const request = `curl -X PATCH \
        https://api.github.com/repos/${env.GITHUB_REPOSITORY}/issues/${prNumber} \
        -H "authorization: Bearer $GITHUB_TOKEN" \
        -H "content-type: application/json" \
        --data '${stringify(payload)}' \
        ${curlOpts}`
    execSync(request);
}
