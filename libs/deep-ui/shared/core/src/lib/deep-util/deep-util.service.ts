import {inject, Injectable} from '@angular/core';
import {MeUser} from '@mobileye/material/src/lib/common';
import {TeamFilterStateTypes} from '@mobileye/material/src/lib/components/ag-table/entities';
import {Store} from '@ngrx/store';
import _filter from 'lodash-es/filter';

import {AppState} from '../store/reducers';
import {State} from '../store/reducers/session.reducer';
import {selectSessionState} from '../store/selectors/session.selectors';

@Injectable({
  providedIn: 'root',
})
export class DeepUtilService {
  private store = inject<Store<AppState>>(Store);

  private currentUser: MeUser;

  private currentUserTeams: Array<string> = [];

  private currentUserTeamsWithExtra: Array<string> = [];

  private isAdmin: boolean;

  constructor() {
    this._initUserListeners();
  }

  isAdminUser(): boolean {
    return this.isAdmin;
  }

  getCurrentUser(): MeUser {
    return this.currentUser;
  }

  getCurrentUserTeams(): Array<string> {
    return this.currentUserTeams;
  }

  isCurrentUserData(entity: any, createByProp: string): boolean {
    return entity[createByProp] === this.currentUser.userName;
  }

  isIncludedInDeepGroupsOrIsAdmin(entity: any, teamProp: string): boolean {
    if (this.isAdmin) {
      return true;
    }
    return this.isIncludedInDeepGroups(entity, teamProp);
  }

  isIncludedInDeepGroups(entity: any, teamProp: string): boolean {
    const teams = this.getDeepTeamsWithoutExtra();
    let found = false;
    for (const team of teams) {
      if (
        entity[teamProp] &&
        (entity[teamProp] === '-' ||
          entity[teamProp].toLowerCase().indexOf(team.toLowerCase()) !== -1)
      ) {
        found = true;
        break;
      }
    }
    return found;
  }

  filterByDeepGroups(entities: Array<any>, teamProp: string): Array<any> {
    return _filter(entities, (entity: any) => {
      return this.isIncludedInDeepGroups(entity, teamProp);
    });
  }

  filterByCurrentUserData(entities: any[], createByProp: string): Array<any> {
    return _filter(entities, (entity: any) => {
      return this.isCurrentUserData(entity, createByProp);
    });
  }

  getTeamFilterInitState(): TeamFilterStateTypes {
    if (this.isAdmin) {
      return 'none';
    }
    return 'my_teams';
  }

  getArraySortedByDeepTeams(arr: Array<any>, secondSortKey = 'name'): Array<any> {
    if (!arr) {
      return [];
    }
    const teams = this.getDeepTeamsWithoutExtra();
    return arr.sort((first: any, second: any): any => {
      if (
        this._isItemContainsUserDeepGroup(first, teams) &&
        this._isItemContainsUserDeepGroup(second, teams)
      ) {
        return first[secondSortKey].toLowerCase() < second[secondSortKey].toLowerCase() ? -1 : 1;
      }
      if (this._isItemContainsUserDeepGroup(first, teams)) {
        return -1;
      }
      return 1;
    });
  }

  getDeepTeamsWithoutExtra(): Array<string> {
    return this.currentUserTeamsWithExtra;
  }

  private _initUserListeners(): void {
    this.store.select(selectSessionState).subscribe((state: State) => {
      this.currentUser = state?.user;
      this.currentUserTeams = state?.rawTeams;
      this.currentUserTeamsWithExtra = state?.teams;
      this.isAdmin = state?.isAdmin;
    });
  }

  private _isItemContainsUserDeepGroup(item: any, deepGroups: string[]): boolean {
    let found = false;
    for (const group of deepGroups) {
      //old key value
      if (item.group && item.group.toLowerCase().indexOf(group.toLowerCase()) !== -1) {
        found = true;
        break;
        //new key value
      } else if (item.team && item.team.toLowerCase().indexOf(group.toLowerCase()) !== -1) {
        found = true;
        break;
      }
    }
    return found;
  }
}
