import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {FIVE_MB, MeZipService} from '@mobileye/material/src/lib/services/zip';
import {prettyPrintJson} from '@mobileye/material/src/lib/utils';
import copy from 'copy-to-clipboard';
import {EtlJobService} from 'deep-ui/shared/core';
import {jsonrepair} from 'jsonrepair';
import {firstValueFrom} from 'rxjs';

@Component({
  selector: 'de-download-error-logs',
  templateUrl: './download-error-logs.component.html',
  styleUrl: './download-error-logs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MeJsonEditorComponent,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MeErrorFeedbackComponent,
  ],
})
export class DownloadErrorLogsComponent implements OnInit {
  jobUuid = input<string>();

  closeDialog = output<void>();

  errorMsg = signal<string>('');

  jsonControl = new FormControl<any>(null);
  file = signal<File>(null);
  initialized = signal<boolean>(false);
  disableCopyBtn = signal<boolean>(false);
  prettyJson: string;

  private etlJobService = inject(EtlJobService);
  private snackbarService = inject(MeSnackbarService);
  private zipService = inject(MeZipService);
  private fullStoryService = inject(FullStoryService);

  private readonly MAX_JSON_THRESHOLD = FIVE_MB * 7; // 35MB

  async ngOnInit(): Promise<void> {
    const res = await firstValueFrom(this.etlJobService.getEtlErrorLogs(this.jobUuid()));
    if (!res) {
      this.errorMsg.set('Failed to download error logs');
    } else {
      const {file} = res;
      const decompressedFiles: Array<File> = await this.zipService.decompressFile(file);
      if (decompressedFiles[0].size > this.MAX_JSON_THRESHOLD) {
        this.jsonControl.setValue({
          error: 'JSON size is too large to display, please download the file to view the content',
        });
      } else {
        this.file.set(decompressedFiles[0]);
        const data = await this._convertFileToData(this.file());
        this.jsonControl.setValue(data);
        this.disableCopyBtn.set(false);
      }
      this.initialized.set(true);
    }
  }

  copyCmdToClipboard(): void {
    this.prettyJson = prettyPrintJson(this.jsonControl.value);
    copy(this.prettyJson);
    this.snackbarService.onCopyToClipboard();
  }

  downloadErrorLogs(): void {
    this.etlJobService.downloadEtlErrorLogs(this.jobUuid());
  }

  private _convertFileToData(file: File): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      // Event handler for successful read
      reader.onload = () => {
        try {
          const jsonString = jsonrepair(reader.result as string);
          const json = JSON.parse(jsonString); // Parse the file content as JSON
          resolve(json);
          //eslint-disable-next-line
        } catch (_) {
          this.fullStoryService.trackEvent({
            name: 'UI - Parse JSON Failed',
            properties: {
              fileName: file.name,
              fileType: 'ETL_ERROR_LOGS',
            },
          });
          resolve([reader.result as string]);
        }
      };

      // Event handler for errors
      reader.onerror = () => {
        reject(new Error('Error reading the file'));
      };

      reader.readAsText(file); // Read the file as text
    });
  }
}
