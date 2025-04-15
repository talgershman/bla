import {CdkStepperModule} from '@angular/cdk/stepper';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatRadioModule} from '@angular/material/radio';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MeDialogContainerComponent} from '@mobileye/material/src/lib/components/dialog-container';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeToastComponent} from '@mobileye/material/src/lib/components/toast';
import {
  MeWizardButtonsComponent,
  MeWizardComponent,
} from '@mobileye/material/src/lib/components/wizard';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {
  BudgetGroupControl,
  BudgetGroupService,
} from 'deep-ui/shared/components/src/lib/controls/budget-group-control';
import {SelectFlowComponent} from 'deep-ui/shared/components/src/lib/selection/select-flow';
import {EtlJobService} from 'deep-ui/shared/core';
import {DataRetentionKnownKeysEnum, EtlJobFlowsEnum} from 'deep-ui/shared/models';
import {ToastrService} from 'ngx-toastr';
import {of} from 'rxjs';

import {EtlJobWizardComponent} from './etl-job-wizard.component';

describe('EtlJobWizardComponent - Integration', () => {
  let spectator: Spectator<EtlJobWizardComponent>;
  let etlJobService: SpyObject<EtlJobService>;
  let budgetGroupService: SpyObject<BudgetGroupService>;

  const createComponent = createComponentFactory({
    component: EtlJobWizardComponent,
    imports: [
      ReactiveFormsModule,
      MeWizardComponent,
      MeDialogContainerComponent,
      MeToastComponent,
      CdkStepperModule,
      SelectFlowComponent,
      MatIconModule,
      MatIconTestingModule,
      MatButtonModule,
      MatDialogModule,
      MatRadioModule,
      MeSelectComponent,
      MeInputComponent,
      HintIconComponent,
      BudgetGroupControl,
      BrowserAnimationsModule,
      MeWizardButtonsComponent,
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {},
      },
    ],
    mocks: [MeAzureGraphService, ToastrService, EtlJobService, BudgetGroupService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    etlJobService = spectator.inject(EtlJobService);
    budgetGroupService = spectator.inject(BudgetGroupService);

    etlJobService.getDataRetentionConfig.and.returnValue(
      of({
        [DataRetentionKnownKeysEnum.PARSED_DATA]: {
          default: 0,
          max: 1200,
          tooltip: '',
          label: '',
          job_types: [
            EtlJobFlowsEnum.CLIP_2_LOG,
            EtlJobFlowsEnum.VERSION_PERFECT,
            EtlJobFlowsEnum.SINGLE_VERSION,
            EtlJobFlowsEnum.PC_RUN,
            EtlJobFlowsEnum.METRO,
            EtlJobFlowsEnum.AV_PIPELINE,
          ],
          allowPermanent: false,
        },
      }),
    );
    budgetGroupService.getBudgetGroups.and.returnValue(
      of({
        groups: [
          {
            id: 'deep',
            value: 'deep',
            tooltip: '',
            isDisabled: false,
          } as MeSelectOption,
        ],
        isValid: true,
        error: '',
      }),
    );
  });

  describe('Click Clip2Log', () => {
    it('should load module', async () => {
      spectator.detectChanges();

      spectator.component.etlJobWizardForm.controls.flowType.setValue(EtlJobFlowsEnum.CLIP_2_LOG);

      spectator.component.onFlowNext();

      expect(spectator.component).toBeTruthy();
    });
  });

  describe('Click Version + Perfect', () => {
    it('should load module', async () => {
      spectator.detectChanges();

      spectator.component.etlJobWizardForm.controls.flowType.setValue(
        EtlJobFlowsEnum.VERSION_PERFECT,
      );

      spectator.component.onFlowNext();

      expect(spectator.component).toBeTruthy();
    });
  });

  describe('Click Single Version', () => {
    it('should load module', async () => {
      spectator.detectChanges();

      spectator.component.etlJobWizardForm.controls.flowType.setValue(
        EtlJobFlowsEnum.SINGLE_VERSION,
      );

      spectator.component.onFlowNext();

      expect(spectator.component).toBeTruthy();
    });
  });

  describe('Click PC RUN', () => {
    it('should load module', async () => {
      spectator.detectChanges();

      spectator.component.etlJobWizardForm.controls.flowType.setValue(EtlJobFlowsEnum.PC_RUN);

      spectator.component.onFlowNext();

      expect(spectator.component).toBeTruthy();
    });
  });
});
