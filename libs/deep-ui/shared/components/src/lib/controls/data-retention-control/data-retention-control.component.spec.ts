import {FormControl, NgControl, ReactiveFormsModule} from '@angular/forms';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {MeDateComponent} from '@mobileye/material/src/lib/components/form/date';
import {addDaysToDate, dateNow, getFutureDateFromNow} from '@mobileye/material/src/lib/utils';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {DataRetentionKnownKeysEnum} from 'deep-ui/shared/models';

import {DataRetentionControlComponent} from './data-retention-control.component';

describe('DataRetentionControlComponent', () => {
  let spectator: Spectator<DataRetentionControlComponent>;

  const createComponent = createComponentFactory({
    component: DataRetentionControlComponent,
    imports: [MeDateComponent, ReactiveFormsModule],
    componentProviders: [{provide: NgControl, useValue: {control: new FormControl<any>(null)}}],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    spectator.component.config = {
      [DataRetentionKnownKeysEnum.PARSED_DATA]: {
        max: -1,
        default: 10,
        tooltip: 'bla',
        label: 'Parsed Data',
        job_types: [],
        allowPermanent: false,
      },
    };
    spectator.component.dataRetention = {
      [DataRetentionKnownKeysEnum.PARSED_DATA]: '2022-09-30',
    };
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component.formKeys).toEqual([DataRetentionKnownKeysEnum.PARSED_DATA]);
    expect(spectator.component).toBeTruthy();
  });

  describe('onDateChanged', () => {
    it('today warning msg', () => {
      spectator.detectChanges();

      spectator.component.onDateChanged(
        addDaysToDate(dateNow(), 1),
        DataRetentionKnownKeysEnum.PARSED_DATA,
      );

      expect(
        spectator.component.form.get(DataRetentionKnownKeysEnum.PARSED_DATA).get('warnMsg').value,
      ).toBe('1 day remaining');
    });

    it('not today warning msg', () => {
      spectator.detectChanges();

      spectator.component.onDateChanged(
        getFutureDateFromNow(2, 'days'),
        DataRetentionKnownKeysEnum.PARSED_DATA,
      );

      expect(
        spectator.component.form.get(DataRetentionKnownKeysEnum.PARSED_DATA).get('warnMsg').value,
      ).toBe('2 days remaining');
    });
  });

  describe('onPermanentChanged', () => {
    it('checked - date control disabled', () => {
      spectator.detectChanges();

      spectator.component.onPermanentChanged(
        {checked: true} as MatCheckboxChange,
        DataRetentionKnownKeysEnum.PARSED_DATA,
      );

      expect(
        spectator.component.form.get(DataRetentionKnownKeysEnum.PARSED_DATA).get('date').enabled,
      ).toBeFalse();
    });

    it('unchecked - date control enabled', () => {
      spectator.detectChanges();

      spectator.component.onPermanentChanged(
        {checked: false} as MatCheckboxChange,
        DataRetentionKnownKeysEnum.PARSED_DATA,
      );

      expect(
        spectator.component.form.get(DataRetentionKnownKeysEnum.PARSED_DATA).get('date').enabled,
      ).toBeTrue();
    });
  });
});
