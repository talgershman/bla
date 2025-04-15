import {
  HttpClient,
  HttpErrorResponse,
  HttpRequest,
  HttpResponse,
  HttpStatusCode,
} from '@angular/common/http';
import {fakeAsync, flush} from '@angular/core/testing';
import {
  MeErrorHandlerService,
  MeErrorType,
} from '@mobileye/material/src/lib/services/error-handler';
import {createHttpFactory, SpectatorHttp, SpyObject} from '@ngneat/spectator';
import {ToastrService} from 'ngx-toastr';
import {of} from 'rxjs';

import {
  IGNORE_HTTP_ERROR_RESPONSE,
  IGNORE_HTTP_NO_RESPONSE,
  MeHttpErrorInterceptor,
  MeHttpErrorInterceptorOptions,
} from './http-error.interceptor';

describe('MeHttpErrorInterceptor', () => {
  let spectator: SpectatorHttp<MeHttpErrorInterceptor>;
  let httpClient: SpyObject<HttpClient>;
  let handleErrorService: SpyObject<MeErrorHandlerService>;
  const request = new HttpRequest('GET', 'http://bla.com');
  const healthCheckResponseValid: Partial<HttpResponse<any>> = {
    status: HttpStatusCode.Ok,
  };
  const healthCheckResponseAwsError: Partial<HttpResponse<any>> = null;

  const createHttp = createHttpFactory({
    service: MeHttpErrorInterceptor,
    providers: [
      {
        provide: MeHttpErrorInterceptorOptions,
        useValue: {
          healthCheckUrl: `http://bla.com/health/`,
          healthCheckEndPoint: `.com`,
          onPremUrl: `bla.com/health/`,
        },
      },
    ],
    mocks: [ToastrService, MeErrorHandlerService, HttpClient],
  });

  beforeEach((): void => {
    spectator = createHttp();
    handleErrorService = spectator.inject(MeErrorHandlerService);
    httpClient = spectator.inject(HttpClient);
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('handle INTERNAL SERVER ERROR', fakeAsync(() => {
    httpClient.get.and.returnValue(of(healthCheckResponseValid));
    const error = new HttpErrorResponse({
      error: {
        message: 'Some error text',
      },
      status: HttpStatusCode.InternalServerError,
      url: 'www.bla.com',
    });

    try {
      spectator.service.handleError(request, error);
    } catch (_) {}
    flush();

    expect(handleErrorService.raiseError).toHaveBeenCalledWith(
      jasmine.objectContaining({
        errorType: MeErrorType.Default,
        title: 'Error',
        status: HttpStatusCode.InternalServerError,
        request: 'www.bla.com',
        message: 'Http failure response for www.bla.com: 500 undefined',
      }),
    );
  }));

  it('handle other not ok - UNAUTHORIZED', fakeAsync(() => {
    httpClient.get.and.returnValue(of(healthCheckResponseValid));
    const error = new HttpErrorResponse({
      error: {
        message: 'Some error text',
      },
      status: HttpStatusCode.Unauthorized,
      url: 'www.bla.com',
    });

    try {
      spectator.service.handleError(request, error);
    } catch (_) {}
    flush();

    expect(handleErrorService.raiseError).toHaveBeenCalledWith(
      jasmine.objectContaining({
        errorType: MeErrorType.Default,
        title: 'Error',
        status: HttpStatusCode.Unauthorized,
        request: 'www.bla.com',
        message: 'Http failure response for www.bla.com: 401 undefined',
      }),
    );
  }));

  it('handle BAD_REQUEST', fakeAsync(() => {
    httpClient.get.and.returnValue(of(healthCheckResponseValid));
    const error = new HttpErrorResponse({
      error: {
        message: 'Some error text',
      },
      status: HttpStatusCode.BadRequest,
      url: 'www.bla.com',
    });

    try {
      spectator.service.handleError(request, error);
    } catch (_) {}
    flush();

    expect(handleErrorService.raiseError).not.toHaveBeenCalled();
  }));

  it('handle ignore empty response error', fakeAsync(() => {
    httpClient.get.and.returnValue(of(healthCheckResponseValid));
    const errorRequest = new HttpRequest('GET', 'http://bla.com');
    errorRequest.context.set(IGNORE_HTTP_NO_RESPONSE, true);
    const error = new HttpErrorResponse({
      error: {
        message: 'Some error text',
      },
      status: HttpStatusCode.BadRequest,
      url: 'www.bla.com',
    });

    try {
      spectator.service.handleError(request, error);
    } catch (_) {}
    flush();

    expect(handleErrorService.raiseError).not.toHaveBeenCalled();
  }));

  it('handle ignore error', fakeAsync(() => {
    httpClient.get.and.returnValue(of(healthCheckResponseValid));
    const errorRequest = new HttpRequest('GET', 'http://bla.com');
    errorRequest.context.set(IGNORE_HTTP_ERROR_RESPONSE, true);
    const error = new HttpErrorResponse({
      error: {
        message: 'Some error text',
      },
      status: HttpStatusCode.BadRequest,
      url: 'www.bla.com',
    });

    try {
      spectator.service.handleError(request, error);
    } catch (_) {}
    flush();

    expect(handleErrorService.raiseError).not.toHaveBeenCalled();
  }));

  it('handle aws error', fakeAsync(() => {
    httpClient.get.and.returnValue(of(healthCheckResponseAwsError));
    const error = new HttpErrorResponse({
      error: {
        message: '',
      },
      status: 0,
      url: 'www.bla.com',
    });

    try {
      spectator.service.handleError(request, error);
    } catch (_) {}
    flush();

    expect(handleErrorService.raiseError).toHaveBeenCalledWith(
      jasmine.objectContaining({
        errorType: MeErrorType.AWS,
        title: 'Error',
        status: 0,
        request: 'www.bla.com',
        message: 'Http failure response for www.bla.com: 0 undefined',
      }),
    );
  }));

  it('handle VPN error', fakeAsync(() => {
    httpClient.get.and.returnValue(of({status: 300}));
    const error = new HttpErrorResponse({
      error: {
        message: 'Http failure response for',
      },
      status: 0,
      url: 'www.bla.com',
    });

    try {
      spectator.service.handleError(request, error);
    } catch (_) {}
    flush();

    expect(handleErrorService.raiseError).toHaveBeenCalledWith(
      jasmine.objectContaining({
        errorType: MeErrorType.VPN,
        title: 'Error',
        status: 0,
        request: 'www.bla.com',
        message: 'Http failure response for www.bla.com: 0 undefined',
      }),
    );
  }));
});
