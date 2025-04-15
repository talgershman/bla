import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {ignoreHttpErrorResponse} from '@mobileye/material/src/lib/http/http-error';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

export type UserPropertiesType =
  | 'displayName'
  | 'userPrincipalName'
  | 'givenName'
  | 'surname'
  | 'mail';

@Injectable()
export class MeAzureGraphService {
  private http = inject(HttpClient);

  private readonly PHOTO_END_POINT = 'https://graph.microsoft.com/v1.0/me/photo/$value';

  private readonly USERS_END_POINT = 'https://graph.microsoft.com/v1.0/users';

  private readonly GROUPS_END_POINT = 'https://graph.microsoft.com/v1.0/groups';

  getPhoto(): Observable<Blob | unknown> {
    return this.http
      .get(this.PHOTO_END_POINT, {
        context: ignoreHttpErrorResponse(),
        headers: {'Content-Type': 'image/jpg'},
        responseType: 'blob',
      })
      .pipe(
        map((blob: Blob) => {
          return blob;
        }),
        catchError(() => of(null)),
      );
  }

  getUsersByDisplayName(
    searchParam: string,
    searchByProperty: UserPropertiesType = 'givenName',
    propertyToDisplay?: UserPropertiesType,
  ): Observable<any> {
    if (!searchParam) {
      return of(null);
    }
    const value = searchParam.trim();
    let filterStr = '';
    switch (searchByProperty) {
      case 'givenName':
      case 'surname': {
        const words = value.split(' ');
        filterStr = `$filter=startswith(givenName,'${value}') or startswith(surname, '${value}') or startswith(userPrincipalName, '${value}')`;
        if (words.length > 1) {
          filterStr = `$filter=startswith(givenName,'${words[0]}') and startswith(surname, '${words[1]}')`;
        }
        break;
      }
      default: {
        filterStr = `$filter=startswith($${searchByProperty}, '${value}')`;
        break;
      }
    }

    if (filterStr) {
      filterStr = `${filterStr}&`;
    }
    if (propertyToDisplay) {
      filterStr = `${filterStr}&$select=${propertyToDisplay}`;
    }

    return this.http
      .get(`${this.USERS_END_POINT}?${filterStr}&$top=10`)
      .pipe(catchError(() => of(null)));
  }

  getGroupsName(startWith: string): Observable<Array<string>> {
    const filterStr = `$filter=startswith(displayName,'${startWith}')`;
    return this.http.get(`${this.GROUPS_END_POINT}?${filterStr}&$select=displayName`).pipe(
      map((response: any) => response.value.map((team) => team.displayName)),
      catchError(() => of([])),
    );
  }
}
