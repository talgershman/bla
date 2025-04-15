import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {ActivatedRoute} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeButtonHarness, MeDialogHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {ClipListService} from 'deep-ui/shared/core';
import {getFakeClipList} from 'deep-ui/shared/testing';
import {of, throwError} from 'rxjs';

import {ClipListFormComponent} from '../../forms/clip-list-form/clip-list-form.component';
import {EditClipListComponent} from './edit-clip-list.component';

const fakeClipList = getFakeClipList(true);

describe('EditClipListComponent', () => {
  let spectator: Spectator<EditClipListComponent>;
  let clipListService: SpyObject<ClipListService>;

  const createComponent = createComponentFactory({
    component: EditClipListComponent,
    imports: [
      RouterTestingModule,
      MeBreadcrumbsComponent,
      ClipListFormComponent,
      MatFormFieldModule,
      MatDialogModule,
    ],
    componentProviders: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: {
              clipList: fakeClipList,
            },
          },
        },
      },
    ],
    mocks: [ClipListService],
  });

  beforeEach(() => {
    spectator = createComponent();
    clipListService = spectator.inject(ClipListService);
    clipListService.update.and.returnValue(of(null));
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onClipListFormChanged', () => {
    it('should show error msg', async () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      clipListService.update.and.returnValue(
        throwError({
          error: {
            error: 'some-error',
          },
        }),
      );
      const fakeClipList2 = getFakeClipList(true);
      spectator.detectChanges();

      spectator.component.onClipListFormChanged(fakeClipList2);

      expect(spectator.component.errorMsg).toBe('Oops ! Something went wrong.');
    });

    it('should update and press back', () => {
      spyOn(spectator.component, 'onBackButtonPressed');
      clipListService.update.and.returnValue(of(null));
      const fakeClipList3 = getFakeClipList(true);
      spectator.detectChanges();

      spectator.component.onClipListFormChanged(fakeClipList3);

      expect(spectator.component.onBackButtonPressed).toHaveBeenCalled();
    });

    it('should show override modal and update on approval', async () => {
      spyOn(spectator.component, 'onBackButtonPressed');

      clipListService.update.and.returnValue(
        of({overrideList: ['clip1', 'clip2'], overrideDataKey: '123'}),
      );
      const fakeClipList4 = getFakeClipList(true);
      spectator.component.onClipListFormChanged(fakeClipList4);

      const docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);

      const dialogText = await MeDialogHarness.getText(spectator.fixture, docLoader);

      expect(dialogText).toMatch('.*clip1clip2.*');

      await MeButtonHarness.click(spectator.fixture, docLoader, {text: 'Override'});

      expect(spectator.component.onBackButtonPressed).toHaveBeenCalled();

      expect(clipListService.update).toHaveBeenCalledTimes(2);
      expect(clipListService.update.calls.mostRecent().args).toEqual([
        fakeClipList.id,
        fakeClipList4,
        {
          overrideDataKey: '123',
        },
      ]);
    });
  });
});
