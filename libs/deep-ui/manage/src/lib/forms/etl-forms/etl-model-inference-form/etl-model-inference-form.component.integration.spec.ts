import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {
  getElementsBySelector,
  MeAutoCompleteHarness,
  MeButtonHarness,
  MeCheckBoxHarness,
  MeChipHarness,
  MeInputHarness,
  MeSelectHarness,
  MeSliderHarness,
} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {of} from 'rxjs';

import SpyObj = jasmine.SpyObj;
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSliderModule} from '@angular/material/slider';
import {MeAreYouSureDialogComponent} from '@mobileye/material/src/lib/components/dialogs/are-you-sure';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
import {EtlService} from 'deep-ui/shared/core';
import {ETL, EtlTypeEnum} from 'deep-ui/shared/models';
import {getFakeETL} from 'deep-ui/shared/testing';

import {EtlModelInferenceFormComponent} from './etl-model-inference-form.component';
import {fakeETL, fakeServiceNames, fakeServices} from './etl-model-inference-form.component.spec';
import {EtlModelInferenceFormService} from './etl-model-inference-form.service';

describe('EtlModelInferenceFormComponent - Integration', () => {
  let spectator: Spectator<EtlModelInferenceFormComponent>;
  let etlService: SpyObj<EtlService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: EtlModelInferenceFormComponent,
    imports: [
      MatButtonModule,
      ReactiveFormsModule,
      MeInputComponent,
      MeTextareaComponent,
      MeSelectComponent,
      MeAutocompleteComponent,
      MatIconModule,
      MeFormControlChipsFieldComponent,
      MeJsonEditorComponent,
      MeAreYouSureDialogComponent,
      MatCheckboxModule,
      MatSliderModule,
      MeTooltipDirective,
      HintIconComponent,
      MatSlideToggleModule,
      MeSafePipe,
      NgTemplateOutlet,
      AsyncPipe,
    ],
    providers: [EtlModelInferenceFormService],
    mocks: [EtlService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
    etlService = spectator.inject(EtlService);
    etlService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
    etlService.getServices.and.returnValue(of(fakeServices));
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.component.serviceNames = fakeServiceNames;
    spectator.component.type = EtlTypeEnum.MODEL_INFERENCE;
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('Create', () => {
    beforeEach(() => {
      spectator.component.formMode = 'create';
    });

    it('should fill mandatory fields and create', (done) => {
      (async function () {
        spectator.detectChanges();
        await spectator.fixture.whenStable();

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

        // click generic data prep node
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

        // click logic node
        nodes[2].nativeElement.click();
        spectator.detectChanges();

        // set service
        await MeAutoCompleteHarness.selectOptionByText(
          spectator.fixture,
          loader,
          {ancestor: '[title="Service"]'},
          {ancestor: '[title="Service"]'},
          spectator.component.serviceNames[0].name,
        );
        // set version
        await MeAutoCompleteHarness.selectOptionByText(
          spectator.fixture,
          loader,
          {ancestor: '[title="Version"]'},
          {ancestor: '[title="Version"]'},
          fakeServices[0].version,
        );

        spectator.component.fromValueChanged.subscribe(({etl}: {etl: ETL}) => {
          expect(etl).not.toBeEmpty();
          done();
        });

        spectator.component.onSubmit();
        await spectator.fixture.whenStable();
      })();
    });

    it('should create a etl with genericDataPrep only', (done) => {
      (async function () {
        spectator.detectChanges();
        await spectator.fixture.whenStable();

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
        // click generic data prep node
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

        // delete logic node
        const elem = getElementsBySelector(spectator.fixture, '.close-icon');
        elem[2].nativeElement.click();
        spectator.detectChanges();

        spectator.component.fromValueChanged.subscribe(({etl}: {etl: ETL}) => {
          expect(etl).not.toBeEmpty();
          done();
        });

        spectator.component.onSubmit();
        await spectator.fixture.whenStable();
      })();
    });

    it('should create with resourcesDefinition', (done) => {
      (async function () {
        spectator.detectChanges();
        await spectator.fixture.whenStable();

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

        // click generic data prep node
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

        // set resourcesDefinition
        // click checkbox
        await MeCheckBoxHarness.check(spectator.fixture, loader, {
          ancestor: '.generic-data-prep-container .toggle-config',
        });

        // close warning dialog
        await MeButtonHarness.click(spectator.fixture, docLoader, {text: 'Ok'});

        // set ram
        await MeSliderHarness.setValue(
          spectator.fixture,
          loader,
          {ancestor: '.generic-data-prep-container .resources-capacity-controls .ram-control'},
          9,
        );

        await MeSliderHarness.setValue(
          spectator.fixture,
          loader,
          {ancestor: '.generic-data-prep-container .resources-capacity-controls .runtime-control'},
          15,
        );

        // click logic node
        nodes[2].nativeElement.click();
        spectator.detectChanges();

        // set service
        await MeAutoCompleteHarness.selectOptionByText(
          spectator.fixture,
          loader,
          {ancestor: '[title="Service"]'},
          {ancestor: '[title="Service"]'},
          spectator.component.serviceNames[0].name,
        );
        // set version
        await MeAutoCompleteHarness.selectOptionByText(
          spectator.fixture,
          loader,
          {ancestor: '[title="Version"]'},
          {ancestor: '[title="Version"]'},
          fakeServices[0].version,
        );

        // set resourcesDefinition
        // click checkbox
        await MeCheckBoxHarness.check(spectator.fixture, loader, {
          ancestor: '.logic-container .toggle-config',
        });

        // close warning dialog
        await MeButtonHarness.click(spectator.fixture, docLoader, {text: 'Ok'});

        // set ram
        await MeSliderHarness.setValue(
          spectator.fixture,
          loader,
          {ancestor: '.logic-container .resources-capacity-controls .ram-control'},
          10,
        );

        await MeSliderHarness.setValue(
          spectator.fixture,
          loader,
          {ancestor: '.logic-container .resources-capacity-controls .runtime-control'},
          15,
        );

        spectator.component.fromValueChanged.subscribe(({etl}: {etl: ETL}) => {
          expect(etl.resourcesDefinition).toEqual({
            [fakeServices[0].id]: {
              ram: 10,
              runtime: 15,
            },
            [fakeServices[1].id]: {
              ram: 9,
              runtime: 15,
            },
          });
          done();
        });

        spectator.component.onSubmit();
        await spectator.fixture.whenStable();
      })();
    });
  });

  describe('Edit', () => {
    beforeEach(() => {
      spectator.component.etl = fakeETL;
      spectator.component.formMode = 'edit';
      spectator.component.showCreateButton = true;
      spectator.component.showIncrementMajor = true;
    });

    it('should add some fields and submit', async () => {
      spectator.detectChanges();
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

      // click generic data prep node
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

      nodes[2].nativeElement.click();
      spectator.detectChanges();

      // set service
      await MeAutoCompleteHarness.selectOptionByText(
        spectator.fixture,
        loader,
        {ancestor: '[title="Service"]'},
        {ancestor: '[title="Service"]'},
        spectator.component.serviceNames[2].name,
      );
      // set version
      await MeAutoCompleteHarness.selectOptionByText(
        spectator.fixture,
        loader,
        {ancestor: '[title="Version"]'},
        {ancestor: '[title="Version"]'},
        fakeServices[2].version,
      );

      spectator.component.onSubmit();
      await spectator.fixture.whenStable();

      expect(spectator.component.tagsControl.value).toEqual(['new-tag']);
      expect(
        spectator.component.etlForm.controls.genericDataPrepForm.controls.version.value,
      ).toEqual({
        name: fakeServices[3].version,
        id: fakeServices[3].version,
      });

      expect(spectator.component.etlForm.controls.logicForm.controls.version.value).toEqual({
        name: fakeServices[2].version,
        id: fakeServices[2].version,
      });

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalled();
    });

    it('should emit null, no dirty field', (done) => {
      (async function () {
        spectator.detectChanges();
        await spectator.fixture.whenStable();
        spectator.component.fromValueChanged.subscribe(({etl}: {etl: ETL}) => {
          expect(etl).toBeNull();
          done();
        });

        spectator.component.onSubmit();
        await spectator.fixture.whenStable();
      })();
    });

    it('generic data prep only ETL, change generic data prep version', async () => {
      spectator.component.etl = getFakeETL(true, {
        services: {
          [fakeServices[1].id]: fakeServices[1],
        },
        servicesDag: {
          [fakeServices[1].id]: 'BI',
          root: fakeServices[1].id.toString(),
        },
      });
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.detectChanges();
      // click generic data prep node
      const nodes = getElementsBySelector(spectator.fixture, '.etl-node');
      nodes[1].nativeElement.click();
      spectator.fixture.detectChanges();

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

      expect(
        spectator.component.etlForm.controls.genericDataPrepForm.controls.version.value,
      ).toEqual({
        name: fakeServices[1].version,
        id: fakeServices[1].version,
      });

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalled();
    });

    it('should update resourcesDefinition', async () => {
      spectator.component.etl = {
        ...fakeETL,
        resourcesDefinition: {
          [fakeServices[0].id]: {
            ram: 10,
            runtime: 15,
          },
          [fakeServices[1].id]: {
            ram: 9,
            runtime: 15,
          },
        },
      };
      spectator.detectChanges();
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.detectChanges();

      const nodes = getElementsBySelector(spectator.fixture, '.etl-node');

      // click logic node
      nodes[2].nativeElement.click();
      spectator.fixture.detectChanges();

      // set new ram
      await MeSliderHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '.logic-container .resources-capacity-controls .ram-control'},
        8,
      );

      spectator.component.onSubmit();
      await spectator.fixture.whenStable();

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith({
        etl: jasmine.objectContaining({
          resourcesDefinition: {
            [fakeServices[0].id]: {
              ram: 8,
              runtime: 15,
            },
            [fakeServices[1].id]: {
              ram: 9,
              runtime: 15,
            },
          },
        }),
      });
    });

    it('incrementMajorVersion true - no dirty field - should emit form value change', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      await spectator.fixture.whenStable();
      spectator.detectChanges();

      await MeCheckBoxHarness.check(spectator.fixture, loader, {
        ancestor: '.increment-major-control',
      });

      spectator.component.onSubmit();
      await spectator.fixture.whenStable();

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith({
        etl: jasmine.objectContaining({name: spectator.component.etl.name}),
      });
    });
  });
});
