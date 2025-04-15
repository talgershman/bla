import {MatButtonModule} from '@angular/material/button';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {ActivatedRoute} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeClientSideTableComponent} from '@mobileye/material/src/lib/components/ag-table/client-side-table';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DataSourceTableBaseService} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {DatasourceService} from 'deep-ui/shared/core';
import {Datasource} from 'deep-ui/shared/models';
import {getFakeDeSearchDataSource, getFakePerfectDatasource} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {AgDataSourceTableDeSearchComponent} from './ag-data-source-table-de-search.component';

const deSearchDataSource = getFakeDeSearchDataSource();
const fakeDataSourcesResponse: Array<Datasource> = [deSearchDataSource];

describe('AgDataSourceTableDeSearchComponent', () => {
  let spectator: Spectator<AgDataSourceTableDeSearchComponent>;
  let datasourceService: SpyObject<DatasourceService>;

  const createComponent = createComponentFactory({
    component: AgDataSourceTableDeSearchComponent,
    imports: [
      MatButtonModule,
      MatIconModule,
      MeTooltipDirective,
      MatDialogModule,
      MatDatepickerModule,
      MeClientSideTableComponent,
      RouterTestingModule,
    ],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParams: of({
              view: DataSourceDynamicViewEnum.DE_SEARCH,
            }),
          },
        },
      },
      DataSourceTableBaseService,
    ],
    mocks: [MatDialog, DatasourceService],
    detectChanges: false,
  });

  beforeEach(async () => {
    spectator = createComponent();
    datasourceService = spectator.inject(DatasourceService);
    datasourceService.getMulti.and.returnValue(of(fakeDataSourcesResponse));
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('isRowSelectable', () => {
    let rowNode;
    beforeEach(() => {
      rowNode = {
        data: deSearchDataSource,
      };
      spectator.component.selectionMode = true;
      spectator.component.selectedDataSources = [
        getFakePerfectDatasource(true, {allowedSubTypes: ['objects']}).fakeDataSource,
        rowNode.data,
      ];
    });

    it('already selected datasource - disabled', () => {
      spectator.detectChanges();

      const isSelectable = spectator.component.isRowSelectable(rowNode);

      expect(isSelectable).toBeFalsy();
    });
  });
});
