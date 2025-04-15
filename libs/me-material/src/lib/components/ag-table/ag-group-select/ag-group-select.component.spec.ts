import {ReactiveFormsModule} from '@angular/forms';
import {MeGroupByItem} from '@mobileye/material/src/lib/components/ag-table/entities';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {Observable} from 'rxjs';

import {MeAgGroupSelectComponent} from './ag-group-select.component';

describe('MeAgGroupSelectComponent', () => {
  let spectator: Spectator<MeAgGroupSelectComponent>;

  const createComponent = createComponentFactory({
    component: MeAgGroupSelectComponent,
    imports: [MeSelectComponent, ReactiveFormsModule],
    mocks: [MeUserPreferencesService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.resetControl$ = new Observable<boolean>();
    spectator.setInput('groupByOptions', [
      {
        groups: [
          {
            colId: 'col1',
            field: 'col1',
          },
          {
            colId: 'col2',
            field: 'col2',
          },
        ],
        title: 'Col1 + Col2',
      } as MeGroupByItem,
      {
        groups: [
          {
            colId: 'col1',
            field: 'col1',
          },
          {
            colId: 'col3',
            field: 'col3',
          },
        ],
        title: 'Col1 + Col3',
      } as MeGroupByItem,
    ]);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
