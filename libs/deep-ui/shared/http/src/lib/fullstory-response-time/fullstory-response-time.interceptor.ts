import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import _some from 'lodash-es/some';
import {Observable, tap} from 'rxjs';

export const FS_RESPONSE_TIME_END_POINTS = [
  'launch/validate-user-params/',
  'job/ag-grid/',
  'perfect-transform-job/ag-grid/',
];

@Injectable()
export class FullStoryResponseTimeInterceptor implements HttpInterceptor {
  private fullStory = inject(FullStoryService);
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = request.url;
    const hasUrl = _some(FS_RESPONSE_TIME_END_POINTS, (endpoint: string) => url.includes(endpoint));
    if (hasUrl) {
      const started = Date.now();
      return next.handle(request).pipe(
        tap((event) => {
          if (event instanceof HttpResponse) {
            const elapsed = Date.now() - started;
            this.logToFullStory(url, elapsed, event.status);
          }
        }),
      );
    }
    return next.handle(request);
  }

  logToFullStory(url: string, elapsed: number, status: number): void {
    this.fullStory.trackEvent({
      name: `UI - Response time`,
      properties: {
        url,
        responseTime: elapsed,
        status,
      },
    });
  }
}
