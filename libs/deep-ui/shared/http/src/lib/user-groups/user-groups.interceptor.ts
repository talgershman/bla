import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {DeepUtilService} from 'deep-ui/shared/core';
import {Observable} from 'rxjs';

@Injectable()
export class UserGroupsInterceptor implements HttpInterceptor {
  private deepUtilService = inject(DeepUtilService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const teams = this.deepUtilService.getCurrentUserTeams();
    const newRequest = request.clone({
      setHeaders: {
        'DEEP-GROUPS': teams,
      },
    });
    return next.handle(newRequest);
  }
}
