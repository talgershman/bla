import {BaseModel} from 'deep-ui/shared/common';

import {VersionDataSource} from './version-datasource';

export type DatasourceStatusType =
  | 'active'
  | 'updating'
  | 'inactive'
  | 'frozen'
  | 'needs_sync'
  | 'failed'
  | 'creating'
  | 'failed_to_delete'
  | 'broken';

export type DataSourceTypes = 'clips' | 'itrks' | 'perfects' | 'simulator' | 'etl_results';

export const AllowedStatuesForQuery: Array<DatasourceStatusType> = [
  'active',
  'frozen',
  'needs_sync',
];

export const AllowedStatuesDatasetActions: Array<DatasourceStatusType> = [
  'active',
  'frozen',
  'needs_sync',
  'inactive',
];

export const AllowedStatuesForJobTrigger: Array<DatasourceStatusType> = [
  'active',
  'frozen',
  'needs_sync',
  'updating',
];

export enum FrameIndicatorsTypesEnum {
  frame_id = 'frame_id',
  frame = 'frame',
  gfi = 'gfi',
  relative = 'relative',
  grab_index = 'grab_index',
}

export const FrameIndicatorsTypesArr = Object.values(FrameIndicatorsTypesEnum);

export interface Datasource extends BaseModel {
  id: string;
  name: string;
  team: string;
  rawDataOwner: string;
  technology: string;
  dataType: DataSourceTypes;
  dataSubType: string;
  allowAggregation: boolean;
  allowedSubTypes: string[];
  status: DatasourceStatusType;
  etlId: number;
  numberOfClips: number;
  expirationDate: string;
  siblingsId: Array<string>;
  perfectListIds: Array<number>;
  jobIds: Array<string>;
  frameIndicators: Array<FrameIndicatorsTypesEnum>;
  versioned?: boolean;
  tags?: Array<string>;
  description?: string;
  datasourceversionSet?: Array<VersionDataSource>;
  latestUserVersion?: string; // same as userFacingVersion in VersionDataSource
  nickname?: string;
  datasourceVirtualUrl: string;
}

export interface MestDatasourceGroup {
  jobId: string;
  sampleDataSourceId: string;
  team: string;
  expirationDate: string | null;
  childCount: number;
}
