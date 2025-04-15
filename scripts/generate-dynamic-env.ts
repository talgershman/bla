import * as dotenv from 'dotenv';
import {writeFile} from 'fs';

dotenv.config(); // search the .env in the root directory for default values for process.env vars

const targetPath = './libs/deep-ui/shared/environments/src/lib/environment.dynamic.ts';

const envConfigFile = `export const dynamicEnv = {
  buildNumber: '${process.env.BUILD_NUMBER}',
  packageVersion: '${process.env.PACKAGE_VERSION}',
  disableNewJobs: ${process.env.DISABLE_NEW_JOBS},
  disableOnPremRequests: ${process.env.DISABLE_ON_PREM_REQUESTS},
  disableDatasetRoutes: ${process.env.DISABLE_DATASET_ROUTES},
  agGridLicense: '${process.env.AG_GRID_LICENSE}',
};
`;

// eslint-disable-next-line
writeFile(targetPath, envConfigFile, 'utf8', (err) => {
  if (err) {
    // eslint-disable-next-line
    return console.log(err);
  }
});

const targetPathLib = './libs/me-material/src/dynamic_envs.ts';
const dynamicEnv = `export default {
  agGridLicense: '${process.env.AG_GRID_LICENSE}',
};
`;

writeFile(targetPathLib, dynamicEnv, 'utf8', (err) => {
  if (err) {
    // eslint-disable-next-line
    return console.log(err);
  }
});
