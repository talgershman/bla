import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {NgxFileDropComponent, NgxFileDropEntry, NgxFileDropModule} from 'ngx-file-drop';

@Component({
  selector: 'me-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HintIconComponent,
    NgxFileDropModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MeTooltipDirective,
  ],
})
export class MeUploadFileComponent {
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
  markAsError: boolean;

  @Input()
  infoTooltip: string;

  @Input()
  title: string;

  @Input()
  allowClear: boolean;

  @HostBinding('style.--height')
  @Input()
  height: string;

  @Output()
  filesChanges = new EventEmitter<NgxFileDropEntry[]>();

  @Output()
  cleared = new EventEmitter();

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

  onClear(): void {
    this.cleared.emit();
  }
}
