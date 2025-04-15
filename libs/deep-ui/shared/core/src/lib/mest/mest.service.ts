import {IServerSideGetRowsRequest, LoadSuccessParams} from '@ag-grid-community/core';
import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {ValidationErrors} from '@angular/forms';
import {getMeServerSideGetRowsRequest} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeSnackbarService} from '@mobileye/material/src/lib/services/snackbar';
import {MEST, MestParams} from 'deep-ui/shared/models';
import _filter from 'lodash-es/filter';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';

import {OnPremService, QueryFileSystem, QueryFileSystemObject} from '../on-prem/on-prem.service';
import {UrlBuilderService} from '../url-builder/url-builder.service';

export interface MestsResponse {
  mests: MEST[];
}

export interface MestFoundPathsResponseItem {
  foundPath: string;
  errorMsg: string;
}

export interface MestFoundPathsResponse {
  executable: MestFoundPathsResponseItem;
  lib: MestFoundPathsResponseItem;
  brainLib: MestFoundPathsResponseItem;
}

export interface MestSelectedPathsResponse extends MestFoundPathsResponse {
  mest?: any;
}

export interface MestSelectedPathResponse {
  path?: string;
  error?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MestService {
  private httpClient = inject(HttpClient);
  private urlBuilder = inject(UrlBuilderService);
  private onPremService = inject(OnPremService);
  private snackbar = inject(MeSnackbarService);

  private readonly baseUrl = this.urlBuilder.launchServiceApiBuilder('mests/');
  private readonly agGridBaseUrl = this.urlBuilder.launchServiceApiBuilder('mests/ag-grid/');

  getSingle(id: number, params: any = {}): Observable<MEST> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`, params);
    return this.httpClient.get<MEST>(url);
  }

  getMulti(params: any = {}): Observable<MestsResponse> {
    const url = this.urlBuilder.join(this.baseUrl, params);
    return this.httpClient.get<MestsResponse>(url);
  }

  create(body: any, params: any = {}): Observable<MEST> {
    const url = this.urlBuilder.join(this.baseUrl, params);
    return this.httpClient.post<MEST>(url, body).pipe(
      tap(() => {
        this.snackbar.onCreate(body.nickname);
      }),
    );
  }

  update(id: number, body: any, params: any = {}): Observable<MEST> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`, params);
    return this.httpClient.put<MEST>(url, body).pipe(
      tap(() => {
        this.snackbar.onUpdate(body.nickname);
      }),
    );
  }

  patch(id: number, body: any, params: any = {}): Observable<MEST> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`, params);
    return this.httpClient.patch<MEST>(url, body).pipe(
      tap((response) => {
        this.snackbar.onUpdate(response.nickname);
      }),
    );
  }

  delete(id: number, nickname: string): Observable<MEST> {
    const url = this.urlBuilder.join(`${this.baseUrl}${id}/`);
    return this.httpClient.delete<MEST>(url).pipe(
      tap(() => {
        this.snackbar.onDelete(nickname);
      }),
    );
  }

  generateMestCmd(mest: MEST, executable: string, lib: string, brainLib: string): string {
    if (!mest) {
      return '';
    }
    const args = mest.args ? mest.args : '';
    const paramsArr = this.generateMestParamString(mest.params);
    const params = paramsArr && paramsArr.length ? `-p "${paramsArr.join(' ')}" ` : '';
    const modules =
      `${executable}${lib}${brainLib}` === ''
        ? ''
        : `-m ${executable || ''} ${lib || ''} ${brainLib || ''}`;
    return `
      /usr/bin/cloud-mest
      ${modules}
      ${params}
      ${args}
    `;
  }

  generateMestParamString(mestParams: MestParams[]): string[] {
    const params = [];
    (mestParams || []).forEach((param) => {
      let item;
      if (param.value && param.key) {
        item = `${param.key}=${param.value}`;
      } else if (param.key) {
        item = param.key;
      }
      params.push(item);
    });
    return params;
  }

  getMestSelectedPaths(
    rootPath: string,
    executables: string[],
    libs: string[],
    brainLibs: string[],
  ): Observable<MestFoundPathsResponse> {
    const mergedPathsArr: Array<QueryFileSystemObject> = this._generateQueryFileSystemObject(
      rootPath,
      executables,
      libs,
      brainLibs,
    );
    return this.onPremService.queryPaths(mergedPathsArr).pipe(
      map((response: QueryFileSystem) => {
        if (response === null) {
          return null;
        }
        return this._getSelectedPaths(response, rootPath, executables, libs, brainLibs);
      }),
    );
  }

  validatePath(path: string): Observable<ValidationErrors> {
    return this.onPremService.queryPath(path).pipe(
      map((response: QueryFileSystem) => {
        if (response.paths[0].found) {
          return null;
        }
        return {
          path: path,
          error: true,
        };
      }),
    );
  }

  getAgGridMulti(request: IServerSideGetRowsRequest): Observable<LoadSuccessParams> {
    return this.httpClient.post<LoadSuccessParams>(
      this.agGridBaseUrl,
      getMeServerSideGetRowsRequest(request),
    );
  }

  private _generatePathErrorMsg(
    arr: string[],
    itemName: string,
    isFolder: boolean,
    rootPath: string,
  ): string {
    return `Could not find ${itemName} ${
      isFolder ? 'folder' : 'file'
    } path from the following paths: ${arr
      .map((path) => `${rootPath.trim()}${path.trim()}`)
      .join(', ')}\n`;
  }

  private _generateQueryFileSystemObject(
    rootPath: string,
    executables: string[],
    libs: string[],
    brainLibs: string[],
  ): Array<QueryFileSystemObject> {
    const arr: Array<QueryFileSystemObject> = [];

    this._insertQueryFilePathsToArr(executables, rootPath, arr);
    this._insertQueryFilePathsToArr(brainLibs, rootPath, arr);
    this._insertQueryFilePathsToArr(libs, rootPath, arr);

    return arr;
  }

  private _insertQueryFilePathsToArr(
    pathsArr: string[],
    rootPath: string,
    resultArr: Array<QueryFileSystemObject>,
  ): void {
    for (const arrItem of pathsArr) {
      const trimmedValue = arrItem.trim();
      if (trimmedValue) {
        const item: QueryFileSystemObject = {
          absolutePath: `${rootPath.trim()}${trimmedValue}`,
          type: 'file',
        };
        resultArr.push(item);
      }
    }
  }

  private _getSelectedPaths(
    response: QueryFileSystem,
    rootPath: string,
    executables: string[],
    libs: string[],
    brainLibs: string[],
  ): MestFoundPathsResponse {
    const foundPathsObj: Array<QueryFileSystemObject> = _filter(
      response.paths || [],
      (obj: QueryFileSystemObject) => obj.found,
    );
    const foundPaths = foundPathsObj.map((obj: QueryFileSystemObject) => obj.absolutePath);

    const executable = this._findSelectedPath(executables, rootPath, foundPaths);
    const lib = this._findSelectedPath(libs, rootPath, foundPaths);
    const brainLib = this._findSelectedPath(brainLibs, rootPath, foundPaths);

    return this._generateMESTFoundObj(
      executable,
      executables,
      rootPath,
      lib,
      libs,
      brainLib,
      brainLibs,
    );
  }

  private _findSelectedPath(arr: string[], rootPath: string, foundPaths: string[]): string {
    if (!arr?.length || !arr.filter((item) => item.trim()).length) {
      return 'ignore';
    }
    for (const item of arr || []) {
      if (item.trim()) {
        const absolutePath = `${rootPath.trim()}${item.trim()}`;
        if (foundPaths.includes(absolutePath)) {
          return absolutePath;
        }
      }
    }
    return '';
  }

  private _generateMESTFoundObj(
    executable,
    executables: string[],
    rootPath: string,
    lib,
    libs: string[],
    brainLib: string,
    brainLibs: string[],
  ): MestFoundPathsResponse {
    const obj: MestFoundPathsResponse = {
      executable: {
        foundPath: executable,
        errorMsg: executable
          ? ''
          : this._generatePathErrorMsg(executables, 'executable', false, rootPath),
      },
      lib: {
        foundPath: lib,
        errorMsg: executable ? '' : this._generatePathErrorMsg(libs, 'lib', false, rootPath),
      },
      brainLib: {
        foundPath: brainLib,
        errorMsg: brainLib
          ? ''
          : this._generatePathErrorMsg(brainLibs, 'brain lib', true, rootPath),
      },
    };

    //remove unused keys
    if (brainLib === 'ignore') {
      delete obj.brainLib;
    }
    if (executable === 'ignore') {
      delete obj.executable;
    }
    if (lib === 'ignore') {
      delete obj.lib;
    }
    return obj;
  }
}
