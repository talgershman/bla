import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'me-upload-file-btn',
  templateUrl: './upload-file-btn.component.html',
  styleUrls: ['./upload-file-btn.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton],
})
export class MeUploadFileBtnComponent {
  inputElement = viewChild('inputElement', {read: ElementRef});

  accept = input<string>();

  buttonText = input<string>();

  fileChanges = output<any>();

  onSelectFile(): void {
    this.inputElement().nativeElement.value = '';
    this.inputElement().nativeElement.click();
  }

  fileChangeHandler = (event): void => {
    const file = event.target.files[0]; // Get the first selected file

    if (file) {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const jsonData = JSON.parse(event.target.result as string);
          this.fileChanges.emit(jsonData);
          // eslint-disable-next-line
        } catch (error) {
          this.fileChanges.emit(null);
        }
      };

      reader.readAsText(file);
    }
  };
}
