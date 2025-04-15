import {Component, EventEmitter, Output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';

@Component({
  selector: 'me-ag-table-refresh-button',
  templateUrl: './ag-table-refresh-button.component.html',
  styleUrls: ['./ag-table-refresh-button.component.scss'],
  imports: [MatButtonModule, MatIconModule, MeTooltipDirective],
})
export class MeAgTableRefreshButtonComponent {
  @Output()
  clicked = new EventEmitter<void>();
}
