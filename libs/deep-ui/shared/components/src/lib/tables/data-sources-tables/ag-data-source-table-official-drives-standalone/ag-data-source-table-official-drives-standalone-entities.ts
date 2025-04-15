import {ICellRendererParams} from '@ag-grid-community/core';
import {
  CONTAINS_FILTER_PARAMS,
  EQUALS_FILTER_PARAMS,
  MeColDef,
  MeColumnsOptions,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {
  CREATED_AT_COL_DEF,
  getActionsColDef,
  getStatusColDef,
  ID_COL_DEF,
  InfoTableAction,
} from 'deep-ui/shared/components/src/lib/common';
import {
  GoToLinkTableAction,
  IshowURLAction,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {Datasource, DatasourceStatusType} from 'deep-ui/shared/models';
import _startCase from 'lodash-es/startCase';

export const getOfficialDrivesDatasourceTableColumns: (
  options: MeColumnsOptions,
) => MeColDef<Datasource>[] = (options: MeColumnsOptions) =>
  [
    {
      field: 'drive',
      colId: 'nickname',
      flex: 1,
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      suppressColumnsToolPanel: true,
      hide: true,
    },
    {
      ...ID_COL_DEF,
      suppressColumnsToolPanel: true,
    },
    {
      field: 'groupByColumn',
      filter: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meCustomTemplate: options.templates.classifierCell,
      },
      suppressColumnsToolPanel: true,
      hide: true,
    },
    {
      field: 'jobId',
      rowGroup: true,
      filter: 'meAgTextFilterComponent',
      filterParams: EQUALS_FILTER_PARAMS,
      suppressColumnsToolPanel: true,
      hide: true,
      cellRendererParams: {
        twin: 'jobIds',
      },
    },
    {
      field: 'jobIds',
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      suppressColumnsToolPanel: true,
      suppressFiltersToolPanel: true,
      hide: true,
    },
    {
      ...getStatusColDef(
        options,
        [
          {
            value: 'Active',
            id: 'active',
          },
          {
            value: 'Creating',
            id: 'creating',
          },
          {
            value: 'Failed',
            id: 'failed',
          },
        ],
        {
          meCustomTemplate: options.templates.statusCell,
          meFormatter: (rowData: ICellRendererParams) => _startCase(rowData.value),
          tooltip: (rowData: ICellRendererParams): string => {
            if (rowData.node.group) {
              return '';
            }
            const value = rowData.node.data;
            const status = value.status as DatasourceStatusType;
            switch (status) {
              case 'needs_sync':
                return `One of Datasource Perfect lists is outdated`;
              case 'inactive':
                return `This Datasource was deleted and can't be used`;
              case 'frozen':
                return `One of Datasource Perfect lists was deleted.
          This Datasource is disabled for update.
          You can still use this Datasource in Datasets.`;
              default:
                return '';
            }
          },
        },
      ),
      flex: 1,
    },
    {
      ...CREATED_AT_COL_DEF,
      flex: 1,
      suppressColumnsToolPanel: true,
    },
    getActionsColDef(options, {
      actions: [InfoTableAction, GoToLinkTableAction, IshowURLAction],
      show: false,
      selectionMode: options.selectionMode,
    }),
  ] as MeColDef<Datasource>[];
