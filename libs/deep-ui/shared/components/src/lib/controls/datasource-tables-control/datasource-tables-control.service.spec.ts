import {createServiceFactory, SpectatorService} from '@ngneat/spectator';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {
  Datasource,
  DatasourceDeselectData,
  DataSourceSelection,
  VersionDataSource,
} from 'deep-ui/shared/models';

import {DatasourceTablesControlService} from './datasource-tables-control.service';

describe('DatasourceTablesControlService', () => {
  let spectator: SpectatorService<DatasourceTablesControlService>;
  const createService = createServiceFactory({
    service: DatasourceTablesControlService,
    mocks: [],
  });

  beforeEach(() => (spectator = createService()));

  it('should filter selections by type when there are no selections', () => {
    const selections: Array<DataSourceSelection> = [];
    const type = DataSourceDynamicViewEnum.PERFECTS;
    const currentValue: Array<DataSourceSelection> = [
      {type: type, dataSource: {id: '1', name: 'name-1'} as Datasource},
      {type: DataSourceDynamicViewEnum.MESTS, dataSource: {id: '2'} as Datasource},
    ];

    const result = spectator.service.getSelectionsAfterChange(selections, type, currentValue);

    expect(result).toEqual([currentValue[1]]);
  });

  it('should update selections when new selections are added', () => {
    const selections: Array<DataSourceSelection> = [
      {
        type: DataSourceDynamicViewEnum.PERFECTS,
        dataSource: {id: '1', name: 'name-1'} as Datasource,
      },
      {
        type: DataSourceDynamicViewEnum.PERFECTS,
        dataSource: {id: '2', name: 'name-2'} as Datasource,
      },
    ];
    const type = DataSourceDynamicViewEnum.PERFECTS;
    const currentValue: Array<DataSourceSelection> = [
      {
        type: DataSourceDynamicViewEnum.PERFECTS,
        dataSource: {id: '1', name: 'name-1'} as Datasource,
      },
    ];

    const result = spectator.service.getSelectionsAfterChange(selections, type, currentValue);

    expect(result).toEqual([
      {
        type: DataSourceDynamicViewEnum.PERFECTS,
        dataSource: {id: '1', name: 'name-1'} as Datasource,
      },
      {
        type: DataSourceDynamicViewEnum.PERFECTS,
        dataSource: {id: '2', name: 'name-2'} as Datasource,
      },
    ]);
  });

  it('should return empty array when removing the only selection', () => {
    const removedChipData: DatasourceDeselectData = {
      id: '1',
      level: 0,
      type: DataSourceDynamicViewEnum.PERFECTS,
    };
    const currentValue: Array<DataSourceSelection> = [
      {
        type: DataSourceDynamicViewEnum.PERFECTS,
        dataSource: {id: '1', name: 'name-1'} as Datasource,
      },
    ];

    const result = spectator.service.getCurrentSelectedDataSources(removedChipData, currentValue);

    expect(result).toEqual([]);
  });

  it('should remove a selection based on chip data', () => {
    const removedChipData: DatasourceDeselectData = {
      id: '1',
      level: 0,
      type: DataSourceDynamicViewEnum.PERFECTS,
    };
    const currentValue: Array<DataSourceSelection> = [
      {
        type: DataSourceDynamicViewEnum.PERFECTS,
        dataSource: {id: '1', name: 'name-1'} as Datasource,
      },
      {type: DataSourceDynamicViewEnum.MESTS, dataSource: {id: '2', name: 'name-2'} as Datasource},
    ];

    const result = spectator.service.getCurrentSelectedDataSources(removedChipData, currentValue);

    expect(result).toEqual([currentValue[1]]);
  });

  it('should update last selection if versions match', () => {
    const selections: Array<DataSourceSelection> = [
      {
        type: DataSourceDynamicViewEnum.PERFECTS,
        dataSource: {id: '1', name: 'name-1', latestUserVersion: 'v1'} as Datasource,
        version: {id: 1238, userFacingVersion: 'v1'} as VersionDataSource,
      },
    ];
    const type = DataSourceDynamicViewEnum.PERFECTS;
    const currentValue: Array<DataSourceSelection> = [
      {
        type: DataSourceDynamicViewEnum.PERFECTS,
        dataSource: {id: '1', name: 'name-1', latestUserVersion: 'v1'} as Datasource,
        version: {id: 1238, userFacingVersion: 'v1'} as VersionDataSource,
      },
    ];

    const result = spectator.service.getSelectionsAfterChange(selections, type, currentValue);

    expect(result).toEqual(selections);
  });
});
