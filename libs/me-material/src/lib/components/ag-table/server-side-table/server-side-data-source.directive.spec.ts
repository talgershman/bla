import {IServerSideGetRowsParams, IServerSideGetRowsRequest} from '@ag-grid-community/core';
import {
  CONTAINS_FILTER_PARAMS,
  EQUALS_FILTER_PARAMS,
  MULTI_FILTER_PARAMS,
} from '@mobileye/material/src/lib/components/ag-table/entities';

import {MeServerSideDataSourceDirective} from './server-side-data-source.directive';

class TempTest extends MeServerSideDataSourceDirective {
  getRows(_: IServerSideGetRowsParams): void {}
  destroy(): void {}
}

const params = {
  api: {
    getColumnDefs: (): any => {
      return [
        {
          field: 'jobId',
          filterParams: EQUALS_FILTER_PARAMS,
          hide: true,
          cellRendererParams: {
            twin: 'jobIds',
          },
        },
        {
          field: 'id',
          filterParams: EQUALS_FILTER_PARAMS,
          hide: true,
        },
        {
          field: 'ids',
          cellRendererParams: {
            aliasFor: 'id',
          },
          filterParams: MULTI_FILTER_PARAMS,
          suppressFiltersToolPanel: true,
          hide: true,
        },
        {
          field: 'jobIds',
          filterParams: CONTAINS_FILTER_PARAMS,
          suppressFiltersToolPanel: true,
          hide: true,
        },
      ];
    },
  },
};

describe('MeServerSideDataSourceDirective', () => {
  it('should create an instance', () => {
    const directive = new TempTest();

    expect(directive).toBeTruthy();
  });

  describe('serializeRequest', () => {
    it('should handle twins & aliasFor', () => {
      const request: IServerSideGetRowsRequest = {
        startRow: 0,
        endRow: 25,
        rowGroupCols: [
          {
            id: 'id',
            displayName: 'Id',
            field: 'id',
          },
        ],
        valueCols: [],
        pivotCols: [],
        pivotMode: false,
        groupKeys: [],
        filterModel: {
          ids: {
            filterType: 'text',
            type: 'multi',
            filter: '6229857b-fb2c-4ea3-a886-05ab5acd6ab7',
          },
          jobId: {
            filterType: 'text',
            type: 'equals',
            filter: 'fc8b0156-fed7-11ed-9c6b-0a58a9feac02',
          },
        },
        sortModel: [
          {
            sort: 'desc',
            colId: 'updatedAt',
          },
          {
            sort: 'desc',
            colId: 'createdAt',
          },
        ],
      };

      const directive = new TempTest();

      const result = directive.serializeRequest(params as any, request);

      expect(result.filterModel).toEqual({
        jobId: {
          filterType: 'text',
          type: 'equals',
          filter: 'fc8b0156-fed7-11ed-9c6b-0a58a9feac02',
        },
        id: {
          filterType: 'text',
          type: 'multi',
          filter: ['6229857b-fb2c-4ea3-a886-05ab5acd6ab7'],
        },
        jobIds: {
          type: 'contains',
          filterType: 'text',
          filter: 'fc8b0156-fed7-11ed-9c6b-0a58a9feac02',
        },
      });
    });

    it('should remove twin', () => {
      const request: IServerSideGetRowsRequest = {
        startRow: 0,
        endRow: 25,
        rowGroupCols: [
          {
            id: 'id',
            displayName: 'Id',
            field: 'id',
          },
        ],
        valueCols: [],
        pivotCols: [],
        pivotMode: false,
        groupKeys: [],
        filterModel: {
          ids: {
            filterType: 'text',
            type: 'multi',
            filter: '6229857b-fb2c-4ea3-a886-05ab5acd6ab7',
          },
          jobIds: {
            type: 'contains',
            filterType: 'text',
            filter: 'fc8b0156-fed7-11ed-9c6b-0a58a9feac02',
          },
        },
        sortModel: [
          {
            sort: 'desc',
            colId: 'updatedAt',
          },
          {
            sort: 'desc',
            colId: 'createdAt',
          },
        ],
      };

      const directive = new TempTest();

      const result = directive.serializeRequest(params as any, request);

      expect(result.filterModel).toEqual({
        id: {
          filterType: 'text',
          type: 'multi',
          filter: ['6229857b-fb2c-4ea3-a886-05ab5acd6ab7'],
        },
      });
    });
  });
});
