import {CdkStep, CdkStepper, CdkStepperModule} from '@angular/cdk/stepper';
import {NgTemplateOutlet} from '@angular/common';
import {Component, inject, ViewChild} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeCdkStepComponent} from '@mobileye/material/src/lib/components/wizard/cdk-step/me-cdk-step.component';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeWizardComponent} from './wizard.component';
import {MeWizardButtonsComponent} from './wizard-buttons/wizard-buttons.component';

@Component({
  template: ` <me-wizard class="dialog-content" #cdkStepper linear="true">
    <me-cdk-step label="Select 1" [stepControl]="firstForm">
      <form [formGroup]="firstForm">
        <div class="container-step">step 1</div>
      </form>
    </me-cdk-step>
    <me-cdk-step label="Select 2" [stepControl]="secondForm">
      <form [formGroup]="secondForm">
        <div class="container-step">step 2</div>
      </form>
    </me-cdk-step>
    <me-cdk-step label="Select 3" [stepControl]="thirdForm">
      <form [formGroup]="thirdForm">
        <div class="container-step">step 3</div>
      </form>
    </me-cdk-step>
    <me-cdk-step label="Select 4">
      <div class="container-step">step 4</div>
    </me-cdk-step>
    <me-cdk-step label="Select 5">
      <div class="container-step">step 5</div>
    </me-cdk-step>
  </me-wizard>`,
  imports: [MeCdkStepComponent, ReactiveFormsModule, MeWizardComponent],
})
class TestComponent {
  @ViewChild(MeWizardComponent, {static: true}) wizard: MeWizardComponent;

  private fb = inject(FormBuilder);

  firstForm = this.fb.group({
    firstKey: [null],
    someKey: [1],
  });

  secondForm = this.fb.group({
    secondKey: [null],
    otherKey: ['some-value'],
  });

  thirdForm = this.fb.group({
    thirdKey: [null],
    requiredKey: ['Last Name', [Validators.required]],
  });
}

describe('MeWizardComponent', () => {
  let spectator: Spectator<TestComponent>;

  const createComponent = createComponentFactory({
    component: TestComponent,
    imports: [
      CdkStepperModule,
      MatButtonModule,
      ReactiveFormsModule,
      MatIconModule,
      MatIconTestingModule,
      MatDialogModule,
      MeWizardButtonsComponent,
      NgTemplateOutlet,
      TestComponent,
      HintIconComponent,
    ],
    providers: [
      {provide: CdkStepper, useExisting: MeWizardComponent},
      {provide: CdkStep, useExisting: MeCdkStepComponent},
    ],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
