import {IsRowSelectable} from '@ag-grid-community/core';
import {NgClass} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, Input} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {setMaxNumConditions} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {SelectServerSideTableBaseDirective} from 'deep-ui/shared/components/src/lib/selection/common';
import {ClipListDatasource, ClipListService} from 'deep-ui/shared/core';
import {ClipList} from 'deep-ui/shared/models';

import {getSelectClipListTableColumns} from './select-clip-list-entities';

@Component({
  selector: 'de-select-clip-list',
  templateUrl: './select-clip-list.component.html',
  styleUrls: ['./select-clip-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MeServerSideTableComponent,
    MeTooltipDirective,
    NgClass,
    MatButtonModule,
    MatIconModule,
  ],
})
export class SelectClipListComponent extends SelectServerSideTableBaseDirective<ClipList> {
  @Input()
  isRowSelectable: IsRowSelectable = null;
  setDatasource = () =>
    (this.agGridDataSource = new ClipListDatasource(this.clipListService, 'modifiedAt'));

  private clipListService = inject(ClipListService);

  getTableColumnsDef = getSelectClipListTableColumns;

  readonly idProperty = 'id';
  readonly teamProperty: 'group' | 'team' = 'team';
  readonly ignoredFiltersKeys = [];
  readonly checkboxProperty = 'name';
  readonly ignoreTeamFilterAttributes = ['id'];
  readonly reTriggerUniqFilterAttr = 'id';

  protected override setTableColumns(): void {
    const columns = this.getTableColumnsDef(this.tableOptions);
    setMaxNumConditions(columns);
    this.setCheckbox(columns);
    this.setSelectionOptions();
    this.columns = columns;
  }
}
