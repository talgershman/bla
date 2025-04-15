import {ChangeDetectionStrategy, Component, inject, Input, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {MeFadeInOutAnimation} from '@mobileye/material/src/lib/animations';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {
  DataSourceDynamicViewEnum,
  DEFAULT_DATA_SOURCE_VIEW_SESSION_KEY,
  defaultDataSourceView,
} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DataSourceTablesComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/data-source-tables';

import {breadcrumbs} from './index-datasource-entites';

@UntilDestroy()
@Component({
  selector: 'de-index-datasource',
  templateUrl: './index-datasource.component.html',
  styleUrls: ['./index-datasource.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [MeFadeInOutAnimation],
  imports: [MeBreadcrumbsComponent, DataSourceTablesComponent],
})
export class IndexDatasourceComponent implements OnInit {
  @Input()
  disableRefreshInterval: boolean;

  private userPreferencesService = inject(MeUserPreferencesService);
  private activatedRoute = inject(ActivatedRoute);

  breadcrumbs = breadcrumbs;

  defaultView: DataSourceDynamicViewEnum;

  private fullStory = inject(FullStoryService);

  ngOnInit(): void {
    this.fullStory.setPage({pageName: 'index-datasource'});
    this.activatedRoute.queryParams.pipe(untilDestroyed(this)).subscribe(async (params: Params) => {
      const queryParamDataType = DataSourceDynamicViewEnum[params.view]
        ? DataSourceDynamicViewEnum[params.view]
        : '';
      const currentView =
        queryParamDataType ||
        this.userPreferencesService.getUserPreferencesByKey(DEFAULT_DATA_SOURCE_VIEW_SESSION_KEY);

      this.defaultView = this._getView(currentView);
    });
  }

  private _getView(currentView: DataSourceDynamicViewEnum): DataSourceDynamicViewEnum {
    switch (currentView) {
      case DataSourceDynamicViewEnum.PERFECTS:
      case DataSourceDynamicViewEnum.MESTS:
      case DataSourceDynamicViewEnum.SIMULATOR:
      case DataSourceDynamicViewEnum.ETL_RESULTS:
      case DataSourceDynamicViewEnum.OFFICIAL_DRIVES:
      case DataSourceDynamicViewEnum.DE_SEARCH:
      case DataSourceDynamicViewEnum.GOLDEN_LABELS:
        return currentView;
      default:
        return defaultDataSourceView;
    }
  }
}
