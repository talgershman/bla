import {
  ARRAY_CELL_FORMATTER,
  ARRAY_VALUE_FORMATTER,
  CONTAINS_FILTER_PARAMS,
  MeColDef,
  MeColumnsOptions,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {
  CREATED_AT_COL_DEF,
  CREATED_BY_COL_DEF,
  CREATED_BY_USER_NAME_COL_DEF,
  DESCRIPTION_COL_DEF,
  DownloadTableAction,
  DuplicateTableAction,
  getActionsColDef,
  getStatusColDef,
  getTeamColDef,
  getTechnologyColDef,
  ID_COL_DEF,
  InfoTableAction,
  MODIFIED_AT_COL_DEF,
  PERFECT_LIST_COUNT_COL_DEF,
  PerfectListStatusTypes,
  RAW_DATA_OWNER_COL_DEF,
  TAGS_COL_DEF,
} from 'deep-ui/shared/components/src/lib/common';
import {environment} from 'deep-ui/shared/environments';
import {PerfectList, PerfectListTypeEnum} from 'deep-ui/shared/models';
import _startCase from 'lodash-es/startCase';

export enum PerfectListCustomActions {
  SYNC_PERFECT_LIST = 'sync-perfect-list',
}

export const getPerfectListTableColumns: (options: MeColumnsOptions) => MeColDef<PerfectList>[] = (
  options: MeColumnsOptions,
) =>
  [
    ID_COL_DEF,
    {
      field: 'name',
      minWidth: 150,
      width: 600,
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      suppressColumnsToolPanel: true,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meCustomTemplate: options.templates.nameCell,
      },
    },
    ...getTeamColDef('team'),
    getStatusColDef(
      options,
      PerfectListStatusTypes.map((status) => {
        return {
          value: _startCase(status),
          id: status,
        };
      }) as MeSelectOption[],
    ),
    CREATED_BY_USER_NAME_COL_DEF,
    CREATED_BY_COL_DEF,
    RAW_DATA_OWNER_COL_DEF,
    getTechnologyColDef(options, false),
    PERFECT_LIST_COUNT_COL_DEF,
    TAGS_COL_DEF,
    DESCRIPTION_COL_DEF,
    MODIFIED_AT_COL_DEF,
    getActionsColDef(options, {
      actions: [
        InfoTableAction,
        {
          ...DownloadTableAction,
          isDisabled: (item: PerfectList): boolean => item.status !== 'active',
        },
        DuplicateTableAction,
        {
          id: PerfectListCustomActions.SYNC_PERFECT_LIST,
          title: 'Sync',
          tooltip: () => {
            return "Keeps your list up-to-date, scans and adds new perfects. Disabled for type : 'File'";
          },
          isDisabled: (item: PerfectList): boolean =>
            environment.disableDatasetRoutes ||
            item.type === PerfectListTypeEnum.FILE ||
            item.status === 'in_progress' ||
            item.status === 'updating' ||
            item.status === 'syncing',
        },
      ],
      show: false,
    }),
    {
      field: 'modifiedBy',
      headerName: 'Modified By',
      filter: 'meAgUserAutocompleteFilterComponent',
      filterParams: {
        filterOptions: ['equals'],
        buttons: ['clear'],
        filterPlaceholder: 'Creator',
      },
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
    {
      field: 'modifiedByUsername',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
    {...CREATED_AT_COL_DEF, hide: true},
    {
      field: 'type',
      filter: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
    {
      field: 'locationsOnMobileye',
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
      field: 'perfectSearchUrl',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
    {
      field: 's3Path',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
  ] as MeColDef<PerfectList>[];
