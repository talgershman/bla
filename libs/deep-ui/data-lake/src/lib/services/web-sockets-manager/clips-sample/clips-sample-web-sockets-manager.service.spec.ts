import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {getFakeQueryJson} from 'deep-ui/shared/testing';
import {WebSocketSubject} from 'rxjs/webSocket';

import {Sha1} from '../web-sockets-manager-service';
import {ClipsSampleWebSocketsManagerService} from './clips-sample-web-sockets-manager.service';

describe('ClipsSampleWebSocketsManagerService', () => {
  let spectator: SpectatorHttp<ClipsSampleWebSocketsManagerService>;
  const fakeConnection = new WebSocketSubject('bla');

  const createHttp = createHttpFactory({
    service: ClipsSampleWebSocketsManagerService,
  });

  beforeEach(() => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  describe('connect', () => {
    it('new connection', () => {
      const fakeQueryJson = getFakeQueryJson(null, true);

      const connection = spectator.service.connect(fakeQueryJson, false);

      const isWebSocketSubject = connection instanceof WebSocketSubject;

      expect(isWebSocketSubject).toBeTruthy();
    });

    it('prev connection', () => {
      const fakeQueryJson = getFakeQueryJson(null, true);
      const key = new Sha1().updateObjectToHex(fakeQueryJson);
      spectator.service.activeConnectionsMap.set(key, {
        connection: fakeConnection as any,
        results: null,
      });

      const connection = spectator.service.connect(fakeQueryJson, true);
      const isWebSocketSubject = connection instanceof WebSocketSubject;

      expect(isWebSocketSubject).toEqual(true);
    });
  });

  describe('send', () => {
    it('no prev result', () => {
      const fakeQueryJson = getFakeQueryJson(null, true);
      const key = new Sha1().updateObjectToHex(fakeQueryJson);
      spectator.service.activeConnectionsMap.set(key, {
        connection: fakeConnection as any,
        results: null,
      });

      const cacheResults = spectator.service.send(fakeQueryJson, true);

      expect(cacheResults).toBeNull();
    });

    it('prev result - not status 200', () => {
      const fakeQueryJson = getFakeQueryJson(null, true);
      const key = new Sha1().updateObjectToHex(fakeQueryJson);
      spectator.service.activeConnectionsMap.set(key, {
        connection: fakeConnection as any,
        results: {status: 500} as any,
      });

      const cacheResults = spectator.service.send(fakeQueryJson, true);

      expect(cacheResults).toBeNull();
    });

    it('prev result - status 200', () => {
      const fakeQueryJson = getFakeQueryJson(null, true);
      const key = new Sha1().updateObjectToHex(fakeQueryJson);
      spectator.service.activeConnectionsMap.set(key, {
        connection: fakeConnection as any,
        results: {status: 200} as any,
      });

      const cacheResults = spectator.service.send(fakeQueryJson, true);

      expect(cacheResults).toEqual({status: 200} as any);
    });

    it('no connection - throw error', () => {
      const fakeQueryJson = getFakeQueryJson(null, true);
      const key = new Sha1().updateObjectToHex(fakeQueryJson);
      spectator.service.activeConnectionsMap.set(key, {
        connection: null,
        results: null,
      });

      let throwError = false;
      try {
        spectator.service.send(fakeQueryJson, true);
        // eslint-disable-next-line
      } catch (e) {
        throwError = true;
      }
      // fail
      expect(throwError).toBeTrue();
    });
  });

  describe('closeConnection', () => {
    it('should clear all', () => {
      const fakeQueryJson = getFakeQueryJson(null, true);
      const key = new Sha1().updateObjectToHex(fakeQueryJson);
      spectator.service.activeConnectionsMap.set(key, {
        connection: fakeConnection as any,
        results: null,
      });

      spectator.service.closeConnection(fakeQueryJson);

      const connection = spectator.service.activeConnectionsMap.get(key);

      expect(connection).toBeUndefined();
    });
  });
});
