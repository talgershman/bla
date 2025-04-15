import {Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeAgTableActionItemEvent} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {UntilDestroy} from '@ngneat/until-destroy';
import copy from 'copy-to-clipboard';
import {ServerSideEntityTableBaseDirective} from 'deep-ui/shared/components/src/lib/tables/common';
import {DatasetDatasource, DatasetService} from 'deep-ui/shared/core';
import {Dataset} from 'deep-ui/shared/models';

import {DatasetCustomActions, getDatasetTableColumns} from './dataset-table-entities';

@UntilDestroy()
@Component({
  selector: 'de-dataset-table',
  templateUrl: './dataset-table.component.html',
  styleUrls: ['./dataset-table.component.scss'],
  imports: [MeServerSideTableComponent, MeTooltipDirective, MatButtonModule, MatIconModule],
})
export class DatasetTableComponent extends ServerSideEntityTableBaseDirective<Dataset> {
  private datasetService = inject(DatasetService);
  private snackbarService = inject(MeSnackbarService);

  setDatasource = () => (this.agGridDataSource = new DatasetDatasource(this.datasetService));

  getTableColumnsDef = getDatasetTableColumns;

  idProperty = 'id';

  teamProperty: 'group' | 'team' = 'team';

  columnBeforeAction = 'modifiedAt';

  ignoreTeamFilterAttributes = ['id'];

  ignoredFiltersKeys = [];

  override async onActionClicked(action: MeAgTableActionItemEvent<Dataset>): Promise<void> {
    if (action.id === DatasetCustomActions.DOWNLOAD_CLIP_LIST) {
      await this.datasetService.downloadClipList(action.selected);
    } else if (action.id === DatasetCustomActions.COPY_S3_PATH) {
      copy(action.selected.pathOnS3);
      this.snackbarService.onCopyToClipboard();
    } else {
      await super.onActionClicked(action);
    }
  }

  protected override setTableOptions(): void {
    this.tableOptions = {
      templates: {
        nameCell: this.nameCell,
        statusCell: this.statusCell,
      },
      showActions: !this.hideTableActions,
      isIncludedInDeepGroupsOrIsAdmin: this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin.bind(
        this.deepUtilService,
      ),
    };
  }

  copyJobIdToClipboard(event: MouseEvent, id: number): void {
    event.stopPropagation();
    copy(id.toString());
    this.snackbar.onCopyToClipboard();
  }
}
