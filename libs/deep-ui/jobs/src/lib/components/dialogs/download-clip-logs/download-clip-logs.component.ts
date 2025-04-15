import {AsyncPipe} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import {FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {
  MeChipsGroupButton,
  MeChipsGroupButtonsComponent,
} from '@mobileye/material/src/lib/components/chips-group-buttons';
import {MeErrorFeedbackComponent} from '@mobileye/material/src/lib/components/error-feedback';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeJsonEditorComponent} from '@mobileye/material/src/lib/components/form/json-editor';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {FIVE_MB, MeZipService} from '@mobileye/material/src/lib/services/zip';
import {getErrorHtmlMsgFromResponse, prettyPrintJson} from '@mobileye/material/src/lib/utils';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import copy from 'copy-to-clipboard';
import {EtlJobService, ProbeLogsResponse} from 'deep-ui/shared/core';
import {JobEntity} from 'deep-ui/shared/models';
import {jsonrepair} from 'jsonrepair';
import {BehaviorSubject, from, Observable, of, switchMap} from 'rxjs';
import {catchError, debounceTime} from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'de-download-clip-logs',
  templateUrl: './download-clip-logs.component.html',
  styleUrls: ['./download-clip-logs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MeInputComponent,
    MeChipsGroupButtonsComponent,
    MatProgressSpinnerModule,
    MeErrorFeedbackComponent,
    MatButtonModule,
    AsyncPipe,
    MatIconModule,
    MeJsonEditorComponent,
  ],
})
export class DownloadClipLogsComponent {
  @Input()
  etlJob: JobEntity;

  @Output()
  closeDialog = new EventEmitter<void>();

  private downloader = inject(MeDownloaderService);
  private fb = inject(FormBuilder);
  private etlJobService = inject(EtlJobService);
  private snackbarService = inject(MeSnackbarService);
  private zipService = inject(MeZipService);
  private fullStoryService = inject(FullStoryService);

  errorMsg = '';

  downloadClipLogsForm = this.fb.group({
    clipName: new FormControl<string>(null, Validators.required),
    jsonControls: new FormArray<FormControl<any>>([new FormControl(null, Validators.required)]),
  });

  prettyJson: string;
  files = signal<Array<File>>([]);
  selectedIndex = signal<number>(0);
  lastClipName = signal<string>('');

  fileOptions = computed<Array<MeChipsGroupButton>>(() => {
    if (!this.files()?.length) {
      return [];
    }
    return this.files().map((file: File, i: number) => {
      return {
        id: i.toString(),
        label: file?.name?.split('.')?.length ? file.name.split('.')[0] : `file_${i}`,
      };
    });
  });

  selectedFileOption = computed<string>(() => {
    if (!this.files()?.length) {
      return null;
    }

    return this.fileOptions()[this.selectedIndex()].id;
  });

  private loadingSubscription = new BehaviorSubject<boolean>(false);

  private readonly MAX_JSON_THRESHOLD = FIVE_MB * 7; // 35MB

  // eslint-disable-next-line
  loading$ = this.loadingSubscription.asObservable().pipe(debounceTime(200));

  onGroupButtonChanged(i: string): void {
    this.selectedIndex.set(parseInt(i, 10));
  }

  copyCmdToClipboard(): void {
    this.prettyJson = prettyPrintJson(
      this.downloadClipLogsForm.controls.jsonControls.value[this.selectedIndex()],
    );
    copy(this.prettyJson);
    this.snackbarService.onCopyToClipboard();
  }

  downloadEtlLogs(): void {
    if (this.lastClipName()) {
      this.errorMsg = '';
      const clipName = this.lastClipName().trim();
      this.etlJobService
        .downloadClipLogs(this.etlJob.jobUuid, clipName)
        .pipe(
          untilDestroyed(this),
          catchError((response: HttpErrorResponse) =>
            of({
              error: getErrorHtmlMsgFromResponse(response, false),
            }),
          ),
          switchMap((response: ProbeLogsResponse) => this._handleDownloadProbeLogs(response)),
        )
        .subscribe();
    }
  }

  onSaveClicked(): void {
    this.downloadClipLogsForm.controls.clipName.markAsTouched();
    if (this.downloadClipLogsForm.controls.clipName.valid) {
      this.errorMsg = '';
      const clipName = this.downloadClipLogsForm.controls.clipName.value.trim();
      this.lastClipName.set(clipName);
      this.loadingSubscription.next(true);
      this.etlJobService
        .downloadClipLogs(this.etlJob.jobUuid, clipName, true)
        .pipe(
          untilDestroyed(this),
          catchError((response: HttpErrorResponse) =>
            of({
              error: getErrorHtmlMsgFromResponse(response, false),
            }),
          ),
        )
        .subscribe(async (response: ProbeLogsResponse) => {
          await this._handleProbeLogsResponse(response);
          this.selectedIndex.set(0);
          this.loadingSubscription.next(false);
        });
    }
  }

