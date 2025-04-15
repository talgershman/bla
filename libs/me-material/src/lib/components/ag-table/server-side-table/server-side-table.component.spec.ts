import {AgGridModule} from '@ag-grid-community/angular';
import {
  ColDef,
  Column,
  ColumnState,
  FirstDataRenderedEvent,
  GridApi,
  GridReadyEvent,
} from '@ag-grid-community/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MeAgTableActionsBarComponent} from '@mobileye/material/src/lib/components/ag-table/ag-actions-bar';
import {
  ARRAY_VALUE_FORMATTER,
  CONTAINS_FILTER_PARAMS,
  EQUALS_FILTER_PARAMS,
  MeGroupByItem,
  MeGroupByItemDerived,
  MULTI_FILTER_PARAMS,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MePortalService} from '@mobileye/material/src/lib/services/portal';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';

import {MeServerSideTableComponent} from './server-side-table.component';
import {MeServerSideTableService} from './server-side-table.service';

const DISPLAYED_COLUMNS = [
  {
    getColId: () => 'jobId',
    getActualWidth: () => 205,
    getLeft: () => 0,
  } as Column,
  {
    getColId: () => 'id',
    getActualWidth: () => 320,
    getLeft: () => 205,
  } as Column,
];

const COLUMN_STATE = [
  {
    colId: 'jobId',
    width: 205,
    hide: false,
    flex: null,
    pinned: undefined,
    rowGroup: undefined,
    rowGroupIndex: undefined,
  } as ColumnState,
  {
    colId: 'id',
    width: 320,
    sort: 'desc',
    hide: false,
    flex: null,
    pinned: undefined,
    rowGroup: undefined,
    rowGroupIndex: undefined,
    sortIndex: undefined,
  } as ColumnState,
  {
    colId: 'ids',
    hide: true,
    flex: null,
    pinned: undefined,
    rowGroup: undefined,
    rowGroupIndex: undefined,
    width: undefined,
  } as ColumnState,
  {
    colId: 'jobIds',
    hide: true,
    flex: null,
    pinned: undefined,
    rowGroup: undefined,
    rowGroupIndex: undefined,
    width: undefined,
  } as ColumnState,
  {
    colId: 'tags',
    hide: false,
    flex: null,
    pinned: undefined,
    rowGroup: undefined,
    rowGroupIndex: undefined,
    width: 212,
  } as ColumnState,
];

const COLUMN_DEFS: Array<ColDef> = [
  {
    colId: 'jobId',
    field: 'jobId',
    filterParams: EQUALS_FILTER_PARAMS,
    hide: false,
    cellRendererParams: {
      twin: 'jobIds',
    },
  },
  {
    colId: 'id',
    field: 'id',
    filterParams: EQUALS_FILTER_PARAMS,
    hide: false,
  },
  {
    colId: 'ids',
    field: 'ids',
    cellRendererParams: {
      aliasFor: 'id',
    },
    filterParams: MULTI_FILTER_PARAMS,
    valueFormatter: ARRAY_VALUE_FORMATTER,
    suppressFiltersToolPanel: true,
    hide: true,
  },
  {
    colId: 'jobIds',
    field: 'jobIds',
    filterParams: CONTAINS_FILTER_PARAMS,
    valueFormatter: ARRAY_VALUE_FORMATTER,
    suppressFiltersToolPanel: true,
    hide: true,
  },
];

const IGNORED_COL_IDS = ['jobIds', 'ids'];

const GRID_API = {
  forEachNode: () => {},
  getAllDisplayedColumns: () => DISPLAYED_COLUMNS,
  getColumnState: () => {
    // case: currentShownPartialState != shownDefaultPartialColumnState
    return COLUMN_STATE.filter((c: ColumnState) => !IGNORED_COL_IDS.includes(c.colId));
  },
  getFilterModel: () => {},
  getColumnDefs: () => COLUMN_DEFS,
  applyColumnState: (_) => true,
  getDisplayedRowCount: () => 2,
  //eslint-disable-next-line
  setGridOption: (key: string, _) => {},
  setFilterModel: (_) => {},
  addRowGroupColumns: (_) => {},
  removeRowGroupColumns: (_) => {},
  hideOverlay: () => {},
  removeOldGroupByColumn: () => {},
  getRowGroupColumns: () => [],
} as unknown as GridApi;

const GRID_OPTIONS = {
  api: GRID_API,
} as GridReadyEvent;

