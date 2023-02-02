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
const {escSQ, execSync, setOutput} = require('cylc-action-utils');

const cmd = [
    'gh', 'release', 'create',
    env.TAG,
    `--repo '${env.REPO}'`,
    `--target '${env.TARGET}'`,
    `--title '${escSQ(env.TITLE)}'`,
]

if (env.BODY) {
    cmd.push(`--notes '${escSQ(env.BODY)}'`)
} else if (env.BODY_PATH) {
    cmd.push(`--notes-file '${env.BODY_PATH}'`)
}
if (env.IS_DRAFT === 'true') {
    cmd.push('--draft')
}
if (env.IS_PRERELEASE === 'true') {
    cmd.push('--prerelease')
}

const url = execSync(cmd.join(' ')).split('\n')[0]

setOutput('html_url', url)
