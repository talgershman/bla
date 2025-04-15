import {Column, ColumnState, GridApi} from '@ag-grid-community/core';
import {ChangeDetectorRef} from '@angular/core';
import {
  MeGroupByItemDerived,
  MeModifiedColumnState,
} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeAgTableApiService} from '@mobileye/material/src/lib/components/ag-table/services/ag-table-api.service';
import {createServiceFactory, SpectatorService} from '@ngneat/spectator';

describe('MeAgTableApiService', () => {
  let spectator: SpectatorService<MeAgTableApiService<any>>;
  const createService = createServiceFactory({
    service: MeAgTableApiService,
    providers: [ChangeDetectorRef],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should create', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('areColumnStatesSimilar', () => {
    it('should return true for identical column states', () => {
      const stateA: ColumnState = {
        colId: 'col1',
        hide: false,
        pinned: 'left',
      };
      const stateB: ColumnState = {
        colId: 'col1',
        hide: false,
        pinned: 'left',
      };

      expect(spectator.service.areColumnStatesSimilar(stateA, stateB)).toBe(true);
    });

    it('should return false if hide properties are different', () => {
      const stateA: ColumnState = {
        colId: 'col1',
        hide: false,
        pinned: 'left',
      };
      const stateB: ColumnState = {
        colId: 'col1',
        hide: true,
        pinned: 'left',
      };

      expect(spectator.service.areColumnStatesSimilar(stateA, stateB)).toBe(false);
    });

    it('should return false if pinned properties are different', () => {
      const stateA: ColumnState = {
        colId: 'col1',
        hide: false,
        pinned: 'left',
      };
      const stateB: ColumnState = {
        colId: 'col1',
        hide: false,
        pinned: 'right',
      };

      expect(spectator.service.areColumnStatesSimilar(stateA, stateB)).toBe(false);
    });
  });

  describe('compareModifiedDisplayedColumns', () => {
    it('should return added columns when new state has additional columns', () => {
      const tableId = 'table1';
      const newState = {
        col1: {visible: true, index: 0} as MeModifiedColumnState,
        col2: {visible: true, index: 1} as MeModifiedColumnState,
      };
      const oldState = {
        col1: {visible: true, index: 0} as MeModifiedColumnState,
      };

      const result = spectator.service.compareModifiedDisplayedColumns(tableId, newState, oldState);

      expect(result).toEqual({
        tableId,
        added: ['col2'],
        removed: [],
      });
    });

    it('should return removed columns when old state has additional columns', () => {
      const tableId = 'table1';
      const newState = {
        col1: {visible: true, index: 0} as MeModifiedColumnState,
      };
      const oldState = {
        col1: {visible: true, index: 0} as MeModifiedColumnState,
        col2: {visible: true, index: 1} as MeModifiedColumnState,
      };

      const result = spectator.service.compareModifiedDisplayedColumns(tableId, newState, oldState);

      expect(result).toEqual({
        tableId,
        added: [],
        removed: ['col2'],
      });
    });

    it('should return both added and removed columns when states differ', () => {
      const tableId = 'table1';
      const newState = {
        col1: {visible: true, index: 0} as MeModifiedColumnState,
        col3: {visible: true, index: 1} as MeModifiedColumnState,
      };
      const oldState = {
        col1: {visible: true, index: 0} as MeModifiedColumnState,
        col2: {visible: true, index: 1} as MeModifiedColumnState,
      };

      const result = spectator.service.compareModifiedDisplayedColumns(tableId, newState, oldState);

      expect(result).toEqual({
        tableId,
        added: ['col3'],
        removed: ['col2'],
      });
    });

    it('should return empty arrays when states are identical', () => {
      const tableId = 'table1';
      const newState = {
        col1: {visible: true, index: 0} as MeModifiedColumnState,
        col2: {visible: true, index: 1} as MeModifiedColumnState,
      };
      const oldState = {
        col1: {visible: true, index: 0} as MeModifiedColumnState,
        col2: {visible: true, index: 1} as MeModifiedColumnState,
      };

      const result = spectator.service.compareModifiedDisplayedColumns(tableId, newState, oldState);

      expect(result).toEqual({
        tableId,
        added: [],
        removed: [],
      });
    });
  });

  describe('clearUnavailableColIdsFromModifiedDisplayedColumns', () => {
    it('should remove columns not present in the current state', () => {
      const current = [
        {colId: 'col1', width: 100, hide: false},
        {colId: 'col2', width: 150, hide: false},
      ];
      const modifiedDisplayedColumns = {
        col1: {visible: true, index: 0} as MeModifiedColumnState as MeModifiedColumnState,
        col3: {visible: true, index: 1} as MeModifiedColumnState as MeModifiedColumnState,
      };

      const result = spectator.service.clearUnavailableColIdsFromModifiedDisplayedColumns(
        current,
        modifiedDisplayedColumns,
      );

      expect(result).toEqual({
        col1: {visible: true, index: 0} as MeModifiedColumnState,
      });
    });

    it('should return the same object if all columns are present in the current state', () => {
      const current = [
        {colId: 'col1', width: 100, hide: false},
        {colId: 'col2', width: 150, hide: false},
      ];
      const modifiedDisplayedColumns = {
        col1: {visible: true, index: 0} as MeModifiedColumnState,
        col2: {visible: true, index: 1} as MeModifiedColumnState,
      };

      const result = spectator.service.clearUnavailableColIdsFromModifiedDisplayedColumns(
        current,
        modifiedDisplayedColumns,
      );

      expect(result).toEqual(modifiedDisplayedColumns);
    });

    it('should return an empty object if no columns are present in the current state', () => {
      const current = [];
      const modifiedDisplayedColumns = {
        col1: {visible: true, index: 0} as MeModifiedColumnState,
        col2: {visible: true, index: 1} as MeModifiedColumnState,
      };

      const result = spectator.service.clearUnavailableColIdsFromModifiedDisplayedColumns(
        current,
        modifiedDisplayedColumns,
      );

      expect(result).toEqual({});
    });
  });

  describe('getActiveModifiedDisplayedColumns', () => {
    it('should identify columns with different positions', () => {
      const current: ColumnState[] = [
        {colId: 'col2', hide: false, pinned: null},
        {colId: 'col1', hide: false, pinned: null},
      ];
      const defaultState: ColumnState[] = [
        {colId: 'col1', hide: false, pinned: null},
        {colId: 'col2', hide: false, pinned: null},
      ];

      const result = spectator.service.getActiveModifiedDisplayedColumns(current, defaultState);

      expect(result).toEqual({
        col1: {
          visible: true,
          index: 1,
          pinned: null,
        },
        col2: {
          visible: true,
          index: 0,
          pinned: null,
        },
      });
    });

    it('should identify columns with different visibility', () => {
      const current: ColumnState[] = [
        {colId: 'col1', hide: true, pinned: null},
        {colId: 'col2', hide: false, pinned: null},
      ];
      const defaultState: ColumnState[] = [
        {colId: 'col1', hide: false, pinned: null},
        {colId: 'col2', hide: false, pinned: null},
      ];

      const result = spectator.service.getActiveModifiedDisplayedColumns(current, defaultState);

      expect(result).toEqual({
        col1: {
          visible: false,
          index: 0,
          pinned: null,
        },
      });
    });
  });

  describe('updateColumnStateGroupByColumns', () => {
    it('should update row group properties for grouped columns', () => {
      const columnState: ColumnState[] = [
        {colId: 'col1', rowGroup: false},
        {colId: 'col2', rowGroup: false},
      ];
      const groupByItem: MeGroupByItemDerived = {
        groups: [
          {colId: 'col1', field: 'field1'},
          {colId: 'col2', field: 'field2'},
        ],
      } as MeGroupByItemDerived;
      const allGroupByColIds = ['col1', 'col2'];

      spectator.service.updateColumnStateGroupByColumns(columnState, groupByItem, allGroupByColIds);

      expect(columnState).toEqual([
        {colId: 'col1', rowGroup: true, rowGroupIndex: 0},
        {colId: 'col2', rowGroup: true, rowGroupIndex: 1},
      ]);
    });

    it('should clear row group properties when column is not in groups', () => {
      const columnState: ColumnState[] = [
        {colId: 'col1', rowGroup: true, rowGroupIndex: 0},
        {colId: 'col2', rowGroup: true, rowGroupIndex: 1},
      ];
      const groupByItem: MeGroupByItemDerived = {
        groups: [{colId: 'col2', field: 'field2'}],
      } as MeGroupByItemDerived;
      const allGroupByColIds = ['col1', 'col2'];

      spectator.service.updateColumnStateGroupByColumns(columnState, groupByItem, allGroupByColIds);

      expect(columnState).toEqual([
        {colId: 'col1', rowGroup: false, rowGroupIndex: undefined},
        {colId: 'col2', rowGroup: true, rowGroupIndex: 0},
      ]);
    });
  });

  describe('getColumnStateByModifiedDisplayedColumns', () => {
    it('should apply modified display columns to current state', () => {
      const current: ColumnState[] = [
        {colId: 'col1', hide: false, pinned: undefined},
        {colId: 'col2', hide: false, pinned: undefined},
      ];
      const modifiedDisplayedColumns = {
        col1: {visible: false, index: 1, pinned: 'left'} as unknown as MeModifiedColumnState,
        col2: {visible: true, index: 0} as MeModifiedColumnState,
      };
      const initialGroupId = null;
      const groupByIds = [];

      const result = spectator.service.getColumnStateByModifiedDisplayedColumns(
        current,
        modifiedDisplayedColumns,
        new Set([]),
      );

      spectator.service.updateColumnStateGroupByColumns(result, initialGroupId, groupByIds);

      expect(result).toEqual([
        {
          colId: 'col2',
          hide: false,
          pinned: undefined,
        },
        {colId: 'col1', hide: true, pinned: 'left'},
      ]);
    });

    it('should preserve column state for unmodified columns', () => {
      const current: ColumnState[] = [
        {colId: 'col1', hide: false, pinned: undefined},
        {colId: 'col2', hide: false, pinned: 'right'},
      ];
      const modifiedDisplayedColumns = {
        col1: {visible: false, index: 0} as MeModifiedColumnState,
      };
      const initialGroupId = null;
      const groupByIds = [];

      const result = spectator.service.getColumnStateByModifiedDisplayedColumns(
        current,
        modifiedDisplayedColumns,
        new Set([]),
      );

      spectator.service.updateColumnStateGroupByColumns(result, initialGroupId, groupByIds);

      expect(result).toEqual([
        {
          colId: 'col1',
          hide: true,
          pinned: undefined,
        },
        {colId: 'col2', hide: false, pinned: 'right'},
      ]);
    });

    it('should apply both modified display and group states', () => {
      const current: ColumnState[] = [
        {colId: 'col1', hide: false, pinned: undefined, rowGroup: false},
        {colId: 'col2', hide: false, pinned: undefined, rowGroup: false},
      ];
      const modifiedDisplayedColumns = {
        col1: {visible: true, index: 0, rowGroup: true} as unknown as MeModifiedColumnState,
      };
      const initialGroupId: MeGroupByItemDerived = {
        groups: [
          {colId: 'col1', field: 'field1'},
          {colId: 'col2', field: 'field2'},
        ],
      } as MeGroupByItemDerived;
      const groupByIds = ['col1', 'col2'];

      const result = spectator.service.getColumnStateByModifiedDisplayedColumns(
        current,
        modifiedDisplayedColumns,
        new Set([]),
      );

      spectator.service.updateColumnStateGroupByColumns(result, initialGroupId, groupByIds);

      expect(result).toEqual([
        {colId: 'col1', hide: false, pinned: undefined, rowGroup: true, rowGroupIndex: 0},
        {colId: 'col2', hide: false, pinned: undefined, rowGroup: true, rowGroupIndex: 1},
      ]);
    });
  });

  describe('getTableResolutionData', () => {
    it('should create a new resolution entry if none is within the width range', () => {
      const columnState: ColumnState[] = [
        {colId: 'col1', width: 100, hide: false},
        {colId: 'col2', width: 150, hide: false},
      ];
      const oldResolutions = {};
      const gridWidth = 500;
      const result = spectator.service.getTableResolutionData(
        columnState,
        oldResolutions,
        gridWidth,
      );

      expect(result[0][gridWidth.toString()]).toEqual({
        col1: 100,
        col2: 150,
      });

      expect(result[1]).toBe(true);
    });

    it('should update an existing resolution entry if within the width range', () => {
      const columnState: ColumnState[] = [
        {colId: 'col1', width: 120, hide: false},
        {colId: 'col2', width: 180, hide: false},
      ];
      // Given an old resolution with key '400', and since widthRange is 150,
      // a gridWidth of 540 (difference 140) falls within range.
      const oldResolutions = {'400': {col1: 100, col2: 150}};
      const gridWidth = 540;
      const result = spectator.service.getTableResolutionData(
        columnState,
        oldResolutions,
        gridWidth,
      );
      // The resolution key '400' should be used.
      expect(result[0]['400']).toEqual({
        col1: 120,
        col2: 180,
      });

      expect(result[1]).toBe(true);
    });
  });

  describe('getResolutionKeysAsIntegers', () => {
    it('should convert resolution keys to integers', () => {
      const resolutions = {
        '100': {col1: 100},
        '200': {col1: 150},
        '300': {col1: 200},
      };

      const result = spectator.service.getResolutionKeysAsIntegers(resolutions);

      expect(result).toEqual([100, 200, 300]);
    });

    it('should handle empty resolutions object', () => {
      const resolutions = {};

      const result = spectator.service.getResolutionKeysAsIntegers(resolutions);

      expect(result).toEqual([]);
    });
  });

  describe('getResolution', () => {
    it('should return resolution within width range', () => {
      const gridWidth = 520;
      const resolutions = {
        '500': {col1: 100, col2: 200},
        '700': {col1: 150, col2: 250},
      };

      const result = spectator.service.getResolution(gridWidth, resolutions);

      expect(result).toEqual({col1: 100, col2: 200});
    });

    it('should return null when no resolution is within range', () => {
      const gridWidth = 900;
      const resolutions = {
        '500': {col1: 100},
        '600': {col1: 150},
      };

      const result = spectator.service.getResolution(gridWidth, resolutions);

      expect(result).toBeNull();
    });

    it('should handle empty resolutions object', () => {
      const gridWidth = 500;
      const resolutions = {};

      const result = spectator.service.getResolution(gridWidth, resolutions);

      expect(result).toBeNull();
    });
  });

  describe('getResolutionKey', () => {
    it('should return key for resolution within width range', () => {
      const gridWidth = 520;
      const resolutions = {
        '500': {col1: 100},
        '700': {col1: 150},
      };

      const result = spectator.service.getResolutionKey(gridWidth, resolutions);

      expect(result).toBe('500');
    });

    it('should return null when no resolution key is within range', () => {
      const gridWidth = 900;
      const resolutions = {
        '500': {col1: 100},
        '600': {col1: 150},
      };

      const result = spectator.service.getResolutionKey(gridWidth, resolutions);

      expect(result).toBeNull();
    });

    it('should return null for empty resolutions object', () => {
      const gridWidth = 500;
      const resolutions = {};

      const result = spectator.service.getResolutionKey(gridWidth, resolutions);

      expect(result).toBeNull();
    });
  });

  describe('evenlyResizeColumns', () => {
    it('should evenly resize columns when no resolution is provided', () => {
      const displayedColumns = [
        {
          colId: 'col1',
          isVisible: () => true,
          getColId() {
            return (this as any).colId;
          },
          getMaxWidth() {
            return 999999999;
          },
          getMinWidth() {
            return 0;
          },
        } as unknown as Column,
        {
          colId: 'col2',
          isVisible: () => true,
          getColId() {
            return (this as any).colId;
          },
          getMaxWidth() {
            return 999999999;
          },
          getMinWidth() {
            return 0;
          },
        } as unknown as Column,
        {
          colId: 'col3',
          isVisible: () => true,
          getColId() {
            return (this as any).colId;
          },
          getMaxWidth() {
            return 999999999;
          },
          getMinWidth() {
            return 0;
          },
        } as unknown as Column,
      ];
      const gridWidth = 600;
      const resolution = {};
      spectator.service.setGridApi({
        getColumnState: () => {},
        applyColumnState: () => {},
      } as unknown as GridApi);
      spyOn(spectator.service.getGridApi(), 'getColumnState').and.returnValue([
        {colId: 'col1', width: 100, hide: false},
        {colId: 'col2', width: 100, hide: false},
        {colId: 'col3', width: 100, hide: false},
      ]);
      spyOn(spectator.service.getGridApi(), 'applyColumnState');

      spectator.service.evenlyResizeColumns(displayedColumns, gridWidth, resolution, {});

      expect(spectator.service.getGridApi().applyColumnState).toHaveBeenCalledWith({
        state: [
          {colId: 'col1', width: 200, hide: false},
          {colId: 'col2', width: 200, hide: false},
          {colId: 'col3', width: 200, hide: false},
        ],
        applyOrder: true,
      });
    });

    it('should resize columns according to resolution', () => {
      const displayedColumns = [
        {
          colId: 'col1',
          isVisible: () => true,
          getColId() {
            return (this as any).colId;
          },
          getMaxWidth() {
            return 999999999;
          },
          getMinWidth() {
            return 0;
          },
        } as unknown as Column,
        {
          colId: 'col2',
          isVisible: () => true,
          getColId() {
            return (this as any).colId;
          },
          getMaxWidth() {
            return 999999999;
          },
          getMinWidth() {
            return 0;
          },
        } as unknown as Column,
        {
          colId: 'col3',
          isVisible: () => true,
          getColId() {
            return (this as any).colId;
          },
          getMaxWidth() {
            return 999999999;
          },
          getMinWidth() {
            return 0;
          },
        } as unknown as Column,
      ];
      const gridWidth = 600;
      const resolution = {col1: 150, col3: 250};
      spectator.service.setGridApi({
        getColumnState: () => {},
        applyColumnState: () => {},
      } as unknown as GridApi);
      spyOn(spectator.service.getGridApi(), 'getColumnState').and.returnValue([
        {colId: 'col1', width: 100, hide: false},
        {colId: 'col2', width: 100, hide: false},
        {colId: 'col3', width: 100, hide: false},
      ]);
      spyOn(spectator.service.getGridApi(), 'applyColumnState');

      spectator.service.evenlyResizeColumns(displayedColumns, gridWidth, resolution, {});

      expect(spectator.service.getGridApi().applyColumnState).toHaveBeenCalledWith({
        state: [
          {colId: 'col1', width: 150, hide: false},
          {colId: 'col2', width: 200, hide: false},
          {colId: 'col3', width: 250, hide: false},
        ],
        applyOrder: true,
      });
    });

    it('should handle hidden columns correctly', () => {
      const displayedColumns = [
        {
          colId: 'col1',
          isVisible: () => true,
          getColId() {
            return (this as any).colId;
          },
          getMaxWidth() {
            return 999999999;
          },
          getMinWidth() {
            return 0;
          },
        } as unknown as Column,
        {
          colId: 'col3',
          isVisible: () => true,
          getColId() {
            return (this as any).colId;
          },
          getMaxWidth() {
            return 999999999;
          },
          getMinWidth() {
            return 0;
          },
        } as unknown as Column,
      ];
      const gridWidth = 600;
      const resolution = {col1: 150};
      spectator.service.setGridApi({
        getColumnState: () => {},
        applyColumnState: () => {},
      } as unknown as GridApi);
      spyOn(spectator.service.getGridApi(), 'getColumnState').and.returnValue([
        {colId: 'col1', width: 100, hide: false},
        {colId: 'col2', width: 100, hide: true},
        {colId: 'col3', width: 100, hide: false},
      ]);
      spyOn(spectator.service.getGridApi(), 'applyColumnState');

      spectator.service.evenlyResizeColumns(displayedColumns, gridWidth, resolution, {});

      expect(spectator.service.getGridApi().applyColumnState).toHaveBeenCalledWith({
        state: [
          {colId: 'col1', width: 150, hide: false},
          {colId: 'col2', width: 100, hide: true},
          {colId: 'col3', width: 450, hide: false},
        ],
        applyOrder: true,
      });
    });
  });
});
