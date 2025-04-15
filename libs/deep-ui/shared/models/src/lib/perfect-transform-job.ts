import {SnakeCaseKeys} from 'deep-ui/shared/common';

import {BaseJob, StateEnum} from './base-job';
import {RawDataOwnerType} from './common';
import {DataRetentionObj} from './etl-job';
import {PerfectList} from './perfect-list';

export enum PerfectTransformJobStepEnum {
  INPUT_VALIDATION = 'INPUT_VALIDATION',
  ETL_EXECUTION = 'ETL_EXECUTION',
  PUBLISHING_DATA_SOURCE = 'PUBLISHING_DATA_SOURCE',
}

export const stepPerfectTransformJobEnumFormatter = (
  state: PerfectTransformJobStepEnum
): string => {
  switch (state) {
    case PerfectTransformJobStepEnum.INPUT_VALIDATION:
      return 'Input Validation';
    case PerfectTransformJobStepEnum.ETL_EXECUTION:
      return 'ETL Execution';
    case PerfectTransformJobStepEnum.PUBLISHING_DATA_SOURCE:
      return 'Publishing Data Source';
    default:
  }
  return 'Input Validation';
};

export const convertPerfectTransformJobStepStringToTitle = (state: string): string => {
  switch (state) {
    case PerfectTransformJobStepEnum.INPUT_VALIDATION:
      return 'Input Validation';
    case PerfectTransformJobStepEnum.ETL_EXECUTION:
      return 'ETL Execution';
    case PerfectTransformJobStepEnum.PUBLISHING_DATA_SOURCE:
      return 'Publishing Data Source';
    default:
  }
  return 'Input Validation';
};

export const getPerfectTransformJobFlowSteps = (): Array<string> => {
  const flow = [];
  for (const value in PerfectTransformJobStepEnum) {
    if (Object.prototype.hasOwnProperty.call(PerfectTransformJobStepEnum, value)) {
      flow.push(PerfectTransformJobStepEnum[value]);
    }
  }
  return flow;
};

export type PerfectTransformRunType = 'UPDATE' | 'CREATE';

export const PerfectTransformRunTypes: Array<PerfectTransformRunType> = ['CREATE', 'UPDATE'];

export interface PerfectTransformJob extends BaseJob {
  runType: PerfectTransformRunType;
  rawDataOwner: RawDataOwnerType;
  dataRetention: DataRetentionObj;
  dataSourceName: string;
  dataSourceUuids: Array<string>;
  perfectListIds: Array<number>;
  perfect_lists: Array<PerfectList>;

  step?: PerfectTransformJobStepEnum;
  state?: StateEnum;
}

export type PerfectTransformJobSnakeCase = SnakeCaseKeys<PerfectTransformJob>;
