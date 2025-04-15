import {Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy} from '@ngneat/until-destroy';
import {ServerSideEntityTableBaseDirective} from 'deep-ui/shared/components/src/lib/tables/common';
import {MestDatasource, MestService} from 'deep-ui/shared/core';
import {MEST} from 'deep-ui/shared/models';

import {getMestTableColumns} from './mest-table-entities';

@UntilDestroy()
@Component({
  selector: 'de-mest-table',
  templateUrl: './mest-table.component.html',
  styleUrls: ['./mest-table.component.scss'],
  imports: [MeServerSideTableComponent, MeTooltipDirective, MatButtonModule, MatIconModule],
})
export class MestTableComponent extends ServerSideEntityTableBaseDirective<MEST> {
  private mestService = inject(MestService);

  setDatasource = () => (this.agGridDataSource = new MestDatasource(this.mestService));

  getTableColumnsDef = getMestTableColumns;

  idProperty = 'id';

  teamProperty: 'group' | 'team' = 'group';

  columnBeforeAction = 'modifiedAt';

  ignoreTeamFilterAttributes = ['id'];

  ignoredFiltersKeys = [];

  searchFilterByField = 'nickname';
}
