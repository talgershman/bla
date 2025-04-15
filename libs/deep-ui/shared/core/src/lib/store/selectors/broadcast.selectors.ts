import {createFeatureSelector, createSelector} from '@ngrx/store';

import {broadcastFeatureKey, State} from '../reducers/broadcast.reducer';

export const selectBroadcastState = createFeatureSelector<State>(broadcastFeatureKey);

export const selectIsNewUIVersion = createSelector(
  selectBroadcastState,
  (state: State) => state?.isNewUIVersion
);
