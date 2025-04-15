import {HttpErrorResponse} from '@angular/common/http';
import {MeUser} from '@mobileye/material/src/lib/common';
import {MeSelectOption} from '@mobileye/material/src/lib/components/form/select';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {createServiceFactory, SpectatorService, SpyObject} from '@ngneat/spectator';
import {DeepUtilService} from 'deep-ui/shared/core';
import {environment} from 'deep-ui/shared/environments';
import {FullStoryResponseTimeInterceptor} from 'deep-ui/shared/http';
import {of, throwError} from 'rxjs';

import {BudgetGroupService} from './budget-group.service';

describe('BudgetGroupService', () => {
  let spectator: SpectatorService<BudgetGroupService>;
  let deepUtilService: SpyObject<DeepUtilService>;
  let fullStoryService: SpyObject<FullStoryService>;

  const createService = createServiceFactory({
    service: BudgetGroupService,
    providers: [FullStoryResponseTimeInterceptor],
    mocks: [DeepUtilService, FullStoryService],
  });

  beforeEach(() => {
    spectator = createService();
    fullStoryService = spectator.inject<FullStoryService>(FullStoryService);
    deepUtilService = spectator.inject(DeepUtilService);
    deepUtilService.getCurrentUser.and.returnValue({
      name: 'testUser',
      userName: 'test@example.com',
      photo: '',
    } as MeUser);
    fullStoryService.trackEvent.and.returnValue(null);
  });

  describe('getBudgetGroups', () => {
    it('should return valid groups', (done) => {
      spyOn(spectator.service, '_getFromFetch' as any).and.callFake((url: string) => {
        if (url.includes(environment.budgetGroupServiceApi)) {
          return of({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  user: {
                    permitted_budget_groups: ['budget1', 'budget2'],
                  },
                },
              }),
          } as unknown as Partial<Response>);
        } else if (url.includes(environment.quotasServiceApi)) {
          return of({
            ok: true,
            json: () =>
              Promise.resolve({
                allowed: true,
              }),
          } as unknown as Partial<Response>);
        }
        return of(null);
      });

      spectator.service
        .getBudgetGroups()
        .subscribe((response: {groups: Array<MeSelectOption>; error: string; isValid: boolean}) => {
          expect(response.groups).toEqual([
            {
              id: 'budget1',
              value: 'budget1',
              tooltip: '',
              isDisabled: false,
            },
            {
              id: 'budget2',
              value: 'budget2',
              tooltip: '',
              isDisabled: false,
            },
          ]);

          expect(response.isValid).toBeTruthy();
          expect(response.error).toBe('');
          done();
        });
    });

    it('should return one group disabled', (done) => {
      spyOn(spectator.service, '_getFromFetch' as any).and.callFake((url: string) => {
        if (url.includes(environment.budgetGroupServiceApi)) {
          return of({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  user: {
                    permitted_budget_groups: ['budget1', 'budget2'],
                  },
                },
              }),
          } as unknown as Partial<Response>);
        } else if (url.includes(environment.quotasServiceApi)) {
          return of({
            ok: true,
            json: () =>
              Promise.resolve({
                allowed: !url.includes('budget2'),
              }),
          } as unknown as Partial<Response>);
        }
        return of(null);
      });

      spectator.service
        .getBudgetGroups()
        .subscribe((response: {groups: Array<MeSelectOption>; error: string; isValid: boolean}) => {
          expect(response.groups).toEqual([
            {
              id: 'budget1',
              value: 'budget1',
              tooltip: '',
              isDisabled: false,
            },
            {
              id: 'budget2',
              value: 'budget2',
              tooltip: 'Budget exceeded',
              isDisabled: true,
            },
          ]);

          expect(response.isValid).toBeTruthy();
          expect(response.error).toBe('');
          done();
        });
    });

    it('should handle user not found', (done) => {
      spyOn(spectator.service, '_getFromFetch' as any).and.callFake((url: string) => {
        if (url.includes(environment.budgetGroupServiceApi)) {
          return of({
            ok: false,
            status: 404,
          } as unknown as Partial<Response>);
        }
        return of(null);
      });

      spectator.service
        .getBudgetGroups()
        .subscribe((response: {groups: Array<MeSelectOption>; error: string; isValid: boolean}) => {
          expect(response.groups).toEqual([]);
          expect(response.isValid).toBeFalsy();
          expect(response.error).toBe('budget groups for user: test was not found.');
          done();
        });
    });

    it('should return valid - API error budget group API ', (done) => {
      spyOn(spectator.service, '_getFromFetch' as any).and.callFake((url: string) => {
        if (url.includes(environment.budgetGroupServiceApi)) {
          return throwError(
            new HttpErrorResponse({
              error: 'some error msg',
              status: 500,
              statusText: 'Internal Server Error',
            }),
          );
        }
        return of(null);
      });

      spectator.service
        .getBudgetGroups()
        .subscribe((response: {groups: Array<MeSelectOption>; error: string; isValid: boolean}) => {
          expect(response.groups).toEqual([]);
          expect(response.isValid).toBeTruthy();
          expect(response.error).toBe(
            'Budget group API Error: Http failure response for (unknown url): 500 Internal Server Error',
          );
          done();
        });
    });

    it('should return valid - API error quota group API ', (done) => {
      spyOn(spectator.service, '_getFromFetch' as any).and.callFake((url: string) => {
        if (url.includes(environment.budgetGroupServiceApi)) {
          return of({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  user: {
                    permitted_budget_groups: ['budget1', 'budget2'],
                  },
                },
              }),
          } as unknown as Partial<Response>);
        } else if (url.includes(environment.quotasServiceApi)) {
          return throwError(
            new HttpErrorResponse({
              error: 'some error msg',
              status: 500,
              statusText: 'Internal Server Error',
            }),
          );
        }
        return of(null);
      });

      spectator.service
        .getBudgetGroups()
        .subscribe((response: {groups: Array<MeSelectOption>; error: string; isValid: boolean}) => {
          expect(response.groups).toEqual([
            {
              id: 'budget1',
              value: 'budget1',
              tooltip:
                'Quota API Error: Http failure response for (unknown url): 500 Internal Server Error',
              isDisabled: false,
            },
            {
              id: 'budget2',
              value: 'budget2',
              tooltip:
                'Quota API Error: Http failure response for (unknown url): 500 Internal Server Error',
              isDisabled: false,
            },
          ]);

          expect(response.isValid).toBeTruthy();
          expect(response.error).toBe('');
          done();
        });
    });
  });
});
