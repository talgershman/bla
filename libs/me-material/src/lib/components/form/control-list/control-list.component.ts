import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';

@Component({
  selector: 'me-control-list',
  templateUrl: './control-list.component.html',
  styleUrls: ['./control-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[title]': 'listTitle',
  },
  animations: [MeFadeInOutAnimation],
})
export class MeControlListComponent {
  @Input()
  listTitle: string;

  @Output()
  addItemClicked = new EventEmitter<void>();
}
