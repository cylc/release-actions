/* THIS FILE IS PART OF THE CYLC SUITE ENGINE.
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

const {execSync, curlOpts} = require('action-utils')
const {env} = process;

if (!env.PYPI_PACKAGE_NAME) {
    throw `::error:: No package name supplied`;
}

const request = `curl -X GET \
    https://pypi.org/pypi/${env.PYPI_PACKAGE_NAME}/json \
    ${curlOpts}`
const {releases} = JSON.parse(execSync(request));
console.log('Releases on PyPI.org:')
for (const release in releases) {
    console.log(`  ${release}`);
    const diff = execSync(`cmp_py_versions ${release} ${env.SETUP_PY_VERSION}`, {quiet: true});
    if (!diff) {
        throw `::error:: ${env.SETUP_PY_VERSION} already exists on PyPI.org`;
    }
}
