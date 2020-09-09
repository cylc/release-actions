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
