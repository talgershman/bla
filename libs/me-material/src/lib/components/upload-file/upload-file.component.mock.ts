import {
  Component,
  ChangeDetectionStrategy,
  Input,
  EventEmitter,
  Output,
  ViewChild,
  HostBinding,
} from '@angular/core';
import {NgxFileDropComponent, NgxFileDropEntry} from 'ngx-file-drop';

@Component({
  selector: 'me-upload-file',
  template: '<div> Upload File Test Placeholder </div>',
  styleUrls: ['./upload-file.component.scss'],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeUploadFileComponentMock {
  @Input()
  accept: string;

  @Input()
  multiple: boolean;

  @Input()
  placeholder = 'Drag & Drop to Upload File';

  @Input()
  isLoading: boolean;

  @Input()
  selectedFileName: string;

  @Input()
  infoTooltip: string;

  @Input()
  markAsError: boolean;

  @HostBinding('style.--height')
  @Input()
  height: string;

  @Output()
  filesChanges = new EventEmitter<NgxFileDropEntry[]>();

  @ViewChild(NgxFileDropComponent, {static: false})
  ngxFileDropComponent: NgxFileDropComponent;

  dropped(files: NgxFileDropEntry[]): void {
    const key = 'dropEventTimerSubscription';
    // todo : remove after bug fix for ngxFileDrop - https://github.com/georgipeltekov/ngx-file-drop/issues/224
    if (this.ngxFileDropComponent[key] && this.ngxFileDropComponent[key].unsubscribe) {
      this.ngxFileDropComponent[key].unsubscribe();
    }
    const filterFiles = [];
    if (this.accept) {
      (files || []).forEach((file: NgxFileDropEntry) => {
        const acceptArr = this.accept.split(',') || [];
        acceptArr.forEach((suffix) => {
          if (file.relativePath && file.relativePath.endsWith(suffix)) {
            filterFiles.push(file);
          }
        });
      });
    } else {
      (files || []).forEach((file: NgxFileDropEntry) => {
        if (file.relativePath) {
          filterFiles.push(file);
        }
      });
    }
    if (filterFiles.length) {
      this.filesChanges.emit(filterFiles);
    }
  }
}
