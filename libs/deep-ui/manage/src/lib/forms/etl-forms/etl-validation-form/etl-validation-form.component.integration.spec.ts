import {LoadSuccessParams} from '@ag-grid-community/core';
import {OverlayContainer} from '@angular/cdk/overlay';
import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSliderModule} from '@angular/material/slider';
import {MeAreYouSureDialogComponent} from '@mobileye/material/src/lib/components/dialogs/are-you-sure';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeSafePipe} from '@mobileye/material/src/lib/pipes/safe';
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
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {PickerControlComponent} from 'deep-ui/shared/components/src/lib/controls/picker-control';
import {SelectParsingListComponent} from 'deep-ui/shared/components/src/lib/selection/select-parsing-list';
import {fillParsingStep, getParsingData} from 'deep-ui/shared/components/src/lib/testing';
import {EtlService, ParsingConfigurationService} from 'deep-ui/shared/core';
import {
  ETL,
  EtlTypeEnum,
  ParsingConfiguration,
  ParsingConfigurationGroupResponse,
} from 'deep-ui/shared/models';
import {getFakeETL} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {
  fakeETL,
  fakeParsingConfigs,
  fakeServiceNames,
  fakeServices,
} from '../../../etls/view-etl/view-etl.resolver.spec';
import {EtlValidationFormComponent} from './etl-validation-form.component';
import {EtlValidationFormService} from './etl-validation-form.service';

describe('EtlValidationFormComponent - Integration', () => {
  let spectator: Spectator<EtlValidationFormComponent>;
  let etlService: SpyObject<EtlService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;
  let parsingConfigurationService: SpyObject<ParsingConfigurationService>;
  let parsingData: {
    groups: Array<ParsingConfigurationGroupResponse>;
    parsingConfigs: Array<Array<ParsingConfiguration>>;
  };

  const createComponent = createComponentFactory({
    component: EtlValidationFormComponent,
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
      PickerControlComponent,
      SelectParsingListComponent,
      NgTemplateOutlet,
      AsyncPipe,
    ],
    providers: [EtlValidationFormService, MatDialog],
    mocks: [EtlService, ParsingConfigurationService],
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
    spectator.component.parsingConfigs = fakeParsingConfigs;
    spectator.component.type = EtlTypeEnum.VALIDATION;
    parsingConfigurationService = spectator.inject(ParsingConfigurationService);
    parsingData = getParsingData(spectator.component.parsingConfigs);
    parsingConfigurationService.getAgGridMulti.and.returnValue(
      of({
        rowData: parsingData.groups,
        rowCount: parsingData.groups.length,
      } as LoadSuccessParams),
    );
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
        // set parsing
        await MeButtonHarness.click(spectator.fixture, loader, {selector: '.open-button'});
        spectator.fixture.detectChanges();
        await spectator.fixture.whenStable();

        const overlayContainerElement = spectator.inject(OverlayContainer).getContainerElement();

        await fillParsingStep(spectator.fixture, loader, parsingData, {
          parsingConfigurationService,
          overlayContainerElement,
        });

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

        // click etl logic node
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

    it('should create a etl with dataPrep only', (done) => {
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
        // set parsing
        await MeButtonHarness.click(spectator.fixture, loader, {selector: '.open-button'});
        spectator.fixture.detectChanges();
        await spectator.fixture.whenStable();

        const overlayContainerElement = spectator.inject(OverlayContainer).getContainerElement();

        await fillParsingStep(spectator.fixture, loader, parsingData, {
          parsingConfigurationService,
          overlayContainerElement,
        });

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

        // delete etl logic node
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
        // set parsing
        await MeButtonHarness.click(spectator.fixture, loader, {selector: '.open-button'});
        spectator.fixture.detectChanges();
        await spectator.fixture.whenStable();

        const overlayContainerElement = spectator.inject(OverlayContainer).getContainerElement();

        await fillParsingStep(spectator.fixture, loader, parsingData, {
          parsingConfigurationService,
          overlayContainerElement,
        });

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

        // set resourcesDefinition
        // click checkbox
        await MeCheckBoxHarness.check(spectator.fixture, loader, {
          ancestor: '.data-prep-container .toggle-config',
        });

        // close warning dialog
        await MeButtonHarness.click(spectator.fixture, docLoader, {text: 'Ok'});

        // set ram
        await MeSliderHarness.setValue(
          spectator.fixture,
          loader,
          {ancestor: '.data-prep-container .resources-capacity-controls .ram-control'},
          9,
        );

        await MeSliderHarness.setValue(
          spectator.fixture,
          loader,
          {ancestor: '.data-prep-container .resources-capacity-controls .runtime-control'},
          15,
        );

        // click etl logic node
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
          ancestor: '.probe-logic-container .toggle-config',
        });

        // close warning dialog
        await MeButtonHarness.click(spectator.fixture, docLoader, {text: 'Ok'});

        // set ram
        await MeSliderHarness.setValue(
          spectator.fixture,
          loader,
          {ancestor: '.probe-logic-container .resources-capacity-controls .ram-control'},
          10,
        );

        await MeSliderHarness.setValue(
          spectator.fixture,
          loader,
          {ancestor: '.probe-logic-container .resources-capacity-controls .runtime-control'},
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

      // click data prep node
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
      expect(spectator.component.etlForm.controls.dataPrepForm.controls.version.value).toEqual({
        name: fakeServices[3].version,
        id: fakeServices[3].version,
      });

      expect(spectator.component.etlForm.controls.probeLogicForm.controls.version.value).toEqual({
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

    it('data prep only ETL, change data prep version', async () => {
      spectator.component.etl = getFakeETL(true, {
        services: {
          [fakeServices[1].id]: fakeServices[1],
        },
        parsingConfiguration: fakeETL.parsingConfiguration,
        servicesDag: {
          [fakeServices[1].id]: 'BI',
          root: fakeServices[1].id.toString(),
        },
      });
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.detectChanges();
      // click data prep node
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

      expect(spectator.component.etlForm.controls.dataPrepForm.controls.version.value).toEqual({
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

      // click probe logic node
      nodes[2].nativeElement.click();
      spectator.fixture.detectChanges();

      // set new ram
      await MeSliderHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '.probe-logic-container .resources-capacity-controls .ram-control'},
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
