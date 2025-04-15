import {signal, WritableSignal} from '@angular/core';
import {createServiceFactory, SpectatorService} from '@ngneat/spectator';
import {Datasource} from 'deep-ui/shared/models';

import {AgDataSourceTableEtlResultsService} from './ag-data-source-table-etl-results.service';

describe('AgDataSourceTableEtlResultsService', () => {
  let spectator: SpectatorService<AgDataSourceTableEtlResultsService>;

  const createService = createServiceFactory({
    service: AgDataSourceTableEtlResultsService,
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should create', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('getDataSourcesJobIds', () => {
    it('should group data sources by job ID', () => {
      const dataSources: Datasource[] = [
        {jobIds: ['job1'], id: 'data1'} as unknown as Datasource,
        {jobIds: ['job2'], id: 'data2'} as unknown as Datasource,
        {jobIds: ['job1'], id: 'data3'} as unknown as Datasource,
      ];

      const result = spectator.service.getDataSourcesJobIds(dataSources);

      expect(result).toEqual([
        {jobId: 'job1', dataSources: [dataSources[0], dataSources[2]]},
        {jobId: 'job2', dataSources: [dataSources[1]]},
      ]);
    });

    it('should handle empty array of data sources', () => {
      const dataSources: Datasource[] = [];

      const result = spectator.service.getDataSourcesJobIds(dataSources);

      expect(result).toEqual([]);
    });
  });

  describe('getJobIdsUpdatedRowNodes', () => {
    it('should handle when state.selectAllChildren is true and state.toggledNodes is falsey', () => {
      const gridApiMock = {
        getRowNode: (id: string) => ({
          id,
        }),
      } as any;
      const tableState = {
        selectedRowsState: [
          {
            nodeId: 'subGroup1',
            selectAllChildren: true,
          },
        ],
      };

      const result = spectator.service.getJobIdsUpdatedRowNodes(
        gridApiMock,
        tableState.selectedRowsState,
      );

      expect(result).toEqual([{id: 'subGroup1'}] as any);
    });

    it('should handle when state.selectAllChildren is true and state.toggledNodes is not empty', () => {
      const gridApiMock = {
        getRowNode: (id: string) => {
          if (id === 'subGroup1') {
            return {
              id,
              data: {
                jobIds: ['job1', 'job2', 'job3'],
              },
            };
          } else if (id === 'child1') {
            return {
              id,
              data: {
                jobIds: ['job1'],
              },
            };
          } else {
            return {
              id,
              data: {
                jobIds: ['job2'],
              },
            };
          }
        },
      } as any;
      const tableState = {
        selectedRowsState: [
          {
            nodeId: 'subGroup1',
            selectAllChildren: true,
            toggledNodes: [{nodeId: 'child1'}, {nodeId: 'child2'}],
          },
        ],
      };

      const result = spectator.service.getJobIdsUpdatedRowNodes(
        gridApiMock,
        tableState.selectedRowsState,
      );

      expect(result).toEqual([
        {
          id: 'subGroup1',
          data: {
            jobIds: ['job3'],
          },
        },
      ] as any);
    });

    it('should handle when state.selectAllChildren is false', () => {
      const gridApiMock = {
        getRowNode: (id: string) => ({
          id,
        }),
      } as any;
      const tableState = {
        selectedRowsState: [
          {
            nodeId: 'subGroup1',
            selectAllChildren: false,
            toggledNodes: [{nodeId: 'child1'}, {nodeId: 'child2'}],
          },
        ],
      };

      const result = spectator.service.getJobIdsUpdatedRowNodes(
        gridApiMock,
        tableState.selectedRowsState,
      );

      expect(result).toEqual([{id: 'child1'}, {id: 'child2'}] as any);
    });
  });

  describe('getSelectedInMultipleSelection', () => {
    it('should handle when rowNodes array is empty', () => {
      const tableState: WritableSignal<any> = signal({
        rowNodes: [],
        hasMultipleSelections: false,
      });

      const result = spectator.service.getSelectedInMultipleSelection(tableState);

      expect(tableState().hasMultipleSelections).toBeFalse();
      expect(result).toBeNull();
    });

    it('should handle when rowNodes array contains more than one element', () => {
      const tableState: WritableSignal<any> = signal({
        rowNodes: [{id: 'row1'}, {id: 'row2'}],
        hasMultipleSelections: false,
      });

      const result = spectator.service.getSelectedInMultipleSelection(tableState);

      expect(tableState().hasMultipleSelections).toBeTrue();
      expect(result).toEqual({dataSource: null});
    });

    it('should handle when rowNodes array contains only one element and it has one subgroup with one DS', () => {
      const tableState: WritableSignal<any> = signal({
        rowNodes: [
          {
            id: 'subGroup1',
            allChildrenCount: 1,
            childStore: {
              getRowUsingDisplayIndex: (_) => ({data: {id: 'id-2'}}),
            },
          },
        ],
        hasMultipleSelections: false,
      });

      const result = spectator.service.getSelectedInMultipleSelection(tableState);

      expect(tableState().hasMultipleSelections).toBeFalse();
      expect(result).toEqual({dataSource: {id: 'id-2'} as unknown as Datasource});
    });

    it('should handle when rowNodes array contains only one element and it has one DS', () => {
      const tableState: WritableSignal<any> = signal({
        rowNodes: [{data: {id: 'ds-1'}}],
        hasMultipleSelections: false,
      });

      const result = spectator.service.getSelectedInMultipleSelection(tableState);

      expect(tableState().hasMultipleSelections).toBeFalse();
      expect(result).toEqual({dataSource: {id: 'ds-1'} as unknown as Datasource});
    });

    it('should handle when rowNodes array contains only one element and it has one subgroup with more than one DS', () => {
      const tableState: WritableSignal<any> = signal({
        rowNodes: [
          {
            allChildrenCount: 2,
            childStore: {
              getRowUsingDisplayIndex: () => ({isSelected: () => true, data: {id: 'ds-5'}}),
            },
          },
        ],
        hasMultipleSelections: false,
      });

      const result = spectator.service.getSelectedInMultipleSelection(tableState);

      expect(tableState().hasMultipleSelections).toBeTrue();
      expect(result).toEqual({dataSource: {id: 'ds-5'} as unknown as Datasource});
    });
  });
});
