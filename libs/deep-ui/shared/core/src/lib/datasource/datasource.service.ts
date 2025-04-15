import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {ignoreHttpErrorResponse} from '@mobileye/material/src/lib/http/http-error';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {DuplicateResponse} from 'deep-ui/shared/common';
import {Datasource, DataSourceTypes, QEAttribute, VersionDataSource} from 'deep-ui/shared/models';
import {ParsedQuery} from 'query-string';
import {firstValueFrom, Observable, of} from 'rxjs';
import {tap} from 'rxjs/operators';

import {UrlBuilderService} from '../url-builder/url-builder.service';

@Injectable({
  providedIn: 'root',
})
export class DatasourceService {
  private httpClient = inject(HttpClient);
  private urlBuilder = inject(UrlBuilderService);
  private snackbar = inject(MeSnackbarService);
  private downloaderService = inject(MeDownloaderService);

  private readonly baseUrl = this.urlBuilder.datasetBuilderApiBuilder('datasources/');

  private attributesCache = new Map<string, Array<QEAttribute>>();

  getSingle<T extends Datasource>(
    id: string,
    params: any = {},
    ignoreError = false,
  ): Observable<T> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`, params);
    const options = ignoreError ? {context: ignoreHttpErrorResponse()} : undefined;
    return this.httpClient.get<T>(url, options);
  }

  //we always send params to filter the results, because there are too much data sources
  getMulti(params: any): Observable<Datasource[]> {
    const url = this.urlBuilder.join(this.baseUrl, params);
    return this.httpClient.get<Datasource[]>(url, {});
  }

  create(body: any, params: any = {}): Observable<Datasource> {
    const url = this.urlBuilder.join(this.baseUrl, params);
    return this.httpClient.post<Datasource>(url, body).pipe(
      tap(() => {
        this.snackbar.onCreate(body?.name);
      }),
    );
  }

  update(id: string, body: any, params: any = {}): Observable<Datasource> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`, params);
    return this.httpClient.put<Datasource>(url, body).pipe(
      tap(() => {
        this.snackbar.onUpdate(body?.name);
      }),
    );
  }

  delete(id: string, name: string): Observable<Datasource> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`);
    return this.httpClient.delete<Datasource>(url).pipe(
      tap(() => {
        this.snackbar.onDelete(name);
      }),
    );
  }

  deleteVersion(id: string, name: string, userFacingVersion: string): Observable<void> {
    const url = this.urlBuilder.join(`${this.baseUrl}delete-versions/`);
    const body = {
      dataSourceId: id,
      userFacingVersion: userFacingVersion,
    };
    return this.httpClient.post<void>(url, body).pipe(
      tap(() => {
        const msg = `${name} - version ${userFacingVersion}`;
        this.snackbar.onDelete(msg);
      }),
    );
  }

  getJobIds(jobIds: Array<string>, dataType: DataSourceTypes): Observable<Datasource[]> {
    const url = this.urlBuilder.join(this.baseUrl, {jobIds: jobIds?.join(','), dataType});
    return this.httpClient.get<Datasource[]>(url);
  }

  getDsByJobIds(jobIds: Array<string>, dataType: DataSourceTypes): Observable<Datasource[]> {
    const url = this.urlBuilder.join(`${this.baseUrl}by-job-ids/`, {dataType});
    const body = {
      jobIds,
    };
    return this.httpClient.post<Datasource[]>(url, body);
  }

  /*
     If datasource is versioned, and dataSourceVersionId is empty will return the latest version attributes.
   */
  getAttributes(
    dataSource: Datasource,
    dataSourceVersion: VersionDataSource,
    ignoreCache?: boolean,
  ): Observable<Array<QEAttribute>> {
    if (dataSource.status === 'inactive') {
      // there is no attributes saved for inactive data source
      return of([]);
    }
    if (!ignoreCache) {
      const result: Array<QEAttribute> = this._getAttributesFromCache(
        dataSource,
        dataSourceVersion,
      );
      if (result) {
        return of(result);
      }
    }
    const url = this.urlBuilder.join(`${this.urlBuilder.datasetBuilderApiBuilder('')}attributes/`, {
      ...{dataSourceId: dataSource.id},
      ...(dataSourceVersion && {dataSourceVersionId: dataSourceVersion.id}),
    });
    return this.httpClient.get<Array<QEAttribute>>(url).pipe(
      tap((attributes: Array<QEAttribute>) => {
        const userFacingVersion = this._getUserFacingVersion(dataSource, dataSourceVersion);
        const key = this._generateCacheKey(dataSource.id, userFacingVersion);
        this.attributesCache.set(key, attributes);
      }),
    );
  }

  checkDuplicateName(name: string, team: string): Observable<DuplicateResponse> {
    const endPoint = this.urlBuilder.join(`${this.baseUrl}validate-name/`, {
      name,
      team,
    });

    return this.httpClient.get<DuplicateResponse>(endPoint);
  }

  async downloadClipList(datasource: Datasource, version?: VersionDataSource): Promise<void> {
    this.snackbar.onDownloadStarted();
    const params: ParsedQuery = {id: datasource.id};
    if (version) {
      params.user_facing_version = version.userFacingVersion;
    }
    const url = this.urlBuilder.join(`${this.baseUrl}download-clip-list/`, params);
    await this.downloaderService.downloadFileWithAuth(url, true);
  }

  async getSiblingDatasources(searchDataSource: Datasource): Promise<Array<Datasource>> {
    if (!searchDataSource?.siblingsId?.length) {
      return Promise.resolve([]);
    }
    const siblings: Array<Datasource> = [];
    for (const siblingId of searchDataSource.siblingsId) {
      const dataSource = await firstValueFrom(this.getSingle<Datasource>(siblingId));
      siblings.push(dataSource);
    }
    return Promise.resolve(siblings);
  }

  createGoldenLabelsDatasource(formValue: any): Observable<{id: string}> {
    const url = this.urlBuilder.join(`${this.baseUrl}golden-labels/`);
    return this.httpClient.post<{id: string}>(url, formValue).pipe(
      tap(() => {
        this.snackbar.open('Data source created');
      }),
    );
  }

  updateGoldenLabelsDatasourceSchema(schema: any, id: string): Observable<{id: string}> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/golden-labels/update-schema/`);
    return this.httpClient.post<{id: string}>(url, schema).pipe(
      tap(() => {
        this.snackbar.open('Data source schema was updated successfully');
      }),
    );
  }

  validateGoldenLabelsDatasourceSchema(
    schema: any,
    dataSubType: string,
  ): Observable<{errors: Array<string>}> {
    const url = this.urlBuilder.join(`${this.baseUrl}golden-labels/validate-schema/`);
    return this.httpClient.post<{errors: Array<string>}>(url, {schema, dataSubType});
  }

  validateGoldenLabelsDatasourceS3Path(
    path: string,
    dataSubType: string,
  ): Observable<{error: string}> {
    const url = this.urlBuilder.join(`${this.baseUrl}golden-labels/validate-s3path/`);
    return this.httpClient.post<{error: string}>(url, {path, dataSubType});
  }

  private _getAttributesFromCache(
    dataSource: Datasource,
    version: VersionDataSource,
  ): Array<QEAttribute> {
    const userFacingVersion = this._getUserFacingVersion(dataSource, version);
    const key = this._generateCacheKey(dataSource.id, userFacingVersion);
    return this.attributesCache.get(key);
  }

  private _generateCacheKey(dataSourceId: string, userFacingVersion: string): string {
    if (!userFacingVersion) {
      return dataSourceId;
    }
    return `${dataSourceId}_${userFacingVersion}`;
  }

  private _getUserFacingVersion(dataSource: Datasource, version: VersionDataSource): string {
    if (version) {
      return version.userFacingVersion;
    }
    if (!dataSource.versioned) {
      return '';
    }
    return dataSource.latestUserVersion;
  }
}
