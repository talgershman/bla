import {SnakeCaseKeys} from 'deep-ui/shared/common';

import {BaseJob, StateEnum} from './base-job';
import {EtlJobRunType} from './common';
import {JobEntity} from './jobs-common';
import {ParsingConfiguration} from './parsing-configuration';

export enum EtlJobStepEnum {
  MEST = 'MEST',
  PARSING = 'PARSING',
  PROBE = 'PROBE',
  REPORT = 'REPORT',
}

export enum ETLJobUnSupportedTypes {
  MAP_TO_DF = 'MAP_TO_DF',
}

export const getEtlJobFlowSteps = (job: JobEntity = null): Array<string> => {
  if (job?.runType === EtlJobRunType.DATA_CREATION) {
    return [EtlJobStepEnum.MEST, EtlJobStepEnum.PARSING];
  }
  const flow = [];
  for (const value in EtlJobStepEnum) {
    if (Object.prototype.hasOwnProperty.call(EtlJobStepEnum, value)) {
      flow.push(EtlJobStepEnum[value]);
    }
  }
  return flow;
};

export const stepEtlJobEnumFormatter = (state: EtlJobStepEnum): string => {
  switch (state) {
    case EtlJobStepEnum.MEST:
      return 'MEST';
    case EtlJobStepEnum.PARSING:
      return 'Parsing Data';
    case EtlJobStepEnum.PROBE:
      return 'ETL Execution';
    case EtlJobStepEnum.REPORT:
      return 'Results';
    default:
  }
  return '';
};

export const convertEtlJobStepStringToTitle = (state: string): string => {
  switch (state) {
    case EtlJobStepEnum.MEST:
      return 'MEST';
    case EtlJobStepEnum.PARSING:
      return 'Parsing Data';
    case EtlJobStepEnum.PROBE:
      return 'ETL Execution';
    case EtlJobStepEnum.REPORT:
      return 'Results';
    default:
  }
  return '';
};

export enum EtlJobFlowsEnum {
  VERSION_PERFECT = 'VERSION_PERFECT',
  CLIP_2_LOG = 'CLIP2LOG',
  SINGLE_VERSION = 'SINGLE_VERSION',
  PC_RUN = 'PC_RUN',
  METRO = 'METRO',
  AV_PIPELINE = 'AV_PIPELINE',
  CLOUD_MCO = 'CLOUD_MCO',
}

export enum PerfectJobFlowsEnum {
  PERFECT_TRANSFORM = 'PERFECT_TRANSFORM',
}

export type JobTypesEnum = EtlJobFlowsEnum | PerfectJobFlowsEnum;

export const FLOW_TYPES_WITH_CLIP_LIST_STEP = [
  EtlJobFlowsEnum.VERSION_PERFECT,
  EtlJobFlowsEnum.SINGLE_VERSION,
];

export const RE_TRIGGER_INVALID_RUN_TYPES = [EtlJobRunType.COMPARE_VERSIONS];

export const getEtlJobRunTypeOption = (flow: EtlJobFlowsEnum): Array<EtlJobRunType> => {
  switch (flow) {
    case EtlJobFlowsEnum.CLIP_2_LOG:
    case EtlJobFlowsEnum.VERSION_PERFECT:
    case EtlJobFlowsEnum.SINGLE_VERSION:
    case EtlJobFlowsEnum.PC_RUN:
    case EtlJobFlowsEnum.CLOUD_MCO:
      return [EtlJobRunType.FULL_RUN, EtlJobRunType.DATA_CREATION, EtlJobRunType.COMPARE_VERSIONS];
    case EtlJobFlowsEnum.AV_PIPELINE:
      return [EtlJobRunType.FULL_RUN, EtlJobRunType.DATA_CREATION];
    case EtlJobFlowsEnum.METRO:
      return null;
    default:
      // eslint-disable-next-line
      const exhaustiveCheck: never = flow;
      throw new Error(`Unhandled getEtlJobRunTypeOption case: ${exhaustiveCheck}`);
  }
};

