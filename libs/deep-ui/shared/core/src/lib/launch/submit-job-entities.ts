import {
  DataRetentionObj,
  EtlJobFlowsEnum,
  EtlJobRunType,
  PerfectTransformRunType,
  RawDataOwnerType,
} from 'deep-ui/shared/models';

export interface SubmitJobDataset {
  s3Path: string;
  clipListId?: number;
  clipsToParamsHashPath?: string;
}

export interface SubmitJobClipToLog {
  itrksDir?: string;
}

export interface SubmitJobMest {
  id: number;
  isOverride: boolean;
  rootPath: string;
  executable: string;
  params: string[];
  nickname: string;
  args: string;
  mestOutputsNickname?: string;
  mestSyncLocalDirectory?: string;
  skipMestRetry: boolean;
  brainLib?: string;
  lib?: string;
}

export interface SubmitJobEtlParams {
  dataPrep?: {
    id: number;
    configuration?: {
      [key: string]: any;
      upload_files?: Array<any>;
    };
  };
  probeLogic?: {
    id: number;
    configuration?: {
      [key: string]: any;
      upload_files?: Array<any>;
    };
  };
}

export interface SubmitJobModelInferenceParams {
  genericDataPrep?: {
    id: number;
    configuration?: {
      [key: string]: any;
      upload_files?: Array<any>;
    };
  };
  logic?: {
    id: number;
    configuration?: {
      [key: string]: any;
      upload_files?: Array<any>;
    };
  };
}

export interface SubmitJobPerfectTransformParams {
  perfectTransform?: {
    id: number;
    configuration?: {
      [key: string]: any;
      upload_files?: Array<any>;
    };
  };
}

export interface SubmitJobEtl {
  id: string;
  params?: SubmitJobEtlParams;
}

export interface SubmitJobModelInference {
  id: string;
  params?: SubmitJobModelInferenceParams;
}

export interface SubmitJobResponse {
  isCreated?: boolean;
  jobUuid?: string;
  error?: string;
  mestNickname?: string;
  outputPath?: string;
}

export interface SubmitJobCommon {
  flowType: string;
  runType?: EtlJobRunType;
  budgetGroup: string;
  team: string;
  tags: string[];
  dataRetention: DataRetentionObj;
  successThreshold?: number;
}

export interface SubmitJobMetro extends SubmitJobCommon {
  flowType: EtlJobFlowsEnum.METRO;
  outputPath?: string;
  dataset: SubmitJobDataset;
  probe: SubmitJobModelInference;
}

export interface SubmitJobCloudMco extends SubmitJobCommon {
  flowType: EtlJobFlowsEnum.CLOUD_MCO;
  outputPath: string;
  cloudMco: {
    command: string;
  };
  parsingOnly: boolean;
  mergeParsedData: boolean;
  createDatasourceFromParsedData: boolean;
  forceParsing: boolean;
  probe?: SubmitJobModelInference;
  parsingConfiguration?: {
    id?: number;
  };
}

export interface SubmitJobAVPipeline extends SubmitJobCommon {
  flowType: EtlJobFlowsEnum.AV_PIPELINE;
  outputPath?: string;
  dataset: SubmitJobDataset;
  probe?: SubmitJobEtl;
  parsingConfiguration?: {
    id?: number;
  };
  parsingOnly: boolean;
  mergeParsedData: boolean;
  createDatasourceFromParsedData: boolean;
  forceParsing: boolean;
}

export interface SubmitJobPerfectTransform {
  flowType: 'PERFECT_TRANSFORM';
  runType: PerfectTransformRunType;
  budgetGroup: string;
  perfectListIds: Array<number>;
  probeId: number;
  params?: SubmitJobPerfectTransformParams;
  team?: string;
  dataSourceId?: string;
  name?: string;
  rawDataOwner?: RawDataOwnerType;
  technology?: string;
  tags?: Array<string>;
  description?: string;
  dataRetention?: DataRetentionObj;
}

export interface SubmitJobVersionPerfect extends SubmitJobCommon {
  outputPath: string;
  dataset: SubmitJobDataset;
  probe?: SubmitJobEtl;
  parsingConfiguration?: {
    id?: number;
  };
  mest: SubmitJobMest;
  parsingOnly: boolean;
  perfects: {
    fpaPerfects?: string;
    dataSourceUrls?: Array<string>;
  };
  mergeParsedData: boolean;
  createDatasourceFromParsedData: boolean;
  forceParsing: boolean;
}

export interface SubmitJobRefJobId extends SubmitJobCommon {
  outputPath: string;
  probe: SubmitJobEtl;
  perfects?: {
    fpaPerfects?: string;
    dataSourceUrls?: Array<string>;
  };
  jobIdParsedData: string;
}

