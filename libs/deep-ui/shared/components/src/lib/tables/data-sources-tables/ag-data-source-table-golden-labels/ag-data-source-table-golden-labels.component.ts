import {Component, computed, inject, Signal} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MeAreYouSureDialogComponent} from '@mobileye/material/src/lib/components/dialogs/are-you-sure';
import {MePortalSrcDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {MeTimerService} from '@mobileye/material/src/lib/services/timer';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {
  CreateGoldenLabelsDataSourceDialogComponent,
  GOLDEN_LABELS_FLOW,
} from 'deep-ui/shared/components/src/lib/dialogs/create-golden-labels-data-source-dialog';
import {
  AgDataSourceBaseDirective,
  DataSourceTableBaseService,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {AgDataSourceTableGoldenLabelsStandaloneComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-golden-labels-standalone';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {Datasource, DataSourceSelection, VersionDataSource} from 'deep-ui/shared/models';
import {firstValueFrom, of} from 'rxjs';
import {catchError, first, tap} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-ag-data-source-table-golden-labels',
  templateUrl: './ag-data-source-table-golden-labels.component.html',
  styleUrls: ['./ag-data-source-table-golden-labels.component.scss'],
  providers: [DataSourceTableBaseService],
  imports: [
    MatButtonModule,
    MatDialogModule,
    MeTooltipDirective,
    MePortalSrcDirective,
    MatIconModule,
    AgDataSourceTableGoldenLabelsStandaloneComponent,
    ReactiveFormsModule,
  ],
})
export class AgDataSourceTableGoldenLabelsComponent extends AgDataSourceBaseDirective {
  viewName = DataSourceDynamicViewEnum.GOLDEN_LABELS;

  private timerService = inject(MeTimerService);

  private snackBarService = inject(MeSnackbarService);

  updateSchemaActionTooltip: Signal<string> = computed(() => {
    const {dataSource: datasource, version, semanticGroup} = this.selectedDataSource() || {};
    if (semanticGroup) {
      return 'Enabled only when the data source selected';
    }
    if (!version && !datasource) {
      return 'No selection made';
    } else if (version) {
      return 'Enabled when selecting a top level data source';
    } else {
      if (
        datasource.status === 'updating' ||
        datasource.status === 'inactive' ||
        datasource.status === 'failed' ||
        datasource.status === 'creating'
      ) {
        return 'Invalid data source status';
      } else if (!this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin(datasource, 'team')) {
        return `Data source ${datasource.name} was created by a member of team ${datasource.team}, and only members of that team can create a new version.`;
      }
    }
    return '';
  });

  deleteActionTooltip: Signal<string> = computed(() => {
    const {dataSource: datasource, version, semanticGroup} = this.selectedDataSource() || {};
    if (semanticGroup) {
      return 'Enabled only when the data source selected';
    }
    if (!datasource && !version) {
      return 'No selection made';
    } else {
      if (datasource && (datasource.status === 'updating' || datasource.status === 'creating')) {
        return `Data source is updating or creating`;
      } else if (version) {
        return `Enabled only when selecting the group data source`;
      } else if (!this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin(datasource, 'team')) {
        return `Data source ${datasource.name} was created by a member of group ${datasource.team} and can be deleted only by a member of that team.`;
      }
    }
    return '';
  });

  onCreatedActionButtonClicked(): void {
    this._openWizard('create');
  }

  onEditActionClicked(selection?: DataSourceSelection): void {
    this._openWizard('updateSchema', selection?.dataSource);
  }

  onDelete(dataSource: Datasource, selectedVersion?: VersionDataSource): void {
    if (dataSource && !selectedVersion) {
      this._onDeleteParentDataSource(dataSource);
    }
  }

  async onDeleteActionClicked(selection?: DataSourceSelection): Promise<void> {
    const selectedDataSource = selection?.dataSource ?? this.selectedDataSource().dataSource;
    await this._handleParentDataSourceDeletion(selectedDataSource);
  }

  private async _openWizard(flow: GOLDEN_LABELS_FLOW, dataSource?: Datasource): Promise<void> {
    const selectedDataSource = dataSource ?? this.selectedDataSource()?.dataSource;
    const dialogData: any = {
      flow,
    };
    if (flow === 'updateSchema') {
      dialogData.selectedDatasource = selectedDataSource;
      dialogData.schema = await firstValueFrom(
        this.dataSourceService.getAttributes(selectedDataSource, null, true),
      );
    }
    await this._openGoldenLabelsWizard(dialogData);
  }

  private async _openGoldenLabelsWizard(dialogData: any): Promise<void> {
    await this._loadDialogComponent();
    const dialogRef = this.dialog.open(CreateGoldenLabelsDataSourceDialogComponent, {
      width: '72rem',
      height: '90vh',
      maxHeight: '64rem',
      panelClass: 'dialog-panel-wizard',
      autoFocus: false,
      restoreFocus: false,
      data: dialogData,
    });

    dialogRef.componentInstance.submitted.subscribe(() => {
      this._triggerTableRefresh();
    });
  }

  private async _handleParentDataSourceDeletion(selectedDataSource: Datasource): Promise<void> {
    const contentHtml = `<div>Are you sure you want to delete all versions of : <span class='mat-title-medium text-sys-error'>${selectedDataSource.name}</span> ?`;
    this._openDeleteDialog(selectedDataSource, contentHtml);
  }

  private _onDeleteParentDataSource(dataSource?: Datasource): void {
    this.gridApi.setGridOption('loading', true);
    this.dataSourceService
      .delete(dataSource.id, dataSource.name)
      .pipe(
        catchError(() => of(false)),
        first(),
      )
      .subscribe((response) => {
        this.tableApiService?.hideOverlay();
        if (response !== false) {
          this.triggerTableRefresh.next();
        }
      });
  }

  private _triggerTableRefresh(): void {
    this.timerService
      .timer(200)
      .pipe(
        tap(() => {
          this.triggerTableRefresh.next();
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  private _openDeleteDialog(
    selectedDataSource: Datasource,
    contentHtml: string,
    selectedVersion?: VersionDataSource,
  ): void {
    const dialogRef = this.dialog.open(MeAreYouSureDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.title = 'Delete Data Source';
    dialogRef.componentInstance.contentHtml = contentHtml;
    dialogRef.componentInstance.cancelPlaceHolder = `Cancel`;
    dialogRef.componentInstance.confirmPlaceHolder = `Delete`;
    dialogRef.componentInstance.confirmed
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onDelete(selectedDataSource, selectedVersion));
  }

  private async _loadDialogComponent(): Promise<void> {
    import('deep-ui/shared/components/src/lib/dialogs/create-golden-labels-data-source-dialog');
  }
}