export const isRefJobIdByRunTypeEnabled = (
  flow: EtlJobFlowsEnum,
  runType: EtlJobRunType,
): boolean => {
  if (runType !== EtlJobRunType.FULL_RUN) {
    return false;
  }
  switch (flow) {
    case EtlJobFlowsEnum.CLIP_2_LOG:
    case EtlJobFlowsEnum.AV_PIPELINE:
    case EtlJobFlowsEnum.VERSION_PERFECT:
    case EtlJobFlowsEnum.SINGLE_VERSION:
    case EtlJobFlowsEnum.CLOUD_MCO:
    case EtlJobFlowsEnum.PC_RUN:
      return true;
    case EtlJobFlowsEnum.METRO:
      return false;
    default:
      // eslint-disable-next-line
      const exhaustiveCheck: never = flow;
      throw new Error(`Unhandled getEtlJobRunTypeOption case: ${exhaustiveCheck}`);
  }
};

export const EtlJobFlowEnumFormatter = (flow: EtlJobFlowsEnum): string => {
  switch (flow) {
    case EtlJobFlowsEnum.VERSION_PERFECT:
      return 'Version + Perfect';
    case EtlJobFlowsEnum.CLIP_2_LOG:
      return 'Clip2Log';
    case EtlJobFlowsEnum.SINGLE_VERSION:
      return 'Single Version';
    case EtlJobFlowsEnum.PC_RUN:
      return 'PC Run';
    case EtlJobFlowsEnum.METRO:
      return 'METRO';
    case EtlJobFlowsEnum.AV_PIPELINE:
      return 'AV Pipeline';
    case EtlJobFlowsEnum.CLOUD_MCO:
      return 'Cloud MCO';
    default:
  }
  return flow || '';
};

export const getUnsupportedJobTypes = (): Array<string> => {
  const flow = [];
  for (const value in ETLJobUnSupportedTypes) {
    if (Object.prototype.hasOwnProperty.call(ETLJobUnSupportedTypes, value)) {
      flow.push(ETLJobUnSupportedTypes[value]);
    }
  }
  return flow;
};

export const getEtlJobFlowTypes = (): Array<string> => {
  const flow = [];
  for (const value in EtlJobFlowsEnum) {
    if (Object.prototype.hasOwnProperty.call(EtlJobFlowsEnum, value)) {
      flow.push(EtlJobFlowsEnum[value]);
    }
  }
  return flow;
};

export interface EtlJob extends BaseJob {
  jobHash: string;
  jobType:
    | 'VERSION_PERFECT'
    | 'CLIP2LOG'
    | 'SINGLE_VERSION'
    | 'PC_RUN'
    | 'METRO'
    | 'MAP_TO_DF'
    | 'AV_PIPELINE'
    | 'CLOUD_MCO';
  runType: 'full_run' | 'data_creation';

  probeReports: any;
  dataRetention: DataRetentionObj;
  parsingConfiguration: ParsingConfiguration;

  datasetUuid: string;
  datasetVersion: string;
  clipListS3Key: string;
  clipListId: number;
  outputPath: string;
  mestVersion: string;
  mestParams: string;
  mestArgs: string;
  mestVersionNickname: string;
  mestHash: string;
  metadata: {
    dependsOnJobs?: Array<string>;
    clipsToParamsHashPath?: string;
    createDatasourceFromParsedData?: boolean;
    mestClipList?: boolean;
    officialDrives?: boolean;
  };

  perfectsDataUrl: string;
  versionDataUrl: string;

  step?: EtlJobStepEnum;
  state?: StateEnum;
}

export type ETLJobSnakeCase = SnakeCaseKeys<EtlJob>;

export interface DataRetentionConfig {
  [key: string]: DataRetentionInfo;
}

export interface ReTriggerConfig {
  disabledTypes: Array<string>;
}

export interface DataRetentionInfo {
  default: number; //the default selected date, current day + default (in days)
  max: number; //the max date, current day + max (in days)
  tooltip: string;
  label: string;
  job_types: Array<string>;
  allowPermanent: boolean;
}

export interface DataRetentionObj {
  [key: string]: string; //short date in string ( example : 2022-12-25 )
}

export enum DataRetentionKnownKeysEnum {
  PARSED_DATA = 'parsed_data',
  MEST_OUTPUTS = 'mest_outputs',
  ETL_RESULTS = 'etl_results',
  MERGED_PARSED_DATA = 'mest_data_source',
  PERFECTS_DATA_SOURCE = 'perfects',
  DATASETS = 'datasets',
}
