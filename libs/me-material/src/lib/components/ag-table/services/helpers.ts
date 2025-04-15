import {ColDefField, IServerSideGetRowsRequest} from '@ag-grid-community/core';
import {Params} from '@angular/router';
import {
  MeColDef,
  MeDateFilterDef,
  MeServerSideGetRowsRequest,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {formatDateFull, PERMANENT_DATE} from '@mobileye/material/src/lib/utils';

export const setSortForColumns: <T>(
  colsDef: MeColDef<T>[],
  queryParams: Params,
) => MeColDef<T>[] = <T>(colsDef: MeColDef<T>[], queryParams: Params) => {
  const defaultSortColumn = colsDef.find((col: MeColDef<T>) => col.sort);
  if (
    queryParams.sortBy &&
    queryParams.sortDirection &&
    (defaultSortColumn.field !== queryParams.sortBy ||
      defaultSortColumn.sort !== queryParams.sortDirection)
  ) {
    const colDef = colsDef.find((col: MeColDef<T>) => col.field === queryParams.sortBy);
    const allowedSortDirections = ['asc', 'desc'];
    if (colDef && allowedSortDirections.includes(queryParams.sortDirection)) {
      colDef.sort = queryParams.sortDirection;
      if (colDef !== defaultSortColumn) {
        delete defaultSortColumn.sort;
      }
    }
  }
  return colsDef;
};

export const getTableFiltersActiveState: <T>(
  colsDef: MeColDef<T>[],
  params: Params,
  autoGroupField?: string,
) => Record<string, any> = <T>(colsDef: MeColDef<T>[], params: Params, autoGroupField?: string) => {
  const filterModel = {};
  const queryParams: Params = params ? {...params} : {};
  delete queryParams.view;
  delete queryParams.sortBy;
  delete queryParams.sortDirection;
  delete queryParams.groupBy;
  // no filters active
  if (!Object.keys(queryParams).length) {
    return filterModel;
  }

  const columnsMap = new Map<string | ColDefField<T>, MeColDef<T>>(
    colsDef.map<[string | ColDefField<T>, MeColDef<T>]>((col: MeColDef<T>) => [
      col.colId || col.field,
      col,
    ]),
  );

  const dateColumnsDef = colsDef.filter(
    (col: MeColDef<any>) => col.filter === 'meAgDateFilterComponent',
  );

  const dateColumnsMap = new Map<string, MeColDef<T>>();

  for (const dateCol of dateColumnsDef) {
    for (const dateOption of (dateCol.filterParams as MeDateFilterDef).dateOptions) {
      dateColumnsMap.set(dateOption.parameterName, dateCol);
    }
  }

  for (const [fieldName, filterValue] of Object.entries(queryParams)) {
    const colDef: MeColDef<T> =
      fieldName !== 'ag-Grid-AutoColumn'
        ? columnsMap.get(fieldName)
        : columnsMap.get(autoGroupField);
    if (!colDef) {
      const dateCol = dateColumnsMap.get(fieldName);
      if (dateCol) {
        const field = dateCol.field as string;
        if (!filterModel[field]) {
          filterModel[field] = {
            filterType: 'date',
            type: 'inRange',
          };
        }
        if (fieldName.includes('AtAfter')) {
          filterModel[field].dateFrom = filterValue;
          filterModel[field].dateFromParameterName = fieldName;
        } else {
          filterModel[field].dateTo = filterValue;
          filterModel[field].dateToParameterName = fieldName;
        }
      }
      continue;
    }
    switch (colDef.filter) {
      case false:
        continue;
      case undefined:
      case 'text':
      case 'meAgTextFilterComponent':
      case 'meAgSelectFilterComponent':
      case 'meAgUserAutocompleteFilterComponent':
      case 'meAgMultiChipsFilterComponent':
        if (
          Array.isArray(filterValue) &&
          (colDef.filter === 'text' || colDef.filter === undefined) &&
          colDef.filterParams?.filterOptions &&
          colDef.filterParams.filterOptions[0] !== 'multi' &&
          colDef.filterParams.filterOptions[0] !== 'multiContains'
        ) {
          filterModel[fieldName] = {
            filterType: 'text',
            operator: 'OR',
            condition1: {
              filterType: 'text',
              type: colDef.filterParams.filterOptions[0],
              filter: filterValue[0],
            },
            condition2: {
              filterType: 'text',
              type: colDef.filterParams.filterOptions[0],
              filter: filterValue[1],
            },
          };
        } else {
          filterModel[fieldName] = {
            filterType: 'text',
            type: colDef.filterParams?.filterOptions
              ? colDef.filterParams.filterOptions[0]
              : 'contains',
            filter: filterValue,
          };
        }
        break;
      case 'number':
      case 'agNumberColumnFilter':
        filterModel[fieldName] = {
          filterType: 'number',
          type: colDef.filterParams?.filterOptions
            ? colDef.filterParams.filterOptions[0]
            : 'equals',
          filter: Number(filterValue),
        };
        break;
      case 'meAgNumberFilterComponent':
        filterModel[fieldName] = {
          filterType: 'number',
          type: colDef.filterParams?.filterOptions
            ? (colDef.filterParams.filterOptions[0] as {displayKey: string; displayName: string})
                ?.displayKey
            : 'equals',
          filter: Number(filterValue),
        };
        break;
    }
  }
  return filterModel;
};

export const setMaxNumConditions: <T>(colsDef: MeColDef<T>[], maxConditions?: number) => void = <T>(
  colsDef: MeColDef<T>[],
  maxConditions = 1,
) => {
  for (const colDef of colsDef) {
    if (!colDef.filterParams) {
      continue;
    }
    colDef.filterParams.maxNumConditions = maxConditions;
  }
};

export const getMeServerSideGetRowsRequest: (
  req: IServerSideGetRowsRequest,
) => MeServerSideGetRowsRequest = (req: IServerSideGetRowsRequest) => {
  const {startRow, endRow, rowGroupCols, groupKeys, filterModel, sortModel} = req;

  return {startRow, endRow, rowGroupCols, groupKeys, filterModel, sortModel};
};

export const getDateFormatter: (
  openingWord: string,
) => (filterModel: Record<string, any>, colDef: MeColDef<any>) => string =
  (openingWord: string) => (filterModel: Record<string, any>, colDef: MeColDef<any>) => {
    if (filterModel.dateFrom === PERMANENT_DATE) {
      return `${colDef.headerName} - permanent`;
    }

    if (!filterModel.dateTo) {
      return `${openingWord} from: ${formatDateFull(filterModel.dateFrom).split(',')[0]}`;
    }

    if (!filterModel.dateFrom) {
      return `${openingWord} until: ${formatDateFull(filterModel.dateTo).split(',')[0]}`;
    }
    return `${openingWord} from: ${formatDateFull(filterModel.dateFrom).split(',')[0]}, until: ${
      formatDateFull(filterModel.dateTo).split(',')[0]
    }`;
  };
