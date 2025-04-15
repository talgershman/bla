import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {of} from 'rxjs';

import {ParsingConfigurationFormComponent} from './parsing-configuration-form.component';
import SpyObj = jasmine.SpyObj;

import {MatExpansionModule} from '@angular/material/expansion';
import {MeTourStepComponent} from '@mobileye/material/src/lib/components/tour-step';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeTourService} from '@mobileye/material/src/lib/services/tour';
import {DUPLICATE_SUFFIX_STR} from 'deep-ui/shared/common';
import {ParsingConfigurationService} from 'deep-ui/shared/core';
import {getFakeParsingConfiguration} from 'deep-ui/shared/testing';

describe('ParsingConfigurationFormComponent', () => {
  let spectator: Spectator<ParsingConfigurationFormComponent>;
  let parsingConfigurationService: SpyObj<ParsingConfigurationService>;

  const createComponent = createComponentFactory({
    component: ParsingConfigurationFormComponent,
    imports: [
      MatButtonModule,
      MeTooltipDirective,
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
    parsingConfigurationService.getLeanMulti.and.returnValue(
      of([getFakeParsingConfiguration(true), getFakeParsingConfiguration(true)]),
    );
  });

  beforeEach(() => {
    spectator = createComponent();
    parsingConfigurationService = spectator.inject(ParsingConfigurationService);
    parsingConfigurationService.getLeanMulti.and.returnValue(
      of([getFakeParsingConfiguration(true), getFakeParsingConfiguration(true)]),
    );
    spectator.component.formMode = 'create';
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onSubmit', () => {
    it('form invalid, should not emit', () => {
      spectator.detectChanges();
      spyOn(spectator.component.fromValueChanged, 'emit');

      spectator.component.onSubmit();

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledTimes(0);
    });
  });

  describe('create from existing', () => {
    it('should copy values', () => {
      const parsingConfig = getFakeParsingConfiguration(true);
      spectator.component.parsingConfiguration = parsingConfig;
      spectator.detectChanges();

      expect(spectator.component.parsingConfigurationForm.controls.name.value).toBe(
        `${parsingConfig.name}${DUPLICATE_SUFFIX_STR}`,
      );
    });
  });
});
