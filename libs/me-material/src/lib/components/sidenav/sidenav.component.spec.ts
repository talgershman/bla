import {MatListModule} from '@angular/material/list';
import {MatSidenavModule} from '@angular/material/sidenav';
import {RouterModule} from '@angular/router';
import {MeLayoutComponent} from '@mobileye/material/src/lib/components/layout';
import {MeRouteService} from '@mobileye/material/src/lib/services/route';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {of} from 'rxjs';

import {HeaderMockComponent} from '../header/header.mock.component';
import {MeSidenavComponent} from './sidenav.component';
import {SidenavMockComponent} from './sidenav.mock.component';
import {MeSidenavService, SideNavState} from './sidenav.service';

describe('MeSidenavComponent', () => {
  let spectator: Spectator<MeSidenavComponent>;
  let sidenavService: SpyObject<MeSidenavService>;

  const createComponent = createComponentFactory({
    component: MeSidenavComponent,
    imports: [
      MatSidenavModule,
      MatListModule,
      RouterModule,
      MeLayoutComponent,
      HeaderMockComponent,
      SidenavMockComponent,
    ],
    mocks: [MeSidenavService, MeRouteService],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    sidenavService = spectator.inject(MeSidenavService);
    sidenavService.getSideNavExpandObs.and.returnValue(of(SideNavState.Collapsed));
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('onMenuClick', () => {
    spectator.detectChanges();
    sidenavService.toggleSideNav.and.returnValue(null);

    spectator.component.onMenuClick();
    const countToggle = sidenavService.toggleSideNav.calls.count();

    expect(countToggle).toEqual(1);
  });
});
