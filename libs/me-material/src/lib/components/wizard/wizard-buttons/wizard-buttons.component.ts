import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'me-wizard-buttons',
  templateUrl: './wizard-buttons.component.html',
  styleUrls: ['./wizard-buttons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
})
export class MeWizardButtonsComponent {
  @Input()
  hideBorderTop: boolean;

  @Input()
  hideNext: boolean;

  @Input()
  hidePrev: boolean;

  @Input()
  showNext: boolean;

  @Input()
  showPrev: boolean;

  @Input()
  isNextDisabled: boolean;

  @Input()
  isPrevDisabled: boolean;

  @Input()
  nextLabel = 'Next';

  @Input()
  prevLabel = 'Back';

  @Output()
  prevClicked = new EventEmitter();

  @Output()
  nextClicked = new EventEmitter();
}
