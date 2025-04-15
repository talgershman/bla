import {GridApi, IServerSideGroupSelectionState, RowNode} from '@ag-grid-community/core';
import {Injectable} from '@angular/core';
import {Datasource} from 'deep-ui/shared/models';

@Injectable()
export class AgDataSourceTableEtlResultsStandaloneService {
  // return selected states of subgroups and its leaves
  getSelectedSubGroupsAndDs(
    event: IServerSideGroupSelectionState,
    gridApi: GridApi<Datasource>
  ): Array<IServerSideGroupSelectionState> {
    if (!event) {
      return [];
    }

    const firstGroupLevelData = event.toggledNodes;

    if (!firstGroupLevelData?.length) {
      return [];
    }

    const subGroupLevelData = [];

    for (const firstLevelGroup of firstGroupLevelData) {
      if (firstLevelGroup.selectAllChildren) {
        // a main group has a single subgroup
        if (firstLevelGroup.toggledNodes?.length === 1) {
          // subgroup state attached is in toggledNodes
          subGroupLevelData.push(firstLevelGroup.toggledNodes[0]);
        } else {
          const parentRowNode = gridApi.getRowNode(firstLevelGroup.nodeId) as RowNode;
          if (!parentRowNode?.childStore) {
            continue;
          }
          const node = parentRowNode.childStore.getRowUsingDisplayIndex(parentRowNode.rowIndex + 1);
          const data = {
            ...firstLevelGroup,
            nodeId: node.id,
          };
          subGroupLevelData.push(data);
        }
      } else {
        if (!firstLevelGroup.toggledNodes) {
          continue;
        }
        subGroupLevelData.push(...firstLevelGroup.toggledNodes);
      }
    }

    return subGroupLevelData;
  }
}
