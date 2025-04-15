import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {NgTemplateOutlet} from '@angular/common';
import {FormControl, NgControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatMenuHarness} from '@angular/material/menu/testing';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {AutocompleteChipsComponent} from '@mobileye/material/src/lib/components/form/autocomplete-chips';
import {HintIconComponent} from '@mobileye/material/src/lib/components/hint-icon';
import {MeTooltipDirective} from '@mobileye/material/src/lib/directives/tooltip';
import {
  getElementBySelector,
  MeAutoCompleteChipHarness,
  MeButtonHarness,
  MeSliderToggleHarness,
} from '@mobileye/material/src/lib/testing';
import {createComponentFactory, Spectator, SpyObject} from '@ngneat/spectator';
import {DatasetService, DatasourceService} from 'deep-ui/shared/core';
import {SelectedSubQuery} from 'deep-ui/shared/models';
import {
  getFakeDataset,
  getFakePerfectDatasource,
  getFakeQEAttributes,
  getFakeQueryJson,
} from 'deep-ui/shared/testing';
import _camelCase from 'lodash-es/camelCase';
import _cloneDeep from 'lodash-es/cloneDeep';
import _startCase from 'lodash-es/startCase';
import {NgxMaskPipe} from 'ngx-mask';
import {of} from 'rxjs';

import {QueryUtilService} from '../../../query-utils/query-util.service';
import {
  QueryEngineService,
  ValidateQueryJsonResponse,
} from '../../../services/query-engine/query-engine.service';
import {ExecuteQueryWebSocketsManagerService} from '../../../services/web-sockets-manager/execute-query/execute-query-web-sockets-manager.service';
import {QuerySampleDialogComponent} from '../../dialogs/query-sample-dialog/query-sample-dialog.component';
import {QueryDashboardControlComponent} from './query-dashboard-control.component';
import {QueryDashboardControlService} from './query-dashboard-control.service';
import {SubQuerySquareComponent} from './sub-query-square/sub-query-square.component';

