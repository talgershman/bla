import {common} from './environment.common';
import {dynamicEnv} from './environment.dynamic';
import {EnvEndPoints, Environment} from './environment-entites';

const enum LocalEnvEnum {
  DEV = 'dev1.',
  STAGING = 'staging.',
  PROD = '',
}

const currentLocalEnv = LocalEnvEnum.DEV.toString();

const endPoints: EnvEndPoints = {
  onPremProxyApi: `https://on-prem-proxy.${currentLocalEnv}deep.mobileye.com/api/`,
  launchServiceApi: `https://${currentLocalEnv}deep.mobileye.com/launch-service/api/`,
  assetsManagerApi: `https://${currentLocalEnv}deep.mobileye.com/assets-manager/api/`,
  stateReflectorApi: `https://${currentLocalEnv}deep.mobileye.com/state-reflector/api/`,
  probeBuilderApi: `https://${currentLocalEnv}deep.mobileye.com/probe-builder/api/`,
  dataLoaderApi: `https://${currentLocalEnv}deep.mobileye.com/data-loader/api/`,
  datasetsServiceApi: `https://${currentLocalEnv}deep.mobileye.com/datasets-service/api/`,
  datasetsServiceV2Api: `https://${currentLocalEnv}deep.mobileye.com/datasets-service/api/v2/`,
  queryEngineServiceApi: `https://${currentLocalEnv}deep.mobileye.com/query-engine/api/`,
  executeQueryApi: `ws://${currentLocalEnv}deep.mobileye.com/query-engine/ws/build-and-execute-query`,
  clipsSampleApi: `ws://${currentLocalEnv}deep.mobileye.com/query-engine/ws/clips-sample`,
  imageServiceApi: `https://production.imagesvc.cloud.mobileye.com/`,
  budgetGroupServiceApi:
    'https://9zg5rnq130-vpce-0be4dcd0213e0ea68.execute-api.us-east-1.amazonaws.com/',
  quotasServiceApi: 'https://quotas.cloud.mobileye.com/',
};

// eslint-disable-next-line
export const environment: Environment = {
  ...dynamicEnv,
  ...common,
  ...endPoints,
  isProduction: currentLocalEnv === LocalEnvEnum.PROD,
  isDevelopment: currentLocalEnv !== LocalEnvEnum.PROD,
  envName: 'Dev',
};
