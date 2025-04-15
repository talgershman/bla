import {MeServerSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/server-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {AssetManagerService, PerfectListService} from 'deep-ui/shared/core';
import {getFakePerfectList} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {SelectPerfectListComponent} from './select-perfect-list.component';

const perfectList1 = getFakePerfectList(true, {createdByUsername: 'fakeUser@mobileye.com'});
const perfectList2 = getFakePerfectList(true, {createdByUsername: 'fakeUser@mobileye.com'});
const perfectList3 = getFakePerfectList(true, {
  team: 'bad',
  createdByUsername: 'other@mobileye.com',
});
const fakePerfectLists = [perfectList1, perfectList2, perfectList3];

describe('SelectPerfectListComponent', () => {
  let spectator: Spectator<SelectPerfectListComponent>;
  let perfectListService: SpyObject<PerfectListService>;

  const createComponent = createComponentFactory({
    component: SelectPerfectListComponent,
    imports: [MeServerSideTableComponent],
    mocks: [PerfectListService, AssetManagerService, MeAzureGraphService, MeTooltipDirective],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    perfectListService = spectator.inject(PerfectListService);
    spectator.component.teamFilterState = 'none';
    perfectListService.getMulti.and.returnValue(of(fakePerfectLists));
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
