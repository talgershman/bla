import {ICellRendererParams, ValueFormatterParams} from '@ag-grid-community/core';
import {
  CONTAINS_FILTER_PARAMS,
  MeColDef,
  MeColumnsOptions,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {
  CREATED_AT_COL_DEF,
  CREATED_BY_COL_DEF,
  CREATED_BY_USER_NAME_COL_DEF,
  DESCRIPTION_COL_DEF,
  DuplicateTableAction,
  getActionsColDef,
  getTeamColDef,
  ID_COL_DEF,
  InfoTableAction,
} from 'deep-ui/shared/components/src/lib/common';
import {ParsingConfiguration} from 'deep-ui/shared/models';

export const getParsingConfigurationTableColumns: (
  options: MeColumnsOptions,
) => MeColDef<ParsingConfiguration>[] = (options: MeColumnsOptions) =>
  [
    {
      ...ID_COL_DEF,
      suppressColumnsToolPanel: true,
    },
    {
      field: 'folder',
      rowGroup: true,
      suppressColumnsToolPanel: true,
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      hide: true,
    },
    {
      field: 'name',
      suppressColumnsToolPanel: true,
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meCustomTemplate: options.templates.nameCell,
      },
      hide: true,
    },
    ...getTeamColDef('team'),
    CREATED_BY_USER_NAME_COL_DEF,
    CREATED_BY_COL_DEF,
    {...CREATED_AT_COL_DEF, sort: 'desc'},
    DESCRIPTION_COL_DEF,
    getActionsColDef(options, {
      actions: [InfoTableAction, DuplicateTableAction],
      show: false,
    }),
    {
      field: 'config',
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meFormatter: (rowData: ICellRendererParams) => JSON.stringify(rowData.value, null, 2),
      },
      valueFormatter: (rowData: ValueFormatterParams) => JSON.stringify(rowData.value, null, 2),
      hide: true,
    },
  ] as MeColDef<ParsingConfiguration>[];
