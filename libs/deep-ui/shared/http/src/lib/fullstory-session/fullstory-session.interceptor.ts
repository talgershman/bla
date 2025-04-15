import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {FullStoryService} from '@mobileye/material/src/lib/services/fullstory';
import _some from 'lodash-es/some';
import {catchError, from, Observable, switchMap} from 'rxjs';

export const FS_ID_END_POINTS = ['launch/submit-job'];

@Injectable()
export class FullStorySessionInterceptor implements HttpInterceptor {
  private fullStory = inject(FullStoryService);
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = request.url;
    const sendFsId = _some(FS_ID_END_POINTS, (endPoint: string) => url.includes(endPoint));
    const sendSessionReplayUrl = url.includes('deep.mobileye');
    if (sendSessionReplayUrl && sendFsId) {
      const obs = from(this.fullStory.getCurrentSessionId());
      return obs.pipe(
        switchMap((sessionId: string) => {
          const modifiedReq = this.modifyRequest(request, sessionId);
          return next.handle(modifiedReq);
        }),
        catchError((error) => {
          console.error('Error in async function:', error);
          return next.handle(request);
        }),
      );
    } else {
      return next.handle(request);
    }
  }

  private modifyRequest(req: HttpRequest<any>, sessionId: string): HttpRequest<any> {
    // Implement logic to modify the request based on async function data (optional)
    return req.clone({setHeaders: {'FULLSTORY-ID': sessionId}}); // Example modification
  }
}
