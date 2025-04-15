import {IRowNode, IsRowSelectable} from '@ag-grid-community/core';
import {Component, Input, OnInit} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {Params} from '@angular/router';
import {
  MeAgTableActionItemEvent,
  MeColDef,
  MeGroupByItem,
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

import {getGoldenLabelsDatasourceTableColumns} from './ag-data-source-table-golden-labels-standalone-entities';

@UntilDestroy()
@Component({
  selector: 'de-ag-data-source-table-golden-labels-standalone',
  templateUrl: './ag-data-source-table-golden-labels-standalone.component.html',
  styleUrls: ['./ag-data-source-table-golden-labels-standalone.component.scss'],
  imports: [MatIconModule, MatButtonModule, MeServerSideTableComponent, MeTooltipDirective],
  providers: [DataSourceTableBaseService],
})
export class AgDataSourceTableGoldenLabelsStandaloneComponent
  extends AgDataSourceSsrmTableBaseDirective
  implements OnInit
{
  @Input()
  hideTableActions: boolean;

  @Input()
  triggerTableRefresh: Subject<void>;

  @Input()
  isWizard: boolean;

  readonly ignoreTeamFilterAttributes = ['id'];
  readonly tableComponentId = 'data-source--golden-labels';
  readonly dataType = 'golden_labels';
  readonly viewName = DataSourceDynamicViewEnum.GOLDEN_LABELS;
  readonly getColumns = getGoldenLabelsDatasourceTableColumns;
  autoGroupColumnDef: MeColDef<Datasource> | MeColDef<VersionDataSource>;

  readonly groupByOptions: Array<MeGroupByItem> = [
    {
      groups: [
        {
          colId: 'id',
          field: 'name',
        },
      ],
      title: 'Group by : Name',
    },
    {
      groups: [
        {
          colId: 'tagsGroup',
          field: 'tags',
        },
        {
          colId: 'id',
          field: 'name',
        },
      ],
      title: 'Group by : Tag / Name',
    },
  ];

  readonly groupByAdditionalColumns = {
    'id': ['tags'],
    'tagsGroup-id': [],
  };

  @memoize((...args) => _values(args).join('_'))
  startCase(value: string): string {
    return _startCase(value);
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.autoGroupColumnDef = {
      field: 'columnGroup' as any,
      headerName: '',
      pinned: 'left',
      lockPinned: true,
      lockPosition: true,
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
      minWidth: 150,
      width: 500,
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
    const currentNode = nodes[0];
    if (currentNode.leafGroup) {
      this.triggerSelectDatasourceChange({
        dataSource: currentNode.data,
        version: null,
      });
    } else if (!currentNode.group) {
      this.triggerSelectDatasourceChange({
        dataSource: currentNode.parent.data,
        version: currentNode.data,
      });
    } else {
      this.triggerSelectDatasourceChange({
        dataSource: null,
        version: null,
        semanticGroup: currentNode.data,
      });
    }
  }

  override onFiltersParamsChanged(params: Params = {}): void {
    this.setFilterModelForTeamFilterState();
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
    if (this.isWizard) {
      if (rowNode.parent?.data) {
        rowNode.rowTooltip = 'Only top level rows can be selected';
        return false;
      }
      if (rowNode.data.status !== 'active' && rowNode.data.status !== 'needs_sync') {
        rowNode.rowTooltip = 'Status not allowed';
        return false;
      }
    }

    const currentNodeDataSourceId = rowNode.parent?.data?.id || rowNode.data.id;
    if (_map(this.selectedDataSources, 'id').includes(currentNodeDataSourceId)) {
      rowNode.rowTooltip = 'Data source already selected';
      return false;
    }
    //row group is semantic group as it doesn't have a status
    if (rowNode.group && !rowNode.data?.status) {
      return true;
    }

    return super.isRowSelectable(rowNode);
  };
}
