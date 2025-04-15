import {Component, inject, Input} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {ServerSideEntityTableBaseDirective} from 'deep-ui/shared/components/src/lib/tables/common';
import {ClipListDatasource, ClipListService} from 'deep-ui/shared/core';
import {ClipList} from 'deep-ui/shared/models';

import {getClipListTableColumns} from './clip-list-table-entities';

@Component({
  selector: 'de-clip-list-table',
  templateUrl: './clip-list-table.component.html',
  styleUrls: ['./clip-list-table.component.scss'],
  imports: [MeServerSideTableComponent, MeTooltipDirective, MatButtonModule, MatIconModule],
})
export class ClipListTableComponent extends ServerSideEntityTableBaseDirective<ClipList> {
  @Input()
  technologiesOptions: Array<MeSelectOption>;

  private clipListService = inject(ClipListService);
  setDatasource = () => (this.agGridDataSource = new ClipListDatasource(this.clipListService));

  getTableColumnsDef = getClipListTableColumns;

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
}
