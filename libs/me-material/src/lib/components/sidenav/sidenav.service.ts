import {inject, Injectable} from '@angular/core';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {BehaviorSubject, Observable} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

import {SIDE_NAV_SESSION_KEY} from './sidenav-entities';

export enum SideNavState {
  Expanded = 'expanded',
  Collapsed = 'collapsed',
  FixedExpanded = 'fixedExpanded',
}

@Injectable()
export class MeSidenavService {
  private userPreferencesService = inject(MeUserPreferencesService);
  // eslint-disable-next-line
  private sideNavExpand = new BehaviorSubject<SideNavState>(this._getSideNavStartValue());

  // eslint-disable-next-line
  private sideNavExpand$ = this.sideNavExpand.asObservable().pipe(distinctUntilChanged());

  getSideNavExpandObs(): Observable<SideNavState> {
    return this.sideNavExpand$;
  }

  toggleSideNav(): void {
    const value = this.sideNavExpand.getValue();
    const nextValue =
      value === SideNavState.FixedExpanded ? SideNavState.Expanded : SideNavState.FixedExpanded;
    this.sideNavExpand.next(nextValue);
    this.userPreferencesService.addUserPreferences(SIDE_NAV_SESSION_KEY, nextValue);
  }

  openSideNav(): void {
    this.sideNavExpand.next(SideNavState.Expanded);
  }

  closeSideNav(): void {
    this.sideNavExpand.next(SideNavState.Collapsed);
  }

  isExpanded(): boolean {
    const value = this.sideNavExpand.getValue();
    return value === SideNavState.Expanded || value === SideNavState.FixedExpanded;
  }

  isFixedExpand(): boolean {
    return this.sideNavExpand.getValue() === SideNavState.FixedExpanded;
  }

  isOpened(): boolean {
    return this.sideNavExpand.getValue() === SideNavState.Collapsed;
  }

  private _getSideNavStartValue(): SideNavState {
    const pref = this.userPreferencesService.getUserPreferencesByKey('sideNavState');
    if (pref === null || pref !== SideNavState.FixedExpanded) {
      return SideNavState.Collapsed;
    }
    return pref;
  }
}
