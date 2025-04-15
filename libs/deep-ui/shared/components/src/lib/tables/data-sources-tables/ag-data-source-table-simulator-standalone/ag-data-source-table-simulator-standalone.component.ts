import {IRowNode, IsRowSelectable} from '@ag-grid-community/core';
import {Component, Input, OnInit} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {Params} from '@angular/router';
import {
  MeAgTableActionItemEvent,
  MeColDef,
  MeRowNode,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {
  AgDataSourceSsrmTableBaseDirective,
  DataSourceTableBaseService,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {
  DataSourceCustomActions,
  DataSourceDynamicViewEnum,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {Datasource, VersionDataSource} from 'deep-ui/shared/models';
import {memoize} from 'lodash-decorators/memoize';
import _map from 'lodash-es/map';
import _startCase from 'lodash-es/startCase';
import _values from 'lodash-es/values';
import {Subject} from 'rxjs';

import {getSimulatorDatasourceTableColumns} from './ag-data-source-table-simulator-standalone-entities';

@UntilDestroy()
@Component({
  selector: 'de-ag-data-source-table-simulator-standalone',
  templateUrl: './ag-data-source-table-simulator-standalone.component.html',
  styleUrls: ['./ag-data-source-table-simulator-standalone.component.scss'],
  imports: [MatIconModule, MatButtonModule, MeServerSideTableComponent, MeTooltipDirective],
  providers: [DataSourceTableBaseService],
})
export class AgDataSourceTableSimulatorStandaloneComponent
  extends AgDataSourceSsrmTableBaseDirective
  implements OnInit
{
  @Input()
  hideTableActions: boolean;

  @Input()
  triggerTableRefresh: Subject<void>;

  @Input()
  isWizard: boolean;

  readonly ignoreTeamFilterAttributes = [];
  readonly tableComponentId = 'data-source--simulator';
  readonly dataType = 'simulator';
  readonly viewName = DataSourceDynamicViewEnum.SIMULATOR;
  readonly getColumns = getSimulatorDatasourceTableColumns;
  autoGroupColumnDef: MeColDef<Datasource> | MeColDef<VersionDataSource>;

  override ngOnInit(): void {
    super.ngOnInit();
    this.teamFilterState = 'none';

    this.autoGroupColumnDef = {
      field: 'userFacingVersion',
      headerName: 'Name / Version',
      suppressColumnsToolPanel: true,
      sortable: false,
      filter: false,
      cellRendererParams: {
        suppressDoubleClickExpand: true,
        innerRenderer: 'meAgTemplateRendererComponent',
        innerRendererParams: {
          meCustomTemplate: this.classifierCell,
        },
      },
    };

    this.triggerTableRefresh
      ?.asObservable()
      .pipe(untilDestroyed(this))
      .subscribe(() => this.refreshData());
  }

  override onSelectionChanged(nodes: Array<MeRowNode<any>>): void {
    if (!nodes.length) {
      this.triggerSelectDatasourceChange(null);
      return;
    }
    if (nodes[0].group) {
      this.triggerSelectDatasourceChange({
        dataSource: nodes[0].data,
        version: null,
      });
    } else {
      this.triggerSelectDatasourceChange({
        dataSource: nodes[0].parent.data,
        version: nodes[0].data,
      });
    }
  }

  override onFiltersParamsChanged(params: Params = {}): void {
    this.filtersParamsChanged.emit(params);
  }

  override async onActionClicked(actionEvent: MeAgTableActionItemEvent<Datasource>): Promise<void> {
    const action = actionEvent as unknown as MeAgTableActionItemEvent<VersionDataSource>;
    if (action.id === DataSourceCustomActions.DownloadClipList) {
      const dataSource: any = action.selectedRowNode.parent.data ?? action.selectedRowNode.data;
      this.dataSourceTableBaseService.dataSourceService.downloadClipList(
        dataSource,
        action.selected,
      );
    } else if (action.id === DataSourceCustomActions.QueryDataSource) {
      const group: IRowNode<Datasource> = action.selectedRowNode.group
        ? (action.selectedRowNode as unknown as IRowNode<Datasource>)
        : (action.selectedRowNode.parent as unknown as IRowNode<Datasource>);
      const child: MeRowNode<VersionDataSource> = action.selectedRowNode.group
        ? null
        : action.selectedRowNode;
      this.dataSourceTableBaseService.queryDataSource(group.data, child?.data);
    } else {
      await super.onActionClicked(actionEvent);
    }
  }

  override isRowSelectable: IsRowSelectable = (rowNode: MeRowNode): boolean => {
    if (!this.selectionMode) {
      return true;
    }

    const currentNodeDataSourceId = rowNode.parent?.data?.id || rowNode.data.id;
    if (_map(this.selectedDataSources, 'id').includes(currentNodeDataSourceId)) {
      rowNode.rowTooltip = 'Data source already selected';
      return false;
    }

    return super.isRowSelectable(rowNode);
  };

  @memoize((...args) => _values(args).join('_'))
  startCase(value: string): string {
    return _startCase(value);
  }
}
