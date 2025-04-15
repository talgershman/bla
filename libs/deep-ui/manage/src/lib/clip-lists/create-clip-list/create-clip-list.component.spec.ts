import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeButtonHarness, MeDialogHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {ClipListService} from 'deep-ui/shared/core';
import {getFakeClipList} from 'deep-ui/shared/testing';
import {of, throwError} from 'rxjs';

import {ClipListFormComponent} from '../../forms/clip-list-form/clip-list-form.component';
import {CreateClipListComponent} from './create-clip-list.component';

describe('CreateClipListComponent', () => {
  let spectator: Spectator<CreateClipListComponent>;
  let clipListService: SpyObject<ClipListService>;

  const createComponent = createComponentFactory({
    component: CreateClipListComponent,
    imports: [
      RouterTestingModule,
      MeBreadcrumbsComponent,
      ClipListFormComponent,
      MatFormFieldModule,
      MatDialogModule,
    ],
    mocks: [ClipListService],
  });

  beforeEach(() => {
    spectator = createComponent();
    clipListService = spectator.inject(ClipListService);
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onClipListFormChanged', () => {
    it('should show error msg', async () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      clipListService.create.and.returnValue(
        throwError({
          error: {
            error: 'some-error',
          },
        }),
      );
      const fakeClipList = getFakeClipList(true);
      spectator.detectChanges();

      spectator.component.onClipListFormChanged(fakeClipList);

      expect(spectator.component.errorMsg).toBe('Oops ! Something went wrong.');
    });

    it('should create and press back', () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      clipListService.create.and.returnValue(of(null));
      const fakeClipList = getFakeClipList(true);
      spectator.detectChanges();

      spectator.component.onClipListFormChanged(fakeClipList);

      expect(spectator.component.onBackButtonPressed).toHaveBeenCalled();
    });

    it('should show override modal and create on approval', async () => {
      spyOn(spectator.component, 'onBackButtonPressed');

      clipListService.create.and.returnValue(
        of({overrideList: ['clip1', 'clip2'], overrideDataKey: '123'}),
      );
      const fakeClipList = getFakeClipList(true);
      spectator.component.onClipListFormChanged(fakeClipList);

      const docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);

      const dialogText = await MeDialogHarness.getText(spectator.fixture, docLoader);

      expect(dialogText).toMatch('.*clip1clip2.*');

      await MeButtonHarness.click(spectator.fixture, docLoader, {text: 'Override'});

      expect(spectator.component.onBackButtonPressed).toHaveBeenCalled();

      expect(clipListService.create).toHaveBeenCalledTimes(2);
      expect(clipListService.create.calls.mostRecent().args).toEqual([
        fakeClipList,
        {
          overrideDataKey: '123',
        },
      ]);
    });
  });
});
