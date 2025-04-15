import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  NgZone,
  Output,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {Params, Router} from '@angular/router';
import {MeAgTableActionItemEvent} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MePortalSrcDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {prettyPrintJson} from '@mobileye/material/src/lib/utils';
import {UntilDestroy} from '@ngneat/until-destroy';
import copy from 'copy-to-clipboard';
import {SnakeCaseKeys} from 'deep-ui/shared/common';
import {CommonTableActions, JobsDynamicViewEnum} from 'deep-ui/shared/components/src/lib/common';
import {SingleJobDataRetentionDialogComponent} from 'deep-ui/shared/components/src/lib/dialogs/single-job-data-retention-dialog';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {EtlJobWizardComponent} from 'deep-ui/shared/components/src/lib/wizards/etl-job-wizard';
import {DataRetentionService, DeepUtilService, EtlJobService} from 'deep-ui/shared/core';
import {environment} from 'deep-ui/shared/environments';
import {
  BaseJob,
  DataRetentionConfig,
  EtlJob,
  EtlJobFlowsEnum,
  ETLJobSnakeCase,
  ETLJobUnSupportedTypes,
  ReTriggerConfig,
} from 'deep-ui/shared/models';
import {debounce} from 'lodash-decorators/debounce';
import {firstValueFrom, Subject} from 'rxjs';
import {first} from 'rxjs/operators';

import {EtlJobsTableComponent} from '../etl-jobs-table/etl-jobs-table.component';
import {JobActions} from '../perfect-transform-jobs/perfect-transform-jobs-entities';
import {EtlJobActions} from './etl-jobs-entities';

