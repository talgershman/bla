import {ILoadingCellRendererAngularComp} from '@ag-grid-community/angular';
import {ILoadingCellRendererParams} from '@ag-grid-community/core';
import {Component} from '@angular/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MeTableContext} from '@mobileye/material/src/lib/components/ag-table/entities';

@Component({
  selector: 'me-ag-loading-cell',
  templateUrl: './ag-loading-cell.component.html',
  styleUrls: ['./ag-loading-cell.component.scss'],
  imports: [MatFormFieldModule, MatProgressSpinnerModule],
})
export class MeAgLoadingCellComponent implements ILoadingCellRendererAngularComp {
  failedLoad: boolean;

  agInit(params: ILoadingCellRendererParams): void {
    this.failedLoad = params.node.failedLoad;
    if (this.failedLoad) {
      const parentComponent = (params.context as MeTableContext<any>).parentComponent;
      parentComponent.tableApiService.isLoading.next(false);
    }
  }
}
