const {setEnv} = require('cylc-action-utils');

const versionStr = process.env.VERSION.trim();
setEnv('VERSION', versionStr);
const branchStr = process.env.BRANCH.trim();
setEnv('BASE_REF', branchStr);
