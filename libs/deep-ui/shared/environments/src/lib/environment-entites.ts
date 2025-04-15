export interface EnvCommon {
  multiFieldsJumpFileDocUrl: string;
  envName: string;
  redirectUri: string;
  authenticatedDefaultPath: string;
  logoutPath: string;
  isProduction: boolean;
  isStaging: boolean;
  isDevelopment: boolean;
  buildNumber: string;
  disableNewJobs: boolean;
  disableOnPremRequests: boolean;
  disableDatasetRoutes: boolean;
  packageVersion: string;
}

export interface EnvEndPoints {
  onPremProxyApi: string;
  launchServiceApi: string;
  stateReflectorApi: string;
  assetsManagerApi: string;
  probeBuilderApi: string;
  dataLoaderApi: string;
  datasetsServiceApi: string;
  datasetsServiceV2Api: string;
  queryEngineServiceApi: string;
  executeQueryApi: string;
  clipsSampleApi: string;
  imageServiceApi: string;
  budgetGroupServiceApi: string;
  quotasServiceApi: string;
}

export interface EnvDynamic {
  agGridLicense: string;
}

export type Environment = EnvCommon & EnvEndPoints & EnvDynamic;
