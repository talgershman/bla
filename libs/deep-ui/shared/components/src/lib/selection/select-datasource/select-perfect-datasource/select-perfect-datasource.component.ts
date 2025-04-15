import {
  ColDefField,
  FirstDataRenderedEvent,
  IServerSideSelectionState,
  IsRowSelectable,
  RowNode,
  StoreRefreshedEvent,
} from '@ag-grid-community/core';
import {Component, inject, input, output, TemplateRef, ViewChild} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeRowNode} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {SelectServerSideGroupTableBaseDirective} from 'deep-ui/shared/components/src/lib/selection/common';
import {AgDataSourceDatasource} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {AgDatasourceService} from 'deep-ui/shared/core';
import {
  Datasource,
  DatasourceDeselectData,
  DataSourceSelection,
  VersionDataSource,
} from 'deep-ui/shared/models';
import {memoize} from 'lodash-decorators/memoize';
import _startCase from 'lodash-es/startCase';
import _values from 'lodash-es/values';
import {Subject} from 'rxjs';
import {delay, filter} from 'rxjs/operators';

import {getSelectPerfectsDatasourceTableColumns} from './select-perfect-datasource-entities';

@UntilDestroy()
@Component({
  selector: 'de-select-perfect-datasource',
  imports: [MeServerSideTableComponent, MeTooltipDirective, MatButtonModule, MatIconModule],
  templateUrl: './select-perfect-datasource.component.html',
  styleUrl: './select-perfect-datasource.component.scss',
})
export class SelectPerfectDatasourceComponent extends SelectServerSideGroupTableBaseDirective<
  Datasource | VersionDataSource
