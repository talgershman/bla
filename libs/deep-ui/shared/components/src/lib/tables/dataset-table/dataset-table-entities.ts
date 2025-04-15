import {ICellRendererParams, IFilterOptionDef} from '@ag-grid-community/core';
import {
  ARRAY_CELL_FORMATTER,
  ARRAY_VALUE_FORMATTER,
  CONTAINS_FILTER_PARAMS,
  MeColDef,
  MeColumnsOptions,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {getDateFormatter} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {
  dateNow,
  formatDateShortWithPermanent,
  getDateFromNow,
  getFutureDateFromNow,
  PERMANENT_DATE,
} from '@mobileye/material/src/lib/utils';
import {MeFormValidations} from '@mobileye/material/src/lib/validations';
import {
  CREATED_AT_COL_DEF,
  CREATED_BY_COL_DEF,
  CREATED_BY_USER_NAME_COL_DEF,
  DataRetentionTableAction,
  DESCRIPTION_COL_DEF,
  DuplicateTableAction,
  getActionsColDef,
  getStatusColDef,
  getTeamColDef,
  ID_COL_DEF,
  InfoTableAction,
  MODIFIED_AT_COL_DEF,
  MODIFIED_BY_COL_DEF,
  StatusTypes,
  TAGS_COL_DEF,
} from 'deep-ui/shared/components/src/lib/common';
import {
  AllowedStatuesDatasetActions,
  Dataset,
  DatasourceStatusType,
  DisallowedStatuesForDataRetention,
  FrameIndicatorsTypesArr,
} from 'deep-ui/shared/models';
import _startCase from 'lodash-es/startCase';

export enum DatasetCustomActions {
  COPY_S3_PATH = 'copy-s3-path',
  DOWNLOAD_CLIP_LIST = 'download-clip-list',
  DOWNLOAD_JUMP_FILE = 'jump-file',
}

export const getDatasetTableColumns: (options: MeColumnsOptions) => MeColDef<Dataset>[] = (
  options: MeColumnsOptions,
) =>
  [
    ID_COL_DEF,
    {
      field: 'name',
      minWidth: 420,
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
      StatusTypes.map((status) => {
        return {
          value: _startCase(status),
          id: status,
        };
      }) as MeSelectOption[],
    ),
    TAGS_COL_DEF,
    CREATED_BY_USER_NAME_COL_DEF,
    CREATED_BY_COL_DEF,
    {
      field: 'numberOfClips',
      headerName: 'No. Clips',
      width: 170,
      filter: 'meAgNumberFilterComponent',
      filterParams: {
        filterOptions: [
          {
            displayKey: 'greaterThanOrEqual',
            displayName: 'Min Clips',
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
      field: 'expirationDate',
      headerName: 'Expires At',
      filter: 'meAgDateFilterComponent',
      minWidth: 178,
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
        meFormatter: (rowData: ICellRendererParams) => formatDateShortWithPermanent(rowData.value),
      },
      headerComponentParams: {
        infoTooltip: 'After the expiration date is exceeded, DEEP will delete the Dataset.',
      },
    },
    DESCRIPTION_COL_DEF,
    MODIFIED_BY_COL_DEF,
    MODIFIED_AT_COL_DEF,
    getActionsColDef(options, {
      actions: [
        InfoTableAction,
        {
          ...DataRetentionTableAction,
          tooltip: (dataset: Dataset) => {
            if (DisallowedStatuesForDataRetention.includes(dataset.status)) {
              return 'Update data retention is disabled for this dataset status';
            }
            if (!options.isIncludedInDeepGroupsOrIsAdmin(dataset, 'team')) {
              return `Dataset ${dataset.name} was created by a member of team ${dataset.team}, and only members of that team can modify the associated data retention.`;
            }
            return '';
          },
          isDisabled: (dataset: Dataset) =>
            DisallowedStatuesForDataRetention.includes(dataset.status) ||
            !options.isIncludedInDeepGroupsOrIsAdmin(dataset, 'team'),
        },
        {
          id: DatasetCustomActions.COPY_S3_PATH,
          title: 'Copy S3 Path',
          tooltip: (dataset: Dataset) => {
            if (!AllowedStatuesDatasetActions.includes(dataset.status as DatasourceStatusType)) {
              return 'Copy s3 path is disabled for this dataset status';
            }
            return '';
          },
          isDisabled: (dataset: Dataset) =>
            !AllowedStatuesDatasetActions.includes(dataset.status as DatasourceStatusType),
        },
        {
          id: DatasetCustomActions.DOWNLOAD_CLIP_LIST,
          title: 'Download Clip List',
          tooltip: (dataset: Dataset) => {
            if (!AllowedStatuesDatasetActions.includes(dataset.status as DatasourceStatusType)) {
              return 'Download clip list is disabled for this dataset status';
            }
            return '';
          },
          isDisabled: (dataset: Dataset) =>
            !AllowedStatuesDatasetActions.includes(dataset.status as DatasourceStatusType),
        },
        {
          id: DatasetCustomActions.DOWNLOAD_JUMP_FILE,
          title: 'Jump File',
          tooltip: (dataset: Dataset) => {
            if (!dataset.allowJumpFile) {
              return `Jump file is allowed only on queries that have one of the columns: ${FrameIndicatorsTypesArr.join(
                ', ',
              )}`;
            }
            if (!AllowedStatuesDatasetActions.includes(dataset.status as DatasourceStatusType)) {
              return 'Jump file is disabled for this dataset status';
            }
            return '';
          },
          isDisabled: (dataset: Dataset) =>
            !dataset.allowJumpFile ||
            !AllowedStatuesDatasetActions.includes(dataset.status as DatasourceStatusType),
        },
        DuplicateTableAction,
      ],
    }),
    {
      ...CREATED_AT_COL_DEF,
      hide: true,
    },
    {
      field: 'pathOnS3',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
    {
      field: 'queryString',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
    {
      field: 'queryJson',
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
      field: 'modifiedByUsername',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
    {
      field: 'source',
      filter: false,
      sortable: false,
      cellRenderer: 'meAgTemplateRendererComponent',
      hide: true,
    },
  ] as MeColDef<Dataset>[];
