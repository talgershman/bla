import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {DatePipe, NgClass} from '@angular/common';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {getElementBySelector, MeDateHarness} from '@mobileye/material/src/lib/testing';
import {addDaysToDate, dateNow} from '@mobileye/material/src/lib/utils';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeDateComponent} from './date.component';

describe('MeDateComponent', () => {
  let spectator: Spectator<MeDateComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: MeDateComponent,
    imports: [
      HintIconComponent,
      MatFormFieldModule,
      MatInputModule,
      MatDatepickerModule,
      ReactiveFormsModule,
      MatIconModule,
      DatePipe,
      MatAutocompleteModule,
      MatChipsModule,
      MatButtonModule,
      NgClass,
    ],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    spectator.component.innerController = new FormControl();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('Today button', () => {
    const nowDate = dateNow();
    it('should not render button', async () => {
      spectator.component.min = addDaysToDate(nowDate, 1);
      spectator.component.max = addDaysToDate(nowDate, 3);
      spectator.component.title = '1';
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await MeDateHarness.getCalenderHarness(spectator.fixture, loader, {ancestor: '[title="1"]'});
      const button = getElementBySelector(spectator.fixture, 'button.custom-mdc-button');
      spectator.fixture.detectChanges();

      expect(button).toBeNull();
    });

    it('should render button', async () => {
      spectator.component.min = nowDate;
      spectator.component.max = addDaysToDate(nowDate, 3);
      spectator.component.title = '2';
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await MeDateHarness.getCalenderHarness(spectator.fixture, loader, {ancestor: '[title="2"]'});
      const button = getElementBySelector(spectator.fixture, 'button.custom-mdc-button');

      expect(button).toBeDefined();
    });

    it('click on today - should focus on the current date in the calendar', async () => {
      spectator.component.min = nowDate;
      spectator.component.max = addDaysToDate(nowDate, 60);
      spectator.component.title = '3';
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const calendarHarness = await MeDateHarness.getCalenderHarness(spectator.fixture, loader, {
        ancestor: '[title="3"]',
      });
      const prevMonthText = getElementBySelector(spectator.fixture, '.mat-calendar-period-button')
        .nativeElement.innerText;

      await calendarHarness.next();

      const newMonthText = getElementBySelector(spectator.fixture, '.mat-calendar-period-button')
        .nativeElement.innerText;

      const button = getElementBySelector(spectator.fixture, 'button.custom-mdc-button');
      button.nativeElement.click();

      const newPrevMonthText = getElementBySelector(
        spectator.fixture,
        '.mat-calendar-period-button'
      ).nativeElement.innerText;

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(newPrevMonthText).toBe(prevMonthText);
      expect(newPrevMonthText).not.toBe(newMonthText);
    });
  });
});
