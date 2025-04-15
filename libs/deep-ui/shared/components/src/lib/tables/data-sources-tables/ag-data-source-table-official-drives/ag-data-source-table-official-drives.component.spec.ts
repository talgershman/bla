import {ActivatedRoute} from '@angular/router';
import {MeAgTableApiService} from '@mobileye/material/src/lib/components/ag-table/services';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {DataSourceTableBaseService} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {AgDataSourceTableOfficialDrivesStandaloneComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-official-drives-standalone';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DatasourceService} from 'deep-ui/shared/core';
import {of} from 'rxjs';

import {AgDataSourceTableOfficialDrivesComponent} from './ag-data-source-table-official-drives.component';

describe('AgDataSourceTableSimulatorComponent', () => {
  let spectator: Spectator<AgDataSourceTableOfficialDrivesComponent>;

  const createComponent = createComponentFactory({
    component: AgDataSourceTableOfficialDrivesComponent,
    imports: [AgDataSourceTableOfficialDrivesStandaloneComponent],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParams: of({
              view: DataSourceDynamicViewEnum.OFFICIAL_DRIVES,
            }),
          },
        },
      },
      DataSourceTableBaseService,
      MeAgTableApiService,
    ],
    mocks: [DatasourceService, MeLoadingService],
    detectChanges: false,
  });

  beforeEach(async () => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });
});
