import {
  ARRAY_CELL_FORMATTER,
  ARRAY_VALUE_FORMATTER,
  CONTAINS_FILTER_PARAMS,
  MeAgTableActionItem,
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
  SelectMestItem,
} from 'deep-ui/shared/components/src/lib/common';

export const OPEN_MEST_FORM_TABLE_ACTION = 'open_mest_form';
export const ModifyTemporaryTableAction: MeAgTableActionItem<any> = {
  title: 'Modify temporary',
  id: OPEN_MEST_FORM_TABLE_ACTION,
};

export const getMestTableColumns: (options: MeColumnsOptions) => MeColDef<SelectMestItem>[] = (
  options: MeColumnsOptions,
) =>
  [
    {
      ...ID_COL_DEF,
      suppressColumnsToolPanel: true,
    },
    {
      field: 'nickname',
      headerName: 'Template Name',
      width: 260,
      minWidth: 55,
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      cellRenderer: 'meAgTemplateRendererComponent',
      suppressColumnsToolPanel: true,
      headerComponentParams: {
        showNumberOfSelections: true,
      },
      cellRendererParams: {
        meCustomTemplate: options?.templates?.templateNameCellTempRef,
      },
    },
    ...getTeamColDef('group', true),
    {
      ...CREATED_BY_COL_DEF,
      width: 150,
      suppressSizeToFit: true,
      hide: !!globalThis.jasmine, // in testing not all columns are visible ( clip-list ), so hide this to ensure that all column are visible.
    },
    {
      ...CREATED_AT_COL_DEF,
      width: 150,
      suppressSizeToFit: true,
      hide: !!globalThis.jasmine, // in testing not all columns are visible ( clip-list ), so hide this to ensure that all column are visible.
    },
    {
      field: 'rootPath',
      sortable: false,
      flex: 2,
      suppressColumnsToolPanel: true,
      suppressSizeToFit: true,
      filter: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meCustomTemplate: options?.templates?.rootPathCell,
      },
    },
    {
      field: 'mestOutputsNickname',
      headerName: 'Nickname (Optional)',
      sortable: false,
      flex: 2,
      hide: true,
      suppressSizeToFit: true,
      filter: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meCustomTemplate: options?.templates?.nicknameCell,
      },
    },
    {
      field: 'mestSyncLocalDirectory',
      headerName: 'Sync MEST Results (Optional)',
      sortable: false,
      flex: 2,
      hide: true,
      suppressSizeToFit: true,
      filter: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meCustomTemplate: options?.templates?.localOutputCell,
      },
    },
    {
      field: 'isMain',
      headerName: 'Main Version',
      width: 80,
      minWidth: 80,
      suppressColumnsToolPanel: true,
      sortable: false,
      filter: false,
      hide: !options?.overrideColumns?.includes('isMain'),
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meCustomTemplate: options?.templates?.isMainCell,
      },
    },
    {
      field: 'clipList',
      headerName: 'Clip List',
      width: 260,
      minWidth: 260,
      suppressColumnsToolPanel: true,
      sortable: false,
      filter: false,
      hide: !options?.overrideColumns?.includes('clipList'),
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meCustomTemplate: options?.templates?.clipListCell,
      },
    },
    getActionsColDef(options, {
      actions: [DuplicateTableAction, ModifyTemporaryTableAction],
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
  ] as MeColDef<SelectMestItem>[];
