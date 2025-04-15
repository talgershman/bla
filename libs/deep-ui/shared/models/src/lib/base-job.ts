import {ETL} from './etl';
import {EtlJobStepEnum} from './etl-job';
import {PerfectTransformJobStepEnum} from './perfect-transform-job';

export enum StateEnum {
  STARTED = 'STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  FAIL = 'FAILED',
}

export const stateEnumFormatter = (state: StateEnum): string => {
  switch (state) {
    case StateEnum.STARTED:
      return 'Stated';
    case StateEnum.IN_PROGRESS:
      return 'In Progress';
    case StateEnum.DONE:
      return 'Done';
    case StateEnum.FAIL:
      return 'Failed';
    default:
  }
  return state;
};

export enum JobStatusEnum {
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  FAIL = 'failed',
  STUCK = 'stuck',
}

export const failedJobStatusSet = new Set([JobStatusEnum.FAIL, JobStatusEnum.STUCK]);

export const etlJobStatusFormatter = (status: string): string => {
  switch (status) {
    case JobStatusEnum.DONE:
      return 'Done';
    case JobStatusEnum.IN_PROGRESS:
      return 'In Progress';
    case JobStatusEnum.FAIL:
      return 'Failed';
    case JobStatusEnum.STUCK:
      return 'Stuck';
    default:
  }
  return status;
};

export interface JobStatusMetadata {
  uuid: string;
  step: EtlJobStepEnum | PerfectTransformJobStepEnum;
  state: StateEnum;
  details: string; // JSON string
  eventCreated: Date;
  created: Date;
}

export interface StepSummary {
  totalClips?: number;
  totalLogs?: number;
  passed?: number;
  time?: number;
  stickyInfo?: any;
}

export interface MetadataStepsSummary {
  [key: string]: StepSummary;
}

export interface BaseJob {
  jobUuid: string;

  probeId: number;
  probeVersion: string;
  probeName: string;
  probe: ETL;
  probeErrors: boolean;
  probeLogs: boolean;
  dpResults: boolean;
  logicResults: boolean;
  dpRuntimeStats: boolean; // only in etlJob
  logicRuntimeStats: boolean; // only in etlJob
  parsingErrors: boolean; // only in etlJob
  copyMestCmd: boolean; // only in etlJob
  map2dfClipList: boolean; // only in etlJob
  userParams: any;

  technology: string;
  tags: string[];
  successThreshold: number;

  metadata: any;
  metadataStepsSummary?: MetadataStepsSummary;
  jobStatusMetadata: JobStatusMetadata[];
  status: 'in_progress' | 'done' | 'failed' | 'stuck';

  userName: string;
  fullName: string;
  team: string;
  createdAt: string;
  finishedAt: string;
  duration: number;
}
