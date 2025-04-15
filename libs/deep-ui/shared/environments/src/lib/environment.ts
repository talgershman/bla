import {common} from './environment.common';
import {dynamicEnv} from './environment.dynamic';
import {EnvEndPoints, Environment} from './environment-entites';

const endPoints: EnvEndPoints = {
  onPremProxyApi: 'https://on-prem-proxy.staging.deep.mobileye.com/api/',
  launchServiceApi: 'https://staging.deep.mobileye.com/launch-service/api/',
  assetsManagerApi: 'https://staging.deep.mobileye.com/assets-manager/api/',
  stateReflectorApi: 'https://staging.deep.mobileye.com/state-reflector/api/',
  probeBuilderApi: 'https://staging.deep.mobileye.com/probe-builder/api/',
  dataLoaderApi: 'https://staging.deep.mobileye.com/data-loader/api/',
  datasetsServiceApi: 'https://staging.deep.mobileye.com/datasets-service/api/',
  datasetsServiceV2Api: `https://staging.deep.mobileye.com/datasets-service/api/v2/`,
  queryEngineServiceApi: 'https://staging.deep.mobileye.com/query-engine/api/',
  executeQueryApi: 'ws://staging.deep.mobileye.com/query-engine/ws/build-and-execute-query',
  clipsSampleApi: 'ws://staging.deep.mobileye.com/query-engine/ws/clips-sample',
  imageServiceApi: 'https://production.imagesvc.cloud.mobileye.com/',
  budgetGroupServiceApi:
    'https://9zg5rnq130-vpce-0be4dcd0213e0ea68.execute-api.us-east-1.amazonaws.com/',
  quotasServiceApi: 'https://quotas.cloud.mobileye.com/',
};

// eslint-disable-next-line
export const environment: Environment = {
  ...dynamicEnv,
  ...common,
  ...endPoints,
  envName: 'Dev',
  isDevelopment: true,
};
