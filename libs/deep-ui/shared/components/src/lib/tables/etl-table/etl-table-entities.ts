import {ICellRendererParams} from '@ag-grid-community/core';
import {
  CONTAINS_FILTER_PARAMS,
  MeColDef,
  MeColumnsOptions,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {formatDateFullOrReturnBlank} from '@mobileye/material/src/lib/utils';
import {
  CREATED_AT_COL_DEF,
  CREATED_BY_COL_DEF,
  CREATED_BY_USER_NAME_COL_DEF,
  DESCRIPTION_COL_DEF,
  getActionsColDef,
  getTeamColDef,
  ID_COL_DEF,
  InfoTableAction,
  MODIFIED_AT_COL_DEF,
  TAGS_COL_DEF,
} from 'deep-ui/shared/components/src/lib/common';
import {ETL, EtlTypes} from 'deep-ui/shared/models';
import _startCase from 'lodash-es/startCase';

export enum EtlCustomActions {
  COPY_PARAMS = 'copy-params',
}

export const getEtlTableColumns: (options: MeColumnsOptions) => MeColDef<ETL>[] = (
  options: MeColumnsOptions,
) =>
  [
    {
      ...ID_COL_DEF,
      suppressColumnsToolPanel: true,
    },
    {
      field: 'name',
      rowGroup: true,
      suppressColumnsToolPanel: true,
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      hide: true,
    },
    {
      field: 'version',
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      suppressColumnsToolPanel: true,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meCustomTemplate: options.templates.nameCell,
      },
      hide: true,
    },
    {
      field: 'type',
      filter: 'meAgSelectFilterComponent',
      filterParams: {
        filterOptions: ['equals'],
        buttons: ['clear'],
        filterPlaceholder: 'Type',
        values: EtlTypes.map(
          (type: string) =>
            ({
              value: _startCase(type),
              id: type,
            }) as MeSelectOption,
        ),
        meFormatter: (filterModel: Record<string, any>, colDef: MeColDef<any>) =>
          `${_startCase(colDef.field)}: ${_startCase(filterModel.filter)}`,
      },
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meFormatter: (rowData: ICellRendererParams) => _startCase(rowData.value),
      },
    },
    ...getTeamColDef('team'),
    CREATED_BY_USER_NAME_COL_DEF,
    CREATED_BY_COL_DEF,
    {
      ...CREATED_AT_COL_DEF,
      cellRendererParams: {
        meFormatter: (rowData: ICellRendererParams) => formatDateFullOrReturnBlank(rowData.value),
      },
    },
    TAGS_COL_DEF,
    DESCRIPTION_COL_DEF,
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
    },
    MODIFIED_AT_COL_DEF,
    getActionsColDef(options, {
      actions: [
        InfoTableAction,
        {
          title: _startCase(EtlCustomActions.COPY_PARAMS),
          id: EtlCustomActions.COPY_PARAMS,
        },
      ],
      show: false,
    }),
  ] as MeColDef<ETL>[];
