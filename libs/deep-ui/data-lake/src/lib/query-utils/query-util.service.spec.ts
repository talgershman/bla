import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {SelectedSubQuery, SubQuery} from 'deep-ui/shared/models';
import {
  getFakePerfectDatasource,
  getFakeQueryJson,
  getFakeVersionDataSource,
} from 'deep-ui/shared/testing';

import {QueryUtilService} from './query-util.service';

describe('QueryUtilService', () => {
  let spectator: SpectatorHttp<QueryUtilService>;

  const createHttp = createHttpFactory({
    service: QueryUtilService,
    mocks: [],
  });

  beforeEach(() => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('getSerializeQueries', () => {
    it('should remove unwanted properties', async () => {
      const fakeQueryJson: Array<SelectedSubQuery> = [...getFakeQueryJson()];
      fakeQueryJson[0].dataSource = getFakePerfectDatasource(true).fakeDataSource;
      fakeQueryJson[0].version = getFakeVersionDataSource(true);
      fakeQueryJson[0].errorMsg = 'some error';
      fakeQueryJson[0].userFacingVersion = fakeQueryJson[0].version.userFacingVersion;
      fakeQueryJson[0].dataSourceVersionId = fakeQueryJson[0].version.id;

      const result = spectator.service.getSerializeQueries(fakeQueryJson);

      expect(result[0]).toEqual({
        dataSourceVersionId: fakeQueryJson[0].version.id,
        userFacingVersion: fakeQueryJson[0].version.userFacingVersion,
        dataSourceId: fakeQueryJson[0].dataSourceId,
        query: fakeQueryJson[0].query,
      } as SubQuery);
    });
  });
});
