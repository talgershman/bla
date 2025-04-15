import {MeChipsGroupButtonsComponent} from '@mobileye/material/src/lib/components/chips-group-buttons';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {createComponentFactory, mockProvider, Spectator, SpyObject} from '@ngneat/spectator';
import {
  DatasourceSelectionChipData,
  SelectDatasourceSelectionsComponent,
} from 'deep-ui/shared/components/src/lib/selection/select-datasource/select-datasource-selections';
import {SelectPerfectDatasourceComponent} from 'deep-ui/shared/components/src/lib/selection/select-datasource/select-perfect-datasource';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {
  Datasource,
  DatasourceDeselectData,
  DataSourceSelection,
  VersionDataSource,
} from 'deep-ui/shared/models';

import {SelectDatasourceComponent} from './select-datasource.component';

describe('SelectDatasourceComponent', () => {
  let spectator: Spectator<SelectDatasourceComponent>;
  let userPreferencesService: SpyObject<MeUserPreferencesService>;

  const createComponent = createComponentFactory({
    component: SelectDatasourceComponent,
    imports: [
      MeChipsGroupButtonsComponent,
      SelectPerfectDatasourceComponent,
      SelectDatasourceSelectionsComponent,
    ],
    providers: [mockProvider(MeUserPreferencesService)],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    userPreferencesService = spectator.inject(MeUserPreferencesService);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should initialize with the default view if no button is selected', () => {
    spectator.setInput('selectedButtonId', null);
    spectator.detectChanges();

    expect(spectator.component.selectedGroupButton).toBe(DataSourceDynamicViewEnum.PERFECTS);
  });

  it('should update selectedGroupButton when group button changes', () => {
    spectator.setInput('datasourcesOptions', [
      {
        label: 'Perfects',
        id: DataSourceDynamicViewEnum.PERFECTS,
      },
      {
        label: 'MEST',
        id: DataSourceDynamicViewEnum.MESTS,
      },
    ]);
    spectator.detectChanges();

    expect(spectator.component.selectedGroupButton).toBe(DataSourceDynamicViewEnum.PERFECTS);

    spectator.component.onGroupButtonChanged(DataSourceDynamicViewEnum.MESTS);

    expect(spectator.component.selectedGroupButton).toBe(DataSourceDynamicViewEnum.MESTS);
    expect(userPreferencesService.addUserPreferences).toHaveBeenCalledWith(
      spectator.component.sessionKey,
      DataSourceDynamicViewEnum.MESTS,
    );
  });

  it('should emit dataSourceSelectionsChanged when selections change', () => {
    const selections: DataSourceSelection[] = [
      {
        dataSource: {id: '1', name: 'Source1'} as Datasource,
        type: DataSourceDynamicViewEnum.PERFECTS,
      },
    ];
    spyOn(spectator.component.dataSourceSelectionsChanged, 'emit');
    spectator.component.onDataSourceSelectionsChanged(selections);

    expect(spectator.component.dataSourceSelectionsChanged.emit).toHaveBeenCalledWith({
      selections: selections,
      type: spectator.component.selectedGroupButton,
    });
  });

  it('should handle selections with the same datasource', () => {
    const ds = {id: '1', name: 'Source1', latestUserVersion: '1'} as Datasource;
    const selections: DataSourceSelection[] = [
      {dataSource: ds, type: DataSourceDynamicViewEnum.PERFECTS},
      {
        dataSource: ds,
        type: DataSourceDynamicViewEnum.PERFECTS,
        version: {userFacingVersion: '1'} as VersionDataSource,
      },
    ];
    spectator.setInput('selectedDataSources', [selections[0]]);
    spyOn(spectator.component.deSelectVersion, 'next');
    spectator.detectChanges();
    spectator.component.onDataSourceSelectionsChanged(selections);
    spectator.detectChanges();

    expect(spectator.component.deSelectVersion.next).toHaveBeenCalledWith({
      id: '1',
      level: 0,
      type: DataSourceDynamicViewEnum.PERFECTS,
    });
  });

  it('should emit selectionRemoved on chip removal', () => {
    const chipData: DatasourceSelectionChipData = {
      name: 'Source1',
      type: DataSourceDynamicViewEnum.PERFECTS,
      typeName: 'Perfect',
      rowId: '1',
      level: 0,
      userFacingVersion: 'latest',
    };
    spyOn(spectator.component.selectionRemoved, 'emit');
    spyOn(spectator.component.deSelectVersion, 'next');
    spectator.detectChanges();
    spectator.component.onSelectionRemoved(chipData);

    const deSelectData: DatasourceDeselectData = {
      id: chipData.rowId,
      level: chipData.level,
      type: chipData.type,
    };

    expect(spectator.component.selectionRemoved.emit).toHaveBeenCalledWith(deSelectData);
    expect(spectator.component.deSelectVersion.next).toHaveBeenCalledWith(deSelectData);
  });

  it('should update chipsSelectionData based on updateSelections', () => {
    spectator.detectChanges();

    const selections: DataSourceSelection[] = [
      {
        dataSource: {id: '1', name: 'Source1'} as Datasource,
        type: DataSourceDynamicViewEnum.PERFECTS,
      },
    ];
    spectator.setInput('selectedDataSources', selections);
    spectator.detectChanges();

    expect(spectator.component.chipsSelectionData()).toEqual([
      {
        name: 'Source1',
        typeName: undefined,
        type: DataSourceDynamicViewEnum.PERFECTS,
        rowId: '1',
        level: 0,
        userFacingVersion: 'latest',
        hideTypeName: true,
      },
    ]);
  });
});