> {
  selectedDataSources = input<Array<DataSourceSelection>>([]);
  deSelectVersion = input.required<Subject<DatasourceDeselectData>>();
  overrideType = input<string>();
  dataSourceSelectionsChanged = output<Array<DataSourceSelection>>();
  disabledRowChanged = output<DatasourceDeselectData>();
  readonly dataType = 'perfects';

  readonly setDatasource = () => {
    this.agGridDataSource = new AgDataSourceDatasource(this.agDatasourceService, this.dataType);
  };
  readonly getTableColumnsDef = getSelectPerfectsDatasourceTableColumns;
  readonly ignoredFiltersKeys = ['jobIds'];
  readonly autoGroupField: ColDefField<Datasource> | ColDefField<VersionDataSource> =
    'userFacingVersion';
  readonly autoGroupHeaderName = 'Name / Version';
  readonly groupKeyProperty = 'id';
  readonly idProperty = 'id';
  readonly teamProperty = 'team';
  readonly reTriggerUniqFilterAttr = 'id';
  readonly ignoreTeamFilterAttributes = ['id'];
  readonly expandOnGroups = false;

  @ViewChild('statusCell', {static: true})
  statusCell: TemplateRef<any>;

  private skipNextSelection = false;

  private agDatasourceService = inject(AgDatasourceService);

  override ngOnInit(): void {
    this.checkboxes.set(true);
    super.ngOnInit();
    this.deSelectVersion()
      .pipe(untilDestroyed(this))
      .subscribe((deselectData: DatasourceDeselectData) => {
        if (deselectData.type == (this.overrideType() || DataSourceDynamicViewEnum.PERFECTS)) {
          this.gridApi?.forEachNode((node: RowNode) => {
            if (node.data) {
              const sameId = node.data.id === deselectData.id;
              const deselect = deselectData.level ? !node.group && sameId : node.group && sameId;
              if (deselect) {
                node.setSelected(false);
              }
            }
          });
        }
      });
  }

  override isRowSelectable: IsRowSelectable = (rowNode: MeRowNode): boolean => {
    if (rowNode.data.status === 'updating') {
      rowNode.rowTooltip = 'Data source is being updated, Please try again later';
      return false;
    }
    if (rowNode.data.status !== 'active' && rowNode.data.status !== 'needs_sync') {
      rowNode.rowTooltip = 'Status not allowed';
      return false;
    }
    return true;
  };

  override onStoreRefreshed(_: StoreRefreshedEvent): void {}

  override onFirstDataRenderedEvent(
    _: FirstDataRenderedEvent<Datasource | VersionDataSource>,
  ): void {}

  @memoize((...args) => _values(args).join('_'))
  startCase(value: string): string {
    return _startCase(value);
  }

  override onServerSideSelectionStateChanged(event: IServerSideSelectionState): void {
    if (this.skipNextSelection) {
      // skip the selection event that was triggered by pre-selected rows
      setTimeout(() => {
        this.skipNextSelection = false;
      });
      return;
    }
    const rowNodes: Array<MeRowNode<Datasource | VersionDataSource>> = event.toggledNodes.length
      ? event.toggledNodes.map((nodeId: string) => this.gridApi.getRowNode(nodeId) as MeRowNode)
      : [];
    const selected: Array<DataSourceSelection> = !rowNodes?.length
      ? []
      : rowNodes.map((n: MeRowNode, i: number) => {
          // when the user deselects the filter and now the rowNode is not existing in the same page
          if (!n) {
            const selection = this.selectedDataSources()[i];
            if (selection) {
              return {
                dataSource: selection.dataSource,
                version: selection.version ?? null,
                type: this.overrideType() || DataSourceDynamicViewEnum.PERFECTS,
              };
            }
          }
          return {
            dataSource: n.parent?.data ?? n.data,
            version: n.parent?.data ? n.data : null,
            type: this.overrideType() || DataSourceDynamicViewEnum.PERFECTS,
          };
        });
    if (!this.selectedDataSources()?.length) {
      this.dataSourceSelectionsChanged.emit(selected);
      return;
    }
    const selectedDsIds: Set<string> = new Set(
      selected.map((s: DataSourceSelection) => s.dataSource.id),
    );
    const oldSelections = [];
    for (const s of this.selectedDataSources()) {
      const oldRowNode = this.gridApi.getRowNode(`${s.version?.id ?? s.dataSource.id}`);
      if (!oldRowNode && !selectedDsIds.has(s.dataSource.id)) {
        oldSelections.push(s);
      }
    }
    this.dataSourceSelectionsChanged.emit([...oldSelections, ...selected]);
  }

  protected override setAutoGroupColumnDef(): void {
    this.autoGroupColumnDef = {
      field: this.autoGroupField,
      headerName: this.autoGroupHeaderName,
      suppressColumnsToolPanel: true,
      sortable: false,
      filter: false,
      cellRendererParams: {
        suppressDoubleClickExpand: this.suppressDoubleClickExpand,
        innerRenderer: 'meAgTemplateRendererComponent',
        innerRendererParams: {
          meCustomTemplate: this.nameCell,
        },
      },
      minWidth: 150,
      width: 600,
    };
  }

  protected override setTableOptions(): void {
    super.setTableOptions();
    this.tableOptions.templates.statusCell = this.statusCell;
  }

  protected override registerEvents(): void {
    this.agGridDataSource.dataLoadedLevel$
      .pipe(
        delay(200),
        filter((l: number) => l === 0),
        untilDestroyed(this),
      )
      .subscribe((_) => {
        this._openSelectedRowsGroup();
        this._selectPreSelectedRows(true);
      });
    this.agGridDataSource.dataLoadedLevel$
      .pipe(
        delay(350),
        filter((l: number) => l > 0),
        untilDestroyed(this),
      )
      .subscribe((_) => {
        this.selectPreSelectedRow();
      });
  }

  protected override selectPreSelectedRow(): void {
    if (this.preSelected) {
      return;
    }

    this._selectPreSelectedRows();
  }

  private _selectPreSelectedRows(isGroup?: boolean): void {
    if (!this.selectedDataSources()?.length || (!isGroup && this.preSelected)) {
      return;
    }

    const selectedIds: Array<string | number> = this.selectedDataSources()
      .filter((selection: DataSourceSelection) =>
        isGroup ? !selection.version : selection.version?.id !== undefined,
      )
      .map((selection: DataSourceSelection) =>
        isGroup ? selection.dataSource.id : selection.version?.id,
      );

    let escaped = false;
    for (const selectedId of selectedIds) {
      const rowNode = this.gridApi.getRowNode(`${selectedId}`);

      if (!rowNode || !rowNode.displayed) {
        escaped = true;
        continue;
      }

      if (rowNode.selectable && !rowNode.isSelected()) {
        this.skipNextSelection = true;
        rowNode.setSelected(true);
      } else if (!rowNode.selectable) {
        this.disabledRowChanged.emit({
          id: rowNode.data.id,
          level: isGroup ? 0 : 1,
          type: this.overrideType() || DataSourceDynamicViewEnum.PERFECTS,
        });
      }
    }
    if (!escaped && !isGroup) {
      this.preSelected = true;
    }
  }

  private _openSelectedRowsGroup(): void {
    const nodes = this.gridApi.getRenderedNodes();
    const selectedDatasourceIds = new Set(
      this.selectedDataSources().map((selection: DataSourceSelection) => selection.dataSource.id),
    );
    if (!nodes?.length || !selectedDatasourceIds.size) {
      return;
    }
    const groupRowNodes = nodes.filter((node) => node?.group);
    if (!groupRowNodes?.length) {
      return;
    }
    for (const groupRowNode of groupRowNodes) {
      if (
        !groupRowNode.expanded &&
        typeof groupRowNode.data.id === 'string' &&
        selectedDatasourceIds.has(groupRowNode.data.id)
      ) {
        groupRowNode.setExpanded(true);
      }
      if (
        typeof groupRowNode.data.id === 'string' &&
        selectedDatasourceIds.has(groupRowNode.data.id) &&
        !groupRowNode.expanded
      ) {
        groupRowNode.setExpanded(true);
      }
    }
  }
}
