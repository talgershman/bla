import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {inject} from '@angular/core/testing';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {ActivatedRoute, provideRouter, Router} from '@angular/router';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeAgTableHarness, MeButtonHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {AgEntityListComponent} from 'deep-ui/shared/components/src/lib/ag-entity-list';
import {EtlTableComponent} from 'deep-ui/shared/components/src/lib/tables/etl-table';
import {EtlService} from 'deep-ui/shared/core';
import {ETL} from 'deep-ui/shared/models';
import {getFakeETL} from 'deep-ui/shared/testing';
import {Observable, of, Subscriber} from 'rxjs';

import {IndexEtlComponent} from './index-etl.component';

export const mockEtlsResponse: Array<ETL> = [
  getFakeETL(true, {createdByUsername: 'other'}),
  getFakeETL(true, {name: 'probe1', createdByUsername: 'fakeUser@mobileye.com'}),
  getFakeETL(true, {team: 'bad', name: 'probe1', createdByUsername: 'fakeUser@mobileye.com'}),
];

describe('IndexEtlComponent', () => {
  let spectator: Spectator<IndexEtlComponent>;
  let etlService: SpyObject<EtlService>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IndexEtlComponent,
    imports: [
      MeBreadcrumbsComponent,
      AgEntityListComponent,
      MatDialogModule,
      MatIconModule,
      EtlTableComponent,
    ],
    providers: [
      provideRouter([]), // Empty routes array for testing
    ],
    mocks: [EtlService, MeAzureGraphService],
    detectChanges: false,
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    etlService = spectator.inject(EtlService);
    etlService.getAgGridMulti.and.returnValue(
      of({
        rowData: mockEtlsResponse,
        rowCount: 3,
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
      spectator.detectChanges();
      spectator.component.selected = [mockEtlsResponse[0]];

      spectator.component.onActionButtonClicked('edit');

      expect(router.navigate).toHaveBeenCalledWith(
        ['./edit', spectator.component.selected[0].id],
        jasmine.objectContaining({}),
      );
    }));
  });

  describe('onSelectionChange', () => {
    it('should set selected clipList', () => {
      const fakeETL = getFakeETL(true);
      spectator.detectChanges();

      spectator.component.onSelectionChanged([fakeETL]);

      expect(spectator.component.selected).toEqual([fakeETL]);
    });
  });

  describe('create etl', () => {
    it('should click button and go to route', async () => {
      spyOn(spectator.component, 'onActionButtonClicked');
      spectator.fixture.detectChanges();

      // click create button
      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.create-button'});

      expect(spectator.component.onActionButtonClicked).toHaveBeenCalledWith('create');
    });
  });

  describe('view etl', () => {
    it('no etl selected, button should be disabled', async () => {
      spectator.detectChanges();

      // check view button state
      const isDisabled = await MeButtonHarness.isDisabled(spectator.fixture, loader, {
        selector: '.view-button',
      });

      expect(isDisabled).toBeTrue();
    });

    it('etl selected, should click view', async () => {
      spyOn(spectator.component, 'onActionButtonClicked');
      spectator.detectChanges();

      const dataObservable = new Observable((subscriber: Subscriber<any>) =>
        subscriber.next({
          rowData: [{...mockEtlsResponse[1], id: Math.floor(Math.random() * 1000)}],
          rowCount: 1,
        }),
      );

      etlService.getAgGridMulti.and.returnValue(dataObservable);
      etlService.delete.and.returnValue(of(null));

      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await MeAgTableHarness.clickRowByValue(spectator.fixture, mockEtlsResponse[1].name, 0);

      // click view button
      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.view-button'});

      expect(spectator.component.onActionButtonClicked).toHaveBeenCalled();
    });
  });

  describe('new revision', () => {
    it('no etl selected, button should be disabled', async () => {
      spectator.detectChanges();

      // check new revision button state
      const isDisabled = await MeButtonHarness.isDisabled(spectator.fixture, loader, {
        selector: '.edit-button',
      });

      expect(isDisabled).toBeTrue();
    });

    it('etl selected, should click view', async () => {
      spyOn(spectator.component, 'onActionButtonClicked');
      const dataObservable = new Observable((subscriber: Subscriber<any>) =>
        subscriber.next({
          rowData: [{...mockEtlsResponse[1], id: Math.floor(Math.random() * 1000)}],
          rowCount: 1,
        }),
      );

      etlService.getAgGridMulti.and.returnValue(dataObservable);
      etlService.delete.and.returnValue(of(null));

      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await MeAgTableHarness.clickRowByValue(spectator.fixture, mockEtlsResponse[1].name, 0);

      // click new revision button
      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.edit-button'});

      expect(spectator.component.onActionButtonClicked).toHaveBeenCalled();
    });
  });
});
