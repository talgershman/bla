import {FormBuilder} from '@angular/forms';
import {MatRadioModule} from '@angular/material/radio';
import {DropFileEventMock} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {SelectClipListComponent} from 'deep-ui/shared/components/src/lib/selection/select-clip-list';
import {LaunchService} from 'deep-ui/shared/core';
import {getFakeClipList} from 'deep-ui/shared/testing';
import {NgxFileDropEntry} from 'ngx-file-drop';
import {of} from 'rxjs';

import {ClipToLogLogsFilterStepComponent} from './clip-to-log-logs-filter-step.component';

describe('ClipToLogLogsFilterStepComponent', () => {
  let spectator: Spectator<ClipToLogLogsFilterStepComponent>;
  let launchService: SpyObject<LaunchService>;

  const createComponent = createComponentFactory({
    component: ClipToLogLogsFilterStepComponent,
    imports: [MatRadioModule, SelectClipListComponent],
    providers: [FormBuilder],
    mocks: [LaunchService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    launchService = spectator.inject(LaunchService);
    launchService.uploadClipToLogFile.and.returnValue(
      of({
        s3Path: 'some path',
      }),
    );
    launchService.validateUserParams.and.returnValue(of({valid: true}));
    spyOn(spectator.component.fileChanged, 'emit');
    spyOn(spectator.component.clipListIdChanged, 'emit');
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('onClipListsChanged', () => {
    it('should set file and clipListId', () => {
      spectator.detectChanges();
      const clipLists = [getFakeClipList(true)];
      spectator.component.onClipListsChanged(clipLists);

      expect(spectator.component.form.controls.file).not.toBeNull();
      expect(spectator.component.form.controls.clipListId.value).toBe(clipLists[0].id);
      expect(spectator.component.fileChanged.emit).toHaveBeenCalled();
      expect(spectator.component.clipListIdChanged.emit).toHaveBeenCalledWith(clipLists[0].id);
    });
  });

  describe('onFileChanged', () => {
    it('should select file', () => {
      spectator.detectChanges();
      const files: NgxFileDropEntry[] = new DropFileEventMock('some mock file 1').files;
      spectator.detectChanges();

      spectator.component.onFileChanged(files);

      expect(spectator.component.selectedFileName).toBe(files[0].fileEntry.name);
      expect(spectator.component.form.controls.file).not.toBeNull();
      expect(spectator.component.fileChanged.emit).toHaveBeenCalled();
    });
  });

  describe('onFileCleared', () => {
    it('should unselect file', () => {
      spectator.detectChanges();
      const files: NgxFileDropEntry[] = new DropFileEventMock('some mock file 1').files;

      spectator.component.onFileChanged(files);

      expect(spectator.component.selectedFileName).toBe(files[0].fileEntry.name);
      expect(spectator.component.form.controls.file.value).not.toBeNull();

      spectator.component.onFileCleared();

      expect(spectator.component.selectedFileName).toBeFalsy();
      expect(spectator.component.form.controls.file.value).toBeNull();

      const newFiles: NgxFileDropEntry[] = new DropFileEventMock('some mock file 2').files;

      spectator.component.onFileChanged(newFiles);

      expect(spectator.component.selectedFileName).toBe(newFiles[0].fileEntry.name);
      expect(spectator.component.form.controls.file.value).not.toBeNull();
    });
  });
});
