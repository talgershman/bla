import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {getFakeClipList} from 'deep-ui/shared/testing';

import {ClipListService} from './clip-list.service';

describe('ClipListService', () => {
  let spectator: SpectatorHttp<ClipListService>;

  const createHttp = createHttpFactory({
    service: ClipListService,
  });

  beforeEach(() => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('getSingle', () => {
    it('should be called', () => {
      spectator.service.getSingle(123, {}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/clip-lists/123') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getMulti', () => {
    it('should be called', () => {
      spectator.service.getMulti({}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/clip-lists/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('create', () => {
    it('should be called', () => {
      const fakeClipList = getFakeClipList(true);
      spectator.service.create(fakeClipList, {}).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/clip-lists/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('update', () => {
    it('should be called', () => {
      const fakeClipList = getFakeClipList(true);
      spectator.service.update(fakeClipList.id, fakeClipList, {}).subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf(`/clip-lists/${fakeClipList.id}`) !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('delete', () => {
    it('should be called', () => {
      spectator.service.delete(123).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('clip-lists/123') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('checkDuplicateName', () => {
    it('should be call', () => {
      spectator.service.checkDuplicateName('name1', 'AV', 123).subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf('clip-lists/is-duplicate/?id=123&name=name1&technology=AV') !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('downloadClipList', () => {
    const fakeClipList = getFakeClipList(true);

    it('should be called', () => {
      spectator.service.downloadClipList(fakeClipList).subscribe();

      spectator.controller.expectOne(
        (req) => req.url.indexOf(`clip-lists/${fakeClipList.id}/download/`) !== -1,
      );
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });

  describe('getAgGridMulti', () => {
    it('should be called', () => {
      spectator.service.getAgGridMulti({} as any).subscribe();

      spectator.controller.expectOne((req) => req.url.indexOf('/clip-lists/ag-grid/') !== -1);
      spectator.controller.verify();

      expect(spectator.service).toBeTruthy();
    });
  });
});
