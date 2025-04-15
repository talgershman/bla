import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from '@angular/router';
import {Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CreateClipListResolver {
  private router = inject(Router);

  /* eslint-disable */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const navigation = this.router.getCurrentNavigation();
    const clipList = navigation?.extras.state?.clipList;
    const file = navigation?.extras.state?.file;
    const startTour = navigation?.extras.state?.startTour;
    return of({
      clipList,
      file,
      startTour,
    });
  }
  /* eslint-enable */
}
