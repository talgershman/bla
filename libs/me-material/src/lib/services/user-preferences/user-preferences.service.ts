import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {ignoreHttpErrorResponse} from '@mobileye/material/src/lib/http/http-error';
import {MeCacheService, MeCacheType} from '@mobileye/material/src/lib/services/cache';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {debounce} from 'lodash-decorators/debounce';
import _isNil from 'lodash-es/isNil';
import _isString from 'lodash-es/isString';
import _some from 'lodash-es/some';
import {BehaviorSubject, first, firstValueFrom, Observable, of, timeout, TimeoutError} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';

@Injectable()
export class MeUserPreferencesService {
  private options = inject<{
    url: string;
    keysBlackList: Array<string>;
    user$: Observable<{
      userName: string;
      user: string;
    }>;
  }>('USER_PREFERENCES_OPTIONS' as any, {optional: true})!;
  private httpClient = inject(HttpClient);
  private cache = inject(MeCacheService);
  private fullStoryService = inject(FullStoryService, {optional: true})!;

  private readonly VERSION = 'VERSION_1';
  private readonly PREFERENCES_TIMEOUT = 15000; // 15 seconds
  private readonly currentUserPreferences = new BehaviorSubject<Record<string, any>>(null);
  private readonly user = new BehaviorSubject<{user: string; userName: string}>(null);
  private serverUserPref;

  constructor() {
    this.options.user$.subscribe((user: {user: string; userName: string}) => this.user.next(user));
    this.currentUserPreferences
      .pipe(
        tap((v: Record<string, any>) => {
          const key = this._userPreferencesKey();
          if (key && v) {
            this.cache.set(MeCacheType.LocalStorage, key, v);
          }
        }),
      )
      .subscribe();
  }

  getComponentState(componentId: string, safeGet?: boolean): any {
    const uiPref = this.getUserPreferences(safeGet);
    const compState = uiPref?.componentState;

    return compState?.[componentId];
  }

  setComponentState(componentId: string, updateData: any, safeGet?: boolean): void {
    if (!this.isValidKey(componentId)) {
      return;
    }
    const prevUiPref = this.getUserPreferences(safeGet);
    const prevCompState = prevUiPref?.componentState;

    const nextUiPref = {
      ...(prevUiPref || {}),
      componentState: {
        ...(prevCompState || {}),
        [componentId]: updateData,
      },
    };
    this.setUserPreferences(nextUiPref);
  }

  getUserPreferencesByKey(key: string, safeGet?: boolean): any {
    const uiPref = this.getUserPreferences(safeGet);
    if (uiPref?.ignore) {
      return 'ignore';
    }

    return uiPref?.[key];
  }

  async getFirstUserPreferences(): Promise<Record<string, any>> {
    const key = this._userPreferencesKey();

    if (!key) {
      return null;
    }

    const inMemPref = this.currentUserPreferences.value;

    if (!inMemPref || Object.keys(inMemPref).length === 0) {
      const serverUserPref = await firstValueFrom(this._getUiPreferences());
      this.serverUserPref = serverUserPref;
      const storageUserPref = this.cache.get(MeCacheType.LocalStorage, key);
      if (_isNil(serverUserPref)) {
        // error or timeout from server
        if (this._isNonEmptyObject(storageUserPref)) {
          this.currentUserPreferences.next(storageUserPref);
          return storageUserPref;
        }
        this.fullStoryService.trackEvent({
          name: 'UI - Debug',
          properties: {
            msg: 'User Preferences from server and storage are both invalid',
          },
        });
        return null;
      } else if (
        Object.keys(serverUserPref).length === 0 &&
        this._isNonEmptyObject(storageUserPref)
      ) {
        this.fullStoryService.trackEvent({
          name: 'UI - Debug',
          properties: {
            msg: 'Existing storage User Preferences mismatch with an empty server User Preferences',
          },
        });
      }
      this.currentUserPreferences.next(serverUserPref);
      return serverUserPref;
    }

    return this.cache.get(MeCacheType.LocalStorage, key);
  }

  getUserPreferences(safeGet?: boolean): Record<string, any> {
    if (safeGet && this.serverUserPref === null) {
      return {'ignore': true};
    }
    const key = this._userPreferencesKey();

    if (!key) {
      return null;
    }

    const inMemPref = this.currentUserPreferences.value;

    if (!inMemPref || Object.keys(inMemPref).length === 0) {
      return null;
    }

    return this.cache.get(MeCacheType.LocalStorage, key);
  }

  setUserPreferences(updateData: Record<string, any>): void {
    const key = this._userPreferencesKey();
    if (!key) {
      return;
    }

    this.currentUserPreferences.next(updateData);
    this._sendUpdateRequestAndDebounce(updateData);
  }

  resetUserParams(): void {
    this._sendUpdateRequest(null).pipe(first()).subscribe();
  }

  addUserPreferences(key: string, data: any): void {
    if (!this.isValidKey(key)) {
      return;
    }
    const prevUiPref = this.getUserPreferences();

    const nextUiPref = {
      ...(prevUiPref || {}),
      [key]: data,
    };
    this.setUserPreferences(nextUiPref);
  }

  private isValidKey(key: string): boolean {
    if (!this.options?.keysBlackList) {
      return true;
    }
    return !_some(this.options.keysBlackList, (invalidKey: string) => key.startsWith(invalidKey));
  }

  private _isNonEmptyObject(obj: any): boolean {
    return obj && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).length > 0;
  }

  private _userPreferencesKey(): string {
    const user = this.user.value;
    if (!user?.userName) {
      return null;
    }
    return `${user.userName}_${this.VERSION}`;
  }

  private _getUrl(path: string) {
    return `${this.options.url}${path}?version=${this.VERSION}`;
  }

  private _getUiPreferences(): Observable<Record<string, any> | null> {
    const url = this._getUrl('ui-preferences/');
    return this.httpClient
      .get<Record<string, any>>(url, {
        context: ignoreHttpErrorResponse(),
      })
      .pipe(
        timeout(this.PREFERENCES_TIMEOUT),
        catchError((err: TimeoutError | HttpErrorResponse) => {
          let errStr = '';
          if (err) {
            if (err?.message) {
              errStr = err.message;
            } else if (_isString(err)) {
              errStr = err;
            } else {
              errStr = JSON.stringify(err || {});
            }
          }
          if (err instanceof HttpErrorResponse) {
            this.fullStoryService.trackEvent({
              name: 'UI - Debug',
              properties: {
                msg: 'Error in getting User Preferences from server:' + errStr,
              },
            });
          } else {
            this.fullStoryService.trackEvent({
              name: 'UI - Debug',
              properties: {
                msg: 'Timeout in getting User Preferences from server:' + errStr,
              },
            });
          }
          return of(null);
        }),
      );
  }

  private _sendUpdateRequest(body: Record<string, any>): Observable<any> {
    const url = this._getUrl('save-ui-preferences/');
    return this.httpClient
      .put<any>(url, body, {
        context: ignoreHttpErrorResponse(),
      })
      .pipe(catchError((_) => of(null)));
  }

  @debounce(200)
  private _sendUpdateRequestAndDebounce(body: Record<string, any>): void {
    this._sendUpdateRequest(body).pipe(first()).subscribe();
  }
}
