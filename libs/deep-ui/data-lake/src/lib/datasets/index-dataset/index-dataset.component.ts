import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {MeAgTableActionItemEvent} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {getFutureDateFromNow, toShortDate} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ofType} from '@ngrx/effects';
import {ScannedActionsSubject} from '@ngrx/store';
import {DUPLICATE_SUFFIX_STR} from 'deep-ui/shared/common';
import {AgEntityListComponent} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {
  AgBaseIndexPageDirective,
  CommonTableActions,
} from 'deep-ui/shared/components/src/lib/common';
import {
  DatasetCustomActions,
  DatasetTableComponent,
} from 'deep-ui/shared/components/src/lib/tables/dataset-table';
import {DataRetentionService, DatasetService, jobAPIActions} from 'deep-ui/shared/core';
import {DataRetentionKnownKeysEnum, Dataset} from 'deep-ui/shared/models';
import {of, Subject, takeUntil} from 'rxjs';
import {catchError, first} from 'rxjs/operators';

import {DatasetDataRetentionDialogComponent} from '../../components/dialogs/dataset-data-retention-dialog/dataset-data-retention-dialog.component';
import {JumpFileDialogComponent} from '../../components/dialogs/jump-file-dialog/jump-file-dialog.component';
import {actionButtons, breadcrumbs} from './index-dataset-entities';

@UntilDestroy()
@Component({
  selector: 'de-index-dataset',
  templateUrl: './index-dataset.component.html',
  styleUrls: ['./index-dataset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeBreadcrumbsComponent, AgEntityListComponent, DatasetTableComponent],
})
export class IndexDatasetComponent extends AgBaseIndexPageDirective<Dataset> implements OnInit {
  private datasetService = inject(DatasetService);
  private dataRetentionService = inject(DataRetentionService);
  private actionListener = inject(ScannedActionsSubject);

  breadcrumbs = breadcrumbs;
  actionButtons = actionButtons;

  triggerTableRefresh = new Subject<void>();

  queryParams = this.activatedRoute?.snapshot?.queryParams || {};
  getTeamProp(): string {
    return 'team';
  }
  getIdProp(): string {
    return 'id';
  }
  getNameProp(): string {
    return 'name';
  }
  getEntityType(): string {
    return 'dataset';
  }

  getPageName(): string {
    return 'index-dataset';
  }
  onDelete(tableAction?: MeAgTableActionItemEvent<Dataset>): void {
    const id = this.getSelectedId(tableAction);
    const name = this.getSelectedName(tableAction);
    this.gridApi.setGridOption('loading', true);
    this.datasetService
      .delete(id, name)
      .pipe(
        catchError(() => of(false)),
        first(),
      )
      .subscribe((response) => {
        this.tableApiService?.hideOverlay();
        if (response !== false) {
          this.triggerRefresh();
        }
      });
  }

  override async onTableActionClicked(action: MeAgTableActionItemEvent<Dataset>): Promise<void> {
    if (action.id === DatasetCustomActions.DOWNLOAD_JUMP_FILE) {
      this._openJumpFileDialog(action.selected);
    } else if (action.id === CommonTableActions.DUPLICATE) {
      action.selected.name = `${action.selected.name}${DUPLICATE_SUFFIX_STR}`;
      action.selected = this._adjustDatasetPropsForDuplication(action.selected);
    } else if (action.id === CommonTableActions.DATA_RETENTION) {
      await this._openDataRetentionDialog(action.selected);
    }
    super.onTableActionClicked(action);
  }

  triggerRefresh(): void {
    this.triggerTableRefresh.next();
  }

  private _openJumpFileDialog(dataset: Dataset): void {
    const dialogRef = this.dialog.open(JumpFileDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.dataset = dataset;
    dialogRef.componentInstance.closeDialog.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
    });
  }

  private _adjustDatasetPropsForDuplication(dataset: Dataset): Dataset {
    const config = this.dataRetentionService.getDatasetDataRetentionConfig();
    // eslint-disable-next-line
    dataset.pathOnS3 = '';
    // eslint-disable-next-line
    dataset.queryString = '';
    // eslint-disable-next-line
    dataset.numberOfClips = 0;
    // eslint-disable-next-line
    delete dataset.status;
    // eslint-disable-next-line
    dataset.expirationDate = toShortDate(
      getFutureDateFromNow(config[DataRetentionKnownKeysEnum.DATASETS].default, 'days'),
    );
    return dataset;
  }

  private async _openDataRetentionDialog(dataset: Dataset): Promise<void> {
    const config = this.dataRetentionService.getDatasetDataRetentionConfig();
    const dialogRef = this.dialog.open(DatasetDataRetentionDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.config = config;
    dialogRef.componentInstance.dataset = dataset;
    this.actionListener
      .pipe(
        ofType(jobAPIActions.patchDatasetDataRetentionSuccess),
        takeUntil(dialogRef.beforeClosed()),
      )
      .subscribe(() => {
        setTimeout(() => this.triggerRefresh());
      });
  }
}
