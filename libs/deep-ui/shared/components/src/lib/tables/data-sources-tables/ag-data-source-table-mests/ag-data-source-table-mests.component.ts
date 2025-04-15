import {Component, computed} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MeAreYouSureDialogComponent} from '@mobileye/material/src/lib/components/dialogs/are-you-sure';
import {MePortalSrcDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {AgDataSourceBaseDirective} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {AgDataSourceTableMestsStandaloneComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-mests-standalone';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DataSourceSelection, MestDatasourceGroup} from 'deep-ui/shared/models';
import {of} from 'rxjs';
import {catchError, first} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-ag-data-source-table-mests',
  templateUrl: './ag-data-source-table-mests.component.html',
  styleUrls: ['./ag-data-source-table-mests.component.scss'],
  imports: [
    MatButtonModule,
    MatDialogModule,
    MeTooltipDirective,
    AgDataSourceTableMestsStandaloneComponent,
    MePortalSrcDirective,
    MatIconModule,
  ],
})
export class AgDataSourceTableMestsComponent extends AgDataSourceBaseDirective {
  viewName = DataSourceDynamicViewEnum.MESTS;
  deleteActionTooltip = computed(() => {
    const {dataSource: datasource, mestGroup} = this.selectedDataSource() || {};

    if (!datasource && !mestGroup) {
      return 'No selection made';
    } else if (datasource) {
      return `Enabled only when selecting the group job id`;
    } else if (!this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin(datasource, 'team')) {
      return `Data source ${datasource.name} was created by a member of group ${datasource.team} and can be deleted only by a member of that team.`;
    }
    return '';
  });

  async onDeleteActionClicked(selection?: DataSourceSelection): Promise<void> {
    const selectedGroup = selection?.mestGroup ?? this.selectedDataSource().mestGroup;
    const dialogRef = this.dialog.open(MeAreYouSureDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.title = 'Confirm Action';
    dialogRef.componentInstance.contentHtml = `<div>All ${selectedGroup?.childCount} data sources created by job: <span class='mat-title-medium text-sys-error'>${selectedGroup?.jobId}</span> will be deleted.<br/><br/>
Data sources are created from the tables define from the category sub category in itrk or from the PEXT files.<br/><br/>
<b>Notes:</b>
<ul class="mt-1">
    <li>Datasets that were created by query on the data-source will be changed to "inactive" status while <b>keeping their data</b>.</li>
    <li>Deletion is permanent and final.</li>
</ul>
<br/>Please press the "Delete" button to approve.</div>`;
    dialogRef.componentInstance.cancelPlaceHolder = `Cancel`;
    dialogRef.componentInstance.confirmPlaceHolder = `Delete`;
    dialogRef.componentInstance.confirmed
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onDelete(selectedGroup));
  }

  onDelete(mestGroup?: MestDatasourceGroup): void {
    this.gridApi?.setGridOption('loading', true);
    this.dataSourceService
      .delete(mestGroup?.sampleDataSourceId, mestGroup?.jobId)
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
}
