import {Injectable} from '@angular/core';
import JsZip from 'jszip';
import pako from 'pako';
import {from, Observable, of, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

export const FIVE_MB = 5242880;

export const MAX_FILE_UPLOAD = 10 * FIVE_MB;

export const COMPRESSION_OPTIONS: JsZip.JSZipGeneratorOptions<'blob'> = {
  type: 'blob',
  compression: 'DEFLATE',
  compressionOptions: {
    level: 6,
  },
};

@Injectable()
export class MeZipService {
  constructor() {}

  tryGenerateZipFile(file: File): Observable<File> {
    return file.size > FIVE_MB && !this._isZip(file)
      ? from<Promise<File>>(this._generateZipFile(file)).pipe(
          map(this._getFileAndThrowLimitError),
          catchError((_) => of(this._getFileAndThrowLimitError(file))),
        )
      : of(file);
  }

  async decompressFile(file: File): Promise<File[]> {
    if (this._isGz(file)) {
      return this._decompressGzipFile(file);
    } else if (this._isZip(file)) {
      return this._decompressZipFile(file);
    } else {
      return [file];
    }
  }

  private async _decompressZipFile(file: File): Promise<File[]> {
    if (!this._isZip(file)) {
      return [file];
    }
    const zipInstance = new JsZip();
    const zip = await zipInstance.loadAsync(file);
    const files: File[] = [];

    for (const [name, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir) {
        const content = await zipEntry.async('blob');
        files.push(new File([content], name, {type: content.type}));
      }
    }

    return files;
  }

  private async _generateZipFile(file: File): Promise<File> {
    const zip = new JsZip();
    zip.file(file.name, file as Blob);
    const zipBlob: Blob = await zip.generateAsync(COMPRESSION_OPTIONS);
    const dotIndex =
      file.name.lastIndexOf('.') !== -1 ? file.name.lastIndexOf('.') : file.name.length;
    const fileNameWithoutType = file.name.substring(0, dotIndex);
    return new File([zipBlob], `${fileNameWithoutType}.zip`);
  }

  private _getFileAndThrowLimitError(file: File): File {
    if (file.size > MAX_FILE_UPLOAD) {
      throw throwError(() => new Error(`Nginx ${MAX_FILE_UPLOAD} bytes upload limit exceeded`));
    }
    return file;
  }

  private async _decompressGzipFile(file: File): Promise<File[]> {
    const files: File[] = [];
    const dotIndex =
      file.name.lastIndexOf('.') !== -1 ? file.name.lastIndexOf('.') : file.name.length;
    const name = file?.name.substring(0, dotIndex) || 'file';
    const compressedData = new Uint8Array(await file.arrayBuffer()); // Convert file to Uint8Array
    const result: string = pako.ungzip(compressedData, {to: 'string'}); // Decompress
    files.push(new File([result], name, {type: file.type}));
    return files;
  }

  private _isZip(file: File): boolean {
    return (
      file.type === 'application/zip' ||
      file.type === 'application/x-zip-compressed' ||
      file.name?.toLowerCase().endsWith('.zip')
    );
  }

  private _isGz(file: File): boolean {
    return (
      file.type === 'application/gzip' ||
      file.type === 'application/x-gzip' ||
      file.name?.toLowerCase().endsWith('.gz')
    );
  }
}
