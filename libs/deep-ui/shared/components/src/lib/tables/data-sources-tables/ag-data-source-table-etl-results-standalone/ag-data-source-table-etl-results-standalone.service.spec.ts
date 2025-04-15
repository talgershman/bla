import {ServerSideRowGroupSelectionState} from '@ag-grid-community/core';
import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

import {AgDataSourceTableEtlResultsStandaloneService} from './ag-data-source-table-etl-results-standalone.service';

describe('AgDataSourceTableEtlResultsStandaloneService', () => {
  let spectator: SpectatorService<AgDataSourceTableEtlResultsStandaloneService>;

  const createService = createServiceFactory({
    service: AgDataSourceTableEtlResultsStandaloneService,
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should create', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('getSelectedSubGroupsAndDs', () => {
    it('should return empty array if event is falsy', () => {
      const result = spectator.service.getSelectedSubGroupsAndDs(null, null);

      expect(result).toEqual([]);
    });

    it('should return empty array if toggledNodes is empty or null', () => {
      const event: ServerSideRowGroupSelectionState = {
        toggledNodes: null,
      };
      const result = spectator.service.getSelectedSubGroupsAndDs(event, null);

      expect(result).toEqual([]);
    });

    it('should return selected subgroup state while its state has 1 member of toggledNodes', () => {
      const event: ServerSideRowGroupSelectionState = {
        toggledNodes: [
          {
            nodeId: 'mainGroup1',
            selectAllChildren: true,
            toggledNodes: [
              {
                nodeId: 'subGroup1',
                selectAllChildren: false,
                toggledNodes: [
                  {
                    nodeId: '1',
                  },
                ],
              },
            ],
          },
        ],
      };

      const gridApiMock = {
        getRowNode: () => null,
      } as any;

      const result = spectator.service.getSelectedSubGroupsAndDs(event, gridApiMock);

      expect(result.length).toBe(1);
      expect(result[0].nodeId).toBe('subGroup1');
    });

    it('should return selected subgroup while its state doesnt have toggledNodes', () => {
      const event: ServerSideRowGroupSelectionState = {
        toggledNodes: [
          {
            nodeId: 'mainGroup1',
            selectAllChildren: true,
          },
        ],
      };

      const gridApiMock = {
        getRowNode: () => ({
          id: 'mainGroup1',
          childStore: {
            getRowUsingDisplayIndex: (_: number) => ({id: 'subGroup1'}),
          },
        }),
      } as any;

      const result = spectator.service.getSelectedSubGroupsAndDs(event, gridApiMock);

      expect(result.length).toBe(1);
      expect(result[0].nodeId).toBe('subGroup1');
    });

    it('should return selected subgroups state while selectAllChildren of its state is false', () => {
      const event: ServerSideRowGroupSelectionState = {
        toggledNodes: [
          {
            nodeId: 'mainGroup1',
            selectAllChildren: false,
            toggledNodes: [
              {
                nodeId: 'subGroup1',
                selectAllChildren: true,
                toggledNodes: [
                  {
                    nodeId: '1',
                  },
                ],
              },
              {
                nodeId: 'subGroup2',
                selectAllChildren: false,
                toggledNodes: [
                  {
                    nodeId: '2',
                  },
                ],
              },
            ],
          },
        ],
      };

      const gridApiMock = {
        getRowNode: () => null,
      } as any;

      const result = spectator.service.getSelectedSubGroupsAndDs(event, gridApiMock);

      expect(result.length).toBe(2);
      expect(result[0].nodeId).toBe('subGroup1');
      expect(result[1].nodeId).toBe('subGroup2');
    });
  });
});
