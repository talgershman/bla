import {ICellRendererParams, IFilterOptionDef} from '@ag-grid-community/core';
import {
  CONTAINS_FILTER_PARAMS,
  EQUALS_FILTER_PARAMS,
  MeColDef,
  MeColumnsOptions,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {getDateFormatter} from '@mobileye/material/src/lib/components/ag-table/services';
import {dateNow, formatDateFull, getDateFromNow} from '@mobileye/material/src/lib/utils';
import {MeFormValidations} from '@mobileye/material/src/lib/validations';
import {getActionsColDef, InfoTableAction} from 'deep-ui/shared/components/src/lib/common';
import {
  DownloadClipListAction,
  QueryTableAction,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {Datasource} from 'deep-ui/shared/models';
import _startCase from 'lodash-es/startCase';

export const getSimulatorDatasourceTableColumns: (
  options: MeColumnsOptions,
) => MeColDef<Datasource>[] = (options: MeColumnsOptions) =>
  [
    {
      field: 'id',
      colId: 'id',
      rowGroup: true,
      suppressColumnsToolPanel: true,
      filter: 'meAgTextFilterComponent',
      filterParams: EQUALS_FILTER_PARAMS,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meCustomTemplate: options.templates.classifierCell,
      },
      hide: true,
    },
    {
      field: 'name',
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      suppressColumnsToolPanel: true,
      suppressFiltersToolPanel: true,
      hide: true,
    },
    {
      field: 'status',
      suppressFiltersToolPanel: true,
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meCustomTemplate: options.templates.statusCell,
        meFormatter: (rowData: ICellRendererParams) => _startCase(rowData.value),
      },
    },
    {
      field: 'numberOfClips',
      headerName: '# of Clips',
      filter: 'meAgNumberFilterComponent',
      filterParams: {
        filterOptions: [
          {
            displayKey: 'greaterThanOrEqual',
            displayName: 'Min # of Clip',
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
    {
      field: 'updatedAt',
      headerName: 'Updated At',
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
            title: 'Updated from',
            parameterName: 'updatedAtAfter',
          },
          {
            maxDate: dateNow(),
            minDate: getDateFromNow(1, 'years'),
            startAt: dateNow(),
            title: 'Updated until',
            parameterName: 'updatedAtBefore',
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
        meFormatter: getDateFormatter('Updated'),
      },
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meFormatter: (rowData: ICellRendererParams) => {
          if (rowData.node.group) {
            return formatDateFull(rowData.value);
          }
          return formatDateFull(rowData.node.data.createdAt);
        },
      },
    },
    getActionsColDef(options, {
      actions: [InfoTableAction, QueryTableAction, DownloadClipListAction],
      groupActions: {id: [InfoTableAction, QueryTableAction, DownloadClipListAction]},
      show: options.showActions,
      selectionMode: options.selectionMode,
    }),
  ] as MeColDef<Datasource>[];
