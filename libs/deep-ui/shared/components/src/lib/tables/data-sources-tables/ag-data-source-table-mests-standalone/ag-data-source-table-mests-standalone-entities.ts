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
import {
  dateNow,
  formatDateFull,
  formatDateShortWithPermanent,
  getDateFromNow,
  getFutureDateFromNow,
  PERMANENT_DATE,
} from '@mobileye/material/src/lib/utils';
import {MeFormValidations} from '@mobileye/material/src/lib/validations';
import {
  CREATED_BY_COL_DEF,
  CREATED_BY_USER_NAME_COL_DEF,
  DataRetentionTableAction,
  getActionsColDef,
  getStatusColDef,
  getTeamColDef,
  ID_COL_DEF,
  InfoTableAction,
  RAW_DATA_OWNER_COL_DEF,
} from 'deep-ui/shared/components/src/lib/common';
import {
  DownloadClipListAction,
  GoToLinkTableAction,
  IshowURLAction,
  QueryTableAction,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {Datasource, DatasourceStatusType, MestDatasourceGroup} from 'deep-ui/shared/models';
import _startCase from 'lodash-es/startCase';

export const getMestsDatasourceTableColumns: (
  options: MeColumnsOptions,
) => MeColDef<Datasource>[] = (options: MeColumnsOptions) =>
  [
    {
      ...ID_COL_DEF,
      suppressColumnsToolPanel: true,
    },
    {
      field: 'jobId',
      colId: 'jobId',
      rowGroup: true,
      filter: 'meAgTextFilterComponent',
      filterParams: EQUALS_FILTER_PARAMS,
      suppressColumnsToolPanel: true,
      hide: true,
      cellRendererParams: {
        twin: 'jobIds',
      },
    },
    {
      field: 'name',
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      cellRenderer: 'meAgTemplateRendererComponent',
      suppressColumnsToolPanel: true,
      suppressFiltersToolPanel: true,
      hide: true,
    },
    ...getTeamColDef('team'),
    {
      field: 'expirationDate',
      headerName: 'Expires At',
      filter: 'meAgDateFilterComponent',
      filterParams: {
        filterOptions: ['inRange'],
        buttons: ['clear'],
        permanent: PERMANENT_DATE,
        dateOptions: [
          {
            maxDate: getFutureDateFromNow(1, 'years'),
            minDate: getDateFromNow(1, 'years'),
            startAt: dateNow(),
            title: 'Expired from',
            parameterName: 'expiredAtAfter',
          },
          {
            maxDate: getFutureDateFromNow(1, 'years'),
            minDate: getDateFromNow(1, 'years'),
            startAt: dateNow(),
            title: 'Expired until',
            parameterName: 'expiredAtBefore',
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
        meFormatter: getDateFormatter('Expired'),
      },
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meFormatter: (rowData: ICellRendererParams) => {
          return formatDateShortWithPermanent(rowData.value);
        },
      },
    },
    getStatusColDef(
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
          id: 'needs_sync',
        },
        {
          value: 'Updating',
          id: 'updating',
        },
        {
          value: 'Failed',
          id: 'failed',
        },
        {
          value: 'Frozen',
          id: 'frozen',
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
            case 'frozen':
              return `One of Datasource Perfect lists was deleted.
          This Datasource is disabled for update.
          You can still use this Datasource in Datasets.`;
            default:
              return '';
          }
        },
      },
    ),
    {
      field: 'numberOfClips',
      headerName: '# of Clips',
      filter: 'meAgNumberFilterComponent',
      filterParams: {
        filterOptions: [
          {
            displayKey: 'greaterThanOrEqual',
            displayName: 'Min. Clips',
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
          return rowData.value === 0 ? 'N/A' : rowData.value?.toLocaleString();
        },
      },
    },
    RAW_DATA_OWNER_COL_DEF,
    CREATED_BY_COL_DEF,
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
            return '';
          }
          return formatDateFull(rowData.value);
        },
      },
    },
    //todo: replace groupActions
    getActionsColDef(options, {
      actions: [
        InfoTableAction,
        QueryTableAction,
        GoToLinkTableAction,
        DownloadClipListAction,
        IshowURLAction,
      ],
      groupActions: {
        jobId: [
          {
            ...DataRetentionTableAction,
            excludeInSelectionMode: true,
            tooltip: (mestDatasourceGroup: MestDatasourceGroup) => {
              if (!options.isIncludedInDeepGroupsOrIsAdmin(mestDatasourceGroup, 'team')) {
                return `Job ${mestDatasourceGroup.jobId} was created by a member of team ${mestDatasourceGroup.team}, and only members of that team can modify the associated data retention.`;
              }
              return '';
            },
            isDisabled: (datasource: Datasource) =>
              !options.isIncludedInDeepGroupsOrIsAdmin(datasource, 'team'),
          },
        ],
      },
      show: options.showActions,
      selectionMode: options.selectionMode,
    }),
    CREATED_BY_USER_NAME_COL_DEF,
    {
      field: 'jobIds',
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      suppressColumnsToolPanel: true,
      suppressFiltersToolPanel: true,
      hide: true,
    },
    {
      field: 'etlId',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
    {
      field: 'datasourceversionSet',
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
      field: 'etlName',
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
  ] as MeColDef<Datasource>[];
