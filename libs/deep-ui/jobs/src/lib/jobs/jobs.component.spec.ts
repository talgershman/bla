import {Location} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeChipsGroupButtonsComponent} from '@mobileye/material/src/lib/components/chips-group-buttons';
import {MePortalTargetDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {LazyLoadComponentService} from '@mobileye/material/src/lib/services/lazy-load-component';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {JobsDynamicViewEnum} from 'deep-ui/shared/components/src/lib/common';
import {of} from 'rxjs';

import {JobsComponent} from './jobs.component';

describe('JobsComponent', () => {
  let spectator: Spectator<JobsComponent>;
  const createComponent = createComponentFactory({
    component: JobsComponent,
    imports: [
      MeBreadcrumbsComponent,
      RouterTestingModule,
      MePortalTargetDirective,
      MeChipsGroupButtonsComponent,
    ],
    providers: [
      LazyLoadComponentService,
      {
        provide: ActivatedRoute,
        useValue: {
          queryParams: of({
            view: JobsDynamicViewEnum.ETL,
          }),
        },
      },
    ],
    mocks: [MeAzureGraphService, Router, Location],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
