import {HttpClient} from '@angular/common/http';
import {inject, Injectable, OutputEmitterRef} from '@angular/core';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {JobEntity, JobStatusMetadata} from 'deep-ui/shared/models';
import {from, Observable, of, switchMap} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';

import {UrlBuilderService} from '../url-builder/url-builder.service';

@Injectable()
export abstract class BaseJobService {
  protected http = inject(HttpClient);
  protected urlBuilder = inject(UrlBuilderService);
  protected downloader = inject(MeDownloaderService);
  protected snackbar = inject(MeSnackbarService);
  protected abstract agGridBaseUrl: string;

  findStepInJobStatusMetadata(
    id: string,
    jobStatusMetadata: JobStatusMetadata[],
  ): JobStatusMetadata {
    for (const job of jobStatusMetadata) {
      if (job.step === id) {
        return job;
      }
    }
    return null;
  }

  getEtlErrorLogs(jobUuid: string): Observable<{url: string; file: File}> {
    const endPoint = this.urlBuilder.validationJobsBuilder('probe-errors/', {
      jobUuid,
    });

    return this.http.get<any>(endPoint).pipe(
      catchError(() => of(null)),
      switchMap((res: {url: string}) => {
        if (!res) {
          return of(null);
        }
        return from(this.downloader.downloadFile(res.url, true)).pipe(
          map((file: File) => (file ? {url: res.url, file} : null)),
        );
      }),
    );
  }

  downloadEtlErrorLogs(jobUuid: string, closeDialog?: OutputEmitterRef<void>): void {
    const endPoint = this.urlBuilder.validationJobsBuilder('probe-errors/', {
      jobUuid,
    });

    this.http
      .get<any>(endPoint)
      .pipe(
        catchError(() => of(null)),
        tap(() => {
          this.snackbar.onDownloadStarted();
        }),
      )
      .subscribe((response) => {
        if (response.url) {
          this.downloader.downloadFile(response.url);
        }
        if (closeDialog) {
          closeDialog.emit();
        }
      });
  }

  downloadParsingErrorLogs(jobUuid: string): void {
    const endPoint = this.urlBuilder.validationJobsBuilder('parsing-errors/', {
      jobUuid,
    });

    this.http
      .get<any>(endPoint)
      .pipe(
        catchError(() => of(null)),
        tap(() => {
          this.snackbar.onDownloadStarted();
        }),
      )
      .subscribe((response) => {
        if (response.url) {
          this.downloader.downloadFile(response.url);
        }
      });
  }

  abstract getFlowSteps(job?: JobEntity): string[];

  abstract convertStepToTitle(flowStep: string): string;

  abstract getModelNamePlural(): string;
}