export interface SubmitJobClip2LogRequest extends SubmitJobCommon {
  outputPath: string;
  dataset?: SubmitJobDataset;
  probe?: SubmitJobEtl;
  parsingConfiguration?: {
    id?: number;
  };
  mest?: SubmitJobMest;
  clip2log?: SubmitJobClipToLog;
  parsingOnly: boolean;
  metadata?: {
    [key: string]: any;
  };
  forceParsing: boolean;
}

export interface SubmitJobPcRunRequest extends SubmitJobCommon {
  outputPath: string;
  dataset?: SubmitJobDataset;
  probe?: SubmitJobEtl;
  parsingConfiguration?: {
    id?: number;
  };
  mest?: SubmitJobMest;
  parsingOnly: boolean;
  mergeParsedData: boolean;
  createDatasourceFromParsedData: boolean;
  forceParsing: boolean;
}

export interface SubmitJobSingleVersionRequest extends SubmitJobCommon {
  outputPath?: string;
  dataset: SubmitJobDataset;
  probe?: SubmitJobEtl;
  parsingConfiguration?: {
    id?: number;
  };
  mest: SubmitJobMest;
  parsingOnly: boolean;
  mergeParsedData: boolean;
  createDatasourceFromParsedData: boolean;
  dependsOnJobs?: Array<string>;
  forceParsing: boolean;
}

export interface SubmitJobCompareVersionJob {
  mest: SubmitJobMest;
  tags: Array<string>;
  mergeParsedData: boolean;
  createDatasourceFromParsedData: boolean;
  dataRetention: DataRetentionObj;
  forceParsing: boolean;
}

export interface SubmitJobCompareVersionJobWithDataset extends SubmitJobCompareVersionJob {
  dataset: SubmitJobDataset;
}

export interface SubmitJobCompareVersionsRequestCommon {
  dataset: SubmitJobDataset;
  probe: SubmitJobEtl;
  outputPath: string;
}

export type SubmitJobCompareVersionsRequestCommonWithoutDataset = Omit<
  SubmitJobCompareVersionsRequestCommon,
  'dataset'
>;

export interface SubmitJobCompareVersionsRequest {
  flowType: string;
  runType: EtlJobRunType;
  budgetGroup: string;
  team: string;
  perfects?: {
    fpaPerfects?: string;
    dataSourceUrls?: string;
  };
  common: SubmitJobCompareVersionsRequestCommon;
  mainJob: SubmitJobCompareVersionJob;
  dependantJobs: Array<SubmitJobCompareVersionJob>;
}

export type SubmitJobCompareVersionsWithMultiClipListsRequest = Omit<
  SubmitJobCompareVersionsRequest,
  'common' | 'mainJob' | 'dependantJobs'
> & {
  common: SubmitJobCompareVersionsRequestCommonWithoutDataset;
  mainJob: SubmitJobCompareVersionJobWithDataset;
  dependantJobs: Array<SubmitJobCompareVersionJobWithDataset>;
};

export type SubmitJobCompareVersionsRequestTypes =
  | SubmitJobCompareVersionsRequest
  | SubmitJobCompareVersionsWithMultiClipListsRequest;

export interface SubmitJobCompareVersionsClipToLogJob {
  clip2log: SubmitJobClipToLog;
  dataset: SubmitJobDataset;
  dataRetention: DataRetentionObj;
  metadata?: {
    [key: string]: any;
  };
  forceParsing: boolean;
}

export interface SubmitJobCompareVersionsCloudMcoJob {
  cloudMco: {
    command: string;
  };
  dataRetention: DataRetentionObj;
  mergeParsedData: boolean;
  createDatasourceFromParsedData: boolean;
  forceParsing: boolean;
}

export interface SubmitJobCompareVersionsClipToLogRequest {
  flowType: string;
  runType: EtlJobRunType;
  budgetGroup: string;
  team: string;
  tags: Array<string>;
  common: {
    probe: SubmitJobEtl;
    outputPath: string;
  };
  mainJob: SubmitJobCompareVersionsClipToLogJob;
  dependantJobs: Array<SubmitJobCompareVersionsClipToLogJob>;
}

export interface SubmitJobCompareVersionsCloudMcoRequest {
  flowType: string;
  runType: EtlJobRunType;
  budgetGroup: string;
  team: string;
  tags: Array<string>;
  common: {
    probe: SubmitJobEtl;
    outputPath: string;
  };
  mainJob: SubmitJobCompareVersionsCloudMcoJob;
  dependantJobs: Array<SubmitJobCompareVersionsCloudMcoJob>;
}

export type SubmitJobRequest =
  | SubmitJobVersionPerfect
  | SubmitJobPcRunRequest
  | SubmitJobClip2LogRequest
  | SubmitJobSingleVersionRequest
  | SubmitJobCompareVersionsRequest
  | SubmitJobCompareVersionsClipToLogRequest
  | SubmitJobCompareVersionsCloudMcoRequest;
