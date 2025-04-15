import {animate, state, style, transition, trigger} from '@angular/animations';
import {AsyncPipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSidenavModule} from '@angular/material/sidenav';
import {RouterLink} from '@angular/router';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {MeRouteService} from '@mobileye/material/src/lib/services/route';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {distinctUntilChanged} from 'rxjs/operators';

import {MeSidenavService, SideNavState} from './sidenav.service';
import {MenuItem} from './sidenav-entities';

@UntilDestroy()
@Component({
  selector: 'me-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slide', [
      state(SideNavState.Collapsed, style({width: '5rem'})),
      state(SideNavState.Expanded, style({width: '240px'})),
      transition('void => *', []),
      transition('* => *', [animate('150ms ease-in')]),
    ]),
  ],
  imports: [
    MatSidenavModule,
    MatListModule,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
    AsyncPipe,
    MatIconButton,
  ],
})
export class MeSidenavComponent implements OnInit {
  @Input()
  menuItems: MenuItem[] = [];

  @HostBinding('style.--margin-left')
  marginLeft: string;

  sidenavService = inject(MeSidenavService);
  routeService = inject(MeRouteService);
  loadingService = inject(MeLoadingService);

  selectedMenu: MenuItem;

  currentState: SideNavState;

  SideNavState = SideNavState;

  window = window;

  ngOnInit(): void {
    this.sidenavService
      .getSideNavExpandObs()
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe((nextState: SideNavState) => {
        this.currentState = nextState;
        if (nextState === SideNavState.FixedExpanded) {
          this.marginLeft = '240px';
        } else if (nextState === SideNavState.Collapsed) {
          this.marginLeft = '80px';
        }
      });
  }

  expand(): void {
    if (this.currentState !== SideNavState.FixedExpanded) {
      this.sidenavService.openSideNav();
    }
  }

  collapse(): void {
    if (this.currentState !== SideNavState.FixedExpanded) {
      this.sidenavService.closeSideNav();
    }
  }

  onMenuClick(): void {
    this.sidenavService.toggleSideNav();
  }
}
