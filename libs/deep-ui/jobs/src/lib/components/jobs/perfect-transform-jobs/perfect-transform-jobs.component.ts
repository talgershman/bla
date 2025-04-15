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
import {MatIconModule} from '@angular/material/icon';
import {Params, Router} from '@angular/router';
import {MeAgTableActionItemEvent} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MePortalSrcDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy} from '@ngneat/until-destroy';
import {CommonTableActions, JobsDynamicViewEnum} from 'deep-ui/shared/components/src/lib/common';
import {MultipleJobDataRetentionDialogComponent} from 'deep-ui/shared/components/src/lib/dialogs/multiple-job-data-retention-dialog';
import {DataSourceTableBaseService} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {PerfectTransformWizardComponent} from 'deep-ui/shared/components/src/lib/wizards/perfect-transform-wizard';
import {
  DataRetentionService,
  DatasourceService,
  DeepUtilService,
  PerfectTransformJobsService,
} from 'deep-ui/shared/core';
import {environment} from 'deep-ui/shared/environments';
import {BaseJob, PerfectTransformJob, PerfectTransformJobSnakeCase} from 'deep-ui/shared/models';
import {debounce} from 'lodash-decorators/debounce';
import {firstValueFrom, Subject} from 'rxjs';
import {first} from 'rxjs/operators';

import {PerfectTransformJobsTableComponent} from '../perfect-transform-jobs-table/perfect-transform-jobs-table.component';
import {JobActions} from './perfect-transform-jobs-entities';

@UntilDestroy()
@Component({
  selector: 'de-perfect-transform-jobs',
  templateUrl: './perfect-transform-jobs.component.html',
  styleUrls: ['./perfect-transform-jobs.scss'],
  providers: [DataSourceTableBaseService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PerfectTransformJobsTableComponent,
    MatButtonModule,
    MatIconModule,
    MeTooltipDirective,
    MePortalSrcDirective,
  ],
})
export class PerfectTransformJobsComponent {
  @Input()
  selectedGroupButton: JobsDynamicViewEnum;

  @Input()
  queryParams: Params;

  @Output()
  filtersParamsChanged = new EventEmitter<Params>();

