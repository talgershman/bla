import {MatButtonModule} from '@angular/material/button';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {ClipListService} from 'deep-ui/shared/core';
import {of} from 'rxjs';

import {SelectClipListComponent} from './select-clip-list.component';

describe('SelectClipListComponent', () => {
  let spectator: Spectator<SelectClipListComponent>;
  let clipListService: SpyObject<ClipListService>;

  const createComponent = createComponentFactory({
    component: SelectClipListComponent,
    imports: [
      MatButtonModule,
      MatIconModule,
      MatIconTestingModule,
      MatDatepickerModule,
      MeTooltipDirective,
      MeServerSideTableComponent,
    ],
    mocks: [MeAzureGraphService, ClipListService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    clipListService = spectator.inject(ClipListService);
    clipListService.getMulti.andReturn(of([]));
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
