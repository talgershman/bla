import {Component, inject, Input} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeAgTableActionItemEvent} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy} from '@ngneat/until-destroy';
import {ServerSideEntityTableBaseDirective} from 'deep-ui/shared/components/src/lib/tables/common';
import {PerfectListDatasource, PerfectListService} from 'deep-ui/shared/core';
import {PerfectList} from 'deep-ui/shared/models';

import {getPerfectListTableColumns, PerfectListCustomActions} from './perfect-list-table-entities';

@UntilDestroy()
@Component({
  selector: 'de-perfect-list-table',
  templateUrl: './perfect-list-table.component.html',
  styleUrls: ['./perfect-list-table.component.scss'],
  imports: [MeServerSideTableComponent, MeTooltipDirective, MatButtonModule, MatIconModule],
})
export class PerfectListTableComponent extends ServerSideEntityTableBaseDirective<PerfectList> {
  @Input()
  technologiesOptions: Array<MeSelectOption>;

  private perfectListService = inject(PerfectListService);

  setDatasource = () =>
    (this.agGridDataSource = new PerfectListDatasource(this.perfectListService));

  getTableColumnsDef = getPerfectListTableColumns;

  idProperty = 'id';

  teamProperty: 'group' | 'team' = 'team';

  columnBeforeAction = 'modifiedAt';

  ignoreTeamFilterAttributes = ['id'];

  ignoredFiltersKeys = [];

  protected override setTableOptions(): void {
    this.tableOptions = {
      templates: {
        nameCell: this.nameCell,
        statusCell: this.statusCell,
      },
      showActions: !this.hideTableActions,
      selectOptions: {
        technology: this.technologiesOptions,
      },
    };
  }

  async onActionClicked(action: MeAgTableActionItemEvent<PerfectList>): Promise<void> {
    if (action.id === PerfectListCustomActions.SYNC_PERFECT_LIST) {
      this.perfectListService
        .syncPerfectList(action.selected.id)
        .subscribe(() => this.refreshData());
    } else {
      this.tableActionClicked.emit(action);
    }
  }
}
