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
  CREATED_BY_USER_NAME_COL_DEF,
  DataRetentionTableAction,
  DURATION_COL_DEF,
  FINISHED_AT_COL_DEF,
  getActionsColDef,
  getStatusColDef,
  getTeamColDef,
  InfoTableAction,
  MODIFIED_BY_COL_DEF,
  ReportJobTableAction,
  TAGS_COL_DEF,
} from 'deep-ui/shared/components/src/lib/common';
import {
  EtlJob,
  EtlJobFlowEnumFormatter,
  EtlJobFlowsEnum,
  etlJobStatusFormatter,
  EtlJobStepEnum,
  getEtlJobFlowTypes,
  getUnsupportedJobTypes,
  JobStatusEnum,
  ReTriggerConfig,
  stepEtlJobEnumFormatter,
} from 'deep-ui/shared/models';
import _isNil from 'lodash-es/isNil';
import _omitBy from 'lodash-es/omitBy';

import {EtlJobActions} from '../etl-jobs/etl-jobs-entities';
import {JobActions} from '../perfect-transform-jobs/perfect-transform-jobs-entities';

export const getEtlJobTableColumns: (options: MeColumnsOptions) => MeColDef<EtlJob>[] = (
  options: MeColumnsOptions,
) =>
  [
    {
      field: 'jobUuid',
      sortable: false,
      filter: 'meAgTextFilterComponent',
      filterParams: EQUALS_FILTER_PARAMS,
      hide: true,
    },
    {
      field: 'probeName',
      headerName: 'ETL Name',
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      lockPosition: true,
      suppressColumnsToolPanel: true,
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meCustomTemplate: options.templates.nameCell,
      },
    },
    {
      ...MODIFIED_BY_COL_DEF,
      field: 'fullName',
      headerName: 'Triggered By',
    },
    {
      field: 'jobType',
      headerName: 'Type',
      filter: 'meAgSelectFilterComponent',
      filterParams: {
        filterOptions: ['equals'],
        buttons: ['clear'],
        filterPlaceholder: 'Type',
        values: [...getEtlJobFlowTypes(), ...getUnsupportedJobTypes()].map(
          (flow: EtlJobFlowsEnum) => {
            return {
              id: flow,
              value: EtlJobFlowEnumFormatter(flow),
            };
          },
        ) as MeSelectOption[],
        meFormatter: (filterModel: Record<string, any>, colDef: MeColDef<any>) =>
          `${colDef.headerName}: ${EtlJobFlowEnumFormatter(filterModel.filter)}`,
      },
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meFormatter: (rowData: ICellRendererParams) => EtlJobFlowEnumFormatter(rowData.value),
      },
    },
    {
      field: 'outputPath',
      headerName: 'Output Path',
      sortable: false,
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      cellRenderer: 'meAgTemplateRendererComponent',
    },
    {
      ...TAGS_COL_DEF,
      sortable: false,
    },
    getStatusColDef(
      options,
      [
        {
          id: JobStatusEnum.IN_PROGRESS,
          value: etlJobStatusFormatter(JobStatusEnum.IN_PROGRESS),
        },
        {
          id: JobStatusEnum.DONE,
          value: etlJobStatusFormatter(JobStatusEnum.DONE),
        },
        {
          id: JobStatusEnum.FAIL,
          value: etlJobStatusFormatter(JobStatusEnum.FAIL),
        },
        {
          id: JobStatusEnum.STUCK,
          value: etlJobStatusFormatter(JobStatusEnum.STUCK),
        },
      ],
      {
        meFormatter: (rowData: ICellRendererParams) => etlJobStatusFormatter(rowData.value),
      },
    ),
    {
      colId: 'currentStep',
      field: 'tags', // The tags value is a reference, meaning that any data passed by the template renderer will always reflect the latest updates. In contrast, the currentStep value is not a reference.
      headerName: 'Step',
      sortable: false,
      filter: 'meAgSelectFilterComponent',
      filterParams: {
        filterOptions: ['equals'],
        buttons: ['clear'],
        filterPlaceholder: 'Step',
        values: [
          {
            id: EtlJobStepEnum.MEST,
            value: stepEtlJobEnumFormatter(EtlJobStepEnum.MEST),
          },
          {
            id: EtlJobStepEnum.PARSING,
            value: stepEtlJobEnumFormatter(EtlJobStepEnum.PARSING),
          },
          {
            id: EtlJobStepEnum.PROBE,
            value: stepEtlJobEnumFormatter(EtlJobStepEnum.PROBE),
          },
          {
            id: EtlJobStepEnum.REPORT,
            value: stepEtlJobEnumFormatter(EtlJobStepEnum.REPORT),
          },
        ],
        meFormatter: (filterModel: Record<string, any>, colDef: MeColDef<any>) =>
          `${colDef.headerName}: ${stepEtlJobEnumFormatter(filterModel.filter)}`,
      },
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        useColId: true,
        meCustomTemplate: options.templates.stepCell,
        meFormatter: (rowData: ICellRendererParams) =>
          rowData.data?.currentStep ? stepEtlJobEnumFormatter(rowData.data.currentStep) : 'MEST',
      },
    },
    {
      ...CREATED_AT_COL_DEF,
      headerName: 'Started At',
      sort: 'desc',
    },
    DURATION_COL_DEF,
    ...getTeamColDef('team', true, 'userName'),
    {
      ...CREATED_BY_USER_NAME_COL_DEF,
      field: 'userName',
    },
    getActionsColDef(options, {
      actions: [
        InfoTableAction,
        {
          title: 'Re-Trigger Job',
          id: EtlJobActions.RE_TRIGGER_JOB,
          tooltip: (job: EtlJob): string => {
            if (
              job.metadata?.officialDrives ||
              job.metadata?.dependsOnJobs?.length > 0 ||
              (options.extra as ReTriggerConfig)?.disabledTypes?.includes(job.jobType)
            ) {
              return 'Re-Trigger is not supported for this job type';
            }
            return '';
          },
          isDisabled(job: EtlJob): boolean {
            return (
              job.metadata?.dependsOnJobs?.length > 0 ||
              (options.extra as ReTriggerConfig)?.disabledTypes?.includes(job.jobType)
            );
          },
        },
        {
          title: 'Update Job',
          id: EtlJobActions.UPDATE_JOB,
          tooltip: (job: EtlJob): string => {
            if (!options.isIncludedInDeepGroupsOrIsAdmin(job, 'team')) {
              return `Job ${job.jobUuid} was created by a member of team ${job.team}, and only members of that team can modify the associated data retention.`;
            }
            return '';
          },
          isDisabled: (job: EtlJob): boolean =>
            !options.isIncludedInDeepGroupsOrIsAdmin(job, 'team'),
        },
        {
          title: 'Copy ETL params',
          id: EtlJobActions.COPY_ETL_PARAMS,
        },
        {
          ...DataRetentionTableAction,
          tooltip: (job: EtlJob): string => {
            if (job.metadata?.officialDrives) {
              return `Not supported for this job type`;
            }
            if (!options.isIncludedInDeepGroupsOrIsAdmin(job, 'team')) {
              return `Job ${job.jobUuid} was created by a member of team ${job.team}, and only members of that team can modify the associated data retention.`;
            }
            return '';
          },
          isDisabled: (job: EtlJob): boolean => {
            //remove null values
            const dataRetention = _omitBy(job.dataRetention || {}, _isNil);
            return (
              job.metadata?.officialDrives ||
              !['done', 'failed'].includes(job.status) ||
              Object.keys(dataRetention).length === 0 ||
              !options.isIncludedInDeepGroupsOrIsAdmin(job, 'team')
            );
          },
        },
        {
          title: 'Go To Data Source',
          id: JobActions.GO_TO_DATASOURCE,
          isDisabled: (job: EtlJob): boolean => {
            return (
              job.status !== 'done' ||
              (job.runType === 'data_creation' && !job.metadata?.createDatasourceFromParsedData)
            );
          },
        },
        ReportJobTableAction,
      ],
    }),
    {
      ...FINISHED_AT_COL_DEF,
      headerName: 'Finished At',
      sortable: false,
      hide: true,
    },
  ] as MeColDef<EtlJob>[];
