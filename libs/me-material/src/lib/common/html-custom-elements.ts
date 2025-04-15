import {MatDatepicker} from '@angular/material/datepicker';
import {dateDiff} from '@mobileye/material/src/lib/utils';

export const insertTodayButtonCalendar = (
  picker: MatDatepicker<Date>,
  min: Date,
  max: Date,
  todayDate: Date
): void => {
  if (dateDiff(min, todayDate) <= 0 && dateDiff(max, todayDate) >= 0) {
    const matCalendar = document.getElementsByClassName('mat-calendar')[0] as HTMLElement;
    matCalendar.style.height = '400px';
    const wrapperDiv = document.createElement('div');
    wrapperDiv.classList.add(
      'w-full',
      'absolute',
      'bottom-1',
      'flex',
      'items-center',
      'justify-center',
      'mb-2'
    );
    const button = document.createElement('button');
    wrapperDiv.appendChild(button);
    button.classList.add('custom-mdc-button');
    const text = document.createTextNode('Today');
    button.appendChild(text);
    button.addEventListener('click', () => {
      const calendar = picker['_componentRef'].instance._calendar;
      const dateAdapter = picker['_componentRef'].instance._dateAdapter;
      calendar.activeDate = dateAdapter.today();
      const savedClosed = picker.close;
      picker.close = () => {};
      calendar._dateSelected(calendar.activeDate);
      picker.close = savedClosed;
      calendar['_changeDetectorRef'].detectChanges();
    });
    matCalendar.appendChild(wrapperDiv);
  }
};
