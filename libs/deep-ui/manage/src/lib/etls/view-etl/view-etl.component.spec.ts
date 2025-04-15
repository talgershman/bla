import {ActivatedRoute} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {EtlPerfectTransformFormComponent} from '../../forms/etl-forms/etl-perfect-transform-form/etl-perfect-transform-form.component';
import {EtlValidationFormComponent} from '../../forms/etl-forms/etl-validation-form/etl-validation-form.component';
import {ViewEtlComponent} from './view-etl.component';
import {fakeETL, fakeParsingConfigs, fakeServices} from './view-etl.resolver.spec';

describe('ViewEtlComponent', () => {
  let spectator: Spectator<ViewEtlComponent>;

  const createComponent = createComponentFactory({
    component: ViewEtlComponent,
    imports: [
      RouterTestingModule,
      MeBreadcrumbsComponent,
      EtlValidationFormComponent,
      MeErrorFeedbackComponent,
      MeSelectComponent,
      EtlPerfectTransformFormComponent,
    ],
    detectChanges: false,
    componentProviders: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: {
              viewData: {
                services: fakeServices,
                etl: fakeETL,
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
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
