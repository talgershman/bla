import {LoadSuccessParams} from '@ag-grid-community/core';
import {CdkStepperModule} from '@angular/cdk/stepper';
import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatButtonHarness} from '@angular/material/button/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {MeAzureGraphService} from '@mobileye/material/src/lib/services/azure-graph';
import {getElementBySelector} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {
  AgDatasourceService,
  DatasetService,
  DatasourceService,
  VersionDatasourceService,
} from 'deep-ui/shared/core';
import {Dataset} from 'deep-ui/shared/models';
import {
  getFakeDataset,
  getFakePerfectDatasource,
  getFakeQEAttributes,
  getFakeQueryJson,
} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {
  QueryEngineService,
  ValidateQueryJsonResponse,
} from '../../../services/query-engine/query-engine.service';
import {
  ExecuteQueryMessage,
  ExecuteQueryWebSocketsManagerService,
} from '../../../services/web-sockets-manager/execute-query/execute-query-web-sockets-manager.service';
import {
  clickAddSubQuery,
  clickEditSubQuery,
  clickRemoveSubQuery,
  clickRunQuery,
  clickViewOnlySubQuery,
  fillDatasetForm,
  fillQueryBuilderStep,
  selectDatasource,
  submitDataset,
} from '../../../testing/dataset-stepper-testing';
import {DatasetFormComponent} from '../../forms/dataset-form/dataset-form.component';
import {QueryStepperComponent} from '../query-stepper/query-stepper.component';
import {StepperContainerComponent} from '../stepper-container/stepper-container.component';
import {DatasetStepperComponent} from './dataset-stepper.component';

const fakeDataSource = getFakePerfectDatasource(true).fakeDataSource;
const dataSources = [
  fakeDataSource,
  getFakePerfectDatasource(true).fakeDataSource,
  getFakePerfectDatasource(true, {dataSubType: fakeDataSource.dataSubType}).fakeDataSource,
];

