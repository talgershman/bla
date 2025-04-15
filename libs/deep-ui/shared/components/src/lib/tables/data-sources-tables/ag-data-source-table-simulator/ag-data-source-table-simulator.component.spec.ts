import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {ActivatedRoute} from '@angular/router';
import {MeAgActionsCellComponent} from '@mobileye/material/src/lib/components/ag-table/ag-actions-cell';
import {MeAgCustomHeaderComponent} from '@mobileye/material/src/lib/components/ag-table/ag-custom-header';
import {MeAgTemplateRendererComponent} from '@mobileye/material/src/lib/components/ag-table/ag-template-renderer';
import {MeAgMultiChipsFilterComponent} from '@mobileye/material/src/lib/components/ag-table/filters/ag-multi-chips-filter';
import {MeAgTableApiService} from '@mobileye/material/src/lib/components/ag-table/services';
import {MePortalSrcDirective} from '@mobileye/material/src/lib/directives/portal';
import {MeLoadingService} from '@mobileye/material/src/lib/services/loading';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {DataSourceTableBaseService} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {AgDataSourceTableSimulatorStandaloneComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-simulator-standalone';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DatasourceService} from 'deep-ui/shared/core';
import {of} from 'rxjs';

import {AgDataSourceTableSimulatorComponent} from './ag-data-source-table-simulator.component';

describe('AgDataSourceTableSimulatorComponent', () => {
  let spectator: Spectator<AgDataSourceTableSimulatorComponent>;

  const createComponent = createComponentFactory({
    component: AgDataSourceTableSimulatorComponent,
    imports: [
      MatButtonModule,
      MatDialogModule,
      MePortalSrcDirective,
      MatIconModule,
      MeAgCustomHeaderComponent,
      MeAgMultiChipsFilterComponent,
      MeAgTemplateRendererComponent,
      MeAgActionsCellComponent,
      AgDataSourceTableSimulatorStandaloneComponent,
    ],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParams: of({
              view: DataSourceDynamicViewEnum.SIMULATOR,
            }),
          },
        },
      },
      DataSourceTableBaseService,
      MeAgTableApiService,
      MatDialog,
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
