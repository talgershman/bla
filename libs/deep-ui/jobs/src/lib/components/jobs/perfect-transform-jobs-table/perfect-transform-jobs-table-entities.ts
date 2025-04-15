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
} from 'deep-ui/shared/components/src/lib/common';
import {
  etlJobStatusFormatter,
  getPerfectTransformJobFlowSteps,
  JobStatusEnum,
  PerfectTransformJob,
  PerfectTransformJobStepEnum,
  PerfectTransformRunTypes,
  stepPerfectTransformJobEnumFormatter,
} from 'deep-ui/shared/models';
import _isNil from 'lodash-es/isNil';
import _omitBy from 'lodash-es/omitBy';
import _startCase from 'lodash-es/startCase';

import {JobActions} from '../perfect-transform-jobs/perfect-transform-jobs-entities';

export const getPerfectTransformJobsTableColumns: (
  options: MeColumnsOptions,
) => MeColDef<PerfectTransformJob>[] = (options: MeColumnsOptions) =>
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
      field: 'dataSourceName',
      headerName: 'Data Source Name',
      filter: 'meAgTextFilterComponent',
      filterParams: CONTAINS_FILTER_PARAMS,
      cellRenderer: 'meAgTemplateRendererComponent',
    },
    {
      ...MODIFIED_BY_COL_DEF,
      field: 'fullName',
      headerName: 'Triggered By',
    },
    {
      field: 'runType',
      headerName: 'Action',
      filter: 'meAgSelectFilterComponent',
      filterParams: {
        filterOptions: ['equals'],
        buttons: ['clear'],
        filterPlaceholder: 'Action',
        values: PerfectTransformRunTypes.map((runType: string) => {
          return {
            id: runType,
            value: _startCase(runType.toLowerCase()),
          };
        }) as MeSelectOption[],
        meFormatter: (filterModel: Record<string, any>, colDef: MeColDef<any>) =>
          `${colDef.headerName}: ${_startCase(filterModel.filter.toLowerCase())}`,
      },
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        meFormatter: (rowData: ICellRendererParams) => _startCase(rowData.value.toLowerCase()),
      },
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
      field: 'sucessRate',
      headerName: 'Success Rate',
      sortable: false,
      filter: false,
      valueFormatter: (params) => {
        const metadataStepsSummary = params?.data?.metadataStepsSummary;
        if (!metadataStepsSummary) {
          return '-';
        }
        const publishStep =
          metadataStepsSummary[PerfectTransformJobStepEnum.PUBLISHING_DATA_SOURCE];
        const keys = Object.keys(publishStep || {});
        if (
          !keys.includes('passed') ||
          publishStep['passed'] === null ||
          !keys.includes('totalClips') ||
          publishStep['totalClips'] === null
        ) {
          return `-`;
        }
        if (publishStep.totalClips === 0) {
          return `0%`;
        }
        const percentage = (publishStep.passed / publishStep.totalClips) * 100;
        const integerPart = Math.floor(percentage);
        const fractionalPart = Math.floor((percentage % 1) * 10);

        return fractionalPart > 0 ? `${integerPart}.${fractionalPart}%` : `${integerPart}%`;
      },
    },
    {
      colId: 'currentStep',
      field: 'tags', // The tags value is a reference, meaning that any data passed by the template renderer will always reflect the latest updates. In contrast, the currentStep value is not a reference.
      headerName: 'Step',
      minWidth: 178,
      sortable: false,
      filter: 'meAgSelectFilterComponent',
      filterParams: {
        filterOptions: ['equals'],
        buttons: ['clear'],
        filterPlaceholder: 'Step',
        values: getPerfectTransformJobFlowSteps().map((flow: PerfectTransformJobStepEnum) => {
          return {
            id: flow,
            value: stepPerfectTransformJobEnumFormatter(flow),
          };
        }),
        meFormatter: (filterModel: Record<string, any>, colDef: MeColDef<any>) =>
          `${colDef.headerName}: ${stepPerfectTransformJobEnumFormatter(filterModel.filter)}`,
      },
      cellRenderer: 'meAgTemplateRendererComponent',
      cellRendererParams: {
        useColId: true,
        meCustomTemplate: options.templates.stepCell,
        meFormatter: (rowData: ICellRendererParams) =>
          stepPerfectTransformJobEnumFormatter(rowData.data.currentStep),
      },
    },
    {
      ...CREATED_AT_COL_DEF,
      headerName: 'Started At',
      sort: 'desc',
    },
    DURATION_COL_DEF,
    ...getTeamColDef('team', true),
    {
      ...CREATED_BY_USER_NAME_COL_DEF,
      field: 'userName',
    },
    getActionsColDef(options, {
      actions: [
        InfoTableAction,
        {
          title: 'Go To Data Source',
          id: JobActions.GO_TO_DATASOURCE,
          isDisabled: (job: PerfectTransformJob): boolean => {
            return job.status !== 'done';
          },
        },
        {
          ...DataRetentionTableAction,
          tooltip: (job: PerfectTransformJob): string => {
            if (!options.isIncludedInDeepGroupsOrIsAdmin(job, 'team')) {
              return `Job ${job.jobUuid} was created by a member of team ${job.team}, and only members of that team can modify the associated data retention.`;
            }
            return '';
          },
          isDisabled(job: PerfectTransformJob): boolean {
            //remove null values
            const dataRetention = _omitBy(job.dataRetention || {}, _isNil);
            return (
              !['done', 'failed'].includes(job.status) ||
              Object.keys(dataRetention).length === 0 ||
              !options.isIncludedInDeepGroupsOrIsAdmin(job, 'team')
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
  ] as MeColDef<PerfectTransformJob>[];