describe('MeServerSideTableComponent', () => {
  let spectator: Spectator<MeServerSideTableComponent<any>>;
  let userPreferencesService: SpyObject<MeUserPreferencesService>;

  const createComponent = createComponentFactory({
    component: MeServerSideTableComponent,
    imports: [
      AgGridModule,
      ReactiveFormsModule,
      MatAutocompleteModule,
      MatFormFieldModule,
      MatInputModule,
      MatIconModule,
      MatButtonModule,
      MatProgressSpinnerModule,
      MeSelectComponent,
      MeAgTableActionsBarComponent,
    ],
    providers: [MeServerSideTableService, MePortalService],
    mocks: [MeUserPreferencesService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    userPreferencesService = spectator.inject(MeUserPreferencesService);
    userPreferencesService.getComponentState.and.returnValue({
      [`tableState${spectator.component.USER_PREFERENCE_SUFFIX}`]: {
        columnState: COLUMN_STATE,
        defaultColumnState: [COLUMN_STATE[0], COLUMN_STATE[1], COLUMN_STATE[2], COLUMN_STATE[3]],
        isCustomView: true,
      },
    });
    spectator.component.teamFilterState = 'none';
    spectator.component.componentId = 'test-comp-id';
    spectator.component.columnDefs = COLUMN_DEFS;
    spectator.setInput('groupByOptions', []);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should be ready', async () => {
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.component.isReady.value).toBeTrue();
  });

  describe('onFirstDataRendered', () => {
    it('should merge old state and apply it', () => {
      const current = [...COLUMN_STATE];
      current[current.length - 1] = {...current[current.length - 1], pinned: 'left'};
      spectator.component.gridApi = GRID_API;
      spectator.component.gridApi.getColumnState = () => COLUMN_STATE;
      userPreferencesService.getComponentState.and.returnValue({
        [`tableState${spectator.component.USER_PREFERENCE_SUFFIX}`]: {
          columnState: current,
          defaultColumnState: [COLUMN_STATE[0], COLUMN_STATE[1], COLUMN_STATE[2], COLUMN_STATE[3]],
          isCustomView: true,
        },
      });
      spyOn(spectator.component.gridApi, 'applyColumnState');
      spectator.detectChanges();

      spectator.component.onFirstDataRendered({} as FirstDataRenderedEvent);

      expect(spectator.component.gridApi.applyColumnState).toHaveBeenCalled();
      expect(spectator.component.gridApi.applyColumnState).toHaveBeenCalledWith({
        state: current,
        applyOrder: true,
      });
    });

    it('should apply the default widths merged with changes from modifiedDisplayedColumns ', () => {
      const current = [...COLUMN_STATE];
      current[current.length - 1] = {...current[current.length - 1], pinned: 'left'};
      spectator.component.gridApi = GRID_API;
      spectator.component.gridApi.getColumnState = () => COLUMN_STATE;
      userPreferencesService.getComponentState.and.returnValue({
        [`tableState${spectator.component.NEW_USER_PREFERENCE_SUFFIX}`]: {
          modifiedDisplayedColumns: {
            [COLUMN_STATE[COLUMN_STATE.length - 1].colId]: {
              pinned: 'left',
              visible: true,
              index: COLUMN_STATE.length - 1,
            },
          },
          resolutions: {},
        },
      });
      spyOn(spectator.component.gridApi, 'applyColumnState');
      spectator.detectChanges();

      spectator.component.onFirstDataRendered({} as FirstDataRenderedEvent);

      expect(spectator.component.gridApi.applyColumnState).toHaveBeenCalled();
      expect(spectator.component.gridApi.applyColumnState).toHaveBeenCalledWith({
        state: current,
        applyOrder: true,
      });
    });
  });

  it('onGridReady should call addRowGroupColumns and removeRowGroupColumns', async () => {
    spectator.setInput('groupByOptions', [
      {
        groups: [
          {
            colId: 'col1',
            field: 'col1',
          },
          {
            colId: 'col2',
            field: 'col2',
          },
        ],
        title: 'Col1 + Col2',
      } as MeGroupByItem,
      {
        groups: [
          {
            colId: 'col1',
            field: 'col1',
          },
          {
            colId: 'col3',
            field: 'col3',
          },
        ],
        title: 'Col1 + Col3',
      } as MeGroupByItem,
    ]);
    spectator.component.gridApi = GRID_API;
    spyOn(spectator.component.gridApi, 'addRowGroupColumns');
    spyOn(spectator.component.gridApi, 'removeRowGroupColumns');
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.component.isReady.value).toBeTrue();

    spectator.component.onGridReady(GRID_OPTIONS);
    await new Promise((resolve) => setTimeout(resolve, 200));
    spectator.detectChanges();

    expect(spectator.component.gridApi.addRowGroupColumns).toHaveBeenCalled();
    expect(spectator.component.gridApi.removeRowGroupColumns).toHaveBeenCalled();
  });

  it('onGroupByChanged should call addRowGroupColumns and removeRowGroupColumns', async () => {
    const firstOption: MeGroupByItem = {
      groups: [
        {
          colId: 'col1',
          field: 'col1',
        },
        {
          colId: 'col2',
          field: 'col2',
        },
      ],
      title: 'Col1 + Col2',
    } as MeGroupByItem;
    spectator.setInput('groupByOptions', [
      firstOption,
      {
        groups: [
          {
            colId: 'col1',
            field: 'col1',
          },
          {
            colId: 'col3',
            field: 'col3',
          },
        ],
        title: 'Col1 + Col3',
      } as MeGroupByItem,
    ]);
    spectator.component.gridApi = GRID_API;
    spyOn(spectator.component.gridApi, 'addRowGroupColumns');
    spyOn(spectator.component.gridApi, 'removeRowGroupColumns');
    await spectator.fixture.whenStable();

    const dynamic: MeGroupByItemDerived = {
      ...firstOption,
      key: 'col1-col2',
    };

    spectator.component.onGroupByChanged(dynamic);
    spectator.detectChanges();

    expect(spectator.component.gridApi.addRowGroupColumns).toHaveBeenCalled();
    expect(spectator.component.gridApi.removeRowGroupColumns).toHaveBeenCalled();

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.component.isReady.value).toBeTrue();
  });
});
