import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {getElementBySelector, MeInputHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {of} from 'rxjs';

import {ParsingConfigurationFormComponent} from './parsing-configuration-form.component';
import SpyObj = jasmine.SpyObj;
import {MatExpansionModule} from '@angular/material/expansion';
import {MeTourStepComponent} from '@mobileye/material/src/lib/components/tour-step';
import {MeTourService} from '@mobileye/material/src/lib/services/tour';
import {DUPLICATE_SUFFIX_STR} from 'deep-ui/shared/common';
import {parsingConfigurationFormTour} from 'deep-ui/shared/configs';
import {ParsingConfigurationService} from 'deep-ui/shared/core';
import {ParsingConfiguration} from 'deep-ui/shared/models';
import {getFakeParsingConfiguration} from 'deep-ui/shared/testing';

const fakeParsingConfigs: Array<ParsingConfiguration> = [
  getFakeParsingConfiguration(true),
  getFakeParsingConfiguration(true),
];
describe('ParsingConfigurationFormComponent - Integration', () => {
  let spectator: Spectator<ParsingConfigurationFormComponent>;
  let parsingConfigurationService: SpyObj<ParsingConfigurationService>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ParsingConfigurationFormComponent,
    imports: [
      MatButtonModule,
      ReactiveFormsModule,
      MeInputComponent,
      MeTextareaComponent,
      MeSelectComponent,
      MeAutocompleteComponent,
      MeJsonEditorComponent,
      MeTourStepComponent,
      MatExpansionModule,
    ],
    providers: [MeTourService],
    mocks: [ParsingConfigurationService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    parsingConfigurationService = spectator.inject(ParsingConfigurationService);
    parsingConfigurationService.checkConfig.and.returnValue(of({error: ''}));
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    parsingConfigurationService.getLeanMulti.and.returnValue(of(fakeParsingConfigs));
    parsingConfigurationService.getFolders.and.returnValue(
      fakeParsingConfigs.map((parsing) => parsing.folder),
    );
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('create new', () => {
    it('invalid required field - should not create', async () => {
      spectator.component.formMode = 'create';
      parsingConfigurationService.checkDuplicateName.and.returnValue(of({isDuplicate: true}));
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.detectChanges();

      spectator.component.parsingConfigurationForm.controls.folder.setValue({
        id: 'folder1',
        name: 'Folder 1',
      });

      // insert name
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Name"]'},
        'name 1',
      );

      spectator.component.parsingConfigurationForm.controls.config.setValue({
        config: 1,
      } as any);
      spectator.component.parsingConfigurationForm.controls.group.setValue('deep-fpa-objects');
      await spectator.detectChanges();

      const nameError = getElementBySelector(spectator.fixture, 'mat-error');

      expect(nameError.nativeElement.innerText).toBe(' name 1 - already exists.');
    });

    it('duplicate - should add word new to name', async () => {
      spectator.component.formMode = 'create';
      parsingConfigurationService.checkDuplicateName.and.returnValue(of({isDuplicate: true}));
      spyOn(spectator.component.fromValueChanged, 'emit');
      const config = getFakeParsingConfiguration(true);
      spectator.component.parsingConfiguration = config;
      spectator.detectChanges();

      expect(spectator.component.parsingConfigurationForm.controls.name.value).toBe(
        `${config.name}${DUPLICATE_SUFFIX_STR}`,
      );
    });
  });

  describe('Tour', () => {
    beforeEach(() => {
      spectator.component.tourService.createTours(
        [parsingConfigurationFormTour],
        spectator.component.viewContainerRef,
      );
    });

    it('create mode - should restore init form state', (done) => {
      spectator.component.parsingConfiguration = undefined;
      spectator.component.showCreateButton = true;
      spectator.component.formMode = 'create';
      (async function () {
        spectator.detectChanges();
        await spectator.fixture.whenStable();
        spectator.detectChanges();

        // click submit
        await spectator.component.startTour();

        spectator.component.tourService.getOnNextStepClickObs().subscribe((enabled) => {
          if (enabled) {
            spectator.component.tourService.onNextStepClick();
          }
        });

        spectator.component.tourService.getOnTourOpenedObs().subscribe(async () => {
          //check reset fields
          expect(spectator.component.parsingConfigurationForm.controls.name.value).toBe('');
          expect(spectator.component.parsingConfigurationForm.controls.folder.value).toEqual(null);

          expect(spectator.component.parsingConfigurationForm.controls.config.value).toBeNull();
          expect(spectator.component.parsingConfigurationForm.controls.description.value).toBe('');
          expect(spectator.component.parsingConfigurationForm.controls.group.value).toBe('');
        });

        spectator.component.tourService.getOnTourCompletedObj().subscribe(async () => {
          //restore fields on complete
          expect(spectator.component.parsingConfigurationForm.controls.name.value).toBe('');
          expect(spectator.component.parsingConfigurationForm.controls.folder.value).toBeNull();
          expect(spectator.component.parsingConfigurationForm.controls.config.value).toBeNull();
          expect(spectator.component.parsingConfigurationForm.controls.description.value).toBe('');
          expect(spectator.component.parsingConfigurationForm.controls.group.value).toBe('');

          done();
        });
      })();
    });

    it('view mode - should restore all controls state on complete', (done) => {
      const fakeParsingConfig: ParsingConfiguration = getFakeParsingConfiguration(true);
      spectator.component.formMode = 'view';
      spectator.component.parsingConfiguration = fakeParsingConfig;
      (async function () {
        spectator.detectChanges();

        // click submit
        await spectator.component.startTour();

        spectator.component.tourService.getOnNextStepClickObs().subscribe((enabled) => {
          if (enabled) {
            spectator.component.tourService.onNextStepClick();
          }
        });

        spectator.component.tourService.getOnTourOpenedObs().subscribe(() => {
          //check reset fields
          expect(spectator.component.parsingConfigurationForm.controls.name.value).toBe('');
          expect(spectator.component.parsingConfigurationForm.controls.folder.value).toEqual(null);

          expect(spectator.component.parsingConfigurationForm.controls.config.value).toBeNull();
          expect(spectator.component.parsingConfigurationForm.controls.description.value).toBe('');
          expect(spectator.component.parsingConfigurationForm.controls.group.value).toBe('');
        });

        spectator.component.tourService.getOnTourCompletedObj().subscribe(async () => {
          //restore fields on complete
          expect(spectator.component.parsingConfigurationForm.controls.name.value).toEqual(
            fakeParsingConfig.name,
          );

          expect(spectator.component.parsingConfigurationForm.controls.folder.value.id).toEqual(
            fakeParsingConfig.folder,
          );

          expect(spectator.component.parsingConfigurationForm.controls.config.value).toEqual(
            fakeParsingConfig.config,
          );

          expect(spectator.component.parsingConfigurationForm.controls.description.value).toEqual(
            fakeParsingConfig.description,
          );

          expect(spectator.component.parsingConfigurationForm.controls.group.value).toEqual(
            fakeParsingConfig.group,
          );
          done();
        });
      })();
    });
  });
});
