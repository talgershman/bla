import {ReactiveFormsModule} from '@angular/forms';
import {MatRadioModule} from '@angular/material/radio';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {AgDataSourceTablePerfectsStandaloneComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-perfects-standalone';

import {SelectFlowStepComponent} from './select-flow-step.component';

describe('DatasourceDetailsStepComponent', () => {
  let spectator: Spectator<SelectFlowStepComponent>;
  const createComponent = createComponentFactory({
    component: SelectFlowStepComponent,
    imports: [
      ReactiveFormsModule,
      MeInputComponent,
      MeSelectComponent,
      MatRadioModule,
      AgDataSourceTablePerfectsStandaloneComponent,
    ],
    mocks: [],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
