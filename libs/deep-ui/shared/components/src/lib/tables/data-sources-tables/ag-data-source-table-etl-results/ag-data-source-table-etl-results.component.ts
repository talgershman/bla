import {IServerSideGroupSelectionState} from '@ag-grid-community/core';
import {Component, computed, inject, Signal, signal, WritableSignal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MeRowNode} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeAreYouSureDialogComponent} from '@mobileye/material/src/lib/components/dialogs/are-you-sure';
import {EnrichTable, EnrichTableRow} from '@mobileye/material/src/lib/components/enrich-table';
import {MePortalSrcDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {
  compareDates,
  endOfToday,
  formatDateFullOrReturnBlank,
  formatDateShortWithPermanent,
  getFutureDateFromNow,
  toShortDate,
} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {MultipleJobDataRetentionDialogComponent} from 'deep-ui/shared/components/src/lib/dialogs/multiple-job-data-retention-dialog';
import {AgDataSourceBaseDirective} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {AgDataSourceTableEtlResultsStandaloneComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-etl-results-standalone';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DataRetentionService} from 'deep-ui/shared/core';
import {Datasource, DataSourceSelection, ETLJobSnakeCase} from 'deep-ui/shared/models';
import flatten from 'lodash-es/flatten';
import {firstValueFrom, of} from 'rxjs';
import {catchError, first} from 'rxjs/operators';

import {
  AgDataSourceTableEtlResultsService,
  AgDataSourceTableEtlResultsState,
} from './ag-data-source-table-etl-results.service';

@UntilDestroy()
@Component({
  selector: 'de-ag-data-source-table-etl-results',
  templateUrl: './ag-data-source-table-etl-results.component.html',
  styleUrls: ['./ag-data-source-table-etl-results.component.scss'],
  providers: [AgDataSourceTableEtlResultsService],
  imports: [
    MatButtonModule,
    MatDialogModule,
    MeTooltipDirective,
    AgDataSourceTableEtlResultsStandaloneComponent,
    MePortalSrcDirective,
    MatIconModule,
  ],
})
export class AgDataSourceTableEtlResultsComponent extends AgDataSourceBaseDirective {
  readonly dataType = 'etl_results';
  viewName = DataSourceDynamicViewEnum.ETL_RESULTS;
  tableState: WritableSignal<AgDataSourceTableEtlResultsState> = signal({
    selectedRowsState: [],
    rowNodes: [],
    hasMultipleSelections: false,
  });
  dataRetentionActionTooltip: Signal<string> = computed((): string => {
    if (!this.tableState().rowNodes.length) {
      return 'Select one or more data sources or tags/output path subgroups';
    }
    return '';
  });
  deleteActionTooltip: Signal<string> = computed((): string => {
    if (this.tableState().hasMultipleSelections) {
      return 'Only applies to a single selection';
    }

    const {dataSource: datasource, version} = this.selectedDataSource() || {};
    if (!version && !datasource) {
      return 'Enabled only when selecting bottom level data source';
    } else if (datasource.status === 'updating' || datasource.status === 'creating') {
      return `Data source is updating or creating `;
    } else if (!this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin(datasource, 'team')) {
      return `Data source ${datasource.name} was created by a member of group ${datasource.team} and can be deleted only by a member of that team.`;
    }

    return '';
  });

  private dataRetentionService = inject(DataRetentionService);
  private agDataSourceTableEtlResultsService = inject(AgDataSourceTableEtlResultsService);

  async onDeleteActionClicked(selection?: DataSourceSelection): Promise<void> {
    const selectedDataSource = selection?.dataSource ?? this.selectedDataSource().dataSource;
    const dsToBeDeleted = await firstValueFrom(
      this.dataSourceService.getJobIds(selectedDataSource.jobIds, this.dataType),
    );

    const dialogRef = this.dialog.open(MeAreYouSureDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dialog-panel-overlap',
    });
    dialogRef.componentInstance.title = 'Confirm Action';
    dialogRef.componentInstance.tableDescription = `<div>The data sources below, created by job: <span class='mat-title-medium text-sys-error'>${selectedDataSource.jobIds[0]}</span> will be deleted:  <br/><br /></div>`;
    dialogRef.componentInstance.table = this._getEnrichTable(dsToBeDeleted);
    dialogRef.componentInstance.cancelPlaceHolder = `Cancel`;
    dialogRef.componentInstance.confirmPlaceHolder = `Delete`;
    dialogRef.componentInstance.confirmed
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onDelete(selectedDataSource));
  }

  onDelete(dataSource?: Datasource): void {
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

  onDataSourceMultiSelectionsChanged(
    selectedRowsState: Array<IServerSideGroupSelectionState>,
  ): void {
    this.tableState.update((state: AgDataSourceTableEtlResultsState) => ({
      ...state,
      selectedRowsState,
      rowNodes: this.agDataSourceTableEtlResultsService.getJobIdsUpdatedRowNodes(
        this.gridApi,
        selectedRowsState,
      ),
    }));
    this.selectedDataSource.set(
      this.agDataSourceTableEtlResultsService.getSelectedInMultipleSelection(this.tableState),
    );
  }

  async onDataRetentionUpdateClicked(): Promise<void> {
    const jobIds = Array.from(
      new Set<string>(
        flatten(
          this.tableState().rowNodes.map((rowNode: MeRowNode<Datasource>) => rowNode.data.jobIds),
        ),
      ),
    );
    const dsToBeAffected = jobIds.length
      ? await firstValueFrom(this.dataSourceService.getDsByJobIds(jobIds, this.dataType))
      : [];

    const filteredDsToBeAffected = dsToBeAffected
      .filter(
        (ds: Datasource) =>
          this.deepUtilService.isIncludedInDeepGroupsOrIsAdmin(ds, 'team') && // todo: remove team
          compareDates(endOfToday(), ds.expirationDate),
      )
      .sort((ds1: Datasource, ds2: Datasource) =>
        compareDates(ds1.expirationDate, ds2.expirationDate) ? -1 : 1,
      );

    const affectedJobIdsAndDs =
      this.agDataSourceTableEtlResultsService.getDataSourcesJobIds(filteredDsToBeAffected);

    const filteredAffectedJobIds = affectedJobIdsAndDs.map(
      (obj: {jobId: string; dataSources: Array<Datasource>}) => obj.jobId,
    );

    await this._loadDataRetentionDialog();
    const config = this.dataRetentionService.getEtlResultsDataRetentionConfig();
    const currentJob = {
      data_retention: {},
    } as Partial<ETLJobSnakeCase>;
    if (filteredAffectedJobIds.length > 0) {
      Object.keys(config).forEach(
        (k: string) =>
          (currentJob.data_retention[k] = toShortDate(
            getFutureDateFromNow(config[k].default, 'days'),
          )),
      );
    }
    const dialogRef = this.dialog.open(MultipleJobDataRetentionDialogComponent, {
      autoFocus: false,
      restoreFocus: false,
      panelClass: ['dialog-panel-overlap', 'dialog-retention-etl-results'],
    });
    if (filteredAffectedJobIds.length > 0) {
      Object.keys(config).forEach(
        (k: string) =>
          (currentJob.data_retention[k] = toShortDate(
            getFutureDateFromNow(config[k].default, 'days'),
          )),
      );
      dialogRef.componentInstance.tableDescription = `<div>The data sources below will be affected:  <br/><br /></div>`;
    } else {
      dialogRef.componentInstance.tableDescription = `<div>No jobs created by your team were found.<br/>If you need to select a specific datasource, please deselect its subgroup first.<br/><br /></div>`;
    }
    dialogRef.componentInstance.job = currentJob;
    dialogRef.componentInstance.jobIds = filteredAffectedJobIds;
    dialogRef.componentInstance.showShortTimeUpdateMsg = true;
    dialogRef.componentInstance.config = config;
    dialogRef.componentInstance.table = this._getDataRetentionEnrichTable(affectedJobIdsAndDs);
    dialogRef.componentInstance.ignoreNoDataRetentionChange = true;
  }

  private async _loadDataRetentionDialog(): Promise<void> {
    import('deep-ui/shared/components/src/lib/dialogs/multiple-job-data-retention-dialog');
  }

  private _getEnrichTable(datasources: Array<Datasource>): EnrichTable {
    const headers: EnrichTableRow = {
      cells: [
        {
          text: 'Name',
        },
        {
          text: 'Created By',
        },
        {
          text: 'Creation Date',
        },
      ],
    };

    const rows: Array<EnrichTableRow> = [];

    datasources.forEach((ds: Datasource) =>
      rows.push({
        cells: [
          {
            text: ds.name,
            classes: ['truncated-cell'],
          },
          {
            text: ds.createdBy,
          },
          {
            text: formatDateFullOrReturnBlank(ds.createdAt),
          },
        ],
      }),
    );

    const additionalContentHtml = `<div><br/><br /><b>Notes:</b>
<ul class="mt-1">
    <li>Datasets that were created by query on the data-source will be changed to "inactive" status while <b>keeping their data</b>.</li>
    <li>Deletion is permanent and final.</li>
</ul>
<br/>Please press the "Delete" button to approve.</div>`;

    return {
      headers,
      rows,
      additionalContentHtml,
    };
  }

  private _getDataRetentionEnrichTable(
    affectedJobIdsAndDs: Array<{jobId: string; dataSources: Array<Datasource>}>,
  ): EnrichTable {
    const headers: EnrichTableRow = {
      cells: [
        {
          text: 'Job Id / Name',
        },
        {
          text: 'Created By',
        },
        {
          text: 'Expires At',
        },
        {
          text: 'Creation Date',
        },
      ],
    };

    const rows: Array<EnrichTableRow> = [];

    for (const affected of affectedJobIdsAndDs) {
      rows.push({
        cells: [
          {
            text: affected.jobId,
            classes: ['truncated-cell', 'mat-label-large'],
          },
          {
            text: '',
          },
          {
            text: '',
          },
          {
            text: '',
          },
        ],
      });
      affected.dataSources.forEach((ds: Datasource) =>
        rows.push({
          cells: [
            {
              text: ds.name,
              classes: ['truncated-cell', 'indent-4', 'min-w-80'],
            },
            {
              text: ds.createdBy,
              classes: ['min-w-16'],
            },
            {
              text: formatDateShortWithPermanent(ds.expirationDate),
              classes: ['min-w-16'],
            },
            {
              text: formatDateFullOrReturnBlank(ds.createdAt),
              classes: ['max-w-24'],
            },
          ],
        }),
      );
    }

    return {
      headers,
      rows,
    };
  }
}
