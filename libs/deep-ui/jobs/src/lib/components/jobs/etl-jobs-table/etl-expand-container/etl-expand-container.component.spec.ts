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
import {EtlJobService} from 'deep-ui/shared/core';
import {EtlJob, EtlJobStepEnum, StateEnum} from 'deep-ui/shared/models';
import {Subject} from 'rxjs';

import {EtlExpandContainerComponent} from './etl-expand-container.component';

const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

describe('EtlExpandContainerComponent', () => {
  let spectator: Spectator<EtlExpandContainerComponent>;

  const createComponent = createComponentFactory({
    component: EtlExpandContainerComponent,
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
    providers: [EtlJobService],
    detectChanges: false,
  });

  const recurringJob = {
    probeName: 'probe 1',
    jobStatusMetadata: [
      {
        step: EtlJobStepEnum.REPORT,
        state: StateEnum.IN_PROGRESS,
        details: 'Reported job',
      },
      {
        step: EtlJobStepEnum.REPORT,
        state: StateEnum.STARTED,
      },
      {
        step: EtlJobStepEnum.PROBE,
        state: StateEnum.DONE,
      },
    ],
  } as EtlJob;

  beforeEach(async () => {
    spectator = createComponent();
    spectator.component.updateJobAfterRefresh = new Subject();
  });

  it('should create', () => {
    spectator.setInput('job', recurringJob);
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  // Testing method that changes state
  it('should update currentStepId on menu item click', async () => {
    const etlJobObj = {
      probeName: 'probe 4',
      jobStatusMetadata: [
        {
          step: EtlJobStepEnum.REPORT,
          state: StateEnum.IN_PROGRESS,
          details: 'Reported job',
        },
        {
          step: EtlJobStepEnum.REPORT,
          state: StateEnum.STARTED,
        },
        {
          step: EtlJobStepEnum.PROBE,
          state: StateEnum.DONE,
        },
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
          details: 'another msg',
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
    } as EtlJob;
    spectator.setInput('job', etlJobObj);
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    const mockMenuItem = {id: EtlJobStepEnum.MEST} as MeStepperMenuItem;
    spectator.component.onMenuItemClick(mockMenuItem, etlJobObj);
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    await sleep(100);

    expect(spectator.component.currentStepId()).toBe(mockMenuItem.id);
  });

  describe('onDetailExpandOpened', () => {
    it('should show the last step - report with job msg', () => {
      const lastMsg = {info: 'last msg'};
      const etlJobObj = {
        probeName: 'probe 4',
        jobStatusMetadata: [
          {
            step: EtlJobStepEnum.REPORT,
            state: StateEnum.IN_PROGRESS,
            details: JSON.stringify(lastMsg),
          },
          {
            step: EtlJobStepEnum.REPORT,
            state: StateEnum.STARTED,
          },
          {
            step: EtlJobStepEnum.PROBE,
            state: StateEnum.DONE,
          },
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
            details: 'another msg',
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
      spectator.component.jsonStepDetailsControl.setValue({info: 'wrong msg to display'});
      spectator.setInput('job', etlJobObj as any);
      spectator.detectChanges();

      expect(spectator.component.showProbeErrorLogsButton).toBeFalse();
      expect(spectator.component.jsonStepDetailsControl.value).toEqual(lastMsg);
    });

    it('should show probe step - with download logs button', () => {
      const lastMsg = {info: 'last msg'};
      const etlJobObj = {
        probeName: 'probe 4',
        jobStatusMetadata: [
          {
            step: EtlJobStepEnum.PROBE,
            state: StateEnum.DONE,
            details: JSON.stringify(lastMsg),
          },
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
            details: JSON.stringify({info: 'another msg'}),
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
        probeErrors: true,
      };
      spectator.setInput('job', etlJobObj as any);
      spectator.detectChanges();

      expect(spectator.component.showProbeErrorLogsButton).toBeTrue();
      expect(spectator.component.jsonStepDetailsControl.value).toEqual(lastMsg);
    });
  });

  describe('onMenuItemClick', () => {
    const mestMsg = {info: 'some details msg'};
    const probeMsg = {info: 'etl msg'};
    const etlJobObj = {
      probeName: 'etl 3',
      jobStatusMetadata: [
        {
          step: EtlJobStepEnum.REPORT,
          state: StateEnum.IN_PROGRESS,
        },
        {
          step: EtlJobStepEnum.REPORT,
          state: StateEnum.STARTED,
        },
        {
          step: EtlJobStepEnum.PROBE,
          state: StateEnum.DONE,
          details: JSON.stringify(probeMsg),
        },
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
          details: JSON.stringify(mestMsg),
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
    it('should display the correct details msg', async () => {
      const menuItem: MeStepperMenuItem = {
        title: 'MEST',
        id: EtlJobStepEnum.MEST,
        status: MeStepperMenuStatusEnum.DONE,
      };
      spectator.setInput('job', recurringJob);
      spectator.detectChanges();

      spectator.component.onMenuItemClick(menuItem, etlJobObj as any);
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      await sleep(100);

      expect(spectator.component.showProbeErrorLogsButton).toBeFalse();
      expect(spectator.component.jsonStepDetailsControl.value).toEqual(mestMsg);
    });

    it('should go to probe step', async () => {
      const menuItem: MeStepperMenuItem = {
        title: 'PROBE',
        id: EtlJobStepEnum.PROBE,
        status: MeStepperMenuStatusEnum.DONE,
      };
      spectator.setInput('job', recurringJob);
      spectator.detectChanges();

      spectator.component.onMenuItemClick(menuItem, etlJobObj as any);
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      await sleep(100);

      expect(spectator.component.showProbeErrorLogsButton).toBeTrue();
      expect(spectator.component.jsonStepDetailsControl.value).toEqual(probeMsg);
    });
  });

  describe('generateJobStepsMenuItems', () => {
    it('should create menu stepper items', () => {
      const etlJobObj = {
        probeName: 'etl 2',
        jobStatusMetadata: [
          {
            step: EtlJobStepEnum.REPORT,
            state: StateEnum.IN_PROGRESS,
          },
          {
            step: EtlJobStepEnum.REPORT,
            state: StateEnum.STARTED,
          },
          {
            step: EtlJobStepEnum.PROBE,
            state: StateEnum.DONE,
          },
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
      spectator.setInput('job', recurringJob);
      spectator.detectChanges();

      const result = spectator.component.generateJobStepsMenuItems(etlJobObj as any, {} as any);

      const expectedArr: MeStepperMenuItem[] = [
        {
          title: 'MEST',
          id: EtlJobStepEnum.MEST,
          status: MeStepperMenuStatusEnum.DONE,
          tmpl: {} as any,
          tmplContext: undefined,
        },
        {
          title: 'Parsing Data',
          id: EtlJobStepEnum.PARSING,
          status: MeStepperMenuStatusEnum.DONE,
          tmpl: {} as any,
          tmplContext: undefined,
        },
        {
          title: 'ETL Execution',
          id: EtlJobStepEnum.PROBE,
          status: MeStepperMenuStatusEnum.DONE,
          tmpl: {} as any,
          tmplContext: undefined,
        },
        {
          title: 'Results',
          id: EtlJobStepEnum.REPORT,
          status: MeStepperMenuStatusEnum.IN_PROGRESS,
          tmpl: {} as any,
          tmplContext: undefined,
        },
      ];

      expect(result).toEqual(expectedArr);
    });
  });
});
