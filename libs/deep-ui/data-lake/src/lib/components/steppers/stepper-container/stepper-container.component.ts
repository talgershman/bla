import {CdkStepper} from '@angular/cdk/stepper';
import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'de-stepper-container',
  templateUrl: './stepper-container.component.html',
  styleUrls: ['./stepper-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{provide: CdkStepper, useExisting: StepperContainerComponent}],
  imports: [NgTemplateOutlet],
})
export class StepperContainerComponent extends CdkStepper {
  selectStepByIndex(index: number): void {
    this.selectedIndex = index;
  }
}
