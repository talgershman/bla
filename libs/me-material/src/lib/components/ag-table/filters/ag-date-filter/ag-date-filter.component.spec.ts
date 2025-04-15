import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MeDateComponent} from '@mobileye/material/src/lib/components/form/date';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeAgDateFilterComponent} from './ag-date-filter.component';

describe('MeAgDateFilterComponent', () => {
  let spectator: Spectator<MeAgDateFilterComponent>;
  const createComponent = createComponentFactory({
    component: MeAgDateFilterComponent,
    imports: [MatButtonModule, MeDateComponent, ReactiveFormsModule, MatDatepickerModule],
    detectChanges: false,
  });

  const mockFilterParams = {
    colDef: {
      field: 'createdAt',
      filterParams: {
        buttons: ['clear'],
        dateOptions: [
          {
            minDate: new Date(2021, 1, 1),
            maxDate: new Date(2022, 1, 1),
            startAt: new Date(2021, 1, 1),
            title: 'From',
            parameterName: 'dateFrom',
          },
          {
            minDate: new Date(2021, 1, 1),
            maxDate: new Date(2022, 1, 1),
            startAt: new Date(2022, 1, 1),
            title: 'To',
            parameterName: 'dateTo',
          },
        ],
        validations: [],
      },
    },
    filterChangedCallback: () => {},
  };

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.agInit(mockFilterParams as any);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  it('should return true from doesFilterPass when date is within range', () => {
    spectator.detectChanges();
    const mockData = {createdAt: new Date(2021, 6, 15)};
    const mockParams = {data: mockData, colDef: {field: 'createdAt'}};
    spectator.component.form.setValue([new Date(2021, 5, 1), new Date(2021, 7, 1)]);

    expect(spectator.component.doesFilterPass(mockParams as any)).toBeTrue();
  });

  it('should return false from doesFilterPass when date is not within range', () => {
    spectator.detectChanges();
    const mockData = {createdAt: new Date(2021, 10, 15)};
    const mockParams = {data: mockData, colDef: {field: 'createdAt'}};
    spectator.component.form.setValue([new Date(2021, 11, 1), new Date(2022, 0, 1)]);

    expect(spectator.component.doesFilterPass(mockParams as any)).toBeFalse();
  });

  it('should return true from isFilterActive when form is not empty', () => {
    spectator.detectChanges();
    spectator.component.form.setValue([new Date(2021, 5, 1), new Date(2021, 7, 1)]);

    expect(spectator.component.isFilterActive()).toBeTrue();
  });

  it('should return false from isFilterActive when form is empty', () => {
    spectator.detectChanges();

    expect(spectator.component.isFilterActive()).toBeFalse();
  });
});
