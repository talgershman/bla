import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {QEAggregation} from 'deep-ui/shared/models';

import {AggregationComponent} from './aggregation.component';

describe('AggregationComponent', () => {
  let spectator: Spectator<AggregationComponent>;
  const createComponent = createComponentFactory({
    component: AggregationComponent,
    imports: [MeInputComponent, MeSelectComponent, ReactiveFormsModule, HintIconComponent],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.aggregationForm = new FormGroup({});
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('Load data', () => {
    it('should load rule', () => {
      const fakeAgg: QEAggregation = {
        value: '5',
        operator: 'greater',
        aggregateKey: 'count',
      };
      spectator.component.aggregationConditions = fakeAgg;

      spectator.detectChanges();

      expect(spectator.component.operatorControl.value).toBe('greater');
      expect(spectator.component.aggregateKeyControl.value).toBe('count');
      expect(spectator.component.valueControl.value).toBe('5');
    });
  });
});
