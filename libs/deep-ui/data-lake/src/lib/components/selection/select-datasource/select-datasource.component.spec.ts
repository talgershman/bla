import {MatButtonModule} from '@angular/material/button';
import {ActivatedRoute} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MePortalSrcDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DataSourceTablesComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/data-source-tables/data-source-tables.component';
import {DatasourceService} from 'deep-ui/shared/core';
import {of} from 'rxjs';

import {SelectDatasourceComponent} from './select-datasource.component';

describe('SelectDatasourceComponent', () => {
  let spectator: Spectator<SelectDatasourceComponent>;

  const createComponent = createComponentFactory({
    component: SelectDatasourceComponent,
    imports: [
      MatButtonModule,
      DataSourceTablesComponent,
      RouterTestingModule,
      MePortalSrcDirective,
    ],
    mocks: [DatasourceService, MeLoadingService],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          queryParams: of({
            view: DataSourceDynamicViewEnum.PERFECTS,
          }),
        },
      },
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
