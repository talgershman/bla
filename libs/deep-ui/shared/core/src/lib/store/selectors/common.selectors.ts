import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {createFeatureSelector, createSelector} from '@ngrx/store';
import _sortBy from 'lodash-es/sortBy';

import {commonFeatureKey, State} from '../reducers/common.reducer';

export const selectCommonState = createFeatureSelector<State>(commonFeatureKey);

export const selectTechnologiesOptions = createSelector(selectCommonState, (state: State) => {
  const options = generateTechnologiesOptions(state.technologies);
  return _sortBy(options, 'value');
});

export const selectIsTechnologiesLoaded = createSelector(
  selectCommonState,
  (state: State) => state.isTechnologiesLoaded
);

const generateTechnologiesOptions = (technologies: Array<string>): Array<MeSelectOption> => {
  const options: MeSelectOption[] = [];
  for (const tech of technologies) {
    options.push({
      id: tech,
      value: tech,
    });
  }
  return options;
};
