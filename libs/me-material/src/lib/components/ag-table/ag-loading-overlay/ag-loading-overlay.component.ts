import {ILoadingOverlayAngularComp} from '@ag-grid-community/angular';
import {ILoadingOverlayParams} from '@ag-grid-community/core';
import {Component} from '@angular/core';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

@Component({
  selector: 'me-ag-loading-overlay',
  templateUrl: './ag-loading-overlay.component.html',
  styleUrls: ['./ag-loading-overlay.component.scss'],
  imports: [MatProgressSpinnerModule],
})
export class MeAgLoadingOverlayComponent implements ILoadingOverlayAngularComp {
  agInit(_: ILoadingOverlayParams): void {}
}
