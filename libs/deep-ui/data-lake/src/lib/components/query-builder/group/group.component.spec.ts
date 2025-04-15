import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {AutocompleteChipsComponent} from '@mobileye/material/src/lib/components/form/autocomplete-chips';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {EtlJobService} from 'deep-ui/shared/core';
import {QEAggregation} from 'deep-ui/shared/models';
import {getFakeQEAttributes, getFakeQueryJson} from 'deep-ui/shared/testing';

import {AggregationComponent} from '../aggregation/aggregation.component';
import {RuleComponent} from '../rule/rule.component';
import {RuleService} from '../rule/rule.service';
import {GroupComponent} from './group.component';

describe('GroupComponent', () => {
  let spectator: Spectator<GroupComponent>;
  const createComponent = createComponentFactory({
    component: GroupComponent,
    imports: [
      MeAutocompleteComponent,
      MatButtonModule,
      MatIconModule,
      MeInputComponent,
      MeSelectComponent,
      HintIconComponent,
      AutocompleteChipsComponent,
      MeFormControlChipsFieldComponent,
      ReactiveFormsModule,
      RuleComponent,
      AggregationComponent,
    ],
    providers: [RuleService, EtlJobService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.conditionsForm = new FormGroup({});
    spectator.component.attributes = getFakeQEAttributes();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onDeleteRuleClicked', () => {
    it('should remove rule', () => {
      spectator.detectChanges();
      spectator.component.rulesControl.push(new FormControl(false));
      spectator.detectChanges();

      spectator.component.onDeleteRuleClicked(0);

      expect(spectator.component.rulesControl.value.length).toEqual(1);
      expect(spectator.component.rulesControl.value[0]).toBeFalse();
    });

    it('should not remove , only one rule in group', () => {
      spectator.detectChanges();
      spectator.component.rulesControl.push(new FormControl(true));
      spectator.detectChanges();

      spectator.component.onDeleteRuleClicked(0);

      expect(spectator.component.rulesControl.value.length).toEqual(1);
      expect(spectator.component.rulesControl.value[0]).toBeTrue();
    });
  });

  describe('onDeleteGroupClicked', () => {
    it('should remove group', () => {
      spectator.detectChanges();
      spectator.component.rulesControl.push(new FormGroup({}));
      spectator.detectChanges();

      spectator.component.onDeleteGroupClicked(1);

      expect(spectator.component.rulesControl.value.length).toEqual(1);
    });
  });

  describe('addSubGroup', () => {
    it('should add sub group', () => {
      spectator.detectChanges();

      spectator.component.addSubGroup();

      expect(spectator.component.rulesControl.value.length).toEqual(2);
      expect(spectator.component.rulesTypes.length).toEqual(2);
      expect(spectator.component.rulesTypes[1]).toBe('group');
    });
  });

  describe('addEmptyRule', () => {
    it('should add empty rule', () => {
      spectator.detectChanges();

      spectator.component.addEmptyRule();

      expect(spectator.component.rulesControl.value.length).toEqual(2);
      expect(spectator.component.rulesTypes.length).toEqual(2);
      expect(spectator.component.rulesTypes[1]).toBe('rule');
    });
  });

  describe('Load data', () => {
    it('should load rules', () => {
      const fakeQueryJson = getFakeQueryJson('', true);
      const fakeAgg: QEAggregation = {
        value: '5',
        operator: 'greater',
        aggregateKey: 'count',
      };
      spectator.component.queryConditions = fakeQueryJson[0].query.conditions;
      spectator.component.allowAggregation = true;
      spectator.component.aggregationConditions = fakeAgg;
      spectator.component.aggregationForm = new FormGroup({});
      spectator.detectChanges();

      expect(spectator.component.rulesControl.value.length).toEqual(12);
      expect(spectator.component.aggregationForm.value).not.toBeNull();
    });
  });
});
