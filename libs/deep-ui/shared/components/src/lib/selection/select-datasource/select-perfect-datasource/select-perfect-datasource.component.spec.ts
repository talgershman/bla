import {IServerSideSelectionState} from '@ag-grid-community/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {AgDatasourceService} from 'deep-ui/shared/core';
import {DatasourceDeselectData} from 'deep-ui/shared/models';
import {Subject} from 'rxjs';

import {SelectPerfectDatasourceComponent} from './select-perfect-datasource.component';

describe('SelectPerfectDatasourceComponent', () => {
  let spectator: Spectator<SelectPerfectDatasourceComponent>;
  const deSelectVersionSubject = new Subject<DatasourceDeselectData>();
  const createComponent = createComponentFactory({
    component: SelectPerfectDatasourceComponent,
    imports: [MeServerSideTableComponent, MeTooltipDirective, MatButtonModule, MatIconModule],
    mocks: [AgDatasourceService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.setInput('deSelectVersion', deSelectVersionSubject);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should set up the table with correct configurations', () => {
    const table = spectator.component;

    expect(table.autoGroupField).toBe('userFacingVersion');
    expect(table.autoGroupHeaderName).toBe('Name / Version');
    expect(table.groupKeyProperty).toBe('id');
    expect(table.idProperty).toBe('id');
    expect(table.teamProperty).toBe('team');
    expect(table.reTriggerUniqFilterAttr).toBe('id');
    expect(table.ignoreTeamFilterAttributes).toContain('id');
  });

  it('should handle deSelectVersion event', () => {
    const mockDeselectData: DatasourceDeselectData = {
      id: 'test-id',
      level: 0,
      type: DataSourceDynamicViewEnum.PERFECTS,
    };

    // Simulate the grid API
    spectator.component.gridApi = {
      forEachNode: jasmine.createSpy('forEachNode').and.callFake((cb: any) => {
        const mockNode: any = {
          data: {id: 'test-id'},
          setSelected: jasmine.createSpy('setSelected'),
          group: false,
        };
        cb(mockNode);
      }),
      getRowNode: jasmine.createSpy('getRowNode'),
    } as any;

    deSelectVersionSubject.next(mockDeselectData);
    spectator.detectChanges();

    expect(spectator.component.gridApi.forEachNode).toHaveBeenCalled();
    expect(spectator.component.gridApi.forEachNode).toHaveBeenCalledWith(jasmine.any(Function));
  });

  it('should emit selections when selection state changes', () => {
    const mockEvent: IServerSideSelectionState = {
      toggledNodes: ['node1'],
    } as IServerSideSelectionState;
    spyOn(spectator.component.dataSourceSelectionsChanged, 'emit');

    // Mock grid API
    spectator.component.gridApi = {
      getRowNode: jasmine
        .createSpy('getRowNode')
        .and.returnValue({data: {id: 'node1'}, parent: null}),
    } as any;

    // Mock selectedDataSources input
    spectator.setInput('selectedDataSources', []);

    spectator.component.onServerSideSelectionStateChanged(mockEvent);

    expect(spectator.component.dataSourceSelectionsChanged.emit).toHaveBeenCalledWith([
      {
        dataSource: {id: 'node1'} as any,
        version: null,
        type: DataSourceDynamicViewEnum.PERFECTS,
      },
    ]);
  });

  it('should apply row selection logic', () => {
    const mockRowNode = {
      data: {status: 'active'},
      rowTooltip: '',
      setSelected: jasmine.createSpy('setSelected'),
    } as any;

    expect(spectator.component.isRowSelectable(mockRowNode)).toBe(true);

    mockRowNode.data.status = 'updating';

    expect(spectator.component.isRowSelectable(mockRowNode)).toBe(false);
    expect(mockRowNode.rowTooltip).toBe('Data source is being updated, Please try again later');

    mockRowNode.data.status = 'inactive';

    expect(spectator.component.isRowSelectable(mockRowNode)).toBe(false);
    expect(mockRowNode.rowTooltip).toBe('Status not allowed');
  });
});
