import {AccountInfo} from '@azure/msal-browser';
import {createAction, props} from '@ngrx/store';

export const setActiveUserFromApp = createAction(
  '[App Component] Set User',
  props<{activeAccount: AccountInfo}>(),
);

export const setActiveUserFromGuard = createAction(
  '[User Guard] Set USer',
  props<{activeAccount: AccountInfo}>(),
);

export const setActiveUserFromAdminSettings = createAction(
  '[Admin Settings] Set USer',
  props<{teams: Array<string>; rawTeams?: Array<string>}>(),
);
