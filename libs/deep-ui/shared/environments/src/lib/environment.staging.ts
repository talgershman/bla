import {common} from './environment.common';
import {dynamicEnv} from './environment.dynamic';
import {EnvEndPoints, Environment} from './environment-entites';

const endPoints: EnvEndPoints = {
  onPremProxyApi: window.location.host.includes('.dev')
    ? 'https://on-prem-proxy.dev1.deep.mobileye.com/api/'
    : `${window.location.protocol}//on-prem-proxy.${window.location.host}/api/`,
  launchServiceApi: `${window.location.origin}/launch-service/api/`,
  stateReflectorApi: `${window.location.origin}/state-reflector/api/`,
  assetsManagerApi: `${window.location.origin}/assets-manager/api/`,
  probeBuilderApi: `${window.location.origin}/probe-builder/api/`,
  dataLoaderApi: `${window.location.origin}/data-loader/api/`,
  datasetsServiceApi: `${window.location.origin}/datasets-service/api/`,
  datasetsServiceV2Api: `${window.location.origin}/datasets-service/api/v2/`,
  queryEngineServiceApi: `${window.location.origin}/query-engine/api/`,
  executeQueryApi: `wss://${window.location.host}/query-engine/ws/build-and-execute-query`,
  clipsSampleApi: `wss://${window.location.host}/query-engine/ws/clips-sample`,
  imageServiceApi: 'https://production.imagesvc.cloud.mobileye.com/',
  budgetGroupServiceApi:
    'https://9zg5rnq130-vpce-0be4dcd0213e0ea68.execute-api.us-east-1.amazonaws.com/',
  quotasServiceApi: 'https://quotas.cloud.mobileye.com/',
};

// eslint-disable-next-line
export const environment: Environment = {
  ...common,
  ...dynamicEnv,
  ...endPoints,
  isStaging: false, //until devops will change the build production - revert to true
  isProduction: true, //until devops will change the build production - revert to false
  envName: 'Staging',
};
