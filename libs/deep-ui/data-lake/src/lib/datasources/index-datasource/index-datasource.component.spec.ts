import {Location} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DataSourceTablesComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/data-source-tables/data-source-tables.component';
import {of} from 'rxjs';

import {IndexDatasourceComponent} from './index-datasource.component';

describe('IndexDatasetComponent', () => {
  let spectator: Spectator<IndexDatasourceComponent>;

  const createComponent = createComponentFactory({
    component: IndexDatasourceComponent,
    imports: [MeBreadcrumbsComponent, DataSourceTablesComponent, RouterTestingModule],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          queryParams: of({
            view: DataSourceDynamicViewEnum.PERFECTS,
          }),
          snapshot: {
            queryParams: of({
              view: DataSourceDynamicViewEnum.PERFECTS,
            }),
            data: {
              view: DataSourceDynamicViewEnum.PERFECTS,
            },
          },
        },
      },
    ],
    mocks: [Router, Location],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.disableRefreshInterval = true;
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
