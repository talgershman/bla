import {FormControl, NgControl, ReactiveFormsModule} from '@angular/forms';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {MeDateComponent} from '@mobileye/material/src/lib/components/form/date';
import {addDaysToDate, dateNow, getFutureDateFromNow} from '@mobileye/material/src/lib/utils';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {DataRetentionKnownKeysEnum} from 'deep-ui/shared/models';

import {ExpiredAtDataRetentionControlComponent} from './expired-at-data-retention-control.component';

describe('ExpiredAtDataRetentionControlComponent', () => {
  let spectator: Spectator<ExpiredAtDataRetentionControlComponent>;

  const createComponent = createComponentFactory({
    component: ExpiredAtDataRetentionControlComponent,
    imports: [MeDateComponent, ReactiveFormsModule],
    componentProviders: [{provide: NgControl, useValue: {control: new FormControl<any>(null)}}],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    spectator.component.config = {
      [DataRetentionKnownKeysEnum.DATASETS]: {
        max: -1,
        default: 10,
        tooltip: 'bla',
        label: 'Data set',
        job_types: [],
        allowPermanent: false,
      },
    };
    spectator.component.dataRetention = {
      [DataRetentionKnownKeysEnum.DATASETS]: '2022-09-30',
    };
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component.formKeys).toEqual([DataRetentionKnownKeysEnum.DATASETS]);
    expect(spectator.component).toBeTruthy();
  });

  describe('onDateChanged', () => {
    it('today warning msg', () => {
      spectator.detectChanges();

      spectator.component.onDateChanged(
        addDaysToDate(dateNow(), 1),
        DataRetentionKnownKeysEnum.DATASETS,
      );

      expect(
        spectator.component.form.get(DataRetentionKnownKeysEnum.DATASETS).get('warnMsg').value,
      ).toBe('1 day remaining');
    });

    it('not today warning msg', () => {
      spectator.detectChanges();

      spectator.component.onDateChanged(
        getFutureDateFromNow(2, 'days'),
        DataRetentionKnownKeysEnum.DATASETS,
      );

      expect(
        spectator.component.form.get(DataRetentionKnownKeysEnum.DATASETS).get('warnMsg').value,
      ).toBe('2 days remaining');
    });
  });

  describe('onPermanentChanged', () => {
    it('checked - date control disabled', () => {
      spectator.detectChanges();

      spectator.component.onPermanentChanged(
        {checked: true} as MatCheckboxChange,
        DataRetentionKnownKeysEnum.DATASETS,
      );

      expect(
        spectator.component.form.get(DataRetentionKnownKeysEnum.DATASETS).get('date').enabled,
      ).toBeFalse();
    });

    it('unchecked - date control enabled', () => {
      spectator.detectChanges();

      spectator.component.onPermanentChanged(
        {checked: false} as MatCheckboxChange,
        DataRetentionKnownKeysEnum.DATASETS,
      );

      expect(
        spectator.component.form.get(DataRetentionKnownKeysEnum.DATASETS).get('date').enabled,
      ).toBeTrue();
    });
  });
});
