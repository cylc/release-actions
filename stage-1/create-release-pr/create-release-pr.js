/* THIS FILE IS PART OF THE CYLC WORKFLOW ENGINE.
Copyright (C) NIWA & British Crown (Met Office) & Contributors.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>. */

const {env} = process;
const {readFileSync} = require('fs');
const {execSync, stringify, curlOpts} = require('cylc-action-utils');
// Note: all string properties of the `github` context are available as env vars as `GITHUB_<PROPERTY>`
// WARNING: Don't use ${env.GITHUB_TOKEN} in execSync() as that might print in log. Use `$GITHUB_TOKEN` instead.

if (!env.VERSION) {
    throw "::error:: Environment variable `VERSION` not set";
}

const repoURL = `https://github.com/${env.GITHUB_REPOSITORY}`;
const API_repoURL = `https://api.github.com/repos/${env.GITHUB_REPOSITORY}`;
const github_event = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH));
const author = github_event.sender.login;

const milestone = getMilestone();
const workflowBadges = getTestWorkflowBadges();

const milestoneText = () => {
    let checkbox = "[ ]";
    let note = `⚠️ Couldn't find milestone matching \`${env.VERSION}\``;
    if (milestone) {
        if (parseInt(milestone.open_issues) === 0) {
            checkbox = "[x]";
        }
        note = `\`${milestone.open_issues}\` other open issues/PRs on [milestone ${milestone.title}](${repoURL}/milestone/${milestone.number}) at time of PR creation`;
    }
    return `${checkbox} Milestone complete?\n  ${note}`;
};

const bodyText = `
### ⚡ Merging this PR will automatically create a GitHub Release & publish the package ⚡

This PR was created by the \`${env.GITHUB_WORKFLOW}\` workflow, triggered by @${author}

#### Tests:
${workflowBadges ? `- ${workflowBadges.join(' ')}` : ''}
- ✔️ Build check passed - see the [workflow run](${repoURL}/actions?query=workflow%3A%22${encodeURIComponent(env.GITHUB_WORKFLOW)}%22) (number ${env.GITHUB_RUN_NUMBER}) for more info

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
    ${API_repoURL}/pulls \
    -H "authorization: Bearer $GITHUB_TOKEN" \
    -H "content-type: application/json" \
    --data '${stringify(payload)}' \
    ${curlOpts}`;

const pr = JSON.parse(execSync(request));
setMilestone_Assignee_Label(pr.number);



function getMilestone() {
    const request = `curl -X GET \
        ${API_repoURL}/milestones \
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
    }; // Note: stringify() below removes undefined properties

    const request = `curl -X PATCH \
        ${API_repoURL}/issues/${prNumber} \
        -H "authorization: Bearer $GITHUB_TOKEN" \
        -H "content-type: application/json" \
        --data '${stringify(payload)}' \
        ${curlOpts}`;
    execSync(request);
}

function getTestWorkflowBadges() {
    if (!env.TEST_WORKFLOWS) {
        return
    }
    const workflow_files = env.TEST_WORKFLOWS.split(',');
    return Array.from(workflow_files, (file) => {
        file = file.trim();
        const baseURL = `${repoURL}/actions/workflows/${file}`;
        return `[![${file}](${baseURL}/badge.svg?branch=${env.BASE_REF})](${baseURL}?query=branch%3A${env.BASE_REF})`;
    });
}
