import {ICellRendererParams} from '@ag-grid-community/core';
import {
  CONTAINS_FILTER_PARAMS,
  EQUALS_FILTER_PARAMS,
  MeColDef,
  MeColumnsOptions,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {
  CREATED_AT_COL_DEF,
  CREATED_BY_COL_DEF,
  CREATED_BY_USER_NAME_COL_DEF,
  DESCRIPTION_COL_DEF,
  getTeamColDef,
  ID_COL_DEF,
  MODIFIED_AT_COL_DEF,
  TAGS_COL_DEF,
} from 'deep-ui/shared/components/src/lib/common';
import {ETL, EtlTypes} from 'deep-ui/shared/models';
import _startCase from 'lodash-es/startCase';

export const getSelectEtlTableColumns: (options: MeColumnsOptions) => MeColDef<ETL>[] = (
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
      filterParams: options.extra.reTriggerFlow ? EQUALS_FILTER_PARAMS : CONTAINS_FILTER_PARAMS,
      cellRendererParams: {
        showGroupFilterAsChip: true,
      },
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
      suppressFiltersToolPanel: true,
      suppressColumnsToolPanel: true,
      hide: true,
    },
    ...getTeamColDef('team', true),
    CREATED_BY_USER_NAME_COL_DEF,
    CREATED_BY_COL_DEF,
    {
      ...CREATED_AT_COL_DEF,
      hide: true,
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
  ] as MeColDef<ETL>[];
