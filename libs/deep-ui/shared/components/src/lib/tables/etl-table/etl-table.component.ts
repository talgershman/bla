import {ColDefField, GetRowIdFunc, GetRowIdParams} from '@ag-grid-community/core';
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy} from '@ngneat/until-destroy';
import copy from 'copy-to-clipboard';
import {ServerSideEntityGroupTableBaseDirective} from 'deep-ui/shared/components/src/lib/tables/common';
import {EtlDatasource, EtlService} from 'deep-ui/shared/core';
import {ETL} from 'deep-ui/shared/models';

import {getEtlTableColumns} from './etl-table-entities';

@UntilDestroy()
@Component({
  selector: 'de-etl-table',
  templateUrl: './etl-table.component.html',
  styleUrls: ['./etl-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeServerSideTableComponent, MatIconModule, MeTooltipDirective, MatButtonModule],
})
export class EtlTableComponent extends ServerSideEntityGroupTableBaseDirective<ETL> {
  setDatasource = () => (this.agGridDataSource = new EtlDatasource(this.etlService));

  getTableColumnsDef = getEtlTableColumns;

  idProperty = 'id';

  teamProperty: 'group' | 'team' = 'team';

  columnBeforeAction = 'modifiedAt';

  ignoredFiltersKeys = [];

  autoGroupField: ColDefField<ETL> = 'version';
  autoGroupHeaderName = 'Name / Version';
  groupKeyProperty = 'name';
  ignoreTeamFilterAttributes = ['id'];
  readonly expandOnGroups = true;

  private etlService = inject(EtlService);

  copyJobIdToClipboard(event: MouseEvent, id: number): void {
    event.stopPropagation();
    copy(id.toString());
    this.snackbar.onCopyToClipboard();
  }

  getRowId: GetRowIdFunc = (params: GetRowIdParams<ETL>) =>
    `${params.data[this.idProperty] ? params.data[this.idProperty] : params.data.name}`;
}
