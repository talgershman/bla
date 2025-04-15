import {AsyncPipe} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {ActivatedRoute} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeChipsGroupButtonsComponent} from '@mobileye/material/src/lib/components/chips-group-buttons';
import {MePortalTargetDirective} from '@mobileye/material/src/lib/directives/portal';
import {createComponentFactory, Spectator} from '@ngneat/spectator';
import {DataSourceTableBaseService} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {AgDataSourceTableDeSearchComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-de-search';
import {AgDataSourceTableEtlResultsComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-etl-results';
import {AgDataSourceTableGoldenLabelsComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-golden-labels';
import {AgDataSourceTableMestsComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-mests';
import {AgDataSourceTablePerfectsComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-perfects';
import {AgDataSourceTableSimulatorComponent} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/ag-data-source-table-simulator';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {ToastrService} from 'ngx-toastr';

import {DataSourceTablesComponent} from './data-source-tables.component';

describe('DataSourceTablesComponent', () => {
  let spectator: Spectator<DataSourceTablesComponent>;
  const createComponent = createComponentFactory({
    component: DataSourceTablesComponent,
    detectChanges: false,
    imports: [
      MatButtonModule,
      MePortalTargetDirective,
      RouterTestingModule,
      MeChipsGroupButtonsComponent,
      MePortalTargetDirective,
      AsyncPipe,
      AgDataSourceTableDeSearchComponent,
      AgDataSourceTablePerfectsComponent,
      AgDataSourceTableGoldenLabelsComponent,
      AgDataSourceTableSimulatorComponent,
      AgDataSourceTableMestsComponent,
      AgDataSourceTableEtlResultsComponent,
      MeChipsGroupButtonsComponent,
    ],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: {
              view: DataSourceDynamicViewEnum.PERFECTS,
            },
          },
        },
      },
      DataSourceTableBaseService,
    ],
    mocks: [ActivatedRoute, ToastrService],
  });

  it('should create', () => {
    spectator = createComponent();

    expect(spectator.component).toBeTruthy();
  });
});
