import {Component, computed} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MePortalSrcDirective} from '@mobileye/material/src/lib/directives/portal';
import {UntilDestroy} from '@ngneat/until-destroy';
import {PreviewGtDialogComponent} from 'deep-ui/shared/components/src/lib/dialogs/preview-gt-dialog';
import {
  AgDataSourceBaseDirective,
  DataSourceTableBaseService,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {AgDataSourceTableSimulatorStandaloneComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-simulator-standalone';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DataSourceSelection} from 'deep-ui/shared/models';
import {debounce} from 'lodash-decorators/debounce';

@UntilDestroy()
@Component({
  selector: 'de-ag-data-source-table-simulator',
  templateUrl: './ag-data-source-table-simulator.component.html',
  styleUrls: ['./ag-data-source-table-simulator.component.scss'],
  providers: [DataSourceTableBaseService],
  imports: [
    MatButtonModule,
    MatDialogModule,
    MePortalSrcDirective,
    MatIconModule,
    AgDataSourceTableSimulatorStandaloneComponent,
  ],
})
export class AgDataSourceTableSimulatorComponent extends AgDataSourceBaseDirective {
  viewName = DataSourceDynamicViewEnum.SIMULATOR;
  deleteActionTooltip = computed(() => '');

  onDeleteActionClicked(_?: DataSourceSelection): Promise<void> {
    return Promise.resolve(undefined);
  }

  @debounce(200)
  async onPreviewClicked(): Promise<void> {
    await this._loadPreviewDialog();
    this.dialog.open(PreviewGtDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dialog-panel-wizard',
    });
  }

  private async _loadPreviewDialog(): Promise<void> {
    import('deep-ui/shared/components/src/lib/dialogs/preview-gt-dialog');
  }
}
