import {
  ARRAY_CELL_FORMATTER,
  ARRAY_VALUE_FORMATTER,
  CONTAINS_FILTER_PARAMS,
  MeColDef,
  MeColumnsOptions,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {
  CREATED_AT_COL_DEF,
  CREATED_BY_COL_DEF,
  CREATED_BY_USER_NAME_COL_DEF,
  DuplicateTableAction,
  getActionsColDef,
  getTeamColDef,
  ID_COL_DEF,
  InfoTableAction,
  MODIFIED_AT_COL_DEF,
  MODIFIED_BY_COL_DEF,
} from 'deep-ui/shared/components/src/lib/common';
import {MEST} from 'deep-ui/shared/models';

export const getMestTableColumns: (options: MeColumnsOptions) => MeColDef<MEST>[] = (
  options: MeColumnsOptions,
) =>
  [
    ID_COL_DEF,
    {
      field: 'nickname',
      headerName: 'Template Name',
      width: 305,
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      suppressColumnsToolPanel: true,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meCustomTemplate: options.templates.nameCell,
      },
    },
    ...getTeamColDef('group'),
    CREATED_BY_COL_DEF,
    CREATED_AT_COL_DEF,
    MODIFIED_BY_COL_DEF,
    MODIFIED_AT_COL_DEF,
    getActionsColDef(options, {
      actions: [InfoTableAction, DuplicateTableAction],
      show: false,
    }),
    {
      field: 'executables',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meFormatter: ARRAY_CELL_FORMATTER,
      },
      valueFormatter: ARRAY_VALUE_FORMATTER,
      hide: true,
    },
    {
      field: 'libs',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meFormatter: ARRAY_CELL_FORMATTER,
      },
      valueFormatter: ARRAY_VALUE_FORMATTER,
      hide: true,
    },
    {
      field: 'brainLibs',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meFormatter: ARRAY_CELL_FORMATTER,
      },
      valueFormatter: ARRAY_VALUE_FORMATTER,
      hide: true,
    },
    {
      field: 'params',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meFormatter: ARRAY_CELL_FORMATTER,
      },
      valueFormatter: ARRAY_VALUE_FORMATTER,
      hide: true,
    },
    {
      field: 'args',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
    CREATED_BY_USER_NAME_COL_DEF,
    {
      field: 'modifiedByUsername',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
  ] as MeColDef<MEST>[];
