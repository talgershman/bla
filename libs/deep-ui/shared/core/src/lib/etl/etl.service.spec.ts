import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {EtlServiceTypes, EtlTypeEnum} from 'deep-ui/shared/models';
import {getFakeETL} from 'deep-ui/shared/testing';

import {EtlService} from './etl.service';

describe('EtlService', () => {
  let spectator: SpectatorHttp<EtlService>;

  const createHttp = createHttpFactory({
    service: EtlService,
  });

  beforeEach(() => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('getSingle', () => {
    it('should be created', () => {
      spectator.service.getSingle(123, {}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/etls/123') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getMulti', () => {
    it('should be created', () => {
      spectator.service.getMulti(null).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/etls/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('create', () => {
    it('should be created', () => {
      const fakeETL = getFakeETL(true);
      spectator.service.create(fakeETL, {}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/etls/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('update', () => {
    it('should be created', () => {
      const fakeETL = getFakeETL(true);
      spectator.service.update(fakeETL.id, fakeETL, {}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf(`/etls/${fakeETL.id}`) !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('delete', () => {
    it('should be deleted', () => {
      spectator.service.delete('123', 'etl').subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('etls/123') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getServices', () => {
    it('should be called', () => {
      spectator.service.getServices({name: '123', type: EtlServiceTypes.Logic}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('etls/services/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('checkDuplicateName', () => {
    it('should be call', () => {
      spectator.service.checkDuplicateName('name1').subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('validate-probe-name-unique/?name=name1') !== -1
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('extractEtlParams', () => {
    it('should create an object will all params of each service in the ETL', () => {
      const fakeETL = getFakeETL(true, {}, EtlTypeEnum.VALIDATION);
      const expectDate = {
        [fakeETL.services[1].name]: fakeETL.services[1].configuration,
        [fakeETL.services[2].name]: fakeETL.services[2].configuration,
      };

      const result = spectator.service.extractEtlParams(fakeETL);

      expect(result).toEqual(expectDate);
    });

    it('perfect transform etl - should show nested params inside configuration object', () => {
      const fakeETL = getFakeETL(true, {}, EtlTypeEnum.PERFECT_TRANSFORM);
      const expectDate = {
        [fakeETL.services['1'].name]: fakeETL.services['1'].configuration.params,
      };
      const result = spectator.service.extractEtlParams(fakeETL);

      expect(result).toEqual(expectDate);
    });
  });
});
