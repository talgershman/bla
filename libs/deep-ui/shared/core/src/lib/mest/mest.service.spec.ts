import {createHttpFactory, SpectatorHttp, SpyObject} from '@ngneat/spectator';
import {MestParams} from 'deep-ui/shared/models';
import {getFakeMEST} from 'deep-ui/shared/testing';
import {of} from 'rxjs';

import {DEFAULT_RETRY_ATTEMPTS, OnPremService, QueryFileSystem} from '../on-prem/on-prem.service';
import {MestFoundPathsResponse, MestService} from './mest.service';
import {getMockPaths, getMockResponsePaths} from './testing-entities';

describe('MestService', () => {
  let spectator: SpectatorHttp<MestService>;
  let onPremService: SpyObject<OnPremService>;

  const createHttp = createHttpFactory({
    service: MestService,
    mocks: [OnPremService],
  });

  beforeEach(() => {
    spectator = createHttp();
    onPremService = spectator.inject(OnPremService);
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('getSingle', () => {
    it('should be created', () => {
      spectator.service.getSingle(123, {}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/mests/123') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getMulti', () => {
    it('should be created', () => {
      spectator.service.getMulti({}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/mests/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('create', () => {
    it('should be created', () => {
      spectator.service.create({nickName: 'some name'}, {}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/mests/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('update', () => {
    it('should be created', () => {
      spectator.service.update(123, {nickName: 'some name'}, {}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/mests/123') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('patch', () => {
    it('should be created', () => {
      spectator.service.patch(123, {args: 'some args'}, {}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('mests/123') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('delete', () => {
    it('should be created', () => {
      spectator.service.delete(123, 'mest').subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('mests/123') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('generateMestCmd', () => {
    it('should return mest cmd string', () => {
      const fakeMest = getFakeMEST(false);

      const mestCmd = spectator.service
        .generateMestCmd(fakeMest, fakeMest.executables[0], fakeMest.libs[0], fakeMest.brainLibs[0])
        .trim();

      expect(mestCmd).toContain('/usr/bin/cloud-mest');
      expect(mestCmd).toContain('-m');
      expect(mestCmd).toContain('-p');
    });
  });

  describe('generateMestParamString', () => {
    it('should return params array', () => {
      const expectedParams: string[] = [
        'some_key_1=some_value_1',
        'single_key',
        'some_key_2=some_value_2',
      ];
      const params: MestParams[] = [
        {
          key: 'some_key_1',
          value: 'some_value_1',
        },
        {
          key: 'single_key',
        },
        {
          key: 'some_key_2',
          value: 'some_value_2',
        },
      ];

      const result = spectator.service.generateMestParamString(params);

      expect(result).toEqual(expectedParams);
    });
  });

  describe('getMestSelectedPaths', () => {
    it('should return found path', (done) => {
      const paths = getMockPaths();
      const responsePaths = getMockResponsePaths('/rootPath/', 2);
      const fakeResponse: QueryFileSystem = {
        retries: DEFAULT_RETRY_ATTEMPTS,
        paths: responsePaths,
      };
      const expectedResponse: Partial<MestFoundPathsResponse> = {
        executable: {
          foundPath: '/rootPath/path3',
          errorMsg: '',
        },
        lib: {
          foundPath: '/rootPath/path3',
          errorMsg: '',
        },
      };
      onPremService.queryPaths.and.returnValue(of(fakeResponse));

      spectator.service
        .getMestSelectedPaths('/rootPath/', paths, paths, [])
        .subscribe((response) => {
          expect(response).toEqual(expectedResponse as any);
          done();
        });
      spectator.controller.verify();
    });

    it('should return not found', (done) => {
      const paths = getMockPaths();
      const responsePaths = getMockResponsePaths('/rootPath/');
      const fakeResponse: QueryFileSystem = {
        retries: DEFAULT_RETRY_ATTEMPTS,
        paths: responsePaths,
      };
      onPremService.queryPaths.and.returnValue(of(fakeResponse));

      spectator.service
        .getMestSelectedPaths('/rootPath/', paths, paths, paths)
        .subscribe((response) => {
          expect(response.executable.foundPath).toEqual('');
          expect(response.executable.errorMsg).toContain('Could not find executable file');
          expect(response.lib.foundPath).toEqual('');
          expect(response.lib.errorMsg).toContain('Could not find lib file');
          expect(response.brainLib.foundPath).toEqual('');
          expect(response.brainLib.errorMsg).toContain('Could not find brain lib folder');
          done();
        });
      spectator.controller.verify();
    });

    it('should return all paths', (done) => {
      const paths = getMockPaths();
      const responsePaths = getMockResponsePaths('/rootPath/', 2);
      const fakeResponse: QueryFileSystem = {
        retries: DEFAULT_RETRY_ATTEMPTS,
        paths: responsePaths,
      };
      const expectedResponse: MestFoundPathsResponse = {
        executable: {
          foundPath: '/rootPath/path3',
          errorMsg: '',
        },
        brainLib: {
          foundPath: '/rootPath/path3',
          errorMsg: '',
        },
        lib: {
          foundPath: '/rootPath/path3',
          errorMsg: '',
        },
      };

      onPremService.queryPaths.and.returnValue(of(fakeResponse));

      spectator.service
        .getMestSelectedPaths('/rootPath/', paths, paths, paths)
        .subscribe((response) => {
          expect(response).toEqual(expectedResponse);
          done();
        });
      spectator.controller.verify();
    });
  });

  describe('getAgGridMulti', () => {
    it('should be called', () => {
      spectator.service.getAgGridMulti({} as any).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/mests/ag-grid/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });
});
