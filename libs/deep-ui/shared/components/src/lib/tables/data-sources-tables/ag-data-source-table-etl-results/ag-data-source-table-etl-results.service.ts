import {GridApi, IRowNode, IServerSideGroupSelectionState, RowNode} from '@ag-grid-community/core';
import {Injectable, WritableSignal} from '@angular/core';
import {MeRowNode} from '@mobileye/material/src/lib/components/ag-table/entities';
import {Datasource, DataSourceSelection} from 'deep-ui/shared/models';

export interface AgDataSourceTableEtlResultsState {
  selectedRowsState: Array<IServerSideGroupSelectionState>;
  rowNodes: Array<MeRowNode>;
  hasMultipleSelections: boolean;
}

@Injectable()
export class AgDataSourceTableEtlResultsService {
  getDataSourcesJobIds(
    dataSources: Array<Datasource>,
  ): Array<{jobId: string; dataSources: Array<Datasource>}> {
    if (!dataSources?.length) {
      return [];
    }

    const jobIdToDataSourcesMap = new Map<string, Array<Datasource>>();

    for (const ds of dataSources) {
      const key = ds.jobIds[0];
      const foundDs = jobIdToDataSourcesMap.get(ds.jobIds[0]);

      if (foundDs) {
        jobIdToDataSourcesMap.set(key, [...foundDs, ds]);
      } else {
        jobIdToDataSourcesMap.set(key, [ds]);
      }
    }

    const results = Array.from(jobIdToDataSourcesMap.keys()).map((jobId: string) => ({
      jobId,
      dataSources: jobIdToDataSourcesMap.get(jobId),
    }));

    return results;
  }

  getJobIdsUpdatedRowNodes(
    gridApi: GridApi<Datasource>,
    selectedRowsState: Array<IServerSideGroupSelectionState>,
  ): Array<MeRowNode> {
    const rowNodes = [];
    for (const state of selectedRowsState) {
      if (state.selectAllChildren && !state.toggledNodes?.length) {
        // selected subgroup with no deselected DS
        const rowNode = gridApi.getRowNode(state.nodeId);
        rowNodes.push(rowNode);
      } else if (state.selectAllChildren && state.toggledNodes?.length) {
        // selected subgroup with deselected DS
        const updatedRowNode = this._getFilteredJobIdsSubgroupRowNode(gridApi, state);
        rowNodes.push(updatedRowNode); // cloned row node with updated jobIds
      } else {
        // deselected subgroup with selected DS
        state.toggledNodes.forEach((childState: IServerSideGroupSelectionState) => {
          const childNode = gridApi.getRowNode(childState.nodeId);
          rowNodes.push(childNode);
        });
      }
    }

    return rowNodes.filter((r: MeRowNode) => r);
  }

  getSelectedInMultipleSelection(
    tableState: WritableSignal<AgDataSourceTableEtlResultsState>,
  ): DataSourceSelection {
    if (!tableState().rowNodes.length) {
      tableState.update((state: AgDataSourceTableEtlResultsState) => ({
        ...state,
        hasMultipleSelections: false,
      }));
      return null;
    }

    const rowNode = tableState().rowNodes[0];
    if (tableState().rowNodes.length > 1) {
      tableState.update((state: AgDataSourceTableEtlResultsState) => ({
        ...state,
        hasMultipleSelections: true,
      }));
      return {
        // once more than one selection found - no need to check on all the cases
        dataSource: null,
      };
    } else if (rowNode.allChildrenCount === 1) {
      // one subgroup with one DS
      const childNode = (rowNode as unknown as RowNode).childStore?.getRowUsingDisplayIndex(
        rowNode.rowIndex + 1,
      );
      if (!childNode) {
        // either not loaded yet or not displayed
        tableState.update((state: AgDataSourceTableEtlResultsState) => ({
          ...state,
          hasMultipleSelections: false,
        }));
        return null;
      }
      tableState.update((state: AgDataSourceTableEtlResultsState) => ({
        ...state,
        hasMultipleSelections: false,
      }));
      return {
        dataSource: childNode.data,
      };
    }
    if (!rowNode.allChildrenCount) {
      // one DS
      tableState.update((state: AgDataSourceTableEtlResultsState) => ({
        ...state,
        hasMultipleSelections: false,
      }));
      return {
        dataSource: rowNode.data,
      };
    } else {
      // one subgroup with more than one DS
      let i = rowNode.rowIndex;
      let childNode: IRowNode;
      let numberOfSelectedNodes = 0;
      let selection: DataSourceSelection;
      do {
        childNode = (rowNode as unknown as RowNode).childStore?.getRowUsingDisplayIndex(++i);
        if (childNode?.parent?.id !== rowNode.id) {
          break;
        }
        if (childNode.isSelected()) {
          numberOfSelectedNodes++;
          if (numberOfSelectedNodes === 1) {
            selection = {
              dataSource: childNode.data,
            };
          }
        }
      } while (numberOfSelectedNodes < 2);
      if (numberOfSelectedNodes === 2) {
        tableState.update((state: AgDataSourceTableEtlResultsState) => ({
          ...state,
          hasMultipleSelections: true,
        }));
      } else {
        tableState.update((state: AgDataSourceTableEtlResultsState) => ({
          ...state,
          hasMultipleSelections: false,
        }));
      }
      return selection ?? null;
    }
  }

  private _getFilteredJobIdsSubgroupRowNode(
    gridApi: GridApi<Datasource>,
    subGroupState: IServerSideGroupSelectionState,
  ): MeRowNode<Datasource> {
    const rowNode = gridApi.getRowNode(subGroupState.nodeId);
    const jobIdsSet = new Set(rowNode.data.jobIds);
    subGroupState.toggledNodes.forEach((childState: IServerSideGroupSelectionState) => {
      const childNode = gridApi.getRowNode(childState.nodeId);
      if (childNode?.data?.jobIds?.length) {
        jobIdsSet.delete(childNode.data.jobIds[0]);
      }
    });
    const updatedRowNode: MeRowNode<Datasource> = {
      ...rowNode,
    } as MeRowNode<Datasource>;
    updatedRowNode.data = {
      ...rowNode.data,
      jobIds: Array.from(jobIdsSet),
    };
    return updatedRowNode;
  }
}
