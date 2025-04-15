import {
  ColDef,
  ColumnState,
  ICellRendererParams,
  IDetailCellRendererParams,
  IRowNode,
  IServerSideGetRowsRequest,
  ITextFilterParams,
  ValueFormatterParams,
} from '@ag-grid-community/core';
import {TemplateRef} from '@angular/core';
import {MeFieldValidator} from '@mobileye/material/src/lib/common';
import {MeDateFilterTypeOptions} from '@mobileye/material/src/lib/components/ag-table/filters/ag-date-filter';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';

import {MeActionsBaseTableDirective} from './base-table';

export type OmittedServerSideGetRowsRequestFields = 'valueCols' | 'pivotCols' | 'pivotMode';

export type TeamFilterStateTypes = 'me' | 'my_teams' | 'none';

export type MeServerSideGetRowsRequest = Omit<
  IServerSideGetRowsRequest,
  OmittedServerSideGetRowsRequestFields
>;

export interface MeModifiedColsChanges {
  tableId: string;
  added: Array<string>;
  removed: Array<string>;
}

export interface MeModifiedColumnState {
  pinned: Pick<ColumnState, 'pinned'>;
  visible: boolean;
  index: number;
}

export enum MeModifiedEventType {
  Column_VISIBLE = 'columnVisible',
  Column_PINNED = 'columnPinned',
  Column_MOVED = 'columnMoved',
}

export interface MeTableState {
  modifiedDisplayedColumns: Record<string, MeModifiedColumnState>;
  resolutions: Record<string, Record<string, number>>;
}

export interface MeTableContext<T> {
  parentComponent: MeActionsBaseTableDirective<T>;
}

export interface MeRowNode<T = any> extends IRowNode<T> {
  rowTooltip: string;
  isCheckboxDisabled?: boolean;
}

export interface MeAgTableActionItem<T> {
  id: string;
  title: string;
  excludeInSelectionMode?: boolean;
  isDisabled?(item: T, rowNode?: MeRowNode<T>): boolean;
  tooltip?(item?: T, rowNode?: MeRowNode<T>): string;
}

export interface MeAgTableActionItemEvent<T> {
  id: string;
  title: string;
  selected: T;
  selectedRowNode: MeRowNode<T>;
}

export interface MeLoadingModulesOptions {
  masterDetail: boolean;
  rowGrouping: boolean;
}

export type MeRowGroupPanelShow = 'never' | 'always' | 'onlyWhenGrouping';

export interface MeColumnsOptions {
  templates?: {
    [key: string]: TemplateRef<any>;
  };
  overrideColumns?: Array<string>;
  showActions?: boolean;
  selectionMode?: boolean;
  selectOptions?: {
    [key: string]: MeSelectOption[];
  };
  isIncludedInDeepGroupsOrIsAdmin?: (entity: any, teamProp: string) => boolean; // todo: remove 'teamProp' after we merge the align team feature
  extra?: any;
}

export interface MeDetailCellRendererParams<T = any, TDetail = any>
  extends IDetailCellRendererParams<T, TDetail> {
  meTemplate: TemplateRef<any>;
  onOpen?: (data: T) => void;
  onDestroyed?: (data: T) => void;
}

export interface MeTextFilterDef extends ITextFilterParams {
  validations?: Array<MeFieldValidator>;
  meFormatter?: (filterModel: Record<string, any>, colDef: MeColDef<any>) => string;
}

export interface MeSelectFilterDef extends MeTextFilterDef {
  values: Array<MeSelectOption>;
}

export type MeUserAutocompleteFilterDef = MeTextFilterDef;

export interface MeDateFilterDef extends MeTextFilterDef {
  dateOptions: Array<MeDateFilterTypeOptions>;
  permanent?: string;
}

export interface MeMultiSelectFilterDef extends Omit<MeTextFilterDef, 'filterOptions'> {
  filterOptions: ['multi'] | ['multiContains'];
}

export type MeGroupByItem = {
  groups: Array<{
    colId: string;
    field: string;
  }>;
  title: string;
};

export type MeGroupByItemDerived = MeGroupByItem & {key: string};

export type MeFilterDef =
  | MeTextFilterDef
  | MeSelectFilterDef
  | MeUserAutocompleteFilterDef
  | MeDateFilterDef
  | MeMultiSelectFilterDef;

export type MeColDef<T> = Omit<ColDef<T>, 'filterParams'> & {filterParams?: MeFilterDef};

export interface MeFilterModelAndColDef {
  filterModel: Record<string, any>;
  colDef: MeColDef<any>;
}

export enum MeAgComponentName {
  CUSTOM_HEADER_COMPONENT = 'meAgCustomHeaderComponent',
  TEXT_FILTER_COMPONENT = 'meAgTextFilterComponent',
  NUMBER_FILTER_COMPONENT = 'meAgNumberFilterComponent',
  MULTI_CHIPS_FILTER_COMPONENT = 'meAgMultiChipsFilterComponent',
  USER_AUTOCOMPLETE_FILTER_COMPONENT = 'meAgUserAutocompleteFilterComponent',
  DATE_FILTER_COMPONENT = 'meAgDateFilterComponent',
  SELECT_FILTER_COMPONENT = 'meAgSelectFilterComponent',
  TEMPLATE_RENDERER = 'meAgTemplateRendererComponent',
  ACTIONS_CELL = 'meAgActionsCellComponent',
}

export const meAgFilterComponents: Array<MeAgComponentName> = [
  MeAgComponentName.TEXT_FILTER_COMPONENT,
  MeAgComponentName.NUMBER_FILTER_COMPONENT,
  MeAgComponentName.MULTI_CHIPS_FILTER_COMPONENT,
  MeAgComponentName.USER_AUTOCOMPLETE_FILTER_COMPONENT,
  MeAgComponentName.DATE_FILTER_COMPONENT,
  MeAgComponentName.SELECT_FILTER_COMPONENT,
];

export const meAgCellComponents: Array<MeAgComponentName> = [
  MeAgComponentName.ACTIONS_CELL,
  MeAgComponentName.TEMPLATE_RENDERER,
];

export const CONTAINS_FILTER_PARAMS: MeFilterDef = {
  filterOptions: ['contains'],
  buttons: ['clear'],
};

export const EQUALS_FILTER_PARAMS: MeFilterDef = {
  filterOptions: ['equals'],
  buttons: ['clear'],
};

export const MULTI_FILTER_PARAMS: MeFilterDef = {
  filterOptions: ['multi'],
  buttons: ['clear'],
};

export const MULTI_FILTER_TYPES = ['multi', 'multiContains'];

export const ARRAY_CELL_FORMATTER = (rowData: ICellRendererParams) => {
  const arrayOfValues: Array<any> = rowData.value ?? [];
  const formattedValue = arrayOfValues
    .map((val: any) => {
      if (typeof val !== 'object') {
        return val;
      }
      return JSON.stringify(val, null, 2);
    })
    .join(',');
  return `[${formattedValue}]`;
};

export const ARRAY_VALUE_FORMATTER = (rowData: ValueFormatterParams) => {
  const arrayOfValues: Array<any> = rowData.value ?? [];
  const formattedValue = arrayOfValues
    .map((val: any) => {
      if (typeof val !== 'object') {
        return val;
      }
      return JSON.stringify(val, null, 2);
    })
    .join(',');
  return `[${formattedValue}]`;
};
