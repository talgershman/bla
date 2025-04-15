import {Component, computed, inject, Signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MeAreYouSureDialogComponent} from '@mobileye/material/src/lib/components/dialogs/are-you-sure';
import {MePortalSrcDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {JobsDynamicViewEnum} from 'deep-ui/shared/components/src/lib/common';
import {
  AgDataSourceBaseDirective,
  DataSourceTableBaseService,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {AgDataSourceTablePerfectsStandaloneComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-perfects-standalone';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {PerfectTransformWizardComponent} from 'deep-ui/shared/components/src/lib/wizards/perfect-transform-wizard';
import {DataRetentionService, EtlService} from 'deep-ui/shared/core';
import {
  Datasource,
  DataSourceSelection,
  ETL,
  PerfectTransformRunType,
  VersionDataSource,
} from 'deep-ui/shared/models';
import {firstValueFrom, of} from 'rxjs';
import {catchError, first} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-ag-data-source-table-perfects',
  templateUrl: './ag-data-source-table-perfects.component.html',
  styleUrls: ['./ag-data-source-table-perfects.component.scss'],
  providers: [DataSourceTableBaseService],
  imports: [
    MatButtonModule,
    MatDialogModule,
    MeTooltipDirective,
    AgDataSourceTablePerfectsStandaloneComponent,
    MePortalSrcDirective,
    MatIconModule,
  ],
})
export class AgDataSourceTablePerfectsComponent extends AgDataSourceBaseDirective {
  viewName = DataSourceDynamicViewEnum.PERFECTS;
  newRevisionActionTooltip: Signal<string> = computed(() => {
    const {dataSource: datasource, version} = this.selectedDataSource() || {};
    if (!version && !datasource) {
      return 'No selection made';
    } else if (version) {
      return 'Enabled when selecting a top level data source';
    } else {
      if (
        datasource.status === 'updating' ||
        datasource.status === 'frozen' ||
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
    const {dataSource: datasource, version} = this.selectedDataSource() || {};
    const rollbackVersion = this._getRollbackVersionDataSource(datasource, version);
    if (!datasource && !version) {
      return 'No selection made';
    } else {
      if (datasource && (datasource.status === 'updating' || datasource.status === 'creating')) {
        return `Data source is updating or creating`;
      } else if (version && version.status !== 'active') {
        return `Version status is not allowed`;
      } else if (version && !rollbackVersion) {
        return `You can't delete the first version of the data source`;
      } else if (!this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin(datasource, 'team')) {
        return `Data source ${datasource.name} was created by a member of group ${datasource.team} and can be deleted only by a member of that team.`;
      }
    }
    return '';
  });

  private etlService = inject(EtlService);
  private dataRetentionService = inject(DataRetentionService);

  onCreatedActionButtonClicked(): void {
    this._openWizard('CREATE');
  }

  onEditActionClicked(selection?: DataSourceSelection): void {
    this._openWizard('UPDATE', selection?.dataSource);
  }

  async onDeleteActionClicked(selection?: DataSourceSelection): Promise<void> {
    const selectedDataSource = selection?.dataSource ?? this.selectedDataSource().dataSource;
    const selectedVersion = selection?.version ?? this.selectedDataSource()?.version;
    if (selectedVersion) {
      await this._handleVersionDataSourceDeletion(selectedDataSource, selectedVersion);
    } else {
      await this._handleParentDataSourceDeletion(selectedDataSource);
    }
  }

  onDelete(dataSource: Datasource, selectedVersion?: VersionDataSource): void {
    if (selectedVersion) {
      this._onDeleteVersionDataSource(dataSource, selectedVersion);
    } else {
      this._onDeleteParentDataSource(dataSource);
    }
  }

  private _onDeleteVersionDataSource(
    dataSource: Datasource,
    selectedVersion: VersionDataSource,
  ): void {
    this.gridApi?.setGridOption('loading', true);
    this.dataSourceService
      .deleteVersion(dataSource.id, dataSource.name, selectedVersion.userFacingVersion)
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

  private _onDeleteParentDataSource(dataSource?: Datasource): void {
    this.gridApi?.setGridOption('loading', true);
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

  private async _openWizard(
    runType: PerfectTransformRunType,
    dataSource?: Datasource,
  ): Promise<void> {
    const selectedDataSource = dataSource ?? this.selectedDataSource()?.dataSource;
    const dialogData: any = {
      runType,
    };
    if (runType === 'UPDATE') {
      const selectedETL = await this._getSelectedDatasourceEtl(selectedDataSource.etlId);
      dialogData.selectedDatasource = selectedDataSource;
      dialogData.selectedDatasourceEtl = selectedETL;
      dialogData.siblingsDatasources =
        await this.dataSourceService.getSiblingDatasources(selectedDataSource);
    }
    await this._openPerfectTransformWizard(dialogData);
  }

  private async _getSelectedDatasourceEtl(etlId: number): Promise<ETL> {
    return firstValueFrom(this.etlService.getSingle(etlId));
  }

  private async _openPerfectTransformWizard(dialogData: any): Promise<void> {
    await this._loadWizardModule();
    const dataRetentionInfoObj = this.dataRetentionService.getPerfectTransformDataRetentionConfig();
    const dialogRef = this.dialog.open(PerfectTransformWizardComponent, {
      width: '72rem',
      height: '90vh',
      maxHeight: '64rem',
      panelClass: 'dialog-panel-wizard',
      autoFocus: false,
      restoreFocus: false,
      data: {
        ...dialogData,
        dataRetentionInfoObj,
      },
    });
    dialogRef.componentInstance.submitJobFired.pipe(first()).subscribe(() => {
      this._navigateToPerfectTransformJobs();
    });
  }

  private async _handleVersionDataSourceDeletion(
    selectedDataSource: Datasource,
    selectedVersion: VersionDataSource,
  ): Promise<void> {
    let contentHtml: string;
    const rollbackVersion = this._getRollbackVersionDataSource(selectedDataSource, selectedVersion);
    const isLatestVersion =
      selectedDataSource.latestUserVersion === selectedVersion.userFacingVersion;
    if (isLatestVersion) {
      contentHtml = `<div>You have requested to delete version ${selectedVersion.userFacingVersion}.<br>
      With this change, your data source will be <span class='mat-title-medium text-sys-error'>rolled back to version ${rollbackVersion.userFacingVersion}</span>.<br>Are you sure you want to proceed ?</div>`;
    } else {
      contentHtml = `<div>You have requested to delete version ${selectedVersion.userFacingVersion}. Deleting this version will also <span class='mat-title-medium text-sys-error'>remove all versions created after it</span>.<br>
      With this change, your data source will be <span class='mat-title-medium text-sys-error'>rolled back to version ${rollbackVersion.userFacingVersion}</span>.<br>Are you sure you want to proceed ?</div>`;
    }
    this._openDeleteDialog(selectedDataSource, contentHtml, selectedVersion);
  }

  private _getRollbackVersionDataSource(
    dataSource: Datasource,
    deletedVersionDataSource: VersionDataSource,
  ): VersionDataSource {
    if (!deletedVersionDataSource) {
      return null;
    }
    const deleteIndex = dataSource.datasourceversionSet.findIndex(
      (version) => version.userFacingVersion === deletedVersionDataSource.userFacingVersion,
    );
    if (deleteIndex > -1 && deleteIndex < dataSource.datasourceversionSet.length - 1) {
      const updatedSet: Array<VersionDataSource> = dataSource.datasourceversionSet.slice(
        deleteIndex + 1,
      );
      return updatedSet.find((version: VersionDataSource) => version.status === 'active');
    } else {
      return null;
    }
  }

  private async _handleParentDataSourceDeletion(selectedDataSource: Datasource): Promise<void> {
    const siblings = await this.dataSourceService.getSiblingDatasources(selectedDataSource);
    let siblingsHtml = '';
    siblings.forEach((sibling: Datasource) => {
      siblingsHtml += `<li>
        Sub Type: ${sibling.dataSubType}, ID : ${sibling.id}
      </li>`;
    });
    const contentHtml = `<div>Are you sure you want to delete all versions of : <span class='mat-title-medium text-sys-error'>${selectedDataSource.name}</span> ? <br/><br /> Data Sources:<ul><li>Sub Type: ${selectedDataSource.dataSubType}, ID : ${selectedDataSource.id}</li>
${siblingsHtml}</ul></div>`;
    this._openDeleteDialog(selectedDataSource, contentHtml);
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
    dialogRef.componentInstance.title = 'Rollback Data Source';
    dialogRef.componentInstance.contentHtml = contentHtml;
    dialogRef.componentInstance.cancelPlaceHolder = `Cancel`;
    dialogRef.componentInstance.confirmPlaceHolder = `Delete`;
    dialogRef.componentInstance.confirmed
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onDelete(selectedDataSource, selectedVersion));
  }

  private _navigateToPerfectTransformJobs(): void {
    this.router.navigate(['./jobs'], {
      queryParams: {
        view: JobsDynamicViewEnum.PERFECT_TRANSFORM,
      },
    });
  }

  private async _loadWizardModule(): Promise<void> {
    import('deep-ui/shared/components/src/lib/wizards/perfect-transform-wizard');
  }
}
