import {BaseModel} from 'deep-ui/shared/common';

export interface ParsingConfiguration extends BaseModel {
  id: string;
  name: string;
  version: number;
  description: string;
  folder: string;
  group: string;
  config: any;
}

export interface ParsingConfigurationGroupResponse {
  folder: string;
  childCount: number;
}
