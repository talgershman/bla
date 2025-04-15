import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {ParsingConfigurationService} from 'deep-ui/shared/core';
import {getFakeParsingConfiguration} from 'deep-ui/shared/testing';
import {of, throwError} from 'rxjs';

import {ParsingConfigurationFormComponent} from '../../forms/parsing-configuration-form/parsing-configuration-form.component';
import {CreateParsingConfigurationComponent} from './create-parsing-configuration.component';

describe('CreateParsingConfigurationComponent', () => {
  let parsingConfigurationService: SpyObject<ParsingConfigurationService>;

  let spectator: Spectator<CreateParsingConfigurationComponent>;
  const createComponent = createComponentFactory({
    component: CreateParsingConfigurationComponent,
    imports: [
      RouterTestingModule,
      MeBreadcrumbsComponent,
      ParsingConfigurationFormComponent,
      MeErrorFeedbackComponent,
    ],
    mocks: [ParsingConfigurationService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    parsingConfigurationService = spectator.inject(ParsingConfigurationService);
    parsingConfigurationService.getLeanMulti.and.returnValue(
      of([getFakeParsingConfiguration(true), getFakeParsingConfiguration(true)]),
    );
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onParsingFormChanged', () => {
    it('should show error msg', async () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      parsingConfigurationService.create.and.returnValue(
        throwError({
          error: {
            error: 'some-error',
          },
        }),
      );
      const config = getFakeParsingConfiguration(true);
      spectator.detectChanges();

      spectator.component.onParsingFormChanged(config);

      expect(spectator.component.errorMsg).toBe('Oops ! Something went wrong.');
    });

    it('should create and press back', () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      parsingConfigurationService.create.and.returnValue(of(null));
      const config = getFakeParsingConfiguration(true);
      spectator.detectChanges();

      spectator.component.onParsingFormChanged(config);

      expect(spectator.component.onBackButtonPressed).toHaveBeenCalled();
    });
  });
});
