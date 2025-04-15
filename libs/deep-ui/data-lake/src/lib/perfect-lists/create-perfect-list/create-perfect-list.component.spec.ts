import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {AssetManagerService, PerfectListService} from 'deep-ui/shared/core';
import {getFakePerfectList} from 'deep-ui/shared/testing';
import {of, throwError} from 'rxjs';

import {PerfectListFormComponent} from '../../components/forms/perfect-list-form/perfect-list-form.component';
import {CreatePerfectListComponent} from './create-perfect-list.component';

describe('CreatePerfectListComponent', () => {
  let spectator: Spectator<CreatePerfectListComponent>;
  let assetManagerService: SpyObject<AssetManagerService>;
  let perfectListService: SpyObject<PerfectListService>;

  const createComponent = createComponentFactory({
    component: CreatePerfectListComponent,
    mocks: [PerfectListService, AssetManagerService],
    imports: [
      RouterTestingModule,
      PerfectListFormComponent,
      MeBreadcrumbsComponent,
      MatFormFieldModule,
      MatDialogModule,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    assetManagerService = spectator.inject(AssetManagerService);
    perfectListService = spectator.inject(PerfectListService);
    assetManagerService.getTechnologiesOptions.and.returnValue(
      of([
        {id: 'AV', value: 'AV'},
        {id: 'TFL', value: 'TFL'},
      ]),
    );
  });

  it('should create', () => {
    spectator.fixture.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onFromValueChanged', () => {
    it('should show error msg', async () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      perfectListService.create.and.returnValue(
        throwError({
          error: {
            error: 'some-error',
          },
        }),
      );
      const entity = getFakePerfectList(true);
      spectator.detectChanges();

      spectator.component.onFromValueChanged(entity);

      expect(spectator.component.errorMsg).toBe('Oops ! Something went wrong.');
    });

    it('should create and press back', () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      perfectListService.create.and.returnValue(of(null));
      const entity = getFakePerfectList(true);
      spectator.detectChanges();

      spectator.component.onFromValueChanged(entity);

      expect(spectator.component.onBackButtonPressed).toHaveBeenCalled();
    });

    it('should call create with an entity without perfectSearchUrl', async () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      perfectListService.create.and.returnValue(of(null));

      const entity = getFakePerfectList(true, {perfectSearchUrl: ''});
      spectator.detectChanges();

      spectator.component.onFromValueChanged(entity);

      const calledEntity = {...entity};
      delete calledEntity.perfectSearchUrl;

      expect(perfectListService.create).toHaveBeenCalledWith(calledEntity, calledEntity.name, {});
    });
  });
});
