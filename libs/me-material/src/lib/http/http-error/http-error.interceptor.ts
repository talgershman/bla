import {
  HttpClient,
  HttpContext,
  HttpContextToken,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpStatusCode,
} from '@angular/common/http';
import {Injectable, InjectionToken} from '@angular/core';
import {
  MeErrorHandlerService,
  MeErrorType,
} from '@mobileye/material/src/lib/services/error-handler';
import {Observable, of, timeout} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

export const IGNORE_HTTP_NO_RESPONSE = new HttpContextToken<boolean>(() => false);
export const IGNORE_HTTP_ERROR_RESPONSE = new HttpContextToken<boolean>(() => false);

export const ignoreHttpErrorNoResponse = (): HttpContext => {
  return new HttpContext().set(IGNORE_HTTP_NO_RESPONSE, true);
};

export const ignoreHttpErrorResponse = (): HttpContext => {
  return new HttpContext().set(IGNORE_HTTP_ERROR_RESPONSE, true);
};

export const ignoreHttpErrorAndNoResponse = (): HttpContext => {
  return new HttpContext().set(IGNORE_HTTP_ERROR_RESPONSE, true).set(IGNORE_HTTP_NO_RESPONSE, true);
};

export class MeHttpErrorInterceptorOptions {
  healthCheckUrl: string;
  onPremUrl: string;
  healthCheckEndPoint: string;
}

export const ME_HTTP_ERROR_INTERCEPTOR_OPTIONS = new InjectionToken<MeHttpErrorInterceptorOptions>(
  "MeHttpErrorInterceptor's options",
);

@Injectable()
export class MeHttpErrorInterceptor implements HttpInterceptor {
  private readonly HEALTH_CHECK_REQUEST_TIMEOUT = 10 * 1000; // 10 secs
  constructor(
    public options: MeHttpErrorInterceptorOptions,
    private http: HttpClient,
    private errorHandlerService: MeErrorHandlerService,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        return this.handleError(request, error);
      }),
    );
  }

  handleError(request: HttpRequest<unknown>, error: HttpErrorResponse): Observable<any> {
    if (request.url === this.options.healthCheckUrl) {
      return of(null);
    }

    if (this._ignoreToastFromStatues(error)) {
      throw error;
    }

    if (
      this.options?.healthCheckEndPoint &&
      request.url.includes(this.options.healthCheckEndPoint)
    ) {
      setTimeout(() => {
        this._sendHealthCheckRequest()
          .pipe(
            timeout(this.HEALTH_CHECK_REQUEST_TIMEOUT),
            catchError(() => of(null)),
            map((stateRefHttpResponse: HttpResponse<any>) => {
              if (stateRefHttpResponse === null) {
                return MeErrorType.AWS;
              }
              if (stateRefHttpResponse.status === HttpStatusCode.Ok) {
                if (this.options?.onPremUrl && request.url.includes(this.options.onPremUrl)) {
                  return MeErrorType.OnPremCertificate;
                }
                return MeErrorType.Default;
              }
              return MeErrorType.VPN;
            }),
            catchError(() => of(MeErrorType.VPN)),
          )
          .subscribe((errType: MeErrorType) =>
            this._raiseErrorOrThrowError(request, error, errType),
          );
      });
    }

    throw error;
  }

  private _sendHealthCheckRequest(): Observable<any> {
    const endPoint = this.options?.healthCheckUrl;
    return endPoint
      ? this.http.get(endPoint, {observe: 'response'})
      : of({status: HttpStatusCode.Ok});
  }

  private _isNoStatusResponse(error: HttpErrorResponse): boolean {
    return error?.message?.startsWith('Http failure response for') && error.status === 0;
  }

  private _raiseErrorOrThrowError(
    request: HttpRequest<unknown>,
    error: HttpErrorResponse,
    errorType: MeErrorType,
  ): void {
    if (
      request.context.get(IGNORE_HTTP_ERROR_RESPONSE) ||
      (request.context.get(IGNORE_HTTP_NO_RESPONSE) && this._isNoStatusResponse(error))
    ) {
      throw error;
    }
    if (!this._ignoreToastFromStatues(error)) {
      const body = JSON.stringify(error?.error, null, 2);
      this.errorHandlerService.raiseError({
        errorType,
        title: 'Error',
        status: error.status,
        request: error.url,
        message: error.message,
        response: body,
      });
    }
  }

  private _ignoreToastFromStatues(error: HttpErrorResponse): boolean {
    const knowErrorStatues = new Set([
      HttpStatusCode.NoContent,
      HttpStatusCode.Created,
      HttpStatusCode.Ok,
      HttpStatusCode.BadRequest,
    ]);

    return error.url && knowErrorStatues.has(error.status);
  }
}
