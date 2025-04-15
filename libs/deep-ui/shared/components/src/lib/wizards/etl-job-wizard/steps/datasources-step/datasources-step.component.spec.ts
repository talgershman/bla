import {ReactiveFormsModule} from '@angular/forms';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MeChipsGroupButtonsComponent} from '@mobileye/material/src/lib/components/chips-group-buttons';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DatasourceTablesControlComponent} from 'deep-ui/shared/components/src/lib/controls/datasource-tables-control';
import {AssetManagerService, DeepUtilService} from 'deep-ui/shared/core';
import {of} from 'rxjs';

import {DatasourcesStepComponent} from './datasources-step.component';

describe('DatasourcesStepComponent', () => {
  let spectator: Spectator<DatasourcesStepComponent>;
  let deepUtilService: SpyObject<DeepUtilService>;
  let assetManagerService: SpyObject<AssetManagerService>;

  const mockOptions: MeSelectOption[] = [
    {id: '1', value: 'Option 1'},
    {id: '2', value: 'Option 2'},
  ];

  const createComponent = createComponentFactory({
    component: DatasourcesStepComponent,
    imports: [
      ReactiveFormsModule,
      MeChipsGroupButtonsComponent,
      MeSelectComponent,
      DatasourceTablesControlComponent,
      MatProgressSpinnerModule,
    ],
    mocks: [AssetManagerService, DeepUtilService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    deepUtilService = spectator.inject(DeepUtilService);
    deepUtilService.getCurrentUserTeams.and.returnValue(['deep-admin']); // Mocking user teams
    assetManagerService = spectator.inject(AssetManagerService);
    assetManagerService.getTechnologiesOptions.and.returnValue(of(mockOptions));
    spectator.component.wasShown = true;
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should initialize with correct perfect options', () => {
    spectator.detectChanges();

    expect(spectator.component.perfectsOptions).toEqual([
      {id: 'Data sources', label: 'Data sources'},
      {id: 'FPA perfects', label: 'FPA perfects'},
    ]);
  });

  it('should initialize form controls', () => {
    spectator.detectChanges();

    expect(spectator.component.dataSourcesForm.controls.fpaPerfects.value).toBeNull();
    expect(spectator.component.dataSourcesForm.controls.dataSources.value).toEqual([]);
  });

  it('should set FPA perfects options', () => {
    spectator.detectChanges();

    expect(spectator.component.fpaPerfectsOptions).toEqual(mockOptions);
  });

  it('should handle perfect option change', () => {
    const radioBtnChange1 = {
      source: null as any,
      value: {id: 'FPA perfects'},
    };
    const radioBtnChange2 = {
      source: null as any,
      value: {id: 'Data sources'},
    };
    spectator.detectChanges();

    spectator.component.onPerfectOptionChange(radioBtnChange1);

    expect(spectator.component.selectedPerfectOption).toBe(radioBtnChange1.value.id);
    expect(spectator.component.dataSourcesForm.controls.dataSources.value).toEqual([]);

    spectator.component.onPerfectOptionChange(radioBtnChange2);

    expect(spectator.component.selectedPerfectOption).toBe(radioBtnChange2.value.id);
    expect(spectator.component.dataSourcesForm.controls.fpaPerfects.value).toBeNull();
  });

  it('should emit form state on status change', async () => {
    spyOn(spectator.component.formState, 'emit');
    spectator.component.dataSourcesForm.controls.dataSources.setValue([
      {
        dataSource: {id: '1'},
      } as any,
    ]);

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(spectator.component.formState.emit).toHaveBeenCalledWith('VALID');
  });

  it('should reset to initial state when wasShown changes', () => {
    spectator.detectChanges();

    spectator.component.dataSourcesForm.controls.fpaPerfects.setValue('some-value' as any);
    spectator.component.dataSourcesForm.controls.dataSources.setValue([
      {dataSource: {id: '1'}} as any,
    ]);

    spectator.setInput('wasShown', false);
    spectator.setInput('wasShown', true);

    spectator.detectChanges();

    expect(spectator.component.selectedPerfectOption).toBe(
      spectator.component.initialPerfectOption,
    );

    expect(spectator.component.dataSourcesForm.controls.fpaPerfects.value).toBeNull();
    expect(spectator.component.dataSourcesForm.controls.dataSources.value).toEqual([]);
  });
});
