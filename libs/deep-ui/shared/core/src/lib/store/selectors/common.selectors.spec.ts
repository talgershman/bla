import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';

import {State} from '../reducers/common.reducer';
import * as CommonSelectors from './common.selectors';

describe('Job Selectors', () => {
  it('empty', () => {
    expect(true).toBeTrue();
  });

  describe('selectTechnologiesOptions', () => {
    it('should get options', () => {
      const initialState: State = {
        isTechnologiesLoaded: true,
        technologies: ['AV', 'TFL'],
      };
      const expectObj: Array<MeSelectOption> = [
        {
          id: 'AV',
          value: 'AV',
        },
        {
          id: 'TFL',
          value: 'TFL',
        },
      ];

      const result = CommonSelectors.selectTechnologiesOptions.projector(initialState);

      expect(result).toEqual(expectObj);
    });
  });

  describe('selectIsTechnologiesLoaded', () => {
    it('should show false', () => {
      const initialState: State = {isTechnologiesLoaded: false, technologies: []};

      const result = CommonSelectors.selectIsTechnologiesLoaded.projector(initialState);

      expect(result).toBeFalse();
    });
  });
});
