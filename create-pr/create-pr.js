/* Copyright (C) NIWA & British Crown (Met Office) & Contributors.

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
const {execSync, stringify, curlOpts} = require('cylc-action-utils');

const payload = {
    title: env.INPUT_TITLE,
    head: env.INPUT_HEAD,
    base: env.INPUT_BASE,
    body: env.INPUT_BODY
};

const request = `curl -X POST \
    https://api.github.com/repos/${env.GITHUB_REPOSITORY}/pulls \
    -H "authorization: Bearer $GITHUB_TOKEN" \
    -H "content-type: application/json" \
    --data '${stringify(payload)}' \
    ${curlOpts}`;

execSync(request);
