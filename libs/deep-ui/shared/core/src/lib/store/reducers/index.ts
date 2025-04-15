import {ActionReducerMap, MetaReducer} from '@ngrx/store';
import {environment} from 'deep-ui/shared/environments';

import * as BroadcastReducers from './broadcast.reducer';
import * as CommonReducers from './common.reducer';
import * as JobReducers from './job.reducer';
import * as SessionReducers from './session.reducer';

export interface AppState {
  [SessionReducers.sessionFeatureKey]: SessionReducers.State;
  [CommonReducers.commonFeatureKey]: CommonReducers.State;
  [JobReducers.jobFeatureKey]: JobReducers.State;
  [BroadcastReducers.broadcastFeatureKey]: BroadcastReducers.State;
}

export const reducers: ActionReducerMap<AppState> = {
  [SessionReducers.sessionFeatureKey]: SessionReducers.reducer,
  [CommonReducers.commonFeatureKey]: CommonReducers.reducer,
  [JobReducers.jobFeatureKey]: JobReducers.reducer,
  [BroadcastReducers.broadcastFeatureKey]: BroadcastReducers.reducer,
};

export const metaReducers: MetaReducer<AppState>[] = !environment.isProduction ? [] : [];
