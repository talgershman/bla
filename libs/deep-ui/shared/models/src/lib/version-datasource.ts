import {Datasource, FrameIndicatorsTypesEnum, MestDatasourceGroup} from './datasource';

export type DatasourceVersionStatusType = 'active' | 'inactive' | 'deleted' | 'deleting';

export interface VersionDataSource {
  id: number;
  status: DatasourceVersionStatusType;
  userFacingVersion: string;
  createdBy: string;
  createdByUsername: string;
  numberOfClips: number;
  jobId: string;
  etlId: number;
  perfectListIds: Array<number>;
  frameIndicators: Array<FrameIndicatorsTypesEnum>;
  description: string;
  tags: Array<string>;
  dataSourceId: string; //ref id of Data Source
  datasourceVirtualUrl: string;
}

export interface DataSourceSelection {
  dataSource: Datasource;
  version?: VersionDataSource;
  mestGroup?: MestDatasourceGroup;
  semanticGroup?: Partial<Datasource> & {childCount: number};
  type?: string;
}

export interface DatasourceDeselectData {
  id: string | number;
  level: number;
  type?: string;
}
