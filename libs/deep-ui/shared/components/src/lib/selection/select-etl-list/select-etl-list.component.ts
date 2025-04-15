import {ColDefField, GetRowIdFunc, GetRowIdParams, IsRowSelectable} from '@ag-grid-community/core';
import {ChangeDetectionStrategy, Component, inject, Input} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeRowNode} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {SelectServerSideGroupTableBaseDirective} from 'deep-ui/shared/components/src/lib/selection/common';
import {EtlDatasource, EtlService} from 'deep-ui/shared/core';
import {ETL} from 'deep-ui/shared/models';

import {getSelectEtlTableColumns} from './select-etl-list-entities';

@Component({
  selector: 'de-select-etl-list',
  templateUrl: './select-etl-list.component.html',
  styleUrls: ['./select-etl-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MeServerSideTableComponent, MatIconModule, MeTooltipDirective, MatButtonModule],
})
export class SelectEtlListComponent extends SelectServerSideGroupTableBaseDirective<ETL> {
  @Input()
  disabledRowCallback: (etl: ETL) => string;

  setDatasource = () => (this.agGridDataSource = new EtlDatasource(this.etlService));

  getTableColumnsDef = getSelectEtlTableColumns;

  idProperty = 'id';

  teamProperty: 'group' | 'team' = 'team';

  ignoredFiltersKeys = [];

  autoGroupField: ColDefField<ETL> = 'version';
  autoGroupHeaderName = 'Name / Version';
  groupKeyProperty = 'name';
  readonly reTriggerUniqFilterAttr = 'name';
  readonly ignoreTeamFilterAttributes = ['id'];

  private etlService = inject(EtlService);

  override getRowId: GetRowIdFunc = (params: GetRowIdParams<ETL>) =>
    `${params.data[this.idProperty] ? params.data[this.idProperty] : params.data.name}`;

  override isRowSelectable: IsRowSelectable = (rowNode: MeRowNode): boolean => {
    const etl = rowNode.data;

    const callback = this.disabledRowCallback;

    if (callback) {
      rowNode.rowTooltip = callback(etl);
      if (rowNode.rowTooltip) {
        return false;
      }
    }

    return true;
  };
}
