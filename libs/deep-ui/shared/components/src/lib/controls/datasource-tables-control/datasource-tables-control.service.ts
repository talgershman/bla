import {Injectable} from '@angular/core';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DatasourceDeselectData, DataSourceSelection} from 'deep-ui/shared/models';

@Injectable()
export class DatasourceTablesControlService {
  getSelectionsAfterChange(
    selections: Array<DataSourceSelection>,
    type: DataSourceDynamicViewEnum,
    currentValue: Array<DataSourceSelection>,
  ): Array<DataSourceSelection> {
    if (!selections.length) {
      return this._filterSelectionsByType(currentValue, type);
    }
    return this._updateSelections(selections, type, currentValue);
  }

  getCurrentSelectedDataSources(
    removedChipData: DatasourceDeselectData,
    currentValue: Array<DataSourceSelection>,
  ): Array<DataSourceSelection> {
    if (currentValue.length > 1) {
      return this._removeSelection(removedChipData, currentValue);
    } else {
      return [];
    }
  }

  private _filterSelectionsByType(
    selections: Array<DataSourceSelection>,
    type: DataSourceDynamicViewEnum,
  ): Array<DataSourceSelection> {
    return selections.filter((s) => s.type !== type);
  }

  private _updateSelections(
    selections: Array<DataSourceSelection>,
    type: DataSourceDynamicViewEnum,
    currentValue: Array<DataSourceSelection>,
  ): Array<DataSourceSelection> {
    const sameTypeOldSelections = currentValue.filter((s) => s.type === type);
    if (sameTypeOldSelections.length < selections.length) {
      return [...currentValue, selections[selections.length - 1]];
    }
    if (sameTypeOldSelections.length === selections.length && selections.length > 0) {
      return this._updateLastSelection(selections, type, currentValue);
    }
    if (sameTypeOldSelections.length > selections.length) {
      return this._reduceSelections(selections, type, currentValue);
    }
    return currentValue;
  }

  private _updateLastSelection(
    selections: Array<DataSourceSelection>,
    type: DataSourceDynamicViewEnum,
    currentValue: Array<DataSourceSelection>,
  ): Array<DataSourceSelection> {
    const lastSelection = selections[selections.length - 1];
    let i = -1;
    for (const oldSelection of currentValue) {
      i++;
      if (oldSelection.type !== type) continue;
      if (this._selectionMatches(lastSelection, oldSelection)) {
        const newSelections = [...currentValue];
        newSelections.splice(i, 1);
        return [...newSelections, lastSelection];
      }
    }
    return currentValue;
  }

  private _reduceSelections(
    selections: Array<DataSourceSelection>,
    type: DataSourceDynamicViewEnum,
    currentValue: Array<DataSourceSelection>,
  ): Array<DataSourceSelection> {
    let i = -1;
    for (const oldSelection of currentValue) {
      i++;
      if (oldSelection.type !== type) continue;
      if (!selections.some((s) => this._selectionsEqual(s, oldSelection))) {
        const newSelections = [...currentValue];
        newSelections.splice(i, 1);
        return newSelections;
      }
    }
    return currentValue;
  }

  private _removeSelection(
    removedChipData: DatasourceDeselectData,
    currentValue: Array<DataSourceSelection>,
  ): Array<DataSourceSelection> {
    const sameDsIndex = currentValue.findIndex(
      (s: DataSourceSelection) =>
        s.type === removedChipData.type &&
        (removedChipData.level
          ? s.version?.id === removedChipData.id
          : s.dataSource.id === removedChipData.id),
    );
    if (sameDsIndex > -1) {
      const newSelections = [...currentValue];
      newSelections.splice(sameDsIndex, 1);
      return newSelections;
    }
    return currentValue;
  }

  private _selectionMatches(newSel: DataSourceSelection, oldSel: DataSourceSelection): boolean {
    return (
      newSel.dataSource.id === oldSel.dataSource.id &&
      (!newSel.version || !oldSel.version) &&
      (oldSel.version
        ? oldSel.version.userFacingVersion === newSel.dataSource.latestUserVersion
        : oldSel.dataSource.latestUserVersion === newSel.version?.userFacingVersion)
    );
  }

  private _selectionsEqual(s1: DataSourceSelection, s2: DataSourceSelection): boolean {
    return s1.version
      ? s1.version.id === s2.version?.id
      : s1.dataSource.id === s2.dataSource.id && !s2.version;
  }
}
