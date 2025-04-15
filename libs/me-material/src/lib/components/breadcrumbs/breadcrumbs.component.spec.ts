import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {RouterLink} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MePortalTargetDirective} from '@mobileye/material/src/lib/directives/portal';
import {MePortalService} from '@mobileye/material/src/lib/services/portal';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeBreadcrumbsComponent} from './breadcrumbs.component';

describe('MeBreadcrumbsComponent', () => {
  let spectator: Spectator<MeBreadcrumbsComponent>;

  const createComponent = createComponentFactory({
    component: MeBreadcrumbsComponent,
    imports: [
      RouterLink,
      MatIconModule,
      MatButtonModule,
      MePortalTargetDirective,
      RouterTestingModule,
    ],
    detectChanges: false,
    providers: [MePortalService],
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
