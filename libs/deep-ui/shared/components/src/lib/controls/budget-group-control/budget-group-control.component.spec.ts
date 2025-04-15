import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {AsyncPipe} from '@angular/common';
import {FormControl, NgControl, ReactiveFormsModule} from '@angular/forms';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeSelectHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {BudgetGroupControl} from 'deep-ui/shared/components/src/lib/controls/budget-group-control/budget-group-control.component';
import {DeepUtilService} from 'deep-ui/shared/core';
import {of} from 'rxjs';

import {BudgetGroupService} from './budget-group.service';

describe('BudgetGroupControl', () => {
  let spectator: Spectator<BudgetGroupControl>;
  let deepUtilService: SpyObject<DeepUtilService>;
  let budgetGroupService: SpyObject<BudgetGroupService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: BudgetGroupControl,
    imports: [
      ReactiveFormsModule,
      MeSelectComponent,
      HintIconComponent,
      MatError,
      MatIcon,
      MatFormField,
      MatLabel,
      AsyncPipe,
      MatProgressSpinner,
    ],
    componentProviders: [{provide: NgControl, useValue: {control: new FormControl()}}],
    mocks: [BudgetGroupService, DeepUtilService],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    deepUtilService = spectator.inject(DeepUtilService);
    budgetGroupService = spectator.inject(BudgetGroupService);
    deepUtilService.getCurrentUser.andReturn({userName: 'userTest@mobieye.com'});
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
  });

  describe('Valid flow -', () => {
    it('should show multi options, no default selection', async () => {
      budgetGroupService.getBudgetGroups.and.returnValue(
        of({
          groups: [
            {
              id: 'option-1',
              value: 'option-1',
              tooltip: '',
              isDisabled: false,
            },
            {
              id: 'option-2',
              value: 'option-2',
              tooltip: '',
              isDisabled: false,
            },
          ],
          isValid: true,
          error: '',
        }),
      );

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: ''},
        'option-2',
      );

      expect(spectator.component.controller.value).toBe('option-2');
    });

    it('single option -  should set default control value', async () => {
      budgetGroupService.getBudgetGroups.and.returnValue(
        of({
          groups: [
            {
              id: 'option-1',
              value: 'option-1',
              tooltip: '',
              isDisabled: false,
            },
          ],
          isValid: true,
          error: '',
        }),
      );

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.controller.value).toBe('option-1');
    });
  });

  describe('Invalid flow -', () => {
    it('all options are disabled - control invalid', async () => {
      budgetGroupService.getBudgetGroups.and.returnValue(
        of({
          groups: [
            {
              id: 'option-1',
              value: 'option-1',
              tooltip: 'some-error-1',
              isDisabled: true,
            },
            {
              id: 'option-2',
              value: 'option-2',
              tooltip: 'some-error-2',
              isDisabled: true,
            },
          ],
          isValid: true,
          error: '',
        }),
      );

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.isAllOptionsDisabled).toBeTruthy();
    });

    it('user not found - control invalid', async () => {
      budgetGroupService.getBudgetGroups.and.returnValue(
        of({
          groups: [],
          isValid: false,
          error: 'user test not found',
        }),
      );

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.controller.value).toBe('');
    });
  });
});
