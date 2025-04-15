import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

@Injectable()
export class MeTrimRequestBodyInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const trimRequest = this.handleRequest(request);
    return next.handle(trimRequest);
  }

  handleRequest(originalRequest: HttpRequest<unknown>): HttpRequest<unknown> {
    if (
      originalRequest.body &&
      !this._isRequestBodyFormData(originalRequest.body) &&
      (originalRequest.method === 'POST' ||
        originalRequest.method === 'PUT' ||
        originalRequest.method === 'PATCH')
    ) {
      const trimBody = this._trimBody(originalRequest.body);
      return originalRequest.clone({body: trimBody});
    }
    return originalRequest;
  }

  private _trimBody(obj: any): any {
    const replacer = (key, value): any => {
      if (typeof value === 'string') {
        return value.trim();
      }
      if (value === undefined) {
        // JSON doesn't have undefined
        return null;
      }
      return value;
    };

    return JSON.parse(JSON.stringify(obj, replacer));
  }

  private _isRequestBodyFormData(body: any): boolean {
    return body instanceof FormData;
  }
}
