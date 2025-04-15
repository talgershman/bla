import {HttpErrorResponse, HttpStatusCode} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {DeepUtilService} from 'deep-ui/shared/core';
import {environment} from 'deep-ui/shared/environments';
import {FullStoryResponseTimeInterceptor} from 'deep-ui/shared/http';
import {forkJoin, from, Observable, of, tap} from 'rxjs';
import {fromFetch} from 'rxjs/internal/observable/dom/fetch';
import {catchError, map, switchMap} from 'rxjs/operators';

export type BudgetGroupValidResponse = {
  data: {
    user: {
      name: string;
      full_name: string;
      email: string;
      group: string[];
      department: string;
      budget_group: string;
      permitted_budget_groups: string[];
    };
  };
};

export type GenerateBudgetGroupResponse = {groups: Array<string>; error: string; isValid: boolean};

export type QuotasResponseData = {
  budget_group: string;
  monthly_cpu_usage_days: number;
  monthly_cpu_quota_days: number;
  monthly_usage_percent: string;
  allowed: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class BudgetGroupService {
  private deepUtilService = inject(DeepUtilService);
  private fullStoryResponseTimeInterceptor = inject(FullStoryResponseTimeInterceptor);

  getBudgetGroups(): Observable<{groups: Array<MeSelectOption>; error: string; isValid: boolean}> {
    const userName = this.deepUtilService.getCurrentUser();
    const userId = userName.userName.split('@')[0];
    return this._getUserBudgetGroups(userId).pipe(
      switchMap((response: GenerateBudgetGroupResponse) => {
        if (!response.error && !response.groups?.length) {
          return of({
            groups: [],
            error: 'Error: no options found for budget groups',
            isValid: false,
          });
        } else if (response.error) {
          return of(response);
        } else {
          return this._generateBudgetGroupOptions(response.groups).pipe(
            map((groups) => ({groups, error: '', isValid: true})),
          );
        }
      }),
    );
  }

  private _getUserBudgetGroups(userId: string): Observable<GenerateBudgetGroupResponse> {
    const url = `${environment.budgetGroupServiceApi}v1/user/${userId}`;
    const started = Date.now();
    // using fetch , to not send auth token
    return this._getFromFetch(url).pipe(
      tap((event) => {
        if (event instanceof Response) {
          const elapsed = Date.now() - started;
          this.fullStoryResponseTimeInterceptor.logToFullStory(url, elapsed, event.status);
        }
      }),
      switchMap((response: Response) => {
        if (response.ok) {
          // OK return data
          return from(response.json()).pipe(
            map((body: BudgetGroupValidResponse) => {
              const groups = body.data?.user?.permitted_budget_groups || [];
              const error = !groups?.length ? 'Error: No budget groups found.' : '';
              const isValid = !error;
              return {groups, error, isValid};
            }),
          );
        } else if (response.status === HttpStatusCode.NotFound) {
          return of({
            groups: [],
            error: `budget groups for user: ${userId} was not found.`,
            isValid: false,
          });
        } else {
          return this._handleBudgetGroupApiInvalidStatusCode(response);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = error.message || 'An error occurred';
        return of({groups: [], error: `Budget group API Error: ${errorMessage}`, isValid: true});
      }),
    );
  }

  private _handleBudgetGroupApiInvalidStatusCode(
    response: Response,
  ): Observable<GenerateBudgetGroupResponse> {
    return from(response.json()).pipe(
      map((body: any) => {
        let errorText;
        if ('detail' in body) {
          errorText = body.detail;
        } else {
          errorText = JSON.stringify(body);
        }
        return {groups: [], error: errorText, isValid: true};
      }),
      catchError((_) =>
        of({groups: [], error: 'Budget group API Error: response to json failed.', isValid: true}),
      ),
    );
  }

  private _generateBudgetGroupValidationRequest(budgetGroup: string): Observable<MeSelectOption> {
    const url = `${environment.quotasServiceApi}cpu/verify/budget_group/${budgetGroup}`;
    const started = Date.now();
    return this._getFromFetch(url).pipe(
      tap((event) => {
        if (event instanceof Response) {
          const elapsed = Date.now() - started;
          this.fullStoryResponseTimeInterceptor.logToFullStory(url, elapsed, event.status);
        }
      }),
      switchMap(async (response: Response) => {
        if (response.ok) {
          const responseData: QuotasResponseData = await response.json();
          let tooltip = responseData?.allowed ? '' : 'Budget exceeded';
          tooltip = 'allowed' in responseData ? tooltip : 'Invalid response format ';
          const isDisabled = !responseData?.allowed;
          return {
            id: budgetGroup,
            value: budgetGroup,
            isDisabled,
            tooltip,
          };
        } else if (response.status === HttpStatusCode.NotFound) {
          return {
            id: budgetGroup,
            value: budgetGroup,
            isDisabled: false,
            tooltip: 'Budget group was not found in Quota API, please contact Cloud DevOps',
          };
        } else {
          const text = await response.text();
          return {
            id: budgetGroup,
            value: budgetGroup,
            isDisabled: false,
            tooltip: `Quota API Error: ${text}`,
          };
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = error.message || 'An error occurred';
        return of({
          id: budgetGroup,
          value: budgetGroup,
          isDisabled: false,
          tooltip: `Quota API Error: ${errorMessage}`,
        });
      }),
    );
  }

  private _generateBudgetGroupOptions(
    budgetGroups: Array<string>,
  ): Observable<Array<MeSelectOption>> {
    const requests = [];
    for (const budgetGroup of budgetGroups) {
      const request = this._generateBudgetGroupValidationRequest(budgetGroup);
      requests.push(request);
    }
    return forkJoin(requests);
  }
  private _getFromFetch(url: string): Observable<Response> {
    return fromFetch(url);
  }
}
