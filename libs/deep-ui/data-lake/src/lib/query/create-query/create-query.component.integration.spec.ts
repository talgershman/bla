import {IServerSideGetRowsRequest, LoadSuccessParams} from '@ag-grid-community/core';
import {CdkStepperModule} from '@angular/cdk/stepper';
import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {Location} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {ActivatedRoute, Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {MeAgActionsCellComponent} from '@mobileye/material/src/lib/components/ag-table/ag-actions-cell';
import {MeAgCustomHeaderComponent} from '@mobileye/material/src/lib/components/ag-table/ag-custom-header';
import {MeAgTemplateRendererComponent} from '@mobileye/material/src/lib/components/ag-table/ag-template-renderer';
import {MeAgMultiChipsFilterComponent} from '@mobileye/material/src/lib/components/ag-table/filters/ag-multi-chips-filter';
import {MeBreadcrumbsComponent} from '@mobileye/material/src/lib/components/breadcrumbs';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {MeUserPreferencesService} from '@mobileye/material/src/lib/services/user-preferences';
import {MeButtonHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DataSourceDynamicViewEnum} from 'deep-ui/shared/components/src/lib/tables/data-sources-tables/common';
import {AgDatasourceService, DatasourceService} from 'deep-ui/shared/core';
import {Datasource, VersionDataSource} from 'deep-ui/shared/models';
import {
  getEtlResultsDatasource,
  getFakeDeSearchDataSource,
  getFakeMestDatasource,
  getFakePerfectDatasource,
  getFakeQEAttributes,
  getFakeQueryJson,
  getFakeSimulatorDatasource,
  getFakeSimulatorVersionDataSource,
  getFakeVersionDataSource,
} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {QueryDashboardControlComponent} from '../../components/controls/query-dashboard-control/query-dashboard-control.component';
import {QueryStepperComponent} from '../../components/steppers/query-stepper/query-stepper.component';
import {StepperContainerComponent} from '../../components/steppers/stepper-container/stepper-container.component';
import {
  ExecuteQueryMessage,
  ExecuteQueryWebSocketsManagerService,
} from '../../services/web-sockets-manager/execute-query/execute-query-web-sockets-manager.service';
import {
  clickAddSubQuery,
  clickRunQuery,
  fillQueryBuilderStep,
  getFakeGetMultiVersionDataSource,
  selectDatasource,
} from '../../testing/dataset-stepper-testing';
import {CreateQueryComponent} from './create-query.component';
import {StandaloneQueryComponent} from './standalone-query/standalone-query.component';

const deSearchDataSource: Datasource = getFakeDeSearchDataSource();
const fakePerfectDataSource: Datasource = getFakePerfectDatasource(true).fakeDataSource;
const fakePerfectVersions: Array<VersionDataSource> = [
  getFakeVersionDataSource(true, {userFacingVersion: '2'}),
  {
    ...fakePerfectDataSource.datasourceversionSet[0],
    userFacingVersion: '1',
  },
];
fakePerfectDataSource.latestUserVersion = '2';
fakePerfectDataSource.datasourceversionSet = fakePerfectVersions;

const fakePerfectsDataSources = [
  fakePerfectDataSource,
  getFakePerfectDatasource(true).fakeDataSource,
  getFakePerfectDatasource(true, {dataSubType: fakePerfectDataSource.dataSubType}).fakeDataSource,
];

const fakeSimulatorDataSource: Datasource = getFakeSimulatorDatasource(true).fakeDataSource;
const fakeSimulatorVersions: Array<VersionDataSource> = [
  getFakeSimulatorVersionDataSource(true, {userFacingVersion: '2'}),
  {
    ...fakeSimulatorDataSource.datasourceversionSet[0],
    userFacingVersion: '1',
  },
];
fakeSimulatorDataSource.latestUserVersion = '2';
fakeSimulatorDataSource.datasourceversionSet = fakeSimulatorVersions;

const fakeSimulatorDataSources = [
  fakeSimulatorDataSource,
  getFakeSimulatorDatasource(true).fakeDataSource,
  getFakeSimulatorDatasource(true).fakeDataSource,
];

const mestDataSources = [
  getFakeMestDatasource(true).fakeDataSource,
  getFakeMestDatasource(true).fakeDataSource,
];

const etlResultsDataSources = [
  getEtlResultsDatasource(true).fakeDataSource,
  getEtlResultsDatasource(true).fakeDataSource,
];

describe('CreateQueryComponent - Integration', () => {
  let spectator: Spectator<CreateQueryComponent>;
  let datasourceService: SpyObject<DatasourceService>;
  let agDatasourceService: SpyObject<AgDatasourceService>;
  let router: SpyObject<Router>;
  let executeQueryWebSocketsManagerService: SpyObject<ExecuteQueryWebSocketsManagerService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: CreateQueryComponent,
    imports: [
      RouterTestingModule,
      MeBreadcrumbsComponent,
      QueryDashboardControlComponent,
      MatButtonModule,
      QueryStepperComponent,
      StepperContainerComponent,
      CdkStepperModule,
      ReactiveFormsModule,
      MeAgCustomHeaderComponent,
      MeAgMultiChipsFilterComponent,
      MeAgTemplateRendererComponent,
      MeAgActionsCellComponent,
      StandaloneQueryComponent,
    ],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          queryParams: of({
            view: DataSourceDynamicViewEnum.PERFECTS,
          }),
          snapshot: {
            data: {
              viewData: {
                subQueries: [],
                selectedDataSources: [],
                onLoadGoToEditQueryIndex: null,
              },
            },
          },
        },
      },
    ],
    mocks: [
      DatasourceService,
      AgDatasourceService,
      ExecuteQueryWebSocketsManagerService,
      MeAzureGraphService,
      Router,
      Location,
      MeUserPreferencesService,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    router = spectator.inject(Router);
    datasourceService = spectator.inject(DatasourceService);
    agDatasourceService = spectator.inject(AgDatasourceService);
    executeQueryWebSocketsManagerService = spectator.inject(ExecuteQueryWebSocketsManagerService);

    router.parseUrl.and.returnValue({
      queryParams: {view: DataSourceDynamicViewEnum.PERFECTS},
    });

    //the only end point to return de-search, other end points of ds are in agDatasourceService
    datasourceService.getMulti.and.returnValue(of([deSearchDataSource]));

    agDatasourceService.getMulti.and.callFake(
      (dataType: string, requestBody: IServerSideGetRowsRequest) => {
        if (dataType === 'perfects') {
          return getFakeGetMultiVersionDataSource(
            requestBody,
            fakePerfectsDataSources,
            fakePerfectVersions,
          );
        }
        if (dataType === 'simulator') {
          return getFakeGetMultiVersionDataSource(
            requestBody,
            fakeSimulatorDataSources,
            fakeSimulatorVersions,
          );
        }
        if (dataType === 'itrks') {
          if (
            requestBody?.rowGroupCols.length &&
            requestBody?.groupKeys.includes('f3792de4-08fb-11ee-9fb2-0a58a9feac02')
          ) {
            return of({
              rowData: mestDataSources,
              rowCount: 2,
            } as LoadSuccessParams);
          } else {
            return of({
              rowData: [
                {
                  jobId: 'f3792de4-08fb-11ee-9fb2-0a58a9feac02',
                  childCount: 2,
                },
                {
                  jobId: '8b16639e-054e-11ee-9a27-0a58a9feac02',
                  childCount: 2,
                },
              ],
              rowCount: -1,
            } as LoadSuccessParams);
          }
        }
        if (dataType === 'etl_results') {
          if (requestBody?.groupKeys.includes('dummy-single-version')) {
            if (requestBody?.groupKeys.length === 2) {
              return of({
                rowData: [
                  {
                    id: Math.floor(1000 + Math.random() * 9000).toString(),
                    nickname: 'output 1',
                    etlName: 'dummy-single-version',
                    name: 'ds 1',
                    status: 'active',
                    childCount: 2,
                  },
                  {
                    id: Math.floor(1000 + Math.random() * 9000).toString(),
                    nickname: 'output 2',
                    etlName: 'dummy-single-version',
                    name: 'ds 2',
                    status: 'active',
                    childCount: 1,
                  },
                ],
                rowCount: 2,
              } as LoadSuccessParams);
            } else if (requestBody?.rowGroupCols.length === 2) {
              return of({
                rowData: [
                  {
                    id: Math.floor(1000 + Math.random() * 9000).toString(),
                    nickname: 'output 1',
                    etlName: 'dummy-single-version',
                    childCount: 2,
                  },
                  {
                    id: Math.floor(1000 + Math.random() * 9000).toString(),
                    nickname: 'output 2',
                    etlName: 'dummy-single-version',
                    childCount: 1,
                  },
                ],
                rowCount: 2,
              } as LoadSuccessParams);
            } else if (requestBody?.groupKeys?.length === 1) {
              return of({
                rowData: [
                  {
                    id: Math.floor(1000 + Math.random() * 9000).toString(),
                    nickname: 'alias 1',
                    childCount: 2,
                  },
                  {
                    id: Math.floor(1000 + Math.random() * 9000).toString(),
                    etlName: 'alias 2',
                    childCount: 1,
                  },
                ],
                rowCount: 2,
              } as LoadSuccessParams);
            } else {
              return of({
                rowData: etlResultsDataSources,
                rowCount: 2,
              } as LoadSuccessParams);
            }
          } else {
            return of({
              rowData: [
                {
                  id: Math.floor(1000 + Math.random() * 9000).toString(),
                  etlName: 'dummy-c2p',
                  childCount: 2,
                },
                {
                  id: Math.floor(1000 + Math.random() * 9000).toString(),
                  etlName: 'dummy-single-version',
                  childCount: 2,
                },
              ],
              rowCount: -1,
            } as LoadSuccessParams);
          }
        }
        throw Error('invalid dataType');
      },
    );
    spectator.component.selectedDataSources = [];
    spectator.component.subQueries = [];
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
  });

  describe('Flows', () => {
    beforeEach(() => {
      const fakeAttributes = getFakeQEAttributes();
      datasourceService.getAttributes.and.returnValue(of(fakeAttributes));
      executeQueryWebSocketsManagerService.connect.and.returnValue(of(true));
      const cacheResult: ExecuteQueryMessage = {
        status: 200,
        queryJson: getFakeQueryJson('', true),
        content: {
          pathOnS3: 'some-path',
          queryString: 'some query string',
          columns: [],
          statistics: {
            numberOfClips: 10,
          },
          tableName: 'result_e88b96be0b57400381d7dd2e6d612e5f',
          hasFrameIndicator: true,
        },
      };
      executeQueryWebSocketsManagerService.send.and.returnValue(cacheResult);
    });

    it('create query with multi sub queries - export to dataset', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      // first sub query
      await clickAddSubQuery(spectator.fixture);
      await selectDatasource(
        spectator.fixture,
        loader,
        'Perfects',
        fakePerfectsDataSources[0].name,
      );
      await fillQueryBuilderStep(spectator.fixture, loader, docLoader, 1);
      // second sub query
      await clickAddSubQuery(spectator.fixture);
      await selectDatasource(
        spectator.fixture,
        loader,
        'Perfects',
        fakePerfectsDataSources[2].name,
      );
      await fillQueryBuilderStep(spectator.fixture, loader, docLoader, 1);

      await clickRunQuery(spectator.fixture, loader);
      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Export To Dataset'});

      expect(router.navigate).toHaveBeenCalled();
    });

    it('create a query single on - perfects source - latest version', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      // first sub query
      await clickAddSubQuery(spectator.fixture);
      await selectDatasource(
        spectator.fixture,
        loader,
        'Perfects',
        fakePerfectsDataSources[0].name,
      );
      await fillQueryBuilderStep(spectator.fixture, loader, docLoader, 3, false, false, 3);

      await clickRunQuery(spectator.fixture, loader);
      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Export To Dataset'});

      expect(router.navigate).toHaveBeenCalled();
    });

    it('create a query single on - perfects source - fixed version', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      // first sub query
      await clickAddSubQuery(spectator.fixture);
      await selectDatasource(
        spectator.fixture,
        loader,
        'Perfects',
        fakePerfectVersions[1].userFacingVersion,
        0,
      );
      await fillQueryBuilderStep(spectator.fixture, loader, docLoader, 1, false, true);

      await clickRunQuery(spectator.fixture, loader);
      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Export To Dataset'});

      expect(router.navigate).toHaveBeenCalled();
    });

    it('create a query single on - simulator source - latest version', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      // first sub query
      await clickAddSubQuery(spectator.fixture);
      await selectDatasource(
        spectator.fixture,
        loader,
        'Simulator',
        fakeSimulatorDataSources[0].name,
      );
      await fillQueryBuilderStep(spectator.fixture, loader, docLoader, 1, false, false, 1);

      await clickRunQuery(spectator.fixture, loader);
      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Export To Dataset'});

      expect(router.navigate).toHaveBeenCalled();
    });

    it('create a query single on - simulator source - fixed version', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      // first sub query
      await clickAddSubQuery(spectator.fixture);
      await selectDatasource(
        spectator.fixture,
        loader,
        'Simulator',
        fakeSimulatorDataSources[0].datasourceversionSet[0].userFacingVersion,
        0,
      );
      await fillQueryBuilderStep(spectator.fixture, loader, docLoader, 1, false, true);

      await clickRunQuery(spectator.fixture, loader);
      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Export To Dataset'});

      expect(router.navigate).toHaveBeenCalled();
    });

    it('create a query single on - mest data source', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      // first sub query
      await clickAddSubQuery(spectator.fixture);
      await selectDatasource(spectator.fixture, loader, 'MEST', mestDataSources[0].name, 0);
      await fillQueryBuilderStep(spectator.fixture, loader, docLoader, 1, false, true);

      await clickRunQuery(spectator.fixture, loader);
      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Export To Dataset'});

      expect(router.navigate).toHaveBeenCalled();
    });

    it('create a query single on - etl results source', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      // first sub query
      await clickAddSubQuery(spectator.fixture);
      await selectDatasource(
        spectator.fixture,
        loader,
        'ETL Results',
        etlResultsDataSources[1].name,
        -1,
        [1, 2],
      );
      await fillQueryBuilderStep(spectator.fixture, loader, docLoader, 1, false, true);

      await clickRunQuery(spectator.fixture, loader);
      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Export To Dataset'});

      expect(router.navigate).toHaveBeenCalled();
    });

    it('create a query single on - de search source', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      // first sub query
      await clickAddSubQuery(spectator.fixture);
      await selectDatasource(spectator.fixture, loader, 'DE-Search', deSearchDataSource.name);
      await fillQueryBuilderStep(spectator.fixture, loader, docLoader, 1, false, true);

      await clickRunQuery(spectator.fixture, loader);
      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Export To Dataset'});

      expect(router.navigate).toHaveBeenCalled();
    });
  });
});
