import {CdkStep, CdkStepper, CdkStepperModule} from '@angular/cdk/stepper';
import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, ContentChildren, QueryList} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';

import {MeCdkStepComponent} from './cdk-step/me-cdk-step.component';
import {MeWizardButtonsComponent} from './wizard-buttons/wizard-buttons.component';

/* eslint-disable */
@Component({
  selector: 'me-wizard',
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {provide: CdkStepper, useExisting: MeWizardComponent},
    {provide: CdkStep, useExisting: MeCdkStepComponent},
  ],
  imports: [
    CdkStepperModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    NgTemplateOutlet,
    MeWizardButtonsComponent,
    HintIconComponent,
  ],
})
/* eslint-enable */
export class MeWizardComponent extends CdkStepper {
  /** override * */
  /** Full list of steps inside the stepper, including inside nested steppers. */
  @ContentChildren(MeCdkStepComponent, {descendants: true})
  override _steps: QueryList<MeCdkStepComponent> = null;

  get selectedStep(): MeCdkStepComponent {
    return this.selected as MeCdkStepComponent;
  }

  getNumberOfSteps(): number {
    return this._steps.length;
  }

  isFirstStep(): boolean {
    return this.selectedIndex === 0;
  }

  getCurrentStepIndex(): number {
    return this.selectedIndex;
  }
}
