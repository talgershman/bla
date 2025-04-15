import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {RouterTestingModule} from '@angular/router/testing';
import {MeFormControlChipsFieldComponent} from '@mobileye/material/src/lib/components/form/chips';
import {MeInputComponent} from '@mobileye/material/src/lib/components/form/input';
import {MeSelectComponent} from '@mobileye/material/src/lib/components/form/select';
import {MeTextareaComponent} from '@mobileye/material/src/lib/components/form/textarea';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {
  MeButtonHarness,
  MeChipHarness,
  MeInputHarness,
  MeSelectHarness,
} from '@mobileye/material/src/lib/testing';
import {addDaysToDate, dateNow, toShortDate} from '@mobileye/material/src/lib/utils';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DataRetentionService, DatasetService, DatasourceService} from 'deep-ui/shared/core';
import {DataRetentionKnownKeysEnum} from 'deep-ui/shared/models';
import {getFakeDataset, getFakePerfectDatasource, getFakeQueryJson} from 'deep-ui/shared/testing';
import {NgxMaskPipe, provideEnvironmentNgxMask} from 'ngx-mask';
import {of} from 'rxjs';

import {QueryUtilService} from '../../../query-utils/query-util.service';
import {
  QueryEngineService,
  ValidateQueryJsonResponse,
} from '../../../services/query-engine/query-engine.service';
import {ExecuteQueryWebSocketsManagerService} from '../../../services/web-sockets-manager/execute-query/execute-query-web-sockets-manager.service';
import {ExpiredAtDataRetentionControlComponent} from '../../controls/expired-at-data-retention-control/expired-at-data-retention-control.component';
import {QueryDashboardControlComponent} from '../../controls/query-dashboard-control/query-dashboard-control.component';
import {DatasetFormComponent} from './dataset-form.component';
import {DatasetFormService} from './dataset-form.service';

const fakeDatasource = getFakePerfectDatasource(true).fakeDataSource;
const queryJson = getFakeQueryJson(fakeDatasource.id)[0];
const dataset = getFakeDataset(true, fakeDatasource, {
  queryJson: [queryJson],
  allowJumpFile: true,
});
const dataRetentionInfo = {
  [DataRetentionKnownKeysEnum.DATASETS]: {
    default: 60,
    max: 365,
    label: 'Datasets',
    tooltip: 'Datasets will be deleted on the date selected',
    job_types: [],
    allowPermanent: true,
  },
};
const dataRetentionObj = {
  [DataRetentionKnownKeysEnum.DATASETS]: toShortDate(
    addDaysToDate(dateNow(), dataRetentionInfo[DataRetentionKnownKeysEnum.DATASETS].default),
  ),
};

describe('DatasetFormComponent - Integration', () => {
  let spectator: Spectator<DatasetFormComponent>;
  let datasetService: SpyObject<DatasetService>;
  let queryEngineService: SpyObject<QueryEngineService>;
  let dataRetentionService: SpyObject<DataRetentionService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;
  const fakeQueryJson = getFakeQueryJson('', true);

  const createComponent = createComponentFactory({
    component: DatasetFormComponent,
    imports: [
      MatButtonModule,
      MeInputComponent,
      MeTextareaComponent,
      MeSelectComponent,
      MatIconModule,
      ReactiveFormsModule,
      MeTooltipDirective,
      MatFormFieldModule,
      MatCheckboxModule,
      HintIconComponent,
      NgxMaskPipe,
      QueryDashboardControlComponent,
      RouterTestingModule,
      ExpiredAtDataRetentionControlComponent,
      MeFormControlChipsFieldComponent,
    ],
    providers: [DatasetFormService, QueryUtilService, provideEnvironmentNgxMask()],
    mocks: [
      ExecuteQueryWebSocketsManagerService,
      DatasetService,
      DatasourceService,
      MeDownloaderService,
      QueryEngineService,
      DataRetentionService,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    datasetService = spectator.inject(DatasetService);
    queryEngineService = spectator.inject(QueryEngineService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    datasetService.checkDuplicateName.and.returnValue(of({isDuplicate: false}));
    queryEngineService.asyncValidationForQueryJson.and.returnValue(
      of({
        invalid: [],
      } as ValidateQueryJsonResponse),
    );
    dataRetentionService = spectator.inject(DataRetentionService);
    dataRetentionService.getDataRetentionConfig.and.returnValue(of(dataRetentionInfo));
    dataRetentionService.getDatasetDataRetentionConfig.and.returnValue(dataRetentionInfo);
  });

  describe('Create', () => {
    beforeEach(() => {
      spectator.component.formMode = 'create';
      spectator.component.subQueries = [];
      spectator.component.selectedDataSources = [];
    });

    it('valid - should create', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      // set name
      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Dataset Name"]'},
        'name1',
      );
      // set team
      await MeSelectHarness.selectOptionByText(
        spectator.fixture,
        loader,
        docLoader,
        {ancestor: '[title="Team"]'},
        'deep-fpa-objects',
      );

      await MeInputHarness.setValue(
        spectator.fixture,
        loader,
        {ancestor: '[title="Description (Optional)"]'},
        `some desc text`,
      );

      await MeChipHarness.addTag(
        spectator.fixture,
        loader,
        {ancestor: '[title="Tags (Optional)"]'},
        'new-tag',
      );

      spectator.component.datasetForm.controls.queryDashboard.setValue({
        queryJson: fakeQueryJson,
        tableName: 'table 1',
        numberOfClips: 10,
        queryString: 'some query string',
        pathOnS3: 'path on s3',
        queryHasFrameIndicator: true,
      });

      spectator.fixture.detectChanges();
      await spectator.fixture.whenStable();

      // click submit
      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Create Dataset'});

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith({
        name: 'name1',
        team: 'deep-fpa-objects',
        description: 'some desc text',
        queryJson: fakeQueryJson,
        queryString: 'some query string',
        pathOnS3: 'path on s3',
        numberOfClips: 10,
        tags: ['new-tag'],
        expirationDate: dataRetentionObj[DataRetentionKnownKeysEnum.DATASETS],
      });
    });
  });

  describe('Edit', () => {
    beforeEach(() => {
      spectator.component.formMode = 'edit';

      spectator.component.dataset = dataset;
      spectator.component.subQueries = spectator.component.dataset.queryJson;
      spectator.component.selectedDataSources = [fakeDatasource];
    });

    it('valid - should create', async () => {
      spyOn(spectator.component.fromValueChanged, 'emit');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.datasetForm.controls.queryDashboard.setValue({
        queryJson: fakeQueryJson,
        tableName: 'table 2',
        numberOfClips: 30,
        queryString: 'some query string',
        pathOnS3: 'other path on s3',
        queryHasFrameIndicator: true,
      });
      spectator.component.datasetForm.controls.dataRetention.setValue(dataRetentionObj);

      spectator.fixture.detectChanges();
      await spectator.fixture.whenStable();

      // click submit
      await MeButtonHarness.click(spectator.fixture, loader, {text: 'Update Dataset'});

      expect(spectator.component.fromValueChanged.emit).toHaveBeenCalledWith({
        queryJson: fakeQueryJson,
        queryString: 'some query string',
        pathOnS3: 'other path on s3',
        numberOfClips: 30,
        expirationDate: dataRetentionObj[DataRetentionKnownKeysEnum.DATASETS],
      });
    });
  });
});
