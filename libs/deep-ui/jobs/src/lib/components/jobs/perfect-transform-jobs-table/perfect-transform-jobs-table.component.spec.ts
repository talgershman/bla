import {NgTemplateOutlet} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeJsonMessageComponent} from '@mobileye/material/src/lib/components/json-message';
import {MeStepProgressBarComponent} from '@mobileye/material/src/lib/components/step-progress-bar';
import {MeStepperMenuComponent} from '@mobileye/material/src/lib/components/stepper-menu';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeMemorizePipe} from '@mobileye/material/src/lib/pipes/memorize';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {DeepUtilService, PerfectTransformJobsService} from 'deep-ui/shared/core';

import {PerfectTransformJobsTableComponent} from './perfect-transform-jobs-table.component';

describe('PerfectTransformJobsTableComponent', () => {
  let spectator: Spectator<PerfectTransformJobsTableComponent>;

  const createComponent = createComponentFactory({
    component: PerfectTransformJobsTableComponent,
    imports: [
      MeServerSideTableComponent,
      MeTooltipDirective,
      MatButtonModule,
      MatIconModule,
      MatMenuModule,
      MeStepProgressBarComponent,
      MeStepperMenuComponent,
      MeJsonMessageComponent,
      MeSafePipe,
      MeMemorizePipe,
      NgTemplateOutlet,
      ReactiveFormsModule,
    ],
    mocks: [MeAzureGraphService, MeDownloaderService],
    providers: [PerfectTransformJobsService, DeepUtilService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', async () => {
    expect(spectator.component).toBeTruthy();
    await spectator.fixture.whenStable();

    expect(spectator.component).toBeTruthy();
  });

  // Testing computed property usage
  it('detailCellRendererParams should be computed correctly', () => {
    spectator.detectChanges(); // Trigger change detection to compute the value
    const params = spectator.component.detailCellRendererParams();

    expect(params).toHaveProperty('meTemplate');
  });
});