  private deepUtilService = inject(DeepUtilService);
  private perfectTransformJobsService = inject(PerfectTransformJobsService);
  private dataSourceService = inject(DatasourceService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private dataRetentionService = inject(DataRetentionService);
  private ngZone = inject(NgZone);

  triggerTableRefresh = new Subject<void>();

  disableNewJobs =
    !this.deepUtilService.isAdminUser() &&
    (environment.disableNewJobs || environment.disableDatasetRoutes);

  @debounce(200)
  async openWizard(): Promise<void> {
    await this._loadWizardModule();
    const dataRetentionInfoObj = this.dataRetentionService.getPerfectTransformDataRetentionConfig();
    const dialogRef = this.dialog.open(PerfectTransformWizardComponent, {
      width: '92rem',
      height: '90vh',
      maxHeight: '64rem',
      panelClass: 'dialog-panel-wizard',
      autoFocus: false,
      restoreFocus: false,
      data: {
        dataRetentionInfoObj,
        showSelectFlowStep: true,
      },
    });
    dialogRef.componentInstance.submitJobFired.pipe(first()).subscribe(() => this.triggerRefresh());
  }

  async onActionClicked(action: MeAgTableActionItemEvent<PerfectTransformJob>): Promise<void> {
    if (action.id === CommonTableActions.REPORT_JOB) {
      this._openCreateTicket(action.selected);
    } else if (action.id === JobActions.GO_TO_DATASOURCE) {
      this.router.navigate(['./data-lake/data-sources'], {
        queryParams: {
          view: DataSourceDynamicViewEnum.PERFECTS,
          ids: action.selected.dataSourceUuids.join(';'),
          jobId: action.selected.jobUuid,
        },
      });
    } else if (action.id === CommonTableActions.DATA_RETENTION) {
      await this._openDataRetentionDialog(action.selected);
    }
  }

  async onTableActionClickedRunInZone(
    action: MeAgTableActionItemEvent<PerfectTransformJob>,
  ): Promise<void> {
    await this.ngZone.run(this.onActionClicked.bind(this, action));
  }

  onFiltersParamsChanged(params: Params): void {
    if (this.selectedGroupButton !== JobsDynamicViewEnum.PERFECT_TRANSFORM) {
      return;
    }
    this.filtersParamsChanged.emit({
      ...(params || {}),
      view: JobsDynamicViewEnum.PERFECT_TRANSFORM,
    });
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
    const SUMMARY_TEXT = `Investigate+perfect+transform+job: ${jobId}`;
    const COMPONENT_GENERAL = '35607';
    const ISSUE_TYPE_BUG = '1';
    const link = encodeURIComponent(
      `${window.location.origin}/jobs?view=${JobsDynamicViewEnum.PERFECT_TRANSFORM}&jobUuid=${job.jobUuid}`,
    );
    const JIRA_TICKET_URL = `https://jira.mobileye.com/secure/CreateIssueDetails!init.jspa?pid=19742&issuetype=[ISSUE_TYPE_PLACEHOLDER]&assignee=adisa&components=[COMPONENT_PLACEHOLDER]&priority=[PRIORITY_PLACEHOLDER]&summary=[SUMMARY_PLACEHOLDER]&description=[DESCRIPTION_PLACEHOLDER]`;

    const NEW_LINE = '%0A';

    const descriptionText = `Hello DEEP,${NEW_LINE}${NEW_LINE}Please investigate the following job at : ${link}${NEW_LINE}${NEW_LINE}Trigger by: ${job.fullName}${NEW_LINE}${NEW_LINE}Job status: ${job.status}${NEW_LINE}${NEW_LINE}[FILL IN HERE THE REASON FOR THE INVESTIGATE] !!!
    `;

    const url = JIRA_TICKET_URL.replace('[ISSUE_TYPE_PLACEHOLDER]', ISSUE_TYPE_BUG)
      .replace('[PRIORITY_PLACEHOLDER]', PRIORITY_MEDIUM)
      .replace('[SUMMARY_PLACEHOLDER]', SUMMARY_TEXT)
      .replace('[COMPONENT_PLACEHOLDER]', COMPONENT_GENERAL)
      .replace('[DESCRIPTION_PLACEHOLDER]', descriptionText);

    return url;
  }

  private async _openDataRetentionDialog(job: PerfectTransformJob): Promise<void> {
    await this._loadDataRetentionDialog();
    const currentJob = await this._getJob(job);
    const dsToBeAffected = await firstValueFrom(
      this.dataSourceService.getJobIds([job.jobUuid], 'perfects'),
    );
    const config = this.dataRetentionService.getPerfectTransformDataRetentionConfig();
    //need to get the most update info of job, as it table only refresh every 1 min
    const dialogRef = this.dialog.open(MultipleJobDataRetentionDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.job = currentJob;
    dialogRef.componentInstance.jobIds = !dsToBeAffected?.length
      ? [job.jobUuid]
      : dsToBeAffected[0].jobIds;
    dialogRef.componentInstance.config = config;
    dialogRef.componentInstance.isPerfectTransform = true;
  }

  private async _getJob(job: PerfectTransformJob): Promise<PerfectTransformJobSnakeCase> {
    return firstValueFrom(this.perfectTransformJobsService.getSingle(job.jobUuid));
  }

  private async _loadWizardModule(): Promise<void> {
    import('deep-ui/shared/lazy-components/src/lib/perfect-transform-wizard-lazy');
  }

  private async _loadDataRetentionDialog(): Promise<void> {
    import('deep-ui/shared/lazy-components/src/lib/multiple-jobs-data-retention-dialog-lazy');
  }
}
