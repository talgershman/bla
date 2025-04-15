import {BaseModel} from 'deep-ui/shared/common';

import {SdkStatus} from './etl';

export interface EtlDagService extends BaseModel {
  id: number;
  type: string;
  name: string;
  version: string;
  description: string;
  group: string;
  team: string;
  configuration: any;
  dockerImagePath: string;
  taskDefinition: string;
  sdkVersion: string;
  sdkStatus: SdkStatus;
  gitUrl: string;
}
