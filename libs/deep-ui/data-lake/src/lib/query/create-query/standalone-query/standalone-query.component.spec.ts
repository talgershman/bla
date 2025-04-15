import {CdkStepperModule} from '@angular/cdk/stepper';
import {Location} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DatasourceService} from 'deep-ui/shared/core';
import {getFakeDataset, getFakeMestDatasource} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {QueryDashboardControlComponent} from '../../../components/controls/query-dashboard-control/query-dashboard-control.component';
import {QueryStepperComponent} from '../../../components/steppers/query-stepper/query-stepper.component';
import {StepperContainerComponent} from '../../../components/steppers/stepper-container/stepper-container.component';
import {
  QueryEngineService,
  ValidateQueryJsonResponse,
} from '../../../services/query-engine/query-engine.service';
import {ExecuteQueryWebSocketsManagerService} from '../../../services/web-sockets-manager/execute-query/execute-query-web-sockets-manager.service';
import {StandaloneQueryComponent} from './standalone-query.component';

describe('StandaloneQueryComponent', () => {
  let spectator: Spectator<StandaloneQueryComponent>;
  let queryEngineService: SpyObject<QueryEngineService>;
  let router: SpyObject<Router>;

  const createComponent = createComponentFactory({
    component: StandaloneQueryComponent,
    imports: [
      RouterTestingModule,
      MeBreadcrumbsComponent,
      QueryDashboardControlComponent,
      MatButtonModule,
      QueryStepperComponent,
      StepperContainerComponent,
      CdkStepperModule,
      ReactiveFormsModule,
      RouterTestingModule,
      StandaloneQueryComponent,
    ],
    mocks: [
      QueryEngineService,
      DatasourceService,
      ExecuteQueryWebSocketsManagerService,
      MeAzureGraphService,
      Router,
      Location,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    router = spectator.inject(Router);
    queryEngineService = spectator.inject(QueryEngineService);
    spectator.component.selectedDataSources = [];
    spectator.component.subQueries = [];
    queryEngineService.asyncValidationForQueryJson.and.returnValue(
      of({
        invalid: [],
      } as ValidateQueryJsonResponse),
    );
  });

  it('should create', () => {
    spectator.detectChanges();

    expect(spectator.component).toBeTruthy();
  });

  describe('exportToDatasetClicked', () => {
    it('should redirect to dataset create', async () => {
      const datasource = getFakeMestDatasource(true).fakeDataSource;
      const dataset = getFakeDataset(true, datasource);
      spectator.component.subQueries = dataset.queryJson;
      spectator.component.selectedDataSources = [datasource];
      spectator.detectChanges();
      const value = {
        queryJson: dataset.queryJson,
        numberOfClips: 1,
        tableName: 'table 1',
        pathOnS3: 'path 1',
        queryString: 'query 1',
        queryHasFrameIndicator: true,
      };
      spectator.component.queryDashboardControl.patchValue(value);

      spectator.component.exportToDatasetClicked();

      expect(router.navigate).toHaveBeenCalledWith(['data-lake', 'datasets', 'create'], {
        state: {
          queryDashboard: value,
          selectedDataSources: [datasource],
        },
      });
    });
  });

  describe('exportToClipListClicked', () => {
    it('should redirect to create clip list', async () => {
      queryEngineService.downloadClipList.and.resolveTo(true);
      const datasource = getFakeMestDatasource(true).fakeDataSource;
      const dataset = getFakeDataset(true, datasource);
      spectator.component.subQueries = dataset.queryJson;
      spectator.component.selectedDataSources = [datasource];
      spectator.detectChanges();
      const value = {
        queryJson: dataset.queryJson,
        numberOfClips: 1,
        tableName: 'table 1',
        pathOnS3: 'path 1',
        queryString: 'query 1',
        queryHasFrameIndicator: true,
      };
      spectator.component.queryDashboardControl.patchValue(value);
      spectator.detectChanges();

      await spectator.component.exportToClipListClicked();

      expect(router.navigate).toHaveBeenCalledWith(['manage', 'clip-lists', 'create'], {
        state: {
          file: true,
        },
      });
    });
  });
});
