import {EnvCommon} from './environment-entites';

export const common: EnvCommon = {
  authenticatedDefaultPath: '/jobs',
  redirectUri: window.location.origin,
  logoutPath: '/logout',
  isProduction: false,
  isStaging: false,
  isDevelopment: false,
  buildNumber: '',
  disableNewJobs: false,
  disableOnPremRequests: false,
  disableDatasetRoutes: false,
  packageVersion: '',
  envName: '',
  multiFieldsJumpFileDocUrl: 'https://deep.mobileye.com/docs/datasets/generate_jump_file/',
};
