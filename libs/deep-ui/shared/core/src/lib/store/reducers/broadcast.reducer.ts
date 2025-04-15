import {createReducer} from '@ngrx/store';
import {immerOn} from 'ngrx-immer/store';

import {broadcastEffectsActions} from '../actions/broadcast.actions';

export const broadcastFeatureKey = '[Broadcast Feature]';

export interface State {
  isNewUIVersion: boolean;
}

export const initialState: State = {
  isNewUIVersion: false,
};

export const reducer = createReducer(
  initialState,
  immerOn(broadcastEffectsActions.updateOtherTabs, (state) => {
    state.isNewUIVersion = true;
  })
);
