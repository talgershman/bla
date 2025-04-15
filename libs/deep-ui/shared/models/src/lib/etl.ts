import {BaseModel} from 'deep-ui/shared/common';

import {EtlDagService} from './etl-service';

export enum EtlTypeEnum {
  VALIDATION = 'validation',
  PERFECT_TRANSFORM = 'perfectTransform',
  MODEL_INFERENCE = 'modelInference',
}
export const EtlTypes: Array<string> = [
  EtlTypeEnum.VALIDATION,
  EtlTypeEnum.PERFECT_TRANSFORM,
  EtlTypeEnum.MODEL_INFERENCE,
];

export interface EtlTemplateOption {
  id: EtlTypeEnum;
  value: string;
}

export const EtlTemplateOptions: Array<EtlTemplateOption> = [
  {
    value: 'Validation',
    id: EtlTypeEnum.VALIDATION,
  },
  {
    value: 'Model Inference',
    id: EtlTypeEnum.MODEL_INFERENCE,
  },
  {
    value: 'Perfect Transform',
    id: EtlTypeEnum.PERFECT_TRANSFORM,
  },
];

export interface SdkStatus {
  status: 'warning' | 'deprecationWarning' | 'deprecated';
  msg: string;
}

export type ETLServiceType = {
  [key: string]: EtlDagService;
};

export interface ETL extends BaseModel {
  id: number;
  name: string;
  type: EtlTypeEnum;
  resourcesDefinition: any;
  version: string;
  description: string;
  team: string;
  tags: string[];
  parsingConfiguration: number;
  globalSuccessThreshold: number;
  servicesDag: any;
  services: ETLServiceType;
  status: string;
  sdkStatus: SdkStatus;
  metadata?: {
    [key: string]: boolean;
  };
}

export interface EtlGroup {
  name: string;
  childCount: number;
  modifiedAt: string;
}
