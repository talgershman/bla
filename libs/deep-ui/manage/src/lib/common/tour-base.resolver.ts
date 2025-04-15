import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from '@angular/router';
import {Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TourBaseResolver {
  private router = inject(Router);

  /* eslint-disable */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const navigation = this.router.getCurrentNavigation();
    const startTour = navigation?.extras?.state?.startTour;
    return of({
      startTour,
    });
  }
  /* eslint-enable */
}
