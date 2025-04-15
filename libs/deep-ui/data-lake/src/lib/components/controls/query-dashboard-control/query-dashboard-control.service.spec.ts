import {FormControl} from '@angular/forms';
import {createServiceFactory, SpectatorService} from '@ngneat/spectator';
import {SelectedSubQuery, SubQuery} from 'deep-ui/shared/models';
import {getFakeDataset, getFakePerfectDatasource, getFakeQueryJson} from 'deep-ui/shared/testing';

import {QueryUtilService} from '../../../query-utils/query-util.service';
import {
  ACTION_NO_RESULT_FOUND_TEXT,
  ACTION_NOT_SUPPORT_TEXT,
  DownloadClipListActionEnum,
  JumpFileActionEnum,
  QueryDashboardControlService,
  QuerySampleActionEnum,
} from './query-dashboard-control.service';

describe('QueryDashboardControlService', () => {
  let spectator: SpectatorService<QueryDashboardControlService>;
  let service: QueryDashboardControlService;
  const createService = createServiceFactory({
    service: QueryDashboardControlService,
    providers: [QueryUtilService],
  });
  beforeEach(() => {
    spectator = createService();
    service = spectator.inject(QueryDashboardControlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateQueryJson', () => {
    const selectedDataSources = [
      getFakePerfectDatasource(true).fakeDataSource,
      getFakePerfectDatasource(true, {status: 'inactive'}).fakeDataSource,
      getFakePerfectDatasource(true, {status: 'updating'}).fakeDataSource,
    ];
    const validQueryJson = getFakeQueryJson(selectedDataSources[0].id, true);
    validQueryJson[0].dataSource = selectedDataSources[0];
    const invalidQueryJson = getFakeQueryJson(selectedDataSources[1].id, true);
    invalidQueryJson[0].dataSource = selectedDataSources[1];
    const updatingQueryJson = getFakeQueryJson(selectedDataSources[2].id, true);
    updatingQueryJson[0].dataSource = selectedDataSources[2];
    it('should be valid', () => {
      const control = new FormControl(validQueryJson);

      const isValid = service.validateQueryJson(control);

      expect(isValid).toBeNull();
    });

    it('invalid - invalid datasource', () => {
      const control = new FormControl(invalidQueryJson);

      const isValid = service.validateQueryJson(control);

      expect(isValid).toEqual({
        unableToRunQuery: 'Unable to run query, one of the Data Sources is inactive',
      });
    });

    it('invalid - datasource updating', () => {
      const control = new FormControl(updatingQueryJson);

      const isValid = service.validateQueryJson(control);

      expect(isValid).toEqual({
        unableToRunQuery:
          'Unable to run query, one of the Data Sources is updating... please come back later',
      });
    });
  });

  describe('handlePreviewDialogButtonClicked', () => {
    it('valid flow', () => {
      const {errorMsg, action} = spectator.service.handlePreviewDialogButtonClicked(
        '',
        false,
        'table 1',
        10,
        true,
      );

      expect(errorMsg).toBe('');
      expect(action).toEqual(QuerySampleActionEnum.triggerOpenQuerySample);
    });

    it('no supported error', () => {
      const {errorMsg, action} = spectator.service.handlePreviewDialogButtonClicked(
        '',
        false,
        'table 1',
        10,
        false,
      );

      expect(errorMsg).toBe(
        ACTION_NOT_SUPPORT_TEXT.replace('[ACTION_NAME_PLACEHOLDER]', 'Preview examples'),
      );

      expect(action).toEqual(QuerySampleActionEnum.triggerActionButtonMenu);
    });

    it('trigger run query', () => {
      const {errorMsg, action} = spectator.service.handlePreviewDialogButtonClicked(
        '',
        false,
        '',
        0,
        false,
      );

      expect(errorMsg).toBe('');
      expect(action).toEqual(QuerySampleActionEnum.triggerRunQuery);
    });
  });

  describe('handleAfterQueryRunForPreviewDialog', () => {
    it('valid flow', () => {
      const {errorMsg, action} = spectator.service.handleAfterQueryRunForPreviewDialog(
        true,
        'table 1',
        100,
      );

      expect(errorMsg).toBe('');
      expect(action).toEqual(QuerySampleActionEnum.triggerOpenQuerySample);
    });

    it('no supported error', () => {
      const {errorMsg, action} = spectator.service.handleAfterQueryRunForPreviewDialog(
        false,
        'table 1',
        100,
      );

      expect(errorMsg).toBe(
        ACTION_NOT_SUPPORT_TEXT.replace('[ACTION_NAME_PLACEHOLDER]', 'Preview examples'),
      );

      expect(action).toEqual(QuerySampleActionEnum.triggerActionButtonMenu);
    });

    it('no results found', () => {
      const {errorMsg, action} = spectator.service.handleAfterQueryRunForPreviewDialog(
        true,
        'table 1',
        0,
      );

      expect(errorMsg).toBe(
        ACTION_NO_RESULT_FOUND_TEXT.replace('[ACTION_NAME_PLACEHOLDER]', 'preview examples'),
      );

      expect(action).toEqual(QuerySampleActionEnum.triggerActionButtonMenu);
    });
  });

  describe('handleJumpFileButtonClicked', () => {
    it('valid - show dataset s3path', () => {
      const queryJson: Array<SubQuery> = getFakeQueryJson('', true, ['col1']);
      const secondJson: Array<SubQuery> = [...queryJson];

      const queryObject = spectator.service.getQueryObject(queryJson as Array<SelectedSubQuery>);
      const secondQueryObject = spectator.service.getQueryObject(
        secondJson as Array<SelectedSubQuery>,
      );

      const {errorMsg, action, jumpFileS3Path} = spectator.service.handleJumpFileButtonClicked(
        'dataset s3 path',
        false,
        'table 1',
        10,
        true,
        queryObject,
        secondQueryObject,
        {
          allowJumpFile: true,
          pathOnS3: 'dataset s3 path',
        },
        queryJson,
      );

      expect(errorMsg).toBe('');
      expect(jumpFileS3Path).toBe('dataset s3 path');
      expect(action).toEqual(JumpFileActionEnum.triggerActionButtonMenu);
    });

    it('valid - query s3 path', () => {
      const queryJson: Array<SubQuery> = getFakeQueryJson('', true, ['col2']);
      const secondJson: Array<SubQuery> = [...queryJson];

      const queryObject = spectator.service.getQueryObject(queryJson as Array<SelectedSubQuery>);
      const secondQueryObject = spectator.service.getQueryObject(
        secondJson as Array<SelectedSubQuery>,
      );

      const {errorMsg, action, jumpFileS3Path} = spectator.service.handleJumpFileButtonClicked(
        'new s3 path',
        false,
        'table 1',
        20,
        true,
        queryObject,
        secondQueryObject,
        {
          allowJumpFile: true,
          pathOnS3: 'dataset s3 path',
        },
        queryJson,
      );

      expect(errorMsg).toBe('');
      expect(jumpFileS3Path).toBe('new s3 path');
      expect(action).toEqual(JumpFileActionEnum.triggerActionButtonMenu);
    });

    it('invalid - no columns selected', () => {
      const queryJson: Array<SubQuery> = getFakeQueryJson('', true, []);
      const secondJson: Array<SubQuery> = [...queryJson];

      const queryObject = spectator.service.getQueryObject(queryJson as Array<SelectedSubQuery>);
      const secondQueryObject = spectator.service.getQueryObject(
        secondJson as Array<SelectedSubQuery>,
      );

      const {errorMsg, action, jumpFileS3Path} = spectator.service.handleJumpFileButtonClicked(
        'new s3 path',
        false,
        'table 1',
        20,
        true,
        queryObject,
        secondQueryObject,
        {
          allowJumpFile: true,
          pathOnS3: 'dataset s3 path',
        },
        queryJson,
      );

      expect(errorMsg).toBe('No selected fields found, please add fields to your query');
      expect(jumpFileS3Path).toBe('');
      expect(action).toEqual(JumpFileActionEnum.triggerActionButtonMenu);
    });

    it('re-trigger query', () => {
      const queryJson: Array<SubQuery> = getFakeQueryJson('', false, ['col1']);
      const secondJson: Array<SubQuery> = getFakeQueryJson('', false, ['col2']);

      const queryObject = spectator.service.getQueryObject(queryJson as Array<SelectedSubQuery>);
      const secondQueryObject = spectator.service.getQueryObject(
        secondJson as Array<SelectedSubQuery>,
      );

      const {errorMsg, action, jumpFileS3Path} = spectator.service.handleJumpFileButtonClicked(
        'new s3 path',
        false,
        '',
        0,
        true,
        queryObject,
        secondQueryObject,
        {
          allowJumpFile: true,
          pathOnS3: 'dataset s3 path',
        },
        queryJson,
      );

      expect(errorMsg).toBe('');
      expect(jumpFileS3Path).toBe('');
      expect(action).toEqual(JumpFileActionEnum.triggerRunQuery);
    });
  });

  describe('handleAfterQueryRunForJumpFile', () => {
    it('valid - show s3path', () => {
      const {errorMsg, action, jumpFileS3Path} = spectator.service.handleAfterQueryRunForJumpFile(
        'paths3',
        true,
        'table 2',
        10,
      );

      expect(errorMsg).toBe('');
      expect(action).toBe(JumpFileActionEnum.triggerActionButtonMenu);
      expect(jumpFileS3Path).toBe('paths3');
    });

    it('invalid - no results', () => {
      const {errorMsg, action, jumpFileS3Path} = spectator.service.handleAfterQueryRunForJumpFile(
        'paths3',
        true,
        'table 2',
        0,
      );

      expect(errorMsg).toBe(
        ACTION_NO_RESULT_FOUND_TEXT.replace(
          '[ACTION_NAME_PLACEHOLDER]',
          'multiple fields jump file',
        ),
      );

      expect(action).toBe(JumpFileActionEnum.triggerActionButtonMenu);
      expect(jumpFileS3Path).toBe('');
    });

    it('invalid - not supported', () => {
      const {errorMsg, action, jumpFileS3Path} = spectator.service.handleAfterQueryRunForJumpFile(
        'paths3',
        false,
        'table 2',
        3,
      );

      expect(errorMsg).toBe(
        ACTION_NOT_SUPPORT_TEXT.replace('[ACTION_NAME_PLACEHOLDER]', 'Multiple fields jump file'),
      );

      expect(action).toBe(JumpFileActionEnum.triggerActionButtonMenu);
      expect(jumpFileS3Path).toBe('');
    });
  });

  describe('handleDownloadClipListButtonClicked', () => {
    it('valid - proceed to download - query engine', () => {
      const {errorMsg, action} = spectator.service.handleDownloadClipListButtonClicked(
        'table 1',
        10,
        null,
        null,
        null,
      );

      expect(errorMsg).toBe('');
      expect(action).toBe(DownloadClipListActionEnum.proceedToDownloadQueryEngine);
    });

    it('valid - proceed to download - dataset', () => {
      const fakeDataset = getFakeDataset(true);

      const queryObject = spectator.service.getQueryObject(
        fakeDataset.queryJson as Array<SelectedSubQuery>,
      );

      const {errorMsg, action} = spectator.service.handleDownloadClipListButtonClicked(
        '',
        10,
        fakeDataset,
        queryObject,
        queryObject,
      );

      expect(errorMsg).toBe('');
      expect(action).toBe(DownloadClipListActionEnum.proceedToDownloadDataSet);
    });

    it('invalid - no results', () => {
      const fakeDataset = getFakeDataset(true);

      const {errorMsg, action} = spectator.service.handleDownloadClipListButtonClicked(
        'table 1',
        0,
        null,
        fakeDataset.queryJson,
        fakeDataset.queryJson,
      );

      expect(errorMsg).toBe('No results found to run download clip list');
      expect(action).toBe(DownloadClipListActionEnum.triggerActionButtonMenu);
    });

    it('no query', () => {
      const {errorMsg, action, jumpFileS3Path} = spectator.service.handleAfterQueryRunForJumpFile(
        'paths3',
        false,
        'table 2',
        3,
      );

      expect(errorMsg).toBe(
        ACTION_NOT_SUPPORT_TEXT.replace('[ACTION_NAME_PLACEHOLDER]', 'Multiple fields jump file'),
      );

      expect(action).toBe(JumpFileActionEnum.triggerActionButtonMenu);
      expect(jumpFileS3Path).toBe('');
    });
  });

  describe('handleAfterQueryRunForDownloadClipList', () => {
    it('valid - proceed to download - query engine', () => {
      const {errorMsg, action} = spectator.service.handleAfterQueryRunForDownloadClipList(
        'paths3',
        1,
      );

      expect(errorMsg).toBe('');
      expect(action).toBe(DownloadClipListActionEnum.proceedToDownloadQueryEngine);
    });

    it('invalid - no results', () => {
      const {errorMsg, action} = spectator.service.handleAfterQueryRunForDownloadClipList(
        's3 path',
        0,
      );

      expect(errorMsg).toBe('No results found to run download clip list');
      expect(action).toBe(DownloadClipListActionEnum.triggerActionButtonMenu);
    });
  });

  describe('atLeastOneSubQueryFieldSelected', () => {
    it('should be valid', () => {
      const queryJson = getFakeQueryJson('', true, ['co1']);

      const isValid = spectator.service.atLeastOneSubQueryFieldSelected(queryJson);

      expect(isValid).toBeTruthy();
    });

    it('should be invalid', () => {
      const queryJson = getFakeQueryJson('', true, []);

      const isValid = spectator.service.atLeastOneSubQueryFieldSelected(queryJson);

      expect(isValid).toBeFalse();
    });
  });
});
