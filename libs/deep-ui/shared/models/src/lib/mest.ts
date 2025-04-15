import {BaseModel} from 'deep-ui/shared/common';

export interface MestParams {
  key: string;
  value?: string;
}

export interface MEST extends BaseModel {
  id: number;
  group: string;
  nickname: string;
  executables: string[];
  libs: string[];
  brainLibs: string[];
  args: string;
  params: MestParams[];
}
