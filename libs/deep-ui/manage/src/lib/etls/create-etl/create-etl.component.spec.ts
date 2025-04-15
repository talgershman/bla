import {ActivatedRoute} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {EtlService} from 'deep-ui/shared/core';
import {getFakeETL} from 'deep-ui/shared/testing';
import {of, throwError} from 'rxjs';

import {EtlPerfectTransformFormComponent} from '../../forms/etl-forms/etl-perfect-transform-form/etl-perfect-transform-form.component';
import {EtlValidationFormComponent} from '../../forms/etl-forms/etl-validation-form/etl-validation-form.component';
import {fakeParsingConfigs, fakeServices} from '../view-etl/view-etl.resolver.spec';
import {CreateEtlComponent} from './create-etl.component';

describe('CreateEtlComponent', () => {
  let spectator: Spectator<CreateEtlComponent>;
  let etlService: SpyObject<EtlService>;

  const createComponent = createComponentFactory({
    component: CreateEtlComponent,
    imports: [
      RouterTestingModule,
      MeBreadcrumbsComponent,
      EtlValidationFormComponent,
      EtlPerfectTransformFormComponent,
      MeErrorFeedbackComponent,
      MeSelectComponent,
      MeErrorFeedbackComponent,
    ],
    mocks: [EtlService, EtlService],
    detectChanges: false,
    componentProviders: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: {
              viewData: {
                services: fakeServices,
                parsingConfigs: fakeParsingConfigs,
              },
            },
          },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    etlService = spectator.inject(EtlService);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onEtlFormChanged', () => {
    it('should show error msg', async () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      etlService.create.and.returnValue(
        throwError({
          error: {
            error: 'some-error',
          },
        }),
      );
      const etl = getFakeETL(true);
      spectator.detectChanges();

      spectator.component.onEtlFormChanged({etl});

      expect(spectator.component.errorMsg).toBe('Oops ! Something went wrong.');
    });

    it('should create and press back', () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      etlService.create.and.returnValue(of(null));
      const etl = getFakeETL(true);
      spectator.detectChanges();

      spectator.component.onEtlFormChanged({etl});

      expect(spectator.component.onBackButtonPressed).toHaveBeenCalled();
    });
  });
});
