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

if (!env.PR_NUM) {
    throw "::error:: Environment variable `PR_NUM` not set";
}

const API_repoURL = `https://api.github.com/repos/${env.GITHUB_REPOSITORY}`;
const github_event = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH));
const author = github_event.sender.login;

const payload = {
    assignees: [author],
};

const request = `curl -X PATCH \
    ${API_repoURL}/issues/${env.PR_NUM} \
    -H "authorization: Bearer $GITHUB_TOKEN" \
    -H "content-type: application/json" \
    --data '${stringify(payload)}' \
    ${curlOpts}`;

execSync(request);
