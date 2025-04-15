import {Location} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeChipsGroupButtonsComponent} from '@mobileye/material/src/lib/components/chips-group-buttons';
import {MePortalTargetDirective} from '@mobileye/material/src/lib/directives/portal';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {JobsDynamicViewEnum, TAB_VIEW_PARAM} from 'deep-ui/shared/components/src/lib/common';
import {throttleTime} from 'rxjs/operators';

import {EtlJobsComponent} from '../components/jobs/etl-jobs/etl-jobs.component';
import {PerfectTransformJobsComponent} from '../components/jobs/perfect-transform-jobs/perfect-transform-jobs.component';
import {breadcrumbs, buttons, JOBS_DEFAULT_VIEW} from './jobs-entities';

export const JOBS_VIEW_SESSION_KEY = 'jobsView';

@UntilDestroy()
@Component({
  selector: 'de-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EtlJobsComponent,
    PerfectTransformJobsComponent,
    MeBreadcrumbsComponent,
    MePortalTargetDirective,
    MeChipsGroupButtonsComponent,
  ],
})
export class JobsComponent implements OnInit, OnDestroy {
  private userPreferencesService = inject(MeUserPreferencesService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  selectedGroupButton: JobsDynamicViewEnum;

  breadcrumbs = breadcrumbs;

  groupButtons = buttons;

  sessionKey = JOBS_VIEW_SESSION_KEY;

  JobsDynamicViewEnum = JobsDynamicViewEnum;

  queryParams = signal(this.activatedRoute?.snapshot?.queryParams || {});

  private isFirstLoad = true;

  private fullStory = inject(FullStoryService);

  constructor() {
    this._handleNavigationToRoute();
  }

  ngOnInit(): void {
    this.fullStory.setPage({pageName: 'jobs'});
  }

  ngOnDestroy(): void {
    this._clearQueryParams();
  }

  getView(nextView: string): JobsDynamicViewEnum {
    switch (nextView) {
      case JobsDynamicViewEnum.ETL:
      case JobsDynamicViewEnum.PERFECT_TRANSFORM:
        return nextView;
      default:
        return JOBS_DEFAULT_VIEW;
    }
  }

  onFiltersParamsChanged(params: Params): void {
    this.updateQueryParams(params);
  }

  onGroupButtonChanged(selected: JobsDynamicViewEnum): void {
    setTimeout(() => {
      this.userPreferencesService.addUserPreferences(this.sessionKey, selected);
      this.queryParams.set({});
      this.updateQueryParams(null);
    });
  }

  updateQueryParams(params: Params): void {
    const prevParams = {};
    //only for first load we should not remove initial query params
    if (!this.isFirstLoad) {
      const _activeParams: Params = {
        ...(this.activatedRoute?.snapshot?.queryParams || {}),
      };
      for (const key in _activeParams) {
        if (_activeParams.hasOwnProperty(key)) {
          prevParams[key] = null;
        }
      }
      this.queryParams.set(prevParams);
    }
    this.isFirstLoad = false;
    const nextParams = {
      ...this.queryParams(),
      ...params,
      view: this.selectedGroupButton,
    };

    this.queryParams.set(nextParams);
    const url = this.router
      .createUrlTree([], {
        queryParams: nextParams,
        queryParamsHandling: 'merge',
      })
      ?.toString();

    this.location?.go(url);
  }

  private _deleteTabViewFromDeepLink(params: Params): void {
    const updatedParams = {...params, view: params[TAB_VIEW_PARAM]};
    delete updatedParams[TAB_VIEW_PARAM];

    this.queryParams.set(updatedParams);
    this.router.navigate(['jobs'], {
      replaceUrl: true,
      queryParams: updatedParams,
    });
  }

  private _clearQueryParams(): void {
    const resetParams = {};
    const activeParams = this.router.parseUrl(this.router.url)?.queryParams || {};

    for (const prob in activeParams) {
      resetParams[prob] = null;
    }

    this.queryParams.set(null);
    const url = this.router
      .createUrlTree([], {
        queryParams: null,
        queryParamsHandling: 'merge',
      })
      ?.toString();

    this.location?.go(url);
  }

  private _handleNavigationToRoute(): void {
    this.activatedRoute.queryParams
      .pipe(
        // take only the first emit, the second emit has empty params always
        throttleTime(100),
        untilDestroyed(this),
      )
      .subscribe(async (params: Params) => {
        const nextView =
          params?.[TAB_VIEW_PARAM] ||
          params?.view ||
          this.userPreferencesService.getUserPreferencesByKey(this.sessionKey);

        this.selectedGroupButton = this.getView(nextView);
        if (params?.[TAB_VIEW_PARAM]) {
          this._deleteTabViewFromDeepLink(params);
        } else {
          this.updateQueryParams(null);
        }
      });
  }
}
