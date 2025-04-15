import {MatIconModule} from '@angular/material/icon';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {NgxFileDropModule} from 'ngx-file-drop';

import {MeUploadFileComponent} from './upload-file.component';

describe('MeUploadFileComponent', () => {
  let spectator: Spectator<MeUploadFileComponent>;

  const createComponent = createComponentFactory({
    component: MeUploadFileComponent,
    imports: [NgxFileDropModule, MatProgressSpinnerModule, MatIconModule, MatIconTestingModule],
    detectChanges: false,
  });

  beforeEach((): void => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('dropped', () => {
    it('should filter files that accepted only', () => {
      const acceptedStr = '.xlsx';
      spectator.component.accept = acceptedStr;
      const files = [
        {
          relativePath: 'some_path/good.xlsx',
        },
        {
          relativePath: 'some_path/bad.txt',
        },
        {
          relativePath: 'other_path/good2.xlsx',
        },
      ];
      spyOn(spectator.component.filesChanges, 'emit');
      spectator.detectChanges();

      spectator.component.dropped(files as any);

      const expected = files.filter((file) => file.relativePath.includes(acceptedStr));

      expect(spectator.component.filesChanges.emit).toHaveBeenCalledWith(expected as any);
    });
  });
});
