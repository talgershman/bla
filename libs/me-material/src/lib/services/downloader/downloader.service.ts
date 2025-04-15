import {HttpClient, HttpHeaders} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {MeErrorHandlerService} from '@mobileye/material/src/lib/services/error-handler';
import {firstValueFrom, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MeDownloaderService {
  private errorHandlerService = inject(MeErrorHandlerService);
  private httpClient = inject(HttpClient);

  async downloadFile(url: string, noObjectUrl?: boolean): Promise<any> {
    return fetch(url)
      .then(async (response: Response) => {
        const blob = await response.blob();
        const filename = this._getFileName(response);
        if (!noObjectUrl) {
          return this._createObjectUrlAndDownload(blob, filename);
        } else {
          return new File([blob], filename);
        }
      })
      .catch(() => {
        this.errorHandlerService.raiseError({
          title: 'Error',
          bodyText: `Could not download file from url: ${url}`,
        });
      });
  }

  async downloadFileWithAuth(
    url: string,
    couldBeZipFile: boolean,
    fileName = '',
    additionalHeaders?: {
      [header: string]: string | string[];
    },
    noObjectUrl?: boolean,
  ): Promise<any> {
    const responseType = this._getResponseType(couldBeZipFile);

    const promise = firstValueFrom(
      this.httpClient.get(url, {
        responseType: responseType as 'text', // for typescript
        observe: 'response',
        headers: this._getHeaders(couldBeZipFile, additionalHeaders),
      }),
    );

    return promise
      .then((response: any) => {
        return this._handleBlob(response, fileName, noObjectUrl);
      })
      .catch(() => {});
  }

  postDownloadFileWithAuth(
    url: string,
    body: any,
    couldBeZipFile: boolean,
    fileName = '',
    additionalHeaders?: {
      [header: string]: string | string[];
    },
    noObjectUrl?: boolean,
  ): Observable<void | File> {
    const responseType = this._getResponseType(couldBeZipFile);

    return this.httpClient
      .post(url, body, {
        responseType: responseType as 'text', // for typescript
        observe: 'response',
        headers: this._getHeaders(couldBeZipFile, additionalHeaders),
      })
      .pipe(
        map((response: any) => {
          return this._handleBlob(response, fileName, noObjectUrl);
        }),
      );
  }

  private _getResponseType(couldBeZipFile: boolean): string {
    return couldBeZipFile ? 'arraybuffer' : 'text';
  }

  private _getHeaders(
    couldBeZipFile: boolean,
    additionalHeaders?: {
      [header: string]: string | string[];
    },
  ): HttpHeaders {
    let headers: HttpHeaders;
    if (couldBeZipFile) {
      const zipHeaders = {
        'Content-Type': 'application/x-zip-compressed',
      };
      headers = new HttpHeaders(
        additionalHeaders ? {...zipHeaders, ...additionalHeaders} : zipHeaders,
      );
    } else if (additionalHeaders) {
      headers = new HttpHeaders(additionalHeaders);
    }

    return headers;
  }

  private _handleBlob(response: any, fileName: string, noObjectUrl?: boolean): void | File {
    const blob = new Blob([response?.body]);
    const filename = fileName || this._getFileName(response);
    if (!noObjectUrl) {
      this._createObjectUrlAndDownload(blob, filename);
    } else {
      return new File([blob], filename);
    }
  }

  private _getFileName(response: Response): string {
    const filename = response.headers.get('Content-Disposition');
    const parts = filename?.split(';');
    return parts[1].split('=')[1]?.trim();
  }

  private _createObjectUrlAndDownload(blob: Blob, filename: string): void {
    const urlObject = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = urlObject;
    a.download = filename.replace(/ /g, '_');
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(urlObject);
    document.body.removeChild(a);
  }
}
