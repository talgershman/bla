import {BaseModel} from 'deep-ui/shared/common';

export type DatasetStatusType =
  | 'active'
  | 'updating'
  | 'inactive'
  | 'failed'
  | 'needs_sync'
  | 'deleting'
  | 'to_delete'
  | 'failed_to_delete';

export const DisallowedStatuesForDataRetention: Array<DatasetStatusType> = [
  'deleting',
  'to_delete',
  'failed_to_delete',
];

export type DatasetSourceTypes = 'dataset_client' | 'query_engine';
export interface Dataset extends BaseModel {
  id: number;
  name: string;
  team: string;
  description: string;
  numberOfClips: number;
  queryJson: any;
  queryString: string;
  pathOnS3: string;
  status: DatasetStatusType;
  allowJumpFile: boolean;
  expirationDate: string;
  source: DatasetSourceTypes;
  tags: Array<string>;
}

export type ValueComponentType =
  | 'integer'
  | 'double'
  | 'string'
  | 'list'
  | 'boolean'
  | 'array<string>'
  | 'free-list'
  | 'autocomplete'
  | 'null';
