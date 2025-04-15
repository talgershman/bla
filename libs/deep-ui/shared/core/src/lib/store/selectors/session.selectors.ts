import {createFeatureSelector, createSelector} from '@ngrx/store';

import {sessionFeatureKey, State} from '../reducers/session.reducer';

export const selectSessionState = createFeatureSelector<State>(sessionFeatureKey);

export const isUserAdminSelector = createSelector(
  selectSessionState,
  (state: State) => state.isAdmin
);

export const userTeamsSelector = createSelector(selectSessionState, (state: State) => state.teams);

export const userSelector = createSelector(selectSessionState, (state: State) => state.user);
