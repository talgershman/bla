import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {inject} from '@angular/core/testing';
import {MatButtonHarness} from '@angular/material/button/testing';
import {MatDialogModule} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeAreYouSureDialogComponent} from '@mobileye/material/src/lib/components/dialogs/are-you-sure';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {MeAgTableHarness, MeButtonHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {AgEntityListComponent} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {PerfectListTableComponent} from 'deep-ui/shared/components/src/lib/tables/perfect-list-table';
import {PerfectListService} from 'deep-ui/shared/core';
import {fakeTechnology, getFakePerfectList} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {IndexPerfectListComponent} from './index-perfect-list.component';

const perfectList1 = getFakePerfectList(true, {createdByUsername: 'fakeUser@mobileye.com'});
const perfectList2 = getFakePerfectList(true, {createdByUsername: 'fakeUser@mobileye.com'});
const perfectList3 = getFakePerfectList(true, {
  team: 'bad',
  createdByUsername: 'other@mobileye.com',
});
const fakePerfectLists = [perfectList1, perfectList2, perfectList3];

describe('IndexPerfectListComponent', () => {
  let spectator: Spectator<IndexPerfectListComponent>;
  let perfectListService: SpyObject<PerfectListService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IndexPerfectListComponent,
    imports: [
      RouterTestingModule,
      MatDialogModule,
      MeBreadcrumbsComponent,
      AgEntityListComponent,
      PerfectListTableComponent,
    ],
    mocks: [PerfectListService, MeAreYouSureDialogComponent, MeUserPreferencesService],
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
    perfectListService = spectator.inject(PerfectListService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    perfectListService.getMulti.and.returnValue(of(fakePerfectLists));
    perfectListService.getAgGridMulti.and.returnValue(
      of({
        rowData: fakePerfectLists,
        rowCount: fakePerfectLists.length,
      }),
    );
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onActionButtonClicked', () => {
    it('should handle create', inject([Router, ActivatedRoute], (router: Router) => {
      spyOn(router, 'navigate');
      spectator.detectChanges();

      spectator.component.onActionButtonClicked('create');

      expect(router.navigate).toHaveBeenCalledWith(['./create'], jasmine.objectContaining({}));
    }));

    it('should handle edit', inject([Router, ActivatedRoute], (router: Router) => {
      spyOn(router, 'navigate');
      spectator.component.selected = [perfectList1];
      spectator.detectChanges();

      spectator.component.onActionButtonClicked('edit');

      expect(router.navigate).toHaveBeenCalledWith(
        ['./edit', spectator.component.selected[0].id],
        jasmine.objectContaining({}),
      );
    }));
  });

  describe('onSelectionChanged', () => {
    it('should set selected perfectList', () => {
      const fakePerfectLists = [getFakePerfectList(true)];
      spectator.detectChanges();

      spectator.component.onSelectionChanged(fakePerfectLists);

      expect(spectator.component.selected).toBe(fakePerfectLists);
    });
  });

  describe('create perfectList', () => {
    it('should click button and go to route', async () => {
      spyOn(spectator.component, 'onActionButtonClicked');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // click create button
      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.create-button'});

      expect(spectator.component.onActionButtonClicked).toHaveBeenCalledWith('create');
    });
  });

  describe('delete perfectList', () => {
    it('no perfectList selected, button should be disabled', async () => {
      spectator.detectChanges();

      // check delete button state
      const isDisabled = await MeButtonHarness.isDisabled(spectator.fixture, loader, {
        selector: '.delete-button',
      });

      expect(isDisabled).toBeTrue();
    });

    it('perfectList selected, should show popup & delete record & refresh table', async () => {
      spyOn(spectator.component, 'triggerRefresh');
      perfectListService.delete.and.returnValue(of(null));
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      await MeAgTableHarness.clickRow(spectator.fixture, 0);
      // click delete button
      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.delete-button'});
      // click delete button in dialog
      const deleteButtonElem = await docLoader.getHarness(
        MatButtonHarness.with({
          selector: '.dialog-panel-overlap .confirm-button',
        }),
      );
      await deleteButtonElem.click();

      expect(spectator.component.triggerRefresh).toHaveBeenCalled();
    });
  });
});
