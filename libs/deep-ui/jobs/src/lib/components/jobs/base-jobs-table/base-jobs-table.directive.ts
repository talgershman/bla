import {
  computed,
  Directive,
  inject,
  Input,
  signal,
  TemplateRef,
  ViewChild,
  viewChild,
  WritableSignal,
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MeAgCustomDetailComponent} from '@mobileye/material/src/lib/components/ag-table/ag-custom-detail';
import {
  MeAgTableActionItemEvent,
  MeDetailCellRendererParams,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {
  MeStepDef,
  MeStepProgressEnum,
} from '@mobileye/material/src/lib/components/step-progress-bar';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import copy from 'copy-to-clipboard';
import {CommonTableActions} from 'deep-ui/shared/components/src/lib/common';
import {ServerSideEntityTableBaseDirective} from 'deep-ui/shared/components/src/lib/tables/common';
import {BaseJobService} from 'deep-ui/shared/core';
import {JobEntity, ReTriggerConfig} from 'deep-ui/shared/models';
import {memoize} from 'lodash-decorators';
import _isEqual from 'lodash-es/isEqual';
import {Observable, Subject} from 'rxjs';
import {delay} from 'rxjs/operators';

import {EtlJobActions} from '../etl-jobs/etl-jobs-entities';

@UntilDestroy()
@Directive()
export abstract class BaseJobsTableDirective<
  T extends JobEntity,
  U extends BaseJobService,
> extends ServerSideEntityTableBaseDirective<T> {
  @ViewChild('stepCell', {static: true})
  stepCell: TemplateRef<any>;
  @Input()
  reTriggerConfig: ReTriggerConfig;
  detailCell = viewChild('detailCell', {read: TemplateRef<any>});

  readonly searchPlaceHolder = 'Search ETL name';
  masterDetail = true;
  detailCellRenderer = MeAgCustomDetailComponent;

  currentStepId: WritableSignal<string> = signal(undefined);

  searchFilterByField = 'probeName';
  idProperty = 'jobUuid';
  teamProperty: 'group' | 'team' = 'team';
  columnBeforeAction = 'duration';
  ignoreTeamFilterAttributes = ['jobUuid'];
  ignoredFiltersKeys = [];

  updateJobSubject: Subject<[job: T, stepId: string]> = new Subject();
  updateJobSubject$: Observable<[job: T, stepId: string]> = this.updateJobSubject.asObservable();

  protected dialog = inject(MatDialog);

  protected abstract getService(): U;
  protected abstract openInfoDialog(action: MeAgTableActionItemEvent<T>): Promise<void>;
  protected abstract onUpdateJob(action: MeAgTableActionItemEvent<T>): Promise<void>;

  protected override createdByUsernameProperty = 'userName';

  detailCellRendererParams = computed(
    (): MeDetailCellRendererParams =>
      ({
        meTemplate: this.detailCell(),
      }) as MeDetailCellRendererParams,
  );

  override async onActionClicked(action: MeAgTableActionItemEvent<T>): Promise<void> {
    if (action.id === CommonTableActions.INFO) {
      await this.openInfoDialog(action);
    } else if (action.id === EtlJobActions.UPDATE_JOB) {
      await this.onUpdateJob(action);
    } else {
      this.tableActionClicked.emit(action);
    }
  }

  copyJobIdToClipboard(event: MouseEvent, JobUuid: number): void {
    event.stopPropagation();
    copy(JobUuid.toString());
    this.snackbar.onCopyToClipboard();
  }

  @memoize()
  generateRowProgressBarData(job: T): MeStepDef[] {
    const results = [];
    const service = this.getService();
    const flowSteps = service.getFlowSteps(job) || [];
    for (const flowStep of flowSteps) {
      const foundJob = service.findStepInJobStatusMetadata(flowStep, job.jobStatusMetadata);
      const step: MeStepDef = {
        progress: MeStepProgressEnum.NOT_STARTED,
      };
      if (foundJob) {
        step.progress = foundJob.state as any;
      }
      results.push(step);
    }
    return results;
  }

  protected override setTableOptions(): void {
    this.tableOptions = {
      templates: {
        nameCell: this.nameCell,
        statusCell: this.statusCell,
        stepCell: this.stepCell,
      },
      showActions: !this.hideTableActions,
      isIncludedInDeepGroupsOrIsAdmin: this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin.bind(
        this.deepUtilService,
      ),
      extra: this.reTriggerConfig,
    };
  }

  protected override registerEvents(): void {
    super.registerEvents();

    this.agGridDataSource.dataLoadedLevel$.pipe(delay(350), untilDestroyed(this)).subscribe((_) => {
      if (this.selected?.length && this.selected[0]) {
        const updatedRowNode = this.gridApi.getRowNode(this.selected[0][this.idProperty]);
        // update the selection once its data has been changed after a refresh
        if (updatedRowNode && !_isEqual(this.selected[0], updatedRowNode.data)) {
          this.selected[0] = updatedRowNode.data;
          this.currentStepId.set(this.selected[0].jobStatusMetadata[0]?.step);
          this.updateJobSubject.next([this.selected[0] as any, this.currentStepId()]);
        }
      }
    });
  }
}