describe('DatasetStepperComponent - Integration', () => {
  let spectator: Spectator<DatasetStepperComponent>;
  let datasourceService: SpyObject<DatasourceService>;
  let agDatasourceService: SpyObject<AgDatasourceService>;
  let datasetService: SpyObject<DatasetService>;
  let queryEngineService: SpyObject<QueryEngineService>;
  let executeQueryWebSocketsManagerService: jasmine.SpyObj<ExecuteQueryWebSocketsManagerService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: DatasetStepperComponent,
    imports: [
      StepperContainerComponent,
      CdkStepperModule,
      DatasetFormComponent,
      QueryStepperComponent,
      RouterTestingModule,
    ],
    mocks: [
      MeAzureGraphService,
      ExecuteQueryWebSocketsManagerService,
      DatasetService,
      DatasourceService,
      AgDatasourceService,
      QueryEngineService,
    ],
    providers: [VersionDatasourceService],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    datasetService = spectator.inject(DatasetService);
    datasetService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
    datasourceService = spectator.inject(DatasourceService);
    agDatasourceService = spectator.inject(AgDatasourceService);
    queryEngineService = spectator.inject(QueryEngineService);
    executeQueryWebSocketsManagerService = spectator.inject(ExecuteQueryWebSocketsManagerService);
    datasourceService.getSingle.withArgs(dataSources[0].id).and.returnValue(of(dataSources[0]));
    datasourceService.getSingle.withArgs(dataSources[1].id).and.returnValue(of(dataSources[1]));
    datasourceService.getSingle.withArgs(dataSources[2].id).and.returnValue(of(dataSources[2]));
    queryEngineService.asyncValidationForQueryJson.and.returnValue(
      of({
        invalid: [],
      } as ValidateQueryJsonResponse),
    );
    datasourceService.getMulti.and.returnValue(of(dataSources));
    agDatasourceService.getMulti.and.returnValue(
      of({
        rowData: dataSources,
        rowCount: -1,
      } as LoadSuccessParams),
    );
    spectator.component.selectedDataSources = [];
    spectator.component.subQueries = [];
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
  });

  describe('Flows', () => {
    let dataset: Dataset;
    beforeEach(() => {
      const fakeAttributes = getFakeQEAttributes();
      dataset = getFakeDataset(true, dataSources[0]);
      datasourceService.getSingle.withArgs(dataSources[0].id).and.returnValue(of(dataSources[0]));
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

    it('create dataset with multi sub queries', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await fillDatasetForm(dataset, spectator.fixture, loader, docLoader);
      // first sub query
      await clickAddSubQuery(spectator.fixture);
      await selectDatasource(spectator.fixture, loader, 'Perfects', dataSources[0].name);
      await fillQueryBuilderStep(spectator.fixture, loader, docLoader, 1);

      // second sub query
      await clickAddSubQuery(spectator.fixture);
      await selectDatasource(spectator.fixture, loader, 'Perfects', dataSources[2].name);
      await fillQueryBuilderStep(spectator.fixture, loader, docLoader, 1);

      await clickRunQuery(spectator.fixture, loader);
      await submitDataset(spectator.fixture, loader, false);

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: dataset.name,
          team: 'deep-fpa-objects',
          pathOnS3: 'some-path',
          queryString: 'some query string',
        }),
      );
    });

    it('edit dataset change sub queries', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.component.dataset = getFakeDataset(true, dataSources[0]);
      spectator.component.subQueries = spectator.component.dataset.queryJson;
      spectator.component.subQueries[0].dataSource = dataSources[0];
      spectator.component.selectedDataSources = [{...dataSources[0]}];
      spectator.component.mode = 'edit';
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await fillDatasetForm({}, spectator.fixture, loader, docLoader);
      // edit sub query
      await clickEditSubQuery(spectator.fixture, loader, dataSources[0].name);
      await fillQueryBuilderStep(spectator.fixture, loader, docLoader, 1, true);

      // second sub query
      await clickAddSubQuery(spectator.fixture);
      await selectDatasource(spectator.fixture, loader, 'Perfects', dataSources[2].name);
      await fillQueryBuilderStep(spectator.fixture, loader, docLoader, 1);

      await clickRunQuery(spectator.fixture, loader);
      await submitDataset(spectator.fixture, loader, true);

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          pathOnS3: 'some-path',
          queryString: 'some query string',
        }),
      );
    });

    it('edit dataset change sub queries - should show validation error on sub query container', async () => {
      spectator.component.dataset = getFakeDataset(true, dataSources[0]);
      spectator.component.subQueries = spectator.component.dataset.queryJson;
      spectator.component.subQueries[0].dataSource = dataSources[0];
      spectator.component.selectedDataSources = [{...dataSources[0]}];
      spectator.component.mode = 'edit';
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await fillDatasetForm({}, spectator.fixture, loader, docLoader);
      // edit sub query
      await clickEditSubQuery(spectator.fixture, loader, dataSources[0].name);
      await fillQueryBuilderStep(spectator.fixture, loader, docLoader, 1, true);

      await submitDataset(spectator.fixture, loader, true);
      const runQueryContainerError = getElementBySelector(
        spectator.fixture,
        '.query-container.invalid-border',
      );

      expect(runQueryContainerError).not.toBeNull();
    });

    it('edit dataset - no sub queries - should show validation on add query button', async () => {
      spectator.component.dataset = getFakeDataset(true, dataSources[0]);
      spectator.component.subQueries = spectator.component.dataset.queryJson;
      spectator.component.subQueries[0].dataSource = dataSources[0];
      spectator.component.selectedDataSources = [{...dataSources[0]}];
      spectator.component.mode = 'edit';
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await fillDatasetForm({}, spectator.fixture, loader, docLoader);
      // remove sub query
      await clickRemoveSubQuery(spectator.fixture, loader, dataSources[0].name);

      await submitDataset(spectator.fixture, loader, true);
      const runQueryContainerError = getElementBySelector(
        spectator.fixture,
        '.query-container.invalid-border',
      );
      const addQueryButtonError = getElementBySelector(
        spectator.fixture,
        '.add-query-button.invalid-border',
      );

      expect(runQueryContainerError).not.toBeNull();
      expect(addQueryButtonError).not.toBeNull();
    });

    it('invalid dataSources, run query disabled', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      const invalidDataSource = getFakePerfectDatasource(true, {status: 'inactive'}).fakeDataSource;

      spectator.component.dataset = getFakeDataset(true, invalidDataSource);
      spectator.component.subQueries = spectator.component.dataset.queryJson;
      spectator.component.subQueries[0].dataSource = invalidDataSource;
      spectator.component.selectedDataSources = [{...invalidDataSource}];
      spectator.component.mode = 'edit';
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const button = await loader.getHarness<MatButtonHarness>(
        MatButtonHarness.with({selector: '.run-query-button'}),
      );
      const isDisabled = await button.isDisabled();
      const error = getElementBySelector(spectator.fixture, 'mat-error');

      expect(isDisabled).toBeTrue();
      expect(error.nativeElement.innerText).toBe(
        ' Unable to run query, one of the Data Sources is inactive',
      );
    });

    it('invalid dataSources, show edit only mode in query builder', async () => {
      const invalidDataSource = getFakePerfectDatasource(true, {status: 'inactive'}).fakeDataSource;

      spectator.component.dataset = getFakeDataset(true, invalidDataSource);
      spectator.component.subQueries = spectator.component.dataset.queryJson;
      spectator.component.subQueries[0].dataSource = invalidDataSource;
      spectator.component.selectedDataSources = [{...invalidDataSource}];
      spectator.component.mode = 'edit';
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await clickViewOnlySubQuery(spectator.fixture, loader, invalidDataSource.name);
      // check there is no edit query button
      const editQueryButton = getElementBySelector(spectator.fixture, '.save-button');

      expect(editQueryButton).toBeNull();
      // check the controls are disabled
      const isDisabled = getElementBySelector(spectator.fixture, '.mat-select-disabled');

      expect(isDisabled).toBeDefined();
    });

    it('dataSource updating, run query disabled', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      const updateDataSource = getFakePerfectDatasource(true, {status: 'updating'}).fakeDataSource;
      spectator.component.dataset = getFakeDataset(true, updateDataSource);
      spectator.component.subQueries = spectator.component.dataset.queryJson;
      spectator.component.subQueries[0].dataSource = updateDataSource;
      spectator.component.selectedDataSources = [{...updateDataSource}];
      spectator.component.mode = 'edit';
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const button = await loader.getHarness<MatButtonHarness>(
        MatButtonHarness.with({selector: '.run-query-button'}),
      );
      const isDisabled = await button.isDisabled();
      const error = getElementBySelector(spectator.fixture, 'mat-error');

      expect(isDisabled).toBeTrue();
      expect(error.nativeElement.innerText).toBe(
        ' Unable to run query, one of the Data Sources is updating... please come back later',
      );
    });
  });
});
