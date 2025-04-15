import {createReducer} from '@ngrx/store';
import {immerOn} from 'ngrx-immer/store';

import {loadTechnologiesAPIActions} from '../actions/common.actions';

export const commonFeatureKey = '[Common Feature]';

export interface State {
  technologies: Array<string>;
  isTechnologiesLoaded: boolean;
}

export const initialState: State = {
  technologies: [],
  isTechnologiesLoaded: false,
};

export const reducer = createReducer(
  initialState,
  immerOn(loadTechnologiesAPIActions.loadTechnologiesSuccess, (state, action) => {
    state.isTechnologiesLoaded = true;
    state.technologies = action.technologies;
  })
);
