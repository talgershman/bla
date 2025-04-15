import {NgOptimizedImage} from '@angular/common';
import {RouterTestingModule} from '@angular/router/testing';
import {MeHeaderComponent} from '@mobileye/material/src/lib/components/header';
import {MeSidenavComponent} from '@mobileye/material/src/lib/components/sidenav';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeBroadcastService} from '@mobileye/material/src/lib/services/broadcast';
import {MeRouteService} from '@mobileye/material/src/lib/services/route';
import {MeThemeManager} from '@mobileye/material/src/lib/services/theme-manager';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {of} from 'rxjs';

import {MeSidenavService, SideNavState} from '../sidenav/sidenav.service';
import {MeLayoutComponent} from './layout.component';

describe('MeLayoutComponent', () => {
  let spectator: Spectator<MeLayoutComponent>;
  let sidenavService: SpyObject<MeSidenavService>;

  const createComponent = createComponentFactory({
    component: MeLayoutComponent,
    imports: [MeSidenavComponent, MeHeaderComponent, RouterTestingModule, NgOptimizedImage],
    componentMocks: [MeSidenavComponent, MeHeaderComponent],
    mocks: [
      MeSidenavService,
      MeRouteService,
      MeBroadcastService,
      MeAzureGraphService,
      MeThemeManager,
    ],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    sidenavService = spectator.inject(MeSidenavService);
    sidenavService.getSideNavExpandObs.and.returnValue(of(SideNavState.Collapsed));
    spectator.component.menuItems = [];
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
