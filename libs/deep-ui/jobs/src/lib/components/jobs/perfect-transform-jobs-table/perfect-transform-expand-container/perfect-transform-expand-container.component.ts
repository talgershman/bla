import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MeDynamicFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeJsonMessageComponent} from '@mobileye/material/src/lib/components/json-message';
import {MeStepperMenuComponent} from '@mobileye/material/src/lib/components/stepper-menu';
import {MeMemorizePipe} from '@mobileye/material/src/lib/pipes/memorize';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {UntilDestroy} from '@ngneat/until-destroy';
import {PerfectTransformJobsService} from 'deep-ui/shared/core';
import {
  JobStatusMetadata,
  PerfectTransformJob,
  PerfectTransformJobStepEnum,
} from 'deep-ui/shared/models';

import {BaseExpandContainerDirective} from '../../base-expand-container/base-expand-container.directive';

@UntilDestroy()
@Component({
  selector: 'de-perfect-transform-expand-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MeStepperMenuComponent,
    MeJsonMessageComponent,
    MeSafePipe,
    MeMemorizePipe,
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
  templateUrl: './perfect-transform-expand-container.component.html',
  styleUrl: './perfect-transform-expand-container.component.scss',
})
export class PerfectTransformExpandContainerComponent extends BaseExpandContainerDirective<
  PerfectTransformJob,
  PerfectTransformJobsService
> {
  private perfectTransformJobsService = inject(PerfectTransformJobsService);

  protected getService(): PerfectTransformJobsService {
    return this.perfectTransformJobsService;
  }

  //eslint-disable-next-line
  protected handleMestStep(service: PerfectTransformJobsService, metadata: JobStatusMetadata) {
    this.showMestClipListButton = false;
    this.showMestCloudCmdButton = false;
  }

  protected isUserCodeStep(metadata: JobStatusMetadata): boolean {
    if (!metadata) {
      return false;
    }
    return metadata.step === PerfectTransformJobStepEnum.ETL_EXECUTION;
  }

  //eslint-disable-next-line
  protected handleParsingStep(service: PerfectTransformJobsService, metadata: JobStatusMetadata) {}

  //eslint-disable-next-line
  protected handleReportStep(
    //eslint-disable-next-line
    job: PerfectTransformJob,
    //eslint-disable-next-line
    service: PerfectTransformJobsService,
    //eslint-disable-next-line
    metadata: JobStatusMetadata,
  ) {}
}
