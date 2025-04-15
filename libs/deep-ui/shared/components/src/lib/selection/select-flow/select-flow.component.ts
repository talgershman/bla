import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {MatRadioModule} from '@angular/material/radio';
import {MeGroupButton} from '@mobileye/material/src/lib/common';
import {flowButtons} from 'deep-ui/shared/components/src/lib/common';
import {EtlJobFlowsEnum} from 'deep-ui/shared/models';

@Component({
  selector: 'de-select-flow',
  templateUrl: './select-flow.component.html',
  styleUrls: ['./select-flow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatRadioModule],
})
export class SelectFlowComponent {
  @Input()
  selected: EtlJobFlowsEnum;

  @Input()
  readonly: boolean;

  @Output()
  flowChanged = new EventEmitter();

  buttons: MeGroupButton[] = flowButtons;

  isDisabled: boolean;

  onFlowSelected(flowButton: MeGroupButton): void {
    if (this.selected !== flowButton.id) {
      this.flowChanged.emit(flowButton.id);
    }
  }
}
