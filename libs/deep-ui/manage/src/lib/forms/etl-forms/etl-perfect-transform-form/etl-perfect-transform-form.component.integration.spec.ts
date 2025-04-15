import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeSelectComponent, MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {
  getElementsBySelector,
  MeAutoCompleteHarness,
  MeCheckBoxHarness,
  MeChipHarness,
  MeInputHarness,
  MeSelectHarness,
} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {of} from 'rxjs';

import {EtlPerfectTransformFormComponent} from './etl-perfect-transform-form.component';
import {fakeETL, fakeServiceNames, fakeServices} from './etl-perfect-transform-form.component.spec';
import {EtlPerfectTransformFormService} from './etl-perfect-transform-form.service';
import SpyObj = jasmine.SpyObj;
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {discardPeriodicTasks, fakeAsync, flush} from '@angular/core/testing';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSlideToggleHarness} from '@angular/material/slide-toggle/testing';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {
  BudgetGroupControl,
  BudgetGroupService,
} from 'deep-ui/shared/components/src/lib/controls/budget-group-control';
import {DatasourceService, EtlService} from 'deep-ui/shared/core';
import {EtlTypeEnum} from 'deep-ui/shared/models';
import {getFakePerfectDatasource} from 'deep-ui/shared/testing';

const datasource1 = getFakePerfectDatasource(true, {status: 'active'}).fakeDataSource;
const datasource2 = getFakePerfectDatasource(true, {
  name: 'dataSource2',
  status: 'active',
}).fakeDataSource;
const datasource3 = getFakePerfectDatasource(true, {
  name: 'dataSource3',
  status: 'active',
}).fakeDataSource;
const fakeDataSourcesResponse = [datasource1, datasource2, datasource3];

