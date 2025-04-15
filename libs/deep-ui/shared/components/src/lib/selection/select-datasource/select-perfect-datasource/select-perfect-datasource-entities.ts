import {ICellRendererParams, IFilterOptionDef} from '@ag-grid-community/core';
import {
  ARRAY_CELL_FORMATTER,
  ARRAY_VALUE_FORMATTER,
  CONTAINS_FILTER_PARAMS,
  EQUALS_FILTER_PARAMS,
  MeColDef,
  MeColumnsOptions,
  MULTI_FILTER_PARAMS,
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
  DESCRIPTION_COL_DEF,
  getStatusColDef,
  TAGS_COL_DEF,
  TEAM_OUTER_FILTER,
} from 'deep-ui/shared/components/src/lib/common';
import {Datasource, DatasourceStatusType, VersionDataSource} from 'deep-ui/shared/models';
import _startCase from 'lodash-es/startCase';

export const getSelectPerfectsDatasourceTableColumns: (
  options: MeColumnsOptions,
) => MeColDef<Datasource | VersionDataSource>[] = (options: MeColumnsOptions) =>
  [
    {
      field: 'id',
      rowGroup: true,
      suppressColumnsToolPanel: true,
      filter: 'meAgTextFilterComponent',
      filterParams: EQUALS_FILTER_PARAMS,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meCustomTemplate: options.templates.nameCell,
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
            value: 'Failed To Delete',
            id: 'failed_to_delete',
          },
          {
            value: 'Broken',
            id: 'broken',
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
      width: 165,
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
      ...TAGS_COL_DEF,
      width: 180,
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
      field: 'technology',
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      width: 180,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meFormatter: (rowData: ICellRendererParams) =>
          _startCase(rowData.node.group ? rowData.value : rowData.node.parent.data.technology),
      },
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
      field: 'expirationDate',
      headerName: 'Expires At',
      filter: 'meAgDateFilterComponent',
      minWidth: 178,
      hide: true,
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
          if (rowData.node.group) {
            return formatDateShortWithPermanent(rowData.value);
          }
          return formatDateShortWithPermanent(rowData.value);
        },
      },
      headerComponentParams: {
        infoTooltip: 'The expiration date applies on all data source versions',
      },
    },
    {
      field: 'dataType',
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      hide: true,
    },
    {
      field: 'jobId',
      filter: 'meAgTextFilterComponent',
      filterParams: EQUALS_FILTER_PARAMS,
      hide: true,
      cellRendererParams: {
        twin: 'jobIds',
      },
    },
    {
      field: 'ids',
      cellRendererParams: {
        aliasFor: 'id',
      },
      filterParams: MULTI_FILTER_PARAMS,
      suppressColumnsToolPanel: true,
      suppressFiltersToolPanel: true,
      hide: true,
    },
    {
      field: 'jobIds',
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      suppressColumnsToolPanel: true,
      suppressFiltersToolPanel: true,
      hide: true,
    },
    {
      field: 'probeId',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
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
      field: 'allowAggregation',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
    {
      field: 'versioned',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
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
      field: 'perfectListIds',
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
      field: 'latestUserVersion',
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
      field: 'partition',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
    {
      field: 'indexBy',
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
  ] as MeColDef<Datasource | VersionDataSource>[];