const {fakeDataSource} = getFakePerfectDatasource(true);
const fakeAttr = getFakeQEAttributes();
const queryJson = getFakeQueryJson(fakeDataSource.id)[0];
const fakeSubQuery: SelectedSubQuery = getFakeQueryJson(fakeDataSource.id)[0];
const dataset = getFakeDataset(true, fakeDataSource, {
  queryJson: [queryJson],
  allowJumpFile: true,
});
const fakeQueryResultResponse = {
  status: 200,
  queryJson: getFakeQueryJson(fakeDataSource.id, true),
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

describe('QueryDashboardControlComponent - Integration', () => {
  let spectator: Spectator<QueryDashboardControlComponent>;
  let executeQueryWebSocketsManagerService: SpyObject<ExecuteQueryWebSocketsManagerService>;
  let matDialog: MatDialog;
  let datasourceService: SpyObject<DatasourceService>;
  let queryEngineService: SpyObject<QueryEngineService>;
  let loader: HarnessLoader;
  let docLoader: HarnessLoader;

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
      QuerySampleDialogComponent,
    ],
    providers: [QueryDashboardControlService, QueryUtilService],
    mocks: [
      ExecuteQueryWebSocketsManagerService,
      DatasourceService,
      DatasetService,
      QueryEngineService,
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    executeQueryWebSocketsManagerService = spectator.inject(ExecuteQueryWebSocketsManagerService);
    matDialog = spectator.inject(MatDialog);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    docLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    spectator.component.dataset = dataset;
    spectator.component.subQueries = [_cloneDeep(fakeSubQuery)];
    spectator.component.selectedDataSources = [_cloneDeep(fakeDataSource)];
    datasourceService = spectator.inject(DatasourceService);
    queryEngineService = spectator.inject(QueryEngineService);
    datasourceService.getAttributes.and.returnValue(of(fakeAttr));
    queryEngineService.asyncValidationForQueryJson.and.returnValue(
      of({
        invalid: [],
      } as ValidateQueryJsonResponse),
    );
    executeQueryWebSocketsManagerService.connect.and.returnValue(of(true));
    executeQueryWebSocketsManagerService.send.and.returnValue(fakeQueryResultResponse);
  });

  describe('Add Fields', () => {
    it('new selection - should reset last query', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.component.form.controls.tableName.setValue('tempTable');

      await MeButtonHarness.click(spectator.fixture, loader, {text: '+Add Fields'});
      await MeAutoCompleteChipHarness.addTag(
        spectator.fixture,
        docLoader,
        {ancestor: '.fields-control'},
        {ancestor: '.fields-control'},
        _startCase(_camelCase(fakeAttr[1].columnName)),
      );
      await MeAutoCompleteChipHarness.addTag(
        spectator.fixture,
        docLoader,
        {ancestor: '.fields-control'},
        {ancestor: '.fields-control'},
        _startCase(_camelCase(fakeAttr[2].columnName)),
      );
      //click button for blur effect, to end the selection of the fields
      await MeButtonHarness.click(spectator.fixture, loader, {text: '+Add Fields'});

      expect(spectator.component.subQueries[0].query.columns).toEqual([
        fakeAttr[1].columnName,
        fakeAttr[2].columnName,
      ]);

      expect(spectator.component.form.controls.tableName.value).toBe('');
      expect(spectator.component.form.controls.numberOfClips.value).toEqual(null);
    });

    it('should reset columns + set materialized to true', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.component.form.controls.tableName.setValue('tempTable');

      await MeButtonHarness.click(spectator.fixture, loader, {text: '+Add Fields'});
      await MeAutoCompleteChipHarness.addTag(
        spectator.fixture,
        docLoader,
        {ancestor: '.fields-control'},
        {ancestor: '.fields-control'},
        _startCase(_camelCase(fakeAttr[1].columnName)),
      );
      await MeAutoCompleteChipHarness.addTag(
        spectator.fixture,
        docLoader,
        {ancestor: '.fields-control'},
        {ancestor: '.fields-control'},
        _startCase(_camelCase(fakeAttr[2].columnName)),
      );

      //click button for blur effect, to end the selection of the fields
      await MeButtonHarness.click(spectator.fixture, loader, {text: '+Add Fields'});

      await MeSliderToggleHarness.check(spectator.fixture, loader, {
        ancestor: '.select-all-fields-control',
      });

      expect(spectator.component.subQueries[0].query.columns).toEqual([]);
      expect(spectator.component.subQueries[0].query.materialized).toEqual(true);
      expect(spectator.component.form.controls.tableName.value).toBe('');
      expect(spectator.component.form.controls.numberOfClips.value).toEqual(null);
    });

    it('selection no change - should not reset last query', async () => {
      spyOn(spectator.component, 'onSubQueryFieldsUpdated');
      spectator.detectChanges();
      await spectator.fixture.whenStable();
      spectator.component.form.controls.tableName.setValue('tempTable');

      await MeButtonHarness.click(spectator.fixture, loader, {text: '+Add Fields'});
      //click button for blur effect, to end the selection of the fields
      await MeButtonHarness.click(spectator.fixture, loader, {text: '+Add Fields'});

      expect(spectator.component.form.controls.tableName.value).toBe('tempTable');
      expect(spectator.component.onSubQueryFieldsUpdated).not.toHaveBeenCalled();
    });
  });

  describe('Multiple fields jump file', () => {
    it('should show the original dataset s3path', async () => {
      const fakeSubQueryWithColumns: SelectedSubQuery = getFakeQueryJson(fakeDataSource.id, false, [
        fakeAttr[1].columnName,
      ])[0];
      spectator.component.subQueries = [fakeSubQueryWithColumns];
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.jump-file-btn'});
      await loader.getHarness<MatMenuHarness>(
        MatMenuHarness.with({ancestor: '.query-action-buttons'}),
      );
      const s3PathTextElem = getElementBySelector(spectator.fixture, '.jumpfile-s3path');

      expect(s3PathTextElem.nativeElement.innerText).toBe(spectator.component.dataset.pathOnS3);
    });

    it('no query - should run query - should show option is not supported error', async () => {
      executeQueryWebSocketsManagerService.send.and.returnValue({
        status: 200,
        queryJson: getFakeQueryJson(fakeDataSource.id, true),
        content: {
          pathOnS3: 'some-path',
          queryString: 'some query string',
          columns: [],
          statistics: {
            numberOfClips: 10,
          },
          tableName: 'result_e88b96be0b57400381d7dd2e6d612e5f',
          hasFrameIndicator: false,
        },
      });
      spectator.component.dataset = {
        ...dataset,
        allowJumpFile: false,
      };
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await MeButtonHarness.click(spectator.fixture, loader, {text: '+Add Fields'});
      await MeAutoCompleteChipHarness.addTag(
        spectator.fixture,
        docLoader,
        {ancestor: '.fields-control'},
        {ancestor: '.fields-control'},
        _startCase(_camelCase(fakeAttr[1].columnName)),
      );
      //click button for blur effect, to end the selection of the fields
      await MeButtonHarness.click(spectator.fixture, loader, {text: '+Add Fields'});

      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.jump-file-btn'});
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.form.controls.numberOfClips.value).toEqual(10);
      expect(spectator.component.queryActionButtonErrorMsg).toBe(
        'Multiple fields jump file is not supported, query must contain one the following columns : frame_id, frame, gfi, relative, grab_index',
      );
    });

    it('no query - should run query - should show s3path', async () => {
      spectator.component.dataset = {
        ...dataset,
        allowJumpFile: false,
      };
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await MeButtonHarness.click(spectator.fixture, loader, {text: '+Add Fields'});
      await MeAutoCompleteChipHarness.addTag(
        spectator.fixture,
        docLoader,
        {ancestor: '.fields-control'},
        {ancestor: '.fields-control'},
        _startCase(_camelCase(fakeAttr[1].columnName)),
      );
      //click button for blur effect, to end the selection of the fields
      await MeButtonHarness.click(spectator.fixture, loader, {text: '+Add Fields'});

      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.jump-file-btn'});
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.form.controls.numberOfClips.value).toEqual(10);
      expect(spectator.component.queryActionButtonErrorMsg).toBe('');
    });

    it('no query - should run query - should show option is not supported error', async () => {
      executeQueryWebSocketsManagerService.send.and.returnValue({
        status: 200,
        queryJson: getFakeQueryJson(fakeDataSource.id, true),
        content: {
          pathOnS3: 'some-path',
          queryString: 'some query string',
          columns: [],
          statistics: {
            numberOfClips: 10,
          },
          tableName: 'result_e88b96be0b57400381d7dd2e6d612e5f',
          hasFrameIndicator: false,
        },
      });
      spectator.component.dataset = {
        ...dataset,
        allowJumpFile: false,
      };
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await MeButtonHarness.click(spectator.fixture, loader, {text: '+Add Fields'});
      await MeAutoCompleteChipHarness.addTag(
        spectator.fixture,
        docLoader,
        {ancestor: '.fields-control'},
        {ancestor: '.fields-control'},
        _startCase(_camelCase(fakeAttr[1].columnName)),
      );
      //click button for blur effect, to end the selection of the fields
      await MeButtonHarness.click(spectator.fixture, loader, {text: '+Add Fields'});

      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.jump-file-btn'});
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.form.controls.numberOfClips.value).toEqual(10);
      expect(spectator.component.queryActionButtonErrorMsg).toBe(
        'Multiple fields jump file is not supported, query must contain one the following columns : frame_id, frame, gfi, relative, grab_index',
      );
    });

    it('no query - should run query - should show s3path', async () => {
      spectator.component.dataset = {
        ...dataset,
        allowJumpFile: false,
      };
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await MeButtonHarness.click(spectator.fixture, loader, {text: '+Add Fields'});
      await MeAutoCompleteChipHarness.addTag(
        spectator.fixture,
        docLoader,
        {ancestor: '.fields-control'},
        {ancestor: '.fields-control'},
        _startCase(_camelCase(fakeAttr[1].columnName)),
      );
      //click button for blur effect, to end the selection of the fields
      await MeButtonHarness.click(spectator.fixture, loader, {text: '+Add Fields'});

      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.jump-file-btn'});
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.form.controls.numberOfClips.value).toEqual(10);
      expect(spectator.component.queryActionButtonErrorMsg).toBe('');
    });
  });

  describe('Preview Examples', () => {
    it('no query - should run query - open dialog preview examples', async () => {
      const key = '_openQuerySampleDialog';
      spyOn(spectator.component, key as any);
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.preview-examples-btn'});
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.form.controls.numberOfClips.value).toEqual(10);
      expect(spectator.component.queryActionButtonErrorMsg).toBe('');
      //open preview example dialog
      expect(spectator.component['_openQuerySampleDialog']).toHaveBeenCalled();
    });

    it('with query - open dialog preview examples', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const key = '_openQuerySampleDialog';
      spyOn(spectator.component, key as any);

      spectator.component.form.controls.tableName.setValue('tempTable');
      spectator.component.form.controls.queryHasFrameIndicator.setValue(true);

      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.preview-examples-btn'});
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.form.controls.numberOfClips.value).toEqual(dataset.numberOfClips);
      //open preview example dialog
      expect(spectator.component['_openQuerySampleDialog']).toHaveBeenCalled();
    });

    it('query returns this option is not supported - show error', async () => {
      executeQueryWebSocketsManagerService.send.and.returnValue({
        status: 200,
        queryJson: getFakeQueryJson(fakeDataSource.id, true),
        content: {
          pathOnS3: 'some-path',
          queryString: 'some query string',
          columns: [],
          statistics: {
            numberOfClips: 10,
          },
          tableName: 'result_e88b96be0b57400381d7dd2e6d612e5f',
          hasFrameIndicator: false,
        },
      });
      spyOn(matDialog, 'open');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await MeButtonHarness.click(spectator.fixture, loader, {selector: '.preview-examples-btn'});
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.component.form.controls.numberOfClips.value).toEqual(10);
      expect(spectator.component.queryActionButtonErrorMsg).toBe(
        'Preview examples is not supported, query must contain one the following columns : frame_id, frame, gfi, relative, grab_index',
      );
      //open preview example dialog
      expect(matDialog.open).not.toHaveBeenCalled();
    });
  });
});
