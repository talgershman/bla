import {ICellRendererParams, IFilterOptionDef} from '@ag-grid-community/core';
import {
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
  getNameColDef,
  getTeamColDef,
  getTechnologyColDef,
  ID_COL_DEF,
  InfoTableAction,
  MODIFIED_AT_COL_DEF,
  TAGS_COL_DEF,
} from 'deep-ui/shared/components/src/lib/common';
import {ClipList, ClipListTypeEnum, clipListTypeEnumFormatter} from 'deep-ui/shared/models';

export const getClipListTableColumns: (options: MeColumnsOptions) => MeColDef<ClipList>[] = (
  options: MeColumnsOptions,
) =>
  [
    ID_COL_DEF,
    {
      ...getNameColDef(options),
      suppressColumnsToolPanel: true,
    },
    ...getTeamColDef('team'),
    CREATED_BY_USER_NAME_COL_DEF,
    CREATED_BY_COL_DEF,
    {
      field: 'type',
      filter: 'meAgSelectFilterComponent',
      filterParams: {
        filterOptions: ['equals'],
        buttons: ['clear'],
        filterPlaceholder: 'Type',
        values: [
          {
            value: clipListTypeEnumFormatter(ClipListTypeEnum.CLIP),
            id: ClipListTypeEnum.CLIP,
          },
          {
            value: clipListTypeEnumFormatter(ClipListTypeEnum.PLS_MDB),
            id: ClipListTypeEnum.PLS_MDB,
          },
          {
            value: clipListTypeEnumFormatter(ClipListTypeEnum.PLS_CUSTOM),
            id: ClipListTypeEnum.PLS_CUSTOM,
          },
          {
            value: clipListTypeEnumFormatter(ClipListTypeEnum.GENERIC),
            id: ClipListTypeEnum.GENERIC,
          },
        ] as MeSelectOption[],
      },
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meFormatter: (rowData: ICellRendererParams) => clipListTypeEnumFormatter(rowData.value),
      },
    },
    {
      field: 'camera',
      sortable: true,
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      cellRenderer: 'meAgTemplateRendererComponent',
    },
    {
      field: 'brain',
      sortable: true,
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      cellRenderer: 'meAgTemplateRendererComponent',
    },
    {
      field: 'count',
      headerName: 'No. Clips',
      filter: 'meAgNumberFilterComponent',
      filterParams: {
        filterOptions: [
          {
            displayKey: 'lessThanOrEqual',
            displayName: 'Max Clips',
          },
        ],
        buttons: ['clear'],
        meFormatter: (filterModel: Record<string, any>, colDef: MeColDef<any>) =>
          `${(colDef.filterParams.filterOptions[0] as IFilterOptionDef).displayName}: ${
            filterModel.filter
          }`,
      },
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meFormatter: (rowData: ICellRendererParams) =>
          rowData.value === 0 ? 'N/A' : rowData.value?.toLocaleString(),
      },
    },
    getTechnologyColDef(options, true),
    TAGS_COL_DEF,
    DESCRIPTION_COL_DEF,
    MODIFIED_AT_COL_DEF,
    {...CREATED_AT_COL_DEF, hide: true},
    getActionsColDef(options, {
      actions: [InfoTableAction, DuplicateTableAction, DownloadTableAction],
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
    {
      field: 's3Path',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
  ] as MeColDef<ClipList>[];
