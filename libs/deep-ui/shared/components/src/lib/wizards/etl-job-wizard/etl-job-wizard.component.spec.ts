import {CdkStepperModule} from '@angular/cdk/stepper';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatRadioModule} from '@angular/material/radio';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeToastComponent} from '@mobileye/material/src/lib/components/toast';
import {MeWizardButtonsComponent} from '@mobileye/material/src/lib/components/wizard';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {
  BudgetGroupControl,
  BudgetGroupService,
} from 'deep-ui/shared/components/src/lib/controls/budget-group-control';
import {SelectFlowComponent} from 'deep-ui/shared/components/src/lib/selection/select-flow';
import {ToastrService} from 'ngx-toastr';
import {of} from 'rxjs';

import {EtlJobWizardComponent} from './etl-job-wizard.component';

describe('EtlJobWizardComponent', () => {
  let spectator: Spectator<EtlJobWizardComponent>;
  let budgetGroupService: SpyObject<BudgetGroupService>;

  const createComponent = createComponentFactory({
    component: EtlJobWizardComponent,
    imports: [
      ReactiveFormsModule,
      MeWizardButtonsComponent,
      MeToastComponent,
      CdkStepperModule,
      SelectFlowComponent,
      MatIconModule,
      MatIconTestingModule,
      MatButtonModule,
      MatDialogModule,
      MatRadioModule,
      MeSelectComponent,
      BudgetGroupControl,
      MeInputComponent,
      HintIconComponent,
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {},
      },
    ],
    mocks: [ToastrService, BudgetGroupService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    budgetGroupService = spectator.inject(BudgetGroupService);

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

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onBackToMainFlowClicked', () => {
    it('should set index to 0', () => {
      spectator.detectChanges();
      spyOn(spectator.component.selectedWizardContainer, 'clear');

      spectator.component.onBackToMainFlowClicked();

      expect(spectator.component.selectedWizardContainer.clear).toHaveBeenCalledWith();
    });
  });

  describe('onFlowChanged', () => {
    it('should set flowControl value', () => {
      spyOn(spectator.component.etlJobWizardForm.controls.flowType, 'setValue');
      spectator.detectChanges();

      spectator.component.onFlowChanged({value: 'flow 1'});

      expect(spectator.component.etlJobWizardForm.controls.flowType.setValue).toHaveBeenCalled();
    });
  });
});
