import {NgTemplateOutlet} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MeJsonMessageComponent} from '@mobileye/material/src/lib/components/json-message';
import {
  MeStepperMenuComponent,
  MeStepperMenuItem,
  MeStepperMenuStatusEnum,
} from '@mobileye/material/src/lib/components/stepper-menu';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeMemorizePipe} from '@mobileye/material/src/lib/pipes/memorize';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {PerfectTransformJobsService} from 'deep-ui/shared/core';
import {PerfectTransformJob, PerfectTransformJobStepEnum, StateEnum} from 'deep-ui/shared/models';
import {Subject} from 'rxjs';

import {PerfectTransformExpandContainerComponent} from './perfect-transform-expand-container.component';

const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

describe('PerfectTransformExpandContainerComponent', () => {
  let spectator: Spectator<PerfectTransformExpandContainerComponent>;

  const createComponent = createComponentFactory({
    component: PerfectTransformExpandContainerComponent,
    imports: [
      MeTooltipDirective,
      MatButtonModule,
      MatIconModule,
      MatMenuModule,
      MeStepperMenuComponent,
      MeJsonMessageComponent,
      MeSafePipe,
      MeMemorizePipe,
      NgTemplateOutlet,
      ReactiveFormsModule,
    ],
    mocks: [MeDownloaderService],
    providers: [PerfectTransformJobsService],
    detectChanges: false,
  });

  const recurringJob = {
    probeName: 'probe 4',
    jobStatusMetadata: [
      {
        step: PerfectTransformJobStepEnum.PUBLISHING_DATA_SOURCE,
        state: StateEnum.IN_PROGRESS,
        details: 'lorem ipsum dolor',
      },
      {
        step: PerfectTransformJobStepEnum.PUBLISHING_DATA_SOURCE,
        state: StateEnum.STARTED,
      },
      {
        step: PerfectTransformJobStepEnum.PUBLISHING_DATA_SOURCE,
        state: StateEnum.DONE,
      },
    ],
  } as PerfectTransformJob;

  beforeEach(async () => {
    spectator = createComponent();
    spectator.component.updateJobAfterRefresh = new Subject();
  });

  it('should create', () => {
    spectator.setInput('job', recurringJob);
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onDetailExpandOpened', () => {
    it('should show the last step - publishing datasource with job msg', () => {
      const lastMsg = {info: 'last msg'};
      const perfectJobObj = {
        probeName: 'probe 4',
        jobStatusMetadata: [
          {
            step: PerfectTransformJobStepEnum.PUBLISHING_DATA_SOURCE,
            state: StateEnum.IN_PROGRESS,
            details: JSON.stringify(lastMsg),
          },
          {
            step: PerfectTransformJobStepEnum.PUBLISHING_DATA_SOURCE,
            state: StateEnum.STARTED,
          },
          {
            step: PerfectTransformJobStepEnum.ETL_EXECUTION,
            state: StateEnum.DONE,
          },
          {
            step: PerfectTransformJobStepEnum.ETL_EXECUTION,
            state: StateEnum.IN_PROGRESS,
          },
          {
            step: PerfectTransformJobStepEnum.ETL_EXECUTION,
            state: StateEnum.STARTED,
          },
          {
            step: PerfectTransformJobStepEnum.INPUT_VALIDATION,
            state: StateEnum.DONE,
            details: 'another msg',
          },
          {
            step: PerfectTransformJobStepEnum.INPUT_VALIDATION,
            state: StateEnum.IN_PROGRESS,
          },
          {
            step: PerfectTransformJobStepEnum.INPUT_VALIDATION,
            state: StateEnum.STARTED,
          },
        ],
      };
      spectator.component.jsonStepDetailsControl.setValue({info: 'wrong msg to display'});
      spectator.setInput('job', perfectJobObj as any);
      spectator.detectChanges();

      expect(spectator.component.showProbeErrorLogsButton).toBeFalse();
      expect(spectator.component.jsonStepDetailsControl.value).toEqual(lastMsg);
    });

    it('should show etl execution step - with download logs button', () => {
      const lastMsg = {info: 'last msg'};
      const perfectJobObj = {
        probeName: 'probe 4',
        jobStatusMetadata: [
          {
            step: PerfectTransformJobStepEnum.ETL_EXECUTION,
            state: StateEnum.DONE,
            details: JSON.stringify(lastMsg),
          },
          {
            step: PerfectTransformJobStepEnum.ETL_EXECUTION,
            state: StateEnum.IN_PROGRESS,
          },
          {
            step: PerfectTransformJobStepEnum.ETL_EXECUTION,
            state: StateEnum.STARTED,
          },
          {
            step: PerfectTransformJobStepEnum.INPUT_VALIDATION,
            state: StateEnum.DONE,
            details: JSON.stringify({info: 'another msg'}),
          },
          {
            step: PerfectTransformJobStepEnum.INPUT_VALIDATION,
            state: StateEnum.IN_PROGRESS,
          },
          {
            step: PerfectTransformJobStepEnum.INPUT_VALIDATION,
            state: StateEnum.STARTED,
          },
        ],
        probeErrors: true,
      };
      spectator.setInput('job', perfectJobObj as any);
      spectator.detectChanges();

      expect(spectator.component.showProbeErrorLogsButton).toBeTrue();
      expect(spectator.component.jsonStepDetailsControl.value).toEqual(lastMsg);
    });
  });

  describe('onMenuItemClick', () => {
    const mestMsg = {info: 'some details msg'};
    const probeMsg = {info: 'etl msg'};
    const perfectJobObj = {
      probeName: 'etl 3',
      jobStatusMetadata: [
        {
          step: PerfectTransformJobStepEnum.PUBLISHING_DATA_SOURCE,
          state: StateEnum.IN_PROGRESS,
        },
        {
          step: PerfectTransformJobStepEnum.PUBLISHING_DATA_SOURCE,
          state: StateEnum.STARTED,
        },
        {
          step: PerfectTransformJobStepEnum.ETL_EXECUTION,
          state: StateEnum.DONE,
          details: JSON.stringify(probeMsg),
        },
        {
          step: PerfectTransformJobStepEnum.ETL_EXECUTION,
          state: StateEnum.IN_PROGRESS,
        },
        {
          step: PerfectTransformJobStepEnum.ETL_EXECUTION,
          state: StateEnum.STARTED,
        },
        {
          step: PerfectTransformJobStepEnum.INPUT_VALIDATION,
          state: StateEnum.DONE,
          details: JSON.stringify(mestMsg),
        },
        {
          step: PerfectTransformJobStepEnum.INPUT_VALIDATION,
          state: StateEnum.IN_PROGRESS,
        },
        {
          step: PerfectTransformJobStepEnum.INPUT_VALIDATION,
          state: StateEnum.STARTED,
        },
      ],
    };
    it('should display the correct details msg', async () => {
      const menuItem: MeStepperMenuItem = {
        title: 'INPUT VALIDATION',
        id: PerfectTransformJobStepEnum.INPUT_VALIDATION,
        status: MeStepperMenuStatusEnum.DONE,
      };
      spectator.setInput('job', recurringJob);
      spectator.detectChanges();

      spectator.component.onMenuItemClick(menuItem, perfectJobObj as any);
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      await sleep(100);

      expect(spectator.component.jsonStepDetailsControl.value).toEqual(mestMsg);
    });

    it('should go to etl execution step', async () => {
      const menuItem: MeStepperMenuItem = {
        title: 'ETL Execution',
        id: PerfectTransformJobStepEnum.ETL_EXECUTION,
        status: MeStepperMenuStatusEnum.DONE,
      };
      spectator.setInput('job', recurringJob);
      spectator.detectChanges();

      spectator.component.onMenuItemClick(menuItem, perfectJobObj as any);
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      await sleep(100);

      expect(spectator.component.jsonStepDetailsControl.value).toEqual(probeMsg);
    });
  });
});