@UntilDestroy()
@Component({
  selector: 'de-etl-jobs',
  templateUrl: './etl-jobs.component.html',
  styleUrls: ['./etl-jobs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EtlJobsTableComponent, MePortalSrcDirective, MeTooltipDirective, MatButtonModule],
})
export class EtlJobsComponent {
  @Input()
  selectedGroupButton: JobsDynamicViewEnum;

  @Input()
  queryParams: Params;

  @Output()
  filtersParamsChanged = new EventEmitter<Params>();

  private deepUtilService = inject(DeepUtilService);
  private etlJobService = inject(EtlJobService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private dataRetentionService = inject(DataRetentionService);
  private ngZone = inject(NgZone);

  triggerTableRefresh = new Subject<void>();

  reTriggerConfig: ReTriggerConfig = {
    disabledTypes: [ETLJobUnSupportedTypes.MAP_TO_DF],
  };

  disableNewJobs =
    !this.deepUtilService.isAdminUser() &&
    (environment.disableNewJobs || environment.disableDatasetRoutes);

  private snackBarService = inject(MeSnackbarService);

  async onActionClicked(action: MeAgTableActionItemEvent<EtlJob>): Promise<void> {
    if (action.id === CommonTableActions.REPORT_JOB) {
      this._openCreateTicket(action.selected);
    } else if (action.id === JobActions.GO_TO_DATASOURCE) {
      const dataSourceTableView = this._getDataSourceTableView(action.selected);
      this.router.navigate(['./data-lake/data-sources'], {
        queryParams: {
          view: dataSourceTableView,
          jobId: action.selected.jobUuid,
        },
      });
    } else if (action.id === CommonTableActions.DATA_RETENTION) {
      await this._openDataRetentionDialog(action.selected);
    } else if (action.id === EtlJobActions.RE_TRIGGER_JOB) {
      await this.openWizard(true, action.selected);
    } else if (action.id === EtlJobActions.COPY_ETL_PARAMS) {
      const prettyJson = prettyPrintJson(action.selected.userParams);
      copy(prettyJson);
      this.snackBarService.onCopyToClipboard();
    }
  }

  async onTableActionClickedRunInZone(action: MeAgTableActionItemEvent<EtlJob>): Promise<void> {
    await this.ngZone.run(this.onActionClicked.bind(this, action));
  }

  onFiltersParamsChanged(params: Params): void {
    if (this.selectedGroupButton !== JobsDynamicViewEnum.ETL) {
      return;
    }
    this.filtersParamsChanged.emit({...(params || {}), view: JobsDynamicViewEnum.ETL});
  }

  @debounce(200)
  async openWizard(isReTriggerFlow?: boolean, mainJob?: EtlJob): Promise<void> {
    await this._loadWizardModule();

    if (isReTriggerFlow) {
      await this._openWizardForReTrigger(mainJob);
    } else {
      this._openWizard();
    }
  }

  private _isOfficialDriveJob(job: EtlJob): boolean {
    return job.metadata?.officialDrives;
  }

  private _getDataSourceTableView(job: EtlJob): DataSourceDynamicViewEnum {
    const isOfficialDriveJob = this._isOfficialDriveJob(job);
    return isOfficialDriveJob
      ? DataSourceDynamicViewEnum.OFFICIAL_DRIVES
      : DataSourceDynamicViewEnum.ETL_RESULTS;
  }

  triggerRefresh(): void {
    this.triggerTableRefresh.next();
  }

  private _openCreateTicket(job: BaseJob): void {
    const url = this._generateJiraAddress(job);

    window.open(url, '_blank');
  }

  private _generateJiraAddress(job: BaseJob): string {
    const PRIORITY_MEDIUM = '4';
    const jobId = job.jobUuid;
    const SUMMARY_TEXT = `Issue+in+job: ${jobId}`;
    const COMPONENT_GENERAL = '35607';
    const ISSUE_TYPE_BUG = '1';
    const link = encodeURIComponent(
      `${window.location.origin}/jobs?view=${JobsDynamicViewEnum.ETL}&jobUuid=${job.jobUuid}`,
    );
    const JIRA_TICKET_URL = `https://jira.mobileye.com/secure/CreateIssueDetails!init.jspa?pid=19742&issuetype=[ISSUE_TYPE_PLACEHOLDER]&assignee=adisa&components=[COMPONENT_PLACEHOLDER]&priority=[PRIORITY_PLACEHOLDER]&summary=[SUMMARY_PLACEHOLDER]&description=[DESCRIPTION_PLACEHOLDER]`;

    const NEW_LINE = '%0A';

    const descriptionText = `Hello DEEP,${NEW_LINE}${NEW_LINE}Please investigate the following job at : ${link}${NEW_LINE}${NEW_LINE}Trigger by: ${job.fullName}${NEW_LINE}${NEW_LINE}Job status: ${job.status}${NEW_LINE}${NEW_LINE}[HERE FILL THE ISSUE YOU WISH TO BE INVESTIGATED] !!!`;

    const url = JIRA_TICKET_URL.replace('[ISSUE_TYPE_PLACEHOLDER]', ISSUE_TYPE_BUG)
      .replace('[PRIORITY_PLACEHOLDER]', PRIORITY_MEDIUM)
      .replace('[SUMMARY_PLACEHOLDER]', SUMMARY_TEXT)
      .replace('[COMPONENT_PLACEHOLDER]', COMPONENT_GENERAL)
      .replace('[DESCRIPTION_PLACEHOLDER]', descriptionText);

    return url;
  }

  private async _openWizardForReTrigger(selectJob: EtlJob): Promise<void> {
    const {mainJob, depJobs} = await this._retrieveRelatedJobs(selectJob);
    const dialogRef = this.dialog.open(EtlJobWizardComponent, {
      ...this._getDialogConfig(),
      data: {
        mainJob,
        depJobs,
      },
    });

    dialogRef.componentInstance.triggerNewJob.pipe(first()).subscribe(() => this.triggerRefresh());
  }

  private async _retrieveRelatedJobs(
    selectJob: EtlJob,
  ): Promise<{mainJob: SnakeCaseKeys<EtlJob>; depJobs: Array<SnakeCaseKeys<EtlJob>>}> {
    const depJobsRequests = this._generateDepJobsRequest(selectJob.metadata?.dependsOnJobs);
    const mainJobRequest = firstValueFrom(this.etlJobService.getSingle(selectJob.jobUuid));
    const [mainJob, depJobs] = await Promise.all([mainJobRequest, Promise.all(depJobsRequests)]);
    return {mainJob, depJobs};
  }

  private _generateDepJobsRequest(depJobs: Array<string>): Array<Promise<SnakeCaseKeys<EtlJob>>> {
    const requests: Array<Promise<SnakeCaseKeys<EtlJob>>> = [];
    for (const jobUuid of depJobs || []) {
      const request = firstValueFrom(this.etlJobService.getSingle(jobUuid));
      requests.push(request);
    }
    return requests;
  }

  private _openWizard(): void {
    const dialogRef = this.dialog.open(EtlJobWizardComponent, {
      ...this._getDialogConfig(),
      data: {},
    });

    dialogRef.componentInstance.triggerNewJob.pipe(first()).subscribe(() => this.triggerRefresh());
  }

  private _getDialogConfig(): any {
    return {
      width: '92rem',
      height: '94vh',
      maxHeight: '64rem',
      panelClass: 'dialog-panel-wizard',
      autoFocus: false,
      restoreFocus: false,
    };
  }

  private async _openDataRetentionDialog(job: EtlJob): Promise<void> {
    await this._loadDataRetentionDialog();
    const currentJob = await this._getJob(job);
    const config = this._getDataRetention(job);
    //need to get the most update info of job, as it table only refresh every 1 min
    const dialogRef = this.dialog.open(SingleJobDataRetentionDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.job = currentJob;
    dialogRef.componentInstance.config = config;
  }

  private _getDataRetention(job: EtlJob): DataRetentionConfig {
    switch (job.jobType) {
      case EtlJobFlowsEnum.CLIP_2_LOG:
        return this.dataRetentionService.getClip2LogDataRetentionConfig();
      case EtlJobFlowsEnum.VERSION_PERFECT:
        return this.dataRetentionService.getVersionPerfectDataRetentionConfig();
      case EtlJobFlowsEnum.SINGLE_VERSION:
        return this.dataRetentionService.getSingleVersionDataRetentionConfig();
      case EtlJobFlowsEnum.PC_RUN:
        return this.dataRetentionService.getPCRunDataRetentionConfig();
      case EtlJobFlowsEnum.METRO:
        return this.dataRetentionService.getMetroDataRetentionConfig();
      case EtlJobFlowsEnum.AV_PIPELINE:
        return this.dataRetentionService.getAVPipelineDataRetentionConfig();
      default: {
        // eslint-disable-next-line
        const exhaustiveCheck = job.jobType;
        throw new Error(`Unhandled _getDataRetention case: ${exhaustiveCheck}`);
      }
    }
  }

  private async _getJob(job: EtlJob): Promise<ETLJobSnakeCase> {
    return firstValueFrom(this.etlJobService.getSingle(job.jobUuid));
  }

  private async _loadWizardModule(): Promise<void> {
    import('deep-ui/shared/lazy-components/src/lib/etl-job-wizard-lazy');
  }

  private async _loadDataRetentionDialog(): Promise<void> {
    import('deep-ui/shared/lazy-components/src/lib/single-job-data-retention-dialog-lazy');
  }
}
