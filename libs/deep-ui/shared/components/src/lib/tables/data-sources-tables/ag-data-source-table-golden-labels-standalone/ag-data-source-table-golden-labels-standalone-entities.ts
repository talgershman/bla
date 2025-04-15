import {ICellRendererParams, IFilterOptionDef} from '@ag-grid-community/core';
import {
  ARRAY_CELL_FORMATTER,
  ARRAY_VALUE_FORMATTER,
  CONTAINS_FILTER_PARAMS,
  EQUALS_FILTER_PARAMS,
  MeColDef,
  MeColumnsOptions,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {getDateFormatter} from '@mobileye/material/src/lib/components/ag-table/services';
import {dateNow, formatDateFull, getDateFromNow} from '@mobileye/material/src/lib/utils';
import {MeFormValidations} from '@mobileye/material/src/lib/validations';
import {
  CREATED_BY_COL_DEF,
  CREATED_BY_USER_NAME_COL_DEF,
  DESCRIPTION_COL_DEF,
  getActionsColDef,
  getStatusColDef,
  InfoTableAction,
  TAGS_COL_DEF,
  TEAM_OUTER_FILTER,
} from 'deep-ui/shared/components/src/lib/common';
import {
  DownloadClipListAction,
  IshowURLAction,
  QueryTableAction,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {Datasource, DatasourceStatusType} from 'deep-ui/shared/models';
import _startCase from 'lodash-es/startCase';

export const getGoldenLabelsDatasourceTableColumns: (
  options: MeColumnsOptions,
) => MeColDef<Datasource>[] = (options: MeColumnsOptions) =>
  [
    {
      colId: 'id',
      field: 'id',
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
      field: 'columnGroup',
      colId: 'columnGroup',
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      suppressColumnsToolPanel: true,
      suppressFiltersToolPanel: true,
      hide: true,
    },
    TEAM_OUTER_FILTER,
    {
      colId: 'userTeam',
      field: 'team',
      filterParams: CONTAINS_FILTER_PARAMS,
      sortable: true,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        replaceToFilterKey: 'team',
        removeFilterKey: 'createdByUsername',
        meFormatter: (rowData: ICellRendererParams) =>
          rowData.node.group ? rowData.value : rowData.node.parent.data.team,
      },
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
            value: 'Needs Sync',
            id: 'needs_sync', //ask
          },
          {
            value: 'Updating',
            id: 'updating',
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
              default:
                return '';
            }
          },
        },
      ),
      width: 165,
      hide: !options.showActions,
    },
    {
      field: 'numberOfClips',
      width: 190,
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
      colId: 'tagsGroup',
      field: 'tags',
      rowGroup: true,
      sortable: false,
      suppressColumnsToolPanel: true,
      suppressFiltersToolPanel: true,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
      filter: 'meAgMultiChipsFilterComponent',
      cellRendererParams: {
        replaceToFilterKey: 'tags',
        removeFilterKey: 'tagsGroup',
      },
      filterParams: {
        filterOptions: ['multiContains'],
        buttons: ['clear'],
        filterPlaceholder: 'Tags',
      },
    },
    {
      ...TAGS_COL_DEF,
      hide: true,
      suppressColumnsToolPanel: true,
      width: 180,
      cellRendererParams: {
        meFormatter: (rowData: ICellRendererParams) => {
          return rowData.node.group ? '' : rowData.value;
        },
      },
    },
    DESCRIPTION_COL_DEF,
    CREATED_BY_COL_DEF,
    {
      field: 'updatedAt',
      width: 150,
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
    CREATED_BY_USER_NAME_COL_DEF,
    {
      field: 'allowAggregation',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
    {
      field: 'dataSubType',
      headerName: 'Sub Type',
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      hide: true,
    },
    {
      field: 'allowedSubTypes',
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
      field: 'frameIndicators',
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
      field: 'modifiedBy',
      filter: false,
      sortable: false,
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
      field: 'tableName',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
    {
      field: 'dbName',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
    {
      field: 'schemaChanges',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
    getActionsColDef(options, {
      actions: [InfoTableAction, QueryTableAction, DownloadClipListAction, IshowURLAction],
      groupActions: {
        id: [InfoTableAction, QueryTableAction, IshowURLAction],
      },
      show: options.showActions,
      selectionMode: options.selectionMode,
    }),
  ] as MeColDef<Datasource>[];
