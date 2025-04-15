import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {
  MeUploadFileComponent,
  MeUploadFileComponentMock,
} from '@mobileye/material/src/lib/components/upload-file';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeZipService} from '@mobileye/material/src/lib/services/zip';
import {DropFileEventMock} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DUPLICATE_SUFFIX_STR} from 'deep-ui/shared/common';
import {AssetManagerService, ClipListService} from 'deep-ui/shared/core';
import {getFakeClipList} from 'deep-ui/shared/testing';
import {NgxFileDropEntry} from 'ngx-file-drop';
import {of} from 'rxjs';

import {ClipListFormComponent} from './clip-list-form.component';

describe('ClipListFormComponent', () => {
  let spectator: Spectator<ClipListFormComponent>;
  let assetManagerService: SpyObject<AssetManagerService>;
  let zipService: SpyObject<MeZipService>;

  const createComponent = createComponentFactory({
    component: ClipListFormComponent,
    imports: [
      FormsModule,
      ReactiveFormsModule,
      MeInputComponent,
      MeTextareaComponent,
      MatButtonModule,
      MeSelectComponent,
      MeFormControlChipsFieldComponent,
      MeUploadFileComponent,
      MeTooltipDirective,
    ],
    mocks: [ClipListService, AssetManagerService, MeZipService],
    overrideComponents: [
      [
        MeUploadFileComponent,
        {
          remove: {
            imports: [MeUploadFileComponent],
          },
          add: {
            imports: [MeUploadFileComponentMock],
          },
        },
      ],
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    zipService = spectator.inject(MeZipService);
    assetManagerService = spectator.inject(AssetManagerService);
    assetManagerService.getTechnologiesOptions.and.returnValue(
      of([
        {id: 'AV', value: 'AV'},
        {id: 'TFL', value: 'TFL'},
      ]),
    );
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onSubmit', () => {
    it('form invalid, should not emit', () => {
      spectator.detectChanges();
      spyOn(spectator.component.fromValueChanged, 'emit');

      spectator.component.onSubmit();

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledTimes(0);
    });
  });

  describe('onFileChanged', () => {
    it('should select file', () => {
      const fileName = 'some mock file';
      const files: NgxFileDropEntry[] = new DropFileEventMock(fileName).files;
      zipService.tryGenerateZipFile.and.returnValue(of(new File([], fileName)));
      spectator.detectChanges();

      spectator.component.onFileChanged(files);

      expect(spectator.component.selectedFileName).toBe(files[0].fileEntry.name);
      expect(spectator.component.clipListForm.controls.clipListFile).not.toBeNull();
    });
  });

  describe('create from existing', () => {
    it('should copy values', () => {
      const fileName = 'some mock file';
      const files: NgxFileDropEntry[] = new DropFileEventMock(fileName).files;
      zipService.tryGenerateZipFile.and.returnValue(of(new File([], fileName)));
      const fakeClipList = getFakeClipList(true);
      spectator.component.clipList = fakeClipList;
      spectator.component.formMode = 'create';
      spectator.detectChanges();
      spectator.component.onFileChanged(files);

      expect(spectator.component.clipListForm.controls.name.value).toBe(
        `${fakeClipList.name}${DUPLICATE_SUFFIX_STR}`,
      );

      expect(spectator.component.clipListForm.controls.tags.value).toEqual(fakeClipList.tags);
    });
  });
});
