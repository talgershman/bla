import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {MeChipsGroupButtonsComponent} from '@mobileye/material/src/lib/components/chips-group-buttons';
import {MePortalTargetDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {UntilDestroy} from '@ngneat/until-destroy';
import {AgDataSourceTableDeSearchComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-de-search';
import {AgDataSourceTableEtlResultsComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-etl-results';
import {AgDataSourceTableGoldenLabelsComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-golden-labels';
import {AgDataSourceTableMestsComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-mests';
import {AgDataSourceTableOfficialDrivesComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-official-drives';
import {AgDataSourceTablePerfectsComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-perfects';
import {AgDataSourceTableSimulatorComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-simulator';
import {
  DataSourceDynamicViewEnum,
  dataSourceGroupButtons,
  DEFAULT_DATA_SOURCE_VIEW_SESSION_KEY,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {Datasource, DataSourceSelection} from 'deep-ui/shared/models';

@UntilDestroy()
@Component({
  selector: 'de-data-source-tables',
  templateUrl: './data-source-tables.component.html',
  styleUrls: ['./data-source-tables.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MePortalTargetDirective,
    AgDataSourceTableDeSearchComponent,
    AgDataSourceTablePerfectsComponent,
    AgDataSourceTableGoldenLabelsComponent,
    AgDataSourceTableSimulatorComponent,
    AgDataSourceTableMestsComponent,
    AgDataSourceTableEtlResultsComponent,
    MeChipsGroupButtonsComponent,
    AgDataSourceTableOfficialDrivesComponent,
  ],
})
export class DataSourceTablesComponent implements OnInit {
  @Input()
  selectedDataSources: Array<Datasource> = [];

  @Input()
  selectedButtonId: DataSourceDynamicViewEnum;

  @Input()
  disableRefreshInterval: boolean;

  @Input()
  selectionMode: boolean;

  @Output()
  dataSourceSelectionChanged = new EventEmitter<DataSourceSelection>();

  @Output()
  tabsButtonClicked = new EventEmitter<DataSourceDynamicViewEnum>();

  DataSourceDynamicViewEnum = DataSourceDynamicViewEnum;

  sessionKey = DEFAULT_DATA_SOURCE_VIEW_SESSION_KEY;

  defaultViewId = DataSourceDynamicViewEnum.PERFECTS;

  groupButtons = [];

  selectedGroupButton: DataSourceDynamicViewEnum;

  private userPreferencesService = inject(MeUserPreferencesService);

  ngOnInit(): void {
    this.selectedGroupButton = this.selectedButtonId || this.defaultViewId;
    this.groupButtons = dataSourceGroupButtons.filter((button) => {
      return !button.hideInSelectionMode || !this.selectionMode;
    });
  }

  onGroupButtonChanged(groupButtonID: DataSourceDynamicViewEnum): void {
    this.userPreferencesService.addUserPreferences(this.sessionKey, groupButtonID);
    this.tabsButtonClicked.next(groupButtonID);
  }

  onDataSourceSelectionChanged(selection: DataSourceSelection): void {
    this.dataSourceSelectionChanged.emit(selection);
  }
}
