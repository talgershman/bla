import {Component, computed} from '@angular/core';
import {UntilDestroy} from '@ngneat/until-destroy';
import {
  AgDataSourceBaseDirective,
  DataSourceTableBaseService,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {AgDataSourceTableOfficialDrivesStandaloneComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-official-drives-standalone';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DataSourceSelection} from 'deep-ui/shared/models';

@UntilDestroy()
@Component({
  selector: 'de-ag-data-source-table-official-drives',
  templateUrl: './ag-data-source-table-official-drives.component.html',
  styleUrls: ['./ag-data-source-table-official-drives.component.scss'],
  providers: [DataSourceTableBaseService],
  imports: [AgDataSourceTableOfficialDrivesStandaloneComponent],
})
export class AgDataSourceTableOfficialDrivesComponent extends AgDataSourceBaseDirective {
  viewName = DataSourceDynamicViewEnum.OFFICIAL_DRIVES;
  deleteActionTooltip = computed(() => '');

  onDeleteActionClicked(_?: DataSourceSelection): Promise<void> {
    return Promise.resolve(undefined);
  }
}
