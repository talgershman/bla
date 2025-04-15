import {INoRowsOverlayAngularComp} from '@ag-grid-community/angular';
import {INoRowsOverlayParams} from '@ag-grid-community/core';
import {Component} from '@angular/core';
import {MeTableContext} from '@mobileye/material/src/lib/components/ag-table/entities';

@Component({
  selector: 'me-ag-no-rows-overlay',
  templateUrl: './ag-no-rows-overlay.component.html',
  styleUrls: ['./ag-no-rows-overlay.component.scss'],
})
export class MeAgNoRowsOverlayComponent implements INoRowsOverlayAngularComp {
  agInit(params: INoRowsOverlayParams): void {
    const context = params.context as MeTableContext<any>;
    context.parentComponent.onNoRows();
  }
}
