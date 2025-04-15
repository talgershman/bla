import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MePortalSrcDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MePortalService} from '@mobileye/material/src/lib/services/portal';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {SelectMestService} from 'deep-ui/shared/components/src/lib/selection/select-mest/select-mest.service';
import {MestService} from 'deep-ui/shared/core';
import {IfUserTeamDirective} from 'deep-ui/shared/directives/src/lib/if-user-team';
import {of} from 'rxjs';

import {SelectMestComponent} from './select-mest.component';

describe('SelectMestComponent', () => {
  let spectator: Spectator<SelectMestComponent>;
  let mestService: SpyObject<MestService>;

  const createComponent = createComponentFactory({
    component: SelectMestComponent,
    imports: [
      MatButtonModule,
      MatIconModule,
      MeServerSideTableComponent,
      MeTooltipDirective,
      MatFormFieldModule,
      MeInputComponent,
      ReactiveFormsModule,
      FormsModule,
      MatCheckboxModule,
      MeSelectComponent,
      MePortalSrcDirective,
      MatSlideToggle,
      HintIconComponent,
      MatProgressSpinnerModule,
      IfUserTeamDirective,
    ],
    mocks: [MeAzureGraphService, MestService, SelectMestService, MePortalService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    mestService = spectator.inject(MestService);
    mestService.getAgGridMulti.and.returnValue(
      of({
        rowData: [],
        rowCount: 0,
      }),
    );
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
