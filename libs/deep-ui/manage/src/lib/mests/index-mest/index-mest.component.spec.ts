import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {inject} from '@angular/core/testing';
import {MatButtonHarness} from '@angular/material/button/testing';
import {MatDialogModule} from '@angular/material/dialog';
import {MatMenuModule} from '@angular/material/menu';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeAgActionsCellComponent} from '@mobileye/material/src/lib/components/ag-table/ag-actions-cell';
import {MeAgCustomHeaderComponent} from '@mobileye/material/src/lib/components/ag-table/ag-custom-header';
import {MeAgTemplateRendererComponent} from '@mobileye/material/src/lib/components/ag-table/ag-template-renderer';
import {MeAgMultiChipsFilterComponent} from '@mobileye/material/src/lib/components/ag-table/filters/ag-multi-chips-filter';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeAgTableHarness, MeButtonHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {AgEntityListComponent} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {MestTableComponent} from 'deep-ui/shared/components/src/lib/tables/mest-table';
import {DeepUtilService, MestService} from 'deep-ui/shared/core';
import {getFakeMEST} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {IndexMestComponent} from './index-mest.component';

export const fakeMests = {
  mests: [
    {
      id: 32,
      nickname: 'mest1',
      group: 'deep-fpa-objects',
      executables: ['/executables/eyeq4/release/GV_3FOV', '/executables/GV_3FOV'],
      brainLibs: [],
      params: [{key: 'Application=IPB', value: '-sIPBconf=/mobileye/OB:'}],
      args: '',
      createdByUsername: 'other',
      createdBy: 'moshe 1',
      createdAt: '2021-03-29T12:05:09.651143+03:00',
      modifiedAt: '2021-03-29T12:05:09.647530+03:00',
    },
    {
      id: 33,
      nickname: 'mest2',
      group: 'deep-fpa-objects',
      executables: ['/executables/eyeq4/release/GV_3FOV', '/executables/GV_3FOV'],
      brainLibs: [],
      params: [{key: 'Application=IPB', value: '-sIPBconf=/mobileye/OB:'}],
      args: '',
      createdByUsername: 'fakeUser@mobileye.com',
      createdBy: 'moshe 2',
      createdAt: '2021-03-29T12:05:09.651143+03:00',
      modifiedAt: '2021-03-29T12:05:09.647530+03:00',
    },
    {
      id: 34,
      nickname: 'mest3',
      group: 'deep-bad-team',
      executables: ['/executables/eyeq4/release/GV_3FOV', '/executables/GV_3FOV'],
      brainLibs: [],
      params: [{key: 'Application=IPB', value: '-sIPBconf=/mobileye/OB:'}],
      args: '',
      createdByUsername: 'fakeUser@mobileye.com',
      createdBy: 'moshe 2',
      createdAt: '2021-03-29T12:05:09.651143+03:00',
      modifiedAt: '2021-03-29T12:05:09.647530+03:00',
    },
  ],
};

describe('IndexMestComponent', () => {
  let spectator: Spectator<IndexMestComponent>;
  let mestService: SpyObject<MestService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IndexMestComponent,
    imports: [
      RouterTestingModule,
      BrowserAnimationsModule,
      MatDialogModule,
      MeBreadcrumbsComponent,
      AgEntityListComponent,
      MestTableComponent,
      MeAgCustomHeaderComponent,
      MeAgMultiChipsFilterComponent,
      MeAgTemplateRendererComponent,
      MeAgActionsCellComponent,
      MatMenuModule,
    ],
    providers: [DeepUtilService],
    mocks: [MestService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    mestService = spectator.inject(MestService);
    mestService.getAgGridMulti.and.returnValue(
      of({
        rowData: fakeMests.mests,
        rowCount: fakeMests.mests.length,
      }),
    );
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
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

    it('should handle edit', inject([Router], (router: Router) => {
      spyOn(router, 'navigate');
      spectator.detectChanges();
      spectator.component.selected = [fakeMests.mests[0] as any];

      spectator.component.onActionButtonClicked('edit');

      expect(router.navigate).toHaveBeenCalledWith(
        ['./edit', spectator.component.selected[0].id],
        jasmine.objectContaining({}),
      );
    }));
  });

  describe('onSelectionChange', () => {
    it('should set selected mest', () => {
      const fakeMest = [getFakeMEST(true)];
      spectator.detectChanges();

      spectator.component.onSelectionChanged(fakeMest);

      expect(spectator.component.selected).toBe(fakeMest);
    });
  });

  describe('create mest', () => {
    it('should click button and go to route', async () => {
      spyOn(spectator.component, 'onActionButtonClicked');
      spectator.detectChanges();

      // click create button
      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.create-button'});

      expect(spectator.component.onActionButtonClicked).toHaveBeenCalledWith('create');
    });
  });

  describe('edit mest', () => {
    it('no mest selected, button should be disabled', async () => {
      spectator.detectChanges();

      // check edit button state
      const isDisabled = await MeButtonHarness.isDisabled(spectator.fixture, loader, {
        selector: '.edit-button',
      });

      expect(isDisabled).toBeTrue();
    });

    it('mest selected, should navigate to route', async () => {
      spyOn(spectator.component, 'onActionButtonClicked');
      spectator.detectChanges();

      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      await MeAgTableHarness.clickRow(spectator.fixture, 0);

      // click edit button
      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.edit-button'});

      expect(spectator.component.onActionButtonClicked).toHaveBeenCalledWith('edit');
    });
  });

  describe('delete mest', () => {
    it('no mest selected, button should be disabled', async () => {
      spectator.detectChanges();

      // check delete button state
      const isDisabled = await MeButtonHarness.isDisabled(spectator.fixture, loader, {
        selector: '.delete-button',
      });

      expect(isDisabled).toBeTrue();
    });

    it('mest selected, should show popup & delete record & refresh table', async () => {
      spyOn(spectator.component, 'triggerRefresh');
      mestService.delete.and.returnValue(of(true));
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
