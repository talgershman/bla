import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {NgTemplateOutlet} from '@angular/common';
import {discardPeriodicTasks, fakeAsync, flush} from '@angular/core/testing';
import {FormControl, NgControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {AutocompleteChipsComponent} from '@mobileye/material/src/lib/components/form/autocomplete-chips';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {MeButtonHarness} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DatasetService, DatasourceService} from 'deep-ui/shared/core';
import {SelectedSubQuery} from 'deep-ui/shared/models';
import {
  getFakeDataset,
  getFakePerfectDatasource,
  getFakeQEAttributes,
  getFakeQueryJson,
} from 'deep-ui/shared/testing';
import _cloneDeep from 'lodash-es/cloneDeep';
import {NgxMaskPipe, provideEnvironmentNgxMask} from 'ngx-mask';
import {of} from 'rxjs';

import {QueryUtilService} from '../../../query-utils/query-util.service';
import {
  QueryEngineService,
  ValidateQueryJsonResponse,
} from '../../../services/query-engine/query-engine.service';
import {
  ExecuteQueryMessage,
  ExecuteQueryWebSocketsManagerService,
} from '../../../services/web-sockets-manager/execute-query/execute-query-web-sockets-manager.service';
import {QueryDashboardControlComponent} from './query-dashboard-control.component';
import {QueryDashboardControlService} from './query-dashboard-control.service';
import {SubQuerySquareComponent} from './sub-query-square/sub-query-square.component';

const fakeDatasource = getFakePerfectDatasource(true).fakeDataSource;
const fakeAttr = getFakeQEAttributes();
const queryJson = getFakeQueryJson(fakeDatasource.id)[0];
const fakeSubQuery: SelectedSubQuery = getFakeQueryJson(fakeDatasource.id)[0];
const dataset = getFakeDataset(true, fakeDatasource, {
  queryJson: [queryJson],
  allowJumpFile: true,
});

describe('QueryDashboardControlComponent - Integration', () => {
  let spectator: Spectator<QueryDashboardControlComponent>;
  let executeQueryWebSocketsManagerService: SpyObject<ExecuteQueryWebSocketsManagerService>;
  let datasourceService: SpyObject<DatasourceService>;
  let queryEngineService: SpyObject<QueryEngineService>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: QueryDashboardControlComponent,
    componentProviders: [{provide: NgControl, useValue: {control: new FormControl()}}],
    imports: [
      NgxMaskPipe,
      MatProgressSpinnerModule,
      MatIconModule,
      MatMenuModule,
      ReactiveFormsModule,
      MatFormFieldModule,
      HintIconComponent,
      MeTooltipDirective,
      MatButtonModule,
      AutocompleteChipsComponent,
      MatDialogModule,
      SubQuerySquareComponent,
      NgTemplateOutlet,
    ],
    providers: [QueryDashboardControlService, QueryUtilService, provideEnvironmentNgxMask()],
    mocks: [
      ExecuteQueryWebSocketsManagerService,
      DatasetService,
      DatasourceService,
      MeDownloaderService,
      QueryEngineService,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    executeQueryWebSocketsManagerService = spectator.inject(ExecuteQueryWebSocketsManagerService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.component.dataset = dataset;
    spectator.component.subQueries = [_cloneDeep(fakeSubQuery)];
    spectator.component.selectedDataSources = [_cloneDeep(fakeDatasource)];
    datasourceService = spectator.inject(DatasourceService);
    queryEngineService = spectator.inject(QueryEngineService);
    datasourceService.getAttributes.and.returnValue(of(fakeAttr));
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

  describe('runQuery', () => {
    beforeEach(() => {
      executeQueryWebSocketsManagerService.connect.and.returnValue(of(true));
    });

    it('get cache result', fakeAsync(async () => {
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
      spectator.detectChanges();

      spectator.component.runQuery(true);

      spectator.detectChanges();
      flush();
      discardPeriodicTasks();

      expect(spectator.component.form.controls.pathOnS3.value).toEqual(
        cacheResult.content.pathOnS3,
      );

      expect(spectator.component.form.controls.numberOfClips.value).toEqual(
        cacheResult.content.statistics.numberOfClips,
      );

      expect(spectator.component.form.controls.queryString.value).toEqual(
        cacheResult.content.queryString,
      );
    }));

    it('no cache result', fakeAsync(async () => {
      spectator.detectChanges();

      spectator.component.runQuery(true);

      spectator.detectChanges();
      flush();
      discardPeriodicTasks();

      expect(spectator.component.form.controls.pathOnS3.value).toBe('');
      expect(spectator.component.form.controls.numberOfClips.value).toBeNull();
      expect(spectator.component.form.controls.queryString.value).toBe('');
    }));
  });

  describe('onAddSubQuery', () => {
    it('should add subQuery', () => {
      spyOn(spectator.component.addSubQueryClicked, 'emit');
      spectator.detectChanges();

      spectator.component.onAddSubQuery();

      expect(spectator.component.addSubQueryClicked.emit).toHaveBeenCalled();
    });
  });

  describe('onEditSubQuery', () => {
    it('should edit subQuery', () => {
      spyOn(spectator.component.editSubQuery, 'emit');
      spectator.detectChanges();
      const fakeQueryJson = getFakeQueryJson('', true);

      spectator.component.onEditSubQuery(fakeQueryJson[0]);

      expect(spectator.component.editSubQuery.emit).toHaveBeenCalledWith(fakeQueryJson[0]);
    });
  });

  describe('onDeleteSubQuery', () => {
    it('should delete sub query', () => {
      spyOn(spectator.component.deleteSubQuery, 'emit');
      spectator.detectChanges();

      spectator.component.onDeleteSubQuery(2);

      expect(spectator.component.deleteSubQuery.emit).toHaveBeenCalledWith(2);
    });
  });

  describe('cancelQuery', () => {
    it('should cancel query', () => {
      spectator.detectChanges();

      spectator.component.cancelQuery();

      expect(executeQueryWebSocketsManagerService.closeConnection).toHaveBeenCalled();
      expect(spectator.component.queryEditorResultTmpl).toEqual(
        spectator.component.queryResultsTmpl,
      );
    });
  });

  describe('Run Query button ', () => {
    it("dataset type 'dataset_client' - should disable run query'", async () => {
      const fakeDataset = getFakeDataset(true, null, {source: 'dataset_client'});
      spectator.setInput('dataset', fakeDataset);

      spectator.detectChanges();

      const isDisabled = await MeButtonHarness.isDisabled(spectator.fixture, loader, {
        text: 'manage_searchRun Query',
      });

      expect(isDisabled).toBeTruthy();
    });

    it("dataset type 'query_engine' - should enable run query'", async () => {
      const fakeDataset = getFakeDataset(true, null, {source: 'query_engine'});
      spectator.setInput('dataset', fakeDataset);

      spectator.detectChanges();

      const isDisabled = await MeButtonHarness.isDisabled(spectator.fixture, loader, {
        text: 'manage_searchRun Query',
      });

      expect(isDisabled).toBeFalsy();
    });

    it("no dataset - should enable run query'", async () => {
      spectator.setInput('dataset', undefined);
      spectator.detectChanges();

      const isDisabled = await MeButtonHarness.isDisabled(spectator.fixture, loader, {
        text: 'manage_searchRun Query',
      });

      expect(isDisabled).toBeFalsy();
    });
  });
});
