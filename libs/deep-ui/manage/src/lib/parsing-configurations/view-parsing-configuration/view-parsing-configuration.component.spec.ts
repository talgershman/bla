import {ActivatedRoute} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {getFakeParsingConfiguration} from 'deep-ui/shared/testing';

import {ParsingConfigurationFormComponent} from '../../forms/parsing-configuration-form/parsing-configuration-form.component';
import {ViewParsingConfigurationComponent} from './view-parsing-configuration.component';

describe('ViewParsingConfigurationComponent', () => {
  let spectator: Spectator<ViewParsingConfigurationComponent>;
  const createComponent = createComponentFactory({
    component: ViewParsingConfigurationComponent,
    imports: [RouterTestingModule, MeBreadcrumbsComponent, ParsingConfigurationFormComponent],
    mocks: [],
    detectChanges: false,
    componentProviders: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: {
              parsingConfiguration: getFakeParsingConfiguration(true),
            },
          },
        },
      },
    ],
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
