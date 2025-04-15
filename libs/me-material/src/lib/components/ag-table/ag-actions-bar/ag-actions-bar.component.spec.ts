import {ChangeDetectorRef} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatMenuModule} from '@angular/material/menu';
import {MeAgTableRefreshButtonComponent} from '@mobileye/material/src/lib/components/ag-table/ag-table-refresh-button';
import {MeAgTableTeamFilterComponent} from '@mobileye/material/src/lib/components/ag-table/ag-table-team-filter';
import {MeAgTableApiService} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeSearchInput} from '@mobileye/material/src/lib/components/search-input';
import {MePortalTargetDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MePortalService} from '@mobileye/material/src/lib/services/portal';
import {createComponentFactory, Spectator} from '@ngneat/spectator';

import {MeAgTableActionsBarComponent} from './ag-actions-bar.component';

describe('MeAgTableActionsBarComponent', () => {
  let spectator: Spectator<MeAgTableActionsBarComponent<any>>;

  const createComponent = createComponentFactory({
    component: MeAgTableActionsBarComponent,
    imports: [
      MatChipsModule,
      MatIconModule,
      MatIconTestingModule,
      MatButtonModule,
      MatMenuModule,
      ReactiveFormsModule,
      MeTooltipDirective,
      MePortalTargetDirective,
      MeAgTableRefreshButtonComponent,
      MeAgTableTeamFilterComponent,
      MeSearchInput,
    ],
    providers: [MeAgTableApiService, ChangeDetectorRef, MePortalService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.searchPlaceHolder = 'search name';
    spectator.component.teamFilterState = 'none';
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
