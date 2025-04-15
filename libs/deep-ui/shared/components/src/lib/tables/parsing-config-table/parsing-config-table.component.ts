import {ColDefField, GetRowIdFunc, GetRowIdParams} from '@ag-grid-community/core';
import {Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy} from '@ngneat/until-destroy';
import copy from 'copy-to-clipboard';
import {ServerSideEntityGroupTableBaseDirective} from 'deep-ui/shared/components/src/lib/tables/common';
import {ParsingConfigurationDatasource, ParsingConfigurationService} from 'deep-ui/shared/core';
import {ParsingConfiguration} from 'deep-ui/shared/models';

import {getParsingConfigurationTableColumns} from './parsing-config-table-entities';

@UntilDestroy()
@Component({
  selector: 'de-parsing-config-table',
  templateUrl: './parsing-config-table.component.html',
  styleUrls: ['./parsing-config-table.component.scss'],
  imports: [MeServerSideTableComponent, MeTooltipDirective, MatButtonModule, MatIconModule],
})
export class ParsingConfigTableComponent extends ServerSideEntityGroupTableBaseDirective<ParsingConfiguration> {
  setDatasource = () =>
    (this.agGridDataSource = new ParsingConfigurationDatasource(this.parsingConfigurationService));

  getTableColumnsDef = getParsingConfigurationTableColumns;

  idProperty = 'id';

  teamProperty: 'group' | 'team' = 'team';

  columnBeforeAction = 'description';

  ignoredFiltersKeys = [];

  autoGroupField: ColDefField<ParsingConfiguration> = 'name';

  autoGroupHeaderName = 'Folder / Name';

  groupKeyProperty = 'folder';

  ignoreTeamFilterAttributes = ['id'];

  readonly expandOnGroups = true;

  private parsingConfigurationService = inject(ParsingConfigurationService);

  copyJobIdToClipboard(event: MouseEvent, id: number): void {
    event.stopPropagation();
    copy(id.toString());
    this.snackbar.onCopyToClipboard();
  }

  getRowId: GetRowIdFunc = (params: GetRowIdParams<ParsingConfiguration>) =>
    `${params.data[this.idProperty] ? params.data[this.idProperty] : params.data.folder}`;
}
