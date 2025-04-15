import {NgTemplateOutlet} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeJsonMessageComponent} from '@mobileye/material/src/lib/components/json-message';
import {
  MeStepDef,
  MeStepProgressBarComponent,
  MeStepProgressEnum,
} from '@mobileye/material/src/lib/components/step-progress-bar';
import {MeStepperMenuComponent} from '@mobileye/material/src/lib/components/stepper-menu';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeMemorizePipe} from '@mobileye/material/src/lib/pipes/memorize';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {DeepUtilService, EtlJobService} from 'deep-ui/shared/core';
import {EtlJobStepEnum, StateEnum} from 'deep-ui/shared/models';

import {EtlJobsTableComponent} from './etl-jobs-table.component';

describe('EtlJobsTableComponent', () => {
  let spectator: Spectator<EtlJobsTableComponent>;

  const createComponent = createComponentFactory({
    component: EtlJobsTableComponent,
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
    providers: [EtlJobService, DeepUtilService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', async () => {
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.component).toBeTruthy();
  });

  // Testing computed property usage
  it('detailCellRendererParams should be computed correctly', () => {
    spectator.detectChanges(); // Trigger change detection to compute the value
    const params = spectator.component.detailCellRendererParams();

    expect(params).toHaveProperty('meTemplate');
  });

  describe('generateRowProgressBarData', () => {
    it('should create progress steps', () => {
      const etlJobObj = {
        probeName: 'etl 1',
        jobStatusMetadata: [
          {
            step: EtlJobStepEnum.PROBE,
            state: StateEnum.IN_PROGRESS,
          },
          {
            step: EtlJobStepEnum.PROBE,
            state: StateEnum.STARTED,
          },
          {
            step: EtlJobStepEnum.PARSING,
            state: StateEnum.DONE,
          },
          {
            step: EtlJobStepEnum.PARSING,
            state: StateEnum.IN_PROGRESS,
          },
          {
            step: EtlJobStepEnum.PARSING,
            state: StateEnum.STARTED,
          },
          {
            step: EtlJobStepEnum.MEST,
            state: StateEnum.DONE,
          },
          {
            step: EtlJobStepEnum.MEST,
            state: StateEnum.IN_PROGRESS,
          },
          {
            step: EtlJobStepEnum.MEST,
            state: StateEnum.STARTED,
          },
        ],
      };
      spectator.detectChanges();

      const result = spectator.component.generateRowProgressBarData(etlJobObj as any);

      const expectedArr: MeStepDef[] = [
        {
          progress: MeStepProgressEnum.DONE,
        },
        {
          progress: MeStepProgressEnum.DONE,
        },
        {
          progress: MeStepProgressEnum.IN_PROGRESS,
        },
        {
          progress: MeStepProgressEnum.NOT_STARTED,
        },
      ];

      expect(result).toEqual(expectedArr);
    });
  });
});
