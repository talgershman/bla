import {MeDownloaderService} from '@mobileye/material/src/lib/services/downloader';
import {createHttpFactory, SpectatorHttp, SpyObject} from '@ngneat/spectator';
import {Datasource} from 'deep-ui/shared/models';
import {getFakeMestDatasource, getFakePerfectDatasource} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {DatasourceService} from './datasource.service';

describe('DataSourceService', () => {
  let spectator: SpectatorHttp<DatasourceService>;
  let downloadService: SpyObject<MeDownloaderService>;

  const createHttp = createHttpFactory({
    service: DatasourceService,
    mocks: [MeDownloaderService],
  });

  beforeEach(() => {
    spectator = createHttp();
    downloadService = spectator.inject(MeDownloaderService);
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('getSingle', () => {
    it('should be created', () => {
      spectator.service.getSingle('123', {}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/datasources/123') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getMulti', () => {
    it('should be created', () => {
      spectator.service.getMulti({}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/datasources/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('create', () => {
    it('should be created', () => {
      const fakeDatasource = getFakeMestDatasource(true).fakeDataSource;
      spectator.service.create(fakeDatasource, {}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/datasources/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('update', () => {
    it('should be created', () => {
      const fakeDatasource = getFakeMestDatasource(true).fakeDataSource;
      spectator.service.update(fakeDatasource.id, fakeDatasource, {}).subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf(`/datasources/${fakeDatasource.id}`) !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('delete', () => {
    it('should be deleted', () => {
      spectator.service.delete('123', 'datasource').subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('datasources/123') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getJobIds', () => {
    it('should be created', () => {
      spectator.service.getJobIds(['id1', 'id2'], 'etl_results').subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('/datasources/?dataType=etl_results&jobIds=id1%2Cid2') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getDsByJobIds', () => {
    it('should be created', () => {
      spectator.service.getDsByJobIds(['id1', 'id2'], 'etl_results').subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('/datasources/by-job-ids/?dataType=etl_results') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getAttributes', () => {
    it('should be called', () => {
      const dataSource = getFakeMestDatasource(true, {id: '123'}).fakeDataSource;
      spectator.service.getAttributes(dataSource, null).subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf(`attributes/?dataSourceId=123`) !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('checkDuplicateName', () => {
    it('should be called', () => {
      spectator.service.checkDuplicateName('name1', 'team1').subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('/datasources/validate-name/?name=name1&team=team1') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getSiblingDatasources', () => {
    it('should return sibling', async () => {
      const dataSource: Datasource = getFakePerfectDatasource(true).fakeDataSource;
      const selectedDataSource: Datasource = getFakePerfectDatasource(true, {
        siblingsId: [dataSource.id],
      }).fakeDataSource;
      spyOn(spectator.service, 'getSingle').and.returnValue(of(dataSource));

      const siblings: Array<Datasource> =
        await spectator.service.getSiblingDatasources(selectedDataSource);

      expect(siblings.length).toEqual(1);
      expect(siblings[0]).toEqual(dataSource);
    });
  });

  describe('downloadClipList', () => {
    it('should call download', async () => {
      const dataSource: Datasource = getFakePerfectDatasource(true).fakeDataSource;

      await spectator.service.downloadClipList(dataSource);

      expect(downloadService.downloadFileWithAuth).toHaveBeenCalled();
    });
  });

  describe('createGoldenLabelsDatasource', () => {
    it('should be called', () => {
      spectator.service.createGoldenLabelsDatasource({}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('golden-labels/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('validateGoldenLabelsDatasourceSchema', () => {
    it('should be called', () => {
      spectator.service.validateGoldenLabelsDatasourceSchema({}, 'clips').subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('golden-labels/validate-schema/') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('validateGoldenLabelsDatasourceS3Path', () => {
    it('should be called', () => {
      spectator.service.validateGoldenLabelsDatasourceS3Path('s3://bla', 'clips').subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('golden-labels/validate-s3path/') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('updateGoldenLabelsDatasourceSchema', () => {
    it('should be called', () => {
      spectator.service.updateGoldenLabelsDatasourceSchema({test: true}, '123').subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf(`/123/golden-labels/update-schema/`) !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });
});
