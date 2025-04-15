import {AccountInfo} from '@azure/msal-browser';
import {MeUser} from '@mobileye/material/src/lib/common';
import {createReducer} from '@ngrx/store';
import _filter from 'lodash-es/filter';
import _uniq from 'lodash-es/uniq';
import {immerOn} from 'ngrx-immer/store';

import {
  setActiveUserFromAdminSettings,
  setActiveUserFromApp,
  setActiveUserFromGuard,
} from '../actions/user.actions';

export const sessionFeatureKey = '[Session Feature]';

export interface State {
  user: MeUser;
  isAdmin: boolean;
  rawTeams: Array<string>;
  teams: Array<string>;
}

export const initialState: State = {
  user: null,
  isAdmin: false,
  rawTeams: [],
  teams: [],
};

export const reducer = createReducer(
  initialState,
  immerOn(setActiveUserFromApp, setActiveUserFromGuard, (state, action) => {
    let user: MeUser;
    if (action.activeAccount) {
      user = {
        userName: action.activeAccount.username,
        name: action.activeAccount.name,
      };
    }
    state.user = user;
    state.isAdmin = _isAdmin(action.activeAccount);
    state.rawTeams = _getDeepGroups(action.activeAccount);
    state.teams = _getDeepGroupsWithoutExtra(action.activeAccount);
  }),
  immerOn(setActiveUserFromAdminSettings, (state, action) => {
    state.isAdmin = action.teams.includes('deep-admin');
    state.rawTeams = action.rawTeams || action.teams;
    state.teams = action.teams;
  }),
);

const _getAllUserGroups = (account: AccountInfo): string[] => {
  if (!account) {
    return [];
  }
  const idToken: any = account.idTokenClaims as any;
  return idToken?.groups?.map((group) => group.trim()) || [];
};

const _getDeepGroups = (account: AccountInfo): Array<string> => {
  const allGroups = _getAllUserGroups(account);
  const arr = _filter(allGroups, (group: string) => group.toLowerCase().startsWith('deep-')) || [];
  return arr.sort();
};

const _getDeepGroupsWithoutExtra = (account: AccountInfo): Array<string> => {
  const deepGroups = _getDeepGroups(account);
  const result = _uniq(
    deepGroups.map((group) => {
      const arr = group.split('-');
      if (arr.length <= 4) {
        return group;
      }
      arr.splice(3, arr.length);
      return arr.join('-');
    }),
  );
  return result.sort();
};

const _isAdmin = (account: AccountInfo): boolean => {
  const deepGroups = _getDeepGroups(account);
  return _filter(deepGroups, (group: string) => group.toLowerCase() === 'deep-admin').length > 0;
};
