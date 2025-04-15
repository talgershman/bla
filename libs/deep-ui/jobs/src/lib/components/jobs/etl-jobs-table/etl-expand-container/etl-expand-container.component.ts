import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MeDynamicFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {MeJsonMessageComponent} from '@mobileye/material/src/lib/components/json-message';
import {MeStepperMenuComponent} from '@mobileye/material/src/lib/components/stepper-menu';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeMemorizePipe} from '@mobileye/material/src/lib/pipes/memorize';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {DISABLED_FLOWS_WITH_MEST_STEPS} from 'deep-ui/shared/components/src/lib/common';
import {EtlJobService} from 'deep-ui/shared/core';
import {
  EtlJob,
  EtlJobStepEnum,
  ETLJobUnSupportedTypes,
  JobStatusMetadata,
  StateEnum,
} from 'deep-ui/shared/models';
import {memoize} from 'lodash-decorators';

import {DownloadMestClipListComponent} from '../../../dialogs/download-mest-clip-list/download-mest-clip-list.component';
import {NEW_FLOW_MEST_TO_CLIP_LIST_STATUS_OPTIONS} from '../../../dialogs/download-mest-clip-list/download-mest-clip-list-entities';
import {
  DownloadOutputsComponent,
  DownloadOutputTypeEnum,
} from '../../../dialogs/download-outputs/download-outputs.component';
import {MestCloudCmdComponent} from '../../../dialogs/mest-cloud-cmd/mest-cloud-cmd.component';
import {BaseExpandContainerDirective} from '../../base-expand-container/base-expand-container.directive';

@UntilDestroy()
@Component({
  selector: 'de-etl-expand-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MeStepperMenuComponent,
    MeJsonMessageComponent,
    MeSafePipe,
    MeMemorizePipe,
    MeTooltipDirective,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    NgTemplateOutlet,
    ReactiveFormsModule,
  ],
  animations: [
    MeDynamicFadeInOutAnimation(),
    MeDynamicFadeInOutAnimation(350, 'MeFadeInOutAnimation'),
  ],
  templateUrl: './etl-expand-container.component.html',
  styleUrl: './etl-expand-container.component.scss',
})
export class EtlExpandContainerComponent extends BaseExpandContainerDirective<
  EtlJob,
  EtlJobService
> {
  private etlJobService = inject(EtlJobService);

  mestClipListButtonError = '';

  private readonly jobStatesWithMestSteps = [StateEnum.DONE, StateEnum.FAIL];
  private readonly newFlowStatuses = new Set(
    NEW_FLOW_MEST_TO_CLIP_LIST_STATUS_OPTIONS.map((opt: MeSelectOption) => opt.id),
  );

  @memoize()
  enableMestClipListFromStateReflector(job: EtlJob): boolean {
    const service = this.getService();
    const foundJob = service.findStepInJobStatusMetadata(
      EtlJobStepEnum.MEST,
      job.jobStatusMetadata,
    );

    if (!foundJob) {
      return false;
    }

    if (!job?.metadata?.mestClipList) {
      return false;
    }

    const availableStatuses = Object.keys(job.metadata.mestClipList);

    return availableStatuses.some((status: string) => this.newFlowStatuses.has(status));
  }

  @memoize()
  enableMestClipList(job: EtlJob): boolean {
    this.mestClipListButtonError = '';
    const service = this.etlJobService;
    const foundJob = service.findStepInJobStatusMetadata(
      EtlJobStepEnum.MEST,
      job.jobStatusMetadata,
    );

    if (!foundJob) {
      return false;
    }

    if (DISABLED_FLOWS_WITH_MEST_STEPS.includes(job.jobType)) {
      return false;
    }

    if (!job.clipListId) {
      this.mestClipListButtonError = 'There is no clip list available for download.';
      return false;
    }

    return this.jobStatesWithMestSteps.includes(foundJob.state);
  }
  openDownloadDataPrepDialog(item: EtlJob): void {
    const dialogRef = this.dialog.open(DownloadOutputsComponent, {
      autoFocus: false,
      restoreFocus: false,
      data: item,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.etlJob = item;
    dialogRef.componentInstance.outputType = DownloadOutputTypeEnum.DATA_PREP;
    dialogRef.componentInstance.closeDialog.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
    });
  }

  downloadRuntimeStats(item: EtlJob, runtimesStep: 'data-prep' | 'etl-logic'): void {
    this.etlJobService.downloadRuntimeStats(item.jobUuid, runtimesStep);
  }

  downloadMestClipListFromStateReflector(job: EtlJob): void {
    this._openMestClipListDialog(job, true);
  }

  downloadMestClipList(job: EtlJob): void {
    this._openMestClipListDialog(job, false);
  }

  openMestCloudCmdDialog(job: EtlJob): void {
    this._openMestCloudCmdDialog(job);
  }

  downloadMap2dfClipList(job: EtlJob): void {
    this.etlJobService.downloadClipList(job.jobUuid);
  }

  protected getService(): EtlJobService {
    return this.etlJobService;
  }

  protected handleMestStep(service: EtlJobService, metadata: JobStatusMetadata): void {
    const isVisible = metadata.step === service.getEtlMestStep();
    this.showMestClipListButton = isVisible;
    this.showMestCloudCmdButton = isVisible;
  }

  protected isUserCodeStep(metadata: JobStatusMetadata): boolean {
    if (!metadata) {
      return false;
    }
    return metadata.step === EtlJobStepEnum.PROBE;
  }

  protected handleParsingStep(service: EtlJobService, metadata: JobStatusMetadata): void {
    this.showParsingErrorButton = metadata.step === service.getEtlParsingStep();
    const isUserCodeStep = this.isUserCodeStep(metadata);
    this.showProbeErrorLogsButton = isUserCodeStep;
    this.showClipLogsButton = isUserCodeStep;
    this.showDataPrepButton = metadata.step === EtlJobStepEnum.PROBE;
    this.showLogicOutputsButton = metadata.step === EtlJobStepEnum.PROBE;
  }

  protected handleReportStep(
    job: EtlJob,
    service: EtlJobService,
    metadata: JobStatusMetadata,
  ): void {
    this.showReportClipListButton =
      job.jobType === ETLJobUnSupportedTypes.MAP_TO_DF &&
      metadata.step === service.getEtlReportStep();
  }

  private _openMestClipListDialog(job: EtlJob, newFlow: boolean): void {
    const dialogRef = this.dialog.open(DownloadMestClipListComponent, {
      autoFocus: false,
      restoreFocus: false,
      data: newFlow
        ? {
            jobUuid: job.jobUuid,
            jobValidStatuses: Object.keys(job.metadata.mestClipList),
            clipListId: job.clipListId,
          }
        : {
            mestHash: job.mestHash,
            clipListS3Key: job.clipListS3Key,
            clipsToParamsHashPath: job.metadata?.clipsToParamsHashPath,
            clipListId: job.clipListId,
          },
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.closeDialog.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
    });
  }

  private _openMestCloudCmdDialog(job: EtlJob): void {
    const dialogRef = this.dialog.open(MestCloudCmdComponent, {
      autoFocus: false,
      restoreFocus: false,
      width: '72rem',
      maxHeight: '64rem',
      data: {
        jobUuid: job.jobUuid,
      },
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.closeDialog.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
    });
  }
}
