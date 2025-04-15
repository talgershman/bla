import {ICellRendererParams, IFilterOptionDef, ITextFilterParams} from '@ag-grid-community/core';
import {
  CONTAINS_FILTER_PARAMS,
  EQUALS_FILTER_PARAMS,
  MeColDef,
  MeColumnsOptions,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {getDateFormatter} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {
  dateNow,
  formatDateFull,
  getDateFromNow,
  secondsToTimeFormatter,
} from '@mobileye/material/src/lib/utils';
import {MeFormValidations} from '@mobileye/material/src/lib/validations';
import _startCase from 'lodash-es/startCase';

export const getTeamColDef = (
  field: 'team' | 'group',
  hideTeamColumn?: boolean,
  removeFilterKeyProperty?: string,
): Array<MeColDef<any>> => {
  return [
    {
      ...TEAM_COL_DEF,
      field: field,
      hide: hideTeamColumn,
      cellRendererParams: {
        replaceToFilterKey: field,
        removeFilterKey: removeFilterKeyProperty || 'createdByUsername',
      },
    },
    {
      ...TEAM_OUTER_FILTER,
      field: field,
    },
  ];
};

export const TEAM_COL_DEF: MeColDef<any> = {
  colId: 'userTeam',
  field: 'team',
  headerName: 'Team',
  filter: 'meAgTextFilterComponent',
  filterParams: CONTAINS_FILTER_PARAMS,
  sortable: true,
  cellRenderer: 'meAgTemplateRendererComponent',
  cellRendererParams: {
    replaceToFilterKey: 'team',
    removeFilterKey: 'createdByUsername',
  },
};

export const TEAM_OUTER_FILTER: MeColDef<any> = {
  field: 'team',
  filter: 'meAgMultiChipsFilterComponent',
  filterParams: {
    filterOptions: ['multi'],
  },
  suppressColumnsToolPanel: true,
  suppressFiltersToolPanel: true,
  hide: true,
  lockVisible: true,
};

export const TAGS_COL_DEF: MeColDef<any> = {
  field: 'tags',
  sortable: true,
  filter: 'meAgMultiChipsFilterComponent',
  filterParams: {
    filterOptions: ['multiContains'],
    buttons: ['clear'],
    filterPlaceholder: 'Tags',
  },
  cellRenderer: 'meAgTemplateRendererComponent',
  valueFormatter: (_) => '',
};

export const DESCRIPTION_COL_DEF: MeColDef<any> = {
  field: 'description',
  sortable: true,
  filter: 'meAgTextFilterComponent',
  filterParams: CONTAINS_FILTER_PARAMS,
  cellRenderer: 'meAgTemplateRendererComponent',
};

export const ID_COL_DEF: MeColDef<any> = {
  field: 'id',
  filter: 'meAgTextFilterComponent',
  filterParams: EQUALS_FILTER_PARAMS,
  hide: true,
};

export const getNameColDef: (options: MeColumnsOptions) => MeColDef<any> = (
  options: MeColumnsOptions,
) => ({
  field: 'name',
  minWidth: 150,
  width: 600,
  filter: 'meAgTextFilterComponent',
  filterParams: CONTAINS_FILTER_PARAMS,
  cellRenderer: 'meAgTemplateRendererComponent',
  cellRendererParams: {
    meCustomTemplate: options?.templates?.nameCell,
  },
});

export const MODIFIED_AT_COL_DEF: MeColDef<any> = {
  field: 'modifiedAt',
  headerName: 'Modified',
  sort: 'desc',
  filter: 'meAgDateFilterComponent',
  filterParams: {
    filterOptions: ['inRange'],
    buttons: ['clear'],
    dateOptions: [
      {
        maxDate: dateNow(),
        minDate: getDateFromNow(1, 'years'),
        startAt: getDateFromNow(7, 'days'),
        title: 'Modified from',
        parameterName: 'modifiedAtAfter',
      },
      {
        maxDate: dateNow(),
        minDate: getDateFromNow(1, 'years'),
        startAt: dateNow(),
        title: 'Modified until',
        parameterName: 'modifiedAtBefore',
      },
    ],
    validations: [
      {
        injectFormGroup: false,
        name: 'compareDatesValidator',
        message: `Invalid date range`,
        validator: MeFormValidations.compareFormArrayDatesValidator(),
      },
    ],
    meFormatter: getDateFormatter('Modified'),
  },
  cellRenderer: 'meAgTemplateRendererComponent',
  cellRendererParams: {
    meFormatter: (rowData: ICellRendererParams) => formatDateFull(rowData.value),
  },
};

export const MODIFIED_BY_COL_DEF: MeColDef<any> = {
  field: 'modifiedBy',
  headerName: 'Modified By',
  filter: 'meAgUserAutocompleteFilterComponent',
  filterParams: {
    filterOptions: ['equals'],
    buttons: ['clear'],
    filterPlaceholder: 'Creator',
  } as ITextFilterParams,
  cellRenderer: 'meAgTemplateRendererComponent',
};

export const DURATION_COL_DEF: MeColDef<any> = {
  field: 'duration',
  headerName: 'Total Run Time',
  filter: false,
  cellRenderer: 'meAgTemplateRendererComponent',
  cellRendererParams: {
    meFormatter: (rowData: ICellRendererParams) => secondsToTimeFormatter(rowData.value),
  },
};

export const FINISHED_AT_COL_DEF: MeColDef<any> = {
  field: 'finishedAt',
  headerName: 'Finished',
  filter: 'meAgDateFilterComponent',
  filterParams: {
    filterOptions: ['inRange'],
    buttons: ['clear'],
    dateOptions: [
      {
        maxDate: dateNow(),
        minDate: getDateFromNow(1, 'years'),
        startAt: getDateFromNow(7, 'days'),
        title: 'Finished from',
        parameterName: 'finishedAtAfter',
      },
      {
        maxDate: dateNow(),
        minDate: getDateFromNow(1, 'years'),
        startAt: dateNow(),
        title: 'Finished until',
        parameterName: 'finishedAtBefore',
      },
    ],
    validations: [
      {
        injectFormGroup: false,
        name: 'compareDatesValidator',
        message: `Invalid date range`,
        validator: MeFormValidations.compareFormArrayDatesValidator(),
      },
    ],
    meFormatter: getDateFormatter('Finished'),
  },
  cellRenderer: 'meAgTemplateRendererComponent',
  cellRendererParams: {
    meFormatter: (rowData: ICellRendererParams) => formatDateFull(rowData.value),
  },
};

export const CREATED_AT_COL_DEF: MeColDef<any> = {
  field: 'createdAt',
  headerName: 'Created',
  filter: 'meAgDateFilterComponent',
  filterParams: {
    filterOptions: ['inRange'],
    buttons: ['clear'],
    dateOptions: [
      {
        maxDate: dateNow(),
        minDate: getDateFromNow(1, 'years'),
        startAt: getDateFromNow(7, 'days'),
        title: 'Created from',
        parameterName: 'createdAtAfter',
      },
      {
        maxDate: dateNow(),
        minDate: getDateFromNow(1, 'years'),
        startAt: dateNow(),
        title: 'Created until',
        parameterName: 'createdAtBefore',
      },
    ],
    validations: [
      {
        injectFormGroup: false,
        name: 'compareDatesValidator',
        message: `Invalid date range`,
        validator: MeFormValidations.compareFormArrayDatesValidator(),
      },
    ],
    meFormatter: getDateFormatter('Created'),
  },
  cellRenderer: 'meAgTemplateRendererComponent',
  cellRendererParams: {
    meFormatter: (rowData: ICellRendererParams) => formatDateFull(rowData.value),
  },
};

export const CREATED_BY_USER_NAME_COL_DEF: MeColDef<any> = {
  field: 'createdByUsername',
  suppressFiltersToolPanel: true,
  filterParams: {
    maxNumConditions: 1,
  },
  cellRenderer: 'meAgTemplateRendererComponent',
  hide: true,
};

export const CREATED_BY_COL_DEF: MeColDef<any> = {
  field: 'createdBy',
  headerName: 'Creator',
  filter: 'meAgUserAutocompleteFilterComponent',
  filterParams: {
    filterOptions: ['equals'],
    buttons: ['clear'],
    filterPlaceholder: 'Creator',
  },
  cellRenderer: 'meAgTemplateRendererComponent',
};

export const RAW_DATA_OWNER_COL_DEF: MeColDef<any> = {
  field: 'rawDataOwner',
  headerName: 'Raw Data Owner',
  filter: 'meAgTextFilterComponent',
  filterParams: CONTAINS_FILTER_PARAMS,
  cellRenderer: 'meAgTemplateRendererComponent',
  cellRendererParams: {
    meFormatter: (rowData: ICellRendererParams) => _startCase(rowData.value),
  },
};

export const getStatusColDef: (
  options: MeColumnsOptions,
  values: Array<MeSelectOption>,
  additionalCellRendererParams?: Record<string, any>,
) => MeColDef<any> = (
  options: MeColumnsOptions,
  values: Array<MeSelectOption>,
  additionalCellRendererParams?: Record<string, any>,
) => ({
  field: 'status',
  filter: 'meAgSelectFilterComponent',
  filterParams: {
    filterOptions: ['equals'],
    buttons: ['clear'],
    filterPlaceholder: 'Type',
    values,
  },
  cellRenderer: 'meAgTemplateRendererComponent',
  cellRendererParams: {
    meCustomTemplate: options.templates.statusCell,
    meFormatter: (rowData: ICellRendererParams) => _startCase(rowData.value),
    ...(additionalCellRendererParams || {}),
  },
});

export const getTechnologyColDef: (options: MeColumnsOptions, hide: boolean) => MeColDef<any> = (
  options: MeColumnsOptions,
  hide: boolean,
) => ({
  field: 'technology',
  filter: 'meAgSelectFilterComponent',
  filterParams: {
    filterOptions: ['equals'],
    buttons: ['clear'],
    filterPlaceholder: 'Technology',
    values: options.selectOptions?.technology,
  },
  cellRenderer: 'meAgTemplateRendererComponent',
  hide,
});

export const getActionsColDef: (
  options: MeColumnsOptions,
  cellRendererParams: any,
) => MeColDef<any> = (options: MeColumnsOptions, cellRendererParams: any) => ({
  field: 'actions',
  suppressSizeToFit: true,
  suppressColumnsToolPanel: true,
  headerName: '',
  width: 40,
  minWidth: 40,
  pinned: 'right',
  resizable: false,
  lockPinned: true,
  lockPosition: true,
  lockVisible: true,
  filter: false,
  sortable: false,
  cellRenderer: 'meAgActionsCellComponent',
  cellRendererParams,
  hide: !options.showActions,
});

export const PERFECT_LIST_COUNT_COL_DEF: MeColDef<any> = {
  field: 'count',
  headerName: 'No. Perfects',
  filter: 'meAgNumberFilterComponent',
  filterParams: {
    filterOptions: [
      {
        displayKey: 'lessThanOrEqual',
        displayName: 'Max Perfects',
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
    meFormatter: (rowData: ICellRendererParams) => {
      if (rowData.node.group) {
        return '';
      }
      return rowData.value ? rowData.value?.toLocaleString() : '0';
    },
  },
};
