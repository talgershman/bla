import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {parseInteger} from '@mobileye/material/src/lib/utils';
import {PerfectListService} from 'deep-ui/shared/core';
import {Observable} from 'rxjs';
import {first} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EditPerfectListResolver {
  private perfectListService = inject(PerfectListService);

  /* eslint-disable */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const id = route.paramMap.get('id');
    const idNum = parseInteger(id);
    return this.perfectListService.getSingle(idNum, {}).pipe(first());
  }
  /* eslint-enable */
}
