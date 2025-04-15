import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {parseInteger} from '@mobileye/material/src/lib/utils';
import {MestService} from 'deep-ui/shared/core';
import {MEST} from 'deep-ui/shared/models';
import {Observable} from 'rxjs';
import {first, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EditMestResolver {
  private mestService = inject(MestService);

  /* eslint-disable */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const id = route.paramMap.get('id');
    const idNum = parseInteger(id);
    return this.mestService.getSingle(idNum, {}).pipe(
      map((response: MEST) => response),
      first(),
    );
  }
  /* eslint-enable */
}
