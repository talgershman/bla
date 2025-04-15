import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {environment} from 'deep-ui/shared/environments';
import _every from 'lodash-es/every';
import {Observable, of} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';

import {queryFilePathErrorAction} from '../store/actions/toast.actions';
import {AppState} from '../store/reducers';
import {UrlBuilderService} from '../url-builder/url-builder.service';

export interface QueryFileSystemObject {
  absolutePath: string;
  type: 'file' | 'folder';
  found?: boolean;
  error?: string;
}
export interface QueryFileSystem {
  retries: number;
  paths: QueryFileSystemObject[];
}

export const DEFAULT_RETRY_ATTEMPTS = 3;

@Injectable({
  providedIn: 'root',
})
export class OnPremService {
  private httpClient = inject(HttpClient);
  private urlBuilder = inject(UrlBuilderService);
  private store = inject<Store<AppState>>(Store);

  queryFileSystem(
    absolutePath: string,
    type: 'file' | 'folder' | 'path',
  ): Observable<Partial<QueryFileSystem> | string> {
    if (!absolutePath?.trim()) {
      return of('empty');
    }
    if (environment.disableOnPremRequests) {
      return of('warning');
    }
    const url = this.urlBuilder.onPremApiBuilder('query-file-system/');
    const requestBody: QueryFileSystem = {
      retries: DEFAULT_RETRY_ATTEMPTS,
      paths: [
        {
          absolutePath,
          type: type === 'path' ? undefined : type,
        },
      ],
    };
    return this.httpClient.post<QueryFileSystem>(url, requestBody).pipe(
      tap((response: QueryFileSystem) => {
        this._fireErrorAction(response);
      }),
      catchError(() => of('error')),
    );
  }

  queryPath(path: string): Observable<QueryFileSystem> {
    const url = this.urlBuilder.onPremApiBuilder('query-file-system/');
    const requestBody: QueryFileSystem = {
      retries: DEFAULT_RETRY_ATTEMPTS,
      paths: [
        {
          absolutePath: path,
          type: 'folder',
        },
      ],
    };
    return this.httpClient.post<QueryFileSystem>(url, requestBody).pipe(
      tap((response: QueryFileSystem) => {
        this._fireErrorAction(response);
      }),
      catchError(() => of(null)),
    );
  }

  queryPaths(paths: Array<QueryFileSystemObject>): Observable<QueryFileSystem> {
    if (environment.disableOnPremRequests) {
      const foundPaths = paths.map((path: QueryFileSystemObject) => {
        return {
          ...path,
          found: true,
        };
      });
      return of({
        paths: foundPaths,
        retries: DEFAULT_RETRY_ATTEMPTS,
      });
    }
    const requestBody: QueryFileSystem = {
      retries: DEFAULT_RETRY_ATTEMPTS,
      paths,
    };
    const url = this.urlBuilder.onPremApiBuilder('query-file-system/');
    return this.httpClient.post<QueryFileSystem>(url, requestBody).pipe(
      tap((response: QueryFileSystem) => {
        this._fireErrorAction(response);
      }),
      catchError(() => of(null)),
    );
  }

  queryPathsFileSystem(
    rootPath: string,
    paths: Array<string>,
    type: 'file' | 'folder',
  ): Observable<QueryFileSystem | string> {
    const isEmpty = _every(paths, (path) => path.trim() === '');
    if (!paths.length || isEmpty) {
      return of('empty');
    }
    if (environment.disableOnPremRequests) {
      return of('warning');
    }
    const url = this.urlBuilder.onPremApiBuilder('query-file-system/');
    const pathsArr: QueryFileSystemObject[] = [];
    paths.forEach((path: string) => {
      if (rootPath.trim() !== '' && path.trim() !== '') {
        const absolutePath = `${rootPath.trim()}${path.trim()}`;
        const item: QueryFileSystemObject = {absolutePath, type};
        pathsArr.push(item);
      }
    });
    if (!pathsArr.length) {
      return of(null);
    }
    const requestBody: QueryFileSystem = {
      retries: DEFAULT_RETRY_ATTEMPTS,
      paths: pathsArr,
    };
    return this.httpClient.post<QueryFileSystem>(url, requestBody).pipe(
      tap((response: QueryFileSystem) => {
        this._fireErrorAction(response);
      }),
      catchError(() => of('error')),
    );
  }

  // used for raising custom error toast, as these end points always returns 200
  private _fireErrorAction(response: QueryFileSystem): void {
    let errorMsg = '';
    response?.paths?.forEach((path) => {
      if (path.error) {
        errorMsg = `${errorMsg} ${path.error}`;
      }
    });
    if (errorMsg) {
      this.store.dispatch(queryFilePathErrorAction({title: 'Error', bodyText: errorMsg}));
    }
  }
}
