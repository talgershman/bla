import {HttpRequest} from '@angular/common/http';
import {createHttpFactory, SpectatorHttp} from '@ngneat/spectator';
import {ToastrService} from 'ngx-toastr';

import {MeTrimRequestBodyInterceptor} from './trim-request-body.interceptor';

describe('MeTrimRequestBodyInterceptor', () => {
  let spectator: SpectatorHttp<MeTrimRequestBodyInterceptor>;

  const createHttp = createHttpFactory({
    service: MeTrimRequestBodyInterceptor,
    mocks: [ToastrService],
  });

  beforeEach((): void => {
    spectator = createHttp();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('should remove white space from body object', () => {
    const request = new HttpRequest('POST', 'http://bla.com', {
      test: '  white_space    ',
      x: {
        a: true,
        b: '    nested_space    ',
      },
    });

    const trimRequest = spectator.service.handleRequest(request);

    expect(trimRequest.body).toEqual({
      test: 'white_space',
      x: {
        a: true,
        b: 'nested_space',
      },
    });
  });

  it('should ignore request if method GET', () => {
    const request = new HttpRequest('GET', 'http://bla.com');

    const trimRequest = spectator.service.handleRequest(request);

    expect(trimRequest).toEqual(request);
  });

  it('should ignore request if body formData', () => {
    const formData = new FormData();
    formData.append('key', 'value');
    const request = new HttpRequest('POST', 'http://bla.com', formData);

    const trimRequest = spectator.service.handleRequest(request);

    expect(trimRequest).toEqual(request);
  });
});
