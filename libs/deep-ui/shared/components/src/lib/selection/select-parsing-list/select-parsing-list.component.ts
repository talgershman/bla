import {ColDefField, GetRowIdFunc, GetRowIdParams} from '@ag-grid-community/core';
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy} from '@ngneat/until-destroy';
import {SelectServerSideGroupTableBaseDirective} from 'deep-ui/shared/components/src/lib/selection/common';
import {ParsingConfigurationDatasource, ParsingConfigurationService} from 'deep-ui/shared/core';
import {ParsingConfiguration} from 'deep-ui/shared/models';

import {getSelectParsingListTableColumns} from './select-parsing-list-entities';

@UntilDestroy()
@Component({
  selector: 'de-select-parsing-list',
  templateUrl: './select-parsing-list.component.html',
  styleUrls: ['./select-parsing-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeServerSideTableComponent, MeTooltipDirective, MatButtonModule, MatIconModule],
})
export class SelectParsingListComponent extends SelectServerSideGroupTableBaseDirective<ParsingConfiguration> {
  readonly setDatasource = () =>
    (this.agGridDataSource = new ParsingConfigurationDatasource(this.parsingConfigurationService));
  readonly getTableColumnsDef = getSelectParsingListTableColumns;
  readonly idProperty = 'id';
  readonly teamProperty = 'team';
  readonly ignoredFiltersKeys = [];
  readonly autoGroupField: ColDefField<ParsingConfiguration> = 'name';
  readonly autoGroupHeaderName = 'Folder / Name';
  readonly groupKeyProperty = 'folder';
  readonly reTriggerUniqFilterAttr = 'id';
  readonly ignoreTeamFilterAttributes = ['id'];

  private parsingConfigurationService = inject(ParsingConfigurationService);

  override getRowId: GetRowIdFunc = (params: GetRowIdParams<ParsingConfiguration>) =>
    `${params.data[this.idProperty] ? params.data[this.idProperty] : params.data.folder}`;
}
