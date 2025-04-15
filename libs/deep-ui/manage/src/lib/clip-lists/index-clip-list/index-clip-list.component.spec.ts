import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {inject} from '@angular/core/testing';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {ActivatedRoute, Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeAreYouSureDialogComponent} from '@mobileye/material/src/lib/components/dialogs/are-you-sure';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeButtonHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {AgEntityListComponent} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {ClipListTableComponent} from 'deep-ui/shared/components/src/lib/tables/clip-list-table';
import {ClipListService} from 'deep-ui/shared/core';
import {fakeTechnology, getFakeClipList} from 'deep-ui/shared/testing';
import {of, timer} from 'rxjs';
import {switchMap} from 'rxjs/operators';

import {IndexClipListComponent} from './index-clip-list.component';

const clipList1 = getFakeClipList(true);
const clipList2 = getFakeClipList(true);
const clipList3 = getFakeClipList(true, {team: 'bad'});
const fakeClipLists = [clipList1, clipList2, clipList3];

describe('IndexClipListComponent', () => {
  let spectator: Spectator<IndexClipListComponent>;
  let clipListService: SpyObject<ClipListService>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IndexClipListComponent,
    imports: [
      RouterTestingModule,
      MeBreadcrumbsComponent,
      MeAreYouSureDialogComponent,
      AgEntityListComponent,
      MatIconModule,
      MatDialogModule,
      MatIconTestingModule,
      ClipListTableComponent,
    ],
    mocks: [MeAzureGraphService, ClipListService],
    detectChanges: false,
    componentProviders: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: {
              viewData: {
                technologiesOptions: fakeTechnology,
              },
            },
          },
        },
      },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    clipListService = spectator.inject(ClipListService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    clipListService.getAgGridMulti.and.returnValue(
      of({
        rowData: fakeClipLists,
        rowCount: fakeClipLists.length,
      }),
    );
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onActionButtonClicked', () => {
    it('should handle create', inject([Router], (router: Router) => {
      spyOn(router, 'navigate');
      spectator.detectChanges();

      spectator.component.onActionButtonClicked('create');

      expect(router.navigate).toHaveBeenCalledWith(['./create'], jasmine.objectContaining({}));
    }));
  });

  describe('onSelectionChange', () => {
    it('should set selected clip list', () => {
      spectator.detectChanges();

      spectator.component.onSelectionChanged([clipList2]);

      expect(spectator.component.selected).toEqual([clipList2]);
    });
  });

  describe('create clip list', () => {
    it('should click button and go to route', async () => {
      spyOn(spectator.component, 'onActionButtonClicked');
      await spectator.fixture.whenStable();
      spectator.detectChanges();

      // click create button
      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.create-button'});

      expect(spectator.component.onActionButtonClicked).toHaveBeenCalledWith('create');
    });
  });

  describe('onDelete', () => {
    it('should call actions', () => {
      spectator.component['gridApi'] = {setGridOption: () => {}} as any;
      clipListService.delete.and.returnValue(timer(1000).pipe(switchMap((_) => of(clipList1))));
      spectator.detectChanges();
      spectator.component.selected = [clipList1];

      spectator.component.onDelete();

      expect(clipListService.delete).toHaveBeenCalledWith(clipList1.id);
    });
  });
});