describe('EtlPerfectTransformFormComponent - Integration', () => {
  let spectator: Spectator<EtlPerfectTransformFormComponent>;
  let etlService: SpyObj<EtlService>;
  let datasourceService: SpyObject<DatasourceService>;
  let budgetGroupService: SpyObject<BudgetGroupService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: EtlPerfectTransformFormComponent,
    imports: [
      MatButtonModule,
      ReactiveFormsModule,
      MeInputComponent,
      MeTextareaComponent,
      MeSelectComponent,
      MeAutocompleteComponent,
      MatIconModule,
      MeTooltipDirective,
      MeFormControlChipsFieldComponent,
      MeJsonEditorComponent,
      MatCheckboxModule,
      MatSlideToggleModule,
      BudgetGroupControl,
      HintIconComponent,
      MeSafePipe,
      NgTemplateOutlet,
      AsyncPipe,
    ],
    providers: [EtlPerfectTransformFormService],
    mocks: [EtlService, DatasourceService, BudgetGroupService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
    etlService = spectator.inject(EtlService);
    etlService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
    etlService.getServices.and.returnValue(of(fakeServices));
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.component.serviceNames = fakeServiceNames;
    spectator.component.etl = fakeETL;
    spectator.component.type = EtlTypeEnum.PERFECT_TRANSFORM;
    datasourceService = spectator.inject(DatasourceService);
    budgetGroupService = spectator.inject(BudgetGroupService);
    datasourceService.getMulti.and.returnValue(of(fakeDataSourcesResponse));
    budgetGroupService.getBudgetGroups.and.returnValue(
      of({
        groups: [
          {
            id: 'deep',
            value: 'deep',
            tooltip: '',
            isDisabled: false,
          } as MeSelectOption,
        ],
        isValid: true,
        error: '',
      }),
    );
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('Create', () => {
    beforeEach(() => {
      spectator.detectChanges();
      spectator.component.formMode = 'create';
      budgetGroupService.getBudgetGroups.and.returnValue(
        of({
          groups: [
            {
              id: 'deep',
              value: 'deep',
              tooltip: '',
              isDisabled: false,
            } as MeSelectOption,
          ],
          isValid: true,
          error: '',
        }),
      );
    });

    it('should fill mandatory fields and create', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.component.etl = undefined;
      spectator.detectChanges();

      // set name
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Name"]'},
        'name1',
      );
      // set team
      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Team"]'},
        'deep-fpa-objects',
      );

      // click data prep node
      const nodes = getElementsBySelector(spectator.fixture, '.etl-node');
      nodes[1].nativeElement.click();
      spectator.detectChanges();

      // set service
      await MeAutoCompleteHarness.selectOptionByText(
        spectator.fixture,
        loader,
        {ancestor: '[title="Service"]'},
        {ancestor: '[title="Service"]'},
        spectator.component.serviceNames[1].name,
      );
      // set version
      await MeAutoCompleteHarness.selectOptionByText(
        spectator.fixture,
        loader,
        {ancestor: '[title="Version"]'},
        {ancestor: '[title="Version"]'},
        fakeServices[1].version,
      );

      spectator.component.onSubmit();
      await spectator.fixture.whenStable();

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalled();
    });
  });

  describe('Edit', () => {
    beforeEach(() => {
      spectator.component.formMode = 'edit';
      spectator.component.showCreateButton = true;
      spectator.component.showIncrementMajor = true;
      budgetGroupService.getBudgetGroups.and.returnValue(
        of({
          groups: [
            {
              id: 'deep',
              value: 'deep',
              tooltip: '',
              isDisabled: false,
            } as MeSelectOption,
          ],
          isValid: true,
          error: '',
        }),
      );
    });

    it('should add some fields and submit', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.detectChanges();

      // clear chips
      await MeChipHarness.clear(spectator.fixture, loader, '[title="Tags (Optional)"]');
      // add chip
      await MeChipHarness.addTag(
        spectator.fixture,
        loader,
        {ancestor: '[title="Tags (Optional)"]'},
        'new-tag',
      );

      // click perfect transform node
      const nodes = getElementsBySelector(spectator.fixture, '.etl-node');
      nodes[1].nativeElement.click();
      spectator.fixture.detectChanges();

      // set service
      await MeAutoCompleteHarness.selectOptionByText(
        spectator.fixture,
        loader,
        {ancestor: '[title="Service"]'},
        {ancestor: '[title="Service"]'},
        spectator.component.serviceNames[3].name,
      );
      // set version
      await MeAutoCompleteHarness.selectOptionByText(
        spectator.fixture,
        loader,
        {ancestor: '[title="Version"]'},
        {ancestor: '[title="Version"]'},
        fakeServices[3].version,
      );

      spectator.component.onSubmit();
      await spectator.fixture.whenStable();

      expect(spectator.component.tagsControl.value).toEqual(['new-tag']);
      expect(
        spectator.component.etlForm.controls.perfectTransformForm.controls.version.value,
      ).toEqual({
        name: fakeServices[3].version,
        id: fakeServices[3].version,
      });

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalled();
    });

    it('should emit null, no dirty field', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.detectChanges();

      spectator.component.onSubmit();
      await spectator.fixture.whenStable();

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith({
        etl: null,
        dataSources: [],
      });
    });

    it('incrementMajorVersion true - no dirty field - should emit form value change', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.detectChanges();

      await MeCheckBoxHarness.check(spectator.fixture, loader, {
        ancestor: '.increment-major-control',
      });

      spectator.component.onSubmit();
      await spectator.fixture.whenStable();

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith({
        etl: jasmine.objectContaining({
          name: spectator.component.etl.name,
        }),
        dataSources: [],
      });
    });

    it('triggerDataSourcesUpdate true - should emit form value change', fakeAsync(async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.detectChanges();

      const dsUpdateToggleHarness = await loader.getHarness(
        MatSlideToggleHarness.with({
          ancestor: '.toggle-ds-update',
        }),
      );

      await dsUpdateToggleHarness.toggle();

      flush();
      discardPeriodicTasks();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onSubmit();
      await spectator.fixture.whenStable();

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith({
        etl: jasmine.objectContaining({
          name: spectator.component.etl.name,
          metadata: {
            triggerDataSourcesUpdate: true,
          },
        }),
        dataSources: fakeDataSourcesResponse,
        budgetGroup: 'deep',
      });
    }));
  });
});