  private async _getProbeLogs(response: ProbeLogsResponse): Promise<Array<File>> {
    if (response.error) {
      this.errorMsg = response.error;
      return [];
    } else if (!response?.urls?.length) {
      this.errorMsg = "Can't find any logs files for this clip";
      return [];
    } else {
      const files: Array<File> = await Promise.all(
        response.urls.map(async (url, _) => {
          const file: File = await this.downloader.downloadFile(url, true);
          return file;
        }),
      );

      return files.filter((file: File) => !!file);
    }
  }

  private _handleDownloadProbeLogs(response: ProbeLogsResponse): Observable<any> {
    return of(response).pipe(
      switchMap((res: ProbeLogsResponse) => {
        if (res.error) {
          this.errorMsg = res.error;
          return of(null);
        } else if (!res?.urls?.length) {
          this.errorMsg = "Can't find any logs files for this clip";
          return of(null);
        } else {
          return from(this.downloader.downloadFile(res.urls[this.selectedIndex()]));
        }
      }),
    );
  }

  private async _handleProbeLogsResponse(response: ProbeLogsResponse): Promise<void> {
    const files: Array<File> = await this._getProbeLogs(response);
    if (!files.length) {
      this._handleEmptyFiles();
    } else {
      await this._handleNonEmptyFiles(files);
    }
  }

  private _handleEmptyFiles(): void {
    this.files.set([]);
    const control = this.downloadClipLogsForm.controls.jsonControls;
    control.clear();
    control.push(new FormControl<any>(null, Validators.required));
  }

  private async _handleNonEmptyFiles(files: Array<File>): Promise<void> {
    const filesAfterDecompression = await this._decompressFiles(files);
    this.files.set(filesAfterDecompression);
    await this._populateJsonControls(filesAfterDecompression);
  }

  private async _decompressFiles(files: Array<File>): Promise<Array<File>> {
    const filesAfterDecompression = [];
    for (const file of files) {
      const decompressedFiles: Array<File> = await this.zipService.decompressFile(file);
      filesAfterDecompression.push(...decompressedFiles);
    }
    return filesAfterDecompression;
  }

  private async _populateJsonControls(files: Array<File>): Promise<void> {
    const dataArr = await this._convertFilesToData(files);
    const control = this.downloadClipLogsForm.controls.jsonControls;
    control.clear();
    dataArr.forEach((d: any) => {
      control.push(new FormControl<any>(d, Validators.required));
    });
  }

  private async _convertFilesToData(files: Array<File>): Promise<Array<unknown>> {
    const filesOutputs: Array<any> = [];
    for (const f of files) {
      if (f.size > this.MAX_JSON_THRESHOLD) {
        filesOutputs.push({
          error: 'JSON size is too large to display, please download the file to view the content',
        });
      } else {
        const parsedData = await this._convertFileToData(f);
        filesOutputs.push(parsedData);
      }
    }
    return filesOutputs;
  }

  private _convertFileToData(file: File): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      // Event handler for successful read
      reader.onload = () => {
        try {
          const json = this._tryParseJSON(reader.result as string); // Parse the file content as JSON
          resolve(json);
          //eslint-disable-next-line
        } catch (_) {
          this.fullStoryService.trackEvent({
            name: 'UI - Parse JSON Failed',
            properties: {
              fileName: file.name,
              fileType: 'ETL_LOGS',
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

  private _tryParseJSON(str: string): any {
    try {
      const jsonString = jsonrepair(str);
      return JSON.parse(jsonString);
      //eslint-disable-next-line
    } catch (_) {
      const fixedJson = this._fixJSONString(str);
      return JSON.parse(fixedJson);
    }
  }

  private _fixJSONString(str: string) {
    return str
      .trim()
      .replace(/^{/, '[{') // Replace first opening brace with opening bracket and brace
      .replace(/}$/, '}]') // Replace last closing brace with closing brace and bracket
      .replace(
        /datetime\.datetime\((\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*tzinfo=.*\)/g,
        '"$1-$2-$3 $4:$5:$6.$7"',
      ) // Convert datetime to string
      .replace(/\n/g, ',') // Replace newline with comma
      .replace(/'/g, '"') // Replace all single quotes with double quotes for JSON validity
      .replace(/":\s*True\b/g, '": true') // Convert True to lowercase
      .replace(/":\s*False\b/g, '": false') // Convert False to lowercase
      .replace(/"frames_range":\s*\((\d+),\s*(\d+)\)/g, '"frames_range": [$1, $2]') // Convert frames_range tuple to array
      .replace(/"frames_range":\s*\((nan|NaN),\s*(nan|NaN)\)/g, '"frames_range": [null, null]'); // Convert (nan, nan) to [null, null]
  }
}
