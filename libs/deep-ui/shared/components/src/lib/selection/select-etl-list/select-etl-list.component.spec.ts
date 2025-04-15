import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeAutocompleteComponent} from '@mobileye/material/src/lib/components/form/autocomplete';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {SelectEtlListComponent} from './select-etl-list.component';

describe('SelectEtlListComponent', () => {
  let spectator: Spectator<SelectEtlListComponent>;

  const createComponent = createComponentFactory({
    component: SelectEtlListComponent,
    imports: [MeTooltipDirective, MeServerSideTableComponent, MeAutocompleteComponent],
    mocks: [MeAzureGraphService],
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
