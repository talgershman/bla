import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';

import {ParsingConfigurationService} from './parsing-configuration.service';

describe('ParsingConfigurationService', () => {
  let spectator: SpectatorHttp<ParsingConfigurationService>;

  const createHttp = createHttpFactory({
    service: ParsingConfigurationService,
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

      spectator.controller.expectOne(
        (req) => req.url.indexOf('/etls/parsing-configurations/123') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getLeanMulti', () => {
    it('should be created', () => {
      spectator.service.getLeanMulti({}).subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('/etls/parsing-configurations/?lean=true') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('create', () => {
    it('should be created', () => {
      spectator.service.create({name: 'some name'}, {}).subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('etls/parsing-configurations/') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('delete', () => {
    it('should be created', () => {
      spectator.service.delete('123', 'parsing-conf').subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('/etls/parsing-configurations/123') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('checkDuplicateName', () => {
    it('should be called', () => {
      spectator.service.checkDuplicateName('name1', 'folder1', '').subscribe();

      spectator.controller.expectOne(
        (req) =>
          req.url.indexOf(
            '/etls/parsing-configurations/validate-name/?folder=folder1&id=&name=name1',
          ) !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('checkConfig', () => {
    it('should be called', () => {
      spectator.service.checkConfig({a: true}).subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('/etls/parsing-configurations/validate/') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });
});
